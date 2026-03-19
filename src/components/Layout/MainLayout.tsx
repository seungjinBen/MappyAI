"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation'; 
import BottomBar from '@/components/Main/BottomBar';
import PostSearch from '@/components/PostSearch';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const pathname = usePathname(); 
  const hideBottomBarPaths = ['/share']; 

  const shouldHideBottomBar = hideBottomBarPaths.some(path => pathname?.startsWith(path));

  return (
    <div className="app-layout">
      <div className="content-area">
         {children}
      </div>

      {!shouldHideBottomBar && (
        <>
          <BottomBar
            isSearchOpen={isSearchOpen}
            onOpenSearch={() => setIsSearchOpen(true)}
            onCloseSearch={() => setIsSearchOpen(false)}
          />

          <PostSearch
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
          />
        </>
      )}
    </div>
  );
}