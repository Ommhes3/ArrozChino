#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <Arduino_JSON.h>
#include <PubSubClient.h>
#include <time.h>

// MQTT
const char* mqttServer = "broker.emqx.io";
const int mqttPort = 1883;
const char* clientName = "yrtinatgath";
const char* inboundTopic = "telematica/inbound";
const char* outboundTopic = "telematica/outbound";

// WiFi
const char* ssid = "LABREDES";
const char* password = "F0rmul4-1";

// URL servidor
String BASE_URL = "http://192.168.130.42:8000/";

// NTP (hora real)
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = -18000; // Colombia UTC-5
const int daylightOffset_sec = 0;

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

// ---------------- MQTT ----------------
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

// ---------------- WIFI ----------------
void connectToWifi(){
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
  }
}

// ---------------- HORA REAL ----------------
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
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  int httpResponseCode = http.POST(data);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Respuesta del servidor:");
    Serial.println(response);
  } else {
    Serial.println("Error de conexión:");
    Serial.println(http.errorToString(httpResponseCode));
  }

  http.end();
}

// ---------------- MUESTRA ----------------
String takeSingleSample(){
  float pesoKg = random(100, 500) / 100.0;
  int horaToma = millis() / 1000;

  JSONVar sample;
  sample["pesoKg"] = pesoKg;
  sample["horaToma"] = horaToma;
  sample["deviceName"] = "HX711";
  sample["units"] = "kg";

  return JSON.stringify(sample);
}

void sendSingleSample(){
  String json = takeSingleSample();
  Serial.println(json);

  String url = BASE_URL + "readings";
  POSTrequest(url, json);
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
}

// ---------------- SERIAL ----------------
void serialEvent() {
  if (Serial.available() > 0) {

    String data = Serial.readStringUntil('\n');

    if(data == "POSTSINGLE") {
      sendSingleSample();
    }
  }
}