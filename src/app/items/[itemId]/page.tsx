'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { CarData, LogEntry } from '@/types';
import { calculateUrgency } from '@/lib/urgency';
import { getMileage, getLogs, migrateLogsIfNeeded, mergeItemWithCustom, getCustomInterval } from '@/lib/storage';
import LogSheet from '@/components/LogSheet';
import IntervalEditSheet from '@/components/IntervalEditSheet';
import EditLogSheet from '@/components/EditLogSheet';
import Timeline from '@/components/Timeline';
import { formatDate } from '@/lib/dateUtils';
import LoadingSpinner from '@/components/LoadingSpinner';
import { buildIntervalText, groupByMonth } from '@/lib/itemUtils';

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.itemId as string;

  const [carId, setCarId] = useState('');
  const [carData, setCarData] = useState<CarData | null>(null);
  const [currentMileage, setCurrentMileage] = useState<number | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogSheet, setShowLogSheet] = useState(false);
  const [showIntervalSheet, setShowIntervalSheet] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LogEntry | null>(null);
  const [customVersion, setCustomVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'inspect' | 'replace'>('all');

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
        setIsLoading(false);
      });
  }, [itemId]);

  const item = useMemo(
    () => carData?.items.find(i => i.id === itemId) ?? null,
    [carData, itemId],
  );

  const mergedItem = useMemo(() => {
    if (!item || !carId) return null;
    return mergeItemWithCustom(carId, item);
  }, [item, carId, customVersion]);

  const isCustom = useMemo(() => {
    if (!item || !carId) return false;
    return !!getCustomInterval(carId, item.id);
  }, [item, carId, customVersion]);

  const sortedLogs = useMemo(
    () => [...logs].sort((a, b) => b.date.localeCompare(a.date)),
    [logs],
  );

  const lastEntry = sortedLogs[0] ?? null;
  const lastLoggedDate = lastEntry?.date ?? null;
  const lastLoggedMileage = lastEntry?.mileage ?? null;

  // 마지막 점검 기록의 condition — 교체 기록이 더 최신이면 null (교체로 해결됨)
  const lastInspectCondition = useMemo(() => {
    if (!sortedLogs.length) return null;
    if (sortedLogs[0].logType === 'replace') return null;
    const lastInspect = sortedLogs.find(l => l.logType === 'inspect');
    return lastInspect?.condition ?? null;
  }, [sortedLogs]);

  const lastReplaceEntry = useMemo(
    () => sortedLogs.find(l => l.logType === 'replace') ?? null,
    [sortedLogs],
  );

  const filteredLogs = useMemo(() => {
    if (historyFilter === 'all') return sortedLogs;
    return sortedLogs.filter(l => l.logType === historyFilter);
  }, [sortedLogs, historyFilter]);

  const urgency = useMemo(() => {
    if (!mergedItem) return null;
    return calculateUrgency({
      item: mergedItem,
      currentMileage,
      lastLoggedMileage,
      lastLoggedDate,
      lastInspectCondition,
    });
  }, [mergedItem, currentMileage, lastLoggedMileage, lastLoggedDate, lastInspectCondition]);

  const grouped = useMemo(() => groupByMonth(filteredLogs), [filteredLogs]);

  function handleSave() {
    setLogs(getLogs(carId).filter(l => l.itemId === itemId));
  }

  function handleIntervalSave() {
    setCustomVersion(v => v + 1);
  }

  const intervalText = mergedItem ? buildIntervalText(mergedItem) : '';

  const statusColor =
    urgency?.status === 'overdue'
      ? 'var(--color-overdue-sub)'
      : urgency?.status === 'caution'
      ? 'var(--color-caution-text)'
      : urgency?.status === 'warning'
      ? 'var(--color-warning-text)'
      : urgency?.status === 'ok'
      ? 'var(--color-normal-text)'
      : 'var(--color-text-muted)';

  const isInspectItem = item?.behavior !== 'replace_only';

  const statusLabel =
    urgency?.status === 'overdue'
      ? (isInspectItem ? '점검 필요' : '과기한')
      : urgency?.status === 'caution'
      ? (isInspectItem ? '점검 주의' : '주의')
      : urgency?.status === 'warning'
      ? (isInspectItem ? '점검 임박' : '교체 임박')
      : urgency?.status === 'ok'
      ? '정상'
      : '미기록';

  const statusBg =
    urgency?.status === 'overdue'
      ? 'var(--color-urgent-bg)'
      : urgency?.status === 'caution'
      ? 'var(--color-caution-bg)'
      : urgency?.status === 'warning'
      ? 'var(--color-warning-bg)'
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
          padding: '20px var(--page-pad) 14px',
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
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '-0.4px',
              color: 'var(--color-text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            {item?.name_ko ?? '로딩 중...'}
          </h1>
          {isInspectItem && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: 8,
                background: 'var(--color-surface-hover)',
                color: 'var(--color-text-muted)',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              점검 항목
            </span>
          )}
        </div>
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
                <button
                  onClick={() => setShowIntervalSheet(true)}
                  aria-label="교체 주기 편집"
                  style={{
                    textAlign: 'right',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 0',
                    fontFamily: 'var(--font)',
                    flexShrink: 0,
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--color-text-muted)',
                      marginBottom: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: 4,
                    }}
                  >
                    {isInspectItem ? '점검·교체 주기' : '교체 주기'}
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    {intervalText}
                  </p>
                  {isCustom && (
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: 4,
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '2px 7px',
                        borderRadius: 10,
                        background: 'var(--color-urgent-bg)',
                        color: 'var(--color-urgent-text)',
                      }}
                    >
                      커스텀
                    </span>
                  )}
                </button>
              )}
            </div>
            {lastLoggedDate && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                  마지막 {lastEntry?.logType === 'inspect' ? '점검' : '교체'}{' '}
                  <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                    {formatDate(lastLoggedDate)}
                    {lastLoggedMileage !== null ? ` · ${lastLoggedMileage.toLocaleString()}km` : ''}
                  </span>
                  {lastEntry?.logType === 'inspect' && lastEntry.condition && (
                    <span
                      style={{
                        marginLeft: 6,
                        fontWeight: 600,
                        color:
                          lastEntry.condition === 'replace_needed'
                            ? 'var(--color-overdue-sub)'
                            : lastEntry.condition === 'caution'
                            ? 'var(--color-urgent-text)'
                            : 'var(--color-normal-text)',
                      }}
                    >
                      · {lastEntry.condition === 'good' ? '양호' : lastEntry.condition === 'caution' ? '주의' : '교체 필요'}
                    </span>
                  )}
                </p>
                {isInspectItem && lastReplaceEntry && (
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                    마지막 교체{' '}
                    <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                      {formatDate(lastReplaceEntry.date)}
                      {lastReplaceEntry.mileage !== null ? ` · ${lastReplaceEntry.mileage.toLocaleString()}km` : ''}
                    </span>
                  </p>
                )}
              </div>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isInspectItem ? 10 : 14 }}>
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

        {/* 이력 필터 탭 (점검 항목만) */}
        {isInspectItem && sortedLogs.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {([
              { value: 'all', label: '전체' },
              { value: 'inspect', label: '🔍 점검' },
              { value: 'replace', label: '🔧 교체' },
            ] as { value: 'all' | 'inspect' | 'replace'; label: string }[]).map(tab => {
              const active = historyFilter === tab.value;
              const count = tab.value === 'all'
                ? sortedLogs.length
                : sortedLogs.filter(l => l.logType === tab.value).length;
              return (
                <button
                  key={tab.value}
                  onClick={() => setHistoryFilter(tab.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    border: `1.5px solid ${active ? 'var(--color-text-primary)' : 'var(--color-border)'}`,
                    background: active ? 'var(--color-text-primary)' : 'transparent',
                    color: active ? 'var(--color-bg)' : 'var(--color-text-secondary)',
                    fontWeight: active ? 600 : 500,
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: 'var(--font)',
                    transition: 'all 0.12s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                  {count > 0 && (
                    <span style={{ marginLeft: 4, opacity: 0.75 }}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 56 }}>
            <LoadingSpinner />
          </div>
        ) : sortedLogs.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              padding: '40px 12px 0',
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              style={{ color: 'var(--color-text-muted)', opacity: 0.75 }}
            >
              <path
                d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', textAlign: 'center', margin: 0 }}>
                아직 {item?.name_ko ?? '이 소모품'} 기록이 없어요
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
                아래 버튼으로 첫 번째 기록을 남겨보세요
              </p>
            </div>
            {intervalText && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '12px 20px',
                  background: 'var(--color-surface-hover)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 10,
                  minWidth: 180,
                }}
              >
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                  {isInspectItem ? '권장 점검 주기' : '권장 교체 주기'}
                </p>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                  {intervalText}
                </p>
              </div>
            )}
          </div>
        ) : filteredLogs.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', textAlign: 'center', padding: '32px 0' }}>
            {historyFilter === 'inspect' ? '점검 이력이 없습니다' : historyFilter === 'replace' ? '교체 이력이 없습니다' : '이력이 없습니다'}
          </p>
        ) : (
          <Timeline
            grouped={grouped}
            mostRecentId={filteredLogs[0]?.id ?? null}
            onEntryClick={entry => setEditingEntry(entry)}
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

      {showIntervalSheet && item && (
        <IntervalEditSheet
          item={item}
          carId={carId}
          onSave={handleIntervalSave}
          onClose={() => setShowIntervalSheet(false)}
        />
      )}

      {editingEntry && (
        <EditLogSheet
          entry={editingEntry}
          carId={carId}
          onSave={() => {
            setLogs(getLogs(carId).filter(l => l.itemId === itemId));
            setEditingEntry(null);
          }}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  );
}
