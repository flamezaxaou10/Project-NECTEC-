/*
 *  d.js
 *
 *  David Janes
 *  IOTDB.org
 *  2014-02-14
 *  "Valentines's Day"
 *
 *  Dictionary functions
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

const _ = require("../helpers");

// NodeJS dependency loop workaround
if (!_.each) {
    _.each = require('underscore').each;
}

/**
 *  Slash-path oriented
 */
const get = function(keystored, key, otherwise) {
    if (!keystored) {
        return otherwise;
    }
    if (!key) {
        return otherwise;
    }

    let d = keystored;
    const subkeys = key.replace(/^\/*/, '').split('/');
    let lastkey = subkeys[subkeys.length - 1];

    for (let ski = 0; ski < subkeys.length - 1; ski++) {
        let subkey = subkeys[ski];
        let subd = d[subkey];

        while (_.is.Array(subd) && subd.length) {
            subd = subd[0]
        }

        if (subd === undefined) {
            return otherwise;
        } else if (_.is.Object(subd)) {
            d = subd;
        } else {
            return otherwise;
        }
    }

    let value = d[lastkey];
    if (value === undefined) {
        return otherwise;
    }

    return value;
};

/**
 */
const first = function(keystored, key, otherwise) {
    let value = get(keystored, key, undefined);
    if (value === undefined) {
        return otherwise;
    } else if (_.is.Array(value)) {
        if (value.length) {
            return value[0];
        } else {
            return otherwise;
        }
    } else {
        return value;
    }
};

/**
 */
const list = function(keystored, key, otherwise) {
    let value = get(keystored, key, undefined);
    if (value === undefined) {
        return otherwise;
    } else if (_.is.Array(value)) {
        return value;
    } else {
        return [ value ];
    }
};

/**
 *  Slash-path oriented
 */
const set = function(keystored, key, value) {
    let d = keystored;
    let subkeys = key.replace(/^\/*/, '').split('/');
    let lastkey = subkeys[subkeys.length - 1];

    for (let ski = 0; ski < subkeys.length - 1; ski++) {
        let subkey = subkeys[ski];
        let subd = d[subkey];
        if (!_.is.Object(subd)) {
            subd = {};
            d[subkey] = subd;
        }

        d = subd;
    }

    d[lastkey] = value;
};

/*
 *  Apply a function to keys and values of a dictionary
 */
const transform = function(o, paramd) {
    paramd = _.defaults(paramd, {
        key: function(key, value, paramd) {
            return key;
        },
        value: function(value, paramd) {
            return value;
        },
        filter: function(value, paramd) {
            return (value !== undefined);
        },
        pre: function(value, paramd) {
            return value;
        },
        post: function(value, paramd) {
            return value;
        },
    });

    let _transform = function(v, paramd) {
        if (_.is.Array(v)) {
            let ovs = v;
            let nvs = [];
            for (let ovx in ovs) {
                let ov = ovs[ovx];
                let nv = _transform(ov, paramd);
                if (paramd.filter(nv)) {
                    nvs.push(nv);
                }
            }
            return nvs;
        } else if ((v !== null) && _.is.Object(v)) {
            let ovd = paramd.pre(v, paramd);
            let nvd = {};
            for (let ovkey in ovd) {
                let ovvalue = ovd[ovkey];

                let nvkey = paramd.key(ovkey, ovvalue, paramd);
                if (!nvkey) {
                    continue;
                }

                let nparamd = _.d.clone.shallow(paramd);
                nparamd._key = nvkey;

                let nvvalue = _transform(ovvalue, nparamd);
                if (paramd.filter(nvvalue)) {
                    nvd[nvkey] = nvvalue;
                }
            }
            return nvd;
        } else {
            return paramd.value(v, paramd);
        }
    };


    o = paramd.pre(o, paramd);
    o = _transform(o, paramd);
    o = paramd.post(o, paramd);

    return o;
};

/**
 *  Return true iff everything in subd is in superd
 *  Note that not recursive on dictionaries
 */
const d_contains_d = function (superd, subd) {
    if (!_.is.Dictionary(superd)) {
        return false;
    }
    if (!_.is.Dictionary(subd)) {
        return false;
    }

    let subkeys = _.keys(subd);
    for (let sx in subkeys) {
        let subkey = subkeys[sx];
        let subvalue = subd[subkey];
        let supervalue = superd[subkey];
        if (!_.is.Equal(subvalue, supervalue)) {
            return false;
        }
    }

    return true;
};

/**
 *  Returns a JSON-scrubed version
 */
const json = function (xvalue) {
    if (xvalue === undefined) {
        return undefined;
    } else if (_.is.Function(xvalue)) {
        return undefined;
    } else if (_.is.NaN(xvalue)) {
        return undefined;
    } else if (_.is.Array(xvalue)) {
        let ns = [];
        xvalue.map(function(o) {
            let n = json(o);
            if (n !== undefined) {
                ns.push(n);
            }
        });
        return ns;
    } else if (_.is.Object(xvalue)) {
        let nd = {};
        _.mapObject(xvalue, function(o, key) {
            let n = json(o);
            if (n !== undefined) {
                nd[key] = n;
            }
        });
        return nd;
    } else {
        return xvalue;
    }
};

/**
 *  Like compose, but will descend into dictionaries
 *  to merge those. The *first* thing seen always takes
 *  precidence in replacement
 */
const deep_compose = (...ods) => {
    const xd = {};

    ods
        .filter(od => _.is.Object(od))
        .forEach(od => {
            _.mapObject(od, ( y, key ) => {
                const x = xd[key];
                if (_.is.Dictionary(x) && _.is.Dictionary(y)) {
                    xd[key] = deep_compose(x, y);
                } else if (_.is.Null(x)) {
                    xd[key] = _.d.clone.deep(y);
                } else if (_.is.Undefined(x)) {
                    xd[key] = _.d.clone.deep(y);
                }
            });
        });

    return xd;
};

/**
 *  Return a new Object composed of all its
 *  arguments. A value is _only_ set if it's
 *  not already set from a preceeding argument.
 */
const shallow_compose = function () {
    let d = {};

    _.each(arguments, function (ad) {
        for (let key in ad) {
            if (d[key] === undefined) {
                d[key] = ad[key];
            }
        }
    });

    return d;
};

const shallow_clone = function (oldObj) {
    let newObj = {};
    for (let i in oldObj) {
        if (oldObj.hasOwnProperty(i)) {
            newObj[i] = oldObj[i];
        }
    }
    return newObj;
};

const deep_clone = function (oldObj) {
    let newObj = oldObj;
    if (oldObj && typeof oldObj === 'object') {
        newObj = Object.prototype.toString.call(oldObj) === "[object Array]" ? [] : {};
        for (let i in oldObj) {
            newObj[i] = deep_clone(oldObj[i]);
        }
    }
    return newObj;
};

const add = (d, key, value) => {
    d = shallow_clone(d);
    set(d, key, value);
    return d;
}

const update = (d, nd) => Object.assign({}, d, nd);

exports.d = {
    get: get,
    first: first,
    list: list,
    set: set,
    transform: transform,
    json: json,
    add: add,
    update: update,
    compose: {
        shallow: shallow_compose,
        deep: deep_compose,
    },
    clone: {
        shallow: shallow_clone,
        deep: deep_clone,
    },
    is: {
        superset: (a, b) => d_contains_d(a, b),
        subset: (a, b) => d_contains_d(b, a),
    }
};
