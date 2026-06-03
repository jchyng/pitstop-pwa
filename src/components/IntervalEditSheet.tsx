'use client';

import { useState } from 'react';
import type { ConsumableItem } from '@/types';
import { getCustomInterval, setCustomInterval, resetCustomInterval } from '@/lib/storage';
import BottomSheet from '@/components/BottomSheet';
import SheetHeader from '@/components/SheetHeader';
import PrimaryButton from '@/components/PrimaryButton';

interface Props {
  item: ConsumableItem; // 공식(비병합) item
  carId: string;
  onSave: () => void;
  onClose: () => void;
}

const baseInputStyle: React.CSSProperties = {
  flex: 1,
  padding: '11px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: 10,
  fontSize: 16,
  background: 'var(--color-surface-hover)',
  color: 'var(--color-text-primary)',
  fontFamily: 'var(--font)',
  outline: 'none',
  boxSizing: 'border-box',
  fontVariantNumeric: 'tabular-nums',
  minWidth: 0,
};

const stepBtnStyle: React.CSSProperties = {
  width: 32,
  height: 28,
  border: '1px solid var(--color-border)',
  borderRadius: 6,
  background: 'var(--color-surface-hover)',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  fontSize: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--font)',
};

function StepInput({
  value,
  onChange,
  step,
  min,
  unit,
}: {
  value: number | '';
  onChange: (v: number | '') => void;
  step: number;
  min: number;
  unit: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="number"
        value={value === '' ? '' : value}
        onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        inputMode="numeric"
        min={min}
        style={baseInputStyle}
      />
      <span style={{ fontSize: 14, color: 'var(--color-text-secondary)', minWidth: 28, flexShrink: 0 }}>
        {unit}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
        <button
          onClick={() => onChange(typeof value === 'number' ? Math.max(min, value + step) : step)}
          aria-label={`${unit} 증가`}
          style={stepBtnStyle}
        >
          ▲
        </button>
        <button
          onClick={() => onChange(typeof value === 'number' ? Math.max(min, value - step) : step)}
          aria-label={`${unit} 감소`}
          style={stepBtnStyle}
        >
          ▼
        </button>
      </div>
    </div>
  );
}

export default function IntervalEditSheet({ item, carId, onSave, onClose }: Props) {
  const saved = getCustomInterval(carId, item.id);
  const [kmVal, setKmVal] = useState<number | ''>(saved?.interval_km ?? item.interval_km ?? '');
  const [monthsVal, setMonthsVal] = useState<number | ''>(
    saved?.interval_months ?? item.interval_months ?? '',
  );

  const hasCustomSaved = !!saved;
  const hasKm = item.interval_km !== null;
  const hasMonths = item.interval_months !== null;

  function handleSave() {
    const data: { interval_km?: number; interval_months?: number } = {};
    if (hasKm && typeof kmVal === 'number' && kmVal > 0 && kmVal !== item.interval_km) {
      data.interval_km = kmVal;
    }
    if (hasMonths && typeof monthsVal === 'number' && monthsVal > 0 && monthsVal !== item.interval_months) {
      data.interval_months = monthsVal;
    }
    if (Object.keys(data).length > 0) {
      setCustomInterval(carId, item.id, data);
    } else {
      resetCustomInterval(carId, item.id);
    }
    onSave();
    onClose();
  }

  function handleReset() {
    resetCustomInterval(carId, item.id);
    onSave();
    onClose();
  }

  return (
    <BottomSheet onClose={onClose} ariaLabel="교체 주기 설정">
      <SheetHeader title="교체 주기 설정" onClose={onClose} marginBottom={24} />

      {/* km 입력 */}
      {hasKm && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 3 }}>
            주행거리 기준
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>
            공식 값: {item.interval_km?.toLocaleString()} km
          </p>
          <StepInput value={kmVal} onChange={setKmVal} step={1000} min={1000} unit="km" />
        </div>
      )}

      {/* 기간 입력 */}
      {hasMonths && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 3 }}>
            기간 기준
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>
            공식 값: {item.interval_months} 개월
          </p>
          <StepInput value={monthsVal} onChange={setMonthsVal} step={1} min={1} unit="개월" />
        </div>
      )}

      {/* 초기화 버튼 — 저장된 커스텀 값이 있을 때만 노출 */}
      {hasCustomSaved && (
        <button
          onClick={handleReset}
          style={{
            width: '100%',
            padding: '12px 0',
            borderRadius: 10,
            border: '1.5px solid var(--color-border)',
            background: 'transparent',
            color: 'var(--color-text-secondary)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--font)',
            marginBottom: 10,
          }}
        >
          ↺ 공식 값으로 초기화
        </button>
      )}

      <PrimaryButton onClick={handleSave}>저장하기</PrimaryButton>
    </BottomSheet>
  );
}
