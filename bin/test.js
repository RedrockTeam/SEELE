/**
 * Created at 16/3/5.
 * @Author Ling.
 * @Email i@zeroling.com
 */
var KebiaoCore = require('../controllers/kebiao/kebiao');

var args = process.argv.splice(2).map(v => ~~v);
// console.log(args);

function* getKebiao (num) {
    var data = yield* KebiaoCore(num);

    console.info(data);
    if(data.data) console.log( '课数', data.data.length);
    return data;
}

function runGen(genF, args) {
    args = args || [];
    var gen = genF.apply(this, args);

    function run(result) {
        if (result.done)  {
            return;
        }
        result.value.then(function (r) {
            run(gen.next(r));
        });
    }

    run(gen.next());
}
var stuNum =  args.length ? args : [2014210014];
runGen(getKebiao, stuNum);