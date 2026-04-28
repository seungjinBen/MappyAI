"use client";

import React, { useState, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios'; // ✅ 공통 axios 인스턴스 사용
import { 
  Search, X, XCircle, ShoppingBag, MapPin, 
  MessageCircle, ArrowDownRight, Camera, Coffee, Map 
} from 'lucide-react';

import '@/css/PostSearch.css';

// --- 타입 정의 ---
interface Place {
  id: number;
  name: string;
}

interface Conversation {
  placeId: number;
  placeName: string;
  koreanText1: string;
  englishText1: string;
}

interface SearchResult {
  places: Place[];
  conversations: Conversation[];
}

interface PostSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Category {
  id: string;
  label: string;
  code: string;
  icon: React.ReactNode;
  bg: string;
}

interface SearchGuide {
  keyword: string;
  preview: string;
  type: 'place' | 'conv';
  id: number;
}

export default function PostSearch({ isOpen, onClose }: PostSearchProps) {
  const router = useRouter();

  // 1. 상태 관리
  const [searchText, setSearchText] = useState<string>('');
  const [searchResult, setSearchResult] = useState<SearchResult>({ places: [], conversations: [] });
  const [isSearched, setIsSearched] = useState<boolean>(false);

  // --- 카테고리 데이터 ---
  const categories: Category[] = [
    { id: 'tour', label: '관광 명소', code: 'a', icon: <Camera size={20} color="#3B82F6" />, bg: '#EFF6FF' },
    { id: 'cafe', label: '카페 주문', code: 'b', icon: <Coffee size={20} color="#F97316" />, bg: '#FFF7ED' },
    { id: 'shopping', label: '쇼핑/계산', code: 'c', icon: <ShoppingBag size={20} color="#10B981" />, bg: '#ECFDF5' },
    { id: 'directions', label: '길 묻기', code: 'd', icon: <Map size={20} color="#8B5CF6" />, bg: '#F5F3FF' },
  ];

  // --- 검색 가이드 데이터 ---
  const searchGuides: SearchGuide[] = [
    { keyword: '사진', preview: '빅 벤을 배경으로 저희 사진 한 장만 찍어주시겠어요?', type: 'conv', id: 64 },
    { keyword: '길', preview: '여기서 칼턴 힐 가는 길을 알려주실 수 있나요?', type: 'conv', id: 115 },
    { keyword: '에펠탑', preview: '에펠탑 (장소)', type: 'place', id: 1 }
  ];

  const ALLOWED_PLACE_IDS = [
    1,3,5,6,8,9,12,14,15,17,19,21,22,24,25,27,34,35,36,37,51,52,
    55,56,58,59,61,62,63,64,70,71,75,76,78,79,81,82,83,84,88,89,
    91,93,94,95,96,97,102,103,105,106,108,111,114,115,116,118
  ];

  // 2. 검색 로직
const handleSearch = async (query: string = searchText) => {
    if (!query.trim()) return;
    try {
      const response = await api.get<SearchResult>('/places/search', {
        params: { query }
      });
      
      const filteredPlaces = response.data.places.filter(place => 
        ALLOWED_PLACE_IDS.includes(Number(place.id))
      );
      const filteredConvs = response.data.conversations.filter(conv => 
        ALLOWED_PLACE_IDS.includes(Number(conv.placeId))
      );

      setSearchResult({ places: filteredPlaces, conversations: filteredConvs });
      setIsSearched(true);
    } catch (error) {
      console.error("검색 실패:", error);
    }
  };

  const handleCategoryClick = async (categoryCode: string, categoryLabel: string) => {
    setSearchText(categoryLabel);
    try {
      const response = await api.get<Conversation[]>('/conversations/section', {
        params: { code: categoryCode }
      });
      
      const filteredConvs = response.data.filter(conv => 
        ALLOWED_PLACE_IDS.includes(Number(conv.placeId))
      );

      setSearchResult({ places: [], conversations: filteredConvs });
      setIsSearched(true);
    } catch (error) {
      console.error("카테고리 조회 실패:", error);
    }
  };

  const handleGuideClick = (keyword: string) => {
    setSearchText(keyword);
    handleSearch(keyword);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClearInput = () => {
    setSearchText('');
    setSearchResult({ places: [], conversations: [] });
    setIsSearched(false);
  };

  const handleCloseSheet = () => {
    handleClearInput();
    onClose();
  };

  // ID에 따른 스마트 라우팅 함수
  const getRouteByPlaceId = (id: number): string => {
    if (id >= 1 && id <= 52) return `/paris/${id}`;
    if (id >= 53 && id <= 82) return `/london/${id}`;
    if (id >= 84 && id <= 99) return `/nice/${id}`;
    if (id >= 100 && id <= 118) return `/edinburgh/${id}`;
    return `/paris/${id}`;
  };

  if (!isOpen) return null;

  const totalCount = searchResult.places.length + searchResult.conversations.length;

  return (
    <div className="sheet-overlay" onClick={handleCloseSheet}>
      <div className="sheet-container" onClick={(e) => e.stopPropagation()}>
        
        {/* 1. 검색 헤더 */}
        <header className="search-header">
          <div className="search-input-wrapper">
            <Search size={20} color="#9CA3AF" />
            <input
                type="text"
                placeholder="장소나 대화 상황을 검색해보세요"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            {searchText.length > 0 && (
                <button className="input-clear-btn" onClick={handleClearInput}>
                    <XCircle size={18} color="#9CA3AF" fill="#E5E7EB" />
                </button>
            )}
          </div>
          <button className="close-icon-btn" onClick={handleCloseSheet}>
            <X size={24} color="#374151" />
          </button>
        </header>

        <div className="sheet-content">
            {isSearched ? (
                <div className="search-results-area">
                    <h3 className="section-title">검색 결과 ({totalCount})</h3>
                    {totalCount === 0 ? (
                        <p className="no-result-msg">검색 결과가 없습니다.</p>
                    ) : (
                        <ul className="result-list">
                            {/* 장소 결과 */}
                            {searchResult.places.map((place) => (
                                <li key={`place-${place.id}`} className="result-item" onClick={() => {
                                    router.push(getRouteByPlaceId(place.id));
                                    handleCloseSheet();
                                }}>
                                    <div className="result-icon-box place-icon">
                                        <MapPin size={20} color="#fff" />
                                    </div>
                                    <div className="result-info">
                                        <span className="result-name">{place.name}</span>
                                        <span className="result-sub-text">장소 바로가기</span>
                                    </div>
                                </li>
                            ))}
                            {/* 대화 결과 */}
                            {searchResult.conversations.map((conv, idx) => (
                                <li key={`conv-${idx}`} className="result-item" onClick={() => {
                                    router.push(getRouteByPlaceId(conv.placeId));
                                    handleCloseSheet();
                                }}>
                                    <div className="result-icon-box conv-icon">
                                        <MessageCircle size={20} color="#fff" />
                                    </div>
                                    <div className="result-info">
                                        <span className="result-name">{conv.koreanText1}</span>
                                        <span className="result-sub-text">
                                            {conv.englishText1} · {conv.placeName}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ) : (
                <>
                    <section className="section-block">
                        <h3 className="section-title">추천 카테고리</h3>
                        <div className="category-grid">
                            {categories.map((cat) => (
                                <button key={cat.id} className="category-item" onClick={() => handleCategoryClick(cat.code, cat.label)}>
                                    <div className="cat-icon-box" style={{ backgroundColor: cat.bg }}>
                                        {cat.icon}
                                    </div>
                                    <span className="cat-label">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="section-block">
                        <h3 className="section-title">이렇게 검색해보세요</h3>
                        <div className="guide-list">
                            {searchGuides.map((guide, idx) => (
                                <button key={idx} className="guide-card" onClick={() => handleGuideClick(guide.keyword)}>
                                    <div className="guide-header">
                                        <span className="search-label">검색</span>
                                        <span className="guide-keyword">"{guide.keyword}"</span>
                                    </div>
                                    <div className="guide-connector">
                                        <ArrowDownRight size={16} color="#9CA3AF" />
                                    </div>
                                    <div className="guide-preview-box">
                                        <div className={`preview-icon ${guide.type === 'place' ? 'place-icon' : 'conv-icon'}`}>
                                            {guide.type === 'place' ? <MapPin size={14} color="#fff"/> : <MessageCircle size={14} color="#fff"/>}
                                        </div>
                                        <span className="preview-text">{guide.preview}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                </>
            )}
        </div>
      </div>
    </div>
  );
}