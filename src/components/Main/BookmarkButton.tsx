"use client";

import React, { useState, useEffect } from 'react';
import api from '@/lib/axios'; 
import { Bookmark, BookmarkCheck } from 'lucide-react';

interface BookmarkButtonProps {
  conversationId: number;
  initialIsSaved: boolean;
  className?: string;
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  conversationId,
  initialIsSaved
}) => {
  const [isSaved, setIsSaved] = useState<boolean>(initialIsSaved);
  const [isLoading, setIsLoading] = useState<boolean>(false); 

  useEffect(() => {
    setIsSaved(initialIsSaved);
  }, [initialIsSaved]);

  const toggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // 1. 이미 요청 중이면 바로 리턴 (광클 방어)
    if (isLoading) return;

    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');

    if (!token) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    try {
      // 2. 요청 시작 - 버튼 잠금
      setIsLoading(true);

      const config = {
        params: { conversationId }
      };

      if (isSaved) {
        await api.delete(`/bookmarks`, config);
        setIsSaved(false);
      } else {
        await api.post(`/bookmarks`, null, config);
        setIsSaved(true);
      }
    } catch (error: any) {
      console.error("저장 기능 오류:", error);
      
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        alert("처리에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      // 3. 성공하든 실패하든 요청 끝났으니 다시 버튼 잠금 해제
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleSave}
      disabled={isLoading} 
      style={{
        background: 'none',
        border: 'none',
        cursor: isLoading ? 'not-allowed' : 'pointer', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px',
        opacity: isLoading ? 0.6 : 1,
        transition: 'all 0.2s ease'
      }}
      aria-label={isSaved ? "북마크 취소" : "북마크 저장"}
    >
      {isSaved ? (
        <BookmarkCheck size={22} color="#FFD700" fill="#FFD700" />
      ) : (
        <Bookmark size={22} color="#9CA3AF" />
      )}
    </button>
  );
};

export default BookmarkButton;