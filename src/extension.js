
import * as vscode from 'vscode';
import {fanyi} from './component/vscode.js';

export function activate(context) {
	
	fanyi(context);
	console.log('sssss');
	let disposable = vscode.commands.registerCommand('sy-i18n.helloWorld', () => {

		vscode.window.showInformationMessage('Hello World from 1111 sy-i18n!');
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
