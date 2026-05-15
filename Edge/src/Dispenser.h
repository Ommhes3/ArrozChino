#ifndef DISPENSER_H
#define DISPENSER_H

#include <Arduino.h>

class Dispenser {
  private:
    int pin;
    float defaultAmount;

    unsigned long calculateActivationTime(float amount);

  public:
    Dispenser(int pin, float defaultAmount);

    void begin();
    String activateDefault();
    String activateAmount(float amount);
};

#endif