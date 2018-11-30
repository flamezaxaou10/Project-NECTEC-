/*
 *  id.js
 *
 *  David Janes
 *  IOTDB.org
 *  2014-02-03
 *
 *  Things related to identifiers
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

var crypto = require('crypto');
var path = require('path');
var url = require('url');
var node_uuid = require('uuid');

var _ = require("../helpers");

var random = require("./random").random;

var _safe = function(component) {
    return encodeURIComponent(component).replace('%', '$');
};


/**
 *  Make a canonical ID for a User.
 *  A user is simply identified by a URL.
 *  We do some _minor_ canonicalization,
 *  mainly to the hostname
 */
var user_urn = function(user_url) {
    var userp = url.parse(user_url);
    if ((userp.protocol === "http:") && (userp.port === '80')) {
        userp.host = userp.hostname;
    } else if ((userp.protocol === "https:") && (userp.port === '443')) {
        userp.host = userp.hostname;
    }

    user_url = url.format(userp);

    return "urn:iotdb:user:" + _.hash.md5(user_url);
};

var _identifier_to_parts = function (identifier) {
    if (!_.is.String(identifier)) {
        throw new Error("identitfier_to_*: expected a String");
    } else if (!identifier.match(/^[A-Za-z]/)) {
        throw new Error("identitfier_to_*: must start with a letter");
    } else if (identifier.match(/[^-_A-Za-z0-9]/)) {
        throw new Error("identitfier_to_*: must contain only letters, numbers, underscores and dashes");
    }

    var splits = identifier;
    splits = splits.replace(/([-_])/g, ' ');
    splits = splits.replace(/([A-Z]+)([A-Z][^A-Z0-9]|$)/g, ' $1 $2');
    splits = splits.replace(/([A-Z]+)([^A-Z])/g, ' $1$2');
    splits = splits.toLowerCase();

    var parts = [];
    splits.split(" ").map(function (part) {
        if (part && part.length) {
            parts.push(part);
        }
    });

    return parts;
};

/**
 *  Convert any string identifier to 'CamelCase'
 *
 *  @param {string} identifier
 *  Any identifier (in CamelCase, dash-case, or underscore_case)
 *
 *  @return {string}
 *  CamelCase version of the identifier
 */
var identifier_to_camel_case = function (identifier) {
    var parts = [];
    _identifier_to_parts(identifier).map(function (part) {
        parts.push(part.substring(0, 1).toUpperCase() + part.substring(1));
    });

    return parts.join("");
};

/**
 *  Convert any string identifier to 'dash-case'
 *
 *  @param {string} identifier
 *  Any identifier (in CamelCase, dash-case, or underscore_case)
 *
 *  @return {string}
 *  dash-case version of the identifier
 */
var identifier_to_dash_case = function (identifier) {
    return _identifier_to_parts(identifier).join("-");
};

/**
 *  Convert any string identifier to 'underscore_case'
 *
 *  @param {string} identifier
 *  Any identifier (in CamelCase, dash-case, or underscore_case)
 *
 *  @return {string}
 *  underscore_case version of the identifier
 */
var identifier_to_underscore_case = function (identifier) {
    return _identifier_to_parts(identifier).join("_");
};

/**
 *  Return a pretty safe string from an identifier
 */
var slugify = function (identifier) {
    identifier = identifier.toLowerCase();
    identifier = identifier.replace(/[^a-z0-9]/g, '_');
    identifier = identifier.replace(/_+/g, '_');

    return identifier;
};


/**
 *  Replace everything with "*"
 */
var obscure = function (value) {
    if (_.is.String(value)) {
        value = "" + value;
    }

    return value.replace(/./g, "*");
};

/**
 *  Return an iotdb style urn:iotdb:<prefix>:<remainder>.
 *  If remainder is not specified, we'll get a YouTube
 *  style ID
 */
var iotdb = function(prefix, remainder) {
    if (remainder === undefined) {
        remainder = random.short();
    }

    return "urn:iotdb:" + prefix + ":" + remainder;
};

/**
 *  Convert { "@id": "#on" }["@id"] to "on"
 */
const code_from_string = id => (id || "").replace(/^.*?#/, '');
const code_from_attribute = d => code_from_string((d || {})["@id"]);

const safe_encode = id => "_" + (new Buffer(id)).toString("hex");
const safe_decode = encoded_id => (new Buffer(encoded_id.substring(1), "hex")).toString();

/**
 *  Encode a complete object as base64
 */
const pack = o => 
    Buffer.from(JSON.stringify(o)).toString("base64")
        .replace(/\//g, '_')
        .replace(/[+]/g, '-');

/**
 *  Decode a base64 object
 */
const unpack = s => 
    JSON.parse(
        Buffer.from(s.replace(/_/g, "/").replace(/-/g, "+"), "base64").toString()
    )

exports.id = {
    user_urn: user_urn,
    to_camel_case: identifier_to_camel_case,
    to_dash_case: identifier_to_dash_case,
    to_underscore_case: identifier_to_underscore_case,
    slugify: slugify,
    obscure: obscure,
    safe: {
        encode: safe_encode,
        decode: safe_decode,
    },
    code: {
        from: {
            attribute: code_from_attribute,
            string: code_from_string,
        },
    },
    uuid: {
        v4: node_uuid.v4,
        iotdb: iotdb,
    },

    pack: pack,
    unpack: unpack,
};
