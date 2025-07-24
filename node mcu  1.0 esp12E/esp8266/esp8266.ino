#include <ESP8266WiFi.h>

const char* ssid = "ESP8266_AP";
const char* password = "12345678";

WiFiServer server(80);

// We're now using analog sensing (voltage divider with 2 FSRs)
const int fsrPin = A0;  // Analog pin for voltage divider output

void setup() {
  Serial.begin(9600);
  Serial.println();

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

  // Read analog value from voltage divider connected to two parallel FSRs
  int analogValue = analogRead(fsrPin);

  // Debug: Show the analog reading
  Serial.print("Analog Read: ");
  Serial.println(analogValue);

  // Adjust this threshold based on your experimental values
  int output = (analogValue > 300) ? 1 : 0;  // 1 if both pressed, else 0

  // Debug output
  Serial.print("Output Value: ");
  Serial.println(output);

  // Send HTTP response
  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: text/plain");
  client.println("Access-Control-Allow-Origin: *");
  client.println("Connection: close");
  client.println();
  client.println(output);

  delay(1);
  Serial.println("Client disconnected.");
  Serial.println("------------------------");
}



