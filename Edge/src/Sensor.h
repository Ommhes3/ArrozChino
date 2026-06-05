#ifndef SENSOR_H
#define SENSOR_H

#include <Arduino.h>
#include "HX711.h"

class Sensor {
  private:
    String feederId;
    String deviceName;

    int dtPin;
    int sckPin;

    float calibrationFactor;

    HX711 scale;

    String getISOTime();

  public:
    Sensor(
      String feederId,
      String deviceName,
      int dtPin,
      int sckPin,
      float calibrationFactor
    );

    void begin();

    float readWeightGrams();
    float readWeightKg();

    float calculateFoodLevel(float weightKg);

    String takeSingleSample();
};

#endif