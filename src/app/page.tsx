"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import Header from '@/components/Main/Header';
import BottomSheetMain from '@/components/Main/BottomSheetMain';
import PermissionModal from '@/components/Main/PermissionModal';
import { useRouter } from 'next/navigation';
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { useData } from '@/context/DataContext';
import { checkInAppBrowser } from '@/lib/utils';
import api from '@/lib/axios';
import { Send, Loader2, CheckCircle2, MapPin } from 'lucide-react';
import '@/css/PostParis.css'; 

interface Place {
    id: number;
    lat: number;
    lng: number;
    name: string;
    imgUrl?: string;
    stage?: number;
    englishText?: string;
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
    const [showPermissionModal, setShowPermissionModal] = useState(false);

    const context = useData();
    const placeList = (context?.placeList as Place[]) || [];
    const loading = context?.loading || false;

    // 온보딩 관련 상태 관리
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3>(1); // 1: 입력, 2: 채점중, 3: 결과
    const [onboardingInput, setOnboardingInput] = useState('');
    const [onboardingResult, setOnboardingResult] = useState<{ score: number, feedback: string } | null>(null);

    const closePermissionModal = useCallback(() => {
        setShowPermissionModal(false);
        sessionStorage.setItem('mappy_mic_modal_closed', 'true');
    }, []);

    // 초기 진입 로직 수정
    useEffect(() => {
        const { isInApp, isAndroid } = checkInAppBrowser();

        if (isInApp && isAndroid) {
            const url = window.location.href.replace(/https?:\/\//, "");
            window.location.href = `intent://${url}#Intent;scheme=https;package=com.android.chrome;end`;
            return; 
        }

        const checkMicPermission = async () => {
            if (sessionStorage.getItem('mappy_mic_modal_closed')) return;
            try {
                if (navigator.permissions && navigator.permissions.query) {
                    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
                    if (result.state === 'prompt' || result.state === 'denied' || isInApp) {
                        setShowPermissionModal(true);
                    }
                } else {
                    setShowPermissionModal(true);
                }
            } catch (error) {
                setShowPermissionModal(true);
            }
        };

        // 로컬 스토리지에서 온보딩 완료 여부 확인
        const hasDoneOnboarding = localStorage.getItem('mappy_onboarding_done');
        
        if (!hasDoneOnboarding) {
            setTimeout(() => setShowOnboarding(true), 1000);
        } else {
            checkMicPermission();
        }
    }, []);

    const handleOnboardingSubmit = async () => {
        if (!onboardingInput.trim()) return;
        
        setOnboardingStep(2); 

        try {
            const formData = new FormData();
            formData.append('userText', onboardingInput.trim());
            formData.append('targetText', "Can I get an Americano please"); // 온보딩 정답 기준

            const response = await api.post('/stt/evaluate-text', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setOnboardingResult({
                score: response.data.score,
                feedback: response.data.feedback || "의미가 잘 통합니다!"
            });

            setOnboardingStep(3);

        } catch (error) {
            console.error("온보딩 채점 에러:", error);
            // 에러 시 임시 통과 처리 (UX 끊김 방지)
            setOnboardingResult({ score: 100, feedback: "서버 연결이 원활하지 않지만, 훌륭한 시도예요!" });
            setOnboardingStep(3);
        }
    };

    const completeOnboarding = () => {
        localStorage.setItem('mappy_onboarding_done', 'true');
        setShowOnboarding(false);
        setTimeout(() => setShowPermissionModal(true), 500);
    };

    const handlePermissionConfirm = async () => {
        try {
            const unlockAudio = new Audio();
            unlockAudio.play().catch(() => {});
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            closePermissionModal();
        } catch (err) {
            alert("마이크 권한이 거부되었습니다. 설정에서 마이크를 허용해주셔야 원활한 이용이 가능합니다!");
            closePermissionModal();
        }
    };

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
            52: "파리",
            64: "런던",
            96: "니스",
            108: "에든버러"
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
                                title="어디로 떠날까요?"
                                peekHeight='32vh'
                                halfHeight='50vh'
                                fullHeight='91vh'
                            />
                        )}
                    </div>
                </main>
            </div>
            {showOnboarding && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(17, 24, 39, 0.75)', 
                    backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', 
                    alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: '#ffffff', borderRadius: '24px', padding: '32px 24px',
                        width: '100%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        animation: 'fadeInUp 0.5s ease-out'
                    }}>
                        {onboardingStep === 1 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>☕️</div>
                                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', margin: '0 0 8px 0', lineHeight: '1.4' }}>
                                        파리 카페에서 이 한 마디, <br/> 말할 수 있어요? 
                                    </h2>
                                    <p style={{ color: '#6B7280', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
                                        1분이면 충분해요. 실제 상황으로 바로 체험해보세요!
                                    </p>
                                </div>
                                
                                <div style={{ backgroundColor: '#F0FDF4', padding: '16px', borderRadius: '12px', border: '1px solid #DCFCE7' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#10B981', marginBottom: '4px' }}>MISSION</div>
                                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>"아메리카노 하나 주시겠어요?"</div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                    <input 
                                        type="text" 
                                        value={onboardingInput}
                                        onChange={(e) => setOnboardingInput(e.target.value)}
                                        placeholder="영어로 어떻게 말할까요?"
                                        onKeyDown={(e) => e.key === 'Enter' && handleOnboardingSubmit()}
                                        style={{ flex: 1, padding: '14px 16px', borderRadius: '12px', border: '1px solid #E5E7EB', outline: 'none', fontSize: '15px' }}
                                    />
                                    <button 
                                        onClick={handleOnboardingSubmit}
                                        disabled={!onboardingInput.trim()}
                                        style={{ backgroundColor: onboardingInput.trim() ? '#10B981' : '#D1D5DB', color: 'white', border: 'none', borderRadius: '12px', width: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: onboardingInput.trim() ? 'pointer' : 'not-allowed' }}
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {onboardingStep === 2 && (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <Loader2 size={40} color="#10B981" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
                                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0' }}>AI 원어민이 채점 중입니다...</h3>
                                <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>문맥과 의미를 꼼꼼히 살피고 있어요!</p>
                            </div>
                        )}

                        {onboardingStep === 3 && onboardingResult && (
                            <div style={{ textAlign: 'center' }}>
                                <CheckCircle2 size={56} color="#10B981" style={{ margin: '0 auto 16px auto' }} />
                                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#111827', margin: '0 0 8px 0' }}>
                                    {onboardingResult.score >= 70 ? "오, 의미가 완벽해요! 🎉" : "훌륭한 시도였어요! 💪"}
                                </h2>
                                <p style={{ color: '#4B5563', fontSize: '15px', lineHeight: '1.5', margin: '0 0 24px 0', wordBreak: 'keep-all' }}>
                                   [ AI 피드백: {onboardingResult.feedback} ] <br/><br/>
                                    <strong>이 표현, 실제 카페에서 써먹을 수 있어요.</strong>
                                </p>

                                <button 
                                    onClick={completeOnboarding}
                                    style={{ width: '100%', padding: '16px', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                >
                                    <MapPin size={20} /> 지금 파리 지도 탐험하기
                                </button>
                                
                                <button 
                                    onClick={() => {
                                        localStorage.setItem('mappy_onboarding_done', 'true');
                                        setShowOnboarding(false);
                                    }}
                                    style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: '13px', marginTop: '16px', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                    먼저 어떤 곳인지 둘러볼게요
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {showPermissionModal && (
                <PermissionModal 
                    onConfirm={handlePermissionConfirm} 
                    onClose={closePermissionModal}
                />
            )}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}} />
        </div>
    );
}