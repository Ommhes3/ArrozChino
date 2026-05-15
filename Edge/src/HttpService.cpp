#include "HttpService.h"
#include <WiFi.h>
#include <HTTPClient.h>

HttpService::HttpService(String baseUrl) {
  this->baseUrl = baseUrl;
}

bool HttpService::postJson(String endpoint, String data) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("No hay WiFi. No se puede hacer POST.");
    return false;
  }

  HTTPClient http;

  String url = baseUrl + endpoint;

  http.begin(url.c_str());
  http.addHeader("Content-Type", "application/json");

  int httpResponseCode = http.POST(data);

  if (httpResponseCode >= 200 && httpResponseCode < 300) {
    String responseBody = http.getString();

    Serial.println("Respuesta del servidor:");
    Serial.println(responseBody);

    http.end();
    return true;
  }

  Serial.println("Error HTTP:");
  Serial.println(httpResponseCode);
  Serial.println(http.errorToString(httpResponseCode));

  http.end();
  return false;
}

bool HttpService::postReading(String json) {
  return postJson("readings", json);
}

bool HttpService::postReadingsBatch(String batchJson) {
  return postJson("readings/batch", batchJson);
}