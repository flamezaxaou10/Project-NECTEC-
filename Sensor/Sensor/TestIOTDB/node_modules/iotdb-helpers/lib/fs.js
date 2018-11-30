/*
 *  fs.js
 *
 *  David Janes
 *  IOTDB.org
 *  2016-11-23
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

const fs = require("fs");

const is_directory = path => {
    try {
        return fs.statSync(path).isDirectory();
    } catch (x) {
        return false;
    }
};

const is_file = path => {
    try {
        return fs.statSync(path).isFile();
    } catch (x) {
        return false;
    }
};

const remove_file = path => {
    try {
        fs.unlinkSync(path);
        return true;
    } catch (x) {
        return false;
    }
}

const remove_directory = path => {
    try {
        fs.rmdir(path);
        return true;
    } catch (x) {
        return false;
    }
}


/**
 *  API
 */
exports.fs = {
    is: {
        file: is_file,
        directory: is_directory,
        folder: is_directory,
    },
    remove: {
        file: remove_file,
        directory: remove_directory,
        folder: remove_directory,
        // recursive: remove_recursive_todo,
    },
};
