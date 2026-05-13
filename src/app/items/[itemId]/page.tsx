'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { CarData, ConsumableItem, LogEntry } from '@/types';
import { calculateUrgency } from '@/lib/urgency';
import { getMileage, getLogs, migrateLogsIfNeeded } from '@/lib/storage';
import LogSheet from '@/components/LogSheet';
import Timeline from '@/components/Timeline';

function formatDate(iso: string): string {
  return iso.replace(/-/g, '.');
}

function toMonthLabel(iso: string): string {
  const [y, m] = iso.split('-');
  return `${y}년 ${Number(m)}월`;
}

function buildIntervalText(item: ConsumableItem): string {
  const parts: string[] = [];
  if (item.interval_km) parts.push(`${item.interval_km.toLocaleString()}km`);
  if (item.interval_months) parts.push(`${item.interval_months}개월`);
  return parts.join(' / ');
}

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.itemId as string;

  const [carId, setCarId] = useState('');
  const [carData, setCarData] = useState<CarData | null>(null);
  const [currentMileage, setCurrentMileage] = useState<number | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogSheet, setShowLogSheet] = useState(false);

  useEffect(() => {
    const savedCarId = localStorage.getItem('pitstop_selected_car') ?? 'avante-md-gasoline';
    const mileage = getMileage(savedCarId);

    fetch(`/cars/${savedCarId}.json`)
      .then(r => r.json())
      .then((data: CarData) => {
        migrateLogsIfNeeded(savedCarId, data.items);
        setCarId(savedCarId);
        setCurrentMileage(mileage);
        setCarData(data);
        setLogs(getLogs(savedCarId).filter(l => l.itemId === itemId));
      });
  }, [itemId]);

  const item = useMemo(
    () => carData?.items.find(i => i.id === itemId) ?? null,
    [carData, itemId],
  );

  const sortedLogs = useMemo(
    () => [...logs].sort((a, b) => b.date.localeCompare(a.date)),
    [logs],
  );

  const lastEntry = sortedLogs[0] ?? null;
  const lastLoggedDate = lastEntry?.date ?? null;
  const lastLoggedMileage = lastEntry?.mileage ?? null;

  const urgency = useMemo(() => {
    if (!item) return null;
    return calculateUrgency({ item, currentMileage, lastLoggedMileage, lastLoggedDate });
  }, [item, currentMileage, lastLoggedMileage, lastLoggedDate]);

  const grouped = useMemo(() => {
    const map = new Map<string, LogEntry[]>();
    for (const entry of sortedLogs) {
      const label = toMonthLabel(entry.date);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(entry);
    }
    return [...map.entries()];
  }, [sortedLogs]);

  function handleSave() {
    setLogs(getLogs(carId).filter(l => l.itemId === itemId));
  }

  const intervalText = item ? buildIntervalText(item) : '';

  const statusColor =
    urgency?.status === 'overdue'
      ? 'var(--color-overdue-sub)'
      : urgency?.status === 'urgent'
      ? 'var(--color-urgent-text)'
      : urgency?.status === 'ok'
      ? 'var(--color-normal-text)'
      : 'var(--color-text-muted)';

  const statusLabel =
    urgency?.status === 'overdue'
      ? '과기한'
      : urgency?.status === 'urgent'
      ? '교체 임박'
      : urgency?.status === 'ok'
      ? '정상'
      : '미기록';

  const statusBg =
    urgency?.status === 'overdue'
      ? 'var(--color-urgent-bg)'
      : urgency?.status === 'urgent'
      ? 'var(--color-urgent-bg)'
      : urgency?.status === 'ok'
      ? 'var(--color-normal-bg)'
      : 'var(--color-surface-hover)';

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
          gap: 8,
          padding: '16px var(--page-pad) 12px',
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
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '-0.4px',
            color: 'var(--color-text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item?.name_ko ?? '로딩 중...'}
        </h1>
        {urgency && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '5px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              background: statusBg,
              color: statusColor,
              flexShrink: 0,
            }}
          >
            {statusLabel}
          </span>
        )}
      </header>

      {/* Status card */}
      {item && urgency && (
        <div style={{ padding: '0 var(--page-pad) 4px' }}>
          <div
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-card)',
              background: 'var(--color-surface)',
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--color-text-muted)',
                    marginBottom: 2,
                  }}
                >
                  현재 상태
                </p>
                <p
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    letterSpacing: '-0.5px',
                    color: statusColor,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {urgency.displayText}
                </p>
              </div>
              {intervalText && (
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 2 }}>교체 주기</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    {intervalText}
                  </p>
                </div>
              )}
            </div>
            {lastLoggedDate && (
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 8 }}>
                마지막 {lastEntry?.logType === 'inspect' ? '점검' : '교환'}{' '}
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                  {formatDate(lastLoggedDate)}
                  {lastLoggedMileage !== null ? ` · ${lastLoggedMileage.toLocaleString()}km` : ''}
                </span>
              </p>
            )}
            {item.notes && (
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--color-text-muted)',
                  marginTop: 8,
                  background: 'var(--color-surface-hover)',
                  borderRadius: 8,
                  padding: '6px 10px',
                  lineHeight: 1.5,
                }}
              >
                {item.notes}
              </p>
            )}
          </div>
        </div>
      )}

      {/* History section */}
      <main
        id="main-content"
        role="main"
        style={{
          flex: 1,
          padding: '16px var(--page-pad) 0',
          paddingBottom: 'calc(88px + env(safe-area-inset-bottom, 0px))',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            정비 이력
          </p>
          {sortedLogs.length > 0 && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-nav-active)',
                background: 'var(--color-urgent-bg)',
                borderRadius: 10,
                padding: '1px 8px',
              }}
            >
              {sortedLogs.length}건
            </span>
          )}
        </div>

        {sortedLogs.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 48,
              gap: 8,
            }}
          >
            <span style={{ fontSize: 32 }}>🔧</span>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', textAlign: 'center' }}>
              아직 기록된 정비가 없어요
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>
              아래 버튼으로 첫 번째 기록을 남겨보세요
            </p>
          </div>
        ) : (
          <Timeline
            grouped={grouped}
            mostRecentId={sortedLogs[0]?.id ?? null}
          />
        )}
      </main>

      {/* Add button */}
      {item && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: 390,
            padding: '12px var(--page-pad)',
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
            background: 'var(--color-bg)',
            borderTop: '1px solid var(--color-border)',
            zIndex: 10,
          }}
        >
          <button
            onClick={() => setShowLogSheet(true)}
            style={{
              width: '100%',
              padding: '15px 0',
              borderRadius: 12,
              border: 'none',
              background: 'var(--color-text-primary)',
              color: 'var(--color-bg)',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font)',
              transition: 'opacity 0.12s',
            }}
          >
            기록 추가
          </button>
        </div>
      )}

      {showLogSheet && item && (
        <LogSheet
          item={item}
          carId={carId}
          currentMileage={currentMileage}
          onSave={handleSave}
          onClose={() => setShowLogSheet(false)}
        />
      )}
    </div>
  );
}
