let httpProxy = require('http-proxy');
// 新建一个代理 Proxy Server 对象
let proxy = httpProxy.createProxyServer({});
 
// 捕获异常
// eslint-disable-next-line max-params
proxy.on('error', function (err, req, res, end ) {
 res.writeHead(500, {
 'Content-Type': 'text/plain'
 });
 res.end('服务错误');
});
 

let server = require('http').createServer(function(req, res) {
  
 proxy.web(req, res, { target: 'http://localhost:9080',xfwd : 'true' });
});
 

server.listen(3722,()=>{
  console.log('process.argv',process.argv);
  console.log("服务已开启:3721");
});
