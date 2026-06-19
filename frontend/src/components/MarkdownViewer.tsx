// 📄 frontend/src/components/MarkdownViewer.tsx

// import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownViewerProps {
  content: string;
}

export default function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <div className="md-viewer">
      <ReactMarkdown
        //  1. HTMLを解析できるようにするプラグインを通す
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        
        //  2. 許可するHTMLタグをホワイトリスト形式で指定
        // ※ 通常のMarkdown要素(p, h1, code等)に加えて、許可したい「img」を追記します
        allowedElements={[
          'p', 'br', 'strong', 'em', 'del', 'a', 
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
          'ul', 'ol', 'li', 'pre', 'code', 'blockquote',
          'img',
          'table', 'thead', 'tbody', 'tr', 'th', 'td' // 表
        ]}

        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            
            // 「改行を含まない、かつ言語指定（クラス名）がない」ものをインラインコードと判定する
            const isInline = !match && !String(children).includes('\n');

            // 💡 1. 文中のインラインコードはそのまま返す
            if (isInline) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }

            // 💡 2. コードブロックは「言語あり」も「なし(text)」も、すべてこの器に流し込む！
            return (
              <SyntaxHighlighter
                style={atomDark}
                // ⭕ マッチすればその言語（js等）、なければ 'text' にする
                language={match ? match[1] : 'text'} 
                PreTag="div"
                customStyle={{
                  borderRadius: '8px',
                  margin: '20px 0',
                  fontSize: '14px',
                  padding: '16px',
                }}
                // ⭕ 言語がない時は props を渡さない（空オブジェクトにする）ことでクラッシュを完全に防ぐ！
                // {...(match ? props : {})} 
                {...(match ? (props as any) : {})} 
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}