
import * as vscode from 'vscode';
import {fanyi} from './fanyi/index';

export function activate(context: vscode.ExtensionContext) {
	

	fanyi(context);

	let disposable = vscode.commands.registerCommand('sy-i18n.helloWorld', () => {

		vscode.window.showInformationMessage('Hello World from sy-i18n!');
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
