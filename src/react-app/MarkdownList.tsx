// src/react-app/MarkdownList.tsx
import { useState } from "react";
import { Link } from "react-router-dom";

// サブフォルダも含めて全ての .md ファイルのパスを取得
const markdownFiles = import.meta.glob('./markdowns/**/*.md', { query: '?raw', eager: true });

export default function MarkdownList() {
    // 現在開いている階層のパス（例: "" は一番上、"folder1" や "folder1/test1" など）
    const [currentPath, setCurrentPath] = useState<string>("");

    // パスの一覧を整えて配列にする
    const allPaths = Object.keys(markdownFiles).map((path) => path.replace('./markdowns/', ''));

    // 現在の階層にある「フォルダ」と「ファイル」を動的に抽出する
    const folders = new Set<string>();
    const files: { name: string; fullPath: string }[] = [];

    allPaths.forEach((item) => {
        if (currentPath === "" || item.startsWith(currentPath + "/")) {
            // 現在の階層より下の部分を取り出す
            const relative = currentPath === "" ? item : item.slice(currentPath.length + 1);
            const parts = relative.split('/');

            if (parts.length > 1) {
                // まだ下位にフォルダがある場合
                folders.add(parts[0]);
            } else if (parts.length === 1) {
                // この階層にあるファイルの場合
                const fileName = parts[0];
                if (fileName.endsWith('.md')) {
                    files.push({
                        name: fileName.replace('.md', ''),
                        fullPath: item.replace('.md', ''),
                    });
                }
            }
        }
    });

    // 「上の階層に戻る」ボタンを押したときの処理
    const handleBack = () => {
        const parent = currentPath.split('/').slice(0, -1).join('/');
        setCurrentPath(parent);
    };

    return (
        <div style={{ padding: "20px", textAlign: "left" }}>
            <h2>📄 カテゴリー一覧</h2>
            
            {/* 現在地と戻るボタン */}
            <div style={{ marginBottom: "15px", color: "#666" }}>
                現在の場所: <code>/markdowns/{currentPath}</code>
            </div>

            {currentPath !== "" && (
                <button 
                    onClick={handleBack}
                    style={{ marginBottom: "15px", padding: "6px 12px", cursor: "pointer", borderRadius: "4px", border: "1px solid #ccc" }}
                >
                    📁 .. (上の階層に戻る)
                </button>
            )}

            <ul style={{ listStyle: "none", padding: 0 }}>
                {/* フォルダの一覧を表示 */}
                {Array.from(folders).map((folder) => (
                    <li key={folder} style={{ margin: "10px 0" }}>
                        <button
                            onClick={() => setCurrentPath(currentPath ? `${currentPath}/${folder}` : folder)}
                            style={{ background: "none", border: "none", color: "#646cff", fontSize: "18px", cursor: "pointer", padding: 0, textAlign: "left" }}
                        >
                            📁 {folder}/
                        </button>
                    </li>
                ))}

                {/* ファイルの一覧を表示 */}
                {files.map((file) => (
                    <li key={file.fullPath} style={{ margin: "10px 0" }}>
                        <Link to={`/markdown/${file.fullPath}`} style={{ fontSize: "18px", color: "#28a745", textDecoration: "none" }}>
                            📄 {file.name}.md
                        </Link>
                    </li>
                ))}
            </ul>

            <div style={{ marginTop: "30px" }}>
                <Link to="/">← トップページに戻る</Link>
            </div>
        </div>
    );
}