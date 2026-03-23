import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Mappy English | 파리 여행 영어 회화 지도",
  description: "에펠탑부터 루브르까지, 파리 주요 명소에서 바로 쓰는 실전 영어! 지도로 확인하고 미션을 완료하세요.",
  keywords: ["파리여행", "프랑스영어", "에펠탑회화", "파리영어회화", "Mappy English Paris"],
};

export default function ParisLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}