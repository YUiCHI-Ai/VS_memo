# Prompt Memo VSCode拡張機能 インストール手順

## 🚀 かんたんインストール方法

### 方法1: VSIXファイルから直接インストール（推奨）

1. **VSIXファイルを使用**
   - `prompt-memo-1.0.0.vsix` ファイルが生成済みです

2. **VSCodeでインストール**
   
   **オプションA: コマンドパレットから**
   - VSCodeを開く
   - `Cmd+Shift+P` (Mac) / `Ctrl+Shift+P` (Windows/Linux) でコマンドパレットを開く
   - 「Extensions: Install from VSIX...」と入力して選択
   - `prompt-memo-1.0.0.vsix` ファイルを選択
   
   **オプションB: コマンドラインから**
   ```bash
   code --install-extension prompt-memo-1.0.0.vsix
   ```

3. **VSCodeを再読み込み**
   - コマンドパレットで「Developer: Reload Window」を実行
   - または VSCodeを再起動

### 方法2: 開発フォルダから直接実行

1. **プロジェクトフォルダを開く**
   ```bash
   cd /Users/hoshino/Desktop/Ai/00_AiHUB/AiTECH/01_開発/_11_vscode拡張
   code .
   ```

2. **依存関係をインストール（初回のみ）**
   ```bash
   npm install
   ```

3. **ビルド**
   ```bash
   npm run compile
   ```

4. **VSCodeで実行**
   - `F5` キーを押してデバッグ実行

## ✅ インストール確認

1. **拡張機能が有効になっているか確認**
   - VSCodeの左サイドバー（アクティビティバー）に📝メモアイコンが表示される
   - 拡張機能一覧に「Prompt Memo」が表示される

2. **使い方**
   - 左サイドバーのメモアイコンをクリック
   - 「PROMPT MEMO」パネルが開く
   - ＋ボタンをクリックして新しいメモを作成
   - メモをクリックして編集開始（自動保存）
   - ×ボタンでメモを削除

## 🔧 トラブルシューティング

### アイコンが表示されない場合
1. VSCodeを完全に再起動
2. コマンドパレットで「Developer: Reload Window」を実行

### 拡張機能が有効にならない場合
1. 拡張機能タブを開く（`Cmd+Shift+X` / `Ctrl+Shift+X`）
2. 「Prompt Memo」を検索
3. 「Enable」ボタンをクリック

### VSIXファイルが見つからない場合
プロジェクトディレクトリで以下を実行：
```bash
# vsce がインストールされていない場合
npm install -g @vscode/vsce

# パッケージを作成
vsce package --no-dependencies
```

## 📦 アンインストール方法

1. 拡張機能タブを開く（`Cmd+Shift+X` / `Ctrl+Shift+X`）
2. 「Prompt Memo」を検索
3. 歯車アイコンをクリック → 「Uninstall」を選択

## 💡 注意事項

- この拡張機能はVSCode起動時に自動的に有効になります
- メモはVSCodeのワークスペースごとに保存されます
- VSCodeを閉じてもメモは保持されます（メモリ内保存）
- ファイルへの永続保存は行いません

## 🆘 サポート

問題が発生した場合は、以下を確認してください：
- VSCodeのバージョンが1.90.0以上であること
- Node.jsがインストールされていること（開発時のみ）
- 拡張機能のログ：表示 → 出力 → 「Prompt Memo」を選択