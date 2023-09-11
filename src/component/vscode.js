import * as fs from "fs";
import path  from 'path'
import * as vscode from 'vscode';
import Transformer from './v.js'
const fanyi =  (context) =>{

  context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.翻译vue文件', async (textEditor) => {
    vscode.window.showInformationMessage('商越同学！！稍等我正在替换');
    const code = textEditor.document.getText();
    const isWin = /^win/.test(process.platform);
    let i18nfilePath = '';
    if(isWin){
      i18nfilePath = textEditor.document.uri.path.split('\\').slice(0,-1).join('\\');
    }else{
      i18nfilePath = textEditor.document.uri.path.split('/').slice(0,-1).join('/');
    }
    const fileType = path.extname(textEditor.document.uri.path)
    const tran = new Transformer({
      code,
      fileType
    })
    // console.log('.default',tran)
    tran.startTransform()
const i18nTempalte = `
const i18n = {
  'zh-CN': ${
    JSON.stringify(tran.locales, null, 4).replace(/`|\$|\n$/g, '').replace(/\"/g, "'").replace(/}$/,'')
}
  },
  en: ${
    JSON.stringify(tran.locales, null, 4).replace(/`|\$|\n$/g, '').replace(/\"/g, "'").replace(/}$/,'')
    }
  }
}
export default i18n
`;
fs.writeFileSync(`${i18nfilePath}/i18n_back.js`,i18nTempalte);
    //  // edit
    textEditor.edit((editBuilder) => {
        var document = textEditor.document;
        var lastLine = document.lineAt(document.lineCount - 1);
        var start = new vscode.Position(0, 0);
        var end = new vscode.Position(document.lineCount - 1, lastLine.text.length);
        var range = new vscode.Range(start, end);
        editBuilder.replace(range, tran.result);
      });
    vscode.window.showInformationMessage('商越同学！替换完毕');
}));
};
export {fanyi};