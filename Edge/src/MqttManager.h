#ifndef MQTT_MANAGER_H
#define MQTT_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>

typedef void (*CommandCallback)(String command);

class MqttManager {
  private:
    WiFiClient wifiClient;
    PubSubClient mqttClient;

    const char* mqttServer;
    int mqttPort;
    const char* clientName;
    const char* inboundTopic;
    const char* outboundTopic;

    unsigned long lastReconnectAttempt = 0;
    const unsigned long reconnectInterval = 5000;

    CommandCallback commandCallback = nullptr;

    static MqttManager* instance;
    static void staticCallback(char* topic, byte* payload, unsigned int length);

  public:
    MqttManager(
      const char* server,
      int port,
      const char* client,
      const char* inbound,
      const char* outbound
    );

    void begin();
    void loop();
    void keepAlive();
    void publishMessage(String message);
    void setCommandCallback(CommandCallback callback);
};

#endif