#include "Sensor.h"

#include <Arduino_JSON.h>
#include <time.h>

Sensor::Sensor(String feederId, String deviceName) {
  this->feederId = feederId;
  this->deviceName = deviceName;
}

// ---------------- HORA REAL ----------------
String Sensor::getISOTime() {
  struct tm timeinfo;

  if (!getLocalTime(&timeinfo)) {
    return "";
  }

  char buffer[25];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%S", &timeinfo);

  return String(buffer);
}

// ---------------- SENSOR ----------------
float Sensor::readWeightKg() {
  // Simulación del peso total disponible en el recipiente
  // Genera valores entre 1.00 kg y 5.00 kg como por ahora
  return random(100, 501) / 100.0;
}

float Sensor::calculateFoodLevel(float weightKg) {
  // Por ahora usamos el peso como nivel de comida.
  // Luego se calibra esta formula segun el recipiente.
  return weightKg;
}


// ---------------- JSON LECTURA ----------------
String Sensor::takeSingleSample() {
  float weight = readWeightKg();
  float foodLevel = calculateFoodLevel(weight);

  JSONVar sample;

  sample["feeder_id"] = feederId;
  sample["food_level"] = foodLevel;
  sample["weight"] = weight;
  sample["device_name"] = deviceName;
  sample["units"] = "kg";

  String takenAt = getISOTime();

  if (takenAt != "") {
    sample["taken_at"] = takenAt;
  }

  return JSON.stringify(sample);
}