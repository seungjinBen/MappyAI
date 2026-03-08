"use client";

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import '@/css/PlaceCards.css';
import ConvCards from './ConvCards';
import MediaCarousel from './MediaCarousel';

// --- 타입 정의 ---
interface Place {
  id: number;
  name: string;
  category?: string;
  lat: number;
  lng: number;
  description?: string;
  imgUrl?: string;
}

interface Conversation {
  id: number;
  title: string;
  isSaved?: boolean;
  [key: string]: any; // 추가 데이터 대응
}

interface PlaceCardsProps {
  conversations?: Conversation[];
  selectedPlace?: Place | null;
}

// 카테고리 라벨 상수
const CATEGORY_LABELS: Record<string, string> = {
  A: '관광명소',
  B: '음식점',
  C: '상점',
  D: '대중교통',
  E: '기타시설',
};

export default function PlaceCards({
  conversations = [],
  selectedPlace
}: PlaceCardsProps) {
  // 1. 북마크 ID 상태 (Set)
  const [myBookmarkedIds, setMyBookmarkedIds] = useState<Set<number>>(new Set());

  // 2. 내 북마크 목록 로드 (Client-side Only)
  useEffect(() => {
    const fetchMyBookmarks = async () => {
      // Next.js SSR 환경에서 window/localStorage 체크
      if (typeof window === 'undefined') return;

      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await axios.get('/api/bookmarks/my', {
          headers: { Authorization: `Bearer ${token}` }
        });

        // 데이터 매핑: { conversationId: number } 형태라고 가정
        const ids = new Set<number>(response.data.map((item: any) => item.conversationId));
        setMyBookmarkedIds(ids);
      } catch (error) {
        console.error("북마크 목록 로드 실패:", error);
      }
    };

    fetchMyBookmarks();
  }, []);

  // 3. 데이터 가공 (Status 합치기)
  const conversationsWithStatus = useMemo(() => {
    return conversations.map(conv => ({
      ...conv,
      isSaved: myBookmarkedIds.has(conv.id)
    }));
  }, [conversations, myBookmarkedIds]);

  if (!selectedPlace) return null;

  const { id, name, category, description, imgUrl } = selectedPlace;
  const catLabel = CATEGORY_LABELS[(category ?? '').toUpperCase()] ?? '분류없음';

  return (
    <section className="card-container">
      <div className="container cq">
        <div className="card-grid mq-2col">
          <article className="card shadow-soft">
            <div style={{
              display: 'flex',
              margin: '0 0 10px 5px',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8
            }}>
              <h3 className="card-title" style={{ marginBottom: 0 }}>
                {name ?? '이름 없음'}
              </h3>
              {category && <span className="chip-pill">{catLabel}</span>}
            </div>

            {/* 미디어 캐러셀 */}
            <MediaCarousel
              placeId={id}
              placeName={name}
              fallbackSrc={imgUrl}
            />

            {description && (
              <div className="place-description-box">
                <p className="place-description-text">
                  {description}
                </p>
              </div>
            )}
          </article>
        </div>
      </div>

      {/* 가공된 북마크 상태가 포함된 대화 목록 */}
      <ConvCards conversations={conversationsWithStatus} />
    </section>
  );
}