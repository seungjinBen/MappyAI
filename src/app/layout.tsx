import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from '@next/third-parties/google';

import { AuthProvider } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';
import MainLayout from '@/components/Layout/MainLayout';

export const metadata: Metadata = {
  title: "Mappy English | 유럽 여행 전, 설레는 영어 준비",
  description:
    "파리 카페에서 주문하고, 런던 거리에서 길을 묻고, 에든버러에서 현지인과 대화하세요. " +
    "지도를 탐험하며 그 장소에서 꼭 필요한 영어를 — 공부가 아닌 설렘으로 미리 경험합니다.",
  keywords: [
    "유럽여행 영어",
    "여행 영어 회화",
    "파리 영어",
    "런던 영어",
    "실전 여행 영어",
    "여행 영어 앱",
    "상황별 영어 회화",
    "Mappy English",
    "여행 준비 영어",
    "현지 영어 회화",
  ],
  verification: {
    other: {
      "naver-site-verification": "b60a2b0dc8e484d381da866f6c204b1207b1a801",
    },
  },

  openGraph: {
    title: "Mappy English — 내 손안의 작은 유럽",
    description:
      "에펠탑 앞에서, 런던 카페에서, 에든버러 로얄마일에서. " +
      "지도를 클릭하면 그 장소에서 실제로 쓰는 영어 대화가 시작됩니다.",
    url: "https://mappyenglish.com",
    siteName: "Mappy English",
    images: [
      {
        url: "/MappyLogo.png",
        width: 1200,
        height: 630,
        alt: "Mappy English — 유럽 지도로 배우는 여행 영어",
      },
    ],
    type: "website",
    locale: "ko_KR",
  },

  twitter: {
    card: "summary_large_image",
    title: "Mappy English — 내 손안의 작은 유럽",
    description:
      "파리 카페 주문부터 런던 길 묻기까지. 지도를 탐험하며 여행 영어를 미리 경험하세요.",
    images: ["/MappyLogo.png"],
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <DataProvider>
            <MainLayout>
              {children}
            </MainLayout>
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ""} />
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}