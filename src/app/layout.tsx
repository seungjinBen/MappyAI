import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AuthProvider } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';
import MainLayout from '@/components/Layout/MainLayout';

export const metadata: Metadata = {
  title: "Mappy English | 지도로 배우는 유럽 여행 영어 회화",
  description: "유럽 여행, 이제 겁내지 마세요! 장소별 미션으로 배우는 실전 여행 영어 서비스, Mappy English.",
  keywords: ["유럽여행", "여행영어", "영어회화", "실전영어", "Mappy English"],
  verification: {
    other: {
      "naver-site-verification": "b60a2b0dc8e484d381da866f6c204b1207b1a801",
    },
  },
  
  openGraph: {
    title: "Mappy English - 나만의 여행 영어 지도",
    description: "지도 위의 장소를 클릭하고 실전 회화 미션을 완료하세요!",
    url: "https://mappyenglish.com",
    siteName: "Mappy English",
    images: ["/MappyLogo.png"], 
    type: "website",
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
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}