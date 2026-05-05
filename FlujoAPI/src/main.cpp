#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <Arduino_JSON.h>
#include <PubSubClient.h>
#include <time.h>

// MQTT
const char* mqttServer = "broker.emqx.io";
const int mqttPort = 1883;
const char* clientName = "abecedeHIHIHI";
const char* inboundTopic = "telematica/inbound";
const char* outboundTopic = "telematica/outbound";

// WiFi
const char* ssid = "LABREDES";
const char* password = "F0rmul4-1";

// URL servidor
String BASE_URL = "http://192.168.130.40:8000/";

// servidor NTP (hora real)
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = -18000; // Colombia UTC-5
const int daylightOffset_sec = 0;

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);



// ---------------- WIFI SETUP----------------
void connectToWifi(){
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.println("Conectandose al WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    Serial.print('.');
    delay(1000);
  }

  Serial.println("Connectado exitosamente, YUMMY!");
  Serial.println(WiFi.localIP());
}


// ---------------- MQTT ----------------
// dejo esto porque lo podemos necesitar al momento de realizar alguna donacion, 
// sin embargo ahora no tiene ninguna funcionalidad
void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  if(message == "sayhello"){
    mqttClient.publish(outboundTopic, "ESP32 listo uwu");
  }
}

void keepAlive(){
  if (!mqttClient.connected()) {
    while (!mqttClient.connected()) {
      if (mqttClient.connect(clientName)) {
        mqttClient.subscribe(inboundTopic);
      } else {
        delay(5000);
      }
    }
  }
}

void connectToBroker(){
  mqttClient.setServer(mqttServer, mqttPort);
  mqttClient.setCallback(callback);
  keepAlive();
}

// ---------------- FUNCIONES MUESTREO ----------------


// ---------------- TIEMPO MUESTREO ----------------

// Definimos estas variables para controlar el tiempo entre muestras, 
// esto es para implementar el muestreo asincrono cada intervalo de tiempo

unsigned long lastSampleTime = 0; 
const unsigned long interval = 5000; // 2 minutos en ms es 120000 ms, el 5000 es para pruebas cada 5 segundos


// ---------------- HORA REAL ----------------

//  Esta función obtiene la hora actual del sistema utilizando el protocolo NTP.

String getHoraActual() {
  struct tm timeinfo;
  if(!getLocalTime(&timeinfo)){
    return "sin_hora";
  }

  char buffer[20];
  strftime(buffer, sizeof(buffer), "%H:%M:%S", &timeinfo);
  return String(buffer);
}



// ---------------- HTTP ----------------
void POSTrequest(String url, String data) {
  HTTPClient http;
  http.begin(url.c_str());

  http.addHeader("Content-Type", "application/json");

  int httpResponseCode = http.POST(data);

  if (httpResponseCode == 200) {
    String responseBody = http.getString();

    Serial.println("Respuesta del servidor:");
    Serial.println(responseBody);
  } else {
    Serial.println("Error de conexion HTTP:");
    Serial.println(http.errorToString(httpResponseCode));
  }

  http.end();
}


// ---------------- TOMA MUESTRA UNICA ----------------
String takeSingleSample(){
  float pesoKg = random(100, 500) / 100.0;
  String horaToma = getHoraActual();

  JSONVar sample;
  sample["pesoKg"] = pesoKg;
  sample["horaToma"] = horaToma;
  sample["deviceName"] = "HX711";
  sample["units"] = "kg";

  return JSON.stringify(sample);
}


void sendSingleSample(){
  String json = takeSingleSample();
  Serial.println("Enviando muestra:");
  Serial.println(json);

  String url = BASE_URL + "readings";
  POSTrequest(url, json);
}

// ---------------- ENVIO ASINCRONO ----------------
void asyncSampleSender() {
  unsigned long currentMillis = millis();

  if (currentMillis - lastSampleTime >= interval) {
    lastSampleTime = currentMillis;
    sendSingleSample();
  }
}


// ---------------- SETUP ----------------
void setup() {
  Serial.begin(115200);

  connectToWifi();
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer); //  hora real
  connectToBroker();
}


// ---------------- LOOP ----------------
void loop() {
  mqttClient.loop();
  keepAlive();

  // implementacion algortimo muestreo asincrono
  // ponerle las restricciones necesarias para tener en cuenta que esté conectado al wifi y eso
  asyncSampleSender();
}


// ---------------- SERIAL ----------------
void serialEvent() {
  if (Serial.available() > 0) {

    String data = Serial.readStringUntil('\n');
    Serial.println(data);

    if(data == "POSTSINGLE") {
      sendSingleSample();
    }
  }
}