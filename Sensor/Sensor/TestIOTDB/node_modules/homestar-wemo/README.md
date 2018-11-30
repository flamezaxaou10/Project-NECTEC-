# homestar-wemo
[IOTDB](https://github.com/dpjanes/node-iotdb) Bridge for Belkin WeMo devices.

<img src="https://raw.githubusercontent.com/dpjanes/iotdb-homestar/master/docs/HomeStar.png" align="right" />

# About

See <a href="samples/">the samples</a> for details how to add to your project.
particularly <code>model.js</code> for "standalone" and <code>iotdb.js</code>
for use in IOTDB / HomeStar projects.

* [Read about Bridges](https://github.com/dpjanes/node-iotdb/blob/master/docs/bridges.md)

# Installation

* [Read this first](https://github.com/dpjanes/node-iotdb/blob/master/docs/install.md)

Then:

    $ npm install homestar-wemo

# Use

Code to turn off all WeMo sockets

	const iotdb = require('iotdb')
    iotdb.use("homestar-wemo")

	iotdb.connect("WeMoSocket").set(":on", false)

# Models
## WeMoSocket

This controls WeMo Sockets.

Functionality:

* discover WeMo Sockets
* turn on and off
* get same (including notifications)

### Attributes

* <code>on</code>: true or false, purpose <code>iot-purpose:on</code>

e.g.

    {
        "on": true
    }

the socket is on / turn the socket on

## WeMoInsight

NOT TESTED

### Attributes

* <code>on</code>: true or false, purpose <code>iot-purpose:on</code>

e.g.

    {
        "on": true
    }

## WeMoLightSwitch

NOT TESTED

### Attributes

* <code>on</code>: true or false, purpose <code>iot-purpose:on</code>

e.g.

    {
        "on": true
    }

## WeMoMotion

NOT TESTED

### Attributes

* <code>motion</code>: true or false, purpose <code>iot-purpose:sensor.motion</code>

e.g.

    {
        "motion": true
    }

## WeMoCrockpot

NOT TESTED

### Attributes

* <code>on</code>: true or false, purpose <code>iot-purpose:on</code>

e.g.

    {
        "on": true
    }
