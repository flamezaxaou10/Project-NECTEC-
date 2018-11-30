#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#define OLED_RESET -1
#define USE_ARDUINO_INTERRUPTS false
#include <PulseSensorPlayground.h>

Adafruit_SSD1306 display(OLED_RESET);
#if (SSD1306_LCDHEIGHT != 32)
#error("Height incorrect, please fix Adafruit_SSD1306.h!");
#endif
byte count;
byte sensorArray[128];
byte drawHeight;

/*following functions controls scrolling direction (left/right) and drawing mode (dot/filled)
  These commands are NOT case sensitive, code understands in both capitals and non-capitals of these commands to make it more user friendly.
*/
char filled = 'F'; //decide either filled or dot display (D=dot, any else filled)
char drawDirection = 'R'; //decide drawing direction, from right or from left (L=from left to right, any else from right to left)
char slope = 'W'; //slope colour of filled mode white or black slope (W=white, any else black. Well, white is blue in this dispay but you get the point)


int PulseSensorPurplePin = 0; 
int LED13 = 13; 
int Signal;
int Threshold = 550;
const int PULSE_FADE = 5;

byte samplesUntilReport;
const byte SAMPLES_PER_SERIAL_SAMPLE = 10;
PulseSensorPlayground pulseSensor;
int myBPM;
void setup()
{
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);  // initialize with the I2C addr 0x3C (for the 128x32)

  for (count = 0; count <= 128; count++) //zero all elements
  {
    sensorArray[count] = 0;
  }

  pulseSensor.analogInput(PulseSensorPurplePin);   
  pulseSensor.blinkOnPulse(LED13);    
  pulseSensor.setThreshold(Threshold);
  samplesUntilReport = SAMPLES_PER_SERIAL_SAMPLE;
}


void loop()
{
  drawHeight = map(analogRead(A0), 300, 1023, 0, 32 );
  sensorArray[0] = drawHeight;

  Signal = analogRead(PulseSensorPurplePin);
  if (pulseSensor.sawNewSample()) {
    
      myBPM = pulseSensor.getBeatsPerMinute();
      if (--samplesUntilReport == (byte) 0) {
        samplesUntilReport = SAMPLES_PER_SERIAL_SAMPLE;
        pulseSensor.outputSample();
  
        if (pulseSensor.sawStartOfBeat()) {
          Serial.print("Signal : ");
          Serial.println(Signal); 
          Serial.println("♥  A HeartBeat Happened ! "); // If test is "true", print a message "a heartbeat happened".
          Serial.print("BPM: ");                        // Print phrase "BPM: " 
          Serial.println(myBPM);
        }
      }
    }

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
