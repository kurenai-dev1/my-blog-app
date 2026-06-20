// 📄 frontend/src/pages/Article.tsx

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import MarkdownViewer from '../components/MarkdownViewer';

interface Post {
  id: number;
  title: string;
  content: string;
  created_at: string;
  published_at: string; // ⭕ 追加
  updated_at: string;   // ⭕ 追加
  likes: number;
}

export default function Article() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasLiked, setHasLiked] = useState(false);

  // 🔄 記事データを読み込んだタイミングで、すでにいいね済みの記事かチェック (変更なし)
  useEffect(() => {
    if (post) {
      const savedLikes = localStorage.getItem('liked_posts');
      const likedPosts: number[] = savedLikes ? JSON.parse(savedLikes) : [];
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

  // ❤️ いいね送信関数 (変更なし)
  const handleLike = async () => {
    if (!post) return;
    if (hasLiked) {
      alert('この記事にはすでにいいねしています！');
      return;
    }
    try {
      const response = await fetch(`/api/blog/posts/${post.id}/like`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setLikesCount(data.likes);
        const savedLikes = localStorage.getItem('liked_posts');
        const likedPosts: number[] = savedLikes ? JSON.parse(savedLikes) : [];
        if (!likedPosts.includes(post.id)) {
          likedPosts.push(post.id);
          localStorage.setItem('liked_posts', JSON.stringify(likedPosts));
        }
        setHasLiked(true);
      }
    } catch (error) {
      console.error('いいねの送信に失敗しました', error);
    }
  };

  // 💡 記事が「更新されたか（公開日よりあとに更新があるか）」を判定するヘルパー
  const isUpdated = () => {
    if (!post.updated_at || !post.published_at) return false;
    // ミリ秒単位の微小なズレを許容するため、10秒（10000ms）以上の差がある場合のみ「更新あり」とみなす
    const pubTime = new Date(post.published_at).getTime();
    const updTime = new Date(post.updated_at).getTime();
    return updTime - pubTime > 10000;
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.mainContainer}>
        
        {/* 🔙 上部ナビゲーションエリア */}
        <div style={styles.backNav}>
          <Link to="/" style={styles.backLink}>← 記事一覧へ戻る</Link>
          {localStorage.getItem('token') && (
            <Link to={`/admin/edit/${post.id}`} style={styles.editButton}>
              ✏️ この記事を編集する
            </Link>
          )}
        </div>

        {/* 📄 記事メインカード */}
        <article style={styles.articleCard}>
          <header style={styles.articleHeader}>
            {/* 📅 メタ情報エリアを拡張 */}
            <div style={styles.cardMeta}>
              <span>📅 公開: {new Date(post.published_at || post.created_at).toLocaleDateString('ja-JP')}</span>
              {isUpdated() && (
                <span style={styles.updateBadge}>
                  🔄 更新: {new Date(post.updated_at).toLocaleDateString('ja-JP')}
                </span>
              )}
            </div>
            <h1 style={styles.articleTitle}>{post.title}</h1>
          </header>
          
          {/* Markdown本文 */}
          <div className="md-viewer">
            <MarkdownViewer content={post.content}/>
          </div>
        </article>

        {/* ❤️ いいねエリア */}
        <div style={styles.likeContainer}>
          <button 
            onClick={handleLike} 
            style={{
              ...styles.likeButton,
              ...(hasLiked ? styles.likedButtonActive : {})
            }}
            onMouseDown={(e) => !hasLiked && (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => !hasLiked && (e.currentTarget.style.transform = 'scale(1)')}
            disabled={hasLiked}
          >
            {hasLiked ? '❤️ いいねしました！' : '❤️ いいね'} {likesCount}
          </button>
        </div>

        <footer style={styles.footerNav}>
           <p style={styles.footerText}>Thank you for reading!</p>
        </footer>
      </div>
      <style>{`
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

// 🎨 スタイルに更新バッジ用スタイルをちょい足し
const styles = {
  wrapper: { backgroundColor: '#f5f6f7', minHeight: '100vh', width: '100%', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#2d3748' },
  mainContainer: { maxWidth: '820px', margin: '0 auto', padding: '20px 20px 100px 20px' },
  backNav: { display: 'flex', justifyContent: 'space-between' as const, alignItems: 'center', marginBottom: '20px', width: '100%' },
  backLink: { textDecoration: 'none', color: '#718096', fontSize: '14px', fontWeight: 500 },
  editButton: { textDecoration: 'none', fontSize: '13px', color: '#4a5568', fontWeight: 600, border: '1px solid #cbd5e0', padding: '4px 12px', borderRadius: '6px', backgroundColor: '#fff' },
  
  articleCard: { backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e6ebed', padding: '48px 40px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' },
  articleHeader: { marginBottom: '40px', borderBottom: '1px solid #edf2f7', paddingBottom: '24px' },
  
  // 📅 メタ情報の配置調整
  cardMeta: { fontSize: '13px', color: '#718096', marginBottom: '12px', display: 'flex', gap: '14px', alignItems: 'center' },
  updateBadge: { color: '#4a5568', backgroundColor: '#edf2f7', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 },
  
  articleTitle: { fontSize: '28px', fontWeight: 700, color: '#1a202c', lineHeight: 1.4, margin: '0' },
  articleContent: { fontSize: '16px', lineHeight: '1.8', wordBreak: 'break-word' as const },
  footerNav: { marginTop: '40px', textAlign: 'center' as const },
  footerText: { fontSize: '14px', color: '#a0aec0' },
  loading: { textAlign: 'center' as const, marginTop: '150px', fontSize: '16px', color: '#718096' },
  error: { textAlign: 'center' as const, marginTop: '150px', fontSize: '16px', color: '#e53e3e' },
  likeContainer: { display: 'flex', justifyContent: 'center', marginTop: '40px', padding: '20px 0', borderTop: '1px solid #edf2f7' },
  likeButton: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '10px 24px', borderRadius: '9999px', cursor: 'pointer', fontSize: '16px', fontWeight: 600, color: '#e53e3e', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'all 0.2s ease' },
  likedButtonActive: { backgroundColor: '#fff5f5', borderColor: '#feb2b2', color: '#e53e3e', cursor: 'not-allowed', boxShadow: 'none' }
};