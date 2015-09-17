/**
 * Created at 15/9/14.
 * @Author Ling.
 * @Email i@zeroling.com
 */
var LoggerModel = require('../models/logger'),
    config = require('../config'),
    moment = require('moment');

moment.locale('zh-CN');

function check (username, password) {
    return config && config.username == username && config.password == password;
}

module.exports = function* (next) {
    if (this.path == '/seele/logout') {
        this.session.authed = null;
        return this.redirect('/seele/admin');
    }

    var body = this.request.body;

    if (this.method.toLowerCase() === 'post') {
        //登陆, 检查, 跳转
        if (check(body.username, body.password)) {
            this.session.authed = true;
        }
        return this.redirect('/seele/admin');
    } else if (this.session.authed) {
        //登陆的
        var loggerData = yield LoggerModel.find({plugin: 'kebiao'}, {}, {limit: 5, sort: {datetime: -1}}).exec();
        var showData = loggerData.map(function (log) {
            log.time = moment(log.datetime).format('YYYY年M月D日 HH:mm:ss');
            log.queryBody = JSON.stringify(log.queryBody);
            return log;
        });
        yield this.render('index', {title: 'koa-hbs', loggerData: showData});
    } else {
        //未登陆的
        yield this.render('login', {title: 'login'});
    }
};
