"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import api from '@/lib/axios';

import Header from '@/components/Main/Header';
import BottomSection from '@/components/Main/BottomSection';
import BottomSheet from '@/components/Main/BottomSheet';
import { useData } from '@/context/DataContext';

import '@/css/PostParis.css'; 

interface Place {
  id: number;
  lat: number;
  lng: number;
  name: string;
  imgUrl?: string; 
  cityId?: number;
}

interface Conversation {
  id: number;
  placeId: number;
  koreanText1: string;
  englishText1: string;
  type?: string;
  isSaved?: boolean;
}

const TARGET_IDS = [102,103,105,106,108,111,114,115,116,118];
const GMAPS_LIBRARIES: ("places" | "geometry" | "drawing" | "visualization")[] = ['places'];
const DEFAULT_CENTER = { lat: 55.9523, lng: -3.1952 };
const DEFAULT_ZOOM = 14.5;

export default function EdinPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;
  const hasId = Boolean(id);

  const mapRef = useRef<google.maps.Map | null>(null);
  const [showBottomList, setShowBottomList] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [open, setOpen] = useState(false);

  const context = useData();
  const placeList = (context?.placeList as Place[]) || [];
  const loading = context?.loading || false;

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GMAPS_KEY as string,
    libraries: GMAPS_LIBRARIES,
  });

  useEffect(() => {
    const timer = setTimeout(() => setShowBottomList(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const filteredPlaces = useMemo(() => {
    return placeList.filter(
      (p) => p.cityId === 4 && TARGET_IDS.includes(Number(p.id))
    );
  }, [placeList]);

  // 최적화 1: 처음 로딩될 때의 중심점과 줌 레벨을 '고정값'으로 계산
  const initialCenter = useMemo(() => {
    if (id && placeList.length > 0) {
      const target = placeList.find(p => p.id === Number(id));
      if (target) return { lat: target.lat, lng: target.lng };
    }
    return DEFAULT_CENTER;
  }, [id, placeList]);

  const initialZoom = useMemo(() => (hasId ? 15 : DEFAULT_ZOOM), [hasId]);

  useEffect(() => {
    if (id && isLoaded) {
      const targetId = Number(id);
      const found = filteredPlaces.find(p => p.id === targetId);
      
      if (found) {
        setSelectedPlace(found);
        api.get(`/conversations/place/${targetId}`)
          .then(res => setConversations(res.data))
          .catch(err => console.error("대화 로드 실패:", err));
      }
    }
  }, [id, filteredPlaces, isLoaded]);

  const panTo = useCallback((lat: number, lng: number, zoom = 15) => {
    if (mapRef.current) {
      mapRef.current.panTo({ lat, lng });
      mapRef.current.setZoom(zoom);
    }
  }, []);

  const handleMarkerClick = useCallback((p: Place) => {
    setSelectedPlace(p);
    panTo(p.lat, p.lng);
    // 최적화 2: Next.js 라우터 이동 시 스크롤 점프를 막고 부드럽게 넘김
    router.push(`/edinburgh/${p.id}`, { scroll: false });
    setOpen(true);
  }, [router, panTo]);

  const handleMapClick = useCallback(() => {
    setSelectedPlace(null);
    router.push('/edinburgh', { scroll: false });
    panTo(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng, DEFAULT_ZOOM);
    setOpen(false);
  }, [router, panTo]);

  // 최적화 3: 커스텀 마커들을 useMemo로 묶어서 불필요한 재렌더링을 완벽 차단
  const renderMarkers = useMemo(() => {
    return filteredPlaces.map((p) => (
      <OverlayView
        key={p.id}
        position={{ lat: p.lat, lng: p.lng }}
        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        // 마커의 위치를 정확히 핀포인트에 맞추기 위한 오프셋 설정
        getPixelPositionOffset={(width, height) => ({
          x: -(width / 2),
          y: -(height / 2),
        })}
      >
        <div
          className="custom-marker-container"
          onClick={(e) => {
            e.stopPropagation();
            handleMarkerClick(p);
          }}
        >
          <div className={`marker-photo-circle ${selectedPlace?.id === p.id ? 'active' : ''}`}>
            <img
              src={p.imgUrl || "/api/placeholder/100/100"}
              alt={p.name}
              loading="lazy"
            />
          </div>
          <div className="marker-name-tag">
            {p.name.split('(')[0].trim()}
          </div>
        </div>
      </OverlayView>
    ));
  }, [filteredPlaces, selectedPlace?.id, handleMarkerClick]);

  if (loadError) return <div className="p-10">지도를 불러오지 못했습니다.</div>;
  if (!isLoaded || loading) return <div className="p-10">에든버러로 여행을 떠나는 중...</div>;

  return (
    <div id="post-london">
      <div className="vh-screen" style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }}>
          <div className="safe-padded" style={{ flex: 1 }}>

            <GoogleMap
              onLoad={(map) => { mapRef.current = map; }}
              onClick={handleMapClick}
              mapContainerStyle={{ width: '100%', height: '65vh' }}
              center={initialCenter}
              zoom={initialZoom}
              options={{
                disableDefaultUI: true,
                gestureHandling: 'greedy',
              }}
            >
              {renderMarkers}
            </GoogleMap>

            {showBottomList && (
              hasId ? (
                <BottomSection
                  conversations={conversations}
                  selectedPlace={selectedPlace}
                  open={open}
                  onOpen={() => setOpen(true)}
                  onClose={() => setOpen(false)}
                  title="실전 회화 연습"
                  peekHeight="32vh"
                />
              ) : (
                <BottomSheet
                  placeList={filteredPlaces}
                  open={open}
                  onOpen={() => setOpen(true)}
                  onClose={() => setOpen(false)}
                  title="에든버러의 대표 장소"
                  peekHeight="32vh"
                  halfHeight="50vh"
                  fullHeight="90vh"
                />
              )
            )}
          </div>
        </main>
      </div>
    </div>
  );
}