/*
 *  promise.js
 *
 *  David Janes
 *  IOTDB.org
 *  2017-02-15
 *
 *  Copyright [2013-2017] [David P. Janes]
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

/**
 *  Q is optional
 */
let Q;
let async;
try {
    Q = require("bluebird-q");
    async = require("async");
} catch (x) {
    console.log("#", "warning: _.promise is not available without installing bluebird-q and async");

    Q = {
        denodeify: () => {},
    }
}

const assert = require("assert");

/**
 *  If the promise throws an error, it will be ignored
 */
const optional = (promise) => {
    const _optional = (self, done) => {
        Q(self)
            .then(promise)
            .then(sd => done(null, sd))
            .catch(error => done(null, self))
    };

    return Q.denodeify(_optional);
}

/**
 *  Condtionally chose something to run
 */
const conditional = (test, if_true, if_false) => {
    const _conditional = (self, done) => {
        let f = () => done(null, self);

        if (test(self)) {
            if (if_true) {
                f = if_true;
            }
        } else {
            if (if_false) {
                f = if_false;
            }
        }

        Q(self)
            .then(f)
            .then(sd => done(null, sd))
            .catch(error => done(error))
    }

    return Q.denodeify(_conditional)
}

/**
 */
const ops_series = (_self, done) => {
    const self = Object.assign({}, _self);

    assert.ok(self.ops, "_.promise.ops_series: self.ops is required");

    async.series(self.ops, (error, results) => {
        if (error) {
            return done(error);
        }

        self.results = results; // phase out "results" in favor of "outputs"
        self.outputs = results;

        done(null, self);
    })
}

/**
 *  This will take each object in `self.inputs`,
 *  pull a value out of the input using `select.pre_selector`
 *  (typically) a string and then run the promise
 *  or function `f` on it
 */
const each = (_self, pre_selector, f, post_selector) => {
    const _ = {
        d: require("./d").d,
        is: require("./is").is,
    }
    const self = _.d.clone.shallow(_self)

    return new Promise((resolve, reject) => {
        const ops = self.inputs.map(item => inner_done => {
            Q(self)
                // .then(sd => _.d.add(sd, pre_selector, item))
                .then(sd => {
                    if (_.is.String(pre_selector)) {
                        sd[pre_selector] = item;
                    } else if (_.is.Function(pre_selector)) {
                        sd = Object.assign({}, sd, pre_selector(item))
                    }

                    return sd;
                })
                .then(f)
                .then(sd => {
                    if (_.is.String(post_selector)) {
                        inner_done(null, sd[post_selector])
                    } else if (_.is.Function(post_selector)) {
                        inner_done(null, post_selector(sd))
                    } else {
                        inner_done(null, sd)
                    }
                })
                .catch(inner_done)
        })

        async.series(ops, (error, outputs) => {
            if (error) {
                return reject(error)
                // return done(error);
            }

            self.outputs = outputs;

            // done(null, self);
            return resolve(self)
        })
    })

}

/**
 *  Wait delay seconds. If not set, 1 second.
 */
const delay = (_self, done) => {
    const self = Object.assign({}, _self);

    setTimeout(() => done(null, self), self.delay ? self.delay * 1000 : 1000)
}

/**
 *  Print the message and continue
 */
const log = (...rest) => sd => { console.log(...rest); return sd }
const timestamp = (...rest) => sd => { console.log((new Date()).toISOString(), ...rest); return sd }

/**
 *  Print the message AND the current _self and continue
 */
const spy = (...rest) => sd => { console.log(...rest, sd); return sd }

exports.promise = {
    optional: optional,
    conditional: conditional,
    each: each,
    ops: {
        clear: sd => { sd.ops = []; return sd },
        series: Q.denodeify(ops_series),
    },
    log: log,
    timestamp: timestamp,
    spy: spy,
    delay: Q.denodeify(delay),
};
