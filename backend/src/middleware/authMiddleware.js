import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  // フロントエンドから送られてくるリクエストのヘッダー（Authorization）を確認
  const authHeader = req.headers['authorization'];
  
  // 「Bearer <トークン>」という形式で届くので、空白で分割してトークンだけを抜き出す
  const token = authHeader && authHeader.split(' ')[1];

  // 合鍵（トークン）を持っていなければ一発アウト
  if (!token) {
    return res.status(401).json({ message: 'アクセス権限がありません。ログインしてください。' });
  }

  try {
    // サーバーの秘密鍵を使って、合鍵が偽造されていないか、期限切れじゃないかを検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 合鍵が本物なら、中身（ユーザーIDなど）をリクエストに仕込んで次の処理へ進む
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'トークンが無効、または期限切れです。' });
  }
};