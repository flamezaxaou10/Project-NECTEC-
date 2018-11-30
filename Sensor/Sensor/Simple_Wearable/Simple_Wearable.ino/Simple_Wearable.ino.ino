#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#define OLED_RESET -1
#define USE_ARDUINO_INTERRUPTS false
#include <PulseSensorPlayground.h>
#include <MicroGear.h>
#include <ESP8266WiFi.h>

Adafruit_SSD1306 display(OLED_RESET);
#if (SSD1306_LCDHEIGHT != 32)
#error("Height incorrect, please fix Adafruit_SSD1306.h!");
#endif

const char* ssid     = "HashtagF";
const char* password = "asdfzxcv";

#define APPID   "TestProject01"
#define KEY     "uTY81hKIelqTLSU"
#define SECRET  "25QwnqdyBCGK9wJg1jPptMWEw"
#define ALIAS   "PulseHeartRate"

WiFiClient client;
MicroGear microgear(client);


byte count;
byte sensorArray[128];
byte drawHeight;

char filled = 'F'; 
char drawDirection = 'R'; 
char slope = 'W'; 

int PulseSensorPurplePin = 0; 
int LED13 = 13; 
int Signal;
int Threshold = 650;
int myBPM;
int pulse = 0;
bool ct,cb;

bool stateSensor = false;

void onMsghandler(char *topic, uint8_t* msg, unsigned int msglen) 
{
  Serial.print("Incoming message --> ");
  msg[msglen] = '\0';
  Serial.println((char *)msg);
  
  if (msg[0] == '1') {
    stateSensor = true;
    microgear.chat("stateSensor", stateSensor);
  } else if (msg[0] == '0') {
    stateSensor = false;
    microgear.chat("stateSensor", stateSensor);
  }
}

void onConnected(char *attribute, uint8_t* msg, unsigned int msglen) 
{
    Serial.println("Connected to NETPIE...");
    microgear.setAlias(ALIAS);
}

void setup()
{
   /* Event listener */
  microgear.on(MESSAGE,onMsghandler);
  microgear.on(CONNECTED,onConnected);
  
  Serial.begin(115200);
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);  // initialize with the I2C addr 0x3C (for the 128x32)
  display.display();
  display.clearDisplay(); 
  
  for (count = 0; count <= 128; count++) //zero all elements
  {
    sensorArray[count] = 0;
  }

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) 
  {
    delay(250);
    Serial.print(".");
  }
  Serial.println("WiFi connected");  
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
  pinMode(LED13,OUTPUT);   
  microgear.init(KEY,SECRET,ALIAS);
  microgear.connect(APPID);
  microgear.chat("stateSensor",stateSensor);
}


void loop()
{
  if (microgear.connected()) {
    microgear.loop();
    if(stateSensor) {
      startSensor();
    }
    else {
      
    }
  }
}

void startSensor () {
  myBPM = pulse * 6;
  pulse = 0;
  Serial.println(myBPM);
  microgear.publish("/bpm", myBPM);
  microgear.writeFeed("FeedIoTNetPIE","bpm:"+ String(myBPM));
  for (int i = 0;i < 115 ; i++) {
    Signal = analogRead(PulseSensorPurplePin);
    drawPulse();
    if(Signal > Threshold){ 
      digitalWrite(LED13,HIGH);                   
      ct = true;
    }
    else if (Signal < (Threshold - 100)) {
      digitalWrite(LED13,LOW); 
      cb = true;
    } 
    if (ct && cb) {
      ct = false;
      cb = false;
      pulse += 1;
      Serial.print("Pulse : ");
      Serial.println(pulse);
    }
    delay(30);
  } 
}

void drawAxises()  //separate to keep stuff neater. This controls ONLY drawing background!
{
  display.setCursor(90, 0);
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.print(myBPM);
  display.setCursor(90, 8);
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.print("BPM");


  display.drawLine(0, 0, 0, 32, WHITE);
  display.drawLine(80, 0, 80, 32, WHITE);

  for (count = 0; count < 40; count += 10)
  {
    display.drawLine(80, count, 75, count, WHITE);
    display.drawLine(0, count, 5, count, WHITE);
  }

  for (count = 10; count < 80; count += 10)
  {
    display.drawPixel(count, 0 , WHITE);
    display.drawPixel(count, 31 , WHITE);
  }
}

void drawPulse(){
    drawHeight = map(analogRead(A0), 300, 1023, 0, 32 );
    sensorArray[0] = drawHeight;
    for (count = 1; count <= 80; count++ )
    {
    if (filled == 'D' || filled == 'd')
    {
      if (drawDirection == 'L' || drawDirection == 'l')
      {
        display.drawPixel(count, 32 - sensorArray[count - 1], WHITE);
      }
      else //else, draw dots from right to left
      {
        display.drawPixel(80 - count, 32 - sensorArray[count - 1], WHITE);
      }
    }
    else
    {
      if (drawDirection == 'L' || drawDirection == 'l')
      {
        if (slope == 'W' || slope == 'w')
        {
          display.drawLine(count, 32, count, 32 - sensorArray[count - 1], WHITE);
        }
        else
        {
          display.drawLine(count, 1, count, 32 - sensorArray[count - 1], WHITE);

        }
      }
      else
      {
        if (slope == 'W' || slope == 'w')
        {
          display.drawLine(80 - count, 32, 80 - count, 32 - sensorArray[count - 1], WHITE);
        }
        else
        {
          display.drawLine(80 - count, 1, 80 - count, 32 - sensorArray[count - 1], WHITE);
        }
      }
    }
    
   }
    drawAxises();
    display.display();  //needed before anything is displayed
    display.clearDisplay(); //clear before new drawing
   for (count = 80; count >= 2; count--) // count down from 160 to 2
   {
    sensorArray[count - 1] = sensorArray[count - 2];
   }
}
