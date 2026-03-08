"use client";

import React from 'react';
import Link from 'next/link'; // Next.js용 Link
import { useRouter } from 'next/navigation'; // Next.js용 useRouter
import { useAuth } from '@/context/AuthContext'; 

const Header: React.FC = () => {
    const { isLoggedIn, logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        if (confirm("로그아웃 하시겠습니까?")) {
            logout();
            alert("로그아웃 되었습니다.");
            router.push('/'); // navigate('/') 대신 router.push('/')
        }
    };

    return (
        <header className='mappyHeader' style={{ backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0' }}>
            <div className="safe-padded" style={{
                padding: '0px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                height: '60px' // 헤더 높이 명시적 설정
            }}>
                {/* 로고 영역 */}
                <div className="logo" style={{ display: 'flex', alignItems: 'center' }}>
                    <Link href="/">
                        <img
                            src="/MappyLogo.png"
                            alt="Mappy English"
                            style={{ height: '75px', display: 'block' }} // 높이 조절 (이미지 비율에 맞춤)
                        />
                    </Link>
                </div>

                {/* 우측 상단 아이콘 버튼 영역 */}
                <div className="header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {isLoggedIn ? (
                        <>
                            {/* 1. 내 정보 */}
                            <button
                                onClick={() => router.push('/my-info')}
                                style={circleBtnStyle}
                                title="내 정보"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                            </button>

                            {/* 2. 로그아웃 */}
                            <button
                                onClick={handleLogout}
                                style={{...circleBtnStyle, color: '#FF5252', backgroundColor: '#FFEBEE'}}
                                title="로그아웃"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/>
                                </svg>
                            </button>
                        </>
                    ) : (
                        /* 3. 로그인 버튼 */
                        <button
                            onClick={() => router.push('/login')}
                            style={{
                                ...circleBtnStyle,
                                color: '#4285F4',
                                backgroundColor: '#E3F2FD',
                                width: 'auto',
                                height: '30px',
                                padding: '0 12px',
                                borderRadius: '15px',
                                gap: '5px',
                                fontWeight: 'bold'
                            }}
                            title="로그인"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                            </svg>
                            <span style={{fontSize: '12px', lineHeight: 1}}>로그인</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}

// 동그란 버튼 스타일 객체 (TypeScript 대응을 위해 CSSProperties 타입 적용 권장)
const circleBtnStyle: React.CSSProperties = {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: '#f5f5f5',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#555',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    padding: 0
};

export default Header;