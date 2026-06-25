// 📄 frontend/src/pages/Home.tsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// 🏷️ タグオブジェクトの型定義
interface Tag {
  id?: number;
  name: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  is_published: boolean; 
  created_at: string;
  published_at: string; 
  updated_at: string;   
  tags?: (string | Tag)[]; // ⭕ 記事に紐づくタグ配列の型を追加
}

interface Pagination {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null); 
  const [sortBy, setSortBy] = useState<'published' | 'updated'>('published'); 
  const [page, setPage] = useState<number>(1); 
  const [loading, setLoading] = useState(true);
  
  // 🏷️ 選択中の絞り込みタグの状態管理を追加
  // const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(() => {
    const savedTag = sessionStorage.getItem('selected_blog_tag');
    // 明示的に解除された（'none' が入っている）場合は null、記憶がなければ 'はじめに'
    if (savedTag === 'none') return null;
    return savedTag || 'はじめに';
  });

  const isAdmin = !!localStorage.getItem('token'); 

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        // ⭕ sort, page に加え、selectedTag があればクエリパラメータに追加する
        let url = `/api/blog/posts?sort=${sortBy}&page=${page}&limit=5`; 
        if (isAdmin) url += '&all=true';
        if (selectedTag) url += `&tag=${encodeURIComponent(selectedTag)}`; // 🏷️ タグ絞り込みを追加

        const response = await fetch(url);
        const data = await response.json();
        
        setPosts(data.articles || []);
        setPagination(data.pagination || null);
      } catch (error) {
        console.error('記事の取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [isAdmin, sortBy, page, selectedTag]); // ⭕ 選択されたタグが変わったら再取得

  // ⭕ ソートが切り替わったらページを1番最初に戻す安全設計
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as 'published' | 'updated');
    setPage(1);
  };

  // 🏷️ タグがクリックされたときの処理
  const handleTagClick = (tagName: string, e: React.MouseEvent) => {
    e.preventDefault(); 
    setSelectedTag(tagName);
    sessionStorage.setItem('selected_blog_tag', tagName); // ⭕ 選択したタグを記憶
    setPage(1); 
  };

  // 🏷️ タグデータを安全に文字列配列に統一するヘルパー
  const getTagNames = (postTags?: (string | Tag)[]): string[] => {
    if (!postTags || !Array.isArray(postTags)) return [];
    return postTags.map(tag => 
      typeof tag === 'object' && tag !== null ? tag.name : String(tag)
    );
  };

  // 🏷️ 【新規追加】絞り込みを解除するときの処理
  const handleClearFilter = () => {
    setSelectedTag(null);
    sessionStorage.setItem('selected_blog_tag', 'none'); // ⭕ 解除された状態（none）を記憶
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

        {/* ⚙️ 操作バー（ソート ＆ 🏷️ 絞り込みステータス） */}
        <div style={styles.toolbar}>
          {/* 🏷️ タグ絞り込み中の場合、解除用のバッジバーを表示 */}
          {selectedTag ? (
            <div style={styles.filterStatus}>
              <span style={styles.filterText}>🏷️ 絞り込み中: <strong>#{selectedTag}</strong></span>
              <button onClick={handleClearFilter} style={styles.clearFilterButton}>
                解除 ×
              </button>
            </div>
          ) : (
            <div /> // レイアウト崩れ防止の空プレースホルダー
          )}

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
            <p>{selectedTag ? `#${selectedTag} に該当する記事は見つかりませんでした。` : 'まだ記事が投稿されていません。'}</p>
          </div>
        ) : (
          <>
            {/* 🗂️ 記事一覧 */}
            <div style={styles.list}>
              {posts.map((post) => {
                const tagNames = getTagNames(post.tags);
                return (
                  <article key={post.id} style={styles.card} className="blog-card">
                    
                    {/* 📅 メタ情報エリア */}
                    <div style={styles.cardMetaContainer}>
                      <div style={styles.cardMeta}>
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
                    </Link>

                    {/* 🏷️ 各記事カード内の所属タグ一覧（最下部に配置） */}
                    <div style={styles.cardFooterContainer}>
                      <div style={styles.cardTagsRow}>
                        {tagNames.map((tagName, index) => (
                          <button
                            key={index}
                            onClick={(e) => handleTagClick(tagName, e)}
                            style={{
                              ...styles.cardTagBadge,
                              ...(selectedTag === tagName ? styles.cardTagBadgeActive : {})
                            }}
                          >
                            #{tagName}
                          </button>
                        ))}
                      </div>
                      
                      <Link to={`/article/${post.id}`} style={styles.cardLink}>
                        <span style={styles.readMore}>続きを読む →</span>
                      </Link>
                    </div>

                  </article>
                );
              })}
            </div>

            {/* 🧭 ページングコントロール */}
            {pagination && pagination.totalPages > 1 && (
              <div style={styles.paginationContainer}>
                <button 
                  disabled={page === 1} 
                  onClick={() => setPage(p => p - 1)}
                  style={{ ...styles.pageButton, ...(page === 1 ? styles.disabledButton : {}) }}
                >
                  ◀ 前へ
                </button>
                
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => setPage(num)}
                    style={{ 
                      ...styles.pageButton, 
                      ...((page === num) ? styles.activePageButton : {}) 
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

// 🎨 タグパーツ用のスタイルを拡張・統合
const styles = {
  wrapper: { backgroundColor: '#f5f6f7', minHeight: '100vh', width: '100%', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#2d3748' },
  mainContainer: { maxWidth: '760px', margin: '0 auto', padding: '40px 20px 80px 20px' },
  blogHeader: { marginBottom: '20px', textAlign: 'left' as const, paddingLeft: '4px' },
  brandTitle: { fontSize: '26px', fontWeight: 800, color: '#1a202c', margin: '0 0 6px 0' },
  brandSubtitle: { fontSize: '14px', color: '#718096', margin: 0 },
  writeButton: { textDecoration: 'none', backgroundColor: '#aa3bff', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, boxShadow: '0 4px 6px -1px rgba(170, 59, 255, 0.2)' },
  
  // ⚙️ 操作バー（横並び用）
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 4px' },
  selectWrapper: { display: 'flex', alignItems: 'center', gap: '8px' },
  label: { fontSize: '13px', color: '#4a5568', fontWeight: 600 },
  select: { padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', backgroundColor: '#fff', fontSize: '13px', color: '#2d3748', cursor: 'pointer', outline: 'none' },

  // 🏷️ 絞り込みステータスバー
  filterStatus: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#e6fffa', border: '1px solid #b2f5ea', padding: '4px 12px', borderRadius: '20px' },
  filterText: { fontSize: '13px', color: '#006d5b' },
  clearFilterButton: { border: 'none', background: 'transparent', color: '#e53e3e', fontWeight: 700, cursor: 'pointer', fontSize: '12px', padding: '0 0 0 4px' },

  list: { display: 'flex', flexDirection: 'column' as const, gap: '16px' },
  card: { backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e6ebed', padding: '24px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)', textAlign: 'left' as const },
  cardMetaContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  cardMeta: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#718096' },
  draftBadge: { backgroundColor: '#feebc8', color: '#c05621', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 },
  editLink: { textDecoration: 'none', fontSize: '12px', color: '#3182ce', fontWeight: 600 },
  cardLink: { display: 'block', textDecoration: 'none', color: 'inherit' },
  cardTitle: { fontSize: '20px', fontWeight: 700, lineHeight: 1.4, margin: '0 0 10px 0', color: '#1a202c', textAlign: 'left' as const },
  cardExcerpt: { fontSize: '14px', color: '#4a5568', lineHeight: '1.65', margin: '0 0 14px 0', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden', textAlign: 'left' as const },
  
  // 🏷️ カード最下部のフッター配置（タグ群 ＆ 続きを読むを並列化）
  cardFooterContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', borderTop: '1px solid #f7fafc', paddingTop: '12px' },
  cardTagsRow: { display: 'flex', flexWrap: 'wrap' as const, gap: '6px' },
  cardTagBadge: { border: 'none', backgroundColor: '#edf2f7', color: '#4a5568', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.2s' },
  cardTagBadgeActive: { backgroundColor: '#00a37e', color: '#fff' }, // 現在選択中のタグを目立たせる

  readMore: { fontSize: '13px', fontWeight: 600, color: '#00a37e' },
  emptyState: { textAlign: 'center' as const, padding: '60px 20px', color: '#718096' },
  loading: { textAlign: 'center' as const, marginTop: '150px', fontSize: '16px', color: '#718096' },

  paginationContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '36px' },
  pageButton: { padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e0', backgroundColor: '#fff', color: '#4a5568', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  activePageButton: { backgroundColor: '#00a37e', color: '#fff', borderColor: '#00a37e' },
  disabledButton: { opacity: 0.5, cursor: 'not-allowed', backgroundColor: '#e2e8f0' }
};