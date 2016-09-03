/**
 * Created at 16/3/5.
 * @Author Ling.
 * @Email i@zeroling.com
 */
var KebiaoCore = require('../controllers/kebiao/kebiao');

function* getKebiao (num) {
    var data = yield* KebiaoCore(num);
    console.log(data);
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
runGen(getKebiao, [2014210014]);