// 📄 frontend/src/pages/Home.tsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Post {
  id: number;
  title: string;
  content: string;
  is_published: boolean; // ⭕ 型定義に公開フラグを追加
  created_at: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ⭕ トークンがあるかどうかで、ログイン（管理者）状態かを判別する
  const isAdmin = !!localStorage.getItem('token'); 

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // ⭕ 管理者の場合はバックエンドのルールに合わせて「?all=true」を付与して下書きも引っ張る
        const url = isAdmin ? '/api/blog/posts?all=true' : '/api/blog/posts';
        const response = await fetch(url);
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error('記事の取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [isAdmin]); // ログイン状態が変わったら再取得する安全設計

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.wrapper}>
      <div style={styles.mainContainer}>
        
        {/* 🌐 ブログヘッダー */}
        <header style={styles.blogHeader}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={styles.brandTitle}>Tech & Life Blog</h1>
              <p style={styles.brandSubtitle}>日々の学びと、クリエイティブな開発の記録</p>
            </div>
            
            {/* ⭕ 管理者がログインしている時だけ「新規作成」へ飛べる隠しボタンを配置 */}
            {isAdmin && (
              <Link to="/admin/new" style={styles.writeButton}>
                ✍️ 新しい記事を書く
              </Link>
            )}
          </div>
        </header>

        {/* 🗂️ 記事一覧（Qiita風カードレイアウト） */}
        {posts.length === 0 ? (
          <div style={styles.emptyState}>
            <p>まだ記事が投稿されていません。</p>
          </div>
        ) : (
          <div style={styles.list}>
            {posts.map((post) => (
              <article key={post.id} style={styles.card} className="blog-card">
                
                {/* 📅 メタ情報エリア */}
                <div style={styles.cardMetaContainer}>
                  <div style={styles.cardMeta}>
                    <span>📅 {new Date(post.created_at).toLocaleDateString('ja-JP')}</span>
                    
                    {/* ⭕ もし「下書き」状態の記事なら、一覧上で優しく「下書き」バッジを添える */}
                    {!post.is_published && (
                      <span style={styles.draftBadge}>下書き</span>
                    )}
                  </div>

                  {/* ⭕ 管理者専用：カードの右上にこっそり「編集する」への直接リンクを設置 */}
                  {isAdmin && (
                    <Link to={`/admin/edit/${post.id}`} style={styles.editLink}>
                      ⚙️ 編集する
                    </Link>
                  )}
                </div>

                {/* 📑 記事本体への通常リンク */}
                <Link to={`/article/${post.id}`} style={styles.cardLink}>
                  <h2 style={styles.cardTitle}>{post.title}</h2>
                  <p style={styles.cardExcerpt}>{stripMarkdown(post.content)}</p>
                  
                  <div style={styles.cardFooter}>
                    <span style={styles.readMore}>続きを読む →</span>
                  </div>
                </Link>

              </article>
            ))}
          </div>
        )}
      </div>

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

function stripMarkdown(text: string) {
  if (!text) return '';
  return text
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^- \s+/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[.*?\]\(.*?\)/g, '');
}

const styles = {
  wrapper: { backgroundColor: '#f5f6f7', minHeight: '100vh', width: '100%', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#2d3748' },
  mainContainer: { maxWidth: '760px', margin: '0 auto', padding: '40px 20px 80px 20px' },
  blogHeader: { marginBottom: '32px', textAlign: 'left' as const, paddingLeft: '4px' },
  brandTitle: { fontSize: '26px', fontWeight: 800, color: '#1a202c', margin: '0 0 6px 0' },
  brandSubtitle: { fontSize: '14px', color: '#718096', margin: 0 },
  
  // ⭕ 管理者用「新規投稿」ボタンのスタイル
  writeButton: { textDecoration: 'none', backgroundColor: 'var(--accent)', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, boxShadow: '0 4px 6px -1px rgba(170, 59, 255, 0.2)' },
  
  list: { display: 'flex', flexDirection: 'column' as const, gap: '16px' },
  card: { backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e6ebed', padding: '24px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)', textAlign: 'left' as const },
  
  // ⭕ メタ情報と編集ボタンを横並びにするレイアウト
  cardMetaContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  cardMeta: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#718096' },
  
  // ⭕ 一覧用の下書きバッジ（目立ちすぎないソフトなベージュ）
  draftBadge: { backgroundColor: '#feebc8', color: '#c05621', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 },
  
  // ⭕ 管理者用「編集する」のひっそりとしたテキストリンク
  editLink: { textDecoration: 'none', fontSize: '12px', color: '#3182ce', fontWeight: 600 },

  cardLink: { display: 'block', textDecoration: 'none', color: 'inherit' },
  cardTitle: { fontSize: '20px', fontWeight: 700, lineHeight: 1.4, margin: '0 0 10px 0', color: '#1a202c', textAlign: 'left' as const },
  cardExcerpt: { fontSize: '14px', color: '#4a5568', lineHeight: '1.65', margin: '0 0 14px 0', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden', textAlign: 'left' as const },
  cardFooter: { display: 'flex', justifyContent: 'flex-end' as const },
  readMore: { fontSize: '13px', fontWeight: 600, color: '#00a37e' },
  emptyState: { textAlign: 'center' as const, padding: '60px 20px', color: '#718096' },
  loading: { textAlign: 'center' as const, marginTop: '150px', fontSize: '16px', color: '#718096' },
};