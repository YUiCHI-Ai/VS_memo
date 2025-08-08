import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Memo } from './types';

type WebviewMessage =
  | { command: 'updateMemo'; id: string; content: string }
  | { command: 'deleteMemo'; id: string };

export class MemoViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'promptMemo.memoView';

  private _view?: vscode.WebviewView;
  private memos: Memo[] = [];
  private _nonce = this.getNonce();

  constructor(private readonly context: vscode.ExtensionContext) {
    // 前回の状態を復元
    this.memos = context.workspaceState.get<Memo[]>('memos', []);
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this._view = webviewView;

    // Webview オプション
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview'),
        vscode.Uri.joinPath(this.context.extensionUri, 'resources'),
      ],
    };

    // HTML を設定（index.html テンプレートを読み込み）
    webviewView.webview.html = this.getHtmlContent(webviewView.webview);

    // メッセージ受信
    webviewView.webview.onDidReceiveMessage((message: WebviewMessage) => {
      switch (message.command) {
        case 'updateMemo':
          this.updateMemo(message.id, message.content);
          break;
        case 'deleteMemo':
          this.deleteMemo(message.id);
          break;
      }
    });

    // 初期の状態を送信
    this.postState();
  }

  public createMemo(): void {
    const memo: Memo = {
      id: this.generateId(),
      content: '',
      createdAt: Date.now(),
    };
    this.memos.push(memo);
    void this.save();
    this.postState(memo.id);
  }

  private updateMemo(id: string, content: string): void {
    const idx = this.memos.findIndex((m) => m.id === id);
    if (idx !== -1) {
      this.memos[idx] = { ...this.memos[idx], content };
      void this.save();
      this.postState();
    }
  }

  private deleteMemo(id: string): void {
    this.memos = this.memos.filter((m) => m.id !== id);
    void this.save();
    this.postState();
  }

  private async save(): Promise<void> {
    await this.context.workspaceState.update('memos', this.memos);
  }

  private postState(focusId?: string): void {
    this._view?.webview.postMessage({ type: 'setMemos', memos: this.memos, focusId });
  }

  private getHtmlContent(webview: vscode.Webview): string {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview', 'style.css')
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview', 'script.js')
    );

    const csp = [
      "default-src 'none'",
      `img-src ${webview.cspSource} https:`,
      `script-src 'nonce-${this._nonce}'`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `font-src ${webview.cspSource}`,
    ].join('; ');

    const indexPath = path.join(this.context.extensionPath, 'src', 'webview', 'index.html');
    try {
      let html = fs.readFileSync(indexPath, 'utf8');
      html = html
        .replace('%CSP%', csp)
        .replace(/%STYLE_URI%/g, styleUri.toString())
        .replace(/%SCRIPT_URI%/g, scriptUri.toString())
        .replace(/%NONCE%/g, this._nonce);
      return html;
    } catch {
      // フォールバック（index.html が存在しない場合）
      return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Prompt Memo</title>
  <link rel="stylesheet" href="${styleUri}">
</head>
<body>
  <div id="app">
    <div id="memo-list" class="memo-list"></div>
  </div>
  <script src="${scriptUri}" nonce="${this._nonce}"></script>
</body>
</html>`;
    }
  }

  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  private generateId(): string {
    // RFC4122 v4 簡易実装
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}