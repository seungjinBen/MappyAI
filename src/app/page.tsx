"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import Header from '@/components/Main/Header';
import BottomSheetMain from '@/components/Main/BottomSheetMain';
import { useRouter } from 'next/navigation';
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { useData } from '@/context/DataContext';

import '@/css/PostParis.css'; 

interface Place {
    id: number;
    lat: number;
    lng: number;
    name: string;
    imgUrl?: string;
}

const apiKey = process.env.NEXT_PUBLIC_GMAPS_KEY as string;
const GMAPS_LIBRARIES: ("places" | "geometry" | "drawing" | "visualization")[] = ['places'];

const INITIAL_CENTER = { lat: 51.089, lng: 3.484 };
const INITIAL_ZOOM = 4.5;
const MAP_OPTIONS = {
    disableDefaultUI: true,
    gestureHandling: 'greedy',
};

export default function PostMain() {
    const router = useRouter();
    const mapRef = useRef<google.maps.Map | null>(null);
    const [open, setOpen] = useState(false);
    const [showBottomList, setShowBottomList] = useState(false);

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

    const cityList = useMemo<Place[]>(() => {
        const nameUpdates: Record<number, string> = {
            52: "파리의 에펠탑",
            64: "런던의 빅 벤",
            96: "니스의 캐슬힐 전망대",
            108: "에든버러의 로얄 마일"
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
            52: '/paris', 64: '/london', 96: '/nice', 108: '/edinburgh'
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

    const renderedMarkers = useMemo(() => {
        return cityList.map((p) => (
            <OverlayView
                key={p.id}
                position={{ lat: p.lat, lng: p.lng }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
                <div
                    className="custom-marker-container"
                    onClick={() => handleMarkerClick(p.id, p.lat, p.lng)}
                >
                    <div className="marker-photo-circle">
                        <img
                            src={p.imgUrl || "/api/placeholder/100/100"} 
                            alt={p.name}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "/api/placeholder/100/100";
                            }}
                        />
                    </div>
                    <div className="marker-name-tag">
                        {p.name.split("의")[0]}
                    </div>
                </div>
            </OverlayView>
        ));
    }, [cityList, handleMarkerClick]);

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
                            mapContainerStyle={{ width: '100%', height: '65vh' }}
                            center={INITIAL_CENTER}
                            zoom={INITIAL_ZOOM}
                            options={MAP_OPTIONS}
                        >
                            {renderedMarkers}
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