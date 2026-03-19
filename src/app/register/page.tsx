"use client";

import React, { useState, FormEvent, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { User, Mail, Lock, UserPlus, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react'; 
import '@/css/RegisterPage.css';

export default function RegisterPage() {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    
    const router = useRouter();

    const isPasswordMatch = useMemo(() => {
        if (!password || !confirmPassword) return null; 
        return password === confirmPassword;
    }, [password, confirmPassword]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (password.length < 8) {
            alert('비밀번호는 8자 이상이어야 합니다.');
            return;
        }

        if (password !== confirmPassword) {
            alert('비밀번호가 일치하지 않습니다. 다시 확인해주세요.');
            return;
        }

        try {
            const response = await api.post('/auth/register', {
                email: email,
                password: password,
                username: username
            });

            alert('회원가입 성공! 로그인 페이지로 이동합니다.');
            router.push('/login');

        } catch (error: any) {
            alert(error.response?.data?.message || error.response?.data || '회원가입에 실패했습니다.');
        }
    };

    return (
        <div className="register-page-container">
            <div className="register-card">
                <div className="register-header">
                    <div className="register-icon-circle">
                        <UserPlus size={32} color="#10B981" />
                    </div>
                    <h2 className="register-title">회원가입</h2>
                    <p className="register-subtitle">Mappy English와 함께 여행을 시작하세요!</p>
                </div>

                <form onSubmit={handleSubmit} className="register-form">
                    <div className="input-group">
                        <label className="input-label">이름</label>
                        <div className="input-wrapper">
                            <User className="input-icon" size={18} />
                            <input
                                className="register-input"
                                type="text"
                                placeholder="사용하실 이름을 입력하세요"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">이메일 주소</label>
                        <div className="input-wrapper">
                            <Mail className="input-icon" size={18} />
                            <input
                                className="register-input"
                                type="email"
                                placeholder="example@mappy.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">비밀번호</label>
                        <div className="input-wrapper" style={{ position: 'relative' }}>
                            <Lock className="input-icon" size={18} />
                            <input
                                className="register-input"
                                type={showPassword ? 'text' : 'password'} 
                                placeholder="8자 이상의 비밀번호를 입력하세요"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={8}
                                required
                                style={{ paddingRight: '40px' }} 
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ 
                                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', 
                                    display: 'flex', alignItems: 'center', padding: 0 
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">비밀번호 확인</label>
                        <div className="input-wrapper" style={{ position: 'relative' }}>
                            <Lock className="input-icon" size={18} />
                            <input
                                className="register-input"
                                type={showConfirmPassword ? 'text' : 'password'} 
                                placeholder="비밀번호를 다시 한번 입력하세요"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                minLength={8}
                                required
                                style={{ paddingRight: '40px' }}
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={{ 
                                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', 
                                    display: 'flex', alignItems: 'center', padding: 0 
                                }}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        
                        {isPasswordMatch !== null && (
                            <p style={{
                                fontSize: '13px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px',
                                color: isPasswordMatch ? '#10B981' : '#EF4444', fontWeight: '600'
                            }}>
                                {isPasswordMatch ? (
                                    <><CheckCircle2 size={16} /> 비밀번호가 일치합니다.</>
                                ) : (
                                    <><XCircle size={16} /> 비밀번호가 일치하지 않습니다.</>
                                )}
                            </p>
                        )}
                    </div>

                    <button type="submit" className="register-btn" disabled={isPasswordMatch === false}>
                        가입 완료하기
                    </button>
                </form>

                <div className="login-link-container">
                    <p className="login-prompt-text">이미 계정이 있으신가요?</p>
                    <Link href="/login" className="login-link">
                        로그인 페이지로 돌아가기
                    </Link>
                </div>
            </div>
        </div>
    );
}