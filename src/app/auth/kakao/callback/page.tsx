"use client";

import React, { useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';

function KakaoCallbackLogic() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const code = searchParams.get('code');
    
    const hasFetched = useRef(false); 

    useEffect(() => {
        if (code && !hasFetched.current) {
            hasFetched.current = true;

            const processKakaoLogin = async () => {
                try {                  
                    const response = await api.post('/auth/kakao', { code });

                    const token = response.data.token; 
                    
                    localStorage.setItem('token', token);

                    alert('카카오 로그인 성공! 환영합니다.');
                    window.location.href = '/';

                } catch (error) {
                    console.error('카카오 간편로그인 에러:', error);
                    alert('로그인 처리 중 문제가 발생했습니다. 다시 시도해 주세요.');
                    router.push('/login');
                }
            };

            processKakaoLogin();
        }
    }, [code, router]);

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100vh', 
            backgroundColor: '#F9FAFB' 
        }}>
            <h2 style={{ color: '#10B981', marginBottom: '16px', fontWeight: '800' }}>
                카카오 로그인 처리 중입니다...
            </h2>
            <p style={{ color: '#6B7280', fontSize: '16px' }}>
                잠시만 기다려주세요! ✈️
            </p>
        </div>
    );
}

// Suspense
export default function KakaoCallbackPage() {
    return (
        <Suspense fallback={<div>카카오와 연결 중...</div>}>
            <KakaoCallbackLogic />
        </Suspense>
    );
}