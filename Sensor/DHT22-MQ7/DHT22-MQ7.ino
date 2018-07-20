#include "DHT.h" 
#include "MQ7.h"

const char *ssid = "NSTDA-Project";
const char *passw = "1q2w3e4r";

#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);


float t, h, f, heat;
MQ7 mq7(A0,3.0);

void setup() {

  Serial.begin(115200);

}

 void loop() {
  t = dht.readTemperature();
  f= dht.readTemperature(true);
  h = dht.readHumidity();
  heat = dht.computeHeatIndex(t,h);
  Serial.print("CO : ");
  Serial.print(mq7.getPPM());
  Serial.println(" ppm");
  Serial.println(mq7.getRatio());
  Serial.println(mq7.getSensorResistance());

  if (isnan(t) || isnan(h)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }
  Serial.println("Temperature is " + String(t) + " celcuis");
  Serial.println("Temperature is " + String(f) + " fahrenheit");
  Serial.println("Humidity is " + String(h) + " %RH");
  Serial.println("computeHeatIndex is " + String(heat) + "celcuis");
  Serial.println("----------------------------------------");
  delay(3000);

 

}
