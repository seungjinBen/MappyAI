import React from 'react';
import { Mic, CheckCircle2, X } from 'lucide-react';
import '@/css/LoginPage.css';
import { checkInAppBrowser } from '@/lib/utils';

interface PermissionModalProps {
    onClose: () => void;
    onConfirm: () => void;
}

export default function PermissionModal({ onClose, onConfirm }: PermissionModalProps) {
    const { isInApp, type, isIOS } = checkInAppBrowser();
    
    return (
        <div className="modal-overlay" style={{ zIndex: 20000 }}>
            <div className="permission-modal">
                <div className="permission-icon-wrapper">
                    <Mic size={40} color="#10B981" />
                    <div className="pulse-ring"></div>
                </div>
                
                {isInApp ? (
                    <div className="in-app-guide-box">
                        <div className="in-app-badge">{type} 앱 이용 중</div>
                        <p className="in-app-text">
                            {type} 앱에서는 마이크 사용이 제한될 수 있습니다.<br />
                            더 원활한 대화를 위해 <strong>{isIOS ? 'Safari' : 'Chrome'}</strong>으로 접속해주세요!
                        </p>
                        <div className="in-app-steps">
                            {isIOS ? "우측 하단 '···' 클릭 > 브라우저에서 열기" : "우측 상단 '⋮' 클릭 > 다른 브라우저로 열기"}
                        </div>
                    </div>
                ) : (
                    <p className="permission-desc">
                        현지인과의 생생한 대화 미션을 완료하려면<br />
                        <strong>마이크 사용 허용</strong>이 꼭 필요합니다. ✈️
                    </p>
                )}

                <div className="permission-guide-box">
                    <div className="guide-item">
                        <CheckCircle2 size={16} color="#10B981" />
                        <span>실시간 발음 정확도 체크</span>
                    </div>
                    <div className="guide-item">
                        <CheckCircle2 size={16} color="#10B981" />
                        <span>장소별 회화 미션 수행</span>
                    </div>
                </div>

                <div className="permission-actions">
                    <button className="permission-confirm-btn" onClick={onConfirm}>
                        권한 허용하기
                    </button>
                    <button className="permission-close-link" onClick={onClose}>
                        나중에 설정할게요
                    </button>
                </div>
            </div>
        </div>
    );
}