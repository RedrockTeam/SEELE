#!/usr/bin/env node

var KebiaoCore = require('../controllers/kebiao/kebiao');
var KebiaoModel = require('../controllers/kebiao/model');
var KebiaoConfig = require("../controllers/kebiao/config");

var map = [
    {start: 2012210001, end: 2012217193},
    {start: 2013210001, end: 2013214501},
    {start: 2014210001, end: 2014214570},
    {start: 2015210001, end: 2015214779}
];

map.forEach(function (chunk) {
    for (var itor = chunk.start; itor <= chunk.end; itor++) {
        var data = yield KebiaoCore(xh);
        if (data && data.success) {

        }
    }
});

//todo