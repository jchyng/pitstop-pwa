'use client';

import { useState } from 'react';

interface Props {
  onComplete: () => void;
  onRegisterCar: () => void;
}

const STEPS = [
  {
    icon: (
      <svg width="80" height="80" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <rect x="6" y="22" width="52" height="26" rx="8" stroke="var(--color-nav-active)" strokeWidth="3" />
        <path d="M14 22l6-12h24l6 12" stroke="var(--color-nav-active)" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="18" cy="48" r="6" stroke="var(--color-nav-active)" strokeWidth="3" />
        <circle cx="46" cy="48" r="6" stroke="var(--color-nav-active)" strokeWidth="3" />
        <path d="M6 34h52" stroke="var(--color-nav-active)" strokeWidth="2" strokeDasharray="4 3" />
        <circle cx="48" cy="16" r="10" fill="var(--color-nav-active)" />
        <path d="M44 16l3 3 5-5" stroke="var(--color-bg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: '소모품 교체 시기, 한눈에',
    desc: '엔진오일부터 타이어까지\n교체 시기가 다가오면 앱이 먼저 알려드려요',
  },
  {
    icon: (
      <svg width="80" height="80" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <circle cx="32" cy="32" r="26" stroke="var(--color-nav-active)" strokeWidth="3" />
        <path d="M32 16v18l10 6" stroke="var(--color-nav-active)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="32" cy="32" r="4" fill="var(--color-nav-active)" />
      </svg>
    ),
    title: '기록할수록 정확해져요',
    desc: '주행거리와 교체 이력을 남기면\n내 차에 딱 맞는 알림을 받을 수 있어요',
  },
  {
    icon: (
      <svg width="80" height="80" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <circle cx="32" cy="32" r="26" stroke="var(--color-nav-active)" strokeWidth="3" />
        <path d="M20 32l9 9 15-15" stroke="var(--color-nav-active)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: '지금 시작해볼까요?',
    desc: '차량 등록만 하면 모든 준비가 끝나요\n30초면 충분해요',
  },
] as const;

export default function OnboardingOverlay({ onComplete, onRegisterCar }: Props) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const s = STEPS[step];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pitstop 시작하기"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 28px',
        paddingBottom: 'calc(44px + env(safe-area-inset-bottom, 0px))',
        maxWidth: 390,
        margin: '0 auto',
      }}
    >
      {/* Slide content — keyed by step to trigger animation on change */}
      <div
        key={step}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          textAlign: 'center',
          animation: 'pitstop-slide-in 0.28s ease',
        }}
      >
        {s.icon}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.4px',
              lineHeight: 1.3,
            }}
          >
            {s.title}
          </p>
          <p
            style={{
              fontSize: 15,
              color: 'var(--color-text-secondary)',
              lineHeight: 1.75,
              whiteSpace: 'pre-line',
            }}
          >
            {s.desc}
          </p>
        </div>
      </div>

      {/* Step dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
        {STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === step ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background: i === step ? 'var(--color-nav-active)' : 'var(--color-border)',
              transition: 'width 0.25s ease, background 0.25s ease',
            }}
          />
        ))}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
        <button
          type="button"
          onClick={() => {
            if (isLast) onRegisterCar();
            else setStep(prev => prev + 1);
          }}
          style={{
            padding: '14px',
            background: 'var(--color-nav-active)',
            color: 'var(--color-bg)',
            border: 'none',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--font)',
            letterSpacing: '-0.2px',
          }}
        >
          {isLast ? '차량 등록하기' : '다음'}
        </button>
        <button
          type="button"
          onClick={onComplete}
          style={{
            padding: '10px',
            background: 'none',
            color: 'var(--color-text-muted)',
            border: 'none',
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'var(--font)',
          }}
        >
          {isLast ? '나중에 하기' : '건너뛰기'}
        </button>
      </div>
    </div>
  );
}
