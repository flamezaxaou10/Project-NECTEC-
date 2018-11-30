#include "MQ7.h"

MQ7 mq7(A0,5.0);

void setup() {
    Serial.begin(9600);
}

void loop() {
    Serial.print("MQ-7 : ");
    Serial.print(mq7.getPPM());
    Serial.println("ppm");
    delay(1000);
}
