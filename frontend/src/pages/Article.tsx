// 📄 frontend/src/pages/Article.tsx

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

interface Post {
  id: number;
  title: string;
  content: string;
  created_at: string;
  likes: number;
}

export default function Article() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasLiked, setHasLiked] = useState(false);

  // 🔄 記事データを読み込んだタイミングで、すでにいいね済みの記事かチェック
  useEffect(() => {
    if (post) {
      // localStorage から「liked_posts」という名前のリストを取得
      const savedLikes = localStorage.getItem('liked_posts');
      const likedPosts: number[] = savedLikes ? JSON.parse(savedLikes) : [];
      
      // この記事のIDがリストに含まれているか確認
      setHasLiked(likedPosts.includes(post.id));
    }
  }, [post]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/blog/posts/${id}`);
        const data = await response.json();
        setPost(data);
        setLikesCount(data.likes || 0);
      } catch (error) {
        console.error('記事の取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (!post) return <div style={styles.error}>記事が見つかりません。</div>;


  // ❤️ いいね送信関数（重複排除ロジック入り）
  const handleLike = async () => {
    if (!post) return;

    // ⭕ 既にいいねしている場合は、処理を中断して連打を防ぐ
    if (hasLiked) {
      alert('この記事にはすでにいいねしています！');
      return;
    }

    try {
      const response = await fetch(`/api/blog/posts/${post.id}/like`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setLikesCount(data.likes); // 最新のいいね数に更新

        // ⭕ localStorage にこの記事のIDを追記する
        const savedLikes = localStorage.getItem('liked_posts');
        const likedPosts: number[] = savedLikes ? JSON.parse(savedLikes) : [];
        
        // リストになければ追加して保存
        if (!likedPosts.includes(post.id)) {
          likedPosts.push(post.id);
          localStorage.setItem('liked_posts', JSON.stringify(likedPosts));
        }

        // 画面の状態を「いいね済み」に変更
        setHasLiked(true);
      }
    } catch (error) {
      console.error('いいねの送信に失敗しました', error);
    }
  };


return (
  <div style={styles.wrapper}>
    <div style={styles.mainContainer}>
      
      {/* 🔙 上部ナビゲーションエリア（ここを横並びのレイアウトに！） */}
      <div style={styles.backNav}>
        <Link to="/" style={styles.backLink}>← 記事一覧へ戻る</Link>
        
        {/* 💡 【引っ越し先】ログイン中のみ、一覧へ戻るの右側にそっと表示 */}
        {localStorage.getItem('token') && (
          <Link to={`/admin/edit/${post.id}`} style={styles.editButton}>
            ✏️ この記事を編集する
          </Link>
        )}
      </div>

      {/* 📄 記事メインカード（完全に読者専用の綺麗な白カードになりました！） */}
      <article style={styles.articleCard}>
        <header style={styles.articleHeader}>
          <div style={styles.cardMeta}>
            <span>📅 公開日: {new Date(post.created_at).toLocaleDateString('ja-JP')}</span>
          </div>
          {/* ❌ 元々ここにあった editButtonContainer のブロックは丸ごと削除します */}
          <h1 style={styles.articleTitle}>{post.title}</h1>
        </header>
        
        {/* Markdown本文 */}
        <div className="md-viewer">
          <div style={styles.articleContent}>
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
        </div>
      </article>

      {/* ❤️ いいねエリア */}
      <div style={styles.likeContainer}>
        <button 
          onClick={handleLike} 
          style={{
            ...styles.likeButton,
            // ⭕ すでにいいねしている場合は、ボタンを少しグレーアウトして押しづらくする
            ...(hasLiked ? styles.likedButtonActive : {})
          }}
          // ⭕ 既にいいねしている場合は、マウスでの押し込みアニメーションを無効化
          onMouseDown={(e) => !hasLiked && (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={(e) => !hasLiked && (e.currentTarget.style.transform = 'scale(1)')}
          disabled={hasLiked} // ボタン自体をクリック不可にしてもOK（お好みで）
        >
          {hasLiked ? '❤️ いいねしました！' : '❤️ いいね'} {likesCount}
        </button>
      </div>

      <footer style={styles.footerNav}>
         <p style={styles.footerText}>Thank you for reading!</p>
      </footer>
    </div>
<style>{`
  /* ⭕ Markdownの見出しサイズを、ブラウザの自然な文字間隔（フォント）のまま縮小するだけ */
  .article-body h1 {
    font-size: 24px;
    margin: 32px 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid #edf2f7;
  }
  .article-body h2 {
    font-size: 20px;
    margin: 24px 0 12px 0;
  }
`}</style>

  </div>
);
}

// 💅 詳細画面用の Qiita風・高品位デザイン
const styles = {
  // 💻 画面全体のグレー背景
  wrapper: { 
    backgroundColor: '#f5f6f7', 
    minHeight: '100vh', 
    width: '100%',
    // ⭕ 基本のフォントをここで「1回だけ」指定。子要素はすべてこれを受け継ぎます
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#2d3748' 
  },
  mainContainer: { 
    maxWidth: '820px', 
    margin: '0 auto', 
    padding: '20px 20px 100px 20px' 
  },
  backNav: { 
    display: 'flex',
    justifyContent: 'space-between' as const, 
    alignItems: 'center',
    marginBottom: '20px',
    width: '100%'
  },
  backLink: { textDecoration: 'none', color: '#718096', fontSize: '14px', fontWeight: 500 },
  editButton: { 
    textDecoration: 'none', fontSize: '13px', color: '#4a5568', fontWeight: 600, 
    border: '1px solid #cbd5e0', padding: '4px 12px', borderRadius: '6px', backgroundColor: '#fff' 
  },
  
  // 📄 白い記事カード
  articleCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: '8px', 
    border: '1px solid #e6ebed', 
    padding: '48px 40px', 
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  articleHeader: { marginBottom: '40px', borderBottom: '1px solid #edf2f7', paddingBottom: '24px' },
  cardMeta: { fontSize: '14px', color: '#718096', marginBottom: '12px' },
  
  articleTitle: { 
    fontSize: '32px', // 👈 縦に詰まらないよう、適切なサイズに調整
    fontWeight: 800, 
    color: '#1a202c', 
    lineHeight: 1.4, // 👈 詰まり感をなくす自然な行高
    margin: '0' 
  },
  
  // 📝 本文エリア（細かな文字指定を全消去してブラウザに任せる）
  articleContent: { 
    fontSize: '16px', 
    lineHeight: '1.8', 
    wordBreak: 'break-word' as const
  },

  footerNav: { marginTop: '40px', textAlign: 'center' as const },
  footerText: { fontSize: '14px', color: '#a0aec0' },
  loading: { textAlign: 'center' as const, marginTop: '150px', fontSize: '16px', color: '#718096' },
  error: { textAlign: 'center' as const, marginTop: '150px', fontSize: '16px', color: '#e53e3e' },

likeContainer: { display: 'flex', justifyContent: 'center', marginTop: '40px', padding: '20px 0', borderTop: '1px solid #edf2f7' },
  likeButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    padding: '10px 24px',
    borderRadius: '9999px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 600,
    color: '#e53e3e',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
    transition: 'all 0.2s ease'
  },
  // ⭕ いいねした後のボタンのデザイン（背景を薄ピンク、枠線を消すなど、Qiitaっぽく）
  likedButtonActive: {
    backgroundColor: '#fff5f5',
    borderColor: '#feb2b2',
    color: '#e53e3e',
    cursor: 'not-allowed', // マウスカーソルを禁止マークに
    boxShadow: 'none'
  }

};

