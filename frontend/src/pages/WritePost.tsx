import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

export default function WritePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [preview, setPreview] = useState(false); // プレビューモードの切り替え
  const [uploading, setUploading] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // 📝 記事の公開処理（JWTトークンを添えてPOST）
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    if (!token) {
      alert('ログインセッションが切れています。もう一度ログインしてください。');
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('/api/blog/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // ガードマン（JWT）を通るための鍵
        },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) throw new Error('投稿に失敗しました');

      alert('🎉 記事を公開しました！');
      navigate('/'); // トップへ戻る
    } catch (error) {
      console.error(error);
      alert('投稿中にエラーが発生しました。');
    }
  };

  // 🖼️ 画像アップロード処理
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file); // バックエンドの upload.single('image') と名前を合わせる

    setUploading(true);
    try {
      const response = await fetch('/api/blog/upload', {
        method: 'POST',
        body: formData, // 💡 ファイルを送るときは Content-Type ヘッダーは不要（自動設定されます）
      });

      if (!response.ok) throw new Error('画像のアップロードに失敗しました');
      
      const data = await response.json();
      
      // バックエンドから返ってきた画像のURL
      const imageUrl = data.url;
      // Markdownの画像タグを組み立てる
      const imageMarkdown = `\n![画像の説明](${imageUrl})\n`;

      // 🪄 テキストエリアの現在のカーソル位置にMarkdownを挿入する
      const textarea = textareaRef.current;
      if (textarea) {
        const startPos = textarea.selectionStart;
        const endPos = textarea.selectionEnd;
        const textBefore = content.substring(0, startPos);
        const textAfter = content.substring(endPos, content.length);
        
        setContent(textBefore + imageMarkdown + textAfter);
        
        // 挿入後にフォーカスを戻す
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(startPos + imageMarkdown.length, startPos + imageMarkdown.length);
        }, 10);
      } else {
        // 万が一参照がない場合は末尾に追加
        setContent((prev) => prev + imageMarkdown);
      }

    } catch (error) {
      console.error(error);
      alert('画像のアップロード中にエラーが発生しました。');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // 選択をリセット
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* 🧭 ナビバー */}
      <nav style={styles.navBar}>
        <div style={styles.navInner}>
          <Link to="/" style={styles.navLogo}>Tech & Life</Link>
          <Link to="/" style={styles.loginLink}>ブログトップへ</Link>
        </div>
      </nav>

      <div style={styles.container}>
        <div style={styles.editorHeader}>
          <h1 style={styles.pageTitle}>新しい記事を書く</h1>
          
          {/* 🔘 エディタ / プレビュー の切り替えタブ */}
          <div style={styles.tabContainer}>
            <button type="button" onClick={() => setPreview(false)} style={{...styles.tab, ...(preview ? {} : styles.activeTab)}}>
              エディタ
            </button>
            <button type="button" onClick={() => setPreview(true)} style={{...styles.tab, ...(preview ? styles.activeTab : {})}}>
              プレビュー確認
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* 📌 タイトル入力 */}
          <input
            type="text"
            placeholder="記事のタイトルを入力..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={styles.titleInput}
          />

          {/* 🛠️ エディタのツールバー（プレビュー時は非表示） */}
          {!preview && (
            <div style={styles.toolbar}>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={styles.toolButton}>
                {uploading ? '⌛ アップロード中...' : '🖼️ 画像を追加'}
              </button>
              {/* 隠しファイルインプット */}
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
              <span style={styles.toolHint}>※画像をアップロードすると、Markdownタグが自動挿入されます</span>
            </div>
          )}

          {/* 📝 本文エリア / プレビューエリア の条件分岐 */}
          {!preview ? (
            <textarea
              ref={textareaRef}
              placeholder="ここからMarkdownで記事を執筆できます（# 見出し、- 箇条書き など）"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              style={styles.textarea}
            />
          ) : (
            <div style={styles.previewArea}>
              {content ? (
                <ReactMarkdown>{content}</ReactMarkdown>
              ) : (
                <p style={{ color: '#a0aec0', textAlign: 'center', marginTop: '40px' }}>本文が空っぽです。エディタに戻って書いてみましょう！</p>
              )}
            </div>
          )}

          {/* 🚀 アクションボタン */}
          <div style={styles.actions}>
            <button type="button" onClick={() => navigate(-1)} style={styles.cancelButton}>
              下書きを破棄して戻る
            </button>
            <button type="submit" style={styles.submitButton}>
              記事を公開する 🚀
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 💅 クリエイティブな執筆に集中できるモダンエディタスタイル
const styles = {
  wrapper: { backgroundColor: '#fafafa', minHeight: '100vh', width: '100%', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#2d3748', paddingTop: '60px' },
  navBar: { position: 'fixed' as const, top: 0, left: 0, right: 0, height: '56px', backgroundColor: '#fff', borderBottom: '1px solid #edf2f7', zIndex: 1000 },
  navInner: { maxWidth: '1000px', height: '100%', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navLogo: { textDecoration: 'none', fontWeight: 700, color: '#1a202c', fontSize: '16px' },
  loginLink: { textDecoration: 'none', fontSize: '13px', fontWeight: 500, color: '#718096' },
  container: { maxWidth: '860px', margin: '0 auto', padding: '40px 20px' },
  editorHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' as const, gap: '16px' },
  pageTitle: { fontSize: '24px', fontWeight: 800, color: '#1a202c', margin: 0 },
  tabContainer: { display: 'flex', backgroundColor: '#edf2f7', padding: '4px', borderRadius: '8px' },
  tab: { border: 'none', background: 'none', padding: '6px 16px', fontSize: '14px', fontWeight: 600, color: '#4a5568', cursor: 'pointer', borderRadius: '6px', transition: 'all 0.2s' },
  activeTab: { backgroundColor: '#fff', color: '#1a202c', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  form: { display: 'flex', flexDirection: 'column' as const, gap: '20px' },
  titleInput: { fontSize: '28px', fontWeight: 700, padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none', color: '#1a202c', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  toolbar: { display: 'flex', alignItems: 'center', gap: '12px', padding: '0 4px' },
  toolButton: { backgroundColor: '#fff', border: '1px solid #cbd5e0', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#4a5568', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  toolHint: { fontSize: '12px', color: '#718096' },
  textarea: { minHeight: '450px', fontSize: '16px', lineHeight: '1.7', padding: '24px', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none', resize: 'vertical' as const, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#2d3748', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  previewArea: { minHeight: '450px', backgroundColor: '#fff', padding: '24px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', lineHeight: '1.85', color: '#2d3748', overflowY: 'auto' as const, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  actions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' },
  cancelButton: { border: 'none', background: 'none', color: '#e53e3e', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  submitButton: { backgroundColor: '#3182ce', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(49, 130, 206, 0.3)', transition: 'all 0.2s' },
  loading: { textAlign: 'center' as const, marginTop: '150px', fontSize: '16px', color: '#718096' }
};