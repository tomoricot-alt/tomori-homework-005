# TOMORI HOMEWORK（APP 005）

TOMORI APP LAB 第5号。中高生が宿題・提出物・テスト予定を整理するための学校生活管理アプリです。
「提出を忘れた」「テスト勉強が間に合わなかった」を減らすことが目的です。

- 公開URL: https://tomoricot-alt.github.io/tomori-homework-005/
- 技術: React Native / Expo (SDK 57) / TypeScript / React Native Web
- サーバー・アカウント登録・有料API・外部AI APIは使いません。データは端末のブラウザ内（localStorage）だけに保存し、外部へ送信しません。

## 仕様

| 機能 | 内容 |
| --- | --- |
| 登録 | 種類（宿題／提出物／テスト）・科目・内容・締切日・メモ。学校名・学年・氏名は入力不要 |
| 編集・削除 | 予定をタップして編集。削除は確認つき |
| 完了 | 丸いチェックで完了⇔未完了。完了時にお祝い表示（取り消し可） |
| ホーム | 期限超過／今日／明日／今週（日曜まで）に分けて表示。それ以降は予定一覧へ |
| 予定一覧 | 締切順／科目別、種類で絞り込み |
| 完了履歴 | 完了が新しい順。未完了にもどせる |
| 保存 | 変更のたびに自動保存（キー `tomori-homework-005:v1`） |
| 初回起動 | 「サンプル」印つきの見本を表示。ワンタップで消去。消した後は再表示されない |

### 日付の扱い
- 締切は端末の**ローカル日付**（`YYYY-MM-DD`）で保存・判定します（UTCは使いません）。
- 日数の差は暦日で計算し、夏時間・月またぎ・うるう年でもずれません。
- 0時をまたぐ、またはタブに戻ると「今日」が自動で更新され、期限超過の判定も変わります。
- 過去日の登録も可能で、その場合は「◯日超過」と表示されます。
- 今週は月曜はじまりで、日曜までです。
- 同じ締切日なら テスト → 提出物 → 宿題 の順に並びます。

### 保存データについて
ブラウザの「サイトデータ／閲覧履歴の削除」やプライベートモードでは記録が消えることがあります。アプリ内フッターと利用説明書にも明記しています。壊れた保存データは `…:broken` キーに退避して空の状態で起動します。

通知機能は初期バージョンでは実装していません。

## 起動方法

```bash
npm ci
npm run web        # 開発サーバー（Webブラウザ）
npm start          # Expo（iPhone の Expo Go など）
```

## テスト・ビルド

```bash
npm run typecheck  # TypeScript 型チェック
npm test           # ユニットテスト（日付・並び替え・保存データ検証）
npm run build      # Web ビルド → dist/（GitHub Pages 用パス付き）
npm run e2e        # ビルド済み dist を実ブラウザ(Chromium)で検証
```

`npm run e2e` は Playwright 用の Chromium が必要です（`npx playwright-core install chromium`、または環境変数 `CHROMIUM_PATH` で実行ファイルを指定）。確認項目: 登録／科目・締切／編集・削除／完了切替／締切順／期限超過／日付切り替わり／再読み込み後の保存／壊れたデータ／外部通信なし／iPhone SE・iPhone・PC のレイアウト（スクリーンショットは `e2e/shots/`）。

## 公開方法（GitHub Pages）

1. リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** にする（初回のみ）。
2. Pull Request を承認して `main` にマージする。
3. `.github/workflows/deploy.yml` が型チェック → テスト → ビルド → ブラウザテスト → Pages 公開を自動実行します。
4. https://tomoricot-alt.github.io/tomori-homework-005/ で公開されます。

`app.json` の `experiments.baseUrl`（`/tomori-homework-005`）が公開パスです。リポジトリ名を変える場合はここも変更してください。追加費用は発生しません（公開リポジトリの GitHub Actions / Pages 無料枠内）。

## 構成

```
App.tsx              画面切り替え・タブバー・お祝い表示
src/lib/date.ts      ローカル日付の計算
src/lib/tasks.ts     並び替え・グループ化・検証・保存データ解析
src/store.tsx        状態管理と自動保存
src/screens/         Home / List / Edit / History
e2e/run.mjs          ブラウザ動作テスト
docs/                利用説明書・開発報告
```
