"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MapPin, PlaneTakeoff, Mic, MessageSquare, Stamp } from 'lucide-react';
import api from '@/lib/axios';

const getCityName = (id: number) => {
    const paris = [1, 3, 5, 6, 8, 9, 12, 14, 15, 17, 19, 21, 22, 24, 25, 27, 34, 35, 37, 51, 52];
    const london = [55, 56, 58, 59, 61, 62, 63, 64, 70, 71, 75, 76, 78, 79, 81, 82];
    const nice = [83, 84, 88, 89, 91, 93, 94, 95, 96, 97];
    const edinburgh = [102, 103, 105, 106, 108, 111, 114, 115, 116, 118];

    if (paris.includes(id)) return 'PARIS';
    if (london.includes(id)) return 'LONDON';
    if (nice.includes(id)) return 'NICE';
    if (edinburgh.includes(id)) return 'EDINBURGH';
    return 'UNKNOWN CITY';
};

export default function SharePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const placeId = searchParams.get('placeId');
    const sharedText = searchParams.get('text');
    
    const [bgImageUrl, setBgImageUrl] = useState('/placeholder.jpg');
    const [cityName, setCityName] = useState('...');
    const [placeName, setPlaceName] = useState('멋진 여행지');

    useEffect(() => {
        if (placeId) {
            setCityName(getCityName(Number(placeId)));

            api.get(`/places/${placeId}`).then(res => {
                if (res.data?.imgUrl) setBgImageUrl(res.data.imgUrl);
                if (res.data?.name) setPlaceName(res.data.name);
            }).catch(e => console.error(e));
        }
    }, [placeId]);

    // 오늘 날짜 포맷팅
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    return (
        <div style={{ 
            backgroundColor: '#E5E7EB',
            minHeight: '100vh', 
            padding: '40px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundImage: 'radial-gradient(#D1D5DB 1px, transparent 1px)',
            backgroundSize: '20px 20px'
        }}>
            
            <div style={{ textAlign: 'center', marginBottom: '24px', animation: 'fadeInDown 0.8s ease' }}>
                <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#374151', letterSpacing: '2px', margin: 0 }}>
                    A TRAVELER'S POSTCARD
                </h1>
                <p style={{ color: '#6B7280', fontSize: '13px', marginTop: '8px' }}>
                    누군가의 여행 기록이 담긴 엽서가 도착했습니다 ✈️
                </p>
            </div>
            
            <div style={{ 
                backgroundColor: '#FFF', 
                width: '100%', maxWidth: '420px', 
                borderRadius: '8px', 
                boxShadow: '0 15px 35px rgba(0,0,0,0.1), 0 5px 15px rgba(0,0,0,0.05)', 
                position: 'relative',
                overflow: 'hidden',
                animation: 'zoomIn 0.8s ease'
            }}>
                <div style={{ position: 'relative', height: '280px', width: '100%' }}>
                    <img src={bgImageUrl} alt={placeName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                <div style={{ padding: '24px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '-15px', left: '20px', color: 'rgba(239, 68, 68, 0.6)', transform: 'rotate(-15deg)', border: '2px solid rgba(239, 68, 68, 0.6)', borderRadius: '50%', padding: '10px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' }}>
                        <div>{cityName}</div>
                        <div>{today}</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6B7280', fontWeight: 'bold', fontSize: '14px', marginTop: '16px', marginBottom: '16px' }}>
                        <MapPin size={18} /> <span>{placeName}에서</span>
                    </div>

                    <div style={{ 
                        backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #E5E7EB 31px, #E5E7EB 32px)',
                        lineHeight: '32px',
                        minHeight: '96px',
                        color: '#374151',
                        fontSize: '16px',
                        fontFamily: "'Nanum Pen Script', 'Comic Sans MS', cursive, sans-serif", // 손글씨 폰트 느낌 (필요시 폰트 조정)
                        letterSpacing: '0.5px'
                    }}>
                        {sharedText || "이곳에서 아주 멋진 하루를 보냈어요!"}
                    </div>
                </div>

                <div style={{ backgroundColor: '#F0FDF4', padding: '20px 24px', borderTop: '1px dashed #A7F3D0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ backgroundColor: '#10B981', color: 'white', padding: '6px', borderRadius: '50%' }}>
                            <Mic size={14} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#065F46' }}>이 장소에서 꼭 필요한 여행 영어는?</span>
                    </div>
                    
                    <div style={{ backgroundColor: '#FFF', padding: '16px', borderRadius: '12px', border: '1px solid #D1FAE5', boxShadow: '0 2px 6px rgba(16, 185, 129, 0.1)', position: 'relative' }}>
                        <div style={{ filter: 'blur(3px)', userSelect: 'none', opacity: 0.7 }}>
                            <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#111827', margin: '0 0 4px 0' }}>"Excuse me, could you take a picture of..."</p>
                            <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>실례하지만, 사진 한 장 찍어주시겠어요?</p>
                        </div>
                        
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <span style={{ backgroundColor: '#111827', color: '#FFF', fontSize: '12px', fontWeight: 'bold', padding: '6px 14px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <MessageSquare size={14} /> 대화 미션 잠김
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style={{ marginTop: '24px', width: '100%', maxWidth: '420px' }}>
                <button 
                    onClick={() => router.push('/')}
                    style={{ 
                        width: '100%', backgroundColor: '#10B981', color: '#fff', padding: '18px', 
                        borderRadius: '16px', fontSize: '16px', fontWeight: '900', border: 'none',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                        cursor: 'pointer', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)', transition: 'transform 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <PlaneTakeoff size={22} /> 
                    영어 대화 연습하고 기록 남기기
                </button>
            </div>
            
            <style jsx>{`
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes zoomIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}