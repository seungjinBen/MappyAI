"use client";

import React from "react";
import '@/css/ConvCards.css';
import BookmarkButton from "./BookmarkButton";
import { Volume2 } from 'lucide-react';

// --- 타입 정의 ---
interface Line {
  lineOrder: number;
  englishText: string;
  koreanText?: string;
}

interface Place {
  name: string;
}

interface Conversation {
  id: number;
  type?: 'A' | 'B' | string; // 'A'는 내가 먼저 시작 등
  isSaved?: boolean;
  place?: Place;
  lines?: Line[];
}

interface ConvCardsProps {
  conversations?: Conversation[];
  meLabel?: string;
  otherLabel?: string;
}

export default function ConvCards({
  conversations = [],
  meLabel = 'Me',
  otherLabel = 'Partner'
}: ConvCardsProps) {

  // 브라우저 TTS 함수 (클라이언트 사이드 전용)
  const handleSpeak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // 현재 진행 중인 음성이 있다면 중지
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  return (
    <div className="convcards">
      {conversations.length === 0 ? (
        <div className="empty">저장된 대화가 없습니다.</div>
      ) : (
        conversations.map((conv) => {
          // 데이터 정렬: lineOrder 기준
          const sortedLines = [...(conv.lines || [])].sort((a, b) => a.lineOrder - b.lineOrder);
          // 시작 위치 결정 (A 타입이면 내가 먼저)
          const startSide = String(conv.type).toUpperCase() === 'A' ? 'me' : 'other';

          return (
            <section key={conv.id} className="card" aria-label="Conversation Card">
              <header className="card__header">
                <span className="card__title">{conv.place?.name || '대화'}</span>
                <BookmarkButton
                  conversationId={conv.id}
                  initialIsSaved={conv.isSaved || false}
                />
              </header>

              <div className="chat">
                {sortedLines.map((line, idx) => {
                  // 홀수 번째 라인(1, 3, 5...)이 시작 사이드와 같음
                  const isMe = (line.lineOrder % 2 === 1)
                    ? (startSide === 'me')
                    : (startSide !== 'me');

                  return (
                    <div key={idx} className={`row ${isMe ? 'row--me' : 'row--other'}`}>
                      {!isMe && <div className="avatar">{getInitials(otherLabel)}</div>}

                      <div className={`bubble ${isMe ? 'bubble--me' : 'bubble--other'}`}>
                        <div className="bubble-header">
                          <p className="en">{line.englishText}</p>
                          <button
                            type="button"
                            className="audio-btn"
                            onClick={() => handleSpeak(line.englishText)}
                            title="Listen to pronunciation"
                          >
                            <Volume2 size={16} color={isMe ? "#6B7280" : "#9CA3AF"} />
                          </button>
                        </div>
                        {line.koreanText && <p className="ko">{line.koreanText}</p>}
                      </div>

                      {isMe && <div className="avatar avatar--me">{getInitials(meLabel)}</div>}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}