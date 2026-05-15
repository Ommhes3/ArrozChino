#ifndef SENSOR_H
#define SENSOR_H

#include <Arduino.h>

class Sensor {
  private:
    String feederId;
    String deviceName;

    String getISOTime();

  public:
    Sensor(String feederId, String deviceName);

    float readWeightKg();
    float calculateFoodLevel(float weightKg);
    String takeSingleSample();
};

#endif