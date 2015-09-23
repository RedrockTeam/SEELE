/**
 * Created at 15/9/14.
 * @Author Ling.
 * @Email i@zeroling.com
 */
require('oneapm');
//load ONEAPM

var koa = require('koa'),
    config = require('./config'),
    Route = require('koa-route'),
    session = require('koa-session'),
    hbs = require('koa-hbs'),
    mongoose = require('mongoose'),
    parse = require('co-body'),
    fs  = require('co-fs'),
    app = koa();

var responseTime = require('./middlewares/responseTime'),
    logger = require('./middlewares/logger'),
    admin = require('./middlewares/admin');

app.keys = ['iLoveSeele'];

//middlewares
//1. logger
app.use(logger);

//2. 响应时间
app.use(responseTime);

//3.body parser
app.use(function* (next) {
    this.request.body = yield parse.form(this);
    yield next;
});
//4. session
app.use(session(app));

//5. ready hbs
app.use(hbs.middleware({
    viewPath: __dirname + '/views'
}));

//check plugins
var plugins = [];
config.enabledPlugins.forEach(function (plugin) {
    var handler = require(__dirname + '/controllers/' + plugin);
    plugins.push({
        name: plugin,
        handler: handler,
        method: handler.method || 'post'
    });
});
//load plugins
plugins.forEach(function (plugin) {
    app.use(Route[plugin.method]('/seele/api/'  + plugin.name, function* (next) {
        this.request.plugin = plugin.name;
        yield plugin.handler;
        yield next;
    }));
    console.log('Plugin %s is ready, using %s method.', plugin.name, plugin.method);
});

app.use(Route.get(['/seele/logout', '/seele/admin'], admin));
app.use(Route.post('/seele/admin', admin));

//Connect MongoDB
mongoose.connect(config.dsn);

app.listen(config.port || 3000);