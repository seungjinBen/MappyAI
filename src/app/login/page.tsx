"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle2, Mail, Lock } from 'lucide-react'; // 아이콘 추가
import api from '@/lib/axios';
import '@/css/LoginPage.css';

export default function LoginPage() {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [countdown, setCountdown] = useState<number>(3);

    const { isLoggedIn, login } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoggedIn) {
            if (countdown > 0) {
                const timer = setInterval(() => {
                    setCountdown((prev) => prev - 1);
                }, 1000);
                return () => clearInterval(timer);
            } else {
                router.push('/');
            }
        }
    }, [isLoggedIn, countdown, router]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const isSuccess = await login(email, password);
        if (isSuccess) {
            // 로그인 성공 직후 백엔드에서 내 미션 진도 싹 다 긁어오기
            try {
                const token = localStorage.getItem('token');
                
                if (token) {
                    const progressRes = await api.get('/missions/progress/details', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    const syncData: Record<number, number[]> = {};
                    progressRes.data.forEach((item: { placeId: number, conversationId: number }) => {
                        if (!syncData[item.placeId]) {
                            syncData[item.placeId] = [];
                        }
                        syncData[item.placeId].push(item.conversationId);
                    });
                    
                    // 로컬 스토리지에 내 진도 완벽하게 덮어쓰기! (남의 진도 삭제)
                    localStorage.setItem('mappy_progress', JSON.stringify(syncData));
                    console.log("✨ 내 미션 진도 완벽 동기화 완료!", syncData);
                }
            } catch (syncError) {
                console.error("진도율 동기화 실패:", syncError);
            }

            router.push('/');
        }
    };

    // 카카오 버튼 클릭 함수
    const handleKakaoLogin = () => {
        const KAKAO_CLIENT_ID = "8fbb449948ca62f55dd4a24f756f7a7b";
        
        // 내 컴퓨터에서는 'http://localhost:3000', Vercel에서는 'https://mappy-...vercel.app'
        const REDIRECT_URI = `${window.location.origin}/auth/kakao/callback`;
        const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`;
        
        window.location.href = KAKAO_AUTH_URL;
    };

    // 이미 로그인된 경우
    if (isLoggedIn) {
        return (
            <div className="login-page-container">
                <div className="login-card status-card">
                    <div className="status-icon-wrapper">
                        <CheckCircle2 size={48} color="#10B981" />
                    </div>
                    <h2 className="login-title">환영합니다!</h2>
                    <p className="info-text">
                        이미 로그인되어 있습니다.<br />
                        <span className="highlight-timer">{countdown}초</span> 뒤에 지도로 돌아갑니다.
                    </p>
                    <button onClick={() => router.push('/')} className="login-btn">
                        지금 지도로 이동
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page-container">
            <div className="login-card">
                <div className="login-header">
                    <h2 className="login-title">로그인</h2>
                    <p className="login-subtitle">나만의 여행 회화 노트를 완성해보세요!</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label className="input-label">이메일 주소</label>
                        <div className="input-wrapper">
                            <Mail className="input-icon" size={18} />
                            <input
                                className="login-input"
                                type="email"
                                placeholder="example@mappy.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">비밀번호</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" size={18} />
                            <input
                                className="login-input"
                                type="password"
                                placeholder="비밀번호를 입력하세요"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="login-btn">
                        로그인
                    </button>
                    <button type="button" onClick={handleKakaoLogin} className="kakao-login-btn">
                        <svg 
                            className="kakao-symbol" 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 21 19">
                            <path d="M10.5 0C4.7 0 0 3.7 0 8.2c0 2.9 1.9 5.5 4.8 7l-.8 2.8c-.1.5.4.9.9.6l3.4-2.3c.7.2 1.5.3 2.2.3 5.8 0 10.5-3.7 10.5-8.2S16.3 0 10.5 0z" fill="#000000" />
                        </svg>
                        카카오로 시작하기
                    </button>
                </form>

                <div className="divider">
                    <span className="divider-text">또는</span>
                </div>

                <div className="register-container">
                    <p className="register-text">처음이신가요?</p>
                    <Link href="/register" className="register-link">
                        회원가입 하고 시작하기
                    </Link>
                </div>
            </div>
        </div>
    );
}