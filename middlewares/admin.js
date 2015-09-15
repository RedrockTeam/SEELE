/**
 * Created at 15/9/14.
 * @Author Ling.
 * @Email i@zeroling.com
 */

var config = require('../config');

function check (username, password) {
    return config && config.username == username && config.password == password;
}

module.exports = function* (next) {
    if (this.path == '/logout') {
        this.session.authed = null;
        return this.redirect('/admin');
    }

    var body = this.request.body;

    if (this.method.toLowerCase() === 'post') {
        //登陆, 检查, 跳转
        if (check(body.username, body.password)) {
            this.session.authed = true;
        }
        return this.redirect('/admin');
    } else if (this.session.authed) {
        //登陆的
        yield this.render('index', {title: 'koa-hbs'});
    } else {
        //未登陆的
        yield this.render('login', {title: 'login'});
    }
};
