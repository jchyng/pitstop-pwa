'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import PageHeader from '@/components/PageHeader';
import Timeline from '@/components/Timeline';
import type { CarData, LogEntry } from '@/types';
import { getLogs, migrateLogsIfNeeded } from '@/lib/storage';
import { groupByMonth } from '@/lib/itemUtils';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function LogPage() {
  const router = useRouter();
  const [carId, setCarId] = useState('');
  const [carData, setCarData] = useState<CarData | null>(null);
  const [carName, setCarName] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterCategory, setFilterCategory] = useState('전체');
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    async function load() {
      const id = localStorage.getItem('pitstop_selected_car') ?? '';
      if (!id) {
        setIsLoading(false);
        return;
      }

      const idxRes = await fetch('/cars/index.json');
      const idx: { car_id: string; name_ko: string; file: string }[] = await idxRes.json();
      const meta = idx.find(c => c.car_id === id);
      if (!meta) {
        setIsLoading(false);
        return;
      }
      setCarName(meta.name_ko);

      const dataRes = await fetch(meta.file);
      const data: CarData = await dataRes.json();
      setCarData(data);

      migrateLogsIfNeeded(id, data.items);
      setCarId(id);
      setLogs(getLogs(id));
      setIsLoading(false);
    }

    load();
  }, []);

  const categories = useMemo(() => {
    if (!carData) return [];
    return [...new Set(carData.items.map(i => i.category))];
  }, [carData]);

  const sorted = useMemo(() => {
    const filtered =
      filterCategory === '전체' ? logs : logs.filter(l => l.category === filterCategory);
    return [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  }, [logs, filterCategory]);

  const grouped = useMemo(() => groupByMonth(sorted), [sorted]);

  const mostRecentId = sorted[0]?.id ?? null;

  const lastMileage = useMemo(() => {
    const withKm = [...logs]
      .filter(l => l.mileage !== null)
      .sort((a, b) => b.date.localeCompare(a.date));
    return withKm[0]?.mileage ?? null;
  }, [logs]);

  return (
    <div
      style={{
        maxWidth: 390,
        margin: '0 auto',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg)',
      }}
    >
      <PageHeader title="정비 이력" carLabel={carName || undefined} />

      {/* Filter chips */}
      <div
        role="tablist"
        aria-label="항목 필터"
        style={{
          padding: '0 var(--page-pad) 12px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          display: 'flex',
          gap: 7,
          flexShrink: 0,
          touchAction: 'pan-x',
        } as React.CSSProperties}
      >
        {['전체', ...categories].map(cat => {
          const active = filterCategory === cat;
          return (
            <button
              key={cat}
              role="tab"
              aria-selected={active}
              onClick={() => setFilterCategory(cat)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '7px 13px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                border: 'none',
                fontFamily: 'var(--font)',
                transition: 'background 0.12s, color 0.12s',
                minHeight: 36,
                background: active ? 'var(--color-text-primary)' : 'var(--color-surface-hover)',
                color: active ? 'var(--color-bg)' : 'var(--color-text-secondary)',
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--color-border)', margin: '0 var(--page-pad)' }} />

      {/* Timeline */}
      <main
        id="main-content"
        role="main"
        style={{
          flex: 1,
          padding: '16px var(--page-pad) 0',
          paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
          overflowY: 'auto',
        }}
      >
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
            <LoadingSpinner />
          </div>
        ) : sorted.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '50vh',
              gap: 16,
              padding: '0 12px',
            }}
          >
            <svg
              width="64"
              height="52"
              viewBox="0 0 24 22"
              fill="none"
              aria-hidden="true"
              style={{ color: 'var(--color-text-muted)', opacity: 0.75 }}
            >
              <rect x="1" y="9" width="22" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M5 9L8 3H16L19 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="6" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="var(--color-bg)"/>
              <circle cx="18" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="var(--color-bg)"/>
              <line x1="1" y1="14" x2="23" y2="14" stroke="currentColor" strokeWidth="0.75" strokeOpacity="0.4"/>
              <line x1="12" y1="9" x2="12" y2="19" stroke="currentColor" strokeWidth="0.75" strokeOpacity="0.35"/>
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', textAlign: 'center', margin: 0 }}>
                첫 정비 기록을 남겨볼까요?
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
                홈에서 소모품을 선택하면<br />정비 기록을 남길 수 있어요
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '12px 16px',
                background: 'var(--color-surface-hover)',
                border: '1px solid var(--color-border)',
                borderRadius: 10,
                maxWidth: 270,
              }}
            >
              <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }} aria-hidden="true">💡</span>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                꾸준한 기록이 소모품 교체 시기를 정확하게 알려줘요
              </p>
            </div>
          </div>
        ) : (
          <Timeline
            grouped={grouped}
            mostRecentId={mostRecentId}
            showItemName
            showCategory
            onEntryClick={entry => router.push(`/items/${entry.itemId}`)}
          />
        )}
      </main>

      {/* Footer summary */}
      {sorted.length > 0 && (
        <div
          role="contentinfo"
          style={{
            position: 'fixed',
            bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: 390,
            padding: '10px var(--page-pad)',
            background: 'var(--color-surface-hover)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 99,
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            총{' '}
            <strong style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
              {sorted.length}건
            </strong>
          </span>
          {lastMileage !== null && (
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              마지막 정비{' '}
              <strong style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                {lastMileage.toLocaleString()} km
              </strong>
            </span>
          )}
        </div>
      )}

      <BottomNav activeTab="log" />

    </div>
  );
}
