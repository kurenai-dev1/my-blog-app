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
// 🔍 記事一覧を取得するAPI (GET /api/blog/posts) - 【ページング・ソート大改造】
// ====================================================================
router.get('/posts', async (req, res) => {
  const includeDrafts = req.query.all === 'true'; 
  
  // ⭕ フロントから送られてくるページング・ソート用のパラメータを取得（デフォルト値付き）
  const sort = req.query.sort === 'updated' ? 'updated_at' : 'published_at'; // updated か published
  const page = parseInt(req.query.page, 10) || 1;   // 現在のページ（初期値: 1）
  const limit = parseInt(req.query.limit, 10) || 10; // 1ページの件数（初期値: 10）
  const offset = (page - 1) * limit;                 // スキップする件数

  try {
    let articlesQuery;
    let countQuery;
    let queryParams = [];

    // 1. 条件分岐用のSQL組み立て
    if (includeDrafts) {
      // 管理画面用：すべて
      countQuery = 'SELECT COUNT(*) FROM blog_posts';
      articlesQuery = `SELECT * FROM blog_posts ORDER BY ${sort} DESC LIMIT $1 OFFSET $2`;
      queryParams = [limit, offset];
    } else {
      // 公開画面用：公開済みのみ
      countQuery = 'SELECT COUNT(*) FROM blog_posts WHERE is_published = true';
      articlesQuery = `SELECT * FROM blog_posts WHERE is_published = true ORDER BY ${sort} DESC LIMIT $1 OFFSET $2`;
      queryParams = [limit, offset];
    }

    // 2. 「総件数」と「記事データ」を同時に並列で取得（パフォーマンス向上）
    const [countResult, articlesResult] = await Promise.all([
      pool.query(countQuery),
      pool.query(articlesQuery, queryParams)
    ]);

    const totalCount = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalCount / limit);

    // 3. フロントがページングしやすいように構造化したJSONを返す
    res.json({
      articles: articlesResult.rows,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit
      }
    });

  } catch (error) {
    console.error('記事一覧取得エラー:', error);
    res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
});

// ====================================================================
// 📝 新規記事を投稿するAPI (POST /api/blog/posts) - 【published_at対応】
// ====================================================================
router.post('/posts', verifyToken, async (req, res) => {
  // ⭕ フロントから任意の公開日（published_at）も受け取れるようにする
  const { title, content, is_published, published_at } = req.body;

  try {
    const query = `
      INSERT INTO blog_posts (title, content, is_published, published_at) 
      VALUES ($1, $2, $3, COALESCE($4, CURRENT_TIMESTAMP)) 
      RETURNING *
    `;
    // 💡 published_at が空ならDB側の現在時刻（COALESCE）が入る
    const result = await pool.query(query, [title, content, is_published ?? true, published_at || null]);
    
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
// 🔄 記事を更新するAPI (PUT /api/blog/posts/:id) - 【published_at対応】
// ====================================================================
router.put('/posts/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  // ⭕ 編集画面で修正された「公開日（published_at）」も一緒に受け取る
  const { title, content, is_published, published_at } = req.body; 

  try {
    // 💾 UPDATE 文に published_at も追加して更新可能に
    const result = await pool.query(
      'UPDATE blog_posts SET title = $1, content = $2, is_published = $3, published_at = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
      [title, content, is_published ?? true, published_at, id]
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