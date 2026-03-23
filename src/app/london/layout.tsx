import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Mappy English | 런던 여행 영어 회화 지도",
  description: "런던 아이, 빅벤에서 당당하게 영어로 말하기! 런던 현지 장소별 상황극으로 준비하는 여행 영어.",
  keywords: ["런던여행", "영국영어", "빅벤회화", "런던영어회화", "Mappy English London"],
};

export default function LondonLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}