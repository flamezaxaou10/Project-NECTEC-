/*
 *  is.js
 *
 *  David Janes
 *  IOTDB.org
 *  2014-04-15
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

const node_url = require('url');

const _ = require("../helpers");

const isDictionary = o => {
    if (_.is.Array(o)) {
        return false;
    } else if (_.is.Function(o)) {
        return false;
    } else if (o === null) {
        return false;
    } else if (!_.is.Object(o)) {
        return false;
    } else if (o.constructor === Object) {
        return true;
    } else {
        return false;
    }
};

const isAbsoluteURL = o => {
    if (typeof o !== 'string') {
        return false;
    }

    var u = node_url.parse(o);
    if (!u) {
        return false;
    }
    if (!u.protocol) {
        return false;
    }

    return u.protocol.length > 0;
};

const _ArrayOfX = (vs, test) => {
    if (!Array.isArray(vs)) {
        return false;
    }

    for (var vi in vs) {
        if (!test(vs[vi])) {
            return false;
        }
    }

    return true;
};

const isAtomic = v => exports.is.Boolean(v) || exports.is.Number(v) || exports.is.String(v) || exports.is.Null(v);

const isJSON = v => {
    if (exports.is.Array(v)) {
        for (let vi in v) {
            if (!isJSON(v[vi])) {
                return false;
            }
        }
        return true;
    } else if (exports.is.Dictionary(v)) {
        const values = _.values(v);
        for (let vi in values) {
            if (!isJSON(values[vi])) {
                return false;
            }
        }
        return true;
    } else {
        return isAtomic(v);
    }
}

// e.g. items.sort((a, b) => _.is.unsorted(a.name, b.name))
const unsorted = (a, b) => {
    if (_.underscore.isEqual(a, b)) {
        return 0;
    } else if (a < b) {
        return -1;
    } else {
        return 1;
    }
}

exports.is = {
    // lowercase because not asking about a typ
    unsorted: unsorted,

    // useful helpers
    Dictionary: isDictionary,
    AbsoluteURL: isAbsoluteURL,
    Timestamp: o => (typeof o === 'string') && o.match(/\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ/),

    // JSON-like
    JSON: isJSON,
    Atomic: isAtomic,

    // consistency
    Empty: _.underscore.isEmpty,
    Equal: _.underscore.isEqual,

    // Javascript classes and types
    Array: Array.isArray,
    Boolean: o => typeof o === 'boolean',
    Date: o => o instanceof Date,
    Function: o => typeof o === 'function',
    Integer: o => typeof o === 'number' && ((o % 1) === 0),
    Null: o => o === null,
    Number: o => typeof o === 'number' && !Number.isNaN(o),
    Object: _.underscore.isObject,
    RegExp: o => o instanceof RegExp,
    Buffer: o => o instanceof Buffer,
    String: o => typeof o === 'string',
    Promise: o => o instanceof Promise,
    Error: o => o instanceof Error,
    Undefined: o => o === void 0,
    NaN: v => Number.isNaN(v), 

    Nullish: o => exports.is.Null(o) || exports.is.Undefined(o),

    // aggregates - depreciated
    ArrayOfString: o => exports.is.Array.of.String(o),
    ArrayOfObject: o => exports.is.Array.of.Object(o),
    ArrayOfDictionary: o => exports.is.Array.of.Dictionary(o),
};

exports.is.Array.of = {
    String: o => _ArrayOfX(o, exports.is.String),
    Object: o => _ArrayOfX(o, exports.is.Object),
    Dictionary: o => _ArrayOfX(o, exports.is.Dictionary),

}
