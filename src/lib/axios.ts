import axios, { InternalAxiosRequestConfig } from 'axios';

// 1. Axios 인스턴스 생성
const api = axios.create({
    // Next.js 프록시(/api)를 사용하므로 baseURL은 비워두거나 '/api'로 설정합니다.
    // 이렇게 하면 브라우저가 현재 도메인 뒤에 /api를 붙여 요청을 보냅니다.
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' }
});

// 2. 요청 인터셉터 (Request Interceptor)
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Next.js는 서버에서도 코드를 실행하려 하므로, 
        // localStorage 접근 전 반드시 브라우저(window) 환경인지 확인해야 함.
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');

            // 토큰이 실제 존재하고, 유효한 문자열일 때만 Bearer 헤더 추가
            if (token && token !== 'null' && token !== 'undefined') {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. 응답 인터셉터
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;

        // 401(Unauthorized): 토큰 만료 등 인증 실패
        // 403(Forbidden): 접근 권한 없음 (계정 문제 등)
        if (status === 401 || status === 403) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user'); 

                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;