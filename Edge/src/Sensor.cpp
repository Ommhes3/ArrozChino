#include "Sensor.h"

#include <Arduino_JSON.h>
#include <time.h>

Sensor::Sensor(
  String feederId,
  String deviceName,
  int dtPin,
  int sckPin,
  float calibrationFactor
) {
  this->feederId = feederId;
  this->deviceName = deviceName;
  this->dtPin = dtPin;
  this->sckPin = sckPin;
  this->calibrationFactor = calibrationFactor;
}

// ---------------- INICIO SENSOR ----------------

void Sensor::begin() {
  scale.begin(dtPin, sckPin);

  Serial.println("Inicializando sensor HX711...");
  delay(2000);

  scale.set_scale(calibrationFactor);

  /*
    IMPORTANTE:
    tare() pone la balanza en cero.
    Debe hacerse con el recipiente vacío o con la tara física ya definida.
    Si prendes la ESP32 con comida encima y haces tare(), esa comida quedará como cero.
  */
  scale.tare();

  Serial.println("Sensor HX711 listo.");
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

// ---------------- LECTURA DE PESO ----------------

float Sensor::readWeightGrams() {
  scale.set_scale(calibrationFactor);

  float weightGrams = scale.get_units(20); // promedio de 20 lecturas

  // Filtro para ruido cerca de cero
  if (weightGrams > -0.05 && weightGrams < 0.05) {
    weightGrams = 0;
  }

  // Evita enviar pesos negativos al backend
  if (weightGrams < 0) {
    weightGrams = 0;
  }

  return weightGrams;
}

float Sensor::readWeightKg() {
  float weightGrams = readWeightGrams();

  return weightGrams / 1000.0;
}

// ---------------- NIVEL DE COMIDA ----------------

float Sensor::calculateFoodLevel(float weightKg) {
  /*
    En este proyecto food_level representa la comida disponible.

    La capacidad máxima NO se calcula aquí porque cada feeder tiene
    su propio food_limit en el backend.
  */
  return weightKg;
}

// ---------------- JSON LECTURA ----------------

String Sensor::takeSingleSample() {
  float weightKg = readWeightKg();
  float foodLevel = calculateFoodLevel(weightKg);

  JSONVar sample;

  sample["feeder_id"] = feederId;
  sample["food_level"] = foodLevel;
  sample["weight"] = weightKg;
  sample["device_name"] = deviceName;
  sample["units"] = "kg";

  String takenAt = getISOTime();

  if (takenAt != "") {
    sample["taken_at"] = takenAt;
  }

  Serial.println("Lectura generada desde HX711:");
  Serial.print("Peso kg: ");
  Serial.println(weightKg, 3);
  Serial.print("Nivel comida kg: ");
  Serial.println(foodLevel, 3);

  return JSON.stringify(sample);
}