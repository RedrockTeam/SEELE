/**
 * Created at 15/9/14.
 * @Author Ling.
 * @Email i@zeroling.com
 */

var LoggerModel = require('../models/logger');

module.exports = function* (next) {
    yield next;
    var logObj = {
        plugin: this.request.plugin,
        queryBody: this.request.body,
        datetime: +new Date,
        useCache: !!this.response.get('X-Cached'),
        responseTime: parseInt(this.response.get('X-Response-Time'))
    };
    new LoggerModel(logObj).save();
};