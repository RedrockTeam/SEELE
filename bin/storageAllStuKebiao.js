#!/usr/bin/env node
var mongoose = require('mongoose');
var KebiaoCore = require('../controllers/kebiao/kebiao');
var KebiaoModel = require('../controllers/kebiao/model');
var config = require('../config');

var stuMap = [
    // {start: 2012210001, end: 2012217193},
    {start: 2013210001, end: 2013214501},
    {start: 2014210001, end: 2014214570},
    {start: 2015210001, end: 2015214779},
    {start: 2016210001, end: 2016215094}
];

function* getKebiao (num) {
    var data = yield* KebiaoCore(num);
    if (data && data.success) {
        var m = new KebiaoModel(data);
        m.save(function(err){
            if(err) return console.log(err);
            console.log('stu', data.stuNum, 'saved');
        });
    }
}

mongoose.connect(config.dsn, function (err) {
    if (err) {
        console.log("mongodb connect failed, detail:", err);
        process.exit(1);
    }
    console.log("mongodb connect success!");

    stuMap.forEach(function (gap) {
        (function run(stu, end) {
            if (stu > end) {
                console.log("all done");
                process.exit(0);
            }
            var gen = getKebiao(stu);

            function go (result) {
                if (result.done) {
                    return run(stu + 1, end);
                }
                result.value.then(function (r) {
                    go(gen.next(r));
                });
            }

            go(gen.next());
        })(gap.start, gap.end);
    });
});
