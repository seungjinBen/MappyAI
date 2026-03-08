"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';

// --- 타입 정의 ---
interface AuthContextType {
    isLoggedIn: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    // 초기값은 false로 설정 (SSR 대응)
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

    // 컴포넌트가 마운트된 후(브라우저 환경) 토큰 확인
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            setIsLoggedIn(!!token);
        }
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            // 주소는 프록시 설정(/api)에 맞춰 작성
            const response = await axios.post('/api/auth/login', { email, password });

            // 백엔드 응답 구조에 따라 선택 (token 또는 accessToken)
            const token = response.data.accessToken || response.data.token;

            if (token) {
                localStorage.setItem('token', token);
                setIsLoggedIn(true);
                return true;
            }
            return false;
        } catch (error) {
            console.error("로그인 에러:", error);
            alert("이메일 또는 비밀번호가 틀렸습니다.");
            return false;
        }
    };

    const logout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            setIsLoggedIn(false);
        }
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};