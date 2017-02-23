/**
 * Created by Liuchenling on 5/4/15.
 */
module.exports = {
	version: "16.9.4",
    defaultTerm: '2016-2017学年第2学期',
    mongodbExpire: 30 * 24 *  3600 * 1000,// mongodb 缓存时间
    termStart: new Date(2017, 2, 27), // 每学期修改，开学第一周的星期一的日子，年，月，日，第二个参数0表示一月份。
    stuMap: [     // 学生学号 bin/storage......里面要用的, 爬所有课表写来
      {start: 2013210001, end: 2013214501},
      {start: 2014210001, end: 2014214570},
      {start: 2015210001, end: 2015214779},
      {start: 2016210001, end: 2016215094}
    ]
};
