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
  stage?: number;
}

interface Conversation {
  id: number;
  placeId: number;
  koreanText1: string;
  englishText1: string;
  type?: string;
  isSaved?: boolean;
}

const TARGET_IDS = [1,3,5,6,8,9,12,14,15,17,19,21,22,24,25,27,34,35,37,51,52];
const GMAPS_LIBRARIES: ("places" | "geometry" | "drawing" | "visualization")[] = ['places'];
const DEFAULT_CENTER = { lat: 48.8624, lng: 2.3245 };
const DEFAULT_ZOOM = 12.8;

export default function ParisPage() {
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

  const [clearedPlaceIds, setClearedPlaceIds] = useState<number[]>([]);

  // 1. 클리어한 미션 데이터 로딩
  useEffect(() => {
    try {
      const progressData = JSON.parse(localStorage.getItem('mappy_progress') || '{}');
      const londonCleared = Object.keys(progressData)
        .map(Number)
        .filter(id => TARGET_IDS.includes(id) && progressData[id].length > 0);
      
      setClearedPlaceIds(londonCleared);
    } catch (e) {
      console.error("진행도 로드 실패:", e);
    }
  }, []);

  const filteredPlaces = useMemo(() => {
    return placeList.filter(
      (p) => p.cityId === 1 && TARGET_IDS.includes(Number(p.id))
    );
  }, [placeList]);

  const currentStage = useMemo(() => {
    if (filteredPlaces.length === 0) return 1;

    let stageToUnlock = 1;
    const maxStage = Math.max(...filteredPlaces.map(p => p.stage || 1), 1);

    for (let s = 1; s < maxStage; s++) {
      const placesInThisStage = filteredPlaces.filter(p => (p.stage || 1) === s);
      const isAllCleared = placesInThisStage.every(p => clearedPlaceIds.includes(p.id));

      if (isAllCleared) {
        stageToUnlock = s + 1;
      } else {
        break; 
      }
    }
    
    return stageToUnlock;
  }, [filteredPlaces, clearedPlaceIds]);

  useEffect(() => {
    const timer = setTimeout(() => setShowBottomList(true), 300);
    return () => clearTimeout(timer);
  }, []);

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

  const handleMarkerClick = useCallback((p: Place, isLocked: boolean) => {
    if (isLocked) {
      alert(`이전 장소들의 미션을 먼저 모두 완료해 잠금을 해제하세요! 🗝️`);
      return;
    }
    setSelectedPlace(p);
    panTo(p.lat, p.lng);
    router.push(`/london/${p.id}`, { scroll: false });
    setOpen(true);
  }, [router, panTo]);

  const handleMapClick = useCallback(() => {
    setSelectedPlace(null);
    router.push('/london', { scroll: false });
    panTo(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng, DEFAULT_ZOOM);
    setOpen(false);
  }, [router, panTo]);

  const renderMarkers = useMemo(() => {
    return filteredPlaces.map((p) => {
      
      const isCleared = clearedPlaceIds.includes(p.id);
      const placeStage = p.stage || 1; 
      
      // 내 현재 해금 레벨보다 장소 요구 레벨이 높으면 잠김!
      const isLocked = placeStage > currentStage; 

      let markerClass = "custom-marker-container";
      if (isLocked) markerClass += " locked";
      else if (isCleared) markerClass += " cleared";

      return (
        <OverlayView
          key={p.id}
          position={{ lat: p.lat, lng: p.lng }}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          getPixelPositionOffset={(width, height) => ({
            x: -(width / 2),
            y: -(height / 2),
          })}
        >
          <div
            className={markerClass}
            onClick={(e) => {
              e.stopPropagation();
              handleMarkerClick(p, isLocked);
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
      );
    });
  }, [filteredPlaces, selectedPlace?.id, handleMarkerClick, clearedPlaceIds, currentStage]);

  if (loadError) return <div className="p-10">지도를 불러오지 못했습니다.</div>;
  if (!isLoaded || loading) return <div className="p-10">파리로 여행을 떠나는 중...</div>;

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
                  title={
                    <div className="sheet-title-wrapper">
                      파리 <span className="sheet-title-en">Paris</span>
                    </div>
                  }
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