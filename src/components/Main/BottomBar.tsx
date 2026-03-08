"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Map, Search, BookOpen } from 'lucide-react';
import '@/css/BottomBar.css';

// --- 타입 정의 ---
interface BottomBarProps {
    activeSheet: 'search' | 'saved' | null;
    onOpenSearch?: () => void;
    onOpenSaved?: () => void;
    onCloseAll?: () => void;
}

export default function BottomBar({ 
    activeSheet, 
    onOpenSearch, 
    onOpenSaved, 
    onCloseAll 
}: BottomBarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { isLoggedIn } = useAuth();

    // 시트 상태 확인
    const isSheetOpen = activeSheet !== null;
    const isSearchActive = activeSheet === 'search';
    const isSavedActive = activeSheet === 'saved';

    // 지도 탭 활성화 조건: 시트가 닫혀있으면 활성화 상태로 표시
    const isMapActive = !isSheetOpen;

    // 핵심 로직: 지도 버튼 클릭 핸들러
    const handleMapClick = () => {
        // 1. 시트가 열려 있다면? -> 시트만 닫고 끝
        if (isSheetOpen) {
            if (onCloseAll) onCloseAll();
            return;
        }

        // 2. 시트가 닫혀 있는데, 현재 위치가 메인('/')이 아니라면? -> 메인으로 이동
        if (pathname !== '/') {
            router.push('/');
            return;
        }
    };

    const handleSearchClick = () => {
        if (onOpenSearch) onOpenSearch();
    };

    const handleSavedClick = () => {
        if (!isLoggedIn) {
            if (window.confirm("로그인이 필요한 서비스입니다.\n로그인 하시겠습니까?")) {
                router.push('/login');
            }
        } else {
            if (onOpenSaved) onOpenSaved();
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

                    {/* 3. 내 회화노트 */}
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