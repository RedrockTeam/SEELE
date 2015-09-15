/**
 * Created by Liuchenling on 5/4/15.
 */
module.exports = {
	version: "15.9.16",
    defaultTerm: '2015-2016学年1学期',
    mongodbExpire: 2 * 24 * 3600 * 1000,// mongodb 缓存时间
    termStart: new Date(2015, 8, 7) // 每学期修改，开学第一周的星期一的日子，年，月，日，第二个参数0表示一月份。
};
