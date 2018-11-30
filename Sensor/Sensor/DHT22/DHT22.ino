#include "DHT.h"

const char *ssid = "NSTDA-Project";
const char *passw = "1q2w3e4r";

#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

float t, h, f, heat;


void setup() {

  Serial.begin(115200);
}

void loop() {
  t = dht.readTemperature();
  f= dht.readTemperature(true);
  h = dht.readHumidity();
  heat = dht.computeHeatIndex(t,h);
  if (isnan(t) || isnan(h)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }
  Serial.println("Temperature is " + String(t) + " celcuis");
  Serial.println("Temperature is " + String(f) + " fahrenheit");
  Serial.println("Humidity is " + String(h) + " %RH");
  Serial.println("computeHeatIndex is " + String(heat) + " Unit");
  Serial.println("----------------------------------------");
  delay(5000);

}
