
#include <GY_61.h>

GY_61 accel;
float x, y, z;
float _x, _y, _z;

void setup() {
    accel = GY_61(A7, A6, A5);
    Serial.begin(9600);
}
void loop() {
  x = accel.readx();
  y = accel.ready();
  z = accel.readz();
  Serial.println('p');
  Serial.println(x);
  Serial.println(y);
  Serial.println(z);
 
  delay(1500);
}
