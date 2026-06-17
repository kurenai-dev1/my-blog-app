import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Post {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/blog/posts');
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error('記事の取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    // 🎨 画面全体に Qiita風の心地よい薄グレー背景を適用
    <div style={styles.wrapper}>
      <div style={styles.mainContainer}>
        
        {/* 🌐 ブログヘッダー */}
        <header style={styles.blogHeader}>
          <h1 style={styles.brandTitle}>Tech & Life Blog</h1>
          <p style={styles.brandSubtitle}>日々の学びと、クリエイティブな開発の記録</p>
        </header>

        {/* 🗂️ 記事一覧（Qiita風カードレイアウト） */}
        {posts.length === 0 ? (
          <div style={styles.emptyState}>
            <p>まだ記事が投稿されていません。</p>
          </div>
        ) : (
          <div style={styles.list}>
            {posts.map((post) => (
              // ⭕ 1つ1つの記事を真っ白な角丸カードとして独立化
              <article key={post.id} style={styles.card} className="blog-card">
                <Link to={`/article/${post.id}`} style={styles.cardLink}>
                  
                  {/* 📅 日付 */}
                  <div style={styles.cardMeta}>
                    <span>📅 {new Date(post.created_at).toLocaleDateString('ja-JP')}</span>
                  </div>
                  
                  {/* 🏷️ タイトル（Qiitaっぽく少し太めで存在感を） */}
                  <h2 style={styles.cardTitle}>{post.title}</h2>
                  
                  {/* 📝 本文（プレーンテキスト化） */}
                  <p style={styles.cardExcerpt}>{stripMarkdown(post.content)}</p>
                  
                  {/* ➡️ 続きを読む */}
                  <div style={styles.cardFooter}>
                    <span style={styles.readMore}>続きを読む →</span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* ⚡ マウスを乗せたときにふわっと浮き出るアニメーション用のCSS（おまけ） */}
      <style>{`
        .blog-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease !important;
        }
        .blog-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 20px -8px rgba(0, 0, 0, 0.15) !important;
        }
      `}</style>
    </div>
  );
}

// 📝 Markdown記号を取り除く簡易関数
function stripMarkdown(text: string) {
  if (!text) return '';
  return text
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^- \s+/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[.*?\]\(.*?\)/g, ''); // 画像タグ消去
}

// 💅 Qiitaスタイルを完全再現したデザイン定義
const styles = {
  // 💻 画面全体の背景を「薄いグレー」に
  wrapper: { 
    backgroundColor: '#f5f6f7', // 👈 Qiitaやモダンな技術ブログでよく使われる極薄グレー
    minHeight: '100vh', 
    width: '100%', 
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
    color: '#2d3748',
  },
  mainContainer: { 
    maxWidth: '760px', // カードが映えるように少しだけ横幅を広げました
    margin: '0 auto', 
    padding: '40px 20px 80px 20px' 
  },
  blogHeader: { 
    marginBottom: '32px', 
    textAlign: 'left' as const,
    paddingLeft: '4px'
  },
  brandTitle: { fontSize: '26px', fontWeight: 800, color: '#1a202c', margin: '0 0 6px 0' },
  brandSubtitle: { fontSize: '14px', color: '#718096', margin: 0 },
  
  list: { 
    display: 'flex', 
    flexDirection: 'column' as const, 
    gap: '16px' // 👈 カード同士の隙間をキュッと詰めて美しく並べる
  },
  
  // 📄 【ここがQiita風！】真っ白な浮き出る角丸カード
  card: { 
    backgroundColor: '#ffffff', // 🧱 記事は真っ白
    borderRadius: '8px',        // ⭕ 四隅に優しい丸みを持たせる
    border: '1px solid #e6ebed', // 境界線を薄く入れて上品に
    padding: '24px',            // 内側の余白をしっかり確保
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)', // うっすら影をつけて浮かせる
    textAlign: 'left' as const
  },
  cardLink: { display: 'block', textDecoration: 'none', color: 'inherit' },
  cardMeta: { fontSize: '12px', color: '#718096', marginBottom: '10px' },
  
  cardTitle: { 
    fontSize: '20px', 
    fontWeight: 700, 
    lineHeight: 1.4, 
    margin: '0 0 10px 0', 
    color: '#1a202c',
    textAlign: 'left' as const 
  },
  cardExcerpt: { 
    fontSize: '14px', // 読みやすいように少しだけスリムに
    color: '#4a5568', 
    lineHeight: '1.65', 
    margin: '0 0 14px 0', 
    display: '-webkit-box', 
    WebkitLineClamp: 3, 
    WebkitBoxOrient: 'vertical' as const, 
    overflow: 'hidden',
    textAlign: 'left' as const 
  },
  cardFooter: { 
    display: 'flex',
    justifyContent: 'flex-end' as const // ➡️ ご希望通り「右寄せ」をキープ！
  },
  readMore: { 
    fontSize: '13px', 
    fontWeight: 600, 
    color: '#00a37e' // 🟢 ほんのりQiitaを意識したグリーンアクセント（お好みで青でもOK！）
  },
  
  emptyState: { textAlign: 'center' as const, padding: '60px 20px', color: '#718096' },
  loading: { textAlign: 'center' as const, marginTop: '150px', fontSize: '16px', color: '#718096' },
};