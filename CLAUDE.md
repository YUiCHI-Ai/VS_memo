# Prompt Memo VSCode拡張機能 開発ガイド

## プロジェクト概要
VSCodeで簡単に一時的なメモを作成・管理できる拡張機能

## 開発手順

### フェーズ0: プロジェクト準備
- [ ] 既存ドキュメントの最新化
- [ ] ドキュメントの再チェック
- [ ] 設計・実装・テストドキュメント作成
- [ ] 作成ドキュメントの再チェック
- [ ] 実装Todoの作成
- [ ] 実装Todoの再チェック
- [ ] 全タスクの実施
- [ ] 対応漏れチェック

### フェーズ1: 初期セットアップ
- [ ] package.json作成
- [ ] tsconfig.json作成
- [ ] 基本的なプロジェクト構造の構築

### フェーズ2: コア実装
- [ ] extension.ts（エントリーポイント）
- [ ] memoViewProvider.ts（ビュープロバイダー）
- [ ] types.ts（型定義）
- [ ] Webview関連ファイル

### フェーズ3: UI実装
- [ ] HTMLテンプレート作成
- [ ] CSSスタイル定義
- [ ] JavaScriptインタラクション実装

### フェーズ4: テストとデバッグ
- [ ] 基本機能テスト
- [ ] エッジケーステスト
- [ ] パフォーマンステスト

## コマンド一覧

### ビルド
```bash
npm run compile
```

### ウォッチモード
```bash
npm run watch
```

### テスト実行
```bash
npm test
```

### 拡張機能の実行
VSCode上でF5キーを押して新しいExtension Development Hostウィンドウを開く

## 注意事項
- TypeScriptを使用
- VSCode Extension APIに準拠
- メモリ内でのデータ管理（永続化なし）
- VSCodeのテーマに追従する設計