import * as vscode from 'vscode';
import { Memo } from '../models/Memo';
import { WebviewMessage, ExtensionMessage } from '../types';
import { getNonce } from '../utils/uuid';

export class MemoViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'promptMemo.memoView';
    private _view?: vscode.WebviewView;
    private _memos: Memo[] = [];
    private _saveTimeoutHandle?: NodeJS.Timeout;
    
    constructor(
        private readonly _context: vscode.ExtensionContext
    ) {
        this.loadMemos();
    }
    
    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;
        
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._context.extensionUri, 'src', 'webview')
            ]
        };
        
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        
        webviewView.webview.onDidReceiveMessage(
            (message: WebviewMessage) => this.handleMessage(message),
            null,
            this._context.subscriptions
        );
        
        this.updateWebview();
    }
    
    private async handleMessage(message: WebviewMessage) {
        try {
            switch (message.command) {
                case 'createMemo':
                    await this.createMemo();
                    break;
                case 'updateMemo':
                    if (message.id && message.content !== undefined) {
                        await this.updateMemo(message.id, message.content);
                    }
                    break;
                case 'deleteMemo':
                    if (message.id) {
                        await this.deleteMemo(message.id);
                    }
                    break;
                case 'loadMemos':
                    this.updateWebview();
                    break;
            }
        } catch (error) {
            this.handleError(error as Error, 'handleMessage');
        }
    }
    
    public async createMemo() {
        try {
            const memo = new Memo('');
            this._memos.push(memo);
            await this.saveMemos();
            this.updateWebview();
            
            this.postMessage({
                command: 'memoCreated',
                memo: memo.toJSON()
            });
        } catch (error) {
            this.handleError(error as Error, 'createMemo');
        }
    }
    
    public async updateMemo(id: string, content: string) {
        try {
            const memo = this._memos.find(m => m.id === id);
            if (memo) {
                memo.update(content);
                await this.debouncedSave();
            }
        } catch (error) {
            this.handleError(error as Error, 'updateMemo');
        }
    }
    
    public async deleteMemo(id: string) {
        try {
            const index = this._memos.findIndex(m => m.id === id);
            if (index !== -1) {
                this._memos.splice(index, 1);
                await this.saveMemos();
                this.updateWebview();
                
                this.postMessage({
                    command: 'memoDeleted',
                    id
                });
            }
        } catch (error) {
            this.handleError(error as Error, 'deleteMemo');
        }
    }
    
    private async loadMemos() {
        try {
            const stored = this._context.workspaceState.get<any[]>('memos', []);
            this._memos = stored.map(data => Memo.fromJSON(data));
        } catch (error) {
            this.handleError(error as Error, 'loadMemos');
            this._memos = [];
        }
    }
    
    private async saveMemos() {
        try {
            const data = this._memos.map(memo => memo.toJSON());
            await this._context.workspaceState.update('memos', data);
            await this._context.workspaceState.update('lastSaved', Date.now());
        } catch (error) {
            this.handleError(error as Error, 'saveMemos');
            vscode.window.showErrorMessage('Failed to save memos. Your changes may not persist.');
        }
    }
    
    private async debouncedSave() {
        if (this._saveTimeoutHandle) {
            clearTimeout(this._saveTimeoutHandle);
        }
        
        this._saveTimeoutHandle = setTimeout(() => {
            this.saveMemos();
        }, 500);
    }
    
    private updateWebview() {
        if (this._view) {
            this.postMessage({
                command: 'setMemos',
                memos: this._memos.map(memo => memo.toJSON())
            });
        }
    }
    
    private postMessage(message: ExtensionMessage) {
        if (this._view) {
            this._view.webview.postMessage(message);
        }
    }
    
    private handleError(error: Error, context: string) {
        console.error(`[PromptMemo] ${context}:`, error);
        
        if (error.message.includes('Content too long')) {
            vscode.window.showWarningMessage(error.message);
        }
    }
    
    private _getHtmlForWebview(webview: vscode.Webview) {
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._context.extensionUri, 'src', 'webview', 'webview.css')
        );
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._context.extensionUri, 'src', 'webview', 'webview.js')
        );
        
        const nonce = getNonce();
        
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" 
                      content="default-src 'none'; 
                               style-src ${webview.cspSource} 'unsafe-inline'; 
                               script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleUri}" rel="stylesheet">
                <title>Prompt Memo</title>
            </head>
            <body>
                <div class="header">
                    <h3>PROMPT MEMO</h3>
                    <button id="add-memo-btn" class="add-button" aria-label="Create new memo">
                        <span class="codicon codicon-add"></span>
                    </button>
                </div>
                <div id="memo-container" class="memo-list"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
    
    public getMemos(): Memo[] {
        return this._memos;
    }
}