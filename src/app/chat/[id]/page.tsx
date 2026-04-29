"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { X, Volume2, Mic, Share2, Map, MapPin, ChevronRight, Lock, Keyboard, Send } from 'lucide-react';
import api from '@/lib/axios';
import BookmarkButton from '@/components/Main/BookmarkButton';
import '@/css/ChatPage.css';

interface Line {
    lineOrder: number;
    englishText: string;
    koreanText?: string;
    audioUrl?: string;
}

interface Place {
    id: number;
    name: string;
    imgUrl?: string;
    cityId?: number; 
    city_id?: number;
}

interface Conversation {
    id: number;
    type?: 'A' | 'B' | string;
    place?: Place;
    lines?: Line[];
    isSaved?: boolean; 
}

interface ProcessedLine extends Line {
    isMe: boolean;
}

export default function ChatQuestPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    
    const id = params?.id;
    const stepParam = searchParams.get('step');
    const targetConvIndex = stepParam ? parseInt(stepParam, 10) : 0;

    const [place, setPlace] = useState<Place | null>(null);
    const [currentConv, setCurrentConv] = useState<Conversation | null>(null);
    const [lines, setLines] = useState<ProcessedLine[]>([]);
    const [visibleLines, setVisibleLines] = useState<ProcessedLine[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    
    const [showModal, setShowModal] = useState(false); 
    const [isRecording, setIsRecording] = useState(false);
    const [isWaitingForNPC, setIsWaitingForNPC] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showCompletion, setShowCompletion] = useState(false);

    const [sttFeedback, setSttFeedback] = useState<{ score: number, recognizedText: string, feedback?: string } | null>(null);
    const [hintText, setHintText] = useState<string | null>(null);

    const [completedCount, setCompletedCount] = useState<number>(0);
    // 미션 완료 기준 (기존 2개 → 현재 1개. 서비스 확장 시 2로 되돌리면 됨)
    const MISSIONS_TO_COMPLETE = 1;
    const [journalText, setJournalText] = useState<string>('');

    const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
    const [textInput, setTextInput] = useState('');
    const [isEvaluatingText, setIsEvaluatingText] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [hintLevel, setHintLevel] = useState<number>(0);

    const hintLevelRef = useRef<number>(hintLevel);
    useEffect(() => {
        hintLevelRef.current = hintLevel;
    }, [hintLevel]);

    const getCityName = (cityId?: number) => {
        switch (Number(cityId)) {
            case 1: return "파리";
            case 2: return "니스";
            case 3: return "런던";
            case 4: return "에든버러";
            default: return "파리";
        }
    };
    const getCityNameE = (cityId?: number) => {
        switch (Number(cityId)) {
            case 1: return "PARIS";
            case 2: return "NICE";
            case 3: return "LONDON";
            case 4: return "EDINBURGH";
            default: return "PARIS";
        }
    };

    const getCityBasePath = (cityId?: number) => {
        switch (Number(cityId)) {
            case 1: return '/paris';
            case 2: return '/nice';
            case 3: return '/london';
            case 4: return '/edinburgh';
            default: return '/london';
        }
    };

    useEffect(() => {
        setHintLevel(0);
    }, [currentIndex]);

    const preHintText = useMemo(() => {
        if (!lines || lines.length === 0 || currentIndex >= lines.length) return "";
        const currentLine = lines[currentIndex];
        if (!currentLine?.isMe) return "";

        return currentLine.englishText.split(' ').map(word => {
            if (word.replace(/[^a-zA-Z]/g, '').length <= 2) return word; 
            const firstChar = word[0];
            const rest = word.slice(1);
            const maskedRest = rest.replace(/[a-zA-Z]/g, '_');
            return firstChar + maskedRest;
        }).join(' ');
    }, [lines, currentIndex]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1,
                    sampleRate: 16000
                }
             });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());
                await sendAudioToBackend(audioBlob, lines[currentIndex].englishText);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error("마이크 권한 에러:", error);
            alert("마이크 사용 권한을 허용해주세요!");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const toggleRecording = () => {
        if (currentIndex >= lines.length) {
            setShowCompletion(true);
            return;
        }
        if (isWaitingForNPC) return;
        
        const currentLine = lines[currentIndex];
        if (!currentLine.isMe) return; 

        if (isRecording) stopRecording();
        else startRecording();
    };

    // 오디오 전송 로직
    const sendAudioToBackend = async (audioBlob: Blob, targetText: string) => {
        try {
            const formData = new FormData();
            formData.append('audioFile', audioBlob, 'record.webm'); 
            formData.append('targetText', targetText); 
            
            const response = await api.post('/stt/evaluate', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            handleEvaluationResponse(response.data, targetText);
        } catch (error) {
            console.error("오디오 전송 및 채점 실패:", error);
            alert("음성 인식 중 오류가 발생했습니다.");
        }
    };

    // 텍스트 전송 로직
    const handleTextSubmit = async () => {
        if (!textInput.trim() || isEvaluatingText) return;

        setIsEvaluatingText(true);
        const targetText = lines[currentIndex].englishText;

        try {
            // 스프링 부트에 @RequestParam 으로 보내기 위해 FormData 사용
            const formData = new FormData();
            formData.append('userText', textInput.trim());
            formData.append('targetText', targetText);

            const response = await api.post('/stt/evaluate-text', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            handleEvaluationResponse(response.data, targetText);
            
            setTextInput('');
        } catch (error) {
            console.error("텍스트 전송 및 채점 실패:", error);
            alert("텍스트 평가 중 오류가 발생했습니다.");
        } finally {
            setIsEvaluatingText(false);
        }
    };

    const handleEvaluationResponse = (responseData: any, targetText: string) => {
        const { score: originalScore, recognizedText, feedback } = responseData;
        let finalScore = originalScore;

        if (hintLevelRef.current === 1) {
            finalScore = Math.min(originalScore, 90); 
        } else if (hintLevelRef.current === 2) {
            finalScore = Math.min(originalScore, 80); 
        }

        setSttFeedback({ score: finalScore, recognizedText, feedback });

        if (finalScore >= 70) {
            setTimeout(() => {
                setSttFeedback(null);
                setHintText(null); 
                setVisibleLines(prev => [...prev, lines[currentIndex]]);
                setCurrentIndex(prev => prev + 1); 
            }, 4000); 
        } else {
            const words = targetText.split(' ');
            const hideIndexes = [words.length - 1];
            if (words.length > 3) hideIndexes.push(Math.floor(words.length / 2));

            const hintWords = words.map((word, i) => {
                if (hideIndexes.includes(i)) {
                    const firstChar = word.charAt(0);
                    const underscores = '_'.repeat(Math.max(word.length - 1, 3)); 
                    return `${firstChar}${underscores}`;
                }
                return word; 
            });
            
            setHintText(hintWords.join(' '));

            setTimeout(() => {
                setSttFeedback(null);
            }, 4000); 
        }
    };

    const handlePlayAudio = (line: ProcessedLine) => {
        if (line.audioUrl && line.audioUrl.trim() !== '' && line.audioUrl !== 'null') {
            let finalPlayUrl = line.audioUrl;
            if (line.audioUrl.startsWith("gs://")) {
                const bucketName = "mappyproject-5ee09.firebasestorage.app";
                const filePath = line.audioUrl.replace(`gs://${bucketName}/`, "");
                const encodedPath = encodeURIComponent(filePath);
                finalPlayUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`;
            }
            const audio = new Audio(finalPlayUrl);
            audio.play().catch(e => {
                console.error("오디오 재생 실패:", e);
                alert("오디오를 재생할 수 없습니다.");
            });
        } else {
            if (typeof window === 'undefined' || !window.speechSynthesis) return;
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(line.englishText);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    };

    useEffect(() => {
        if (!id) return;
        const fetchChatData = async () => {
            try {
                const [placeRes, convRes] = await Promise.all([
                    api.get(`/places/${id}`).catch(() => ({ data: null })),
                    api.get(`/conversations/place/${id}`)
                ]);

                let fetchedConvs: Conversation[] = convRes.data;
                const token = localStorage.getItem('token');
                if (token) {
                    try {
                        const bookmarkRes = await api.get('/bookmarks/my', {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        const myBookmarkIds = bookmarkRes.data.map((b: any) => b.conversationId || b.id);
                        fetchedConvs = fetchedConvs.map(conv => ({
                            ...conv,
                            isSaved: myBookmarkIds.includes(conv.id)
                        }));
                    } catch (e) {
                        console.warn("북마크 목록 조회 실패", e);
                    }
                }

                if (fetchedConvs && fetchedConvs.length > targetConvIndex) {
                    const activeConv = fetchedConvs[targetConvIndex];
                    setCurrentConv(activeConv);
                    setPlace(placeRes.data || activeConv.place);

                    if (activeConv.lines) {
                        const startSide = String(activeConv.type).toUpperCase() === 'A' ? 'me' : 'other';
                        const processed = [...activeConv.lines]
                            .sort((a, b) => a.lineOrder - b.lineOrder)
                            .map(line => {
                                const isMe = (line.lineOrder % 2 === 1) ? (startSide === 'me') : (startSide !== 'me');
                                return { ...line, isMe };
                            });
                        setLines(processed);
                    }
                }
            } catch (error) {
                console.error("데이터 로드 실패:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchChatData();
    }, [id, targetConvIndex]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [visibleLines, isWaitingForNPC, sttFeedback]); // 피드백 팝업이 뜰 때도 스크롤 조정

    useEffect(() => {
        if (showModal || lines.length === 0 || currentIndex >= lines.length) return;
        const currentLine = lines[currentIndex];
        
        if (!currentLine.isMe) {
            setIsWaitingForNPC(true);
            const timer = setTimeout(() => {
                setVisibleLines(prev => [...prev, currentLine]);
                setCurrentIndex(prev => prev + 1);
                setIsWaitingForNPC(false);
            }, 1500); 
            return () => clearTimeout(timer);
        }
    }, [currentIndex, lines, showModal]);

    useEffect(() => {
        if (!lines || currentIndex >= lines.length) return;
        const currentLine = lines[currentIndex];
        if (!currentLine.isMe) {
            const timer = setTimeout(() => {
                handlePlayAudio(currentLine);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, lines]);

    useEffect(() => {
        if (showCompletion && currentConv && place) {
            const saveProgress = async () => {
                const token = localStorage.getItem('token');
                let count = 0;

                try {
                    const progressData = JSON.parse(localStorage.getItem('mappy_progress') || '{}');
                    if (!progressData[place.id]) progressData[place.id] = [];
                    
                    if (!progressData[place.id].includes(currentConv.id)) {
                        progressData[place.id].push(currentConv.id);
                        localStorage.setItem('mappy_progress', JSON.stringify(progressData));
                    }
                    count = progressData[place.id].length;
                    setCompletedCount(count);

                } catch (e) {
                    console.error("로컬 스토리지 저장 실패:", e);
                }

                if (token) {
                    try {
                        await api.post('/missions/complete', {
                            placeId: place.id,
                            conversationId: currentConv.id
                        }, { headers: { Authorization: `Bearer ${token}` } });
                    } catch (error) {
                        console.error("서버 저장 실패:", error);
                    }
                }
            };
            saveProgress();
        }
    }, [showCompletion, currentConv, place]);

    const hints = useMemo(() => {
        if (lines.length === 0 || currentIndex >= lines.length) return [];
        const currentLine = lines[currentIndex];
        if (!currentLine.isMe) return [];
        const words = currentLine.englishText.replace(/[^a-zA-Z\s]/g, "").split(" ").filter(w => w.length > 3);
        return words.slice(0, 2).map(w => `#${w.toLowerCase()}`);
    }, [lines, currentIndex]);

    if (loading) return <div className="chat-loading">대화를 준비 중입니다...</div>;
    if (lines.length === 0) return <div className="chat-loading">해당 단계에 등록된 회화 문장이 없습니다.</div>;

    const totalSteps = lines.length;
    const progressPercent = totalSteps > 0 ? (currentIndex / totalSteps) * 100 : 0;
    const isMissionComplete = totalSteps > 0 && currentIndex >= totalSteps;
    const currentLine = lines[currentIndex];
    const bgImageUrl = place?.imgUrl || 'https://images.unsplash.com/photo-1513635269975-5969336ac1cb?q=80&w=1000&auto=format&fit=crop';

    if (showCompletion) {
        const cityName = getCityName(place?.cityId || place?.city_id);
        const cityNameE = getCityNameE(place?.cityId || place?.city_id);
        const defaultPlaceholder = `${cityName}의 첫 인상은 참 강렬하다. 따스한 햇살 아래, ${place?.name}에서 현지인과의 대화는 두려움보다 설렘으로 가득했다.`;
        const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

        const handleShare = async () => {
            const textToShare = journalText.trim() !== '' ? journalText : defaultPlaceholder;
            const encodedText = encodeURIComponent(textToShare);
            const placeId = place?.id || place?.city_id;
            const shareUrl = `${window.location.origin}/share?placeId=${placeId}&text=${encodedText}`;

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'Mappy English 여행 기록',
                        url: shareUrl, 
                    });
                } catch (error) {
                    console.log('공유 취소됨');
                }
            } else {
                navigator.clipboard.writeText(`[Mappy English 여행 기록]\n\n${textToShare}\n\n구경하러 가기: ${shareUrl}`);
                alert(`[클립보드에 복사되었습니다]\n\n이제 SNS나 메신저에 붙여넣기 해보세요!`);
            }
        };

        return (
            <div className="completion-wrapper">
                <div className="completion-header">
                    <p className="completion-saved-text">여행 기억 저장됨</p>
                    <h1 className="story-main-title">
                        {cityName}에서의<br />
                        <span className="story-highlight">한 장면</span>
                    </h1>
                    <p className="story-sub-title">이 대화가 당신의 여행이 됩니다</p>
                </div>
                <div className="postcard-card">
                    <div className="postcard-img-area">
                        <img src={bgImageUrl} alt={place?.name} />
                    </div>
                    <div className="postcard-content-area">
                    <div style={{ position: 'absolute', top: '-15px', left: '20px', color: 'rgba(239, 68, 68, 0.6)', transform: 'rotate(-15deg)', border: '2px solid rgba(239, 68, 68, 0.6)', borderRadius: '50%', padding: '10px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' }}>
                        <div>{cityNameE}</div>
                        <div>{today}</div>
                    </div>
                        <div className="postcard-place-info">
                            <MapPin size={18} /> <span>{place?.name}에서</span>
                        </div>
                        {completedCount < MISSIONS_TO_COMPLETE ? (
                            <div className="postcard-locked-wrapper">
                                <div className="postcard-text-area postcard-blur-text">
                                    {defaultPlaceholder}
                                </div>
                                <div className="postcard-lock-overlay">
                                    <div className="lock-badge">
                                        <Lock size={15} /> 미션 {MISSIONS_TO_COMPLETE}개 완료 시 기록 작성 가능!
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <textarea 
                                className="postcard-text-area"
                                value={journalText}
                                onChange={(e) => setJournalText(e.target.value)}
                                placeholder={defaultPlaceholder + " 자유롭게 기록을 남겨보세요!"}
                            />
                        )}
                    </div>
                </div>
                <div className="completion-actions">
                    {completedCount >= MISSIONS_TO_COMPLETE ? (
                        <button className="btn-primary" onClick={handleShare}>
                            <Share2 size={20} /> 여행 기록 공유하기
                        </button>
                    ) : (
                        <button className="btn-primary" onClick={() => router.back()}>
                            ✨ {MISSIONS_TO_COMPLETE}개 더 완료하고 엽서 기록 열기
                        </button>
                    )}
                    <button className="btn-secondary" onClick={() => router.push(getCityBasePath(place?.cityId || place?.city_id))}>
                        <Map size={20} /> 지도로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-quest-wrapper">
            <header className="chat-header">
                <button className="close-btn" onClick={() => router.back()}>
                    <X size={24} color="#9CA3AF" />
                </button>
                <div className="step-indicator">
                    {totalSteps > 0 ? `${place?.name || 'STEP'} · ${Math.min(currentIndex + 1, totalSteps)} / ${totalSteps}` : 'STEP'}
                </div>
                
                <div className="header-right-action">
                    {currentConv && (
                        <BookmarkButton 
                            conversationId={currentConv.id} 
                            initialIsSaved={currentConv.isSaved || false} 
                        />
                    )}
                </div>
            </header>
            
            <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
            </div>

            <main className="chat-scroll-area">
                {visibleLines.map((line, idx) => {
                    const senderClass = line.isMe ? 'user' : 'npc';
                    return (
                        <div key={idx} className={`chat-message-row ${senderClass}`}>
                            {!line.isMe && <div className="avatar-circle">P</div>}
                            <div className="chat-bubble-container">
                                <div className={`chat-bubble ${senderClass}`}>
                                    <p className="chat-main-text">{line.englishText}</p>
                                    {line.koreanText && <p className="chat-sub-text">{line.koreanText}</p>}
                                </div>
                                <button className="listen-btn" onClick={() => handlePlayAudio(line)}>
                                    <Volume2 size={16} /> 원어민 발음 듣기
                                </button>
                            </div>
                        </div>
                    );
                })}

                {!isMissionComplete && currentLine?.isMe && !showModal && (
                    <div className="mission-card">
                        <div className="mission-label">이렇게 이어가보세요</div>
                        <h3 className="mission-title">{currentLine.koreanText}</h3>

                        {hintLevel === 0 && (
                            <button 
                                onClick={() => setHintLevel(1)}
                                style={{
                                    marginTop: '16px', padding: '8px 16px', fontSize: '13px', fontWeight: '600',
                                    color: '#6B7280', backgroundColor: '#F3F4F6', border: 'none', borderRadius: '20px', 
                                    cursor: 'pointer', transition: 'all 0.2s', display: 'inline-block'
                                }}
                            >
                                💡 어떻게 말할지 막막하다면? (초성 힌트)
                            </button>
                        )}

                        {hintLevel >= 1 && (
                            <div style={{
                                marginTop: '16px', padding: '12px', backgroundColor: '#F8FAFC', 
                                border: '1px solid #E2E8F0', borderRadius: '8px', color: '#475569', 
                                fontSize: '17px', fontWeight: '600', letterSpacing: '1px', wordSpacing: '2px',
                                position: 'relative'
                            }}>
                                {hintLevel === 1 ? preHintText : currentLine.englishText}
                                
                                {hintLevel === 2 && (
                                    <span style={{
                                        position: 'absolute', top: '-10px', right: '-10px',
                                        backgroundColor: '#EF4444', color: 'white', fontSize: '10px',
                                        fontWeight: 'bold', padding: '4px 8px', borderRadius: '12px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}>
                                        최대 80점
                                    </span>
                                )}
                            </div>
                        )}

                        {hintLevel === 1 && (
                            <button 
                                onClick={() => setHintLevel(2)}
                                style={{
                                    marginTop: '12px', padding: '8px 16px', fontSize: '13px', fontWeight: '600',
                                    color: '#EF4444', backgroundColor: '#FEE2E2', border: 'none', borderRadius: '20px', 
                                    cursor: 'pointer', transition: 'all 0.2s', display: 'inline-block'
                                }}
                            >
                                😢 그래도 모르겠어요 (정답 보기)
                            </button>
                        )}
                        
                        {hintText && hintLevel < 2 && (
                            <div style={{
                                marginTop: '16px', padding: '14px', backgroundColor: '#FFFBEB', borderRadius: '8px', 
                                border: '1px dashed #FCD34D', color: '#B45309', textAlign: 'center', transition: 'all 0.3s ease'
                            }}>
                                <div style={{ fontSize: '12px', fontWeight: '900', marginBottom: '6px', opacity: 0.8 }}>🚨 다시 한번 도전!</div>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.5px', wordBreak: 'keep-all', lineHeight: '1.4' }}>
                                    {hintText}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {!isMissionComplete && !currentLine?.isMe && isWaitingForNPC && (
                    <div className="mission-card" style={{ backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}>
                        <h3 className="mission-title" style={{ color: '#9CA3AF', fontSize: '15px' }}>
                            상대방이 말하는 중입니다...
                        </h3>
                    </div>
                )}
                
                {isMissionComplete && totalSteps > 0 && (
                    <div className="mission-complete-card">
                        🎉 완벽해요! 이제 이 장소가 익숙해졌을 거예요.
                    </div>
                )}
                
                <div ref={messagesEndRef} style={{ height: '40px' }} />
            </main>

            {sttFeedback && (
                <div className="stt-feedback-toast" style={{
                    position: 'absolute', bottom: '160px', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: sttFeedback.score >= 70 ? '#10B981' : '#EF4444', 
                    color: 'white', padding: '16px 20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 100, width: '90%', textAlign: 'center', transition: 'all 0.3s ease'
                }}>
                    <div style={{ fontSize: '24px', fontWeight: '900', marginBottom: '8px', letterSpacing: '1px' }}>
                        {sttFeedback.score}점
                    </div>
                    
                    <div style={{ fontSize: '15px', fontWeight: '600', opacity: 0.95, lineHeight: '1.4', wordBreak: 'keep-all', marginBottom: '12px' }}>
                        {sttFeedback.feedback 
                            ? `💡 ${sttFeedback.feedback}` 
                            : (sttFeedback.score >= 70 ? '🎉 훌륭합니다! 다음 대화로 넘어갑니다.' : '💪 아쉬워요! 다시 한번 크게 말해보세요.')
                        }
                    </div>
                    
                    <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', fontSize: '13px', lineHeight: '1.3' }}>
                        <span style={{ display: 'block', marginBottom: '4px', opacity: 0.8, fontSize: '11px', fontWeight: 'bold' }}>AI가 들은 문장</span>
                        "{sttFeedback.recognizedText}"
                    </div>
                </div>
            )}  

            <div className="chat-bottom-sheet">
                <div className="bottom-sheet-controls">
                    <div className="hints-row">
                        {hints.map((hint, i) => (
                            <span key={i} className="hint-chip">{hint}</span>
                        ))}
                    </div>
                    
                    {!isMissionComplete && currentLine?.isMe && (
                        <button 
                            onClick={() => setInputMode(prev => prev === 'voice' ? 'text' : 'voice')}
                            style={{ 
                                background: 'transparent', border: 'none', color: '#6B7280', 
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 'bold' 
                            }}
                        >
                            {inputMode === 'voice' ? <Keyboard size={18} /> : <Mic size={18} />}
                            {inputMode === 'voice' ? '직접 입력하기' : '마이크로 말하기'}
                        </button>
                    )}
                </div>
                
                {inputMode === 'voice' || isMissionComplete || !currentLine?.isMe ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <button 
                            className={`mic-btn ${isRecording ? 'recording' : ''}`}
                            onClick={toggleRecording}
                            disabled={(!isMissionComplete && !currentLine?.isMe) || isWaitingForNPC || showModal}
                            style={{ opacity: (!currentLine?.isMe && !isMissionComplete) ? 0.5 : 1 }}
                        >
                            {isMissionComplete ? <ChevronRight size={38} color="#fff" /> : <Mic size={36} color="#fff" />}
                        </button>
                        
                        <p className="mic-instruction">
                            {isMissionComplete ? "오늘의 대화를 기억하고 다음 장소로" : 
                             isRecording ? "듣고 있습니다..." : 
                             (currentLine?.isMe ? "마이크를 눌러 영어로 말해보세요" : "상대방의 말을 들어보세요")}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
                        <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder={isEvaluatingText ? "AI가 채점 중입니다..." : "영어로 문장을 입력해보세요"}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleTextSubmit(); }}
                            disabled={(!isMissionComplete && !currentLine?.isMe) || isWaitingForNPC || showModal || isEvaluatingText}
                            style={{
                                flex: 1, padding: '14px 20px', borderRadius: '24px', border: '1px solid #E5E7EB',
                                outline: 'none', fontSize: '16px', backgroundColor: isEvaluatingText ? '#F3F4F6' : '#FFFFFF'
                            }}
                        />
                        <button
                            onClick={handleTextSubmit}
                            disabled={!textInput.trim() || isEvaluatingText}
                            style={{ 
                                backgroundColor: (!textInput.trim() || isEvaluatingText) ? '#D1D5DB' : '#10B981', 
                                color: 'white', width: '48px', height: '48px', borderRadius: '50%', border: 'none', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (!textInput.trim() || isEvaluatingText) ? 'not-allowed' : 'pointer', transition: 'all 0.2s' 
                            }}
                        >
                            <Send size={20}/>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}