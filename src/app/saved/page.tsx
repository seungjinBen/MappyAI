"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Volume2, Plane, Utensils, MapPin, Trash2, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import api from '@/lib/axios'; 
import '@/css/MyCard.css'; 

interface SavedConversation {
    savedId: number;
    conversationId: number;
    placeName: string;
    englishText1?: string; koreanText1?: string; audioUrl1?: string;
    englishText2?: string; koreanText2?: string; audioUrl2?: string;
    englishText3?: string; koreanText3?: string; audioUrl3?: string;
    englishText4?: string; koreanText4?: string; audioUrl4?: string;
    englishText5?: string; koreanText5?: string; audioUrl5?: string;
}

interface DialogueLine {
    id: number;
    en: string;
    ko: string;
    audioUrl?: string;
}

export default function SavedCardsPage() {
    const [savedList, setSavedList] = useState<SavedConversation[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [expandedCards, setExpandedCards] = useState<number[]>([]);
    
    const router = useRouter();

    useEffect(() => {
        const fetchSavedConversations = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                alert("로그인이 필요한 서비스입니다.");
                router.push('/login'); 
                return;
            }

            try {
                const response = await api.get('/bookmarks/my', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSavedList(response.data);
            } catch (error: any) {
                if (error.response?.status === 401 || error.response?.status === 403) {
                    alert("세션이 만료되었습니다. 다시 로그인해주세요.");
                    router.push('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSavedConversations();
    }, [router]);

    const handleDelete = async (conversationId: number) => {
        if (!window.confirm("정말 이 대화 카드를 삭제하시겠습니까?")) return;

        const token = localStorage.getItem('token');
        try {
            await api.delete('/bookmarks', {
                headers: { Authorization: `Bearer ${token}` },
                params: { conversationId }
            });

            setSavedList((prevList) =>
                prevList.filter((item) => item.conversationId !== conversationId)
            );
        } catch (error) {
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    const handlePlayAudio = (enText: string, audioUrl?: string) => {
        if (audioUrl && audioUrl.trim() !== '' && audioUrl !== 'null') {
            let finalPlayUrl = audioUrl;

            if (audioUrl.startsWith("gs://")) {
                const bucketName = "mappyproject-5ee09.firebasestorage.app";
                const filePath = audioUrl.replace(`gs://${bucketName}/`, "");
                const encodedPath = encodeURIComponent(filePath);
                finalPlayUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`;
            }

            const audio = new Audio(finalPlayUrl);
            audio.play().catch(e => {
                fallbackTTS(enText);
            });
        } else {
            fallbackTTS(enText);
        }
    };

    const fallbackTTS = (text: string) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    };

    const getPlaceStyle = (placeName?: string) => {
        const name = placeName ? placeName.toLowerCase() : "";
        if (name.includes('airport') || name.includes('flight') || name.includes('공항')) {
            return { color: '#3B82F6', bg: '#EFF6FF', icon: <Plane size={14} /> };
        } else if (name.includes('bistro') || name.includes('restaurant') || name.includes('cafe') || name.includes('식당') || name.includes('카페')) {
            return { color: '#F97316', bg: '#FFF7ED', icon: <Utensils size={14} /> };
        } else {
            return { color: '#10B981', bg: '#ECFDF5', icon: <MapPin size={14} /> };
        }
    };

    // 카드 접기/펴기 토글 함수
    const toggleExpand = (conversationId: number) => {
        setExpandedCards((prev) =>
            prev.includes(conversationId)
                ? prev.filter((id) => id !== conversationId) 
                : [...prev, conversationId] 
        );
    };

    if (loading) return <div className="loading-screen">로딩 중...</div>;

    return (
        <div className="my-card-page">
            <header className="my-header">
                <div className="header-top">
                    <h1 className="page-title">나의 노트</h1>
                    <span className="save-count">{savedList.length}개 저장됨</span>
                </div>
                <p className="header-desc">여행 중 저장한 표현을 오프라인에서도 확인하세요.</p>
            </header>

            <main className="card-list-container">
                {savedList.length === 0 ? (
                    <div className="empty-state" style={{ /* 기존 스타일 생략 */ }}>
                        <BookOpen size={60} strokeWidth={1.5} style={{ opacity: 0.5, marginBottom: '20px' }} />
                        <p style={{ textAlign: 'center', lineHeight: '1.6', margin: 0 }}>
                            아직 저장한 대화가 없습니다.<br/>
                            지도에서 대화를 연습하고 북마크를 눌러보세요!
                        </p>
                    </div>
                ) : (
                    <div className="card-grid">
                        {savedList.map((item) => {
                            const { color, bg, icon } = getPlaceStyle(item.placeName);

                            const dialogues: DialogueLine[] = [];
                            for(let i = 1; i <= 5; i++) {
                                const en = (item as any)[`englishText${i}`];
                                const ko = (item as any)[`koreanText${i}`];
                                const audio = (item as any)[`audioUrl${i}`];
                                
                                if (en && en.trim() !== "") {
                                    dialogues.push({ id: i, en, ko, audioUrl: audio });
                                }
                            }

                            // 현재 카드가 열려있는지 확인하고 보여줄 문장 갯수 정하기
                            const isExpanded = expandedCards.includes(item.conversationId);
                            const hasMore = dialogues.length > 1;
                            const visibleDialogues = isExpanded ? dialogues : dialogues.slice(0, 1);

                            return (
                                <div key={item.savedId} className="conversation-card">
                                    <div className="color-bar" style={{ backgroundColor: color }}></div>
                                    <div className="card-content">
                                        
                                        <div className="card-top-row">
                                            <span className="place-tag" style={{ color: color, backgroundColor: bg }}>
                                                {icon} {item.placeName || "Unknown Place"}
                                            </span>

                                            <button
                                                className="delete-btn"
                                                onClick={() => handleDelete(item.conversationId)}
                                                title="삭제하기"
                                            >
                                                <Trash2 size={20} color="#EF4444" />
                                            </button>
                                        </div>

                                        <div className="dialogue-area">
                                            {visibleDialogues.map((line) => (
                                                <div key={line.id} className="dialogue-row">
                                                    <div className="dialogue-text-group">
                                                        <h3 className="english-text">{line.en}</h3>
                                                        <p className="korean-text">{line.ko}</p>
                                                    </div>

                                                    <button
                                                        className="speak-btn-mini"
                                                        onClick={() => handlePlayAudio(line.en, line.audioUrl)}
                                                        title="원어민 발음 듣기"
                                                    >
                                                        <Volume2 size={18} color="#4B5563" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        
                                        {hasMore && (
                                            <button 
                                                className="expand-toggle-btn" 
                                                onClick={() => toggleExpand(item.conversationId)}
                                            >
                                                {isExpanded ? (
                                                    <>접기 <ChevronUp size={16} /></>
                                                ) : (
                                                    <>대화 더보기 ({dialogues.length - 1}) <ChevronDown size={16} /></>
                                                )}
                                            </button>
                                        )}

                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}