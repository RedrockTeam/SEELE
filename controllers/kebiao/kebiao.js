// 重邮课表插件 Ling. ES6 2015-09-15
// 改了正则 Ming && Hangeer 2016-09-02

var cheerio = require('cheerio'),
    rp = require('request-promise'),
    iconv = require('iconv-lite'),
    kebiaoModel = require('./model'),
    config = require('./config');

var version = config.version;
var defaultTerm = config.defaultTerm;

/**
 * mongodb 缓存时间
 */
var mongodbExpire = config.mongodbExpire || 30 * 24 * 3600 * 1000;

/**
 * 每学期修改，开学第一周的星期一的日子，年，月，日，第二个参数0表示一月份。
 * 以便返回当前周数
 */
var TERM_START = config.termStart; //有坑, 看上面注释

/**
 * 返回当前周，必须配置TERM_START变量
 */
function getNowWeek(callback){
    var w = Math.ceil((new Date() - TERM_START)/(1000*3600*24*7));
    callback && callback(w);
    return w;
}
KebiaoCore.getNowWeek = getNowWeek;

var hash_day = ["星期一","星期二","星期三","星期四","星期五","星期六","星期日"];
var hash_course = ["一二节","三四节","五六节","七八节","九十节","十一二"];

/**
 * 课表获取主函数, 回调型
 * @param  {Number}   xh       [学号]
 * @param  {Number}   week       [周数]
 */
var fs = require('fs');
function* KebiaoCore (xh) {
        if(!xh) return {success: false, info: "wrong xh"};

    var remoteResponse = yield rp({
        uri: "http://jwzx.cqupt.edu.cn/jwzxtmp/showKebiao.php?type=student&id=" + xh,
        // uri: "http://jwzx.cqupt.edu.cn/pubStuKebiao.php?&xh=" + xh,
        encoding: null
    }).then(function (body) {
        // return iconv.decode(body, 'GBK');
        return body;
    });

    var $ = cheerio.load(remoteResponse, {
        ignoreWhitespace: true,
        decodeEntities: false //坑啊！！！
    });
    var resultData = [],
        stuKebiao = [[],[],[],[],[],[],[]];

    /* tbNormal 是普通课表 */
    var tbNormal = $($('table')[0]);
    tbNormal.find('tr').each(function (ntr) {
        if(ntr === 0 || ntr === 3 || ntr === 6) {
            return; // 无用的 tr 0 星期, 3 中午间歇, 6 下午间歇
        };

        $(this).find('td').each(function (ntd) {
            if(ntd == 0) {
                return; // 无用信息, 第一节第二节那一列
            }

            // var item_element = $(this).html().split(/<font color=\"336699\">([\w\u4e00-\u9fa5]*)<\/font><br>/g);
            var item_element = $(this).html().split(/<hr>/g);
            console.log(item_element);
            stuKebiao[ntd - 1].push(item_element);
        });
    });

    console.log(stuKebiao[1]);
    try{
        for(var day = 0; day <= 6; day ++) {
            for (var course = 0; course <= 5; course++) {
                var cache;

                stuKebiao[day][course].forEach(function (self, n){

                    /*if(n % 2){
                        cache.period = judgePeriod(self);
                        return resultData.push(cache);
                    }*/
                    // var c = self.toString().split(/<\w*>/g);
                    var courseInfo = self.toString().split(/<br>/g).filter((v, index) => {
                        return v !== '<br>';
                    });
                    courseInfo = courseInfo.map((item, index) => {
                        return item.replace(/<\/*[\s\S]+?>/g, ' ').trim();
                    })
                    /*
                    courseInfo: [ 
                        'SK16181',
                        '010801 -微处理器系统结构与嵌入式系统设计（1）',
                        '地点：逸夫楼YF101',
                        '1周,6-8周,13-16周 3节连上',
                        '夏绪玖 必修 3.5学分' ]
                     */
                    
                    // console.log(courseInfo);
                    if (!courseInfo[1]) return; // 空数组返回
                    // var w = parseWeek(c[5]);
                    // console.log(c);
                    var weekInfo = parseWeek(courseInfo[3].split(' ')[0]);
                    // console.log(courseInfo[2]);

                    var d = {
                        hash_day: day,
                        hash_lesson: course,
                        begin_lesson: 2 * course + 1,
                        day: hash_day[day],
                        lesson: hash_course[course],
                        // course: c[1],
                        course: courseInfo[1].split('-')[1], // 课程名
                        // teacher: c[2] && c[2].trim(),
                        teacher: courseInfo[4].split(' ')[0],  // 教师
                        classroom: courseInfo[2].replace('地点：', ""), // 教室
                        // rawWeek: c[5],
                        rawWeek: courseInfo[3].split(' ')[0],
                        weekModel: weekInfo.weekModel || 'all',
                        weekBegin: weekInfo.weekBegin || 1,
                        weekEnd: weekInfo.weekEnd || 17,
                        week: weekInfo.week || [],
                        // type: $("<div>" + c[4] + "</div>").text(),
                        type: courseInfo[4].split(' ')[1],     //
                        // status: c[6] && c[6].split('选课状态:')[1]
                        status: '正常'    // 选课状态, 该字段在教务在线已无
                    };
                    d.period = judgePeriod(courseInfo[3].split(' ')[1]);
                    resultData.push(d);
                });
            }
        }
    }catch(e){
        console.log('Parse error: ', e);
        return {success: false, info: "Parse error"};
    }
    return resultWrapper({xh: xh}, resultData);
}

function judgePeriod(str){
    if(str === '连上三节') return 3;
    if(str === '连上四节') return 4;
    return 2;
}

/**
 * Ver. 2015年09月17日
 * 工具函数, 用来解析周数, 默认行课周1 - 18周
 * @param  {String} str [eg. '1-17周单周']
 * @return {Array}     [返回一个数组, 里面包含了上课的周数]
 */
function parseWeek (str) {
    if(!str || typeof str != 'string')return;

    str = str.replace(/第/g, '').replace(/,/g, ',');
    var model, begin, end, t, week = [];

    if(str.match(/\.|,/)){
        var strArr = str.split(/\.|,/);
        var resultArr = [], _w = [];
        for(var i = 0, len =  strArr.length; i < len; i++){
            if (!strArr[i]) continue;
            var _p = parseWeek(strArr[i]);
            resultArr[i] = _p;
            _w = _w.concat(_p.week);
        }

        resultArr[0].week = _w;
        resultArr[0].weekEnd = _w[_w.length - 1];
        return resultArr[0];
    }

    t = str.split('-');
    begin = parseInt(t[0]);
    end = parseInt(t[1]);

    if(begin && !end && !str.match('起')) return {
        week: [begin],
        weekModel: 'all',
        weekBegin: begin,
        weekEnd: begin
    };

    begin = begin || 1;
    end = end || 18;
    if(str.indexOf('双') >= 0){
        model = 'double';
        begin = begin % 2 == 0 ? begin : begin + 1;
        for(var i = begin; i <= end; i += 2)
            week.push(i);
    }else if(str.indexOf('单') >= 0){
        model = 'single';
        begin = begin % 2 == 1 ? begin : begin + 1;
        for(var i = begin; i <= end; i += 2)
            week.push(i);
    }else{
        model = 'all';
        for(var i = begin; i <= end; i ++)
            week.push(i);
    }
    return {
        week: week,
        weekModel: model,
        weekBegin: begin,
        weekEnd: end
    };
}

function weekFilter(week, arr){
    week = parseInt(week) || 0;
    return arr.filter(function (item) {
        if(week == 0) return true;
        return item.week.indexOf(week) > -1;
    });
}

function resultWrapper (option, arr) {
    return {
        status: 200,
        success: true,
        version: version,
        term: defaultTerm,
        stuNum: option.xh,
        data: weekFilter(0, arr)
    };
}

module.exports = KebiaoCore;