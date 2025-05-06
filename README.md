# 📚 動画より文字派！

YouTubeやSpotifyの文字起こしを、生成AI（LLM）を使って「構造的にわかりやすく」要約してくれるアプリです。
現在、**Chrome拡張機能** と **Slackアプリ** の2つの形で利用できます。

---

## 🚀 導入方法

### 🧩 Chrome拡張機能（ストア申請中）

- Chromeウェブストアからインストール 👉
  [動画より文字派！（Chrome拡張）](https://chrome.google.com/webstore/detail/xxxxx)

### 💬 Slackアプリ（公開に向けて準備中）

- Slack App Directoryからワークスペースに追加 👉
  [動画より文字派！（Slackアプリ）](https://slack.com/apps/xxxxx)

---

## 🎛️ Chrome拡張の使い方

1. 拡張機能アイコンをクリック
2. モードを選択（「自由入力」または「YouTube」）
3. 入力欄に文字起こし文 or YouTubeリンクを入力
4. ご自身の OpenAI APIキーを入力（初回のみ）
5. 「要約する」ボタンをクリックすると、下部に要約結果が表示されます

---

## 💬 Slackアプリの使い方

### 🔧 初期設定

1. `/setapikey sk-xxxxx` を実行して、OpenAI APIキーを登録
2. 必要に応じて `/deleteapikey` でキーを削除可能

### 🪄 実行方法

Slack上で以下のようにメンションとYouTubeリンクを投稿：

```
@gistify https://www.youtube.com/watch?v=xxxx
```

→ 数秒後、同じスレッドに要約文が自動で返信されます

---

## 🛠️ 技術構成

| 技術                              | 内容                                      |
| --------------------------------- | ----------------------------------------- |
| Deno Deploy                       | サーバーレスAPIのホスティング             |
| Hono                              | 軽量なWebフレームワーク                   |
| Deno KV                           | SlackユーザーごとのAPIキー保存            |
| OpenAI API                        | 要約の生成                                |
| youtube-captions-scraper          | YouTube字幕の取得                         |
| Vite + React                      | Chrome拡張のUI構築                        |
| Slack Events API & Slash Commands | Slackアプリのメッセージ応答とコマンド処理 |

---

## 🔐 プライバシーと安全性

- OpenAI APIキーは **各ユーザーが自分で登録・管理**します。
  運営側が収集・共有・悪用することは一切ありません。
- Slackのキーは Deno KV に安全に保存され、任意のタイミングで削除可能です。
- プライバシーポリシー：[Notionで公開中](https://aquamarine-eggnog-e37.notion.site/1e9f4ef03a57805a83bdf46c2052f613)

---

## 📌 注意事項

- 本アプリは字幕取得の可否やAPI応答に依存するため、100%の精度を保証するものではありません。
- Slackアプリは現在 YouTube のみに対応しています（Spotify対応は今後検討予定）。
- OpenAI
  APIの利用には料金が発生します（課金状況は[OpenAIアカウント](https://platform.openai.com/account)から確認できます）。

---

## 🧾 ライセンス

MIT License
