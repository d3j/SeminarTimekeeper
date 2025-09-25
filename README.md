# Seminar Timekeeper

オンラインセミナーの進行役が、アジェンダ設定から本番の時間管理までを一画面で完結できるように設計されたタイムキーパーアプリです。進行の遅れや前倒しをリアルタイムで可視化し、想定タイムラインとのズレを素早く把握できます。

## 本番環境

- https://d3j.github.io/SeminarTimekeeper/
- 普通に使う場合はこのURLへアクセスしてください。
- スマホ等でも使えます

## 使い方

- セミナーのパート別時間配分を考える
- パート毎に、名前と割当時間(分)を入力する
- 「実行モード」に切り替える
- 最初のパートの「開始」ボタンを押す
- 最初のパートが終わったら、次のパートの「開始」ボタンを押す
- 全体や各パートの残り時間を脇目で見ながら、うまいことやる

## 主な機能

- 全体／各パートの経過・残り時間をリアルタイム表示し、プログレスバーで視覚化。
- 予定との差分を計算して、進行が早い／遅いを即座に把握。
- 設定はURLパラメータに保存。ブックマークで復元可能。

## 開発者向け情報

### 使用技術

- Node.js 20.x / Vite + ES Modules
- jQuery 3.x（DOM操作の簡素化）
- Vitest + Testing Library（ユニット／DOMテスト）
- ESLint + Prettier（コード品質維持）
- Codex CLI (全てのコードを gpt-5-codex が書きました)

### セットアップ

1. Node.js 20.x をインストールします。
2. 依存関係を導入: `npm install`
3. 開発サーバーを起動: `npm run dev` し、表示されたローカルURLにアクセスします。

### npm スクリプト

- `npm run dev`: 開発サーバー（Vite）をホットリロード付きで起動。
- `npm run build`: 本番用に静的アセットを `dist/` へ出力。
- `npm run preview`: ビルド成果物をローカルで検証。
- `npm run lint`: ESLint/Prettier による静的解析を実行。
- `npm run test`: Vitest をウォッチモードで実行。
- `npm run test -- --run`: Vitest を単発実行（CI整合用）。

### テストと品質目標

- タイマー系ユーティリティでステートメントカバレッジ85%以上、全体で70%以上を維持。
- `npm run lint` と `npm run test -- --run` をPR前に必ず実行し、失敗したログを解消。
- UI変更はスクリーンショットやスクリーンレコーディングをPRに添付。

### プロジェクト構成

- `design.md`: プロダクトの設計原則をまとめたドキュメント（構造変更前に更新）。
- `docs/`: 補足資料（実装サマリーなど）。
- `src/index.html`: SPAエントリ。モード切り替えUIとGAタグを配置。
- `src/scripts/`: `main.js`（画面制御）、`timer.js`（タイムライン協調）、`config.js`（設定シリアライズ）、`utils.js`（共通処理）。
- `src/styles/`: BEM準拠のCSS（`main.css`）。
- `public/`: GitHub Pages 公開用の静的ファイル（`assets/`、`index.html` など）。
- `tests/`: `src/` と同構造で配置した Vitest のテストコード。

## Author

- Joji Jorge Senda ([@d3j](https://github.com/d3j))
