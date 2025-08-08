import * as vscode from 'vscode';
import { MemoViewProvider } from './memoViewProvider';

export function activate(context: vscode.ExtensionContext) {
  const provider = new MemoViewProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(MemoViewProvider.viewType, provider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('promptMemo.createMemo', () => {
      provider.createMemo();
    })
  );
}

export function deactivate() {}