/**
 * Created at 15/9/14.
 * @Author Ling.
 * @Email i@zeroling.com
 */

var LoggerModel = require('../models/logger');

module.exports = function* (next) {
    yield next;
    var log = new LoggerModel({
        plugin: this.request.plugin,
        queryBody: this.request.body,
        datetime: +new Date,
        useCache: !!this.response.get('X-Cached'),
        responseTime: parseInt(this.response.get('X-Response-Time'))
    });
    console.log(log);
    //todo 存数据库
};