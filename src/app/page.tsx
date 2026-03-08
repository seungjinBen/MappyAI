"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import Header from '@/components/Main/Header';
import BottomSheetMain from '@/components/Main/BottomSheetMain';
import { useRouter } from 'next/navigation';
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { useData } from '@/context/DataContext';

// 둥실둥실 애니메이션 CSS
import '@/css/PostParis.css'; 

// --- 타입 정의 ---
interface Place {
  id: number;
  lat: number;
  lng: number;
  name: string;
  imgUrl?: string;
}

const apiKey = process.env.NEXT_PUBLIC_GMAPS_KEY as string;
const GMAPS_LIBRARIES: ("places" | "geometry" | "drawing" | "visualization")[] = ['places'];

export default function PostMain() {
  const router = useRouter();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [open, setOpen] = useState(false);
  const [showBottomList, setShowBottomList] = useState(false);

  // 전역 데이터 컨텍스트 사용
  const context = useData();
  const placeList = (context?.placeList as Place[]) || [];
  const loading = context?.loading || false;

  useEffect(() => {
    const timer = setTimeout(() => setShowBottomList(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map',
    googleMapsApiKey: apiKey,
    libraries: GMAPS_LIBRARIES,
  });

  // DB 데이터 기반 필터링 및 이름 보정
  const cityList = useMemo<Place[]>(() => {
    const nameUpdates: Record<number, string> = {
      52: "파리의 에펠탑",
      64: "런던의 빅 벤",
      98: "니스의 해변",
      113: "에든버러의 성"
    };

    const targetIds = Object.keys(nameUpdates).map(Number);

    return placeList
      .filter((place) => targetIds.includes(place.id))
      .map((place) => ({
        ...place,
        name: nameUpdates[place.id] || place.name,
        imgUrl: place.imgUrl 
      }));
  }, [placeList]);

  const handleMarkerClick = useCallback((id: number, lat: number, lng: number) => {
    const routes: Record<number, string> = {
      52: '/paris', 64: '/london', 98: '/nice', 113: '/edinburgh'
    };
    const path = routes[id];
    
    if (mapRef.current) {
      mapRef.current.panTo({ lat, lng });
      mapRef.current.setZoom(10);
    }

    if (path) {
      setTimeout(() => router.push(path), 300);
    }
  }, [router]);

  if (loadError) return <div className="p-10">지도를 불러오는 중 오류가 발생했습니다.</div>;
  if (!isLoaded || loading) return <div className="p-10">지도를 준비 중입니다…</div>;

  return (
    <div id='post-main'>
      <div className="vh-screen" style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 'calc(64px + max(1rem, env(safe-area-inset-bottom)))' }}>
          <div className="safe-padded" style={{ flex: 1 }}>
            <GoogleMap
              onLoad={(map) => { mapRef.current = map; }}
              mapContainerStyle={{ width: '100%', height: '60vh' }}
              center={{ lat: 49.889, lng: 2.584 }}
              zoom={4.5}
              options={{
                disableDefaultUI: true,
                gestureHandling: 'greedy',
              }}
            >
              {cityList.map((p) => (
                <OverlayView
                  key={p.id}
                  position={{ lat: p.lat, lng: p.lng }}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  {/* --- DB 이미지 기반 커스텀 마커 --- */}
                  <div
                    className="custom-marker-container"
                    onClick={() => handleMarkerClick(p.id, p.lat, p.lng)}
                  >
                    <div className="marker-photo-circle">
                      <img
                        src={p.imgUrl || "/api/placeholder/100/100"} 
                        alt={p.name}
                        onError={(e) => {
                          // 이미지 로딩 실패 시 기본 이미지 처리
                          (e.target as HTMLImageElement).src = "/api/placeholder/100/100";
                        }}
                      />
                    </div>
                    <div className="marker-name-tag">
                      {p.name.split("의")[0]}
                    </div>
                  </div>
                </OverlayView>
              ))}
            </GoogleMap>

            {showBottomList && (
              <BottomSheetMain
                placeList={cityList}
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                title="각 도시의 대표장소"
                peekHeight='32vh'
                halfHeight='50vh'
                fullHeight='91vh'
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}