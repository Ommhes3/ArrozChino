#include "MqttManager.h"

MqttManager* MqttManager::instance = nullptr;

MqttManager::MqttManager(
  const char* server,
  int port,
  const char* client,
  const char* inbound,
  const char* outbound
)
  : mqttClient(wifiClient)
{
  mqttServer = server;
  mqttPort = port;
  clientName = client;
  inboundTopic = inbound;
  outboundTopic = outbound;

  instance = this;
}

void MqttManager::begin() {
  mqttClient.setServer(mqttServer, mqttPort);
  mqttClient.setCallback(staticCallback);
  keepAlive();
}

void MqttManager::loop() {
  mqttClient.loop();
  keepAlive();
}

void MqttManager::keepAlive() {
  if (mqttClient.connected()) {
    return;
  }

  unsigned long now = millis();

  if (now - lastReconnectAttempt >= reconnectInterval) {
    lastReconnectAttempt = now;

    Serial.println("Intentando conectar MQTT...");

    if (mqttClient.connect(clientName)) {
      Serial.println("MQTT conectado");
      mqttClient.subscribe(inboundTopic);
    } else {
      Serial.println("Fallo conexion MQTT");
    }
  }
}

void MqttManager::publishMessage(String message) {
  if (mqttClient.connected()) {
    mqttClient.publish(outboundTopic, message.c_str());
  }
}

void MqttManager::setCommandCallback(CommandCallback callback) {
  commandCallback = callback;
}

void MqttManager::staticCallback(char* topic, byte* payload, unsigned int length) {
  String message = "";

  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.print("Comando MQTT recibido: " + String(message));

  if (instance != nullptr && instance->commandCallback != nullptr) {
    instance->commandCallback(message);
  }
}