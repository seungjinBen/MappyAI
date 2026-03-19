"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';

// 토큰에서 role 꺼내는 함수 (관리자 확인용)
const getRoleFromToken = () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role;
    } catch (e) {
        return null;
    }
};

// 토큰에서 이메일(subject) 꺼내는 함수 (내 정보 표시용)
const getEmailFromToken = () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return '';
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub; // JwtTokenProvider에서 subject에 email을 넣었음
    } catch (e) {
        return '';
    }
};

const Header: React.FC = () => {
    const { isLoggedIn, logout } = useAuth();
    const router = useRouter();
    
    const [isAdmin, setIsAdmin] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    
    // 🌟 드롭다운 모달 상태 및 참조
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isLoggedIn) {
            setIsAdmin(getRoleFromToken() === 'ROLE_ADMIN');
            setUserEmail(getEmailFromToken() || '사용자');
        } else {
            setIsAdmin(false);
            setUserEmail('');
            setIsDropdownOpen(false);
        }
    }, [isLoggedIn]);

    // 🌟 팝업 바깥을 클릭하면 자동으로 닫히게 만드는 센스!
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        if (confirm("로그아웃 하시겠습니까?")) {
            localStorage.removeItem('token'); 
            localStorage.removeItem('mappy_progress');
            logout();
            setIsDropdownOpen(false); // 로그아웃 시 팝업 닫기
            alert("로그아웃 되었습니다.");
            router.push('/');
        }
    };

    const handleDeleteAccount = async () => {
        if (confirm("정말 Mappy English를 탈퇴하시겠습니까?\n저장된 단어장과 모든 학습 기록이 영구적으로 삭제됩니다. 😢")) {
            try {
                const token = localStorage.getItem('token');
                
                await api.delete('/auth/delete', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                localStorage.removeItem('token'); 
                localStorage.removeItem('mappy_progress');
                logout();
                setIsDropdownOpen(false);
                
                alert("회원 탈퇴가 정상적으로 처리되었습니다. 그동안 이용해 주셔서 감사합니다!");
                router.push('/');
                
            } catch (error) {
                console.error("회원 탈퇴 실패:", error);
                alert("회원 탈퇴 처리 중 문제가 발생했습니다. 다시 시도해 주세요.");
            }
        }
    }

    return (
        <header className='mappyHeader' style={{ backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0', position: 'relative' }}>
            <div className="safe-padded" style={{
                padding: '0px 20px 0 5px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                height: '60px'
            }}>
                {/* 로고 영역 */}
                <div className="logo" style={{ display: 'flex', alignItems: 'center' }}>
                    <Link href="/">
                        <img src="/mappyLOGO.png" alt="Mappy English" style={{ height: '85px', display: 'block' }} />
                    </Link>
                </div>

                {/* 우측 상단 아이콘 버튼 영역 */}
                <div className="header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {isLoggedIn ? (
                        <>
                            {/* 관리자 버튼 */}
                            {isAdmin && (
                                <button
                                    onClick={() => router.push('/admin/generator')}
                                    style={{
                                        ...circleBtnStyle,
                                        width: 'auto', padding: '0 12px', borderRadius: '15px',
                                        backgroundColor: '#333', color: '#fff', fontWeight: 'bold', fontSize: '12px'
                                    }}
                                >
                                    🛠️ 관리자
                                </button>
                            )}

                            {/* 🌟 내 정보 드롭다운 영역 */}
                            <div ref={dropdownRef} style={{ position: 'relative' }}>
                                {/* 기존 내 정보 버튼 (누르면 팝업 토글) */}
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    style={{
                                        ...circleBtnStyle,
                                        backgroundColor: isDropdownOpen ? '#E5E7EB' : '#f5f5f5' // 열려있을 때 색상 변경
                                    }}
                                    title="내 정보"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                    </svg>
                                </button>

                                {/* 🌟 드롭다운 모달창 */}
                                {isDropdownOpen && (
                                    <div style={{
                                        position: 'absolute', top: '40px', right: '0', width: '220px',
                                        backgroundColor: '#fff', borderRadius: '12px',
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                        border: '1px solid #E5E7EB', overflow: 'hidden', zIndex: 1000
                                    }}>
                                        {/* 유저 이메일 표시 구역 */}
                                        <div style={{ padding: '16px', borderBottom: '1px solid #F3F4F6', backgroundColor: '#F9FAFB' }}>
                                            <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>로그인된 계정</p>
                                            <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827', wordBreak: 'break-all' }}>
                                                {userEmail}
                                            </p>
                                        </div>
                                        
                                        {/* 메뉴 버튼들 */}
                                        <div style={{ padding: '8px 0' }}>
                                            <button onClick={handleDeleteAccount} style={dropdownMenuItemStyle}>
                                                <span style={{ color: '#4B5563' }}>회원 탈퇴</span>
                                            </button>
                                            <button onClick={handleLogout} style={{ ...dropdownMenuItemStyle, color: '#EF4444' }}>
                                                <span>로그아웃</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <button
                            onClick={() => router.push('/login')}
                            style={{
                                ...circleBtnStyle, color: '#4285F4', backgroundColor: '#E3F2FD',
                                width: 'auto', height: '30px', padding: '0 12px', borderRadius: '15px', fontWeight: 'bold'
                            }}
                        >
                            <span style={{fontSize: '12px'}}>로그인</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}

// 기존 동그란 버튼 스타일
const circleBtnStyle: React.CSSProperties = {
    width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#f5f5f5', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    color: '#555', transition: 'all 0.2s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', padding: 0
};

// 드롭다운 메뉴 아이템 스타일
const dropdownMenuItemStyle: React.CSSProperties = {
    width: '100%', padding: '10px 16px', textAlign: 'left', backgroundColor: 'transparent',
    border: 'none', cursor: 'pointer', fontSize: '14px', transition: 'background-color 0.2s'
};

export default Header;