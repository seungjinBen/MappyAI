import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Mappy English | 에든버러 여행 영어 회화 지도",
  description: "해리포터의 도시 에든버러에서 쓰는 실전 영어! 에든버러 현지 장소별 상황극으로 준비하는 여행 영어.",
  keywords: ["에든버러여행", "영국영어", "에든버러회화", "에든버러영어회화", "Mappy English Edinburgh"],
};

export default function EdinburghLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}