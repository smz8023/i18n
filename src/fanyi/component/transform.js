const http = require('http');
const md5 = require('md5');
function translateCNToUS(word) {
  // 申请的key和secret
  let Key = '1af4484fbe2ba50d';
  let Secret = 'di77K9dqVcIsNRPr7b8QULyhuPmSQ25v';

  // 随机数
  let salt = Math.random();
  // 生成签名
  let sign = md5(Key + word + salt + Secret);

  let baseUrl = 'http://openapi.youdao.com/api';

  // 拼接请求url
  let url = baseUrl + '?from=zh-CHS&to=EN&appKey=' + Key + '&salt=' + salt + '&sign=' + sign + '&q=' + encodeURI(word);

  // 发送http GET请求
  return new Promise(resolve => {
    http.get(url, function (req, res) {
      var returns = '';
      req.on('data', function (data) {
        returns += data;
      });
      req.on('end', function () {
        let result = [];
        returns = JSON.parse(returns);
        if (returns.errorCode == 0) {
          result = returns.translation;
        }
        // 根据返回结果，去所需进行处理
        resolve(result[0]);
      });
    });
  });
}
module.exports = { translateCNToUS };