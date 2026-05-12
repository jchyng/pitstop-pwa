'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import type { CarData, LogEntry } from '@/types';
import { getLogs, migrateLogsIfNeeded } from '@/lib/storage';

const CATEGORY_EMOJI: Record<string, string> = {
  '엔진·오일': '🛢️',
  '연료·증발가스': '⛽',
  '공조·외부': '❄️',
  '제동·냉각·변속': '🛑',
  '점화·벨트': '⚡',
  '타이어·배터리': '🔄',
};

function formatDate(iso: string): string {
  return iso.replace(/-/g, '.');
}

function toMonthLabel(iso: string): string {
  const [y, m] = iso.split('-');
  return `${y}년 ${Number(m)}월`;
}

export default function LogPage() {
  const router = useRouter();
  const [carData, setCarData] = useState<CarData | null>(null);
  const [carName, setCarName] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterCategory, setFilterCategory] = useState('전체');

  useEffect(() => {
    const carId = localStorage.getItem('pitstop_selected_car') ?? '';
    if (!carId) return;

    async function load() {
      const idxRes = await fetch('/cars/index.json');
      const idx: { car_id: string; name_ko: string; file: string }[] = await idxRes.json();
      const meta = idx.find(c => c.car_id === carId);
      if (!meta) return;
      setCarName(meta.name_ko);

      const dataRes = await fetch(meta.file);
      const data: CarData = await dataRes.json();
      setCarData(data);

      migrateLogsIfNeeded(carId, data.items);
      setLogs(getLogs(carId));
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
        minHeight: '100dvh',
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
          gap: 10,
          padding: '20px var(--page-pad) 14px',
        }}
      >
        <button
          onClick={() => router.push('/')}
          aria-label="홈으로"
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
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 style={{ flex: 1, fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>정비 이력</h1>
        {carName && (
          <button
            onClick={() => router.push('/')}
            aria-label={`선택된 차량: ${carName}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '8px 12px',
              border: '1.5px solid var(--color-border)',
              borderRadius: 24,
              background: 'var(--color-surface)',
              minHeight: 44,
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              fontFamily: 'var(--font)',
            }}
          >
            <span aria-hidden="true">🚗</span>
            <span>{carName}</span>
          </button>
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
        }}
      >
        {['전체', ...categories].map(cat => {
          const active = filterCategory === cat;
          const label = cat === '전체' ? '전체' : `${CATEGORY_EMOJI[cat] ?? ''} ${cat}`;
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
        {sorted.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '40vh',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 32 }}>🔧</span>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', textAlign: 'center' }}>
              아직 기록된 정비가 없어요
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>
              홈에서 소모품을 선택해 기록을 남겨보세요
            </p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none' }}>
            {grouped.map(([monthLabel, entries], groupIdx) => (
              <li key={monthLabel}>
                {/* Month anchor */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: groupIdx === 0 ? '2px 0 10px' : '18px 0 10px',
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--color-nav-active)',
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {monthLabel}
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                </div>

                {/* Entries */}
                {entries.map((entry, entryIdx) => {
                  const isLast = groupIdx === grouped.length - 1 && entryIdx === entries.length - 1;
                  const isRecent = entry.id === mostRecentId;
                  const emoji = CATEGORY_EMOJI[entry.category] ?? '';
                  return (
                    <div
                      key={entry.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 14,
                        paddingBottom: 18,
                        cursor: 'default',
                      }}
                    >
                      {/* Axis */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          flexShrink: 0,
                          width: 20,
                        }}
                      >
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: isRecent ? 'var(--color-nav-active)' : 'var(--color-border)',
                            border: '2px solid var(--color-surface)',
                            boxShadow: `0 0 0 1.5px ${isRecent ? 'var(--color-nav-active)' : 'var(--color-border)'}`,
                            marginTop: 5,
                            flexShrink: 0,
                          }}
                        />
                        {!isLast && (
                          <div
                            style={{
                              width: 1.5,
                              flex: 1,
                              background: 'var(--color-border)',
                              minHeight: 18,
                              marginTop: 4,
                            }}
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 16,
                              fontWeight: 600,
                              color: 'var(--color-text-primary)',
                              lineHeight: 1.3,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              minWidth: 0,
                            }}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {entry.logType === 'inspect' ? `${entry.itemName} 점검` : `${entry.itemName} 교환`}
                            </span>
                            {isRecent && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '2px 7px',
                                  borderRadius: 8,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  background: 'var(--color-normal-bg)',
                                  color: 'var(--color-normal-text)',
                                  flexShrink: 0,
                                }}
                              >
                                최근
                              </span>
                            )}
                          </div>
                          {entry.mileage !== null && (
                            <div
                              style={{
                                fontSize: 13.5,
                                fontWeight: 600,
                                color: 'var(--color-text-primary)',
                                fontVariantNumeric: 'tabular-nums',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                              }}
                            >
                              {entry.mileage.toLocaleString()} km
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                            {formatDate(entry.date)}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 500,
                              color: 'var(--color-text-muted)',
                              background: 'var(--color-surface-hover)',
                              padding: '2px 7px',
                              borderRadius: 8,
                            }}
                          >
                            {emoji} {entry.category}
                          </span>
                        </div>

                        {entry.note && (
                          <div
                            style={{
                              marginTop: 6,
                              fontSize: 12.5,
                              color: 'var(--color-text-muted)',
                              background: 'var(--color-surface-hover)',
                              borderRadius: 8,
                              padding: '6px 10px',
                              lineHeight: 1.5,
                            }}
                          >
                            {entry.note}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </li>
            ))}
          </ul>
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
