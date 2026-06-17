// 📄 frontend/src/pages/EditPost.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

interface Post {
  id: number;
  title: string;
  content: string;
}

export default function EditPost() {
  const { id } = useParams<{ id: string }>(); // 🔗 URLから記事ID（:id）を取得
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // 🔄 画面を開いた瞬間に、修正したい記事の「現在のデータ」をバックエンドから読み込む
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/blog/posts/${id}`);
        if (!response.ok) throw new Error('記事の取得に失敗しました');
        const data = await response.json();
        
        // 取得したデータを入力フォームに初期セットする
        setTitle(data.title);
        setContent(data.content);
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

  // 🔄 記事の更新リクエスト処理（PUT送信）
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`/api/blog/posts/${id}`, {
        method: 'PUT', // 💡 データベースを上書き更新するためのメソッド
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // ガードマンを突破する合鍵
        },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) throw new Error('更新に失敗しました');

      alert('📝 記事を更新しました！');
      navigate(`/article/${id}`); // 修正が終わったら、その記事の詳細画面へ戻る
    } catch (error) {
      console.error(error);
      alert('更新中にエラーが発生しました。');
    }
  };

  // 🖼️ 画像アップロード処理（新規投稿時と同じ、カーソル位置への自動挿入ロジック）
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

  if (loading) return <div style={styles.loading}>記事を読み込み中...</div>;

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <div style={styles.editorHeader}>
          <h1 style={styles.pageTitle}>記事を編集する</h1>
          <div style={styles.tabContainer}>
            <button type="button" onClick={() => setPreview(false)} style={{...styles.tab, ...(preview ? {} : styles.activeTab)}}>エディタ</button>
            <button type="button" onClick={() => setPreview(true)} style={{...styles.tab, ...(preview ? styles.activeTab : {})}}>プレビュー確認</button>
          </div>
        </div>

        <form onSubmit={handleUpdate} style={styles.form}>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required style={styles.titleInput} />

          {!preview && (
            <div style={styles.toolbar}>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={styles.toolButton}>
                {uploading ? '⌛ アップロード中...' : '🖼️ 画像を追加'}
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
            </div>
          )}

          {!preview ? (
            <textarea ref={textareaRef} value={content} onChange={(e) => setContent(e.target.value)} required style={styles.textarea} />
          ) : (
            <div style={styles.previewArea}>
<div className="md-viewer">
              <ReactMarkdown>{content}</ReactMarkdown>
</div>
            </div>
          )}

          <div style={styles.actions}>
            <button type="button" onClick={() => navigate(-1)} style={styles.cancelButton}>変更をキャンセル</button>
            <button type="submit" style={styles.submitButton}>変更を保存する 💾</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 💅 スタイル定義
const styles = {
  wrapper: { backgroundColor: '#fafafa', minHeight: '100vh', width: '100%' },
  container: { maxWidth: '860px', margin: '0 auto', padding: '40px 20px' },
  editorHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  pageTitle: { fontSize: '24px', fontWeight: 800, color: '#1a202c', margin: 0 },
  tabContainer: { display: 'flex', backgroundColor: '#edf2f7', padding: '4px', borderRadius: '8px' },
  tab: { border: 'none', background: 'none', padding: '6px 16px', fontSize: '14px', fontWeight: 600, color: '#4a5568', cursor: 'pointer', borderRadius: '6px' },
  activeTab: { backgroundColor: '#fff', color: '#1a202c', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  form: { display: 'flex', flexDirection: 'column' as const, gap: '20px' },
  titleInput: { fontSize: '28px', fontWeight: 700, padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none', color: '#1a202c' },
  toolbar: { display: 'flex', alignItems: 'center', gap: '12px' },
  toolButton: { backgroundColor: '#fff', border: '1px solid #cbd5e0', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#4a5568' },
  textarea: { minHeight: '450px', fontSize: '16px', lineHeight: '1.7', padding: '24px', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none', resize: 'vertical' as const, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#2d3748' },
  previewArea: { minHeight: '450px', backgroundColor: '#fff', padding: '24px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', lineHeight: '1.85', overflowY: 'auto' as const, color: '#2d3748', textAlign: 'left',fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  actions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cancelButton: { border: 'none', background: 'none', color: '#e53e3e', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  submitButton: { backgroundColor: '#38a169', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(56, 161, 105, 0.3)' },
  loading: { textAlign: 'center' as const, marginTop: '150px', fontSize: '16px', color: '#718096' }
};