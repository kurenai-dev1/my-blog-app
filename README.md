# my-blog-app 📝

個人向けのブログアプリケーションです。
フロントエンドに React、バックエンドに Node.js (Express) を採用し、直感的で美しい執筆環境を提供します。

## ✨ 特徴

- **洗練されたタイポグラフィ**: 記事本文（Markdown）は、最新のCSS構文を使ってカプセル化（スコープ化）により、外部からのデザイン汚染を防ぎ、カスタマイズを容易にしています。
- **完璧なプレビュー同期**: 投稿画面（Edit/Write）のプレビューと公開画面（Article）で完全に同一のレンダリングを保証。
- **自動ダークモード対応**: デバイスの設定に合わせて自動で最適な配色（ライト/ダーク）に切り替わります。
- **Qiita風の見出し装飾**: 技術記事が読みやすくなる、美しいアンダーラインとインテリジェントな自動余白計算（`margin-top: 56px`）を搭載。

## 🛠️ 技術スタック

### フロントエンド (frontend)
- React
- TypeScript
- React Markdown (プレーンコンポーネント設計)
- 最新CSSネスト構文 / CSSカスタムプロパティ

### バックエンド (backend)
- Node.js
- Express
- TypeScript

---

## 🚀 始め方（ローカル開発環境の起動）

プロジェクトをクローンし、バックエンドとフロントエンドをそれぞれ起動します。

### 1. リポジトリのクローン
```bash
git clone [https://github.com/kurenai-dev1/my-blog-app.git](https://github.com/kurenai-dev1/my-blog-app.git)
cd my-blog-app
