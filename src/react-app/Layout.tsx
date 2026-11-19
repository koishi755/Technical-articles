// src/react-app/Layout.tsx
import { Outlet, Link, useLocation } from "react-router-dom";

// サイドバーでもマークダウンのフォルダ構造やpubDateを判定できるように glob を読み込む
const markdownFiles = import.meta.glob('./markdowns/**/*.md', { query: '?raw', eager: true });

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

export default function Layout() {
  const location = useLocation();
  const pathname = decodeURIComponent(location.pathname);
  const isHome = pathname === "/";
  
  let currentPath = "";
  let rawPath = "";
  const headings: { level: number; text: string; id: string }[] = [];

  if (pathname.startsWith("/markdown/")) {
    rawPath = pathname.replace("/markdown/", "");
    
    const allPaths = Object.keys(markdownFiles).map((path) => path.replace('./markdowns/', '').replace('.md', ''));

    if (allPaths.includes(rawPath)) {
      const parts = rawPath.split('/');
      parts.pop(); 
      parts.pop(); 
      currentPath = parts.join('/'); 

      const targetKey = Object.keys(markdownFiles).find(
        (path) => path.replace('./markdowns/', '').replace('.md', '') === rawPath
      );
      
      if (targetKey && markdownFiles[targetKey]) {
        const fileModule = markdownFiles[targetKey] as { default: string };
        const content = fileModule.default;
        const contentWithoutCode = content.replace(/```[\s\S]*?```/g, '');
        let headingCounter = 1;

        contentWithoutCode.split('\n').forEach((line) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('#')) {
            const match = trimmed.match(/^(#{1,6})\s+/);
            if (match) {
              const hashes = match[1];
              const level = hashes.length;
              const text = trimmed.replace(/^#{1,6}\s+/, '').trim();
              const id = String(headingCounter++);

              headings.push({ level, text, id });
            }
          }
        });
      }
    } else {
      currentPath = rawPath;
    }
  }

  const allPaths = Object.keys(markdownFiles).map((path) => path.replace('./markdowns/', '').replace('.md', ''));
  const folders = new Set<string>();
  const files: { name: string; fullPath: string; date: number }[] = [];

  const currentFolderName = currentPath.split('/').pop();

  allPaths.forEach((item) => {
    if (currentPath === "" || item.startsWith(currentPath + "/")) {
      const relative = currentPath === "" ? item : item.slice(currentPath.length + 1);
      const parts = relative.split('/');

      if (parts.length > 1) {
        folders.add(parts[0]);
      } else if (parts.length === 1) {
        const fileName = parts[0];
        const targetKey = Object.keys(markdownFiles).find(
          (path) => path.replace('./markdowns/', '').replace('.md', '') === item
        );
        const date = targetKey ? getPubDate(markdownFiles[targetKey]) : 0;

        files.push({
          name: fileName,
          fullPath: item,
          date: date,
        });
      }
    }
  });

  // ★ ファイルを古い順（昇順）にソート
  files.sort((a, b) => a.date - b.date);

  const parentPath = currentPath.split('/').slice(0, -1).join('/');

  return (
    <div>
        {/* ヘッダー */}
        <div className="header-container">
            <nav className="navbar navbar-expand-lg bg-event">
                <div className="container-fluid">
                  <button className="navbar-toggler navbar-dark" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasWithBothOptions" aria-controls="offcanvasWithBothOptions">
                      <span className="navbar-toggler-icon"></span>
                  </button>

                  <div className="offcanvas offcanvas-start" data-bs-scroll="true" id="offcanvasWithBothOptions" aria-labelledby="offcanvasWithBothOptionsLabel">
                      <div className="offcanvas-header">
                        <h5 className="offcanvas-title" id="offcanvasWithBothOptionsLabel">Backdrop with scrolling</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                      </div>

                      <div className="d-none d-lg-block text-white">
                          <nav>
                              <Link to="/"> ホーム </Link>
                              <Link to="/markdown">記事一覧</Link>
                          </nav>
                      </div>

                      <div className="offcanvas-body d-lg-none">
                              <p><Link to="/"> ホーム </Link></p>
                              <p><Link to="/markdown">記事一覧</Link></p>
                      </div>
                  </div>
                </div>
            </nav>
        </div>
        {/* ヘッダー */}

        <div className="container-fluid">
            <div className="row justify-content-md-center">
                <div className="row">

                    {/* 左のサイドバー */}
                    {!isHome && (
                        <div className="left-sidebar col-sm-2">
                            {parentPath && (
                                <Link 
                                    to={`/markdown/${parentPath}`} 
                                    className="text-decoration-none fw-bold text-dark d-block mb-2"
                                >
                                    📁 {parentPath}
                                </Link>
                            )}
                            {currentFolderName && (
                                <div className="list-unstyled ps-2">📁 {currentFolderName}</div>
                            )}
                            
                            <ul className="list-unstyled ps-4">
                                {Array.from(folders).map((folderName) => {
                                    const folderPath = currentPath ? `${currentPath}/${folderName}` : folderName;

                                    const filesInFolder = allPaths.filter((item) => {
                                        const prefix = folderPath + "/";
                                        if (item.startsWith(prefix)) {
                                            const relative = item.slice(prefix.length);
                                            return !relative.includes('/');
                                        }
                                        return false;
                                    }).map((filePath) => {
                                        const targetKey = Object.keys(markdownFiles).find(
                                            (path) => path.replace('./markdowns/', '').replace('.md', '') === filePath
                                        );
                                        return {
                                            filePath,
                                            date: targetKey ? getPubDate(markdownFiles[targetKey]) : 0
                                        };
                                    });

                                    // ★ フォルダ内のファイルも古い順（昇順）にソート
                                    filesInFolder.sort((a, b) => a.date - b.date);

                                    return (
                                        <li key={folderName} className="my-2">
                                            <Link 
                                                to={`/markdown/${folderPath}`} 
                                                className="text-decoration-none fw-bold text-dark d-block"
                                            >
                                                📁 {folderName}
                                            </Link>
                                            
                                            {filesInFolder.length > 0 && (
                                                <ul className="list-unstyled ps-3 mt-1 border-start ms-2">
                                                    {filesInFolder.map(({ filePath }) => {
                                                        const FullfileName = filePath.split('/').pop() || "";
                                                        const fileName = FullfileName.replace('.md', '');
                                                        const cleanPath = filePath.replace('.md', '');
                                                        const isCurrentFile = currentPath + "/" + fileName === filePath || rawPath === filePath;

                                                        return (
                                                            <li key={filePath} className="my-1">
                                                                <Link 
                                                                    to={`/markdown/${cleanPath}`} 
                                                                    className={`text-decoration-none small d-block ${isCurrentFile ? 'text-primary fw-bold' : 'text-secondary'}`}
                                                                >
                                                                    📄 {fileName}
                                                                </Link>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </li>
                                    );
                                })}

                                {files.map((file) => {
                                    const isCurrentFile = rawPath === file.fullPath;
                                    const cleanPath = file.fullPath.replace('.md', '');
                                    return (
                                        <li key={cleanPath} className="my-2">
                                            <Link 
                                                to={`/markdown/${cleanPath}`} 
                                                className={`text-decoration-none d-block ${isCurrentFile ? 'text-primary fw-bold' : 'text-success'}`}
                                            >
                                                📄 {file.name}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                    {/* 左のサイドバー */}

                    {/* 真ん中のコンテンツ */}
                    <div className={isHome ? "col-sm-12 home" : "center col-sm-8"}>
                        <main id={isHome ? "home":"main"}>
                            <Outlet />
                        </main>
                    </div>
                    {/* 真ん中のコンテンツ */}

                    {/* 右のサイドバー */}
                    {!isHome && (
                        <div className="right-sidebar col-sm-2">
                            {headings.length > 0 ? (
                                <div className="sticky-top pt-3 text-start">
                                    <div className="fw-bold text-muted small mb-2">目次</div>
                                    <ul className="list-unstyled border-start ps-2">
                                        {headings.map((h, index) => {
                                            let indentClass = "fw-bold text-dark";
                                            if (h.level === 2) indentClass = "ps-2 text-secondary";
                                            if (h.level === 3) indentClass = "ps-4 text-secondary small";
                                            if (h.level === 4) indentClass = "ps-5 text-muted small";
                                            if (h.level === 5) indentClass = "ps-5 ms-2 text-muted small";
                                            if (h.level === 6) indentClass = "ps-5 ms-4 text-muted small";

                                            const targetHashLink = `${pathname}#${h.id}`;

                                            return (
                                                <li key={index} className={`my-1 small ${indentClass}`}>
                                                    <a 
                                                        href={targetHashLink} 
                                                        className="text-decoration-none text-reset d-block"
                                                    >
                                                        {h.text}
                                                    </a>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ) : (
                                <div className="text-muted small pt-3">
                                    右のサイドバー
                                </div>
                            )}
                        </div>
                    )}
                    {/* 右のサイドバー */}

                </div>
            </div>
        </div>
    </div>
  );
}