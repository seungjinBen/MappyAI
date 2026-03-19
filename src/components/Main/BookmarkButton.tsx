"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

  // 부모 컴포넌트(ConvCards)에서 props가 갱신될 때 상태 동기화
  useEffect(() => {
    setIsSaved(initialIsSaved);
  }, [initialIsSaved]);

  const toggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');

    if (!token) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: { conversationId }
      };

      if (isSaved) {
        await axios.delete(`/api/bookmarks`, config);
        alert("저장이 취소되었습니다.");
        setIsSaved(false);
      } else {
        // POST 메서드: url, data, config 순서이므로 두 번째 인자는 null
        await axios.post(`/api/bookmarks`, null, config);
        alert("대화가 저장되었습니다!");
        setIsSaved(true);
      }
    } catch (error: any) {
      console.error("저장 기능 오류:", error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
      } else {
        alert("처리에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    }
  };

  return (
    <button
      type="button"
      onClick={toggleSave}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px'
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