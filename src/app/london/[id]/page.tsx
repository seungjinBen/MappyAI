"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, ArrowLeft, X, Check } from 'lucide-react';
import api from '@/lib/axios';
import '@/css/PlaceDetail.css';

interface MediaItem {
    type: 'image' | 'video';
    src: string;
}

interface PlaceData {
    id: number;
    name: string;
    location: string;
    description: string;
    weatherInfo?: string;
}

interface Line {
    lineOrder: number;
    englishText: string;
    koreanText?: string;
}

interface Conversation {
    id: number;
    category?: string;
    type?: 'A' | 'B' | string;
    lines?: Line[];
}

export default function LondonPlaceDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id;

    const [place, setPlace] = useState<PlaceData | null>(null);
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [targetConv, setTargetConv] = useState<Conversation | null>(null);
    const [targetConvStep, setTargetConvStep] = useState(0);

    const [completedConvs, setCompletedConvs] = useState<number[]>([]);

    const [currentIdx, setCurrentIdx] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            try {
                setLoading(true);
                const [placeRes, mediaRes, convRes] = await Promise.all([
                    api.get(`/places/${id}`),
                    api.get(`/media/${id}`).catch(() => ({ data: null })),
                    api.get(`/conversations/place/${id}`).catch(() => ({ data: [] }))
                ]);

                const placeData: PlaceData = placeRes.data;
                setPlace(placeData);

                const combined = [
                    ...(mediaRes.data?.images ?? []).map((src: string) => ({ type: "image", src })),
                    ...(mediaRes.data?.videos ?? []).map((src: string) => ({ type: "video", src }))
                ];
                setMediaItems(combined.length > 0 ? combined : [{ type: "image", src: "/placeholder.jpg" }]);

                const convList: Conversation[] = convRes.data || [];
                setConversations(convList);

                const targetId = placeData.id * 2 - 1;
                const foundIdx = convList.findIndex(c => c.id === targetId);
                const resolvedIdx = foundIdx >= 0 ? foundIdx : 0;
                setTargetConvStep(resolvedIdx);
                setTargetConv(convList[resolvedIdx] ?? null);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    useEffect(() => {
        if (showModal && place) {
            try {
                const progressData = JSON.parse(localStorage.getItem('mappy_progress') || '{}');
                const completedForThisPlace = progressData[place.id] || [];
                setCompletedConvs(completedForThisPlace);
            } catch (error) {
                console.error("진행도 불러오기 실패:", error);
            }
        }
    }, [showModal, place]);

    const nextImg = useCallback(() => {
        if (mediaItems.length > 0) setCurrentIdx((prev) => (prev + 1) % mediaItems.length);
    }, [mediaItems.length]);

    const prevImg = useCallback(() => {
        if (mediaItems.length > 0) setCurrentIdx((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
    }, [mediaItems.length]);

    const handleStartChat = () => {
        router.push(`/chat/${place?.id}?step=${targetConvStep}`);
    };

    if (loading || !place) return <div className="loading-screen">정보를 가져오는 중...</div>;

    return (
        <div className="place-detail-full-wrapper">
            {showModal && (
                <div className="mission-modal-overlay">
                    <div className="mission-modal">
                        <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                            <X size={26} color="#9CA3AF" />
                        </button>

                        <h2 className="modal-title">어떤 대화를 연습할까요?</h2>
                        <p className="modal-subtitle">원하는 상황을 선택해 미션을 시작하세요.</p>

                        <div className="mission-list">
                            {conversations.length > 0 ? (
                                conversations.map((conv, index) => {
                                    const categoryText = conv.category || "기본 회화 연습하기";
                                    const lines = categoryText.split(',');

                                    const isCompleted = completedConvs.includes(conv.id);

                                    return (
                                        <div
                                            key={conv.id}
                                            className="mission-list-item"
                                            onClick={() => handleStartChat()}
                                            style={{
                                                backgroundColor: isCompleted ? '#F9FAFB' : '#FFFFFF',
                                                opacity: isCompleted ? 0.6 : 1,
                                                borderColor: isCompleted ? '#E5E7EB' : ''
                                            }}
                                        >
                                            <div
                                                className="mission-number"
                                                style={{
                                                    backgroundColor: isCompleted ? '#D1D5DB' : '#10B981',
                                                    color: '#FFFFFF'
                                                }}
                                            >
                                                {isCompleted ? <Check size={14} strokeWidth={3} /> : index + 1}
                                            </div>

                                            <div className="mission-text-box">
                                                {lines.map((textLine, i) => (
                                                    <div
                                                        key={i}
                                                        className="mission-text-line"
                                                        style={{ color: isCompleted ? '#9CA3AF' : '#1F2937'}}
                                                    >
                                                        {textLine.trim()}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '20px 0' }}>
                                    아직 이 장소에 준비된 대화 미션이 없습니다.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="visual-section">
                <img src={mediaItems[currentIdx]?.src} alt={place.name} className="main-bg-image" />

                <button className="circular-back-btn" onClick={() => router.back()}>
                    <ArrowLeft size={24} color="#fff" />
                </button>

                {mediaItems.length > 1 && (
                    <div className="carousel-arrow-layer">
                        <button className="plain-nav-btn" onClick={prevImg}>
                            <ChevronLeft size={48} color="#fff" />
                        </button>
                        <button className="plain-nav-btn" onClick={nextImg}>
                            <ChevronRight size={48} color="#fff" />
                        </button>
                    </div>
                )}
            </div>

            <div className="info-bottom-sheet">
                <div className="content-inner">
                    <h1 className="main-title-text-large">{place.name}</h1>
                    <p className="location-text-below-bold">London, United Kingdom</p>
                    <p className="description-text-gray-large">{place.description}</p>

                    {targetConv?.lines && targetConv.lines.length > 0 && (() => {
                        const sorted = [...targetConv.lines].sort((a, b) => a.lineOrder - b.lineOrder);
                        const preview = sorted.slice(0, 2);
                        const isTypeA = String(targetConv.type).toUpperCase() === 'A';
                        const getIsMe = (lineOrder: number) =>
                            isTypeA ? lineOrder % 2 === 1 : lineOrder % 2 === 0;
                        const remaining = targetConv.lines.length - 2;

                        return (
                            <div className="conv-preview-box">
                                <p className="conv-preview-label">✦ {targetConv.category || "기본 회화 연습하기"}</p>
                                {preview.map(line => {
                                    const isMe = getIsMe(line.lineOrder);
                                    return (
                                        <div key={line.lineOrder} className={`conv-preview-row ${isMe ? 'me' : 'other'}`}>
                                            <div className={`conv-preview-bubble ${isMe ? 'bubble-me' : 'bubble-other'}`}>
                                                {line.englishText}
                                            </div>
                                        </div>
                                    );
                                })}
                                {remaining > 0 && (
                                    <p className="conv-preview-more">+ {remaining}개의 대화가 더 있어요</p>
                                )}
                            </div>
                        );
                    })()}
                </div>

                <button className="cta-action-btn" onClick={handleStartChat}>
                    이 대화 경험하기 <ChevronRight size={24} />
                </button>
            </div>
        </div>
    );
}
