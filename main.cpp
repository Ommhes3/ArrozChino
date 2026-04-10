#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <Arduino_JSON.h>
#include <PubSubClient.h>

// MQTT 


const char* mqttServer = "broker.emqx.io"; // dominio del broker o ip del server
const int mqttPort = 1883;   // puerto que funciona para mqtt
const char* clientName = "yrtinatgath";  // usuario unico
const char* inboundTopic = "telematica/inbound"; // configuracion del topic
const char* outboundTopic = "telematica/outbound"; // topic para enviar mensajes

// uptime
unsigned long firstOn = 0; // variable para guardar el tiempo de encendido del dispositivo

// uptime2
time_t start_time = time(nullptr); // tiempo de inicio del programa

bool firstMqttConnection = false;


WiFiClient wifiClient; 
PubSubClient mqttClient(wifiClient);

// callback para recibir mensajes del mqtt
void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println("Recibido: " + message);
  
  if(message == "sayhello"){
    mqttClient.publish(outboundTopic, "Hello from (Chayotes rellenos)! ready for your service.", 1);

  } else if(message == "uptime"){
    unsigned long uptimeNow = (millis() - firstOn) / 1000; // tiempo actual menos el tiempo que inicio el server
    String msg = ("(Chayotes rellenos) El servidor lleva encendido " + String(uptimeNow) + " segundos").c_str();
    mqttClient.publish(outboundTopic, msg.c_str());
    
  } else if(message == "ip") {
    String ip = WiFi.localIP().toString();
    String msg = ("(Chayotes rellenos) IP asignada: " + ip).c_str();
    mqttClient.publish(outboundTopic, msg.c_str());

  } else if(message == "rssi") {
    long rssi = WiFi.RSSI();
    String msg = ("(Chayotes rellenos) Intensidad de señal: " + String(rssi) + " dBm").c_str();
    mqttClient.publish(outboundTopic, msg.c_str());

  } else if(message == "mac") {
    String mac = WiFi.macAddress();
    String msg = ("(Chayotes rellenos) Dirección MAC del ESP32: " + mac).c_str();
    mqttClient.publish(outboundTopic, msg.c_str());
  }
}


// Fuerza la conexion al mqtt, si no esta conectado, intenta cada 5 s. es una forever task

void keepAlive(){
  if (!mqttClient.connected()) {
    Serial.println("Reconectando");
    // Intenta conectarse al servidor MQTT
    while (!mqttClient.connected()) {
      Serial.println("Intentando conectar al servidor MQTT...");
      if (mqttClient.connect(clientName)) {
        Serial.println("Conectado al servidor MQTT!");
      } else {
        Serial.print("Error al conectar: ");
        Serial.println(mqttClient.state());
        delay(5000);
      }
    }
    mqttClient.subscribe(inboundTopic); // suscribirse al topic
    Serial.println("Suscrito al topic: " + String(inboundTopic));
  }
}


// 

void connectToBroker(){
  mqttClient.setServer(mqttServer, mqttPort);
  mqttClient.setCallback(callback);

  // verfiica que este conectado, sino intenta reconectar cada 5 segundos
  keepAlive();
  firstMqttConnection = true;

  firstOn = millis(); // guarda el tiempo de encendido del dispositivo (uptime)

  // start_time = time(nullptr); // guarda el tiempo de inicio del programa (uptime2)
}


// const char* ssid = "PUBLICA";
// const char* password = ""; 

const char* ssid = "LABREDES";
const char* password = "F0rmul4-1"; 

// url capa 7 + IP del servidor
String BASE_URL = "http://54.227.168.241:8000/";

void GETrequest() {
  HTTPClient http;
  http.begin(BASE_URL.c_str());  // TCP handshake
  int httpResponseCode = http.GET();   // Http request

  if(httpResponseCode == 200) {
    String responseBody = http.getString();
    Serial.println(responseBody);
  } else {
    Serial.println("Error al conectar HTTP");
  }
}

void POSTrequest(String url, String data) {
  HTTPClient http;
  http.begin(url.c_str());  // TCP handshake

  http.addHeader("Content-Type", "application/json"); // header para json

  int httpResponseCode = http.POST(data);   // Http request

  if(httpResponseCode == 200) {
    String responseBody = http.getString();
    Serial.println(responseBody);
  } else {
    Serial.println("Error al conectar HTTP");
  }
}


void connectToWifi(){
  WiFi.mode(WIFI_STA); // dhcp
  WiFi.begin(ssid, password);
  Serial.print("Conectandose al WiFi");

  // Revisa el status en bucle hasta que el wifi esté conectado
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print('.');
    delay(1000);
  }

  Serial.println("Connected!!");
  Serial.println(WiFi.localIP()); // da la ip dada
}

// muestras

String takeSingleSample(){
  int value = random(0, 1024); //Lectura de ADC 10-bit
  int timestamp = millis(); //revela hace cuenta el ESP32 esta prendido UPTIME
  String deviceName = "Hx711";
  String units = "ADC";
  JSONVar sample; //{}
  sample["value"]  = value;
  sample["timestamp"]  = timestamp;
  sample["deviceName"]  = deviceName;
  sample["units"]  = units;
  return JSON.stringify(sample);
}

void sendSingleSample(){
  String json = takeSingleSample();
  Serial.println(json);
  String url = BASE_URL + "readings";
  
  POSTrequest(url, json);
}

String takeFullSample(){
  // estoy tomando una muestra de 2 segundos
  // e fenomeno tiene hasta 25Hzmaximo, osea 50 muestras por segundo por nyquist

  // array json
  JSONVar readings; //[] array vacio

  for(int i=0 ; i<100 ; i++){

    long tic =millis();
    // toca crear un JSONVar para cada muestra, luego eso entra en un array de JSON 
    JSONVar reading; //{}


    int value = random(0, 1024); //Lectura de ADC 10-bit
    int timestamp = millis();
    String deviceName = "Tinkerbell";
    String units = "ADC";

    reading["value"]  = value; // el json se va llenando con estos elementos
    reading["timestamp"]  = timestamp;  
    reading["deviceName"]  = deviceName;
    reading["units"]  = units;

    readings[i] = reading; // añade el reading al array de readings

    long toc = millis() - tic; // lo que tarda el algoritmo

    delay(20 - toc); // delay para tomar la siguiente muestra { 1000ms / 50 Hz } - tiempo del algoritmo

  }

  return JSON.stringify(readings);

}


void sendFullSample(){
  String json = takeFullSample();
  Serial.println(json);
  String url = BASE_URL + "readings/batch"; // batch -> como q' la lista
  
  POSTrequest(url, json);
}


void setup() {
  Serial.begin(115200); // baudios en este caso

  // que se conecte por defecto al wifi y al mqtt
  connectToWifi();
  connectToBroker();
}

void loop() {
  if(firstMqttConnection) {
    mqttClient.loop(); // mantiene la conexion al mqtt, revisa si hay mensajes nuevos
    keepAlive(); // revisa que este conectado al mqtt, sino intenta reconectar cada 5 segundos  
  }
  
}

void serialEvent() {
  if (Serial.available() > 0) {

    String data = Serial.readStringUntil('\n');
    Serial.println(data);

    if(data == "get") {
      GETrequest();

    } else if(data == "POSTSINGLE") {
      sendSingleSample();
    } else if(data == "POSTFULL") {
      takeFullSample(); 
    }
  }
}