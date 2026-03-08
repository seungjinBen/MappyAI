"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Link from 'next/link'; // Next.js용 Link
import '@/css/BottomSheet.css';
import '@/css/PlaceCards.css';
import MediaCarousel from './MediaCarousel';

// --- 타입 정의 ---
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

// 각 도시별 설정값 매핑 (ID 기준)
const cityConfig: Record<number, { path: string; label: string }> = {
    52:  { path: '/paris',     label: '파리 둘러보기' },
    64:  { path: '/london',    label: '런던 둘러보기' },
    98:  { path: '/nice',      label: '니스 둘러보기' },
    113: { path: '/edinburgh', label: '에든버러 둘러보기' }
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

    // viewport 높이 측정
    const [vh, setVh] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);

    useEffect(() => {
        const handleResize = () => setVh(window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 단위를 Pixel로 변환하는 헬퍼
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

    // 스타일 변수 업데이트
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

    // --- 드래그 핸들러 (Pointer Events 통합) ---
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
            aria-label={title}
            style={{
                '--peek-height': `${peekPx}px`,
                '--full-height': typeof fullHeight === 'number' ? `${fullHeight}px` : fullHeight,
            } as React.CSSProperties}
            onClick={snap === 'peek' ? onOpen : undefined}
        >
            <div
                className="sheetHeader"
                onPointerDown={onPointerDown}
                style={{ touchAction: 'none' }}
            >
                <div className="sheetGrabber" />
                <div className="sheetHeaderRow">
                    <div className="sheetTitle">{title}</div>
                    <button type="button" className="sheetClose" onClick={(e) => { e.stopPropagation(); setSnap('peek'); onClose?.(); }}>
                        <svg viewBox="0 0 24 24" className="sheetCloseIcon"><path d="M6.4 5l5.6 5.6L17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4 6.4 5z" /></svg>
                    </button>
                </div>
                <div style={{ fontSize: '13px', color: '#888', marginTop: '4px', lineHeight: '1.4', paddingBottom: '8px' }}>
                    마커를 클릭해 <strong>현지 상황에 딱 맞는 회화</strong>를 배워보세요!
                </div>
            </div>

            <div className="sheetContent" onClick={(e) => e.stopPropagation()}>
                <section className="card-container">
                    <div className="container cq">
                        <div className="card-grid mq-2col">
                            {placeList && placeList.length > 0 ? (
                                placeList.map((place) => {
                                    const config = cityConfig[place.id] || { path: '/', label: '지도 보기' };

                                    return (
                                        <article key={place.id} className="card shadow-soft">
                                            <div style={{ display: 'flex', margin: '0 0 10px 5px', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                                <h3 className="card-title" style={{ marginBottom: 0 }}>
                                                    {place.name ?? '이름 없음'}
                                                </h3>
                                            </div>

                                            <MediaCarousel
                                                placeId={place.id}
                                                placeName={place.name}
                                                fallbackSrc={place.imgUrl}
                                            />

                                            {place.description && (
                                                <p style={{
                                                    fontSize: '14px',
                                                    lineHeight: '1.6',
                                                    color: '#333333',
                                                    margin: '6px',
                                                    wordBreak: 'keep-all',
                                                    letterSpacing: '-0.3px'
                                                }}>
                                                    {place.description}
                                                </p>
                                            )}

                                            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                                <Link
                                                    className="btn-outline"
                                                    href={config.path} // to -> href
                                                    style={{ width: '100%', fontWeight: '550', textAlign: 'center', justifyContent: 'center', display: 'flex', alignItems: 'center' }}
                                                >
                                                    {config.label}
                                                </Link>
                                            </div>
                                        </article>
                                    );
                                })
                            ) : (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                                    로딩 중...
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
            <div className="sheetMask" />
        </div>
    );
}