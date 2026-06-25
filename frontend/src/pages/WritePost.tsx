// 📄 frontend/src/pages/WritePost.tsx

import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// import ReactMarkdown from 'react-markdown';
import MarkdownViewer from '../components/MarkdownViewer';

// 📅 日本時間の現在時刻を input[type="datetime-local"] のフォーマット（YYYY-MM-DDTHH:mm）に変換するヘルパー関数
const getJSTDateTimeString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
  return localISOTime;
};

export default function WritePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [publishedAt, setPublishedAt] = useState(getJSTDateTimeString());
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // 🏷️ タグ管理用の State を追加
  const [tags, setTags] = useState<string[]>([]); // 確定したタグ名の配列
  const [tagInput, setTagInput] = useState('');   // 入力中の文字面

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // 🏷️ タグ入力欄でキーボードが叩かれたときの処理
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enterキー または カンマ が押されたら確定
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault(); // フォームが勝手に送信されるのをガード
      
      const trimmed = tagInput.trim().replace(/,/g, ''); // 空白とカンマの除去
      
      if (trimmed && !tags.includes(trimmed)) {
        if (tags.length >= 5) {
          alert('タグは最大5つまで登録できます。');
          return;
        }
        setTags([...tags, trimmed]);
      }
      setTagInput(''); // 入力欄をまっさらに
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      // 文字が空の状態でBackSpaceを押したら、最後のタグを1くくりで消す親切設計
      setTags(tags.slice(0, -1));
    }
  };

  // 🏷️ タグの [×] ボタンを押したときの削除処理
  const removeTag = (indexToRemove: number) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  // 📝 記事の保存処理（タグを乗せて送信）
  const handleSave = async (isPublishedTarget: boolean) => {
    const token = localStorage.getItem('token');

    // 👇 【ここを追加】送信時に、入力欄にEnter押していない文字が残っていたら強制的に配列に入れる救済処置
    let finalTags = [...tags];
    const trimmedInput = tagInput.trim().replace(/,/g, '');
    if (trimmedInput && !finalTags.includes(trimmedInput)) {
      if (finalTags.length < 5) {
        finalTags.push(trimmedInput);
        setTags(finalTags); // 画面の表示も更新
        setTagInput('');    // 入力欄をクリア
      }
    }

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
        body: JSON.stringify({ 
          title, 
          content, 
          is_published: isPublishedTarget,
          published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
          tags: finalTags // ⭕ 確定したタグの配列（['React', 'Go']など）をバックエンドへ引き渡す
        }),
      });

      if (!response.ok) throw new Error('投稿に失敗しました');

      if (isPublishedTarget) {
        alert('🎉 記事を公開しました！');
        navigate('/');
      } else {
        alert('💾 下書きとして一時保存しました！');
        navigate('/'); 
      }
    } catch (error) {
      console.error(error);
      alert('投稿中にエラーが発生しました。');
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
      // 浮いていた uploading; を綺麗に削除
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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

        <div style={styles.form}>
          {/* 📅 設定ツールバー（公開日指定 ＆ 🏷️タグ入力を横並びに同居させる） */}
          {!preview && (
            <div style={styles.settingsBar}>
              <label style={styles.dateLabel}>
                📅 公開日時:
                <input
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  style={styles.dateInput}
                />
              </label>

              {/* 垂直セパレーター線 */}
              <div style={styles.separator} />

              {/* 🏷️ タグ入力UIセクション */}
              <div style={styles.tagSection}>
                <span style={styles.tagSectionLabel}>🏷️ タグ:</span>
                <div style={styles.tagInputWrapper}>
                  {tags.map((tag, index) => (
                    <span key={index} style={styles.tagBadge}>
                      #{tag}
                      <button type="button" onClick={() => removeTag(index)} style={styles.tagDeleteButton}>×</button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder={tags.length === 0 ? "タグを入力してEnter..." : "追加..."}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    style={styles.tagInputField}
                  />
                </div>
              </div>
            </div>
          )}

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
              {/* 👁️ プレビュー時にも設定されたタグを確認できるように最上部に配置 */}
              {tags.length > 0 && (
                <div style={styles.previewTagLine}>
                  {tags.map((tag, index) => (
                    <span key={index} style={styles.previewTagBadge}>#{tag}</span>
                  ))}
                </div>
              )}
              
              {content ? (
                <div className="md-viewer" style={previewMarkdownStyles}>
                  <MarkdownViewer content={content}/>
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
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                onClick={() => handleSave(false)} 
                style={styles.draftButton}
              >
                下書きとして保存 📁
              </button>
              <button 
                type="button" 
                onClick={() => handleSave(true)}  
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

// 🎨 スタイル定義（Sticky の型エラー対策 as const 適用 ＆ タグスタイルを美しく追加）
const styles = {
  wrapper: { backgroundColor: '#fafafa', minHeight: '100vh', width: '100%', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#2d3748', paddingTop: '60px' },
  navBar: { position: 'fixed' as const, top: 0, left: 0, right: 0, height: '56px', backgroundColor: '#fff', borderBottom: '1px solid #edf2f7', zIndex: 1000 },
  navInner: { maxWidth: '1000px', height: '100%', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navLogo: { textDecoration: 'none', fontWeight: 700, color: '#1a202c', fontSize: '16px' },
  loginLink: { textDecoration: 'none', fontSize: '13px', fontWeight: 500, color: '#718096' },
  container: { maxWidth: '860px', margin: '0 auto', padding: '40px 20px' },
  
  editorHeader: {
    position: 'sticky' as const, // ⭕ TSエラー回避のために as const を追加
    top: '56px',              
    zIndex: 10,              
    backgroundColor: '#fafafa', 
    padding: '10px 0',       
    display: 'flex' as const,    // ⭕ as const を追加
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '24px' 
  },
  pageTitle: { fontSize: '24px', fontWeight: 800, color: '#1a202c', margin: 0 },
  tabContainer: { display: 'flex', backgroundColor: '#edf2f7', padding: '4px', borderRadius: '8px' },
  tab: { border: 'none', background: 'none', padding: '6px 16px', fontSize: '14px', fontWeight: 600, color: '#4a5568', cursor: 'pointer', borderRadius: '6px', transition: 'all 0.2s' },
  activeTab: { backgroundColor: '#fff', color: '#1a202c', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  form: { display: 'flex', flexDirection: 'column' as const, gap: '20px' },
  
  // 📅 設定バー（タグ入力をフレックスコンテナで綺麗に並列化）
  settingsBar: { backgroundColor: '#fff', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' as const },
  dateLabel: { fontSize: '14px', fontWeight: 600, color: '#4a5568', display: 'flex', alignItems: 'center', gap: '8px', shrink: 0 },
  dateInput: { padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px', color: '#2d3748', outline: 'none', fontFamily: 'inherit' },
  separator: { width: '1px', height: '24px', backgroundColor: '#e2e8f0' },
  
  // 🏷️ タグフォームの専用スタイル群
  tagSection: { display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1, minWidth: '280px' },
  tagSectionLabel: { fontSize: '14px', fontWeight: 600, color: '#4a5568', shrink: 0 },
  tagInputWrapper: { display: 'flex', flexWrap: 'wrap' as const, gap: '6px', alignItems: 'center', border: '1px solid #cbd5e0', borderRadius: '6px', padding: '4px 8px', flexGrow: 1, backgroundColor: '#fafafa' },
  tagInputField: { border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', padding: '4px 0', minWidth: '100px', flexGrow: 1 },
  tagBadge: { display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#edf2f7', color: '#4a5568', padding: '2px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 500 },
  tagDeleteButton: { border: 'none', background: 'transparent', cursor: 'pointer', color: '#a0aec0', fontSize: '14px', padding: '0 0 0 2px', display: 'flex', alignItems: 'center' },
  
  // 👁️ プレビュー用タグ表示
  previewTagLine: { display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #edf2f7', paddingBottom: '12px' },
  previewTagBadge: { backgroundColor: '#e2e8f0', color: '#4a5568', padding: '3px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 600 },

  titleInput: { fontSize: '28px', fontWeight: 700, padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none', color: '#1a202c', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  toolbar: { display: 'flex', alignItems: 'center', gap: '12px', padding: '0 4px' },
  toolButton: { backgroundColor: '#fff', border: '1px solid #cbd5e0', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#4a5568', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  toolHint: { fontSize: '12px', color: '#718096' },
  textarea: { minHeight: '450px', fontSize: '16px', lineHeight: '1.7', padding: '24px', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none', resize: 'vertical' as const, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#2d3748', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  previewArea: { minHeight: '450px', backgroundColor: '#fff', padding: '24px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', lineHeight: '1.85', color: '#2d3748', overflowY: 'auto' as const, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', textAlign: 'left' as const },
  actions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' },
  cancelButton: { border: 'none', background: 'none', color: '#e53e3e', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  draftButton: { backgroundColor: '#fff', color: '#4a5568', border: '1px solid #cbd5e0', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  submitButton: { backgroundColor: '#3182ce', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(49, 130, 206, 0.3)', transition: 'all 0.2s' }
};