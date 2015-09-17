/**
 * Created at 15/9/15.
 * @Author Ling.
 * @Email i@zeroling.com
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var log = new Schema({
    plugin: String,
    queryBody: Object,
    datetime: Number,
    useCache: Boolean,
    responseTime: Number
});

module.exports = mongoose.model('logger', log);

