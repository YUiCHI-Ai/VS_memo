import * as vscode from 'vscode';
import { MemoViewProvider } from './providers/MemoViewProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Prompt Memo extension is now active');
    
    const provider = new MemoViewProvider(context);
    
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            MemoViewProvider.viewType,
            provider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                }
            }
        )
    );
    
    context.subscriptions.push(
        vscode.commands.registerCommand('promptMemo.createMemo', () => {
            provider.createMemo();
        })
    );
    
    context.subscriptions.push(
        vscode.commands.registerCommand('promptMemo.deleteMemo', (id: string) => {
            provider.deleteMemo(id);
        })
    );
}

export function deactivate() {
    console.log('Prompt Memo extension is now deactivated');
}