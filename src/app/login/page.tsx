"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation'; // Next.js용 useRouter
import Link from 'next/link'; // Next.js용 Link
import { useAuth } from '@/context/AuthContext'; // Context 경로 확인 필요
import '@/css/LoginPage.css';

export default function LoginPage() {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [countdown, setCountdown] = useState<number>(3);

    const { isLoggedIn, login } = useAuth();
    const router = useRouter();

    // 1. 이미 로그인 상태라면 카운트다운 후 메인으로 이동
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
            router.push('/');
        }
    };

    // 2. 로그인 상태일 때 보여줄 화면
    if (isLoggedIn) {
        return (
            <div className="login-page-container">
                <div className="login-card">
                    <div className="icon-wrapper" style={{ fontSize: '2rem' }}>✅</div>
                    <h2 className="login-title">이미 로그인 상태입니다</h2>
                    <p className="info-text">
                        <span className="highlight-text" style={{ color: '#4285F4', fontWeight: 'bold' }}>
                            {countdown}초
                        </span> 뒤에 메인 페이지로 이동합니다.
                    </p>
                    <button onClick={() => router.push('/')} className="secondary-btn">
                        지금 바로 이동하기
                    </button>
                </div>
            </div>
        );
    }

    // 3. 로그인 폼 화면
    return (
        <div className="login-page-container">
            <div className="login-card">
                <h2 className="login-title">로그인</h2>
                <p className="login-subtitle">나만의 회화 노트를 만들어보세요!</p>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label className="input-label">이메일</label>
                        <input
                            className="login-input"
                            type="email"
                            placeholder="example@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">비밀번호</label>
                        <input
                            className="login-input"
                            type="password"
                            placeholder="비밀번호를 입력하세요"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="login-btn">
                        로그인
                    </button>
                </form>

                {/* 구분선 */}
                <div className="divider">
                    <span className="divider-text">또는</span>
                </div>

                {/* 회원가입 버튼 영역 */}
                <div className="register-container">
                    <p className="register-text">아직 계정이 없으신가요?</p>
                    <Link href="/register" className="register-link">
                        회원가입 하러가기
                    </Link>
                </div>
            </div>
        </div>
    );
}