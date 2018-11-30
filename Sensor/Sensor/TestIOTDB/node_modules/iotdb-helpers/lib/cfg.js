/*
 *  cfg.js
 *
 *  David Janes
 *  IOT.org
 *  2014-03-15
 *
 *  Configuration helpers
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

const assert = require("assert");
const _ = require("iotdb-helpers");

const node_path = require('path');
const node_fs = require('fs');

/**
 *  Expand any $VARIABLE type substring in <code>string</code>
 *  with the corresponding value from <code>envd</code>
 *
 *  @param {string} string
 *  the string to do replacements on
 *
 *  @param {dictionary} envd
 *  keys & values for substitution
 *
 *  @return {string}
 *  the string with replacements done
 */
const cfg_expand = (v, envd) => v.replace(/[$]([A-Za-z_0-9]+)/g, (match, variable) => (envd || process.env)[variable] || "");

/**
 *  Look for files along a series of paths
 *
 *  @param {array|string} paths
 *  directories to look at (will use {@link cfg_expand} substitution).
 *  If a string, the string will be split using Node's <code>path.delimiter</code>
 *
 *  @param {string} name
 *  the name of the file to look for. May be a regular expression
 *
 *  @param {dictionary} paramd
 *
 *  @param {boolean} paramd.expand
 *  Use {@link cfg_expand} on paths (default: true)
 *
 *  @param {boolean} paramd.dotfiles
 *  Return files beginning with '.' in the results (default: false).
 *  Note that '.' and '..' are never returned
 */
const cfg_find = function (paths, name, paramd) {
    const _ = require("..");
    const logger = _.logger.make({
        name: 'iotdb-helpers',
        module: 'cfg',
    });

    paramd = _.defaults(paramd, {
        expand: true,
        dotfiles: false
    });

    if (_.is.String(paths)) {
        paths = paths.split(node_path.delimiter);
    }

    const results = [];

    const _list_files = (path, callback) => {
        const is_recursive = path.match(/[\/][\/]$/);

        node_fs.readdirSync(path)
            .sort()
            .filter(file => paramd.dotfiles || file.match(/^[^.]/))
            .forEach(file => {
                const subpath = node_path.join(path, file);
                const subpath_stbuf = node_fs.statSync(subpath);
                if (subpath_stbuf.isFile()) {
                    callback(subpath, file);
                } else if (is_recursive && subpath_stbuf.isDirectory()) {
                    _list_files(subpath + "//", callback);
                }
            })
    };

    const _find_path_list = function (path) {
        _list_files(path, function (subpath, file) {
            if (!name) {
                results.push(subpath);
            } else if (file.match(name)) {
                results.push(subpath);
            }
        });
    };

    const _find_path_name = function (path) {
        const filepath = node_path.join(path, name);
        if (node_fs.existsSync(filepath)) {
            results.push(filepath);
        }
    };

    const _is_directory = path => {
        try {
            return node_fs.statSync(path).isDirectory();
        } catch (x) {
            return false;
        }
    };

    paths
        .map(path => paramd.expand ? cfg_expand(path) : path)
        .filter(_is_directory)
        .forEach(path => {
            if (!name || _.is.RegExp(name)) {
                _find_path_list(path);
            } else {
                _find_path_name(path);
            }
        });

    return results;
};

const _work = function (filenames, callback, worker) {
    var first_doc = null;

    for (var fi in filenames) {
        var cd = {
            filename: filenames[fi],
            end: fi === filenames.length - 1,
        };

        try {
            worker(cd);

            if (first_doc === null) {
                first_doc = cd.doc;
            }
        } catch (x) {
            cd.error = "exception reading file";
            cd.exception = x;
        }

        if (callback(cd)) {
            break;
        }
    }

    return first_doc;
};

/**
 *  Load JSON files and call the callback
 *
 *  @param {array} filenames
 *  An array of filenames, as returned by {@link cfg_find}.
 *
 *  @param {function} callback
 *  Callback with a single dictionary argument <code>paramd</code>.
 *  If the JSON document is read it will be passed as <code>paramd.doc</code>.
 *  If there is an error it will be in <code>paramd.error</code>
 *  If there is an exception asssociated with the error, it
 *  will be in <code>paramd.exception</code>. The filename will
 *  be in <code>paramd.filename</code>.
 *  <p>
 *  If the callback returns <code>true</code>, we're finished
 *
 *  @return
 *  The first document successfully read
 */
const cfg_load_json = function (filenames, callback) {
    return _work(filenames, callback, function (cd) {
        cd.doc = JSON.parse(node_fs.readFileSync(cd.filename, {
            encoding: 'utf8'
        }));
    });
};

/**
 *  Load files and call the callback.
 *
 *  @param {array} filenames
 *  An array of filenames, as returned by {@link cfg_find}.
 *
 *  @param {string} encoding
 *  OPTIONAL The encoding. If not specified, we use 'utf-8'
 *
 *  @param {function} callback
 *  Callback with a single dictionary argument <code>paramd</code>.
 *  If the document is read it will be passed as <code>paramd.doc</code>.
 *  If there is an error it will be in <code>paramd.error</code>
 *  If there is an exception asssociated with the error, it
 *  will be in <code>paramd.exception</code>. The filename will
 *  be in <code>paramd.filename</code>.
 *  <p>
 *  If the callback returns <code>true</code>, we're finished
 *
 *  @return
 *  The first document successfully read
 */
const cfg_load_file = function (filenames, encoding, callback) {
    const _ = require("..");

    if (_.is.Function(encoding)) {
        callback = encoding;
        encoding = "utf-8";
    }

    return _work(filenames, callback, function (cd) {
        cd.doc = node_fs.readFileSync(cd.filename, {
            encoding: encoding
        });
    });
};

/**
 *  Load Javascript/Node modules and call the callback.
 *
 *  @param {array} filenames
 *  An array of filenames, as returned by {@link cfg_find}.
 *
 *  @param {string} encoding
 *  OPTIONAL The encoding. If not specified, we use 'utf-8'
 *
 *  @param {function} callback
 *  Callback with a single dictionary argument <code>paramd</code>.
 *  If the document/module is read it will be passed as <code>paramd.doc</code>.
 *  If there is an error it will be in <code>paramd.error</code>
 *  If there is an exception asssociated with the error, it
 *  will be in <code>paramd.exception</code>. The filename will
 *  be in <code>paramd.filename</code>.
 *  <p>
 *  If the callback returns <code>true</code>, we're finished
 *
 *  @return
 *  The first document successfully read
 */
const cfg_load_js = function (filenames, callback) {
    return _work(filenames, callback, function (cd) {
        cd.doc = require(node_path.resolve(cd.filename));
    });
};

const _paths = () => {
    const paths = [];
    let current_folder = process.cwd();

    while (true) {
        const candidate_folder = node_path.join(current_folder, "node_modules");

        try {
            const stbuf = node_fs.statSync(candidate_folder);
            if (stbuf.isDirectory()) {
                paths.push(candidate_folder);
            }
        } catch (x) {
        }

        const next_folder = node_path.normalize(node_path.join(current_folder, ".."));
        if (next_folder === current_folder) {
            break;
        }

        current_folder = next_folder;
    }

    return paths;
};

const cfg_modules = () => 
    _.flatten(_paths().map(folder => 
        node_fs.readdirSync(folder)
            .map(name => ({ 
                name: name,
                path: node_path.join(folder, name),
            }))
    )).filter(md => md.name.match(/^(homestar|iotdb)-/));

/**
 *  API
 */
exports.cfg = {
    expand: cfg_expand,
    find: cfg_find,
    load: {
        json: cfg_load_json,
        file: cfg_load_file,
        js: cfg_load_js,
    },
    modules: cfg_modules,
};
