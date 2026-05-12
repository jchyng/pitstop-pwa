'use client';

import { useState } from 'react';
import type { ConsumableItem, LogType } from '@/types';
import { setLastLog, setLastMileage, setLastLogType } from '@/lib/storage';

interface Props {
  item: ConsumableItem;
  carId: string;
  currentMileage: number | null;
  onSave: () => void;
  onClose: () => void;
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const sheetInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: 10,
  fontSize: 15,
  background: 'var(--color-surface-hover)',
  color: 'var(--color-text-primary)',
  fontFamily: 'var(--font)',
  outline: 'none',
  boxSizing: 'border-box',
};

export default function LogSheet({ item, carId, currentMileage, onSave, onClose }: Props) {
  const isInspectItem = item.item_type === 'inspect';
  const [date, setDate] = useState(todayISO());
  const [mileageStr, setMileageStr] = useState(currentMileage !== null ? String(currentMileage) : '');
  const [logType, setLogType] = useState<LogType>(isInspectItem ? 'inspect' : 'replace');

  function handleSave() {
    if (!date) return;
    setLastLog(carId, item.id, date);
    const km = Number(mileageStr);
    if (Number.isFinite(km) && km > 0) {
      setLastMileage(carId, item.id, km);
    }
    setLastLogType(carId, item.id, logType);
    onSave();
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 100,
        }}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${item.name_ko} 기록`}
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 390,
          background: 'var(--color-surface)',
          borderRadius: '20px 20px 0 0',
          zIndex: 101,
          padding: '20px var(--page-pad)',
          paddingBottom: 'calc(28px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {item.name_ko}
          </p>
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 22,
              lineHeight: 1,
              color: 'var(--color-text-muted)',
              padding: '0 2px',
              fontFamily: 'var(--font)',
            }}
          >
            ×
          </button>
        </div>

        {/* Log type toggle (점검 항목만) */}
        {isInspectItem && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {(['inspect', 'replace'] as LogType[]).map(type => {
              const active = logType === type;
              return (
                <button
                  key={type}
                  onClick={() => setLogType(type)}
                  style={{
                    flex: 1,
                    padding: '11px 0',
                    borderRadius: 10,
                    border: `1.5px solid ${active ? 'var(--color-text-primary)' : 'var(--color-border)'}`,
                    background: active ? 'var(--color-text-primary)' : 'transparent',
                    color: active ? 'var(--color-bg)' : 'var(--color-text-secondary)',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                    fontFamily: 'var(--font)',
                    transition: 'all 0.12s',
                  }}
                >
                  {type === 'inspect' ? '점검 완료' : '교체함'}
                </button>
              );
            })}
          </div>
        )}

        {/* Date */}
        <div style={{ marginBottom: 14 }}>
          <label
            htmlFor="log-date"
            style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 500 }}
          >
            날짜
          </label>
          <input
            id="log-date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={sheetInputStyle}
          />
        </div>

        {/* Mileage */}
        <div style={{ marginBottom: 24 }}>
          <label
            htmlFor="log-mileage"
            style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 500 }}
          >
            주행거리 (km)
          </label>
          <input
            id="log-mileage"
            type="number"
            value={mileageStr}
            onChange={e => setMileageStr(e.target.value)}
            placeholder="예: 50000"
            inputMode="numeric"
            style={sheetInputStyle}
          />
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={!date}
          style={{
            width: '100%',
            padding: '15px 0',
            borderRadius: 12,
            border: 'none',
            background: date ? 'var(--color-text-primary)' : 'var(--color-border)',
            color: date ? 'var(--color-bg)' : 'var(--color-text-muted)',
            fontSize: 16,
            fontWeight: 700,
            cursor: date ? 'pointer' : 'default',
            fontFamily: 'var(--font)',
            transition: 'background 0.12s',
          }}
        >
          저장
        </button>
      </div>
    </>
  );
}
