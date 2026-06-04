'use client';

import { useRouter } from 'next/navigation';

export default function GuideBanner() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/guide')}
      aria-label="정비 주기 가이드 보기"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '11px 14px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      {/* 아이콘 */}
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: 'var(--color-surface-hover)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="4" y="3" width="13" height="18" rx="2" stroke="var(--color-nav-active)" strokeWidth="1.8" />
          <path d="M8 8h6M8 12h6M8 16h4" stroke="var(--color-nav-active)" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="18" cy="18" r="4" fill="var(--color-bg)" stroke="var(--color-nav-active)" strokeWidth="1.5" />
          <path d="M16.5 18h3M18 16.5v3" stroke="var(--color-nav-active)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* 텍스트 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.2px',
          }}
        >
          정비 주기 가이드
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--color-text-muted)',
            marginTop: 2,
          }}
        >
          이 차량의 전체 점검 주기 한눈에 보기
        </div>
      </div>

      {/* 우측 배지 + 화살표 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: '3px 7px',
            borderRadius: 6,
            background: 'var(--color-surface-hover)',
            color: 'var(--color-text-muted)',
            whiteSpace: 'nowrap',
          }}
        >
          공식 기준
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 18l6-6-6-6" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </button>
  );
}
