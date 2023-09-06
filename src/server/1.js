const child_process = require('child_process');
const path = require('path');
// const exec = child_process.exec;
// exec('node index.js',{
//   cwd:path.resolve(__dirname)
// }, (error, stdout, stderr) => {
//   console.log('error',error);
//   console.log('stderr',stderr);
//   console.log('stdout',stdout);
  
// });
// var workerProcess = child_process.exec(`node index.js ${JSON.stringify({data:{a:1}})}`, {cwd:path.resolve(__dirname)});

// workerProcess.stdout.on('data', function (data) {
//     console.log('stdout: ' + data);
// });

// workerProcess.stderr.on('data', function (data) {
//     console.log('stderr: ' + data);
// });
// exec(`node ${__dirname}/index.js`, function (error, stdout, stderr) {
//   if (error) {
//     console.log('Error code: ' + error);
//     return;
//   }
//   console.log('使用exec方法输出: ' + stdout);
//   console.log(`stderr: ${stderr}`);
//   console.log(process.pid);
// });
console.log(__dirname);
const target = '';
const json = {
  '/tenant': {
    target: target,
    changeOrigin: true
  },
  '/operation': {
    target: target,
    changeOrigin: true
  },
  '/eai/*/*': {
    target: target,
    changeOrigin: true
  },
  '/eai/*': {
    target: target,
    changeOrigin: true
  },
  '/i18n/api': {
    target: target,
    changeOrigin: true
  }
};
// const data = {
//   target:'http://uat.eai.sunyur.com/',
//   config:`{
//     '/tenant': {
//       target: target,
//       changeOrigin: true
//     },
//     '/operation': {
//       target: target,
//       changeOrigin: true
//     },
//     '/eai/*/*': {
//       target: target,
//       changeOrigin: true
//     },
//     '/eai/*': {
//       target: target,
//       changeOrigin: true
//     },
//     '/i18n/api': {
//       target: target,
//       changeOrigin: true
//     }
//   }`
// };
// const c = data.target;
// const config = data.config.replace(/target/,target);
// const config = JSON.parse(data.config.replace(/\'/g,'"').replace(/:target/,`:${c}`));
// console.log('target',target);
// console.log('config',config);
const a = JSON.stringify({
  '/tenant': {
    target: target,
    changeOrigin: true
  },
  '/operation': {
    target: target,
    changeOrigin: true
  },
  '/eai/*/*': {
    target: target,
    changeOrigin: true
  },
  '/eai/*': {
    target: target,
    changeOrigin: true
  },
  '/i18n/api': {
    target: target,
    changeOrigin: true
  }
}
);
console.log('a',a);