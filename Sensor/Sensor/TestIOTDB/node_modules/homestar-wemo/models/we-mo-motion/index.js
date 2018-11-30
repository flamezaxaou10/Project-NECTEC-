/*
 *  WeMoMotion.js
 *
 *  David Janes
 *  IOTDB
 *  2015-03-01
 *
 *  NOTE: NOT TESTED
 */

const iotdb = require("iotdb");

exports.binding = {
    bridge: require('../../WeMoBridge').Bridge,
    model: require("./model.json"),
    matchd: {
        'iot:vendor.type': 'urn:Belkin:device:sensor:1',
    },
    connectd: {
        subscribes: [
            'urn:Belkin:service:basicevent:1',
        ],

        data_in: function(paramd) {
            var valued = paramd.rawd['urn:Belkin:service:basicevent:1'];
            if (valued !== undefined) {
                if (valued.BinaryState === '1') {
                    paramd.cookd.motion = true;
                } else if (valued.BinaryState === '0') {
                    paramd.cookd.motion = false;
                }
            }
        },
    },
};
