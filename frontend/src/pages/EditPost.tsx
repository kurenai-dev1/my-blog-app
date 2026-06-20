// 📄 frontend/src/pages/EditPost.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MarkdownViewer from '../components/MarkdownViewer';

// 📅 ISO形式の文字列を input[type="datetime-local"] のフォーマット（YYYY-MM-DDTHH:mm）に変換するヘルパー関数
const formatISOToDateTimeString = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export default function EditPost() {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(true); 
  const [publishedAt, setPublishedAt] = useState(''); // ⭕ 公開日時のStateを追加
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // 🔄 画面を開いた瞬間に記事データを取得
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/blog/posts/${id}`);
        if (!response.ok) throw new Error('記事の取得に失敗しました');
        const data = await response.json();
        
        setTitle(data.title);
        setContent(data.content);
        setIsPublished(data.is_published ?? true); 
        // ⭕ DBから届いた公開日を、input用にフォーマット変換してセット（値がなければcreated_at等でフォールバック）
        setPublishedAt(formatISOToDateTimeString(data.published_at || data.created_at));
      } catch (error) {
        console.error(error);
        alert('記事の読み込みに失敗しました。');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, navigate]);

  // 🔄 記事の更新リクエスト処理
  const handleUpdate = async (targetPublishStatus: boolean) => {
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`/api/blog/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        // ⭕ body に published_at を追加してバックエンドに投げる
        body: JSON.stringify({ 
          title, 
          content, 
          is_published: targetPublishStatus,
          published_at: publishedAt ? new Date(publishedAt).toISOString() : null // ISO文字列に変換して送信
        }),
      });

      if (!response.ok) throw new Error('更新に失敗しました');

      setIsPublished(targetPublishStatus);

      if (targetPublishStatus) {
        alert('🚀 記事を公開しました！');
        navigate(`/article/${id}`); 
      } else {
        alert('💾 下書きとして一時保存しました！');
      }
    } catch (error) {
      console.error(error);
      alert('保存中にエラーが発生しました。');
    }
  };

  // 🖼️ 画像アップロード処理 (変更なし)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      const response = await fetch('/api/blog/upload', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('アップロード失敗');
      const data = await response.json();
      
      const imageMarkdown = `\n![画像の説明](${data.url})\n`;
      const textarea = textareaRef.current;
      if (textarea) {
        const startPos = textarea.selectionStart;
        const endPos = textarea.selectionEnd;
        setContent(content.substring(0, startPos) + imageMarkdown + content.substring(endPos, content.length));
      } else {
        setContent((prev) => prev + imageMarkdown);
      }
    } catch (error) {
      console.error(error);
      alert('画像アップロードに失敗しました。');
    } finally {
      setUploading(false);
    }
  };

  const previewMarkdownStyles = {
    '--md-h1-size': '22px',
    '--md-h2-size': '18px',
  } as React.CSSProperties;

  if (loading) return <div style={styles.loading}>記事を読み込み中...</div>;

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <div style={styles.editorHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={styles.pageTitle}>記事を編集する</h1>
            {!isPublished && <span style={styles.draftBadge}>下書き中</span>}
          </div>
          <div style={styles.tabContainer}>
            <button type="button" onClick={() => setPreview(false)} style={{...styles.tab, ...(preview ? {} : styles.activeTab)}}>エディタ</button>
            <button type="button" onClick={() => setPreview(true)} style={{...styles.tab, ...(preview ? styles.activeTab : {})}}>プレビュー確認</button>
          </div>
        </div>

        <div style={styles.form}>
          {/* 📅 【新規追加】設定ツールバー（公開日修正用） */}
          {!preview && (
            <div style={styles.settingsBar}>
              <label style={styles.dateLabel}>
                📅 公開日時の修正:
                <input
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  style={styles.dateInput}
                />
              </label>
            </div>
          )}

          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required style={styles.titleInput} placeholder="タイトルを入力" />

          {!preview && (
            <div style={styles.toolbar}>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={styles.toolButton}>
                {uploading ? '⌛ アップロード中...' : '🖼️ 画像を追加'}
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
            </div>
          )}

          {!preview ? (
            <textarea ref={textareaRef} value={content} onChange={(e) => setContent(e.target.value)} required style={styles.textarea} placeholder="Markdownで記事を執筆..." />
          ) : (
            <div style={styles.previewArea}>
              <div className="md-viewer" style={previewMarkdownStyles}>
                <MarkdownViewer content={content}/>
              </div>
            </div>
          )}

          <div style={styles.actions}>
            <button type="button" onClick={() => navigate(-1)} style={styles.cancelButton}>変更をキャンセル</button>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                onClick={() => handleUpdate(false)} 
                style={styles.draftButton}
              >
                下書きとして保存 📁
              </button>
              <button 
                type="button" 
                onClick={() => handleUpdate(true)}  
                style={styles.submitButton}
              >
                {isPublished ? '変更を公開する 🚀' : 'この記事を公開する 🚀'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 🎨 追加した日時入力用のスタイルを統合
const styles = {
  wrapper: { backgroundColor: '#fafafa', minHeight: '100vh', width: '100%' },
  container: { maxWidth: '860px', margin: '0 auto', padding: '40px 20px' },
  editorHeader: {
    // --- ここから追加・修正 ---
    position: 'sticky',      // ⭕ スクロールしても画面にくっつく
    top: '56px',             // ⭕ ナビゲーションバー(56px)のすぐ下に固定
    zIndex: 10,              // ⭕ 本文より上に表示されるようにする
    backgroundColor: '#fafafa', // ⭕ 背景を wrapper と同じ色にして、後ろの文字が透けないようにする
    padding: '10px 0',       // ⭕ 固定された時に少し余白を持たせる
    // --- ここまで ---
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' 
  },
  pageTitle: { fontSize: '24px', fontWeight: 800, color: '#1a202c', margin: 0 },
  draftBadge: { backgroundColor: '#feebc8', color: '#c05621', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 },
  tabContainer: { display: 'flex', backgroundColor: '#edf2f7', padding: '4px', borderRadius: '8px' },
  tab: { border: 'none', background: 'none', padding: '6px 16px', fontSize: '14px', fontWeight: 600, color: '#4a5568', cursor: 'pointer', borderRadius: '6px' },
  activeTab: { backgroundColor: '#fff', color: '#1a202c', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  form: { display: 'flex', flexDirection: 'column' as const, gap: '20px' },

  // 📅 新設した公開日時バーのスタイル（WritePostと統一）
  settingsBar: { backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', gap: '16px', alignItems: 'center' },
  dateLabel: { fontSize: '14px', fontWeight: 600, color: '#4a5568', display: 'flex', alignItems: 'center', gap: '10px' },
  dateInput: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px', color: '#2d3748', outline: 'none', fontFamily: 'inherit' },

  titleInput: { fontSize: '28px', fontWeight: 700, padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none', color: '#1a202c' },
  toolbar: { display: 'flex', alignItems: 'center', gap: '12px' },
  toolButton: { backgroundColor: '#fff', border: '1px solid #cbd5e0', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#4a5568' },
  textarea: { minHeight: '450px', fontSize: '16px', lineHeight: '1.7', padding: '24px', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none', resize: 'vertical' as const, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#2d3748' },
  previewArea: { minHeight: '450px', backgroundColor: '#fff', padding: '24px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', lineHeight: '1.85', overflowY: 'auto' as const, color: '#2d3748', textAlign: 'left' as const, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  actions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cancelButton: { border: 'none', background: 'none', color: '#e53e3e', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  draftButton: { backgroundColor: '#fff', color: '#4a5568', border: '1px solid #cbd5e0', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  submitButton: { backgroundColor: '#38a169', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(56, 161, 105, 0.3)' },
  loading: { textAlign: 'center' as const, marginTop: '150px', fontSize: '16px', color: '#718096' }
};