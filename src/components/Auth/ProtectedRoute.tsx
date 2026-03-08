"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; //

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isLoggedIn } = useAuth(); //
    const router = useRouter();

    useEffect(() => {
        // 로그인 상태가 아님이 확인되면 로그인 페이지로 리다이렉트
        if (!isLoggedIn) {
            alert('로그인이 필요합니다.');
            router.push('/login');
        }
    }, [isLoggedIn, router]);

    // 로그인하지 않은 경우 화면을 보여주지 않음 (깜빡임 방지)
    if (!isLoggedIn) {
        return null; 
    }

    // 로그인된 상태라면 자식 컴포넌트들을 렌더링
    return <>{children}</>;
};

export default ProtectedRoute;