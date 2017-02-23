// 重邮课表插件 Ling. ES6 2015-09-15
// 改了正则 Ming && Hangeer 2016-09-02
'use strict'; // ming


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
        uri: "http://jwzx.cqupt.edu.cn/jwzxtmp/kebiao/kb_stu.php?xh=" + xh,
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

    // console.log($('').html())
    /* tbNormal 是普通课表 */
    var tbNormal = $($('.printTable table')[0])

    tbNormal.find('tr').each(function (ntr, item) {
        if(ntr === 0 || ntr === 3 || ntr === 6) {
            return; // 无用的 tr 0 星期, 3 中午间歇, 6 下午间歇
        };
        $(this).find('td').each(function (ntd) {
            if(ntd == 0) {
                return; // 无用信息, 第一节第二节那一列
            }
            var item_element = $(this).html().split(/<hr>/g);
            stuKebiao[ntd - 1].push(item_element);
        });
    });

    try{
        for(var day = 0; day <= 6; day ++) {
            for (var course = 0; course <= 5; course++) {

                stuKebiao[day][course].forEach(function (self, n){

                    

                    var courseInfo = self.split(/<[\s\S]*?>/);
                    if (!courseInfo[1]) return; // 空数组返回
                    /*
                    courseInfo :
                        0   [ 'SK16181',
                        1     '010801 -微处理器系统结构与嵌入式系统设计（1）',
                        2     '地点：逸夫楼YF101 ',
                        3     '1周,6-8周,13-16周',
                        4     '3节连上',
                        5     ' ',
                        6     '',
                        7     '夏绪玖 必修 3.5学分',
                        8     '' ]
                     */

                    var weekInfo = parseWeek(courseInfo[3]);

                    var teacherAndType = courseInfo[7].split(' '); 
                    // ['夏绪玖', '必修', '3.5学分''] // 无教师的情况下, 1 为 ''



                    var course_num = courseInfo[1].match(/[^-]+/);
                    course_num = typeof course_num[0] === 'string' ? course_num[0].trim() : '';

                    var d = {
                        hash_day: day,
                        hash_lesson: course,
                        begin_lesson: 2 * course + 1,
                        day: hash_day[day],
                        lesson: hash_course[course],
                        course: courseInfo[1].replace(/[\s\S]+-/, ''),
                        course_num: course_num, //课程号
                        teacher: teacherAndType[0],
                        classroom: courseInfo[2].replace('地点：', "").trim(),
                        rawWeek: courseInfo[3],
                        weekModel: weekInfo.weekModel || 'all',
                        weekBegin: weekInfo.weekBegin || 1,
                        weekEnd: weekInfo.weekEnd || 17,
                        week: weekInfo.week || [],
                        type: teacherAndType[1],
                        period: judgePeriod(courseInfo[4])
                    };

                    // 暂时解决体育课没名字的情况
                    if(d.course === '') {
                        if(d.classroom === '运动场') {
                            d.course = '体育课';     
                        } else {
                            d.course = courseInfo[1].replace(/-/, '').trim();
                        }
                    }




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
    if(str === '3节连上') return 3;
    if(str === '4节连上') return 4;
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