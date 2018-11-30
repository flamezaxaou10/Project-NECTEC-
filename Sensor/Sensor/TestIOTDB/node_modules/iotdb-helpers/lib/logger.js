/*
 *  logger.js
 *
 *  David Janes
 *  IOTDB.org
 *  2016-04-07
 *
 *  Copyright [2013-2016] [David P. Janes]
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

const bunyan = require("bunyan");

/**
 *  Make a new logger. Clevel people could
 *  swap this out to replace bunyan. This is 
 *  always lazy called by "logger";
 */
const make = initd => bunyan.createLogger(initd);

const _logd = {
    debug: true,
    info: true,
    error: true,
    warn: true,
    trace: true,
    fatal: true,
};

/**
 *  Set the logging levels.
 *
 *  If d.all is set, everything in _logd
 *  is set to that value first.
 */
const levels = d => {
    if (d.all !== undefined) {
        _.keys(_logd).forEach(key => _logd[key] = d.all);
    } 

    _.mapObject(d).forEach(kv => _logd[kv[0]] = kv[1])
};

/**
 *  Turn off all logging except
 *  for fatal error messages
 */
const silent = function() {
    levels({
        all: false,
        fatal: true,
    });
};

const _mutes = [];

/**
 *  Mute based on dictionary
 */
const mute = md => _mutes.push(md);

/**
 *  Create a logger. If you don't want
 *  to use bunyan, replace 'logger.make',
 *  not this
 */
const logger = function (initd) {
    const _d = require("./d").d;
    const _logger = function() {
        let l = null;

        const _make = () => {
            if (l === null) {
                l = make(initd);
            }
        };

        const _level = level => {
            return function(...rest) {
                if (!_logd[level]) {
                    return;
                }

                if (_mutes.find(m => _d.is.subset(m, initd))) {
                    return;
                }

                _make();
                return l[level](...rest)
            }
        };

        return {
            debug: _level("debug"),
            info: _level("info"),
            warn: _level("warn"),
            error: _level("error"),
            trace: _level("trace"),
            fatal: _level("fatal"),
        }
    };

    return _logger();
};

/* --- API --- */
exports.logger = {
    make: make,
    logger: logger,
    levels: levels,
    silent: silent,
    mute: mute,
};
