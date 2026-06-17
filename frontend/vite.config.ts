import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc' 

export default defineConfig(({ mode }) => {
  // 現在のモード（developmentなど）の環境変数をルート直下から読み込む
  const env = loadEnv(mode, process.cwd(), '');
  
  const prefix = env.VITE_PROXY_BASE || '/api';
  const targetUrl = env.VITE_SERVER_URL || 'http://localhost:3001';

  return {
    plugins: [react()],
    server: {
      port: 5174,
      proxy: {
        // 変数化したプレフィックス（例: '/api'）をキーにする
        [prefix]: {
          target: targetUrl,
          changeOrigin: true,
          // 👇 rewriteを追加：リクエストから「/api」を取り除いてバックエンドに飛ばす
          // 例：ブラウザが /api/posts/1 を叩くと、バックエンドには /posts/1 として届く
          rewrite: (path) => path.replace(new RegExp(`^${prefix}`), '')
        }
      }
    }
  }
})