#include "Dispenser.h"

Dispenser::Dispenser(int pin, float defaultAmount) {
    this->pin = pin;
    this->defaultAmount = defaultAmount;
}

void Dispenser::begin() {
    Serial.println("\nBienvenidx al dispensador simulado.\n");

    // pinMode(pin, OUTPUT);
    // digitalWrite(pin, LOW);
}

unsigned long Dispenser::calculateActivationTime(float amount) {
    // Conversión temporal:
    // amount puede representar gramos o porciones.
    // Luego se calibra según el motor, servo o mecanismo real.

    if (amount <= 0) {
        amount = defaultAmount;
    }

    // 10 gramos equivalen a 1 segundo (SUJETO A CAMBIOS SEGUN CALIBRACION REAL)
    unsigned long activationTime = (amount / 10.0) * 1000;

    if (activationTime < 500) {
        activationTime = 500;
    }

    return activationTime;
}

String Dispenser::activateDefault() {
    Serial.println("Activando dispensador con cantidad predeterminada.\n");
    return activateAmount(defaultAmount);
}

String Dispenser::activateAmount(float amount) {

    if (amount <= 0) {
        return "Cantidad invalida. No se activo el dispensador.";
    }

    unsigned long activationTime = calculateActivationTime(amount);


    Serial.println("Activando dispensador...");

    // COmo es simulacion, solo imprime la cantidad y el tiempo de activación.
    Serial.println(" Cantidad: " + String(amount));
    Serial.println("Tiempo de activacion: " + String(activationTime) + " ms");

    //digitalWrite(pin, HIGH);
    delay(activationTime);
    //digitalWrite(pin, LOW);

    Serial.println("Dispensador desactivado.");


    String message = "Dispensador activado. Cantidad: ";
    message += String(amount);
    message += " unidades. Tiempo dispensando: ";
    message += String(activationTime);
    message += " ms.";

    return message;
}