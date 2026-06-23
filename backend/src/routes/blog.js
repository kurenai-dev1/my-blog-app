// 📄 backend/src/routes/blog.js

import express from 'express';
import { pool } from '../config/db.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// 💾 Multerの設定（変更なしのため中略）
const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/'); },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });


// ====================================================================
// 🔍 1. 記事を1件取得するAPI (GET /api/blog/posts/:id) - 【タグ同梱版】
// ====================================================================
router.get('/posts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // ⭕ 記事データと一緒に、紐づくタグ一覧をJSON配列として1発で取得するSQL
    const query = `
      SELECT p.*, 
             COALESCE(json_agg(json_build_object('id', t.id, 'name', t.name)) FILTER (WHERE t.id IS NOT NULL), '[]') as tags
      FROM blog_posts p
      LEFT JOIN blog_post_tags bpt ON p.id = bpt.post_id
      LEFT JOIN blog_tags t ON bpt.tag_id = t.id
      WHERE p.id = $1
      GROUP BY p.id
    `;
    const result = await pool.query(query, [id]);
    
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
// 🔍 2. 記事一覧を取得するAPI (GET /api/blog/posts) - 【タグ絞り込み大改造】
// ====================================================================
router.get('/posts', async (req, res) => {
  const includeDrafts = req.query.all === 'true'; 
  const targetTag = req.query.tag ; // ⭕ クエリからタグ名（例: ?tag=React）を取得
  
  const sort = req.query.sort === 'updated' ? 'updated_at' : 'published_at';
  const page = parseInt(req.query.page, 10) || 1;   
  const limit = parseInt(req.query.limit, 10) || 10; 
  const offset = (page - 1) * limit;                 

  try {
    let articlesQuery = '';
    let countQuery = '';
    let queryParams = [];

    // --- 🧱 ① 総件数（countQuery）の組み立て ---
    if (includeDrafts) {
      if (targetTag) {
        // 全記事からタグで絞り込む場合のカウント
        countQuery = `
          SELECT COUNT(DISTINCT p.id) FROM blog_posts p
          JOIN blog_post_tags bpt ON p.id = bpt.post_id
          JOIN blog_tags t ON bpt.tag_id = t.id
          WHERE t.name = $1
        `;
        queryParams.push(targetTag);
      } else {
        countQuery = 'SELECT COUNT(*) FROM blog_posts';
      }
    } else {
      if (targetTag) {
        // 公開済み記事からタグで絞り込む場合のカウント
        countQuery = `
          SELECT COUNT(DISTINCT p.id) FROM blog_posts p
          JOIN blog_post_tags bpt ON p.id = bpt.post_id
          JOIN blog_tags t ON bpt.tag_id = t.id
          WHERE p.is_published = true AND t.name = $1
        `;
        queryParams.push(targetTag);
      } else {
        countQuery = 'SELECT COUNT(*) FROM blog_posts WHERE is_published = true';
      }
    }

    // --- 🧱 ② 記事データ取得（articlesQuery）の組み立て ---
    // 💡 json_agg を使って、紐づくすべてのタグをあらかじめ各記事オブジェクトに内包させます。
    let baseSelect = `
      SELECT p.*, 
             COALESCE(json_agg(json_build_object('id', t.id, 'name', t.name)) FILTER (WHERE t.id IS NOT NULL), '[]') as tags
      FROM blog_posts p
      LEFT JOIN blog_post_tags bpt ON p.id = bpt.post_id
      LEFT JOIN blog_tags t ON bpt.tag_id = t.id
    `;

    // プレースホルダーのインデックス管理用
    let paramIndex = queryParams.length + 1; 

    if (includeDrafts) {
      // 管理画面用
      articlesQuery = baseSelect;
      if (targetTag) {
        articlesQuery += ` WHERE p.id IN (SELECT post_id FROM blog_post_tags bpt2 JOIN blog_tags t2 ON bpt2.tag_id = t2.id WHERE t2.name = $1) `;
      }
      articlesQuery += ` GROUP BY p.id ORDER BY p.${sort} DESC, p.id DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    } else {
      // 公開画面用
      articlesQuery = baseSelect + ` WHERE p.is_published = true `;
      if (targetTag) {
        articlesQuery += ` AND p.id IN (SELECT post_id FROM blog_post_tags bpt2 JOIN blog_tags t2 ON bpt2.tag_id = t2.id WHERE t2.name = $1) `;
      }
      articlesQuery += ` GROUP BY p.id ORDER BY p.${sort} DESC, p.id DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    }

    // LIMIT と OFFSET をパラメータ配列に追加
    queryParams.push(limit, offset);

    // 3. 「総件数」と「記事データ」を並列で実行
    // ※ countQuery 用のパラメータと articlesQuery 用のパラメータを綺麗に分離します
    const countParams = targetTag ? [targetTag] : [];
    const [countResult, articlesResult] = await Promise.all([
      pool.query(countQuery, countParams),
      pool.query(articlesQuery, queryParams)
    ]);

    const totalCount = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalCount / limit);

    // 4. フロントに返却（既存の構造を維持！）
    res.json({
      articles: articlesResult.rows, // 💡 各記事オブジェクトの中に tags: [...] が自動で入っています
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

/*
// ====================================================================
// 📝 3. 新規記事を投稿するAPI (POST /api/blog/posts) - 現行ママ
// ====================================================================
router.post('/posts', verifyToken, async (req, res) => {
  const { title, content, is_published, published_at } = req.body;
  try {
    const query = `
      INSERT INTO blog_posts (title, content, is_published, published_at) 
      VALUES ($1, $2, $3, COALESCE($4, CURRENT_TIMESTAMP)) 
      RETURNING *
    `;
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
*/

// ====================================================================
// 📝 3. 新規記事を投稿するAPI (POST /api/blog/posts) - 【タグ保存対応版】
// ====================================================================
router.post('/posts', verifyToken, async (req, res) => {
  // ⭕ フロントから tags (配列) も一緒に受け取る
  const { title, content, is_published, published_at, tags } = req.body;

  console.log('--- 受信データ確認 ---', { title, is_published, tags });

  // トランザクションを開始するためにクライアントを確保
  const client = await pool.connect();

  try {
    // 1. トランザクション開始
    await client.query('BEGIN');

    // 2. 記事本体をインサート
    const postQuery = `
      INSERT INTO blog_posts (title, content, is_published, published_at) 
      VALUES ($1, $2, $3, COALESCE($4, CURRENT_TIMESTAMP)) 
      RETURNING *
    `;
    const postResult = await client.query(postQuery, [title, content, is_published ?? true, published_at || null]);
    const newPost = postResult.rows[0];

    // 3. ⭕ タグの保存処理（タグが送られてきた場合のみ実行）
    if (tags && Array.isArray(tags) && tags.length > 0) {
      for (const tagName of tags) {
        // 空文字やスペースのみのタグはスキップ
        const trimmedName = tagName.trim();
        if (!trimmedName) continue;

        // 💡 既存のタグがあるか確認し、なければ作成、あればそのIDを取得する（ON CONFLICT を活用）
        const tagQuery = `
          INSERT INTO blog_tags (name) 
          VALUES ($1) 
          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `;
        const tagResult = await client.query(tagQuery, [trimmedName]);
        const tagId = tagResult.rows[0].id;

        // 中間テーブル（blog_post_tags）に記事IDとタグIDを紐付け
        await client.query(
          'INSERT INTO blog_post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [newPost.id, tagId]
        );
      }
    }

    // 4. すべて成功したらコミット（確定）
    await client.query('COMMIT');

    res.status(201).json({
      message: '記事の投稿に成功しました！',
      post: newPost
    });
  } catch (error) {
    // 5. どこかでエラーが起きたら完全に巻き戻す
    await client.query('ROLLBACK');
    console.error('記事投稿エラー（タグ含む）:', error);
    res.status(500).json({ message: 'サーバーエラーが発生しました' });
  } finally {
    // クライアントをプールに返却
    client.release();
  }
});

// ====================================================================
// 🔄 4. 記事を更新するAPI (PUT /api/blog/posts/:id) - 現行ママ
// ====================================================================
/*
router.put('/posts/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { title, content, is_published, published_at } = req.body; 
  try {
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
*/

// 🔄 記事の更新 (PUT /api/blog/posts/:id)
router.put('/posts/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { title, content, is_published, published_at, tags } = req.body; // ⭕ tags を受け取る

  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // トランザクション開始

    // 1. 記事本体の更新
    const updatePostQuery = `
      UPDATE blog_posts 
      SET title = $1, content = $2, is_published = $3, published_at = $4, updated_at = NOW()
      WHERE id = $5
    `;
    await client.query(updatePostQuery, [title, content, is_published, published_at, id]);

    // 2. 🏷️ タグの上書き保存処理 (tags が届いている場合のみ実行)
    if (tags && Array.isArray(tags)) {
      // ① まず、この記事に紐づく古いタグ関係を中間テーブルから一旦すべて削除
      await client.query('DELETE FROM blog_post_tags WHERE post_id = $1', [id]);

      // ② 新しいタグを1つずつループして再登録
      for (const tagName of tags) {
        const trimmedTagName = tagName.trim();
        if (!trimmedTagName) continue;

        // blog_tags テーブルに存在しなければ作成、あれば既存のレコードを取得 (UPSERT)
        const tagQuery = `
          INSERT INTO blog_tags (name) 
          VALUES ($1) 
          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `;
        const tagRes = await client.query(tagQuery, [trimmedTagName]);
        const tagId = tagRes.rows[0].id;

        // 中間テーブルに紐付けを挿入
        await client.query(
          'INSERT INTO blog_post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [id, tagId]
        );
      }
    }

    await client.query('COMMIT'); // すべて成功したら確定
    res.json({ message: '記事とタグの更新に成功しました。' });

  } catch (error) {
    await client.query('ROLLBACK'); // エラー時はすべて巻き戻す
    console.error('記事更新エラー:', error);
    res.status(500).json({ error: '保存中にエラーが発生しました。' });
  } finally {
    client.release();
  }
});

// ⚡ 画像アップロード用API ＆ ❤️ いいねAPI (変更なしのため省略)
router.post('/upload', upload.single('image'), (req, res) => { /* ... */ });
router.post('/posts/:id/like', async (req, res) => { /* ... */ });

export default router;