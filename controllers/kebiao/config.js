/**
 * Created by Liuchenling on 5/4/15.
 */
module.exports = {
	version: "16.9.4",
    // defaultTerm: '2015-2016学年第2学期',
    // defaultTerm: '2016-2017学年第1学期',
    defaultTerm: '2016-2017学年第2学期',
    mongodbExpire: 30 * 24 *  3600 * 1000,// mongodb 缓存时间
    termStart: new Date(2017, 2, 27) // 每学期修改，开学第一周的星期一的日子，年，月，日，第二个参数0表示一月份。
};
