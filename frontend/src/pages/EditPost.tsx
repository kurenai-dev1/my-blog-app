// 📄 frontend/src/pages/EditPost.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MarkdownViewer from '../components/MarkdownViewer';

// ⭕ 型定義に is_published を追加
interface Post {
  id: number;
  title: string;
  content: string;
  is_published: boolean;
}

export default function EditPost() {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  // ⭕ 現在の記事が「公開中」か「下書き」かのステータスを保持する状態
  const [isPublished, setIsPublished] = useState(true); 
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
        // ※ 編集画面なので、万が一のために下書き状態であっても取得できるようにリクエスト
        const response = await fetch(`/api/blog/posts/${id}`);
        if (!response.ok) throw new Error('記事の取得に失敗しました');
        const data = await response.json();
        
        setTitle(data.title);
        setContent(data.content);
        // ⭕ バックエンドから届いた公開状態（true/false）をセット
        setIsPublished(data.is_published ?? true); 
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

  // 🔄 記事の更新リクエスト処理（引数で true=公開 / false=下書き を受け取る）
  const handleUpdate = async (targetPublishStatus: boolean) => {
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`/api/blog/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        // ⭕ title, content に加え、指定された公開ステータスをバックエンドに送る
        body: JSON.stringify({ 
          title, 
          content, 
          is_published: targetPublishStatus 
        }),
      });

      if (!response.ok) throw new Error('更新に失敗しました');

      // 状態を更新
      setIsPublished(targetPublishStatus);

      if (targetPublishStatus) {
        alert('🚀 記事を公開しました！');
        navigate(`/article/${id}`); // 公開したら詳細画面へ
      } else {
        alert('💾 下書きとして一時保存しました！');
        // 下書き保存の場合は画面を遷移させず、そのまま編集を続けられるようにすると親切です
      }
    } catch (error) {
      console.error(error);
      alert('保存中にエラーが発生しました。');
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

  // 🎨 以前決めた「Markdown専用のコンポーネントAPI（ツマミ）」をここで指定！
  // エディタの横幅に合わせて、公開画面（24px）より少しだけコンパクト（22px）に制御
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
            {/* ⭕ 現在のステータスが「下書き」ならバッジを表示して分かりやすく */}
            {!isPublished && <span style={styles.draftBadge}>下書き中</span>}
          </div>
          <div style={styles.tabContainer}>
            <button type="button" onClick={() => setPreview(false)} style={{...styles.tab, ...(preview ? {} : styles.activeTab)}}>エディタ</button>
            <button type="button" onClick={() => setPreview(true)} style={{...styles.tab, ...(preview ? styles.activeTab : {})}}>プレビュー確認</button>
          </div>
        </div>

        {/* 💡 ボタンごとに入れ分けるため form onSubmit ではなく通常の div に変更 */}
        <div style={styles.form}>
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
              {/* ⭕ クラス名と共に、インラインのCSS変数スコープを完璧に適用！ */}
              <div className="md-viewer" style={previewMarkdownStyles}>
                <MarkdownViewer content={content}/>
              </div>
            </div>
          )}

          <div style={styles.actions}>
            <button type="button" onClick={() => navigate(-1)} style={styles.cancelButton}>変更をキャンセル</button>
            
            {/* ⭕ 下書き保存と本番公開の2つのボタンを美しく配置 */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                onClick={() => handleUpdate(false)} // 👈 false を渡して下書き保存
                style={styles.draftButton}
              >
                下書きとして保存 📁
              </button>
              <button 
                type="button" 
                onClick={() => handleUpdate(true)}  // 👈 true を渡して本番公開
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

// 💅 スタイル定義
const styles = {
  wrapper: { backgroundColor: '#fafafa', minHeight: '100vh', width: '100%' },
  container: { maxWidth: '860px', margin: '0 auto', padding: '40px 20px' },
  editorHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  pageTitle: { fontSize: '24px', fontWeight: 800, color: '#1a202c', margin: 0 },
  // ⭕ 下書き状態であることが一目でわかるバッジのスタイル
  draftBadge: { backgroundColor: '#feebc8', color: '#c05621', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 },
  tabContainer: { display: 'flex', backgroundColor: '#edf2f7', padding: '4px', borderRadius: '8px' },
  tab: { border: 'none', background: 'none', padding: '6px 16px', fontSize: '14px', fontWeight: 600, color: '#4a5568', cursor: 'pointer', borderRadius: '6px' },
  activeTab: { backgroundColor: '#fff', color: '#1a202c', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  form: { display: 'flex', flexDirection: 'column' as const, gap: '20px' },
  titleInput: { fontSize: '28px', fontWeight: 700, padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none', color: '#1a202c' },
  toolbar: { display: 'flex', alignItems: 'center', gap: '12px' },
  toolButton: { backgroundColor: '#fff', border: '1px solid #cbd5e0', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#4a5568' },
  textarea: { minHeight: '450px', fontSize: '16px', lineHeight: '1.7', padding: '24px', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none', resize: 'vertical' as const, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#2d3748' },
  previewArea: { minHeight: '450px', backgroundColor: '#fff', padding: '24px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', lineHeight: '1.85', overflowY: 'auto' as const, color: '#2d3748', textAlign: 'left', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  actions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cancelButton: { border: 'none', background: 'none', color: '#e53e3e', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  // ⭕ 下書き保存ボタン用の少し落ち着いたスタイル
  draftButton: { backgroundColor: '#fff', color: '#4a5568', border: '1px solid #cbd5e0', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  submitButton: { backgroundColor: '#38a169', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(56, 161, 105, 0.3)' },
  loading: { textAlign: 'center' as const, marginTop: '150px', fontSize: '16px', color: '#718096' }
};