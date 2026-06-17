import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Article from './pages/Article';
import Login from './pages/Login';
import WritePost from './pages/WritePost';
import EditPost from './pages/EditPost';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showMenu, setShowMenu] = useState(false); // ☰ メニューの開閉状態
  const menuRef = useRef<HTMLDivElement>(null);

  // 🔄 ログイン状態の自動復元
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  // 🖱️ メニューの外側をクリックしたら自動で閉じる親切設計
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 🚪 ログアウト処理
  const handleLogout = () => {
    if (window.confirm('ログアウトしますか？')) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      setIsLoggedIn(false);
      setShowMenu(false);
      window.location.href = '/';
    }
  };

  return (
    <Router>
      <div style={styles.wrapper}>
        
        {/* 🌐 常にシンプルさを保つ共通ナビゲーションバー */}
        <nav style={styles.navBar}>
          <div style={styles.navInner}>
            <Link to="/" style={styles.navLogo} onClick={() => setShowMenu(false)}>
              Tech & Life
            </Link>
            
            {/* ☰ ハンバーガーメニューエリア */}
            <div ref={menuRef} style={styles.menuContainer}>
              <button 
                onClick={() => setShowMenu(!showMenu)} 
                style={styles.burgerButton}
                aria-label="メニューを開く"
              >
                ☰
              </button>
              
              {/* ドロップダウンメニュー（ログイン状態で中身を切り替え） */}
              {showMenu && (
                <div style={styles.dropdown}>
                  {isLoggedIn ? (
                    /* 🔐 管理者ログイン中のメニュー */
                    <>
                      <div style={styles.menuHeader}>管理者メニュー</div>
                      <Link 
                        to="/admin/new" 
                        style={styles.dropdownItem} 
                        onClick={() => setShowMenu(false)}
                      >
                        ✏️ 新しい記事を書く
                      </Link>
                      <hr style={styles.divider} />
                      <button onClick={handleLogout} style={styles.dropdownLogout}>
                        🚪 ログアウト
                      </button>
                    </>
                  ) : (
                    /* 🔓 一般ゲスト（未ログイン）のメニュー */
                    <>
                      <Link 
                        to="/" 
                        style={styles.dropdownItem} 
                        onClick={() => setShowMenu(false)}
                      >
                        🏠 ホーム
                      </Link>
                      <hr style={styles.divider} />
                      <Link 
                        to="/login" 
                        state={{ from: window.location.pathname }}
                        style={styles.dropdownItem} 
                        onClick={() => setShowMenu(false)}
                      >
                        🔑 管理者ログイン
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* 各画面の表示エリア */}
        <div style={styles.content}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/article/:id" element={<Article />} />
            <Route path="/login" element={<Login onLoginSuccess={() => setIsLoggedIn(true)} />} />
            <Route path="/admin/new" element={<WritePost />} />
            <Route path="/admin/edit/:id" element={<EditPost />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

// 💅 統一されたハンバーガーメニューのスタイル
const styles = {
  wrapper: { 
    minHeight: '100vh', 
    display: 'flex', 
    flexDirection: 'column' as const,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  navBar: { 
    position: 'fixed' as const, 
    top: 0, left: 0, right: 0, 
    height: '56px', 
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    backdropFilter: 'blur(8px)', 
    borderBottom: '1px solid #edf2f7', 
    zIndex: 1000 
  },
  navInner: { 
    maxWidth: '1000px', 
    height: '100%', 
    margin: '0 auto', 
    padding: '0 20px', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  navLogo: { 
    textDecoration: 'none', 
    fontWeight: 700, 
    color: '#1a202c', 
    fontSize: '16px',
    letterSpacing: '-0.02em'
  },
  
  // ☰ メニューボタンの配置
  menuContainer: { position: 'relative' as const },
  burgerButton: {
    background: 'none',
    border: 'none',
    fontSize: '22px',
    color: '#4a5568',
    cursor: 'pointer',
    padding: '6px 10px',
    borderRadius: '6px',
    outline: 'none',
    transition: 'background-color 0.2s',
  },
  
  // 📥 共通のドロップダウンメニューの枠
  dropdown: {
    position: 'absolute' as const,
    top: '42px',
    right: 0,
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    width: '180px',
    padding: '0 0 6px 0', // ⭕ 上の余白を0にして、ヘッダーが隙間なく敷き詰められるように調整
    overflow: 'hidden',    // ⭕ 角丸からはみ出るグレー背景を綺麗にカット
    zIndex: 1001,
  },

  // 🏷️ 【大幅修正】クリックできない「管理者メニュー」のラベル部分
  menuHeader: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#4a5568',          // 少し濃いめの文字色にして視認性をアップ
    backgroundColor: '#f7fafc', // ⭕ 綺麗な薄いグレーの背景色
    padding: '10px 16px',       // ⭕ 他の項目と横幅・縦幅のバランスが綺麗に揃う余白
    letterSpacing: '0.05em',
    borderBottom: '1px solid #edf2f7', // 下にうっすら境界線を入れて独立感を強調
    marginBottom: '4px',       // 下の選択肢との間に心地よい隙間を確保
    cursor: 'default',         // マウスが乗っても矢印のまま（選択不可をアピール）
    userSelect: 'none' as const, // 文字がドラッグ選択されないように固定
  },

  // 🔗 選択できるメニュー項目
  dropdownItem: {
    display: 'block',
    padding: '10px 16px', // 縦10px・横16pxでヘッダーとピタッと揃います
    textDecoration: 'none',
    color: '#4a5568',
    fontSize: '13px',
    fontWeight: 500,
    textAlign: 'left' as const,
    transition: 'background-color 0.15s ease',
  },
  divider: {
    margin: '4px 0',
    border: 'none',
    borderTop: '1px solid #edf2f7',
  },
  dropdownLogout: {
    display: 'block',
    width: '100%',
    padding: '10px 16px',
    border: 'none',
    background: 'none',
    color: '#c53030',
    fontSize: '13px',
    fontWeight: 500,
    textAlign: 'left' as const,
    cursor: 'pointer',
  },
  content: { paddingTop: '56px' }
};