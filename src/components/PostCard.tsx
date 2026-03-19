"use client";

import React, { useEffect, useState } from 'react';
import { Volume2, Plane, Utensils, MapPin, Trash2, X } from 'lucide-react';
import api from '@/lib/axios';
import '@/css/PostCard.css';

interface SavedConversation {
  savedId: number;
  conversationId: number;
  placeName: string;
  englishText1?: string; koreanText1?: string;
  englishText2?: string; koreanText2?: string;
  englishText3?: string; koreanText3?: string;
  englishText4?: string; koreanText4?: string;
  englishText5?: string; koreanText5?: string;
}

interface PostCardProps {
  isOpen: boolean;
  onClose: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ isOpen, onClose }) => {
  const [savedList, setSavedList] = useState<SavedConversation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // 시트가 열릴 때마다 데이터 새로고침
  useEffect(() => {
    if (isOpen) {
      fetchSavedConversations();
    }
  }, [isOpen]);

  const fetchSavedConversations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/bookmarks/my');
      setSavedList(response.data);
    } catch (error) {
      console.error("목록 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (conversationId: number) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await api.delete('/bookmarks', {
        params: { conversationId }
      });
      setSavedList((prev) => prev.filter((item) => item.conversationId !== conversationId));
    } catch (error) {
      alert("삭제 실패");
    }
  };

  const handleSpeak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const getPlaceStyle = (placeName: string) => {
    const name = placeName ? placeName.toLowerCase() : "";
    if (name.includes('airport') || name.includes('flight')) {
      return { color: '#3B82F6', bg: '#EFF6FF', icon: <Plane size={14} /> };
    }
    if (name.includes('bistro') || name.includes('restaurant') || name.includes('cafe')) {
      return { color: '#F97316', bg: '#FFF7ED', icon: <Utensils size={14} /> };
    }
    return { color: '#10B981', bg: '#ECFDF5', icon: <MapPin size={14} /> };
  };

  if (!isOpen) return null;

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-container" onClick={(e) => e.stopPropagation()}>
        
        <header className="sheet-header">
          <div className="header-left">
            <h2 className="sheet-title">나의 노트</h2>
            <span className="save-count">{savedList.length}</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} color="#374151" />
          </button>
        </header>

        <div className="sheet-content">
          {loading ? (
            <div className="loading-state">로딩 중...</div>
          ) : savedList.length === 0 ? (
            <div className="empty-state">저장된 대화가 없습니다.</div>
          ) : (
            <div className="card-grid">
              {savedList.map((item) => {
                const { color, bg, icon } = getPlaceStyle(item.placeName);
                
                // 데이터 가공 (1~5번 대화 추출)
                const dialogues = [];
                for (let i = 1; i <= 5; i++) {
                  const en = (item as any)[`englishText${i}`];
                  const ko = (item as any)[`koreanText${i}`];
                  if (en && en.trim() !== "") dialogues.push({ id: i, en, ko });
                }

                return (
                  <div key={item.savedId} className="conversation-card">
                    <div className="color-bar" style={{ backgroundColor: color }}></div>
                    <div className="card-content">
                      <div className="card-top-row">
                        <span className="place-tag" style={{ color: color, backgroundColor: bg }}>
                          {icon} {item.placeName || "Unknown"}
                        </span>
                        <button className="delete-btn" onClick={() => handleDelete(item.conversationId)}>
                          <Trash2 size={18} color="#EF4444" />
                        </button>
                      </div>
                      <div className="dialogue-area">
                        {dialogues.map((line) => (
                          <div key={line.id} className="dialogue-row">
                            <div className="dialogue-text-group">
                               <h3 className="english-text">{line.en}</h3>
                               <p className="korean-text">{line.ko}</p>
                            </div>
                            <button className="speak-btn-mini" onClick={() => handleSpeak(line.en)}>
                               <Volume2 size={18} color="#9CA3AF" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCard;