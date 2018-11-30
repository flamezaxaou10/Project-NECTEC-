/*
 *  WeMoBridge.js
 *
 *  David Janes
 *  IOTDB.org
 *  2015-02-01
 *
 *  Copyright [2013-2015] [David P. Janes]
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

"use strict";

const iotdb = require('iotdb');
const _ = iotdb._;

const logger = iotdb.logger({
    name: 'homestar-wemo',
    module: 'WeMoBridge',
});

/**
 *  See {iotdb.bridge.Bridge#Bridge} for documentation.
 *  <p>
 *  @param {object|undefined} native
 *  only used for instances, should be a UPnP Control Point
 */
const WeMoBridge = function (initd, native) {
    const self = this;

    self.initd = _.defaults(initd, {});
    self.native = native;
};

WeMoBridge.prototype = new iotdb.Bridge();

/* --- lifecycle --- */

/**
 *  See {iotdb.bridge.Bridge#discover} for documentation.
 */
WeMoBridge.prototype.discover = function () {
    const self = this;

    const cp = require("iotdb-upnp").control_point();

    cp.on("device", function (native) {
        if (!self._is_supported(native)) {
            return;
        }

        self.discovered(new WeMoBridge(self.initd, native));
    });

    cp.search();

};

/**
 *  Check if the detected device is supported by this socket
 */
WeMoBridge.prototype._is_supported = function (native) {
    return (
        ((native.deviceType === "urn:Belkin:device:controllee:1") && (native.modelName === "Socket")) ||
        ((native.deviceType === "urn:Belkin:device:insight:1") && (native.modelName === "Insight")) ||
        (native.deviceType === "urn:Belkin:device:sensor:1") ||
        (native.deviceType === "urn:Belkin:device:lightswitch:1") ||
        (native.deviceType === "urn:Belkin:device:crockpot:1")
    );
};

/**
 *  See {iotdb.bridge.Bridge#connect} for documentation.
 */
WeMoBridge.prototype.connect = function (connectd) {
    const self = this;
    if (!self.native) {
        return;
    }

    self._validate_connect(connectd);

    self.connectd = _.defaults(
        connectd, {
            subscribes: [],
        },
        self.connectd
    );

    self._setup_events();
};

WeMoBridge.prototype._setup_events = function () {
    const self = this;

    self.connectd.subscribes.forEach(subscribe => self._setup_event(subscribe));

    /*
    for (var si in self.connectd.subscribes) {
        self._setup_event(self.connectd.subscribes[si]);
    }
    */

    self.native.on("device-lost", function () {
        self._forget();
    });
};

WeMoBridge.prototype._setup_event = function (service_urn) {
    const self = this;

    const service = self.native.service_by_urn(service_urn);
    if (!service) {
        logger.error({
            method: "_setup_event",
            unique_id: self.unique_id,
            service_urn: service_urn,
        }, "service not found - highly unexpected");
        return;
    }

    const _on_failed = function (code, error) {
        _remove_listeners();

        if (!self.native) {
            return;
        }

        logger.error({
            method: "_setup_event/_on_failed",
            code: code,
            error: error,
            service_urn: service_urn,
            cause: "probably UPnP related"
        }, "called");

        self._forget();
    };

    const _on_stateChange = function (valued) {
        if (!self.native) {
            return;
        }

        const paramd = {
            rawd: {},
            cookd: {},
        };
        paramd.rawd[service_urn] = valued;

        self.connectd.data_in(paramd);

        self.pulled(paramd.cookd);

        logger.info({
            method: "_setup_event/_on_stateChange",
            valued: valued,
            pulled: paramd.cookd,
        }, "called pulled");
    };

    const _on_subscribe = function (error, data) {
        if (!self.native) {
            return;
        }

        if (error) {
            // console.log("- UPnPDriver._setup_event/subscribe", service_urn, error);
            logger.error({
                method: "_setup_event/_on_subscribe",
                error: error,
                service_urn: service_urn,
                cause: "probably UPnP related"
            }, "called pulled");

            self._forget();
            _remove_listeners();
        }
    };

    const _remove_listeners = function () {
        service.removeListener('failed', _on_failed);
        service.removeListener('stateChange', _on_stateChange);
    };

    // console.log("- UPnPDriver._setup_event: subscribe", service_urn);
    logger.info({
        method: "_setup_event/_on_stateChange",
        service_urn: service_urn
    }, "subscribe");

    service.on("failed", _on_failed);
    service.on("forget", _on_failed);
    service.on("stateChange", _on_stateChange);
    service.subscribe(_on_subscribe);
};

WeMoBridge.prototype._forget = function () {
    const self = this;
    if (!self.native) {
        return;
    }

    logger.info({
        method: "_forget"
    }, "called");

    // tediously avoiding loops
    const device = self.native;
    self.native = null;

    self.connectd.subscribes
        .map(subscribe => device.service_by_urn(subscribe))
        .filter(service => service)
        .forEach(service => service.emit("forget"));

    /*
    // make sure services are cleaned up
    for (var si in self.connectd.subscribes) {
        var service_urn = self.connectd.subscribes[si];
        var service = device.service_by_urn(service_urn);
        if (!service) {
            continue;
        }

        service.emit("forget");
    }
    */

    self.pulled();
};

/**
 *  See {iotdb.bridge.Bridge#disconnect} for documentation.
 */
WeMoBridge.prototype.disconnect = function () {
    const self = this;
    if (!self.native || !self.native) {
        return;
    }
};

/* --- data --- */

/**
 *  See {iotdb.bridge.Bridge#push} for documentation.
 */
WeMoBridge.prototype.push = function (pushd, done) {
    const self = this;
    if (!self.native) {
        done(new Error("not connected"));
        return;
    }

    self._validate_push(pushd, done);

    const paramd = {
        cookd: pushd,
        rawd: {},
    };
    self.connectd.data_out(paramd);

    for (let service_urn in paramd.rawd) {
        const service = self.native.service_by_urn(service_urn);
        if (!service) {
            logger.error({
                method: "push",
                unique_id: self.unique_id,
                pushd: pushd,
                service_urn: service_urn,
            }, "service not found - highly unexpected");
            continue;
        }

        _.mapObject(paramd.rawd[service_urn], ( action_value, action_id ) => {
            self._send_action(pushd, service_urn, service, action_id, action_value);
        })

        /*
        const serviced = paramd.rawd[service_urn];
        for (let action_id in serviced) {
            const action_value = serviced[action_id];

            self._send_action(pushd, service_urn, service, action_id, action_value);
        }
        */
    }

    logger.info({
        method: "push",
        unique_id: self.unique_id,
        pushd: pushd,
    }, "pushed");

    // we assume it works!
    self.pulled(pushd);

    done();
};

WeMoBridge.prototype._send_action = function (pushd, service_urn, service, action_id, action_value) {
    const self = this;

    service.callAction(action_id, action_value, function (error, buffer) {
        if (!self.native) {
            return;
        }

        if (error) {
            logger.error({
                method: "push",
                unique_id: self.unique_id,
                pushd: pushd,
                service_urn: service_urn,
                error: error,
                cause: "maybe network problem",
            }, "error calling service - will forget this device");

            self._forget();
            return;
        }
    });
};

/**
 *  See {iotdb.bridge.Bridge#pull} for documentation.
 */
WeMoBridge.prototype.pull = function () {
    const self = this;
    if (!self.native) {
        return;
    }
};

/* --- state --- */

/**
 *  See {iotdb.bridge.Bridge#meta} for documentation.
 */
WeMoBridge.prototype.meta = function () {
    const self = this;
    if (!self.native) {
        return;
    }

    let name = self.native.friendlyName;
    if (_.isEmpty(name)) {
        name = "WeMo " + self.native.uuid.substring(self.native.uuid.length - 4);
    }

    return {
        "iot:thing-id": _.id.thing_urn.unique("WeMoSocket", self.native.uuid),
        "schema:name": name,
        'iot:vendor.type': self.native.deviceType,
        'iot:vendor.model': self.native.modelName,
        'iot:vendor.uuid': self.native.uuid,
        "schema:manufacturer": "http://www.belkin.com/",
        /* XXX - note to self - need a way for connectd to inject schema */
        // "schema:model": "http://www.belkin.com/us/p/P-F7C027/",
    };
};

/**
 *  See {iotdb.bridge.Bridge#reachable} for documentation.
 */
WeMoBridge.prototype.reachable = function () {
    return this.native !== null;
};

/*
 *  API
 */
exports.Bridge = WeMoBridge;
