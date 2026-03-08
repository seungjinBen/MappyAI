"use client";

import React, { useState } from 'react';
import BottomBar from '@/components/Main/BottomBar';
import PostCard from '@/components/PostCard';
import PostSearch from '@/components/PostSearch';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  // 상태: 'search' | 'saved' | null (null이면 닫힘)
  const [activeSheet, setActiveSheet] = useState<'search' | 'saved' | null>(null);

  // 시트 닫기 (지도로 돌아가기)
  const closeAllSheets = () => setActiveSheet(null);

  // 시트 열기 핸들러들
  const openSearch = () => setActiveSheet('search');
  const openSaved = () => setActiveSheet('saved');

  return (
    <div className="app-layout">
      {/* Next.js에서는 <Outlet /> 대신 부모로부터 받은 {children}을 렌더링합니다.
         이곳에 각 페이지(page.tsx)들이 갈아끼워집니다.
      */}
      <div className="content-area">
         {children}
      </div>

      {/* 바텀바에 상태와 핸들러를 모두 넘겨줍니다 */}
      <BottomBar
        activeSheet={activeSheet}
        onOpenSearch={openSearch}
        onOpenSaved={openSaved}
        onCloseAll={closeAllSheets}
      />

      {/* 검색 시트 */}
      <PostSearch
        isOpen={activeSheet === 'search'}
        onClose={closeAllSheets}
      />

      {/* 저장 시트 (기존 PostCard가 저장된 목록을 보여주는 역할) */}
      <PostCard
        isOpen={activeSheet === 'saved'}
        onClose={closeAllSheets}
      />
    </div>
  );
}