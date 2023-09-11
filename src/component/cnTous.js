import http from 'http'
import md5 from 'md5'
function translateCNToUS (word) {
  // 申请的key和secret
  const Key = '1af4484fbe2ba50d'
  const Secret = 'di77K9dqVcIsNRPr7b8QULyhuPmSQ25v'

  // 随机数
  const salt = Math.random()
  // 生成签名
  const sign = md5(Key + word + salt + Secret)

  const baseUrl = 'http://openapi.youdao.com/api'

  // 拼接请求url
  const url = baseUrl + '?from=zh-CHS&to=EN&appKey=' + Key + '&salt=' + salt + '&sign=' + sign + '&q=' + encodeURI(word)

  // 发送http GET请求
  return new Promise(resolve => {
    http.get(url, function (req, res) {
      let returns = ''
      req.on('data', function (data) {
        returns += data
      })
      req.on('end', function () {
        let result = []
        returns = JSON.parse(returns)
        if (returns.errorCode == 0) {
          result = returns.translation
        }
        // 根据返回结果，去所需进行处理
        resolve(result[0])
      })
    })
  })
}
export default translateCNToUS
