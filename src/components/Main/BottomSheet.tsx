"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Lock } from 'lucide-react'; // 🌟 자물쇠 아이콘 추가
import '@/css/BottomSheet.css';
import '@/css/PlaceCards.css';

interface Place {
  id: number;
  name: string;
  cityId?: number;
  city_id?: number;
  imgUrl?: string;
  description?: string;
  category?: 'A' | 'B' | 'C' | 'D' | 'E';
  subName?: string;
  stage?: number; // 🌟 stage 타입 추가
}

interface BottomSheetProps {
  placeList: Place[];
  open?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  title: string;
  peekHeight: string | number;
  halfHeight: string | number;
  fullHeight: string | number;
}

type SnapState = 'peek' | 'half' | 'full';

const getCityBasePath = (cityId?: number) => {
    const id = Number(cityId);
    switch (id) {
        case 1: return '/paris';
        case 2: return '/nice';
        case 3: return '/london';
        case 4: return '/edinburgh';
        default: return '/london';
    }
};

const CATEGORY_MAP: Record<string, string> = {
  'A': '관광명소',
  'B': '음식점',
  'C': '상점',
  'D': '대중교통',
  'E': '기타시설'
};

const getCategoryName = (category?: string) => {
  return category && CATEGORY_MAP[category] ? CATEGORY_MAP[category] : '미분류';
};

const getCategoryLevel = (category?: string) => {
  switch (category) {
    case 'A': return 1;
    case 'B': return 2;
    case 'C': return 2;
    case 'D': return 2;
    case 'E': return 2;
    default: return 3;
  }
};

const BottomSheet: React.FC<BottomSheetProps> = ({
  placeList, open, onOpen, onClose, title, peekHeight, halfHeight, fullHeight
}) => {
    const sheetRef = useRef<HTMLDivElement>(null);
    const [snap, setSnap] = useState<SnapState>('peek');
    const dragRef = useRef({ dragging: false, startY: 0, startVisiblePx: 0 });
    const [vh, setVh] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);
    const [progressMap, setProgressMap] = useState<Record<number, number>>({});

    // 현재 열린 스테이지 계산 로직 
    const currentStage = useMemo(() => {
        if (!placeList || placeList.length === 0) return 1;

        let stageToUnlock = 1;
        const maxStage = Math.max(...placeList.map(p => p.stage || 1), 1);

        for (let s = 1; s < maxStage; s++) {
            const placesInThisStage = placeList.filter(p => (p.stage || 1) === s);
            const isAllCleared = placesInThisStage.every(p => (progressMap[p.id] || 0) > 0);

            if (isAllCleared) {
                stageToUnlock = s + 1;
            } else {
                break;
            }
        }
        return stageToUnlock;
    }, [placeList, progressMap]);

    // 정렬: 진행 중(미완료+열림) -> 잠김 -> 완료됨 순서로 
    const sortedPlaceList = useMemo(() => {
        if (!placeList) return [];
        return [...placeList].sort((a, b) => {
            const aCompleted = (progressMap[a.id] || 0) >= 2;
            const bCompleted = (progressMap[b.id] || 0) >= 2;

            const aStage = a.stage || 1;
            const bStage = b.stage || 1;
            const aLocked = aStage > currentStage;
            const bLocked = bStage > currentStage;

            if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
            if (aLocked !== bLocked) return aLocked ? 1 : -1;
            if (aStage !== bStage) return aStage - bStage;

            return getCategoryLevel(a.category) - getCategoryLevel(b.category);
        });
    }, [placeList, progressMap, currentStage]);

    useEffect(() => {
        const handleResize = () => setVh(window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toPx = useCallback((val: string | number) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
            const trimmed = val.trim();
            if (trimmed.endsWith('vh')) return (parseFloat(trimmed) / 100) * vh;
            if (trimmed.endsWith('px')) return parseFloat(trimmed);
            return parseFloat(trimmed) || 0;
        }
        return 0;
    }, [vh]);

    const peekPx = useMemo(() => toPx(peekHeight), [peekHeight, toPx]);
    const halfPx = useMemo(() => toPx(halfHeight), [halfHeight, toPx]);
    const fullPx = useMemo(() => toPx(fullHeight), [fullHeight, toPx]);

    useEffect(() => {
        const el = sheetRef.current;
        if (!el) return;
        el.style.setProperty('--full-height', typeof fullHeight === 'number' ? `${fullHeight}px` : fullHeight.toString());
        const targetPx = snap === 'peek' ? peekPx : snap === 'half' ? halfPx : fullPx;
        el.style.setProperty('--visible-height', `${targetPx}px`);
    }, [snap, peekPx, halfPx, fullPx, fullHeight]);

    useEffect(() => {
        if (open === undefined) return;
        setSnap(open ? 'half' : 'peek');
    }, [open]);

    const onPointerMove = useCallback((e: PointerEvent) => {
        if (!dragRef.current.dragging) return;
        const dy = dragRef.current.startY - e.clientY;
        const visible = Math.min(Math.max(dragRef.current.startVisiblePx + dy, peekPx), fullPx);
        if (sheetRef.current) {
            sheetRef.current.style.setProperty('--visible-height', `${visible}px`);
        }
    }, [peekPx, fullPx]);

    const onPointerUp = useCallback(() => {
        dragRef.current.dragging = false;
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);

        if (!sheetRef.current) return;
        const curr = parseFloat(getComputedStyle(sheetRef.current).getPropertyValue('--visible-height')) || peekPx;

        const midPeekHalf = (peekPx + halfPx) / 2;
        const midHalfFull = (halfPx + fullPx) / 2;

        let next: SnapState = 'peek';
        if (curr >= midHalfFull) next = 'full';
        else if (curr >= midPeekHalf) next = 'half';

        setSnap(next);
        if (next === 'peek') onClose?.();
        else onOpen?.();
    }, [peekPx, halfPx, fullPx, onPointerMove, onClose, onOpen]);

    const onPointerDown = (e: React.PointerEvent) => {
        dragRef.current.dragging = true;
        dragRef.current.startY = e.clientY;
        const currPx = snap === 'peek' ? peekPx : snap === 'half' ? halfPx : fullPx;
        dragRef.current.startVisiblePx = currPx;

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    };

    useEffect(() => {
        const fetchProgress = async () => {
            const token = localStorage.getItem('token');
            const newProgressMap: Record<number, number> = {};

            if (token) {
                try {
                    const res = await api.get('/missions/progress/my', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    res.data.forEach((item: any) => {
                        newProgressMap[item.placeId] = item.completedCount;
                    });
                    setProgressMap(newProgressMap);
                    return;
                } catch (error) {
                    console.error("서버 진도 로드 실패, 로컬로 대체", error);
                }
            }

            try {
                const localData = JSON.parse(localStorage.getItem('mappy_progress') || '{}');
                Object.keys(localData).forEach(placeId => {
                    newProgressMap[Number(placeId)] = localData[placeId].length;
                });
                setProgressMap(newProgressMap);
            } catch (e) {
                console.error("로컬 데이터 읽기 실패", e);
            }
        };
        if (open) {
            fetchProgress();
        }
    }, [open]);

    // 미션 진행률 계산
    const totalMissions = placeList?.length || 0;
    const completedMissions = placeList?.filter(place => (progressMap[place.id] || 0) >= 2).length || 0;
    const progressPercent = totalMissions === 0 ? 0 : Math.round((completedMissions / totalMissions) * 100);

    return (
        <div
            ref={sheetRef}
            className="sheetMain"
            role="dialog"
            aria-modal
            style={{
                '--peek-height': `${peekPx}px`,
                '--full-height': typeof fullHeight === 'number' ? `${fullHeight}px` : fullHeight,
            } as React.CSSProperties}
            onClick={snap === 'peek' ? onOpen : undefined}
        >
            <div className="sheetHeader" onPointerDown={onPointerDown} style={{ touchAction: 'none' }}>
                <div className="sheetGrabber" />
                
                <div className="quest-header-top">
                    <div className="quest-title-wrap">
                        <div className="quest-header-icon-box">
                            <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                        </div>
                        <h2 className="quest-main-title">{title}</h2>
                    </div>
                    
                    <button type="button" className="sheetClose" onClick={(e) => { e.stopPropagation(); setSnap('peek'); onClose?.(); }}>
                        <svg viewBox="0 0 24 24" className="sheetCloseIcon">
                            <path d="M6.4 5l5.6 5.6L17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4 6.4 5z" />
                        </svg>
                    </button>
                </div>
                
                <div className="quest-header-desc">
                    지도를 탐험하며 숨겨진 미션을 완성해보세요!
                </div>

                <div className="city-progress-container" style={{ marginTop: '10px', padding: '0 4px', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#4B5563' }}>미션 달성률</span>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#10B981' }}>
                            {progressPercent}% <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: '600', marginLeft: '2px' }}>({completedMissions}/{totalMissions})</span>
                        </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#E5E7EB', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${progressPercent}%`,
                            height: '100%',
                            backgroundColor: '#10B981',
                            borderRadius: '999px',
                            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}></div>
                    </div>
                </div>

            </div>

            <div className="sheetContent" onClick={(e) => e.stopPropagation()}>
                <div className="quest-list-container">
                    {sortedPlaceList.map((place) => {
                        const basePath = getCityBasePath(place.cityId || place.city_id);
                        const categoryName = getCategoryName(place.category);
                        const level = getCategoryLevel(place.category);

                        const completedCount = progressMap[place.id] || 0;
                        const isCompleted = completedCount >= 2;

                        const placeStage = place.stage || 1;
                        const isLocked = placeStage > currentStage;

                        // 잠긴 상태일 때 렌더링될 UI
                        if (isLocked) {
                            return (
                                <article 
                                    key={place.id}
                                    className="quest-card"
                                    onClick={() => alert(`이전 장소들의 미션을 먼저 모두 완료해 잠금을 해제하세요! 🗝️`)}
                                    style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', cursor: 'pointer' }}
                                >
                                    <div className="quest-card-img-box" style={{ filter: 'grayscale(100%)', opacity: 0.5, position: 'relative' }}>
                                        <img src={place.imgUrl || '/placeholder.jpg'} alt={place.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                                            <Lock color="white" size={24} />
                                        </div>
                                    </div>

                                    <div className="quest-card-info" style={{ opacity: 0.6 }}>
                                        <div className="quest-badge" style={{ backgroundColor: '#E5E7EB', color: '#6B7280' }}>
                                            🔒 STAGE {placeStage} - {categoryName}
                                        </div>
                                        
                                        <div className="quest-titles">
                                            <h3 className="quest-name" style={{ color: '#9CA3AF' }}>{place.name}</h3>
                                        </div>
                                        
                                        <div className="quest-stamp-status" style={{ color: '#6B7280', fontWeight: '500' }}>
                                            이전 단계를 모두 클리어하세요
                                        </div>
                                    </div>
                                    
                                    <div className="quest-arrow">
                                        <Lock size={20} color="#D1D5DB" />
                                    </div>
                                </article>
                            );
                        }

                        // 열려 있는 상태일 때 렌더링될 UI
                        return (
                            <Link key={place.id} href={`${basePath}/${place.id}`} className="quest-card-link">
                                <article 
                                    className="quest-card"
                                    style={{ 
                                        opacity: isCompleted ? 0.7 : 1, 
                                        backgroundColor: isCompleted ? '#F9FAFB' : '#FFFFFF', 
                                        border: isCompleted ? '1px solid #E5E7EB' : '1px solid #F3F4F6'
                                    }}
                                >
                                    <div className="quest-card-img-box" style={{ position: 'relative', overflow: 'hidden' }}>
                                        <img src={place.imgUrl || '/placeholder.jpg'} alt={place.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        
                                        {isCompleted && (
                                            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)' }}></div>
                                        )}
                                    </div>

                                    <div className="quest-card-info">
                                        <div className="quest-badge" 
                                             style={{ 
                                                 backgroundColor: isCompleted ? '#F3F4F6' : '', 
                                                 color: isCompleted ? '#6B7280' : '#10B981' 
                                             }}>
                                            STAGE {placeStage} - {categoryName}
                                        </div>
                                        
                                        <div className="quest-titles">
                                            <h3 className="quest-name" style={{ color: isCompleted ? '#6B7280' : '#1F2937' }}>
                                                {place.name}
                                            </h3>
                                            {place.subName && (
                                                <span className="quest-subname" style={{ color: isCompleted ? '#9CA3AF' : '' }}>
                                                    ({place.subName})
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="quest-stamp-status" 
                                             style={{ 
                                                 color: isCompleted ? '#10B981' : '#6B7280', 
                                                 fontWeight: isCompleted ? '700' : '500' 
                                             }}>
                                            {isCompleted ? (
                                                <>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" width="16" height="16">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    미션 완료!
                                                </>
                                            ) : (
                                                <>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                                    </svg>
                                                    대화 미션 도전하기
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="quest-arrow">
                                        {isCompleted ? (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                                                <polyline points="9 18 15 12 9 6"></polyline>
                                            </svg>
                                        )}
                                    </div>
                                </article>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default BottomSheet;