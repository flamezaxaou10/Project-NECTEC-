/*
 *  coerce.js
 *
 *  David Janes
 *  IOTDB
 *  2016-06-07
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

"use struct";

const _ = require("iotdb-helpers");

// -- these are underlying coversions
const _null = (value) => {
    return null;
}

const _identity = (value) => {
    return value;
}

const _boolean_number = (value) => {
    return value ? 1 : 0;
}

const _boolean_string = (value) => {
    return value ? "1": "0";
}

const _number_boolean = (value) => {
    return value ? true : false;
};

const _number_integer = (value) => {
    return Math.round(value);
};

const _number_string = (value) => {
    return "" + value;
};

const _string_boolean = (value) => {
    if (value.length === 0) {
        return false;
    } else if (value === "0") {
        return false;
    } else if (value === "off") {
        return false;
    } else if (value === "false") {
        return false;
    } else if (value === "no") {
        return false;
    } else {
        return true;
    }
};

const _string_integer = (value, otherwise) => {
    value = Math.round(parseFloat(value));
    if (isNaN(value)) {
        return otherwise;
    }

    return value;
};

const _string_number = (value, otherwise) => {
    value = parseFloat(value);
    if (isNaN(value)) {
        return otherwise;
    }

    return value;
};

const mapds = [
    // 1. identity
    { from: "iot:type.null", to: "iot:type.null", coerce: _identity, },
    { from: "iot:type.boolean", to: "iot:type.boolean", coerce: _identity, },
    { from: "iot:type.integer", to: "iot:type.integer", coerce: _identity, },
    { from: "iot:type.number", to: "iot:type.number", coerce: _identity, },
    { from: "iot:type.string", to: "iot:type.string", coerce: _identity, },

    // 2. safe upcoversions
    { from: "iot:type.boolean", to: "iot:type.integer", coerce: _boolean_number, },
    { from: "iot:type.boolean", to: "iot:type.number", coerce: _boolean_number, },
    { from: "iot:type.integer", to: "iot:type.number", coerce: _identity, },

    // 3. number downcoversions
    { from: "iot:type.integer", to: "iot:type.boolean", coerce: _number_boolean, },
    { from: "iot:type.number", to: "iot:type.boolean", coerce: _number_boolean, },
    { from: "iot:type.number", to: "iot:type.integer", coerce: _number_integer, },

    // 4. string downconversions
    { from: "iot:type.string", to: "iot:type.boolean", coerce: _string_boolean, },
    { from: "iot:type.string", to: "iot:type.integer", coerce: _string_integer, },
    { from: "iot:type.string", to: "iot:type.number", coerce: _string_number, },

    // 5. string upcoversions
    { from: "iot:type.boolean", to: "iot:type.string", coerce: _boolean_string, },
    { from: "iot:type.integer", to: "iot:type.string", coerce: _number_string, },
    { from: "iot:type.number", to: "iot:type.string", coerce: _number_string, },

    // 6. nulls upconversions
    /* NO! this creates data where it doesn't exist
    { from: "iot:type.null", to: "iot:type.boolean", coerce: () => false, },
    { from: "iot:type.null", to: "iot:type.integer", coerce: () => 0, },
    { from: "iot:type.null", to: "iot:type.number", coerce: () => 0, },
    { from: "iot:type.null", to: "iot:type.string", coerce: () => "", },
    */

    // 7. null downconversions
    { from: "iot:type.boolean", to: "iot:type.null", coerce: _null, },
    { from: "iot:type.integer", to: "iot:type.null", coerce: _null, },
    { from: "iot:type.number", to: "iot:type.null", coerce: _null, },
    { from: "iot:type.string", to: "iot:type.null", coerce: _null, },
];

/**
 */
const value = ( v, otherwise ) => {
    if (v === undefined) {
        return otherwise;
    } else {
        return v;
    }
};

/**
 */
const list = ( value, otherwise ) => {
    if (value === undefined) {
        return otherwise;
    } else if (_.is.Array(value)) {
        return value;
    } else {
        return [ value ];
    }
};

/**
 */
const first = ( value, otherwise ) => {
    if (value === undefined) {
        return otherwise;
    } else if (!_.is.Array(value)) {
        return value;
    } else if (value.length) {
        return value[0];
    } else {
        return otherwise;
    }
};

/**
 *  Return the standard type
 */
const classify = ( value ) => {
    if (_.is.Null(value)) {
        return "iot:type.null";
    } else if (_.is.Boolean(value)) {
        return "iot:type.boolean";
    } else if (_.is.Integer(value)) {
        return "iot:type.integer";
    } else if (_.is.Number(value)) {
        return "iot:type.number";
    } else if (_.is.String(value)) {
        return "iot:type.string";
    } else {
        return null;
    }
};

/**
 *  Convert a value to another type
 */
const coerce = ( value, to_types, otherwise ) => {
    var from_type = classify(value);
    if (!from_type) {
        return otherwise;
    } 

    to_types = list(to_types, []);
    if (_.is.Empty(to_types)) {
        return value;
    }

    let best_map_index = 9999;
    let best_coerced = otherwise;

    to_types.map(( to_type ) => {
        let map_index = -1;
        for (let mapd of mapds) {
            ++map_index;

            if (map_index >= best_map_index) {
                break;
            }

            if (mapd.from !== from_type) {
                continue;
            }
            if (mapd.to !== to_type) {
                continue;
            }

            let coerced = mapd.coerce(value);
            if (_.is.Undefined(coerced)) {
                continue;
            }

            best_map_index = map_index;
            best_coerced = coerced;
        }
    });

    return best_coerced;
};

/**
 *  API
 */
exports.coerce = {
    value: value,
    first: first,
    list: list,
    classify: classify,
    coerce: coerce,

    to: {
        Boolean: (v, otherwise) => coerce(v, [ "iot:type.boolean" ], otherwise),
        Integer: (v, otherwise) => coerce(v, [ "iot:type.integer" ], otherwise),
        Number: (v, otherwise) => coerce(v, [ "iot:type.number" ], otherwise),
        String: (v, otherwise) => coerce(v, [ "iot:type.string" ], otherwise),
    },
};
