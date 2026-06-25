# my-blog-app 📝

個人向けのブログアプリケーションです。  
フロントエンドに React、バックエンドに Node.js (Express) を採用し、シンプルな執筆環境を提供します。

## ✨ 特徴

- **洗練されたタイポグラフィ**: 記事本文に Markdown を使用し、入力が軽く表現力も向上します。  
技術的には、最新のCSS構文を使ってindex.cssにカプセル化（スコープ化）を行い、記事内のデザインを外のCSSに影響されず、  
カスタマイズも容易にしています。
- **Qiita風の見出し装飾**: 技術記事が読みやすくなる、タイトルの表示をQiita風にアレンジしています。
- **プレビューの同期**: 投稿画面（Edit/Write）のプレビューと公開画面（Article）で同一のレンダリングが行われます。
- **画像のアップロード**: 記事中に画像をアップロードして表示ができます。
- **拡張が容易なnote**: cssの追加だけでnoteを拡張できます。
- **タグ機能**: 記事に動的にタグを追加でき、一覧で簡単に絞り込みが出来ます。
- **ページングと表示順**: ページングに対応し、表示順を公開日の降順、更新日の降順で切り替え可能。
- **下書き・公開日変更**: 公開前のドラフト状態で保存できます。過去に公開した記事の公開日の変更も可能。
- **自動ダークモード対応**: デバイスの設定に合わせて自動で最適な配色（ライト/ダーク）に切り替わる簡単な仕組みを入れています。
- **本番環境への配備を考慮**: 開発環境の構築は簡単に。本番環境への配備を設定ファイルのみの修正で行えるように配慮しました。

## 🛠️ 技術スタック

### フロントエンド (frontend)
- React
- TypeScript
- React Router
- React Markdown (プレーンコンポーネント設計)
- Prism SyntaxHighlighter
- 最新CSSネスト構文 / CSSカスタムプロパティ

### バックエンド (backend)
- Node.js
- Express
- TypeScript
- PostgreSQL

---

## 🚀 始め方（ローカル開発環境の起動）

プロジェクトをクローンし、バックエンドとフロントエンドをそれぞれ起動します。

### 1. リポジトリのクローン
```bash
git clone https://github.com/kurenai-dev1/my-blog-app.git
cd my-blog-app
```
### 2. 環境構築
- バックエンド
```bash
cd backend
npm install
```
- フロントエンド
```bash
cd frontend
npm install
```
### 3.データベースの準備
PostgreSQL をインストールし、`blog_users` `blog_posts` `blog_tags` 'blog_post_tags'の４つのテーブルを作成します。  
スクリプトは /backend/src/config/init_postgresql.sql にあります。  
管理者ユーザーをSQLで直接登録します。  
パスワードハッシュの値は以下で確認できます。
```bash
node -e "import('bcryptjs').then(b => b.hash('<your_password>', 10).then(console.log))"
```
### 4.環境変数の設定
バックエンドで、/backend/.env を .env.sample を元に作成します。

### 5.起動
バックエンド、フロントエンドを別々のターミナルで開き
```bash
cd backend
npm run dev
```
```bash
cd frontend
npm run dev
```
ブラウザから、`http://localhiost/5174` 

## 本番環境構築のヒント
どのようなサーバーの構成でも柔軟に対応できるようにしています。  
フロントエンドはルート(/)に限らず、どんなサブパス(/blog/)でも静的ファイルとして置くだけです。  

バックエンドはWEBサーバー(Apacheやnginx)からのリバースプロキシで呼ばれる前提で設計しました。  
それぞれの環境に合わせて設定ファイル(.env)を修正してください。



