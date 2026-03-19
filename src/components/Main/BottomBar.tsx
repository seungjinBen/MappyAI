"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Map, Search, BookOpen } from 'lucide-react';
import '@/css/BottomBar.css';

interface BottomBarProps {
    isSearchOpen: boolean;
    onOpenSearch: () => void;
    onCloseSearch: () => void;
}

export default function BottomBar({ 
    isSearchOpen, 
    onOpenSearch, 
    onCloseSearch 
}: BottomBarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { isLoggedIn } = useAuth();

    // 현재 상태 판별 (버튼 색상 활성화용)
    // 1. 저장됨 버튼: 현재 주소가 '/saved' 이면 활성화
    const isSavedActive = pathname === '/saved';
    // 2. 검색 버튼: MainLayout에서 isSearchOpen이 true라고 알려주면 활성화
    const isSearchActive = isSearchOpen;
    // 3. 지도 버튼: 저장됨 화면도 아니고, 검색창도 안 열려있으면 활성화
    const isMapActive = !isSavedActive && !isSearchOpen;

    const handleMapClick = () => {
        if (isSearchOpen) {
            onCloseSearch();
        }
        if (pathname !== '/') {
            router.push('/');
        }
    };

    const handleSearchClick = () => {
        onOpenSearch();
    };

    const handleSavedClick = () => {
        if (isSearchOpen) {
            onCloseSearch();
        }

        if (!isLoggedIn) {
            if (window.confirm("로그인이 필요한 서비스입니다.\n로그인 하시겠습니까?")) {
                router.push('/login');
            }
        } else {
            router.push('/saved'); 
        }
    };

    return (
        <nav className='mappyBottom'>
            <div className="safe-padded">
                <div className="container bottom-nav">

                    {/* 1. 지도 */}
                    <button
                        className={`btn ${isMapActive ? 'active' : ''}`}
                        onClick={handleMapClick}
                        type="button"
                    >
                        <Map size={20} strokeWidth={isMapActive ? 2.5 : 2} />
                        <span 
                            className="btn-text" 
                            style={{ fontWeight: isMapActive ? 'bold' : '500' }}
                        >
                            지도
                        </span>
                    </button>

                    {/* 2. 검색 */}
                    <button
                        className={`btn ${isSearchActive ? 'active' : ''}`}
                        onClick={handleSearchClick}
                        type="button"
                    >
                        <Search size={20} strokeWidth={isSearchActive ? 2.5 : 2} />
                        <span 
                            className="btn-text" 
                            style={{ fontWeight: isSearchActive ? 'bold' : '500' }}
                        >
                            검색
                        </span>
                    </button>

                    {/* 3. 내 회화노트 (저장됨) */}
                    <button
                      className={`btn ${isSavedActive ? 'active' : ''}`}
                      onClick={handleSavedClick}
                      type="button"
                    >
                        <BookOpen size={20} strokeWidth={isSavedActive ? 2.5 : 2} />
                        <span 
                            className="btn-text" 
                            style={{ fontWeight: isSavedActive ? 'bold' : '500' }}
                        >
                            저장됨
                        </span>
                    </button>

                </div>
            </div>
        </nav>
    );
}