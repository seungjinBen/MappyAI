import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://mappyenglish.com';

  // 1. 고정된 정적 페이지들
  const routes = ['', '/paris', '/london', '/nice', '/edinburgh'].map(
    (route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: route === '' ? 1 : 0.8, // 메인 페이지는 우선순위 1
    })
  );

 // 우선 주요 도시 페이지들 위주로 등록

  return [...routes];
}