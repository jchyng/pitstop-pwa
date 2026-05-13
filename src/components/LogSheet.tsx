'use client';

import { useState } from 'react';
import type { ConsumableItem, LogType, InspectCondition } from '@/types';
import { setLastLog, setLastMileage, setLastLogType, addLog } from '@/lib/storage';
import BottomSheet from '@/components/BottomSheet';

const CONDITION_OPTIONS: { value: InspectCondition; label: string; tone: 'normal' | 'caution' | 'bad' }[] = [
  { value: 'good', label: '양호', tone: 'normal' },
  { value: 'caution', label: '주의 관찰', tone: 'caution' },
  { value: 'replace_needed', label: '교체 필요', tone: 'bad' },
];

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
  const [condition, setCondition] = useState<InspectCondition>('good');
  const [note, setNote] = useState('');

  const showCondition = logType === 'inspect';

  function handleSave() {
    if (!date) return;
    setLastLog(carId, item.id, date);
    const km = Number(mileageStr);
    const mileage = Number.isFinite(km) && km > 0 ? km : null;
    if (mileage !== null) {
      setLastMileage(carId, item.id, mileage);
    }
    setLastLogType(carId, item.id, logType);
    addLog(carId, {
      id: Date.now().toString(),
      itemId: item.id,
      itemName: item.name_ko,
      category: item.category,
      date,
      mileage,
      logType,
      condition: showCondition ? condition : undefined,
      note: note.trim() || undefined,
    });
    onSave();
    onClose();
  }

  return (
    <BottomSheet onClose={onClose} ariaLabel={`${item.name_ko} 기록`}>
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

        {/* Condition picker (점검 기록일 때만) */}
        {showCondition && (
          <div style={{ marginBottom: 18 }}>
            <p
              style={{
                fontSize: 12,
                color: 'var(--color-text-muted)',
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              점검 결과
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              {CONDITION_OPTIONS.map(opt => {
                const active = condition === opt.value;
                const activeBg =
                  opt.tone === 'bad'
                    ? 'var(--color-overdue-sub)'
                    : opt.tone === 'caution'
                    ? 'var(--color-urgent-text)'
                    : 'var(--color-text-primary)';
                return (
                  <button
                    key={opt.value}
                    onClick={() => setCondition(opt.value)}
                    style={{
                      flex: 1,
                      padding: '9px 0',
                      borderRadius: 10,
                      border: `1.5px solid ${active ? activeBg : 'var(--color-border)'}`,
                      background: active ? activeBg : 'transparent',
                      color: active ? 'var(--color-bg)' : 'var(--color-text-secondary)',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                      fontFamily: 'var(--font)',
                      transition: 'all 0.12s',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
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
        <div style={{ marginBottom: 14 }}>
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

        {/* Note */}
        <div style={{ marginBottom: 24 }}>
          <label
            htmlFor="log-note"
            style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 500 }}
          >
            메모 (선택)
          </label>
          <textarea
            id="log-note"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="예: 합성유 5W-30, 오일필터 동시 교체"
            rows={2}
            style={{ ...sheetInputStyle, resize: 'none', lineHeight: 1.5 }}
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
    </BottomSheet>
  );
}
