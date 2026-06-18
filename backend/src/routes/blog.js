import express from 'express';
import { pool } from '../config/db.js';
import { verifyToken } from '../middleware/authMiddleware.js';

import multer from 'multer'; // ⭕ 追加
import path from 'path';     // ⭕ 追加

const router = express.Router();

// 💾 Multerの設定：ファイルの保存先とファイル名のルールを決める
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // 先ほど作った uploads フォルダを指定
  },
  filename: (req, file, cb) => {
    // 重複を避けるため「タイムスタンプ + ランダム数字 + 元の拡張子」にする
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 🔍 1. 【復活】記事を1件取得するAPI (GET /api/blog/posts/:id)
// ※ server.js 側で '/api/blog' が頭に付くので、ここは '/posts/:id' でOK
router.get('/posts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM blog_posts WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: '記事が見つかりません' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
});

// ====================================================================
// 🔍 記事一覧を取得するAPI (GET /api/blog/posts)
// ====================================================================
router.get('/posts', async (req, res) => {
  // 💡 フロントから /api/blog/posts?all=true で叩かれたら下書きも含む
  const includeDrafts = req.query.all === 'true'; 

  try {
    let result;
    if (includeDrafts) {
      // ⭕ 管理画面用：下書き（false）も公開済み（true）もすべて取得
      result = await pool.query('SELECT * FROM blog_posts ORDER BY created_at DESC');
    } else {
      // ⭕ 公開画面用：is_published が true（公開中）のものだけを取得
      result = await pool.query('SELECT * FROM blog_posts WHERE is_published = true ORDER BY created_at DESC');
    }
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
});

// 📝 2. 新規記事を投稿するAPI (POST /api/blog/posts)
router.post('/posts', verifyToken, async (req, res) => {
  const { title, content, is_published } = req.body;

  try {
    const query = `
      INSERT INTO blog_posts (title, content, is_published) 
      VALUES ($1, $2, $3) 
      RETURNING *
    `;
    const result = await pool.query(query, [title, content, is_published ?? true]);
    
    res.status(201).json({
      message: '記事の投稿に成功しました！',
      post: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
});

// ====================================================================
// 🔄 記事を更新するAPI (PUT /api/blog/posts/:id)
// ====================================================================
router.put('/posts/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  // ⭕ フロントから送られてくる新しい is_published（true or false）を受け取る
  const { title, content, is_published } = req.body; 

  try {
    // 💾 データベースの UPDATE 文に is_published も追加して上書き
    const result = await pool.query(
      'UPDATE blog_posts SET title = $1, content = $2, is_published = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [title, content, is_published ?? true, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '指定された記事が見つかりません' });
    }

    res.json({ message: '記事を更新しました', post: result.rows[0] });
  } catch (error) {
    console.error('記事更新エラー:', error);
    res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
});

// 📄 backend/src/routes/blog.js の末尾部分

// ⚡ 【新規追加】画像アップロード用API (POST /api/blog/upload)
// 本来はここもログイン必須（verifyToken）にするべきですが、まずは通信テストのためガードなしで作ります
router.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '画像ファイルが添付されていません' });
    }

    // フロントエンドがアクセスするためのURLを組み立てる
    // 例: http://localhost:3001/uploads/image-123456789.jpg
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    // フロント側に「アップロード大成功！URLはこれだよ」と返す
    res.json({ url: imageUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '画像のアップロード中にエラーが発生しました' });
  }
});

// ❤️ 記事にいいねをプラス1するAPI (POST /api/blog/posts/:id/like)
router.post('/posts/:id/like', async (req, res) => {
  const { id } = req.params;

  try {
    // 💾 SQLで直接 +1 して、更新後のデータを返す（競合を防ぐため安全）
    const result = await pool.query(
      'UPDATE blog_posts SET likes = likes + 1 WHERE id = $1 RETURNING likes',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '記事が見つかりません' });
    }

    // 最新のいいね数をフロントに返す
    res.json({ likes: result.rows[0].likes });
  } catch (error) {
    console.error('いいねエラー:', error);
    res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
});

export default router;