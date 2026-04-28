"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import api from '@/lib/axios';
import '@/css/BottomSheet.css';
import '@/css/PlaceCards.css';
import MediaCarousel from './MediaCarousel';

interface Place {
  id: number;
  name: string;
  imgUrl?: string;
  description?: string;
}

interface RecommendedPlace {
  id: number;
  name: string;
  imgUrl?: string;
}

const PARIS_SLOTS = {
  morning: {
    label: '오전',
    desc: '파리의 카페에서\n현지인처럼 시작해볼까요?',
    ids: [1, 34, 15],
  },
  afternoon: {
    label: '오후',
    desc: '파리의 관광명소를 구경해요',
    ids: [14, 19, 35],
  },
  evening: {
    label: '저녁',
    desc: '파리에서의 저녁은 이곳이 참 예뻐요',
    ids: [25, 27, 52],
  },
  night: {
    label: '밤',
    desc: '파리는 지금 밤이에요. 아침이 되기 전, 미리 탐방해보아요',
    ids: [21, 37, 9],
  },
} as const;

type TimeSlot = keyof typeof PARIS_SLOTS;

const getParisTimeSlot = (): TimeSlot => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris',
    hour: 'numeric',
    hour12: false,
  });
  const hour = parseInt(formatter.format(new Date()), 10) % 24;
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
};

interface BottomSheetMainProps {
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

const cityConfig: Record<number, { path: string; label: string }> = {
    52:  { path: '/paris',     label: '파리 둘러보기' },
    64:  { path: '/london',    label: '런던 둘러보기' },
    96:  { path: '/nice',      label: '니스 둘러보기' },
    108: { path: '/edinburgh', label: '에든버러 둘러보기' }
};

export default function BottomSheetMain({
  placeList,
  open,
  onOpen,
  onClose,
  title,
  peekHeight,
  halfHeight,
  fullHeight
}: BottomSheetMainProps) {
    const sheetRef = useRef<HTMLDivElement>(null);
    const [snap, setSnap] = useState<SnapState>('peek');
    const dragRef = useRef({ dragging: false, startY: 0, startVisiblePx: 0 });
    const [vh, setVh] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);
    const [timeSlot] = useState<TimeSlot>(() => getParisTimeSlot());
    const [recommendedPlaces, setRecommendedPlaces] = useState<RecommendedPlace[]>([]);

    useEffect(() => {
        const ids = PARIS_SLOTS[timeSlot].ids;
        Promise.all(ids.map(id => api.get(`/places/${id}`).then(r => r.data).catch(() => null)))
            .then(results => setRecommendedPlaces(results.filter(Boolean)));
    }, [timeSlot]);

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
                                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
                                <line x1="9" y1="3" x2="9" y2="18"></line>
                                <line x1="15" y1="6" x2="15" y2="21"></line>
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
                    도시를 탭하면 <strong>그 장소에서 나눌 대화들</strong>이 펼쳐져요
                </div>
            </div>

            <div className="sheetContent" onClick={(e) => e.stopPropagation()}>
                <div className="main-city-list-container">
                    {placeList && placeList.length > 0 ? (
                        <>
                            {placeList.map((place) => {
                                const config = cityConfig[place.id] || { path: '/', label: '지도 보기' };

                                return (
                                    <Link key={place.id} href={config.path} className="city-pill-btn">
                                        {/* 동그란 로고(사진) 영역 */}
                                        <div className="city-pill-img-wrapper">
                                            <img
                                                src={place.imgUrl}
                                                alt={place.name}
                                                className="city-pill-img"
                                            />
                                        </div>

                                        {/* 도시 이름 텍스트 */}
                                        <span className="city-pill-text">{place.name}</span>
                                    </Link>
                                );
                            })}

                            {/* <article className="quest-card locked">
                                <div className="quest-card-img-box locked-box">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" width="28" height="28">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                        <circle cx="12" cy="10" r="3"></circle>
                                    </svg>
                                </div>
                                <div className="quest-card-info">
                                    <h3 className="quest-name locked-text">잠긴 장소...</h3>
                                    <div className="quest-stamp-status locked-subtext">추후 업로드 예정</div>
                                </div>
                            </article> */}
                        </>
                    ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                            로딩 중...
                        </div>
                    )}
                </div>

                {/* 파리 현지 시간 기반 장소 추천 */}
                <div style={{ padding: '24px 10px 0' }}>
                    {/* 시간대 배지 */}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        backgroundColor: '#FEF3C7', border: '1px solid #FCD34D',
                        borderRadius: '999px', padding: '4px 12px', marginBottom: '10px'
                    }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#F59E0B', display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontSize: '12px', color: '#92400E', fontWeight: '600' }}>
                            지금 {PARIS_SLOTS[timeSlot].label} · 파리 현지 기준
                        </span>
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', margin: '0 0 4px' }}>
                        지금 가볼 만한 곳
                    </h3>
                    <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '0 0 16px', whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                        {PARIS_SLOTS[timeSlot].desc}
                    </p>

                    {/* 장소 카드 가로 스크롤 */}
                    <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none', marginLeft: '-10px', marginRight: '-10px', paddingLeft: '10px', paddingRight: '10px' }}>
                        {recommendedPlaces.map(place => (
                            <Link
                                key={place.id}
                                href={`/paris/${place.id}`}
                                style={{ flexShrink: 0, width: '148px', textDecoration: 'none', color: 'inherit' }}
                            >
                                <div style={{
                                    width: '148px', borderRadius: '20px', overflow: 'hidden',
                                    backgroundColor: '#fff', border: '1px solid #F3F4F6',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.07)'
                                }}>
                                    {/* 이미지 */}
                                    <div style={{ width: '148px', height: '130px', backgroundColor: '#E5E7EB', overflow: 'hidden' }}>
                                        {place.imgUrl && (
                                            <img src={place.imgUrl} alt={place.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        )}
                                    </div>
                                    {/* 텍스트 */}
                                    <div style={{ padding: '10px 12px 12px' }}>
                                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {place.name}
                                        </p>
                                        <p style={{ fontSize: '12px', color: '#10B981', margin: 0, display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '600' }}>
                                            <MapPin size={11} fill="#10B981" stroke="none" /> 파리
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* 각 도시의 대표 장소 */}
                <div style={{ padding: '24px 10px 80px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', margin: '0 0 4px' }}>
                        각 도시의 대표 장소
                    </h3>
                    <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '0 0 16px', lineHeight: '1.6' }}>
                        도시를 상징하는 명소에서 첫 회화를 시작해보세요
                    </p>
                    <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none', marginLeft: '-10px', marginRight: '-10px', paddingLeft: '10px', paddingRight: '10px' }}>
                        {placeList.map(city => {
                            const config = cityConfig[city.id] || { path: '/', label: '' };
                            const countryLabel = city.id === 52 || city.id === 96 ? '프랑스' : '영국';
                            return (
                                <Link
                                    key={city.id}
                                    href={config.path}
                                    style={{ flexShrink: 0, width: '148px', textDecoration: 'none', color: 'inherit' }}
                                >
                                    <div style={{
                                        width: '148px', borderRadius: '20px', overflow: 'hidden',
                                        backgroundColor: '#fff', border: '1px solid #F3F4F6',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.07)'
                                    }}>
                                        <div style={{ width: '148px', height: '130px', backgroundColor: '#E5E7EB', overflow: 'hidden' }}>
                                            {city.imgUrl && (
                                                <img src={city.imgUrl} alt={city.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            )}
                                        </div>
                                        <div style={{ padding: '10px 12px 12px' }}>
                                            <p style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {city.name}
                                            </p>
                                            <p style={{ fontSize: '12px', color: '#10B981', margin: 0, display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '600' }}>
                                                <MapPin size={11} fill="#10B981" stroke="none" /> {countryLabel}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}