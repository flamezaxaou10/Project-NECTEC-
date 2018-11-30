# iotdb-helpers

Lots of useful functions, built as an overlay on underscore.

<img src="https://raw.githubusercontent.com/dpjanes/iotdb-homestar/master/docs/HomeStar.png" align="right" />

# Introduction

These are tons of little useful functions. If you're using [IOTDB](https://github.com/dpjanes/node-iotdb) this
_always_ comes along for free:

    const iotdb = require("iotdb");
    const _ = iotdb._;

If you need to use this stand-alone:

    const _ = require("iotdb-helpers");

Everything (well, 99%) is namespaced. For example, to access the `d` "dictionary" functions
you would do:

    _.d.get({ "a": { "b": 1 }}, "/a/b"); // returns "1"

# Sections
## Top Level

`_.noop` - do nothing
`_.make_error` - return a function that
## cfg

Configuration: find files and load them

## coerce

Coerce: change types of things, e.g. `"32"` -> `32`

## color

Color: color operations, such as RGB to HSV

## convert

Convert: unit of measure conversions, such as Celsius to Fahrenheit. 

## d

Dictionaries: manipuate dictionaries, such as getting nested values by path, compositing.

## error

Error: manipulate Error objects

## hash

Hash: hash stuff

## id

Id: create slugs, camel case, dash case, etc.

## is

Is: test types

## ld

Linked Data: work semantic web type LD data, where URIs are used as keys and multiple values may exist at keys

## logger

Loggger: log stuff (using Bunyan by default)

## net

Net: do network operations, such as getting IPv4 / IPv6 addresses

## q

Queue: queue operations

## random

Random: generate random numbers and strings

## timestamp

Timestamp: work with ISO datetimes, such as generating, adding to dictionaries, comparison.
