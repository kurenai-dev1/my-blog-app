// 📄 frontend/src/pages/Home.tsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Post {
  id: number;
  title: string;
  content: string;
  is_published: boolean; 
  created_at: string;
  published_at: string; // ⭕ 追加
  updated_at: string;   // ⭕ 追加
}

// ⭕ ページングデータのインターフェース定義
interface Pagination {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null); // ⭕ ページング状態
  const [sortBy, setSortBy] = useState<'published' | 'updated'>('published'); // ⭕ ソート状態
  const [page, setPage] = useState<number>(1); // ⭕ 現在のページ状態
  const [loading, setLoading] = useState(true);
  
  const isAdmin = !!localStorage.getItem('token'); 

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        // ⭕ バックエンドに sort と page をクエリパラメータとして渡す
        let url = `/api/blog/posts?sort=${sortBy}&page=${page}&limit=5`; // テストしやすいよう1ページ5件に設定（必要に応じて10等に変更）
        if (isAdmin) url += '&all=true';

        const response = await fetch(url);
        const data = await response.json();
        
        // ⭕ バックエンドの新しいデータ構造（articles と pagination）を分配格納
        setPosts(data.articles || []);
        setPagination(data.pagination || null);
      } catch (error) {
        console.error('記事の取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [isAdmin, sortBy, page]); // ⭕ ソートやページが切り替わったら再取得する

  // ⭕ ソートが切り替わったらページを1番最初に戻す安全設計
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as 'published' | 'updated');
    setPage(1);
  };

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
            {isAdmin && (
              <Link to="/admin/new" style={styles.writeButton}>
                ✍️ 新しい記事を書く
              </Link>
            )}
          </div>
        </header>

        {/* ⚙️ 【新規追加】ソート用操作バー */}
        <div style={styles.toolbar}>
          <div style={styles.selectWrapper}>
            <label style={styles.label}>並び替え:</label>
            <select value={sortBy} onChange={handleSortChange} style={styles.select}>
              <option value="published">📅 公開日が新しい順</option>
              <option value="updated">🔄 更新日が新しい順</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={styles.loading}>Loading...</div>
        ) : posts.length === 0 ? (
          <div style={styles.emptyState}>
            <p>まだ記事が投稿されていません。</p>
          </div>
        ) : (
          <>
            {/* 🗂️ 記事一覧 */}
            <div style={styles.list}>
              {posts.map((post) => (
                <article key={post.id} style={styles.card} className="blog-card">
                  
                  {/* 📅 メタ情報エリア */}
                  <div style={styles.cardMetaContainer}>
                    <div style={styles.cardMeta}>
                      {/* 💡 ソート基準が更新日の時は更新日マーク、それ以外は公開日マークを表示 */}
                      {sortBy === 'updated' ? (
                        <span>🔄 更新: {new Date(post.updated_at).toLocaleDateString('ja-JP')}</span>
                      ) : (
                        <span>📅 公開: {new Date(post.published_at || post.created_at).toLocaleDateString('ja-JP')}</span>
                      )}
                      
                      {!post.is_published && (
                        <span style={styles.draftBadge}>下書き</span>
                      )}
                    </div>

                    {isAdmin && (
                      <Link to={`/admin/edit/${post.id}`} style={styles.editLink}>
                        ⚙️ 編集する
                      </Link>
                    )}
                  </div>

                  {/* 📑 記事本体へのリンク */}
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

            {/* 🧭 【新規追加】ページングコントロール */}
            {pagination && pagination.totalPages > 1 && (
              <div style={styles.paginationContainer}>
                <button 
                  disabled={page === 1} 
                  onClick={() => setPage(p => p - 1)}
                  style={{ ...styles.pageButton, ...(page === 1 ? styles.disabledButton : {}) }}
                >
                  ◀ 前へ
                </button>
                
                {/* 1, 2, 3 などのページ番号を動的ループ出力 */}
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => setPage(num)}
                    style={{ 
                      ...styles.pageButton, 
                      ...(page === num ? styles.activePageButton : {}) 
                    }}
                  >
                    {num}
                  </button>
                ))}

                <button 
                  disabled={page === pagination.totalPages} 
                  onClick={() => setPage(p => p + 1)}
                  style={{ ...styles.pageButton, ...(page === pagination.totalPages ? styles.disabledButton : {}) }}
                >
                  次へ ▶
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .blog-card { transition: transform 0.2s ease, box-shadow 0.2s ease !important; }
        .blog-card:hover { transform: translateY(-2px); box-shadow: 0 12px 20px -8px rgba(0, 0, 0, 0.15) !important; }
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

// 🎨 新規追加パーツのスタイルを統合
const styles = {
  wrapper: { backgroundColor: '#f5f6f7', minHeight: '100vh', width: '100%', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#2d3748' },
  mainContainer: { maxWidth: '760px', margin: '0 auto', padding: '40px 20px 80px 20px' },
  blogHeader: { marginBottom: '20px', textAlign: 'left' as const, paddingLeft: '4px' },
  brandTitle: { fontSize: '26px', fontWeight: 800, color: '#1a202c', margin: '0 0 6px 0' },
  brandSubtitle: { fontSize: '14px', color: '#718096', margin: 0 },
  writeButton: { textDecoration: 'none', backgroundColor: '#aa3bff', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, boxShadow: '0 4px 6px -1px rgba(170, 59, 255, 0.2)' },
  
  // ⚙️ ソート操作バー用スタイル
  toolbar: { display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', paddingRight: '4px' },
  selectWrapper: { display: 'flex', alignItems: 'center', gap: '8px' },
  label: { fontSize: '13px', color: '#4a5568', fontWeight: 600 },
  select: { padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', backgroundColor: '#fff', fontSize: '13px', color: '#2d3748', cursor: 'pointer', outline: 'none' },

  list: { display: 'flex', flexDirection: 'column' as const, gap: '16px' },
  card: { backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e6ebed', padding: '24px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)', textAlign: 'left' as const },
  cardMetaContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  cardMeta: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#718096' },
  draftBadge: { backgroundColor: '#feebc8', color: '#c05621', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 },
  editLink: { textDecoration: 'none', fontSize: '12px', color: '#3182ce', fontWeight: 600 },
  cardLink: { display: 'block', textDecoration: 'none', color: 'inherit' },
  cardTitle: { fontSize: '20px', fontWeight: 700, lineHeight: 1.4, margin: '0 0 10px 0', color: '#1a202c', textAlign: 'left' as const },
  cardExcerpt: { fontSize: '14px', color: '#4a5568', lineHeight: '1.65', margin: '0 0 14px 0', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden', textAlign: 'left' as const },
  cardFooter: { display: 'flex', justifyContent: 'flex-end' as const },
  readMore: { fontSize: '13px', fontWeight: 600, color: '#00a37e' },
  emptyState: { textAlign: 'center' as const, padding: '60px 20px', color: '#718096' },
  loading: { textAlign: 'center' as const, marginTop: '150px', fontSize: '16px', color: '#718096' },

  // 🧭 ページングUI用スタイル
  paginationContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '36px' },
  pageButton: { padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e0', backgroundColor: '#fff', color: '#4a5568', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  activePageButton: { backgroundColor: '#00a37e', color: '#fff', borderColor: '#00a37e' },
  disabledButton: { opacity: 0.5, cursor: 'not-allowed', backgroundColor: '#e2e8f0' }
};