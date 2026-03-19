"use client";

import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { Bot, Save, Loader2, ArrowLeft, MapPin } from 'lucide-react';

interface Place {
    id: number;
    name: string;
    category?: string;
}

interface GeneratedLine {
    englishText: string;
    koreanText: string;
    audioUrl?: string;
}

export default function AdminConversationGenerator() {
    // 1. 장소 리스트 상태
    const [places, setPlaces] = useState<Place[]>([]);
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    const [loadingPlaces, setLoadingPlaces] = useState(true);

    // 2. 설정 폼 상태
    const [step, setStep] = useState<number>(1); 
    const [convType, setConvType] = useState<'A' | 'B'>('A'); 
    const [category, setCategory] = useState<string>(''); // AI가 지어준 주제를 담을 상태
    
    // 3. AI 생성 결과 상태
    const [generatedLines, setGeneratedLines] = useState<GeneratedLine[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const checkAdmin = () => {
            try {
                const token = localStorage.getItem('token');
                
                if (!token) {
                    alert("로그인이 필요합니다.");
                    router.push('/login');
                    return;
                }

                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.role !== 'ROLE_ADMIN') {
                    alert("관리자만 접근 가능한 페이지입니다.");
                    router.push('/');
                    return;
                }

                setIsAuthorized(true);
            } catch (error) {
                alert("비정상적인 접근입니다.");
                router.push('/');
            }
        };

        checkAdmin();
    }, [router]);

    // 1. 장소 리스트 불러오기 (ID 순서대로 예쁘게 정렬!)
    useEffect(() => {
        const fetchPlaces = async () => {
            try {
                const res = await api.get('/places');
                // id 오름차순(1, 2, 3...)으로 정렬
                const sortedPlaces = res.data.sort((a: Place, b: Place) => a.id - b.id);
                setPlaces(sortedPlaces);
            } catch (error) {
                console.error("장소 목록 로드 실패:", error);
                alert("장소 목록을 불러오지 못했습니다.");
            } finally {
                setLoadingPlaces(false);
            }
        };
        fetchPlaces();
    }, []);

    if (!isAuthorized) return null;

    // 2. AI에게 대화 생성 요청하기
    const handleGenerateAI = async () => {
        if (!selectedPlace) return;
        
        setIsGenerating(true);

        try {
            const response = await api.post('/ai/generate', { 
                placeName: selectedPlace.name, 
                type: convType 
            });

            let aiData = response.data;
            
            // 방어막 1: 마크다운 찌꺼기 제거 및 안전하게 파싱
            if (typeof aiData === 'string') {
                aiData = aiData.replace(/```json/gi, '').replace(/```/gi, '').trim();
                aiData = JSON.parse(aiData);
            }

            // 방어막 2: AI가 대소문자를 틀리거나 배열로 보냈을 때를 대비
            const generatedCategory = aiData.category || aiData.Category || "주제를 생성하지 못했습니다.";
            const generatedLinesArray = aiData.lines || aiData.Lines || (Array.isArray(aiData) ? aiData : []);

            if (generatedLinesArray.length === 0) {
                alert("AI가 대화 문장을 만들어주지 않았습니다. 콘솔 창을 확인해주세요!");
            } else {
                setCategory(generatedCategory);
                setGeneratedLines(generatedLinesArray);
            }

        } catch (error: any) {
            console.error("AI 생성 실패:", error);
            alert(`에러 발생! 백엔드가 꺼져있거나 통신에 실패했습니다.`);
        } finally {
            setIsGenerating(false);
        }
    };

    // 3. DB에 저장하기 (카테고리 포함)
    const handleSaveToDB = async () => {
        if (!selectedPlace || generatedLines.length === 0) return;
        setIsSaving(true);

        const payload = {
            placeId: selectedPlace.id,
            type: convType,
            step: step, 
            category: category, // 새로 추가된 카테고리 데이터 발사!
            lines: generatedLines.map((line, index) => ({
                lineOrder: index + 1,
                englishText: line.englishText,
                koreanText: line.koreanText,
                audioUrl: line.audioUrl || ""
            }))
        };

        try {
            await api.post('/conversations', payload);
            alert(`${selectedPlace.name}의 대화가 성공적으로 저장되었습니다!`);
            
            setGeneratedLines([]);
            setCategory('');
            setSelectedPlace(null);
        } catch (error) {
            console.error("DB 저장 실패:", error);
            alert("저장에 실패했습니다. 관리자에게 문의하세요.");
        } finally {
            setIsSaving(false);
        }
    };

    // ==========================================
    // 화면 1: 장소 선택 리스트 화면
    // ==========================================
    if (!selectedPlace) {
        return (
            <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>🤖 AI 대화 생성기</h1>
                <p style={{ color: '#6B7280', marginBottom: '24px' }}>대화를 추가할 장소를 먼저 선택해주세요.</p>

                {loadingPlaces ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280' }}>
                        <Loader2 className="animate-spin" /> 장소 목록을 불러오는 중...
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {places.map(place => (
                            <button 
                                key={place.id}
                                onClick={() => setSelectedPlace(place)}
                                style={{ 
                                    display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', 
                                    backgroundColor: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '12px',
                                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.borderColor = '#10B981'}
                                onMouseOut={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
                            >
                                <div style={{ backgroundColor: '#E8F5E9', padding: '10px', borderRadius: '50%' }}>
                                    <MapPin size={20} color="#10B981" />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#111827' }}>{place.name}</div>
                                    <div style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '4px' }}>Place ID: {place.id}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ==========================================
    // 화면 2: AI 생성 및 폼 수정 화면
    // ==========================================
    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
            <button 
                onClick={() => setSelectedPlace(null)}
                style={{ background: 'none', border: 'none', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '0 0 20px 0', fontSize: '15px' }}
            >
                <ArrowLeft size={18} /> 장소 목록으로 돌아가기
            </button>

            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#10B981' }}>{selectedPlace.name}</span> 대화 생성
            </h1>

            {/* --- 설정 폼 --- */}
            <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>단계 설정</label>
                        <select 
                            value={step} 
                            onChange={(e) => setStep(Number(e.target.value))}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
                        >
                            <option value={1}>1단계 대화</option>
                            <option value={2}>2단계 대화</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>시작 화자 (타입)</label>
                        <select 
                            value={convType} 
                            onChange={(e) => setConvType(e.target.value as 'A' | 'B')}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
                        >
                            <option value="A">타입 A (관광객인 내가 먼저 시작)</option>
                            <option value="B">타입 B (현지인 직원이 먼저 시작)</option>
                        </select>
                    </div>
                </div>

                <button 
                    onClick={handleGenerateAI} 
                    disabled={isGenerating}
                    style={{ 
                        width: '100%', padding: '14px', backgroundColor: '#10B981', color: 'white', 
                        borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        cursor: isGenerating ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s'
                    }}
                >
                    {isGenerating ? <Loader2 className="animate-spin" /> : <Bot />}
                    {isGenerating ? "AI가 대화를 작성하고 있습니다... (약 10초 대기)" : "AI 텍스트 생성하기"}
                </button>
            </div>

            {/* --- 생성된 결과 확인 및 수정 영역 --- */}
            {generatedLines?.length > 0 && (
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#111827' }}>📝 대화 미리보기 및 수정</h2>
                    
                    {/*  AI가 지어준 학습 주제(Category) 확인 및 수정 칸 */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px', color: '#4B5563' }}>
                            🎯 이 대화의 학습 주제 (Category)
                        </label>
                        <input 
                            type="text" 
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', outlineColor: '#10B981', backgroundColor: '#F9FAFB', fontWeight: 'bold' }}
                            placeholder="예: 크루아상 주문하기, 수량 말하기"
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                        {generatedLines.map((line, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <div style={{ 
                                    width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E8F5E9', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#10B981', flexShrink: 0, marginTop: '4px'
                                }}>
                                    {idx + 1}
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <input 
                                        type="text" 
                                        value={line.englishText}
                                        onChange={(e) => {
                                            const newLines = [...generatedLines];
                                            newLines[idx].englishText = e.target.value;
                                            setGeneratedLines(newLines);
                                        }}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontWeight: 'bold', outlineColor: '#10B981' }} 
                                        placeholder="영어 문장"
                                    />
                                    <input 
                                        type="text" 
                                        value={line.koreanText}
                                        onChange={(e) => {
                                            const newLines = [...generatedLines];
                                            newLines[idx].koreanText = e.target.value;
                                            setGeneratedLines(newLines);
                                        }}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', color: '#4B5563', outlineColor: '#10B981' }} 
                                        placeholder="한국어 번역"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={handleSaveToDB} 
                        disabled={isSaving}
                        style={{ 
                            width: '100%', padding: '14px', backgroundColor: '#3B82F6', color: 'white', 
                            borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            cursor: isSaving ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                        {isSaving ? "DB에 저장하는 중..." : "확인 완료, DB에 저장하기"}
                    </button>
                </div>
            )}
        </div>
    );
}