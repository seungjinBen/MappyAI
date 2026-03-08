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

// --- 타입 정의 ---
interface Place {
  id: number;
  lat: number;
  lng: number;
  name: string;
  imgUrl?: string; // API 필드명에 맞춰 imgUrl로 통일 권장
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

// --- 상수 및 설정 ---
const TARGET_IDS = [53, 55, 56, 58, 59, 61, 63, 64, 69, 71, 78, 80];
const GMAPS_LIBRARIES: ("places" | "geometry" | "drawing" | "visualization")[] = ['places'];
const DEFAULT_CENTER = { lat: 51.5048, lng: -0.1030 };
const DEFAULT_ZOOM = 13;

export default function LondonPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;
  const hasId = Boolean(id);

  const mapRef = useRef<google.maps.Map | null>(null);
  const [showBottomList, setShowBottomList] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [open, setOpen] = useState(false);

  // 전역 데이터 가져오기
  const context = useData();
  const placeList = (context?.placeList as Place[]) || [];
  const loading = context?.loading || false;

  // 1. 구글 맵 로드
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GMAPS_KEY as string,
    libraries: GMAPS_LIBRARIES,
  });

  // 2. 0.3초 지연 렌더링
  useEffect(() => {
    const timer = setTimeout(() => setShowBottomList(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // 3. 런던 지역 및 특정 ID 필터링 (전역 placeList 기반)
  const filteredPlaces = useMemo(() => {
    return placeList.filter(
      (p) => p.cityId === 3 && TARGET_IDS.includes(Number(p.id))
    );
  }, [placeList]);

  // 4. 특정 장소 상세 데이터 로드 (URL에 ID가 있을 때)
  useEffect(() => {
    if (id && isLoaded) {
      const targetId = Number(id);
      const found = filteredPlaces.find(p => p.id === targetId);
      
      if (found) {
        setSelectedPlace(found);
        // 대화 데이터 가져오기
        api.get(`/conversations/place/${targetId}`)
          .then(res => setConversations(res.data))
          .catch(err => console.error("대화 로드 실패:", err));
      }
    }
  }, [id, filteredPlaces, isLoaded]);

  // 5. 지도 이동 함수
  const panTo = useCallback((lat: number, lng: number, zoom = 15) => {
    if (mapRef.current) {
      mapRef.current.panTo({ lat, lng });
      mapRef.current.setZoom(zoom);
    }
  }, []);

  // 6. 마커 클릭 핸들러
  const handleMarkerClick = useCallback((p: Place) => {
    setSelectedPlace(p);
    panTo(p.lat, p.lng);
    router.push(`/london/${p.id}`);
    setOpen(true);
  }, [router, panTo]);

  // 7. 지도 빈 곳 클릭 시 초기화
  const handleMapClick = useCallback(() => {
    setSelectedPlace(null);
    router.push('/london');
    panTo(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng, DEFAULT_ZOOM);
    setOpen(false);
  }, [router, panTo]);

  if (loadError) return <div className="p-10">지도를 불러오지 못했습니다.</div>;
  if (!isLoaded || loading) return <div className="p-10">런던으로 여행을 떠나는 중...</div>;

  return (
    <div id="post-london">
      <div className="vh-screen" style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }}>
          <div className="safe-padded" style={{ flex: 1 }}>

            <GoogleMap
              onLoad={(map) => { mapRef.current = map; }}
              onClick={handleMapClick}
              mapContainerStyle={{ width: '100%', height: '60vh' }}
              center={selectedPlace ? { lat: selectedPlace.lat, lng: selectedPlace.lng } : DEFAULT_CENTER}
              zoom={selectedPlace ? 15 : DEFAULT_ZOOM}
              options={{
                disableDefaultUI: true,
                gestureHandling: 'greedy',
              }}
            >
              {filteredPlaces.map((p) => (
                <OverlayView
                  key={p.id}
                  position={{ lat: p.lat, lng: p.lng }}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
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
                      />
                    </div>
                    <div className="marker-name-tag">
                      {p.name.split('(')[0].trim()}
                    </div>
                  </div>
                </OverlayView>
              ))}
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
                  title="런던의 대표 장소"
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