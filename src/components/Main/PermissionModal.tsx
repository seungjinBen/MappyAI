import React from 'react';
import { Mic, CheckCircle2, MessageSquare, Sparkles } from 'lucide-react';
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
                
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '20px 0 10px 0', color: '#111827' }}>
                    현지인처럼 말해볼까요?
                </h3>

                {isInApp ? (
                    <div className="in-app-guide-box">
                        <div className="in-app-badge">{type} 앱 이용 중</div>
                        <p className="in-app-text">
                            현재 앱 환경에서는 마이크 사용이 제한될 수 있습니다.<br />
                            <strong>텍스트 입력</strong>으로 미션을 수행하거나,<br />
                            마이크를 쓰시려면 <strong>{isIOS ? 'Safari' : 'Chrome'}</strong>으로 접속해주세요!
                        </p>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <p className="permission-desc" style={{ fontSize: '15px', color: '#4B5563', lineHeight: '1.5', margin: 0 }}>
                            실제 <strong>파리 카페</strong>에서 주문하듯,<br />
                            <strong>목소리</strong>로 직접 말해보는 게 가장 빨라요.
                        </p>
                    </div>
                )}

                <div className="permission-guide-box" style={{ backgroundColor: '#F9FAFB', borderRadius: '12px', padding: '16px' }}>
                    <div className="guide-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <MessageSquare size={16} color="#10B981" />
                        <span style={{ fontSize: '14px', color: '#374151' }}><strong>타이핑 : </strong> 조용한 곳에서, 내 속도로</span>
                    </div>
                    <div className="guide-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={16} color="#10B981" />
                        <span style={{ fontSize: '14px', color: '#374151' }}><strong>말하기 :</strong> 에밀리가 실제로 들을게요</span>
                    </div>
                </div>

                <div className="permission-actions" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                    <button className="permission-confirm-btn" onClick={onConfirm} style={{ padding: '14px', borderRadius: '12px', fontWeight: '700' }}>
                        목소리로 말해볼게요
                    </button>
                    <button 
                        className="permission-close-link" 
                        onClick={onClose} 
                        style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        일단 타이핑으로 시작할게요
                    </button>
                </div>
            </div>
        </div>
    );
}