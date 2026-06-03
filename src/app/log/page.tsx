'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import Timeline from '@/components/Timeline';
import type { CarData, LogEntry } from '@/types';
import { getLogs, migrateLogsIfNeeded } from '@/lib/storage';

function toMonthLabel(iso: string): string {
  const [y, m] = iso.split('-');
  return `${y}년 ${Number(m)}월`;
}

const FUEL_LABEL: Record<string, string> = {
  gasoline: '가솔린',
  diesel: '디젤',
  ev: 'EV',
  hev: 'HEV',
};

export default function LogPage() {
  const router = useRouter();
  const [carId, setCarId] = useState('');
  const [carData, setCarData] = useState<CarData | null>(null);
  const [carName, setCarName] = useState('');
  const [carChipLabel, setCarChipLabel] = useState('');
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
      const idx: { car_id: string; name_ko: string; model: string; fuel: string; file: string }[] = await idxRes.json();
      const meta = idx.find(c => c.car_id === id);
      if (!meta) {
        setIsLoading(false);
        return;
      }
      setCarName(meta.name_ko);
      const fuelLabel = FUEL_LABEL[meta.fuel] ?? meta.fuel;
      setCarChipLabel(`${meta.model} - ${fuelLabel}`);

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

  const grouped = useMemo(() => {
    const map = new Map<string, LogEntry[]>();
    for (const entry of sorted) {
      const label = toMonthLabel(entry.date);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(entry);
    }
    return [...map.entries()];
  }, [sorted]);

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
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px var(--page-pad) 14px',
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>정비 이력</h1>
        {carChipLabel && (
          <span
            aria-label={`선택된 차량: ${carName}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 12px',
              border: '1.5px solid var(--color-border)',
              borderRadius: 24,
              background: 'var(--color-surface)',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font)',
            }}
          >
            {carChipLabel}
          </span>
        )}
      </header>

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
          const label = cat;
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
              {label}
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '40vh',
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                border: '2.5px solid var(--color-border)',
                borderTop: '2.5px solid var(--color-nav-active)',
                borderRadius: '50%',
                animation: 'pitstop-spin 0.75s linear infinite',
              }}
            />
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
