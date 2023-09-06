import path = require("path");

const htmlparser2 = require('htmlparser2');
const { translateCNToUS } = require('./transform.js');
const fs = require('fs');
const Chinese = /[\u4e00-\u9fa5]+/;

const stringToCode = (code: any, value: (args: any) => any, params: any) => {
  const result = { value, error: '' };
  try {
    result.value = new Function('context', `return ${code}`)(params) || value; // eslint-disable-line no-new-func
  } catch (e) {
    console.error('js脚本错误：', e);
    result.error = 'js脚本错误';
  }
  return result;
};
const runFnInVm = (code: string, params?: any, globalParams?: undefined) => {
  const NOOP = (args: any) => args;
  const result = stringToCode(code, NOOP, globalParams);
  const fn = result.value;
  result.value = params;
  if (result.error) {
    return result;
  }
  if (typeof fn !== 'function') {
    // console.error('非法的js脚本函数', fn);
    result.error = '非法的js脚本函数';
    return result;
  }
  try {
    result.value = fn.call(fn, params);
  } catch (e) {
    console.error('js脚本执行错误：', e);
    result.error = 'js脚本执行错误：';
  }
  return result;
};
let fyjson = {} as any;
let isscript = '';
const chouqu = async (data: any, url: { path: string }) => {
  const datas = data;
  const parser = new htmlparser2.Parser({
    async onopentag(name: string, attributes: any) {
      if (Chinese.test(attributes.placeholder)) {

        fyjson[attributes.placeholder] = attributes.placeholder;
      }
      if (Chinese.test(attributes.label)) {
        fyjson[attributes.label] = attributes.label;
      }
      if (Chinese.test(attributes.title)) {

        fyjson[attributes.title] = attributes.title;
      }
      if (Chinese.test(attributes.content)) {

        fyjson[attributes.content] = attributes.content;
      }
      if (name === 'script') {
        isscript = name;
      }
    },
    async ontext(text: string) {
      if (Chinese.test(text)) {
        if (isscript === '') {
          
          const key = text.replace(/(\s*)|(\n)/g, '').replace(/(\s*)({*}*)/g,"");
          if (key.indexOf('$') > -1) {
            return;
          }
          if (key.indexOf("{{")) {
            const v = key.replace(/{{(.+)}}/g, ($1:any) => {
              const l = $1.split('.').length;
              const v = $1.replace(/{{|}}/g, '').split('.')[l - 1];
              return `{${v}}`;
            });
           return fyjson[key] = v;
          }
          fyjson[key] = key;
        }
        // console.log('jsText123',jsText);

        // const js = text.replace(/(export default)|(\n)/g,'').trim();
        // const jsTemplate = "function generate() { return "+js+"}";
        // const result = runFnInVm(jsTemplate);
        // console.log('result',result);
        //  const vueData = (result.value as unknown as {data:()=>any}).data();
        //   const values = Object.values(vueData); 
        //   for (let index = 0; index < values.length; index++) {
        //     const element = values[index];
        //     if(Chinese.test(element as string)){
        //       fyjson[element as string] = element;
        //     }
        //   }
      }
    },
    onclosetag(tagname: string) {
      if (tagname === "script") {

      }
    },
  });
  parser.write(data);
  parser.end();
  const zh = { ...fyjson };
  console.log('zh', zh);

  for (const key in fyjson) {
    if (Object.hasOwnProperty.call(fyjson, key)) {
      const oldValue = fyjson[key];

      let value = await translateCNToUS(oldValue.replace(/\`/g,''));


      try {
        fyjson[key] = value.toString();
      } catch (error) {
        console.log('error',error);

      }
    }
  }

  const en = fyjson;
  // const writeFilePath = path.resolve(__dirname,'i18n.js');
  const i18nTempalte = `
const i18n = {
  'zh-CN': ${
    JSON.stringify(zh, null, 4).replace(/`|\$|\n$/g, '').replace(/\"/g, "'").replace(/}$/,'')
}
  },
  en: ${
    JSON.stringify(en, null, 4).replace(/`|\$|\n$/g, '').replace(/\"/g, "'").replace(/}$/,'')
    }
  }
}
export default i18n
`;
  const isWin = /^win/.test(process.platform);
  let fieldName = '';
  if (isWin) {
    fieldName = path.join(url.path).split('\\').slice(0, -1).join('\\');
  } else {
    fieldName = path.join(url.path).split('/').slice(0, -1).join('/');
  }


  console.log(
    'i18nTempalte123', i18nTempalte
  );


  fs.writeFileSync(`${fieldName}/i18n_back.js`, i18nTempalte);
  console.log('i18nTempalte', i18nTempalte);

  // return fyjson
};
export { chouqu };