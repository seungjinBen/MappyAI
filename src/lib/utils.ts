export const checkInAppBrowser = () => {
  if (typeof window === 'undefined') return { isInApp: false, type: 'none' };

  const ua = navigator.userAgent.toLowerCase();
  
  const isKakao = ua.includes('kakaotalk');
  const isNaver = ua.includes('naver');
  const isLine = ua.includes('line');
  // 구글 앱은 'gsa'가 포함되는 경우가 많습니다.
  const isGoogleApp = ua.includes('gsa') || (ua.includes('google') && !ua.includes('chrome'));

  return {
    isInApp: isKakao || isNaver || isLine || isGoogleApp,
    type: isKakao ? '카카오' : isNaver ? '네이버' : isGoogleApp ? '구글' : '인앱',
    isIOS: /iphone|ipad|ipod/.test(ua),
    isAndroid: /android/.test(ua)
  };
};