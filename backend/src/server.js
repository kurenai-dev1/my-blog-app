import express from 'express';
import dotenv from 'dotenv';
// 👈 作成したブログ用の窓口（ルーター）をインポート
import blogRouter from './routes/blog.js';
import authRouter from './routes/auth.js';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const uploadDir = process.env.UPLOAD_BLOG_DIR || 'uploads'; // デフォルト: 'uploads'

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// uploads フォルダを「/uploads」というURLで一般公開する
// app.use('/uploads', express.static('uploads'));
// 念のため、このソースファイルからの絶対パスにしておく
app.use(`/${uploadDir}`, express.static(uploadDir));

// 以下から始まるURLをそれぞれの処理へ振り分ける。処理先は、"/login" のようにパスを省略できる。
app.use('/blog', blogRouter);
app.use('/blog/auth', authRouter);

// 将来、別のアプリ（例：TODOアプリ）を追加したくなったら、以下を1行足すだけ！
// app.use('/api/todo', todoRouter);

app.listen(PORT, () => {
  console.log(`--- Multi-App Backend Server ON (Port: ${PORT}) ---`);
});