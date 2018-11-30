#include "Wire.h"
#include "I2Cdev.h"
#include "MPU6050.h"

MPU6050 mpu; //ประกาศตัวแปร mpu เป็นตัวแปรจาก Libraly
int16_t ax, ay, az;
int16_t gx, gy, gz;

void setup()
{
Wire.begin();
Serial.begin(38400);

Serial.println("Initialize MPU");
mpu.initialize();
Serial.println(mpu.testConnection() ? "Connected" : "Connection failed");
}

void loop() //รับค่าและแสดงผลแกนต่างๆไปเรื่อยๆ
{
mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

//คำสั่งรับค่าแกนต่างๆจาก Library//ใช้คำส่ง map ในการบีบช่วงค่าให้แคบลง
//map(ตัวแปร, ค่าต่ำสุดเดิม ,ค่าสูงสุดเดิม ,ค่าต่ำสุดใหม่ ,ค่าสูงสุดใหม่)
ax = map(ax, -18000, 18000, 0, 180);
ay = map(ay, -18000, 18000, 0, 180);
az = map(az, -18000, 18000, 0, 180);
gx = map(gx, -18000, 18000, 0, 180);
gy = map(gy, -18000, 18000, 0, 180);
gz = map(gz, -18000, 18000, 0, 180);
Serial.print("Axyz \t");
Serial.print(ax); Serial.print("\t");
Serial.print(ay); Serial.print("\t");
Serial.print(az); Serial.print("\t");
Serial.print("Gxyz \t");
Serial.print(gx); Serial.print("\t");
Serial.print(gy); Serial.print("\t");
Serial.println(gz);

delay(50); //หน่วงเวลาซักหน่อย
}
