#redapi-plugin-kebiao
-----
redapi 课表插件

重邮课表插件

```

HTTP方法: POST  
参数: stuNum(int) 学号  
返回格式: JSON  
正常代码: 200  
错误代码: -1: 内部错误  
		-10: 教务在线未正常返回或超时  
		-20: 学号输入错误  

配置文件在config.js里, 每学期要更新里面的数据噢, republish

rawCall使用方法: 

var kebiaoRawCall = require('redapi-plugin-kebiao').rawCall;
kebiaoRawCall(xh, week, function(errMsg, data){ //week === 0 表示全部
  //code here
});
 ```

bugfix 2015年05月25日
优化了jq写法 2015年05月26日

Author: Ling


2015年05月26日