/*
 *  index.js
 *
 *  David Janes
 *  IOTDB.org
 *  2015-02-24
 *
 *  Homestar / IOTDB integration (see "upnp.js" for more)
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

const iotdb = require("iotdb");
const _ = iotdb._;

const logger = iotdb.logger({
    name: 'iotdb-upnp',
    module: 'index',
});

const DELTA_SCRUB = 60 * 1000;
const DELTA_SEARCH = 20 * 1000;

const UpnpControlPoint = require("./upnp/upnp-controlpoint").UpnpControlPoint;

let _cp;
const control_point = function () {
    if (_cp) {
        return _cp;
    }

    logger.info({
        method: "cp"
    }, "made UpnpControlPoint");

    const initd = _.d.compose.shallow({},
        iotdb.keystore().get("bridges/UPnP/initd"), 
        {
            listen_port: 0,
        }
    );

    _cp = new UpnpControlPoint(initd);

    // we periodically kick off a new search to find devices that have come online
    setInterval(function () {
        _cp.search();
        _cp.scrub(DELTA_SCRUB);
    }, DELTA_SEARCH);

    return _cp;
};

const initialized = () => _cp !== undefined;

const devices = () => _.values(control_point().deviced).filter(device => _.is.Object(device));

/*
 *  API
 */
exports.control_point = control_point;
exports.initialized = initialized;
exports.devices = devices;
