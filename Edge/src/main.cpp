#include <Arduino.h>
#include <WiFi.h>
#include <time.h>

#include "MqttManager.h"
#include "HttpService.h"
#include "Sensor.h"
#include "Dispenser.h"
#include "BatchHandler.h"

// ---------------- MQTT ----------------

// Configuracion de MQTT. Cambiar segun corresponda.
const char* mqttServer = "broker.emqx.io";
const int mqttPort = 1883;
const char* clientName = "feeder-demo-esp32-01";
const char* inboundTopic = "ArrozChino/inbound";
const char* outboundTopic = "ArrozChino/outbound";

// ---------------- WIFI ----------------

// Cambiar valores segun corresponda
const char* ssid = "FAMILIA SERRATO";
const char* password = "L2109C18D18F";

// ---------------- API ----------------

String BASE_URL = "http://192.168.20.29:8000/";

// ---------------- FEEDER ----------------

const char* feederId = "feeder-demo";
const char* deviceName = "esp32";

const int dispenserPin = 26;  // Pin GPIO para el dispensador. Cambiar segun corresponda.
const float defaultFoodAmount = 1.0;  // Cantidad default a dispensar (puede ser kilogramos o porciones, segun corresponda)

// ---------------- NTP server para hora real ----------------

const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = -18000;
const int daylightOffset_sec = 0;

// ---------------- SERVICIOS ----------------

MqttManager mqttManager(
  mqttServer,
  mqttPort,
  clientName,
  inboundTopic,
  outboundTopic
);

HttpService httpService(BASE_URL);

Sensor sensor(
  feederId,
  deviceName
);

Dispenser dispenser(
  dispenserPin,
  defaultFoodAmount
);

BatchHandler batchHandler(httpService);

// ---------------- TIEMPO MUESTREO ----------------

unsigned long lastSampleTime = 0;
const unsigned long interval = 15000; // 2 minutos en ms es 120000 ms, el 5000 es para pruebas cada 5 segundos

// ---------------- WIFI RECONNECT ----------------

unsigned long lastWifiReconnectAttempt = 0;
const unsigned long wifiReconnectInterval = 5000;

unsigned long wifiDisconnectedSince = 0;
const unsigned long wifiAlertThreshold = 60000; // 1 minuto para pruebas. Para producción puede ser 5 o 10 minutos.

bool wifiAlertSent = false;
bool wasWifiDisconnected = false;


// ---------------- WIFI ----------------

void connectToWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.println("Conectandose al WiFi");

  unsigned long startAttemptTime = millis();
  const unsigned long wifiTimeout = 15000;

  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < wifiTimeout) {
    Serial.print(".");
    delay(1000);
  }

  // La ESP32 inicialmente puede arrancar sin WiFi, en ese caso comienza a guardar lecturas localmente en el batch hasta que se conecte.
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("");
    Serial.println("Conectado exitosamente, YUMMY!");
    Serial.println(WiFi.localIP());

    wifiDisconnectedSince = 0;
    wifiAlertSent = false;
    wasWifiDisconnected = false;
  } else {
    Serial.println("");
    Serial.println("No se pudo conectar al WiFi. Continuando en modo offline.");
    wasWifiDisconnected = true;
  }
}

void handleWifiConnection() {
  if (WiFi.status() == WL_CONNECTED) {
    wifiDisconnectedSince = 0;
    wifiAlertSent = false;

    // manejo de reconexion: si antes estaba desconectado, intento enviar el batch pendiente (si es que hay muestras guardadas)
    if (wasWifiDisconnected && batchHandler.hasSamples()) {
      Serial.println("WiFi reconectado. Enviando batch pendiente...");
      batchHandler.sendBatch();
    }

    wasWifiDisconnected = false;

    return;
  }

  wasWifiDisconnected = true;

  unsigned long now = millis();

  if (wifiDisconnectedSince == 0) {
    wifiDisconnectedSince = now;
  }

  if (now - lastWifiReconnectAttempt >= wifiReconnectInterval) {
    lastWifiReconnectAttempt = now;

    Serial.println("WiFi desconectado. Intentando reconectar...");
    WiFi.disconnect();
    WiFi.begin(ssid, password);
  }

  if (!wifiAlertSent && now - wifiDisconnectedSince >= wifiAlertThreshold) {
    wifiAlertSent = true;

    Serial.println("ALERTA: ESP32 lleva demasiado tiempo sin WiFi.");

    // Aquí luego guardar un evento local para reportarlo después.
  }
}

// ---------------- BATCH RETRY ----------------

unsigned long lastBatchRetryAttempt = 0;
const unsigned long batchRetryInterval = 10000; // Reintenta cada 10 segundos

// Manejar el reintento del batch si hay muestras pendientes y el WiFi está conectado. 
void handleBatchRetry() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  if (!batchHandler.hasSamples()) {
    return;
  }

  unsigned long now = millis();

  if (now - lastBatchRetryAttempt >= batchRetryInterval) {
    lastBatchRetryAttempt = now;

    Serial.println("Hay batch pendiente. Reintentando envio...");
    batchHandler.sendBatch();
  }
}

// ---------------- ENVIO MUESTRAS ----------------

bool sendSingleSample() {
  String json = sensor.takeSingleSample();

  Serial.println("Enviando muestra:");
  Serial.println(json);

  bool sent = httpService.postReading(json);

  if (!sent) {
    batchHandler.saveSample(json);
  }

  return sent;
}

void asyncSampleSender() {
  unsigned long currentMillis = millis();

  if (currentMillis - lastSampleTime >= interval) {
    lastSampleTime = currentMillis;
    sendSingleSample();
  }
}


// ---------------- MQTT COMMANDS ----------------

void handleMqttCommand(String command) {
  if (command == "sayhello") {
    mqttManager.publishMessage("ESP32 listo uwu");
  }

  else if (command == "POSTSINGLE") {
    String json = sensor.takeSingleSample();

    Serial.println("Lectura forzada por MQTT:");
    Serial.println(json);

    bool sent = httpService.postReading(json);

    if (!sent) {
      batchHandler.saveSample(json);
    }

    mqttManager.publishMessage(json);
  }

  else if (command == "SEND_BATCH") {
    batchHandler.sendBatch();
    mqttManager.publishMessage("Intentando enviar batch offline");
  }

  else if (command == "STATUS") {
    mqttManager.publishMessage("ESP32 activa\n");
  }

  else if (command == "DISPENSE_DEFAULT") {
    String res = dispenser.activateDefault();
    mqttManager.publishMessage(res);
  }

  else if (command.startsWith("DISPENSE:")) {
    String amountStr = command.substring(9);
    float amount = amountStr.toFloat();

    if (amount <= 0) {
      mqttManager.publishMessage("Cantidad invalida para dispensar");
      return;
    }

    String res = dispenser.activateAmount(amount);
    mqttManager.publishMessage(res);
  }

  else {
    mqttManager.publishMessage("Comando no reconocido");
  }
}

// ---------------- SETUP ----------------

void setup() {
  Serial.begin(115200);

  dispenser.begin();

  connectToWifi();

  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  mqttManager.setCommandCallback(handleMqttCommand);
  mqttManager.begin();
}

// ---------------- LOOP ----------------

void loop() {
  handleWifiConnection();

  if (WiFi.status() == WL_CONNECTED) {
    mqttManager.loop();
  }

  asyncSampleSender();

  handleBatchRetry();
}

// ---------------- SERIAL ----------------

void serialEvent() {
  if (Serial.available() > 0) {
    String data = Serial.readStringUntil('\n');
    data.trim();

    Serial.println(data);

    if (data == "POSTSINGLE") {
      sendSingleSample();
    }

    else if (data == "SEND_BATCH") {
      batchHandler.sendBatch();
    }

    else if (data == "STATUS") {
      Serial.println("ESP32 activa\n");
    }

    else if (data == "DISPENSE_DEFAULT") {
      String res = dispenser.activateDefault();
      mqttManager.publishMessage(res);
    }

    else if (data.startsWith("DISPENSE:")) {   //DISPENSE:XX, donde XX es la cantidad a dispensar
      String amountStr = data.substring(9);
      float amount = amountStr.toFloat();

      if (amount <= 0) {
        mqttManager.publishMessage("Cantidad invalida para dispensar");
        return;
      }

      String res = dispenser.activateAmount(amount);
      mqttManager.publishMessage(res);
    }
  }
}