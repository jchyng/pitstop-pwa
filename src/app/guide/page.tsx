'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { CarData, ConsumableItem, ManualIndex, ManualCategoryData } from '@/types';
import { getMileage } from '@/lib/storage';
import LoadingSpinner from '@/components/LoadingSpinner';
import GuideCategory from '@/components/GuideCategory';
import ManualViewerSheet from '@/components/ManualViewerSheet';

const CATEGORIES = [
  '엔진·오일',
  '연료·증발가스',
  '공조·외부',
  '제동·냉각·변속',
  '점화·벨트',
  '타이어·배터리',
];

export default function GuidePage() {
  const router = useRouter();

  const [carData, setCarData] = useState<CarData | null>(null);
  const [manualIndex, setManualIndex] = useState<ManualIndex | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [activeSheet, setActiveSheet] = useState<{ category: string; data: ManualCategoryData } | null>(null);

  useEffect(() => {
    const carId = localStorage.getItem('pitstop_selected_car') ?? 'avante-md-gasoline';

    Promise.all([
      fetch(`/cars/${carId}.json`).then(r => r.json() as Promise<CarData>),
      fetch(`/manuals/${carId}/index.json`)
        .then(r => (r.ok ? r.json() as Promise<ManualIndex> : null))
        .catch(() => null),
    ]).then(([car, manual]) => {
      setCarData(car);
      setManualIndex(manual);
      setIsLoading(false);
    });
  }, []);

  const itemsByCategory = useMemo(() => {
    if (!carData) return {};
    const map: Record<string, ConsumableItem[]> = {};
    for (const cat of CATEGORIES) map[cat] = [];
    for (const item of carData.items) {
      if (map[item.category] !== undefined) map[item.category].push(item);
    }
    return map;
  }, [carData]);

  function toggleCategory(cat: string) {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function openManualSheet(category: string) {
    const data = manualIndex?.categories[category];
    if (!data) return;
    setActiveSheet({ category, data });
  }

  const hasManualData = manualIndex != null;

  if (isLoading) {
    return (
      <div
        style={{
          maxWidth: 390,
          margin: '0 auto',
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg)',
        }}
      >
        <LoadingSpinner />
      </div>
    );
  }

  if (!carData) {
    return (
      <div
        style={{
          maxWidth: 390,
          margin: '0 auto',
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          background: 'var(--color-bg)',
          padding: '0 var(--page-pad)',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>등록된 차량이 없습니다.</p>
        <button
          onClick={() => router.back()}
          style={{
            fontSize: 13,
            color: 'var(--color-nav-active)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          ← 홈으로
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 390,
        margin: '0 auto',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg)',
      }}
    >
      {/* 헤더 (sticky) */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--color-bg)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '20px var(--page-pad) 14px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <button
          onClick={() => router.back()}
          aria-label="뒤로 가기"
          style={{
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-primary)',
            marginLeft: -8,
            borderRadius: 8,
            flexShrink: 0,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <h1
          style={{
            flex: 1,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '-0.4px',
            color: 'var(--color-text-primary)',
          }}
        >
          정비 주기 가이드
        </h1>

        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            padding: '6px 10px',
            borderRadius: 20,
            border: '1.5px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {carData.name_ko}
        </span>
      </header>

      {/* 신뢰 배지 */}
      <div style={{ padding: '10px var(--page-pad) 0' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            background: 'var(--color-surface-hover)',
            borderRadius: 8,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M9 12l2 2 4-4" stroke="var(--color-nav-active)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="9" stroke="var(--color-nav-active)" strokeWidth="1.8" />
          </svg>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {carData.name_ko}{' '}
            {hasManualData ? `공식 취급설명서 기반` : `권장 정비 주기`}
          </span>
        </div>
      </div>

      {/* 카테고리 목록 */}
      <main
        style={{
          flex: 1,
          padding: '6px var(--page-pad)',
          paddingBottom: 'calc(40px + env(safe-area-inset-bottom, 0px))',
          overflowY: 'auto',
        }}
      >
        {CATEGORIES.map(cat => {
          const items = itemsByCategory[cat] ?? [];
          if (items.length === 0) return null;

          const manualData = manualIndex?.categories[cat];

          return (
            <GuideCategory
              key={cat}
              category={cat}
              items={items}
              manualData={manualData}
              onEvidenceTap={() => openManualSheet(cat)}
              collapsed={collapsedCategories.has(cat)}
              onToggle={() => toggleCategory(cat)}
            />
          );
        })}

        {/* 안내 문구 */}
        <p
          style={{
            fontSize: 11,
            color: 'var(--color-text-muted)',
            textAlign: 'center',
            marginTop: 20,
            lineHeight: 1.6,
          }}
        >
          실제 사용 환경(주행 패턴, 기후 등)에 따라 교체 시기가 달라질 수 있습니다.
        </p>
      </main>

      {/* 매뉴얼 이미지 시트 */}
      {activeSheet && manualIndex && (
        <ManualViewerSheet
          category={activeSheet.category}
          manualData={activeSheet.data}
          source={manualIndex.source}
          version={manualIndex.version}
          onClose={() => setActiveSheet(null)}
        />
      )}
    </div>
  );
}
