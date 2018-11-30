"use strict"

const iotdb = require("iotdb");
const _ = iotdb._;

const util = require('util');
const EventEmitter = require('events').EventEmitter;
const http = require("http");
const https = require("https");
const url = require("url");
const xml2js = require('xml2js');

const upnp = require("./upnp");
const UpnpDevice = require("./upnp-device").UpnpDevice;

const logger = iotdb.logger({
    name: 'iotdb-upnp',
    module: 'upnp/upnp-controlpoint',
});

const TRACE = false;
const DETAIL = false;

/**
 * Device found

NT: Notification Type
    upnp:rootdevice 
        Sent once for root device. 
    uuid:device-UUID
        Sent once for each device, root or embedded, where device-UUID is specified by the UPnP vendor. See 
        section 1.1.4, “UUID format and RECOMMENDED generation algorithms” for the MANDATORY UUID format. 
    urn:schemas-upnp-org:device:deviceType:ver
        Sent once for each device, root or embedded, where deviceType and ver are defined by UPnP Forum working 
        committee, and ver specifies the version of the device type. 
    urn:schemas-upnp-org:service:serviceType:ver
        Sent once for each service where serviceType and ver are defined by UPnP Forum working committee and ver
        specifies the version of the service type. 
    urn:domain-name:device:deviceType:ver
        Sent once for each device, root or embedded, where domain-name is a Vendor Domain Name, deviceType and ver
        are defined by the UPnP vendor, and ver specifies the version of the device type. Period characters in the Vendor 
        Domain Name MUST be replaced with hyphens in accordance with RFC 2141. 
    urn:domain-name:service:serviceType:ver
        Sent once for each service where domain-name is a Vendor Domain Name, serviceType and ver are defined by 
        UPnP vendor, and ver specifies the version of the service type. Period characters in the Vendor Domain Name 
        MUST be replaced with hyphens in accordance with RFC 2141. 
 */


const _device_uuid = device => {
    if (!device) {
        return null;
    } else if (device.uuid) {
        return device.uuid;
    } else if (device.usn) {
        return device.usn.replace(/::.*$/, '').replace(/^uuid:/, '');
    } else {
        return null;
    }
}

const UpnpControlPoint = function (initd) {
    const self = this;

    EventEmitter.call(self);

    initd = _.d.compose.shallow(initd, {
        listen_port: 0,
    });

    self.deviced = {}; 

    // create a client instance
    self.ssdp = new upnp.ControlPoint(); 

    // these actually aren't devices but headers that if you squint look like them
    self.ssdp.on("DeviceFound", device => self._found(device));
    self.ssdp.on("DeviceAvailable", device => self._found(device));
    self.ssdp.on("DeviceUnavailable", device => self.forget(device));
    self.ssdp.on("DeviceUpdate", device => self._seen(device));

    // for handling incoming events from subscribed services
    self.eventHandler = new EventHandler({
        listen_port: initd.listen_port,
    });
}

util.inherits(UpnpControlPoint, EventEmitter);

/**
 *  Forget about a particular device, so it can be
 *  rediscovered. This is useful sometimes when
 *  a connection is broken and you want to start
 *  it up again from scratch
 *
 *  DPJ 2014-07-22
 */
UpnpControlPoint.prototype.forget = function (device) {
    const self = this

    if (!device) {
        return;
    }

    const udn = _device_uuid(device);
    if (!self.deviced[udn]) {
        logger.debug({
            method: "UpnpControlPoint.forget",
            udn: udn,
            devices: _.keys(self.deviced),
            cause: "UPnP protocol - not a big deal",
        }, "device not known!");
        return;
    }

    logger.info({
        method: "UpnpControlPoint.forget",
        udn: udn,
    }, "forgetting device");

    delete self.deviced[udn];

    self.emit("device-lost", udn);

    if (device.forget) {
        device.forget()
    }
}

UpnpControlPoint.prototype._seen = function (device) {
    const self = this;

    if (!device) {
        return;
    }

    const udn = _device_uuid(device);
    const o_device = self.deviced[udn];
    if (!o_device) {
        return;
    }

    if (!o_device.seen) {
        return;
    }

    o_device.seen();
    return true;
};

UpnpControlPoint.prototype._found = function (device) {
    const self = this;

    const udn = _device_uuid(device);

    if (self.deviced[udn] === "holding") {
        return;
    }

    if (self._seen(device)) {
        return;
    }

    if (!device.location) {
        return;
    }

    if (TRACE) {
        logger.debug({
            method: "UpnpControlPoint/on(DeviceFound)",
            udn: udn
        }, "device found");
    }

    self.deviced[udn] = "holding";

    self._getDeviceDetails(udn, device.location, function (device) {
        if (self.deviced[udn] !== "holding") {
            return;
        }

        self.deviced[udn] = device;
        self.emit("device", device);
    });
};

/**
 *  Forget all devices older than the given time in ms
 *
 *  DPJ 2014-07-22
 */
UpnpControlPoint.prototype.scrub = function (ms) {
    const self = this

    const now = (new Date()).getTime();

    _.values(self.deviced)
        .filter(device => device)
        .filter(device => _device_uuid(device))
        .filter(device => (now - device.last_seen) > ms)
        .forEach(device => {
            logger.debug({
                method: "UpnpControlPoint.scrub",
                age: now - device.last_seen,
                udn: device.udn,
            }, "will forget device - haven't seen it in a while");

            self.forget(device);
        })
}

/**
 */
UpnpControlPoint.prototype.search = function (s) {
    const self = this;

    self.ssdp.search(s || 'upnp:rootdevice');
}

/**
 * Query the device for details.
 *
 * @param {Object} deviceUrl
 */
UpnpControlPoint.prototype._getDeviceDetails = function (udn, location, callback) {
    const self = this;
    var localAddress = "127.0.0.1"; // will determine which local address is used to talk with the device.
    if (TRACE) {
        logger.info({
            method: "UpnpControlPoint._getDeviceDetails",
            location: location
        }, "getting device details");
    }

    var requester = null;
    var options = url.parse(location);
    if (options.protocol === "http:") {
        requester = http.request;
    } else if (options.protocol === "https:") {
        requester = https.request;
    } else {
        logger.error({
            method: "UpnpControlPoint._getDeviceDetails",
            location: location,
            cause: "we are only supporting http: in UPnP for now",
        }, "ignoring not http: device");
        return;
    }

    var req = requester(options, function (res) {
        //res.setEncoding('utf8');
        var resData = "";
        res.on('data', function (chunk) {
            resData += chunk;
        });
        res.on('end', function () {
            if (res.statusCode != 200) {
                logger.error({
                    method: "UpnpControlPoint._getDeviceDetails/on(end)",
                    status: res.statusCode,
                    data: resData,
                }, "problem getting device details");
                return;
            }
            xml2js.parseString(resData, function (err, result) {
                if (!result) {
                    logger.info({
                        method: "UpnpControlPoint._getDeviceDetails/on(end)",
                        cause: "usually UPnP error",
                    }, "!result - not a big issue");
                    return;
                }
                if (!result.root) {
                    logger.info({
                        method: "UpnpControlPoint._getDeviceDetails/on(end)",
                        cause: "usually UPnP error",
                    }, "!result.root - not a big issue");
                    return;
                }

                var desc = result.root.device[0];
                if (TRACE) {
                    logger.debug({
                        method: "UpnpControlPoint._getDeviceDetails/on(end)",
                        deviceType: desc.deviceType,
                        friendlyName: desc.friendlyName,
                        location: location,
                    }, "");
                }
                var device = new UpnpDevice(self, udn, location, desc, localAddress);
                callback(device);
            });
        });
    });
    req.on('socket', function (socket) {
        // the local address used to communicate with the device. Used to determine callback URL. 
        try {
            localAddress = socket.address().address;
        } catch (x) {
            logger.error(x, {
                method: "UpnpControlPoint._getDeviceDetails/on(socket)",
            }, "no socket?");
        }
    });
    req.on('error', function (e) {
        logger.error({
            method: "UpnpControlPoint._getDeviceDetails/on(error)",
            message: e.message,
        }, "problem with request");
    });
    req.end();
}


/* ---------------------------------------------------------------------------------- */
/*
	headers:
 {
 	"host":"192.168.0.122:6767",
 	"content-type":"text/xml",
 	"content-length":"132",
 	"nt":"upnp:event",
 	"nts":"upnp:propchange",
 	"sid":"uuid:4af70162-1dd2-11b2-8f95-86a98a724376",		// subscription ID
 	"seq":"2"
 }
 
	content:
	<e:propertyset xmlns:e="urn:schemas-upnp-org:event-1-0">
		<e:property>
			<BinaryState>1</BinaryState>
		</e:property>
	</e:propertyset>
 */



const EventHandler = function (initd) {
    const self = this;

    /*
    this.serverPort = 6767;
    this.responseCount = 1; // not sure if this is supposed to be per-subscription
    this.server = http.createServer(function (req, res) {
        self._serviceCallbackHandler(req, res);
    });

    this.server.listen(this.serverPort);
    */
    self.responseCount = 1; // not sure if this is supposed to be per-subscription
    self.server = http.createServer(function (req, res) {
        self._serviceCallbackHandler(req, res);
    });

    self.server.listen(initd.listen_port || 0);
    self.serverPort = self.server.address().port;

    logger.info({
        method: "EventHandler",
        port: self.serverPort,
    }, "UPnP listening on this port");

    self.subscriptions = {};
}

EventHandler.prototype.addSubscription = function (subscription) {
    this.subscriptions[subscription.sid] = subscription;
}

EventHandler.prototype.removeSubscription = function (sid) {
    delete this.subscriptions[sid];
}

/**
 "host":"192.168.0.122:6767","content-type":"text/xml","content-length":"140","nt":"upnp:event","nts":"upnp:propchange","sid":"uuid:7edd52ba-1dd2-11b2-8d34-bb2eba00fd46","seq":"0"
 
 * @param {Object} req
 * @param {Object} res
 */
EventHandler.prototype._serviceCallbackHandler = function (req, res) {
    const self = this;
    var reqContent = "";
    req.on("data", function (buf) {
        reqContent += buf;
    });
    req.on("end", function () {
        var parser = new xml2js.Parser();
        try {
            parser.parseString(reqContent, function (err, result) {
                if (err) {
                    logger.info({
                        method: "EventHandler._serviceCallbackHandler/on(end)",
                        error: err,
                    }, "XML parsing error");
                    return;
                }
                var sid = req.headers.sid;
                var subscription = self.subscriptions[sid];
                if (subscription) {
                    if (TRACE && DETAIL) {
                        logger.info({
                            method: "EventHandler._serviceCallbackHandler/on(end)",
                            sid: subscription.sid,
                            result: result,
                        }, "event for sid");
                    }
                    var values = {};
                    var properties = result["e:propertyset"]["e:property"];
                    for (var i = 0; i < properties.length; i++) {
                        var prop = properties[i];
                        for (var name in prop) {
                            values[name] = prop[name][0];
                        }
                    }

                    // acknowledge the event notification					
                    res.writeHead(200, {
                        "Extended-Response": self.responseCount + " ; comment=\"Notification Acknowledged\""
                    });
                    res.end("");
                    self.responseCount++;

                    subscription.handleEvent(values);
                }
            });
        } catch (x) {
            if (x.toString().startsWith("Error: Text data outside of root node.")) {
                // ignore
            } else {
                logger.info(x, {
                    method: "EventHandler._serviceCallbackHandler",
                });
            }
        }
    });
}

/**
 *  API
 */
exports.UpnpControlPoint = UpnpControlPoint;
