import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Mappy English | 니스 여행 영어 회화 지도",
  description: "남프랑스 휴양지 니스에서 즐기는 여행 영어! 니스 현지 장소별 상황극으로 준비하는 여행 영어.",
  keywords: ["니스여행", "프랑스영어", "니스회화", "니스영어회화", "Mappy English Nice"],
};

export default function NiceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}