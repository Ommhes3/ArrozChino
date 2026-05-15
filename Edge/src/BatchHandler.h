#ifndef BATCH_HANDLER_H
#define BATCH_HANDLER_H

#include <Arduino.h>
#include "HttpService.h"

class BatchHandler {
  private:
    static const int MAX_BATCH = 50;

    String offlineBatch[MAX_BATCH];
    int batchCount = 0;

    HttpService* httpService;

  public:
    BatchHandler(HttpService& httpService);

    void saveSample(String json);
    bool sendBatch();

    int getCount();
    bool hasSamples();
    void clear();
};

#endif