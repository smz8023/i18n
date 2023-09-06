import {stringToCamel} from '../util/util';
import * as compiler from 'vue-template-compiler';
import * as htmlparser from 'posthtml-parser';
const {render} = require('posthtml-render');
const d = '/Users/a123/Downloads/商越/fe-m-supplier/components/not-found';

const Chinese = /[\u4e00-\u9fa5]+/;
let fyjson = {} as any;
const changeStr=(str: string,index: any,html: any,end: any)=>{
  return str.substr(0, index)+ html+str.substr(end ,str.length);
  };
const replace = (content: any,eni18n?:any)=>{
  const Chinese_before = /(?<=\?).*?(?=:)/; // 提取？后面：前面的字符串
  const Chinese_after = /(?<=:).*?(?=})/;
  const getKey =(key:string)=>{
    key = key.replace(/\s*|\n/g,'');
    console.log('eni18n[key]',key);
    // console.log('stringToCamel(eni18n[key])',stringToCamel(eni18n[key]));
    
    try {
      return stringToCamel(eni18n[key]);
    } catch (error) {
      return '报错';
    }
  };
  let data:any = compiler.parseComponent(content);
  const start = data.template.start;
  const end = data.template.end;
  const htmlTree = htmlparser.parser(data.template.content);
  const chineseReg = /[\u4E00-\u9FFF]+[^a-zA-Z\<\>\"\']*/g;
    const loop = (data: string | any[])=>{
      for (let index = 0; index < data.length; index++) {
        let item = data[index];
        if(chineseReg.test(item)){
          if(item.indexOf('{') > -1 && item.indexOf('?')>-1){
            const beforeStr =  item.match(Chinese_before).join().replace(/\s*/g,"").replace(/[\'|\"]*/g,"");
            const afterStr =  item.match(Chinese_after).join().replace(/\s*/g,"").replace(/[\'|\"]*/g,"");
            let str = item;
            str = str.replace("'"+beforeStr+"'", `pageText['${getKey(beforeStr)}']`);
            str = str.replace("'"+afterStr+"'",`pageText['${getKey(afterStr)}']`);
            str = str.replace('"'+beforeStr+'"',`pageText['${getKey(beforeStr)}']`);
            str = str.replace('"'+afterStr+'"',`pageText['${getKey(afterStr)}']`);
            (data as string[])[index] = str;
            continue;
          }
          if(item.indexOf('{') > -1 && item.indexOf('?')===-1 && item.indexOf('$')===-1){
            const key = item.replace(/(\s*)({*}*)/g,"");
            const  variable = /(?<={{).*?(?=}})/;
            var arr = item.split(Chinese).filter((i: string | string[])=>i.indexOf('{')>-1);
            const s = (str: { match: (arg0: RegExp) => any[]; })=>{
              if(str.match(variable)){
               return str.match(variable).join().replace(/\s*/g,"").replace(/[\'|\"]*/g,"");
              }
              return 'errors';
            }; 
            const parms:any = {};
            arr.forEach((ii: any)=>{
              const l = ii.split('.').length;
              const v = ii.replace(/{{|}}/g, '').split('.')[l - 1];
              parms[v]= s(ii);
            });

            (data as string[])[index] = `{{variableReplace(pageText['${getKey(key)}'], ${JSON.stringify(parms).replace(/\"/g,'')})}}`;
            continue;
          }
          if(item.indexOf('$')>-1){
            continue;
          }
          (data as string[])[index] = `{{pageText['${getKey(data[index])}']}}`;
          continue;
        }
        if(typeof item === 'object'){
          // console.log('item',item.attrs);
          if(item.attrs&&item.attrs.title && Chinese.test(item.attrs.title)){
            item.attrs[':title'] = `pageText['${getKey(item.attrs.title)}']`;
            delete item.attrs.title;
          }
          if(item.attrs&&item.attrs.label && Chinese.test(item.attrs.label)){
            item.attrs[':label'] = `pageText['${getKey(item.attrs.label)}']`;
            delete item.attrs.label;
          }
          if(item.attrs&&item.attrs.placeholder && Chinese.test(item.attrs.placeholder)){
            item.attrs[':placeholder'] = `pageText['${getKey(item.attrs.placeholder)}']`;
            delete item.attrs.placeholder;
          }
          if(item.attrs&&item.attrs.content && Chinese.test(item.attrs.content)){
            item.attrs[':content'] = `pageText['${getKey(item.attrs.content)}']`;
            delete item.attrs.content;
          }
        }
       
        if(item.content){
          loop(item.content);
        }
      }
    };
    loop(htmlTree);

    const html = render(htmlTree);
    const result = changeStr(content,start,html,end);
    return {
      result,start,end
    };
};
export {replace};