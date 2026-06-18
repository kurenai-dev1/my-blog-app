// 📄 frontend/src/pages/WritePost.tsx

import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

export default function WritePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // 📝 記事の保存処理（引数で true=即時公開 / false=下書き保存 を切り替える）
  const handleSave = async (isPublishedTarget: boolean) => {
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
          'Authorization': `Bearer ${token}`,
        },
        // ⭕ title, content に加え、指定された公開ステータスをバックエンドに送る
        body: JSON.stringify({ 
          title, 
          content, 
          is_published: isPublishedTarget 
        }),
      });

      if (!response.ok) throw new Error('投稿に失敗しました');

      if (isPublishedTarget) {
        alert('🎉 記事を公開しました！');
        navigate('/'); // 公開したらトップ（一覧）へ
      } else {
        alert('💾 下書きとして一時保存しました！');
        // 下書きの場合は一覧に戻るか、そのまま書き続けられるようにダッシュボード等に戻るのが一般的です
        // ここでは一旦トップ（一覧）に戻るようにしています
        navigate('/'); 
      }
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
    formData.append('image', file);

    setUploading(true);
    try {
      const response = await fetch('/api/blog/upload', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('画像のアップロードに失敗しました');
      const data = await response.json();
      
      const imageMarkdown = `\n![画像の説明](${data.url})\n`;

      const textarea = textareaRef.current;
      if (textarea) {
        const startPos = textarea.selectionStart;
        const endPos = textarea.selectionEnd;
        setContent(content.substring(0, startPos) + imageMarkdown + content.substring(endPos, content.length));
        
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(startPos + imageMarkdown.length, startPos + imageMarkdown.length);
        }, 10);
      } else {
        setContent((prev) => prev + imageMarkdown);
      }
    } catch (error) {
      console.error(error);
      alert('画像のアップロード中にエラーが発生しました。');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 🎨 編集画面（EditPost）と完全に合わせた「Markdown専用のコンポーネントAPI（ツマミ）」
  const previewMarkdownStyles = {
    '--md-h1-size': '22px',
    '--md-h2-size': '18px',
  } as React.CSSProperties;

  return (
    <div style={styles.wrapper}>
      <nav style={styles.navBar}>
        <div style={styles.navInner}>
          <Link to="/" style={styles.navLogo}>Tech & Life</Link>
          <Link to="/" style={styles.loginLink}>ブログトップへ</Link>
        </div>
      </nav>

      <div style={styles.container}>
        <div style={styles.editorHeader}>
          <h1 style={styles.pageTitle}>新しい記事を書く</h1>
          
          <div style={styles.tabContainer}>
            <button type="button" onClick={() => setPreview(false)} style={{...styles.tab, ...(preview ? {} : styles.activeTab)}}>エディタ</button>
            <button type="button" onClick={() => setPreview(true)} style={{...styles.tab, ...(preview ? styles.activeTab : {})}}>プレビュー確認</button>
          </div>
        </div>

        {/* 💡 ボタン出し分けのため onSubmit ではなく通常の div に変更 */}
        <div style={styles.form}>
          <input
            type="text"
            placeholder="記事のタイトルを入力..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={styles.titleInput}
          />

          {!preview && (
            <div style={styles.toolbar}>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={styles.toolButton}>
                {uploading ? '⌛ アップロード中...' : '🖼️ 画像を追加'}
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
              <span style={styles.toolHint}>※画像をアップロードすると、Markdownタグが自動挿入されます</span>
            </div>
          )}

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
                /* ⭕ クラス名と共に、インラインのCSS変数スコープをEditPostと完全同期！ */
                <div className="md-viewer" style={previewMarkdownStyles}>
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              ) : (
                <p style={{ color: '#a0aec0', textAlign: 'center', marginTop: '40px' }}>本文が空っぽです。エディタに戻って書いてみましょう！</p>
              )}
            </div>
          )}

          <div style={styles.actions}>
            <button type="button" onClick={() => navigate(-1)} style={styles.cancelButton}>
              下書きを破棄して戻る
            </button>
            
            {/* ⭕ 下書き保存と本番公開の2つのボタンを配置 */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                onClick={() => handleSave(false)} // 👈 false で下書き保存
                style={styles.draftButton}
              >
                下書きとして保存 📁
              </button>
              <button 
                type="button" 
                onClick={() => handleSave(true)}  // 👈 true で本番公開
                style={styles.submitButton}
              >
                記事を公開する 🚀
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  previewArea: { minHeight: '450px', backgroundColor: '#fff', padding: '24px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', lineHeight: '1.85', color: '#2d3748', overflowY: 'auto' as const, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', textAlign: 'left' as const },
  actions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' },
  cancelButton: { border: 'none', background: 'none', color: '#e53e3e', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  // ⭕ 下書き保存ボタン用の少し落ち着いたスタイル
  draftButton: { backgroundColor: '#fff', color: '#4a5568', border: '1px solid #cbd5e0', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  submitButton: { backgroundColor: '#3182ce', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(49, 130, 206, 0.3)', transition: 'all 0.2s' }
};