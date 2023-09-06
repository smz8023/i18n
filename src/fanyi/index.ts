import * as fs from "fs";
import path = require('path');
import * as vscode from 'vscode';
import {chouqu} from './component/chouqu';
import { replace } from './component/tihuan';
import { stringToCamel ,runFnInVm} from "./util/util";
const fanyi =  (context: { subscriptions: vscode.Disposable[]; }) =>{
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.提取中文', async (textEditor) => {
    console.log('我被点击了，提取',textEditor);
    vscode.window.showInformationMessage('商越同学！！稍等我正在提取');
    await chouqu(textEditor.document.getText(),textEditor.document.uri);
    vscode.window.showInformationMessage('商越同学！！提取完毕');
  }));
  context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.翻译vue文件', async (textEditor) => {
    console.log('我被点击了，翻译');
    vscode.window.showInformationMessage('商越同学！！稍等我正在替换');
    const isWin = /^win/.test(process.platform);

    let i18nfilePath = '';
    if(isWin){
      i18nfilePath = textEditor.document.uri.path.split('\\').slice(0,-1).join('\\');
    }else{
      i18nfilePath = textEditor.document.uri.path.split('/').slice(0,-1).join('/');
    }
    const basePath = path.resolve(__dirname,'./baseI18n.js');
    const i18nData = fs.readFileSync(i18nfilePath+'/i18n_back.js','utf-8');
    const data = i18nData.replace(/export default/g,'module.exports =');
    fs.writeFileSync(basePath, data, 'utf-8');
    const i18nJson = require('../../dist/baseI18n.js');
    let eni18n = i18nJson.en;
    let zh = i18nJson['zh-CN'];
    console.log('eni18neni18n',eni18n);
    
    const {result} = await replace(textEditor.document.getText(),eni18n);
    //  // edit
     await textEditor.edit( (editBuilder) => {
        var document = textEditor.document;
        var lastLine = document.lineAt(document.lineCount - 1);
        var start = new vscode.Position(0, 0);
        var end = new vscode.Position(document.lineCount - 1, lastLine.text.length);
        var range = new vscode.Range(start, end);
        editBuilder.replace(range, result);
        
        const transformi18n = (obj:any)=>{
          for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              const element = obj[key];
              zh[stringToCamel(element)] = zh[key];
              obj[stringToCamel(element)] = element;
              delete obj[key];
              delete zh[key];
            }
          }
        };
       setTimeout(()=>{
        transformi18n(eni18n);
const i18nTempalte = `
const i18n = {
  'zh-CN': ${
    JSON.stringify(zh, null, 4).replace(/`|\$|\n$/g, '').replace(/\"/g, "'").replace(/}$/,'')
}
  },
  en: ${
    JSON.stringify(eni18n, null, 4).replace(/`|\$|\n$/g, '').replace(/\"/g, "'").replace(/}$/,'')
    }
  }
}
export default i18n
`;
        fs.writeFileSync(`${i18nfilePath}/i18n_back.js`,i18nTempalte);
       },1500);

        // fs.unlinkSync(basePath);
      });
   
    vscode.window.showInformationMessage('商越同学！替换完毕');
}));
};
export {fanyi};