// 📄 frontend/src/components/MarkdownViewer.tsx

// import React from 'react';
import ReactMarkdown from 'react-markdown';
import { visit } from 'unist-util-visit'; 
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive'; 
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// ⭕ :::構文を通常のHTML(div)に変換するカスタムプラグイン
function myDirectivePlugin() {
  return (tree: any) => {
    visit(tree, (node) => {
      if (node.type === 'containerDirective') {
        const data = node.data || (node.data = {});
        data.hName = 'div'; // div要素に変換
        data.hProperties = {
          className: `md-note md-note-${node.name}`, // 例: md-note md-note-info というクラスを付与
          style: {}
        };

        // ⭕ 修正：attributes から icon (URL) を取得
        const attributes = node.attributes || {};
        if (attributes.icon) {
          // 💡 style ではなく、安全な `data-icon` 属性としてHTMLに出力する
          data.hProperties['data-icon'] = attributes.icon;
        }

        // もし `:::left[/images/chara.png]` のように [引数] が渡されていたら、
        // それをCSSのカスタムプロパティ（環境変数みたいなもの）として仕込む
        //if (node.label) {
        //  data.hProperties.style = {
        //    '--icon-url': `url(${node.label})`
        //  };
        //}
      }
    });
  };
}

interface MarkdownViewerProps {
  content: string;
}

export default function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <div className="md-viewer">
      <ReactMarkdown
        //  1. HTMLを解析できるようにするプラグインを通す
        // remarkPlugins={[remarkGfm]}
        remarkPlugins={[remarkGfm, remarkDirective, myDirectivePlugin]}
        rehypePlugins={[rehypeRaw]}
        
        //  2. 許可するHTMLタグをホワイトリスト形式で指定
        // ※ 通常のMarkdown要素(p, h1, code等)に加えて、許可したい「img」を追記します
        allowedElements={[
          'p', 'br', 'strong', 'em', 'del', 'a', 
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
          'ul', 'ol', 'li', 'pre', 'code', 'blockquote',
          'img',
          'table', 'thead', 'tbody', 'tr', 'th', 'td', // 表で追加
          'div' // noteで追加
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