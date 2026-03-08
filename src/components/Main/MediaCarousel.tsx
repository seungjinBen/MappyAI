"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import axios from "axios";
import "@/css/MediaCarousel.css";

// --- 타입 정의 ---
interface MediaItem {
  type: 'image' | 'video';
  src: string;
}

interface MediaCarouselProps {
  placeId?: number | null;
  placeName?: string;
  fallbackSrc?: string;
}

export default function MediaCarousel({
  placeId,
  placeName = "place media",
  fallbackSrc
}: MediaCarouselProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);

  const wrapRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number | null>(null);

  // 뷰포트 너비 측정 (Next.js 클라이언트 사이드 대응)
  const [vw, setVw] = useState(0);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const measure = () => setVw(el.clientWidth);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);

    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, []);

  // 데이터 로드
  useEffect(() => {
    if (placeId == null) return;

    let alive = true;
    const fetchMedia = async () => {
      try {
        setLoading(true);
        setErr(null);
        setIdx(0);

        const { data } = await axios.get(`/api/media/${placeId}`);

        const imgs: MediaItem[] = (data?.images ?? []).map((src: string) => ({ type: "image", src }));
        const vids: MediaItem[] = (data?.videos ?? []).map((src: string) => ({ type: "video", src }));
        const arr = [...imgs, ...vids];

        if (!alive) return;

        setItems(
          arr.length ? arr : [{ type: "image", src: fallbackSrc || "/placeholder.jpg" }]
        );
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "load error");
        setItems([{ type: "image", src: fallbackSrc || "/placeholder.jpg" }]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchMedia();
    return () => { alive = false; };
  }, [placeId, fallbackSrc]);

  const count = items.length;

  const clamp = useCallback((n: number) => {
    if (count === 0) return 0;
    return (n + count) % count;
  }, [count]);

  const prev = () => setIdx((v) => clamp(v - 1));
  const next = () => setIdx((v) => clamp(v + 1));

  // 드래그/스와이프 핸들러 (Pointer Event 통합)
  const handlePointerDown = (e: React.PointerEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    startXRef.current = clientX;
  };

  const handlePointerUp = (e: React.PointerEvent | React.TouchEvent) => {
    if (startXRef.current === null) return;

    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.PointerEvent).clientX;
    const dx = clientX - startXRef.current;
    startXRef.current = null;

    if (Math.abs(dx) > 40) {
      if (dx < 0) next();
      else prev();
    }
  };

  // 키보드 제어
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };

    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [count]); // count가 바뀔 때 핸들러 최신화

  // 트랙 스타일 계산
  const trackStyle = useMemo(() => ({
    width: `${items.length * vw}px`,
    transform: `translateX(-${idx * vw}px)`,
    transition: "transform 280ms ease",
  }), [items.length, idx, vw]);

  return (
    <div
      className="media-carousel"
      ref={wrapRef}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchEnd={handlePointerUp}
      aria-label={`${placeName} media carousel`}
    >
      {loading && <div className="media-status">불러오는 중…</div>}
      {!loading && err && <div className="media-status warn">로드 실패: {err}</div>}

      <div className="media-viewport" ref={viewportRef}>
        <div className="media-track" style={trackStyle}>
          {items.map((m, i) => (
            <div className="media-slide" key={i} style={{ width: `${vw}px` }}>
              {m.type === "image" ? (
                <img
                  className="media-img"
                  src={m.src}
                  alt={`${placeName} - 이미지 ${i + 1}`}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <video
                  className="media-video"
                  src={m.src}
                  controls
                  playsInline
                  preload="metadata"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {count > 1 && (
        <>
          <button className="nav-btn left" onClick={prev} aria-label="이전">‹</button>
          <button className="nav-btn right" onClick={next} aria-label="다음">›</button>

          <div className="dots">
            {items.map((_, i) => (
              <button
                key={i}
                className={`dot ${i === idx ? "active" : ""}`}
                aria-label={`${i + 1}번으로 이동`}
                onClick={() => setIdx(i)}
              />
            ))}
          </div>

          <div className="counter" aria-hidden>
            {idx + 1} / {count}
          </div>
        </>
      )}
    </div>
  );
}