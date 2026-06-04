'use client';

import { useState } from 'react';
import type { ManualCategoryData } from '@/types';
import BottomSheet from './BottomSheet';
import SheetHeader from './SheetHeader';

interface Props {
  category: string;
  manualData: ManualCategoryData;
  source: string;
  version?: string;
  onClose: () => void;
}

export default function ManualViewerSheet({ category, manualData, source, version, onClose }: Props) {
  const [imageIndex, setImageIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const images = manualData.images;
  const hasImages = images.length > 0;

  return (
    <BottomSheet onClose={onClose} ariaLabel={`${category} 공식 취급설명서`}>
      <SheetHeader title={category} onClose={onClose} marginBottom={12} />

      {/* 출처 행 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          marginBottom: 14,
          padding: '7px 10px',
          background: 'var(--color-surface-hover)',
          borderRadius: 8,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
          <path d="M9 12l2 2 4-4" stroke="var(--color-nav-active)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="9" stroke="var(--color-nav-active)" strokeWidth="1.5" />
        </svg>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', flex: 1 }}>
          출처: {source}{version ? ` (${version})` : ''}
          {manualData.page_ref ? ` · ${manualData.page_ref}` : ''}
        </span>
      </div>

      {/* 이미지 영역 */}
      {hasImages ? (
        <div>
          <div
            onClick={() => setFullscreen(true)}
            style={{
              cursor: 'zoom-in',
              borderRadius: 8,
              overflow: 'hidden',
              border: '1px solid var(--color-border)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[imageIndex]}
              alt={`${category} 취급설명서`}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>

          {/* 다중 이미지 도트 네비게이션 */}
          {images.length > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 6,
                marginTop: 12,
              }}
            >
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImageIndex(i)}
                  aria-label={`${i + 1}번째 이미지`}
                  style={{
                    width: i === imageIndex ? 20 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: i === imageIndex ? 'var(--color-nav-active)' : 'var(--color-border)',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'width 0.2s, background 0.2s',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* 이미지 없음 플레이스홀더 */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '40px 20px',
            background: 'var(--color-surface-hover)',
            borderRadius: 12,
            minHeight: 160,
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="var(--color-text-muted)" strokeWidth="1.5" />
            <path d="M3 15l5-5 4 4 3-3 6 6" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="var(--color-text-muted)" />
            <line x1="1" y1="1" x2="23" y2="23" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p
            style={{
              fontSize: 13,
              color: 'var(--color-text-muted)',
              textAlign: 'center',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            공식 자료 준비 중입니다
          </p>
        </div>
      )}

      {/* 전체화면 오버레이 */}
      {fullscreen && (
        <div
          onClick={() => setFullscreen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[imageIndex]}
            alt={`${category} 취급설명서 전체화면`}
            style={{
              maxWidth: '100%',
              maxHeight: '100dvh',
              objectFit: 'contain',
            }}
          />
        </div>
      )}
    </BottomSheet>
  );
}
