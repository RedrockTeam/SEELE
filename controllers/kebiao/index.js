/**
 * Created at 15/9/14.
 * @Author Ling.
 * @Email i@zeroling.com
 */

var KebiaoCore = require('./kebiao');
var KebiaoModel = require('./model');
var KebiaoConfig = require("./config");
var queryLoop = [];

module.exports = function* (next) {
    this.set('Access-Control-Allow-Origin', 'http://hongyan.cqupt.edu.cn'); //CORS
    var body = this.request.body;

    var xh = body.stuNum || body['stu_num'],
        week = parseInt(body['week']);
    var data = yield kebiao(xh, week);
    if (data._id) {
        this.set('X-Cached', data._id);
        delete data._id;
        delete data.__v;
    }
    this.body = data;
};

/**
 * 插件主函数generator
 */
function* kebiao (xh, week) {
    week = week || 0;
    if(!xh || parseInt(xh) != xh) {	//NaN or parseInt截断的情况
        return this.body = {
            success: false,
            info: "stuNum not allowed"
        };
    }
    var kbInDb = yield KebiaoModel.findOne({stuNum: xh}, null, {sort: [{'outOfDateTimestamp': -1}]}).exec();

    if ( !kbInDb || kbInDb.outOfDateTimestamp < new Date().getTime() ){
        var data = kbInDb = yield KebiaoCore(xh);
        if (!data || !data.success)
            return this.body = data;
        //Mongodb STORAGE
        if(data.data && data.data.length !== 0) {
            var options = {expire: KebiaoConfig.mongodbExpire};
            data.cachedTimestamp = new Date().getTime();
            data.outOfDateTimestamp = data.cachedTimestamp + options.expire;
            new KebiaoModel(data).save();
        }
        //End storage
    } else {
        kbInDb = kbInDb.toObject();
    }

    kbInDb.nowWeek = KebiaoCore.getNowWeek();
    kbInDb.data = weekFilter(week, kbInDb.data);
    return kbInDb;
}

function weekFilter(week, arr){
    week = parseInt(week) || 0;
    return arr.filter(function (item) {
        if(week == 0) return true;
        return item.week.indexOf(week) > -1;
    });
}