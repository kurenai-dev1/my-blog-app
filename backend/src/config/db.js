import pg from 'pg';
import dotenv from 'dotenv';

// どのファイルから呼び出されても、確実にメモリ上に環境変数をロードする
dotenv.config();

// アプリ全体で共有する 1 つの接続プールを作成
export const pool = new pg.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// 接続の初期テスト（最初の1回だけ実行されます）
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ PostgreSQLへの接続に失敗しました。.envの設定を確認してください:', err);
  } else {
    console.log('--- 💾 PostgreSQLに正常に接続されました (Pool有効) ---');
  }
});