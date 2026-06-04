'use client';

import { useEffect, useState, useMemo } from 'react';
import BottomNav from '@/components/BottomNav';
import PageHeader from '@/components/PageHeader';
import Timeline from '@/components/Timeline';
import type { CarData, LogEntry, CarIndex } from '@/types';
import { getLogs, migrateLogsIfNeeded, getMyCars } from '@/lib/storage';
import CarPickerSheet from '@/components/CarPickerSheet';
import EditLogSheet from '@/components/EditLogSheet';
import { groupByMonth } from '@/lib/itemUtils';
import LoadingSpinner from '@/components/LoadingSpinner';
import GhostTimeline from '@/components/GhostTimeline';

export default function LogPage() {
  const [carId, setCarId] = useState('');
  const [carData, setCarData] = useState<CarData | null>(null);
  const [carName, setCarName] = useState('');
  const [carList, setCarList] = useState<CarIndex[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterCategory, setFilterCategory] = useState('전체');
  const [isLoading, setIsLoading] = useState(true);
  const [showCarPicker, setShowCarPicker] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LogEntry | null>(null);

  useEffect(() => {
    async function load() {
      const savedId = localStorage.getItem('pitstop_selected_car') ?? '';
      const myCarIds = getMyCars();

      const idxRes = await fetch('/cars/index.json');
      const idx: CarIndex[] = await idxRes.json();
      const myCars = idx.filter(c => myCarIds.includes(c.car_id));
      setCarList(myCars);

      const id = myCars.find(c => c.car_id === savedId)?.car_id ?? myCars[0]?.car_id ?? '';
      if (!id) {
        setIsLoading(false);
        return;
      }

      const meta = myCars.find(c => c.car_id === id);
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

  async function handleCarSelect(id: string) {
    const meta = carList.find(c => c.car_id === id);
    if (!meta) return;
    localStorage.setItem('pitstop_selected_car', id);
    setCarId(id);
    setCarName(meta.name_ko);
    setFilterCategory('전체');
    setIsLoading(true);
    const dataRes = await fetch(meta.file);
    const data: CarData = await dataRes.json();
    setCarData(data);
    migrateLogsIfNeeded(id, data.items);
    setLogs(getLogs(id));
    setIsLoading(false);
  }

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
      <PageHeader
        title="정비 이력"
        carLabel={carName || undefined}
        onCarClick={carList.length > 1 ? () => setShowCarPicker(true) : undefined}
      />

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
          <div style={{ padding: '28px 0 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 20 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                아직 기록이 없어요
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
                홈에서 소모품을 선택해 첫 기록을 남겨보세요
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>예시</span>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            </div>
            <GhostTimeline variant="full" />
          </div>
        ) : (
          <Timeline
            grouped={grouped}
            mostRecentId={mostRecentId}
            showItemName
            showCategory
            onEntryClick={entry => setEditingEntry(entry)}
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

      {showCarPicker && (
        <CarPickerSheet
          carList={carList}
          selectedCarId={carId}
          onSelect={handleCarSelect}
          onClose={() => setShowCarPicker(false)}
        />
      )}

      {editingEntry && (
        <EditLogSheet
          entry={editingEntry}
          carId={carId}
          onSave={() => setLogs(getLogs(carId))}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  );
}
