#include <ESP8266WiFi.h>

const char* ssid = "ESP8266_AP";
const char* password = "12345678";

WiFiServer server(80);

const int touchSensor1 = D0;
const int touchSensor2 = D1;

void setup() {
  Serial.begin(115200);
  Serial.println();
  
  pinMode(touchSensor1, INPUT);
  pinMode(touchSensor2, INPUT);
  
  IPAddress local_ip(192, 168, 4, 1);      
  IPAddress gateway(192, 168, 4, 1);      
  IPAddress subnet(255, 255, 255, 0);      
  
  WiFi.softAPConfig(local_ip, gateway, subnet);
  
  Serial.println("Configuring access point...");
  WiFi.softAP(ssid, password);
  
  Serial.print("Access Point IP Address: ");
  Serial.println(local_ip);
  
  server.begin();
  Serial.println("Web server started.");
}

void loop() {
  WiFiClient client = server.available();
  if (!client) {
    return;
  }
  
  Serial.println("New client connected.");
  while (!client.available()) {
    delay(1);
  }
  
  String request = client.readStringUntil('\r');
  Serial.println(request);
  client.flush();
  
  int sensor1State = digitalRead(touchSensor1);
  int sensor2State = digitalRead(touchSensor2);
  
  // Debug output for sensor states
  Serial.print("Sensor 1 State: ");
  Serial.println(sensor1State);
  Serial.print("Sensor 2 State: ");
  Serial.println(sensor2State);
  
  int output = (sensor1State == HIGH && sensor2State == HIGH) ? 1 : 0;
  
  // Debug output for final output
  Serial.print("Output Value: ");
  Serial.println(output);
  
  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: text/plain");
  client.println("Access-Control-Allow-Origin: *");
  client.println("Connection: close");
  client.println();
  client.println(output);
  
  delay(1);
  Serial.println("Client disconnected.");
  Serial.println("------------------------");  // Separator for readability
}