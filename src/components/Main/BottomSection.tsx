"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import '@/css/BottomSection.css';
import PlaceCards from './PlaceCards';

// --- 타입 정의 ---
interface Place {
  id: number;
  name: string;
  lat: number;
  lng: number;
  imageUrl?: string;
}

interface BottomSectionProps {
  conversations?: any[];
  selectedPlace?: Place | null;
  placeList?: Place[];
  open?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  title: string;
  peekHeight?: string | number;
  halfHeight?: string | number;
  fullHeight?: string | number;
}

type SnapState = 'peek' | 'half' | 'full';

const BottomSection: React.FC<BottomSectionProps> = ({
  conversations,
  selectedPlace,
  placeList = [],
  onOpen,
  onClose,
  title,
  peekHeight = '32vh',
  halfHeight = '50vh',
  fullHeight = '91vh',
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [peekLocal, setPeekLocal] = useState<string | number>(peekHeight);
  const [snap, setSnap] = useState<SnapState>('peek');

  // 드래그 상태 관리
  const dragRef = useRef({
    dragging: false,
    startY: 0,
    startVisiblePx: 0,
  });

  // Viewport 높이 계산
  const [vh, setVh] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);

  useEffect(() => {
    const handleResize = () => setVh(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 단위를 Pixel로 변환하는 유틸리티
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

  const peekPx = useMemo(() => toPx(peekLocal), [peekLocal, toPx]);
  const halfPx = useMemo(() => toPx(halfHeight), [halfHeight, toPx]);
  const fullPx = useMemo(() => toPx(fullHeight), [fullHeight, toPx]);

  // 높이 업데이트 로직
  const updateVisibleHeight = useCallback((height: number) => {
    if (sheetRef.current) {
      sheetRef.current.style.setProperty('--visible-height', `${height}px`);
    }
  }, []);

  useEffect(() => {
    const targetPx = snap === 'peek' ? peekPx : snap === 'half' ? halfPx : fullPx;
    updateVisibleHeight(targetPx);
  }, [snap, peekPx, halfPx, fullPx, updateVisibleHeight]);

  useEffect(() => {
    setPeekLocal(peekHeight);
  }, [peekHeight]);

  // 드래그 이벤트 핸들러
  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragRef.current.dragging) return;

    const dy = dragRef.current.startY - e.clientY;
    const visible = Math.min(Math.max(dragRef.current.startVisiblePx + dy, peekPx), fullPx);

    updateVisibleHeight(visible);
  }, [peekPx, fullPx, updateVisibleHeight]);

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
        '--full-height': `${fullPx}px`,
      } as React.CSSProperties}
      onClick={snap === 'peek' ? onOpen : undefined}
    >
      {/* 헤더/그립 영역 */}
      <div
        className="sheetHeader"
        onPointerDown={onPointerDown}
        style={{ touchAction: 'none' }} // 브라우저 기본 스크롤 방지
      >
        <div className="sheetGrabber" title="끌어올리거나 내려서 열기/닫기" />
        <div className="sheetHeaderRow">
          <div className="sheetTitle">{title}</div>
          <button
            type="button"
            className="sheetClose"
            onClick={(e) => {
              e.stopPropagation();
              setPeekLocal('22vh'); // X 버튼 클릭 시 높이 축소
              setSnap('peek');
              onClose?.();
            }}
          >
            <svg viewBox="0 0 24 24" className="sheetCloseIcon">
              <path d="M6.4 5l5.6 5.6L17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4 6.4 5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="sheetContent" onClick={(e) => e.stopPropagation()}>
        <PlaceCards
          conversations={conversations}
          selectedPlace={selectedPlace}
        />
      </div>

      <div className="sheetMask" />
    </div>
  );
};

export default BottomSection;