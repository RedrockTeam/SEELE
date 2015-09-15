/**
 * Created at 15/9/14.
 * @Author Ling.
 * @Email i@zeroling.com
 */
module.exports = function *(next) {
    var start = new Date;
    yield next;

    var ms = +(new Date - start);
    this.set('X-Response-Time', ms + 'ms');
};