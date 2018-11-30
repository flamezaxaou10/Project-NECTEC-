# iotdb-errors
IOTDB Module that defines all sorts of useful Error exceptions, 
with HTTP status codes built in.

<img src="https://raw.githubusercontent.com/dpjanes/iotdb-homestar/master/docs/HomeStar.png" align="right" />

# Installation

If you installed [Home☆Star](https://github.com/dpjanes/iotdb-homestar) you've
already got it.

If you want to use this stand-alone:

    $ npm install iotdb-errors

# Exceptions defined

* Internal (500)
* Invalid (403) - something is improperly formatted
* MethodNotAllowed (405) - e.g. doing a PUT where only GET is allowed
* NeverImplemented (501)
* NotAppropriate (403) - expecting a thing and got a recipe
* NotAuthorized (401)
* NotFound (404)
* NotImplemented (501)
* ShouldBeImplementedInSubclass (501)
* ServiceNotAvailable (503) - e.g. we're connecting to Redis and it doesn't work
* SetupRequired (500)
* Timestamp (409) - the timestamp is out of date

# Use

Just do the usual

    const errors = requre("iotdb-errors");

    throw new errors.NotImplemented()

If you want to get the error code

    error = errors.NotImplemented()
    error.code

If you've got [iotdb](https://iotdb.org) installed, there's a
few helper functions for working with exceptions which may or 
may not be from this module, may not exist at all, etc..

    const iotdb = require("iotdb")
    const _ = iotdb._;

    _.error.code(error)             // will return code, 500 if no code defined
    _.error.code(error, 404)        // will return code, 404 if no code defined
    _.error.message(error)          // will return the message, or null
    _.error.message(error, "woah")  // will return the message, or "woah"
