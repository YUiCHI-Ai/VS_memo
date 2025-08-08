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
    
    private getWebviewCSS(): string {
        return `
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

* {
    -webkit-tap-highlight-color: transparent;
    -webkit-focus-ring-color: transparent;
}

*:focus {
    outline: none !important;
    outline-width: 0 !important;
}

input:focus,
textarea:focus,
select:focus {
    outline: none !important;
    outline-width: 0 !important;
    box-shadow: none !important;
    border-color: transparent !important;
}

body {
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
    color: var(--vscode-foreground);
    background-color: var(--vscode-sideBar-background);
    padding: 0;
    margin: 0;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--vscode-widget-border);
    background-color: var(--vscode-sideBarSectionHeader-background);
    position: sticky;
    top: 0;
    z-index: 100;
}

.header h3 {
    margin: 0;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--vscode-sideBarTitle-foreground);
}

.add-button {
    background: transparent;
    border: none;
    color: var(--vscode-icon-foreground);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
    transition: background-color 0.1s;
}

.add-button:hover {
    background-color: var(--vscode-toolbar-hoverBackground);
}

.add-button:active {
    background-color: var(--vscode-toolbar-activeBackground);
}

.memo-list {
    padding: 8px;
    overflow-y: auto;
    height: calc(100vh - 60px);
}

.memo-container {
    margin-bottom: 8px;
    padding: 8px;
    border: 1px solid var(--vscode-widget-border);
    border-radius: 4px;
    position: relative;
    min-height: 40px;
    max-height: 50vh;
    overflow: hidden;
    background-color: var(--vscode-editor-background);
    transition: background-color 0.1s;
}

.memo-container:hover {
    background-color: var(--vscode-list-hoverBackground);
}

.memo-container:focus-within {
    outline: none !important;
    border-color: var(--vscode-widget-border) !important;
}

.memo-container.focused {
    outline: none !important;
    border-color: var(--vscode-widget-border) !important;
}

.memo-container.focused .memo-textarea {
    outline: none !important;
    border: none !important;
    box-shadow: none !important;
}

.memo-textarea {
    width: calc(100% - 24px);
    background: transparent;
    border: none !important;
    color: var(--vscode-editor-foreground);
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
    resize: none;
    outline: none !important;
    min-height: 20px;
    line-height: 1.5;
    word-wrap: break-word;
    white-space: pre-wrap;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
}

.memo-textarea:focus {
    outline: none !important;
    outline-width: 0 !important;
    outline-offset: 0 !important;
    box-shadow: none !important;
    border: none !important;
    -webkit-focus-ring-color: transparent !important;
    -webkit-appearance: none;
}

.memo-textarea::placeholder {
    color: var(--vscode-input-placeholderForeground);
    opacity: 0.7;
}

.delete-button {
    position: absolute;
    top: 4px;
    right: 4px;
    background: transparent;
    border: none;
    color: var(--vscode-icon-foreground);
    cursor: pointer;
    padding: 2px;
    opacity: 0;
    transition: opacity 0.2s, color 0.1s;
    border-radius: 3px;
}

.memo-container:hover .delete-button {
    opacity: 1;
}

.delete-button:hover {
    color: var(--vscode-errorForeground);
    background-color: var(--vscode-toolbar-hoverBackground);
}

.empty-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--vscode-descriptionForeground);
}

.empty-state p {
    margin: 10px 0;
}

.codicon {
    font-family: 'codicon';
    font-size: 16px;
}

.codicon-add::before {
    content: '\\ea60';
}

.codicon-close::before {
    content: '\\ea76';
}

@font-face {
    font-family: 'codicon';
    src: url('vscode-resource://vscode-cdn.net/stable/insider/out/vs/base/browser/ui/codicons/codicon/codicon.ttf') format('truetype');
}

::-webkit-scrollbar {
    width: 10px;
}

::-webkit-scrollbar-track {
    background: transparent;
}

::-webkit-scrollbar-thumb {
    background-color: var(--vscode-scrollbarSlider-background);
    border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
    background-color: var(--vscode-scrollbarSlider-hoverBackground);
}

::-webkit-scrollbar-thumb:active {
    background-color: var(--vscode-scrollbarSlider-activeBackground);
}
        `;
    }

    private getWebviewJS(): string {
        return `
(function() {
    console.log('[PromptMemo] Script starting...');
    const vscode = acquireVsCodeApi();
    let memos = [];
    let memoContainer;
    let addButton;
    
    // DOM初期化を待つ
    function initialize() {
        console.log('[PromptMemo] Initializing webview...');
        
        memoContainer = document.getElementById('memo-container');
        addButton = document.getElementById('add-memo-btn');
        
        if (!memoContainer || !addButton) {
            console.error('[PromptMemo] Required DOM elements not found:', {
                memoContainer: !!memoContainer,
                addButton: !!addButton
            });
            // 再試行
            setTimeout(initialize, 100);
            return;
        }
        
        console.log('[PromptMemo] DOM elements found, setting up event listeners...');
        
        addButton.addEventListener('click', () => {
            console.log('[PromptMemo] Add button clicked');
            vscode.postMessage({ command: 'createMemo' });
        });
        
        window.addEventListener('message', event => {
            const message = event.data;
            console.log('[PromptMemo] Received message:', message.command);
            
            switch (message.command) {
                case 'setMemos':
                    if (message.memos) {
                        memos = message.memos;
                        renderMemos();
                    }
                    break;
                case 'memoCreated':
                    if (message.memo) {
                        memos.push(message.memo);
                        renderMemos();
                        setTimeout(() => {
                            const newMemo = document.querySelector(\`[data-id="\${message.memo.id}"] .memo-textarea\`);
                            if (newMemo) {
                                newMemo.focus();
                            }
                        }, 100);
                    }
                    break;
                case 'memoDeleted':
                    if (message.id) {
                        memos = memos.filter(m => m.id !== message.id);
                        renderMemos();
                    }
                    break;
            }
        });
        
        // キーボードナビゲーションの設定
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const textareas = Array.from(document.querySelectorAll('.memo-textarea'));
                const currentIndex = textareas.indexOf(document.activeElement);
                
                if (currentIndex !== -1) {
                    e.preventDefault();
                    
                    let nextIndex;
                    if (e.shiftKey) {
                        nextIndex = currentIndex - 1;
                        if (nextIndex < 0) {
                            nextIndex = textareas.length - 1;
                        }
                    } else {
                        nextIndex = (currentIndex + 1) % textareas.length;
                    }
                    
                    textareas[nextIndex].focus();
                }
            }
        });
        
        // 初期メモの読み込み
        console.log('[PromptMemo] Loading initial memos...');
        vscode.postMessage({ command: 'loadMemos' });
    }
    
    function renderMemos() {
        console.log('[PromptMemo] Rendering memos:', memos.length);
        
        if (!memoContainer) {
            console.error('[PromptMemo] memoContainer not found during render');
            return;
        }
        
        if (memos.length === 0) {
            memoContainer.innerHTML = \`
                <div class="empty-state">
                    <p>No memos yet</p>
                    <p>Click the + button to create your first memo</p>
                </div>
            \`;
            return;
        }
        
        memoContainer.innerHTML = '';
        
        memos.forEach(memo => {
            const memoDiv = document.createElement('div');
            memoDiv.className = 'memo-container';
            memoDiv.setAttribute('data-id', memo.id);
            
            const textarea = document.createElement('textarea');
            textarea.className = 'memo-textarea';
            textarea.value = memo.content;
            textarea.placeholder = 'Enter your memo...';
            textarea.setAttribute('aria-label', 'Memo content');
            // インラインスタイルで緑の枠を強制的に無効化
            textarea.style.outline = 'none';
            textarea.style.border = 'none';
            textarea.style.boxShadow = 'none';
            textarea.style.WebkitAppearance = 'none';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-button';
            deleteBtn.innerHTML = '<span class="codicon codicon-close"></span>';
            deleteBtn.setAttribute('aria-label', 'Delete memo');
            
            textarea.addEventListener('input', () => {
                autoResize(textarea);
                vscode.postMessage({
                    command: 'updateMemo',
                    id: memo.id,
                    content: textarea.value
                });
            });
            
            textarea.addEventListener('focus', () => {
                memoDiv.classList.add('focused');
                // フォーカス時にもインラインスタイルを再適用
                textarea.style.outline = 'none';
                textarea.style.border = 'none';
                textarea.style.boxShadow = 'none';
                textarea.style.WebkitAppearance = 'none';
                textarea.style.WebkitFocusRingColor = 'transparent';
            });
            
            textarea.addEventListener('blur', () => {
                memoDiv.classList.remove('focused');
            });
            
            deleteBtn.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'deleteMemo',
                    id: memo.id
                });
            });
            
            memoDiv.appendChild(textarea);
            memoDiv.appendChild(deleteBtn);
            memoContainer.appendChild(memoDiv);
            
            autoResize(textarea);
        });
    }
    
    function autoResize(textarea) {
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        const maxHeight = window.innerHeight * 0.5;
        
        if (scrollHeight > maxHeight) {
            textarea.style.height = maxHeight + 'px';
            textarea.style.overflowY = 'auto';
        } else {
            textarea.style.height = scrollHeight + 'px';
            textarea.style.overflowY = 'hidden';
        }
    }
    
    // DOMが完全に読み込まれてから初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        // すでに読み込み済みの場合は即座に初期化
        initialize();
    }
})();
        `;
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const nonce = getNonce();
        const css = this.getWebviewCSS();
        const js = this.getWebviewJS();
        
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" 
                      content="default-src 'none'; 
                               style-src ${webview.cspSource} 'unsafe-inline'; 
                               script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Prompt Memo</title>
                <style>${css}</style>
            </head>
            <body>
                <div class="header">
                    <h3>PROMPT MEMO</h3>
                    <button id="add-memo-btn" class="add-button" aria-label="Create new memo">
                        <span class="codicon codicon-add"></span>
                    </button>
                </div>
                <div id="memo-container" class="memo-list"></div>
                <script nonce="${nonce}">${js}</script>
            </body>
            </html>`;
    }
    
    public getMemos(): Memo[] {
        return this._memos;
    }
}