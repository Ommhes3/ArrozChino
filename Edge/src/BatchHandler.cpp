#include "BatchHandler.h"

BatchHandler::BatchHandler(HttpService& httpService) {
  this->httpService = &httpService;
}

void BatchHandler::saveSample(String json) {
  if (batchCount < MAX_BATCH) {
    offlineBatch[batchCount] = json;
    batchCount++;

    Serial.print("Muestra guardada en batch offline. Total: ");
    Serial.println(batchCount);
  } else {
    Serial.println("Batch offline lleno. No se pudo guardar la muestra.");
  }
}

bool BatchHandler::sendBatch() {
  if (batchCount == 0) {
    return true;
  }

  String batchJson = "[";

  for (int i = 0; i < batchCount; i++) {
    batchJson += offlineBatch[i];

    if (i < batchCount - 1) {
      batchJson += ",";
    }
  }

  batchJson += "]";

  Serial.println("Enviando batch offline:");
  Serial.println(batchJson);

  bool sent = httpService->postReadingsBatch(batchJson);

  if (sent) {
    Serial.println("Batch offline enviado correctamente.");
    clear();
    return true;
  }

  Serial.println("No se pudo enviar el batch offline.");
  return false;
}

int BatchHandler::getCount() {
  return batchCount;
}

bool BatchHandler::hasSamples() {
  return batchCount > 0;
}

void BatchHandler::clear() {
  for (int i = 0; i < batchCount; i++) {
    offlineBatch[i] = "";
  }

  batchCount = 0;
}