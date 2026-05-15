#ifndef HTTP_SERVICE_H
#define HTTP_SERVICE_H

#include <Arduino.h>

class HttpService {
  private:
    String baseUrl;

  public:
    HttpService(String baseUrl);

    bool postJson(String endpoint, String data);
    bool postReading(String json);
    bool postReadingsBatch(String batchJson);
};

#endif