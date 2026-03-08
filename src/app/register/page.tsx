"use client";

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation'; // Next.js용 useRouter
import Link from 'next/link'; // Next.js용 Link
import api from '@/lib/axios'; // 이전에 만든 axios 설정 파일 경로
import '@/css/RegisterPage.css';

export default function RegisterPage() {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const router = useRouter();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            // baseURL이 '/api'로 설정되어 있으므로 뒷부분만 작성
            const response = await api.post('/auth/register', {
                email: email,
                password: password,
                username: username
            });

            console.log(response.data);
            alert('회원가입 성공! 로그인 페이지로 이동합니다.');
            router.push('/login'); // navigate 대신 router.push

        } catch (error: any) {
            console.error('회원가입 실패:', error);
            // 백엔드 에러 메시지가 있으면 보여주고, 없으면 기본 메시지 출력
            alert(error.response?.data?.message || error.response?.data || '회원가입에 실패했습니다.');
        }
    };

    return (
        <div className="register-page-container">
            <div className="register-card">
                <h2 className="register-title">회원가입</h2>
                <p className="register-subtitle">Mappy English의 회원이 되어보세요!</p>

                <form onSubmit={handleSubmit} className="register-form">
                    <div className="input-group">
                        <label className="input-label">이름</label>
                        <input
                            className="register-input"
                            type="text"
                            placeholder="사용하실 이름을 입력하세요"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">이메일</label>
                        <input
                            className="register-input"
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
                            className="register-input"
                            type="password"
                            placeholder="비밀번호를 입력하세요"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="register-btn">
                        가입하기
                    </button>
                </form>

                {/* 이미 계정이 있는 경우 로그인으로 돌아가기 */}
                <div className="login-link-container">
                    이미 계정이 있으신가요?
                    <Link href="/login" className="login-link">
                        로그인 하기
                    </Link>
                </div>
            </div>
        </div>
    );
}