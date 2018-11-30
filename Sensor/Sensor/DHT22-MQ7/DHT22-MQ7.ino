#include "DHT.h" 
#include "MQ7.h"
#include <MicroGear.h>
#include <ESP8266WiFi.h>
#include "RestClient.h"

const char* ssid = "HashtagF";
const char* password = "asdfzxcv";
#define server "apimongos.herokuapp.com"
RestClient server_api = RestClient("apimongos.herokuapp.com");

WiFiClient client;
MicroGear microgear(client);

#define APPID   "TestProject01"
#define KEY     "pnypLoqd8yPm0gF"
#define SECRET  "5H5QQJwMqypPB4k30lPT5dVro"
#define ALIAS   "MQ7_DHT22"

#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);


float t, h, f, heat;
MQ7 mq7(A0,3.0);

// Dont Edit Variable!!! Variable for Database 
String sensorId = "S001"; // sensorId ** requirement
String desired = "desired.value=23.45&desired.unit=celsius"; // data value   ** requirement
String thingId = "T001"; // ** requirement
String metaName = "Name of Sensor"; // ** requirement
String metaDescription = "Description Sensor";
String language = "en-US";
String sensorType = "Temperature"; // ** requirement
String sensorModel = "DHT22"; // ** requirement
String categories = ""; // categories of sensor example health, sound,etc
String locationType = "Fixed"; // type location example Fixed , Moving such as sensor gps, Other
String address = "";
String city = "";
String county = "";
String country = "";
String postalCode = "";
String freeText ="";
String latitude = "";
String longitude = "";
String versions = "0.1";
// Varible for Database

void setup() {
     
    microgear.on(MESSAGE,onMsghandler);
    microgear.on(PRESENT,onFoundgear);
    microgear.on(ABSENT,onLostgear);
    microgear.on(CONNECTED,onConnected);

    Serial.begin(115200);
    Serial.println("Starting...");

    if (WiFi.begin(ssid, password)) {
        while (WiFi.status() != WL_CONNECTED) {
            delay(500);
            Serial.print(".");
        }
    }

    Serial.println("WiFi connected");  
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());

    microgear.init(KEY,SECRET,ALIAS);
    microgear.connect(APPID);

}

void loop() {
  if (microgear.connected() || true) {
        Serial.println("connected");
        microgear.loop();
        mainProcess();
        // set variable for add database DHT22
        sensorId = "S001";
        thingId = "T001";
        metaName = "Temperature and Humidity";
        metaDescription = "เซ็นเซอตรวจจับอุณภูมิและความชื้น";
        sensorType = "Temperature";
        sensorModel = "DHT22";
        categories = "Envirovment";
        locationType = "Fixed";
        address = "418B Nectec";
        city = "Khongluang";
        county = "Pathum tani";
        country = "Thailand";
        postalCode = "12120";
        freeText = "Build 12 floor 4 Room 418B";
        desired = "desired.value=" + String(t) + "&desired.unit=celsius";
        callAPI();
        // set variable for add database MQ-7
        sensorId = "S002";
        thingId = "T001";
        metaName = "Sensor MQ-7";
        metaDescription = "เซ็นเซอร์ตรวจจับคาร์บอนมอนนอกไซต์ในอากาศ";
        sensorType = "Temperature";
        sensorModel = "MQ-7";
        categories = "Envirovment";
        locationType = "Fixed";
        address = "418B Nectec";
        city = "Khongluang";
        county = "Pathum tani";
        country = "Thailand";
        postalCode = "12120";
        freeText = "Build 12 floor 4 Room 418B";
        desired = "desired.value=" + String(mq7.getPPM()) + "&desired.unit=ppm";
        callAPI();
        
    }
    else {
        Serial.println("connection lost, reconnect...");
        microgear.connect(APPID);
    }
    delay(60000);  
}

 void mainProcess() {
  
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

  microgear.publish("/MQ7", mq7.getPPM());
  microgear.publish("/DHT22", String(t) + "," + String(f));

  
  
  delay(3000);
}

void onMsghandler(char *topic, uint8_t* msg, unsigned int msglen) {
    Serial.print("Incoming message --> ");
    msg[msglen] = '\0';
    Serial.println((char *)msg);
}

void onFoundgear(char *attribute, uint8_t* msg, unsigned int msglen) {
    Serial.print("Found new member --> ");
    for (int i=0; i<msglen; i++)
        Serial.print((char)msg[i]);
    Serial.println();  
}

void onLostgear(char *attribute, uint8_t* msg, unsigned int msglen) {
    Serial.print("Lost member --> ");
    for (int i=0; i<msglen; i++)
        Serial.print((char)msg[i]);
    Serial.println();
}

/* When a microgear is connected, do this */
void onConnected(char *attribute, uint8_t* msg, unsigned int msglen) {
    Serial.println("Connected to NETPIE...");
    /* Set the alias of this microgear ALIAS */
    microgear.setAlias(ALIAS);
}


// Function add metadata to database
String response, _str, _res;
void callAPI() {
  String payload;
  payload += "sensorId=" + sensorId;
  payload += "&"+ desired;
  payload += "&metadata.thingId=" + thingId;  
  payload += "&metadata.name=" + metaName;  
  payload += "&metadata.description=" + metaDescription;
  payload += "&metadata.language=" + language;  
  payload += "&metadata.sensorInfo.type=" + sensorType;  
  payload += "&metadata.sensorInfo.model=" + sensorModel; 
  payload += "&metadata.categories.type=" + categories;
  payload += "&metadata.location.type=" + locationType;
  payload += "&metadata.location.address=" + address;
  payload += "&metadata.location.city=" + city;
  payload += "&metadata.location.county=" + county;
  payload += "&metadata.location.country=" + country;
  payload += "&metadata.location.postalCode=" + postalCode;
  payload += "&metadata.location.freeText=" + freeText;
  payload += "&metadata.location.gps.latitude=" + latitude;
  payload += "&metadata.location.gps.longitude=" + longitude;
  payload += "&metadata.version=" + versions;
  int contentLength = payload.length(); 
  char request[contentLength];
  payload.toCharArray(request, contentLength);
  Serial.println(request);
  int statusCode = server_api.post("/sensor", request, &response);
  Serial.print("Status code from server: ");
  Serial.println(statusCode);
  // Serial.print("Response body from server: ");
  // Serial.println(response);

}
