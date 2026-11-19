import { useParams, Link } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import React, { useState, useMemo } from 'react';

const markdownFiles = import.meta.glob('./markdowns/**/*.md', { query: '?raw', eager: true }) as Record<string, { default: string }>;

// pubDateを抽出してタイムスタンプに変換するヘルパー関数
function getPubDate(fileModule: unknown): number {
    if (fileModule && typeof fileModule === 'object' && 'default' in fileModule) {
        const content = (fileModule as { default: string }).default;
        const match = content.match(/pubDate:\s*["']([^"']+)["']/);
        if (match && match[1]) {
            const normalizedDateStr = match[1].replace(/\//g, '-');
            const timestamp = Date.parse(normalizedDateStr);
            return isNaN(timestamp) ? 0 : timestamp;
        }
    }
    return 0;
}

export default function MarkdownDetail() {
    const params = useParams<object & { "*": string }>();
    const fileSlug = params["*"] || ""; // 例: "AWS" や "AWS/test1/sample" など

    // 1. 全ファイルのパス一覧（拡張子なし）を取得
    const allPaths = Object.keys(markdownFiles).map((path) => path.replace('./markdowns/', '').replace('.md', ''));

    // 2. 「今開いているパス」がファイルとして存在するかどうかを判定
    const isFile = allPaths.includes(fileSlug);

    // --- パターンA: フォルダが開かれた場合 ---
    if (!isFile) {
        const folders = new Set<string>();
        const filesInFolderObj: { name: string; fullPath: string; date: number }[] = [];

        allPaths.forEach((item) => {
            if (fileSlug === "" || item.startsWith(fileSlug + "/")) {
                const relative = fileSlug === "" ? item : item.slice(fileSlug.length + 1);
                const parts = relative.split('/');

                if (parts.length > 1) {
                    folders.add(parts[0]);
                } else if (parts.length === 1) {
                    const fileName = parts[0];
                    const targetKey = Object.keys(markdownFiles).find(
                        (path) => path.replace('./markdowns/', '').replace('.md', '') === item
                    );
                    const date = targetKey ? getPubDate(markdownFiles[targetKey]) : 0;

                    filesInFolderObj.push({
                        name: fileName,
                        fullPath: item,
                        date: date,
                    });
                }
            }
        });

        // ★ フォルダ内のファイル一覧も古い順（昇順）にソート
        filesInFolderObj.sort((a, b) => a.date - b.date);

        const parentPath = fileSlug.split('/').slice(0, -1).join('/');

        return (
            <div style={{ padding: "20px", textAlign: "left" }}>
                <h2>📁 フォルダ: {fileSlug}</h2>
                <div style={{ marginBottom: "15px", color: "#666" }}>
                    Current path: <code>/markdowns/{fileSlug}</code>
                </div>
                {fileSlug !== "" && parentPath && (
                    <div style={{ marginBottom: "15px" }}>
                        <Link to={`/markdown/${parentPath}`} className="text-decoration-none fw-bold text-dark d-block mb-2">
                            📁 {parentPath}
                        </Link>
                    </div>
                )}
                <ul style={{ listStyle: "none", padding: 0 }}>
                    {Array.from(folders).map((folder) => {
                        const nextPath = fileSlug ? `${fileSlug}/${folder}` : folder;
                        return (
                            <li key={folder} style={{ margin: "10px 0" }}>
                                <Link to={`/markdown/${nextPath}`} style={{ fontSize: "18px", textDecoration: "none", fontWeight: "bold" }}>
                                    📁 {folder}
                                </Link>
                            </li>
                        );
                    })}
                    {filesInFolderObj.map((file) => (
                        <li key={file.fullPath} style={{ margin: "10px 0" }}>
                            <Link to={`/markdown/${file.fullPath}`} style={{ fontSize: "18px", color: "#28a745", textDecoration: "none" }}>
                                📄 {file.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    // --- パターンB: ファイル（Markdown）が開かれた場合 ---
    const targetKey = Object.keys(markdownFiles).find((path) => {
        const normalizedPath = path.replace('./markdowns/', '').replace('.md', '');
        return normalizedPath === fileSlug;
    });

    const rawContent = targetKey && markdownFiles[targetKey] ? markdownFiles[targetKey].default : `# 404\nファイル "${fileSlug}" が見つかりませんでした。`;
    const fileNameOnly = fileSlug.split('/').pop() || fileSlug;

    // ファイル読み込み時にフロントマターを除去し、見出し行をHTMLタグ（id付き）に置換する
    const processedContent = useMemo(() => {
        // ★ 先頭にあるフロントマター（--- ... ---）を空文字に置換して消去する
        const contentWithoutFrontmatter = rawContent.replace(/^---[\s\S]*?---\s*/, '');

        let headingCounter = 1;
        let inCodeBlock = false;

        return contentWithoutFrontmatter
            .split('\n')
            .map((line) => {
                if (line.trim().startsWith('```')) {
                    inCodeBlock = !inCodeBlock;
                    return line;
                }

                if (inCodeBlock) {
                    return line;
                }

                const match = line.trim().match(/^(#{1,6})\s+(.+)$/);
                if (match) {
                    const hashes = match[1];
                    const level = hashes.length;
                    const text = match[2];
                    const id = String(headingCounter++);

                    return `<h${level} id="${id}">${text}</h${level}>`;
                }

                return line;
            })
            .join('\n');
    }, [rawContent]);

    // どのIDのコードがコピーされたかを管理するステート
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = (id: string) => {
        console.log("コピー対象:", id);

        const codeElement = document.querySelector(`#${id}`);
        if (codeElement) {
            const textToCopy = (codeElement as HTMLElement).innerText;
            navigator.clipboard.writeText(textToCopy).then(() => {
                console.log("コピー成功:", textToCopy);
                
                setCopiedId(id);

                setTimeout(() => {
                    setCopiedId((current) => (current === id ? null : current));
                }, 2000);

            }).catch(err => {
                console.error('コピーに失敗しました', err);
            });
        } else {
            console.warn("指定された要素が見つかりませんでした:", `#${id}`);
        }
    };

    let codeIndex = 0;

    return (
        <div style={{ padding: "20px", textAlign: "left" }}>
            <h2>📖 {fileNameOnly}</h2>
            
            <div style={{ padding: "20px", background: "#fff", color: "#333", borderRadius: "8px", marginTop: "15px" }}>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                        // 記事ごとのフォルダ階層に合わせた画像パス自動変換
                        img({ node, src, alt, ...props }) {
                            let fixedSrc = src;
                            if (src) {
                                if (!src.startsWith('http') && !src.startsWith('/')) {
                                    const parentDir = fileSlug.split('/').slice(0, -1).join('/');
                                    const cleanSrc = src.replace(/^\.\//, '');
                                    
                                    const pathParts = cleanSrc.split('/');
                                    const fileName = pathParts.pop() || '';
                                    const decodedFileName = decodeURIComponent(fileName);
                                    const reassembledSrc = [...pathParts, decodedFileName].join('/');

                                    if (parentDir) {
                                        fixedSrc = `/${parentDir}/${reassembledSrc}`;
                                    } else {
                                        fixedSrc = `/${reassembledSrc}`;
                                    }
                                }
                            }
                            return <img src={fixedSrc} alt={alt} style={{ maxWidth: '100%', height: 'auto' }} {...props} />;
                        },
                        // コードブロック（pre）のコピーボタン付きカスタム設定
                        pre({ node, children, ...props }) {
                            const id = `codecell${codeIndex++}`;
                            const isCopied = copiedId === id;

                            return (
                                <div style={{ position: 'relative' }} className="code-block-wrapper">
                                    <button 
                                        className={`copybtn o-tooltip--left ${isCopied ? 'success' : ''}`} 
                                        data-tooltip={isCopied ? "Copied!" : "Copy"}
                                        data-clipboard-target={`#${id}`}
                                        onClick={() => handleCopy(id)}
                                    >
                                        <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" className="icon icon-tabler icon-tabler-copy" width="44" height="44" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#000000" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                            <title>Copy to clipboard</title>
                                            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                            <rect x="8" y="8" width="12" height="12" rx="2"></rect>
                                            <path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2"></path>
                                        </svg>
                                    </button>
                                    
                                    <pre {...props}>
                                        {React.Children.map(children, child => {
                                            if (React.isValidElement(child)) {
                                                return React.cloneElement(child, { id } as any);
                                            }
                                            return child;
                                        })}
                                    </pre>
                                </div>
                            );
                        }
                    }}
                >
                    {processedContent}
                </ReactMarkdown>
            </div>
        </div>
    );
}