// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import MarkdownList from "./MarkdownList.tsx";     // ← 一覧ページ
import MarkdownDetail from "./MarkdownDetail.tsx"; // ← 個別詳細ページ
import Layout from "./Layout";                     // ← 共通レイアウト

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                {/* 共通の Layout（ヘッダー・フッターなど）を親にする */}
                <Route element={<Layout />}>
                    <Route path="/" element={<App />} />
                    <Route path="/markdown-list" element={<MarkdownList />} />
                    <Route path="/markdown/*" element={<MarkdownDetail />} />
                </Route>
            </Routes>
        </BrowserRouter>
    </StrictMode>,
);