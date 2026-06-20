// 📄 frontend/src/pages/Login.tsx

import React, { useState } from 'react';
// ⭕ 修正：useLocation を追加
import { useNavigate, useLocation } from 'react-router-dom'; 

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation(); // ⭕ 追加：足跡（state）を読み取るためのフック

  const apiProxy = import.meta.env.VITE_API_PROXY_BASE || '/api'; 
  const apiBase = import.meta.env.VITE_API_BASE || '/blog'; 
  const appBase = import.meta.env.VITE_APP_BASE || ''; 


  // 💡 ログインボタンを押す前に見ていたページ（足跡）を取得。なければトップ（'/'）
  let from = (location.state as any)?.from || '/';

  if (appBase && from.startsWith(appBase)) {
    from = from.replace(appBase, '') || '/';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${apiProxy}${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'ログインに失敗しました');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('username', username);
      
      onLoginSuccess();

      // 🏃‍♂️ ❌ 修正前：navigate('/');
      // 🏃‍♂️ ⭕ 修正後：直前に見ていた画面へタイムスリップ！
      navigate(from, { replace: true }); 
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '30px', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#1a202c' }}>管理者ログイン</h2>
      {error && <p style={{ color: '#e53e3e', backgroundColor: '#fff5f5', padding: '10px', borderRadius: '6px', fontSize: '14px', marginBottom: '16px' }}>⚠️ {error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input type="text" placeholder="ユーザー名" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }} />
        <input type="password" placeholder="パスワード" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }} />
        <button type="submit" style={{ backgroundColor: '#3182ce', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>ログイン</button>
      </form>
    </div>
  );
}