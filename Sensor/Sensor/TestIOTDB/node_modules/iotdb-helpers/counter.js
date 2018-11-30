/*
 *  counter.js
 *
 *  David Janes
 *  IOTDB.org
 *  2016-09-20
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

/**
 *  Track entering and leaving a code block.
 */
const counter = done => {
    let count = 0;

    return {
        increment: function() {
            count++;
        },

        decrement: function(error) {
            if (error) {
                let _done = done;
                done = () => {};
                _done(error);
            } else if (--count === 0) {
                let _done = done;
                done = () => {};
                _done(null);
            }
        },
    }
};

/**
 *  API
 */
exports.counter = counter;
