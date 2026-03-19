"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import '@/css/BottomSheet.css';
import '@/css/PlaceCards.css';
import MediaCarousel from './MediaCarousel';

interface Place {
  id: number;
  name: string;
  imgUrl?: string;
  description?: string;
}

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
                    마커를 클릭해 <strong>현지 상황에 딱 맞는 회화</strong>를 배워보세요!
                </div>
            </div>

            <div className="sheetContent" onClick={(e) => e.stopPropagation()}>
                <div className="main-city-list-container">
                    {placeList && placeList.length > 0 ? (
                        <>
                            {placeList.map((place) => {
                                const config = cityConfig[place.id] || { path: '/', label: '지도 보기' };

                                return (
                                    <article key={place.id} className="main-city-card">
                                        <h3 className="main-city-title">{place.name}</h3>
                                        
                                        <div className="main-city-media-wrap">
                                            <MediaCarousel
                                                placeId={place.id}
                                                placeName={place.name}
                                                fallbackSrc={place.imgUrl}
                                            />
                                        </div>

                                        {place.description && (
                                            <p className="main-city-desc" style={{ color: '#6B7280', fontWeight: '500' }}>
                                                {place.description}
                                            </p>
                                        )}

                                        <Link className="main-city-btn" href={config.path}>
                                            {config.label}
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                                                <polyline points="9 18 15 12 9 6"></polyline>
                                            </svg>
                                        </Link>
                                    </article> 
                                );
                            })}
                            
                            <article className="quest-card locked">
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
                            </article>
                        </>
                    ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                            로딩 중...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}