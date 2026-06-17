import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

const router = express.Router();

// 🔐 ログインAPI (/api/auth/login)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. データベースからユーザーを検索
    const result = await pool.query('SELECT * FROM blog_users WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'ユーザー名またはパスワードが正しくありません' });
    }

    const user = result.rows[0];

    // 2. パスワードの検証（入力された生パスワードと、DBのハッシュ値を比較）
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'ユーザー名またはパスワードが正しくありません' });
    }

    // 3. 合鍵（JWTトークン）の生成 (有効期限: 1日)
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 4. トークンとユーザー情報をフロントに返す
    res.json({
      token,
      user: { id: user.id, username: user.username }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
});

export default router;