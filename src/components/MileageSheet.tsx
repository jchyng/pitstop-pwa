'use client';

import { useState } from 'react';
import BottomSheet from '@/components/BottomSheet';

interface Props {
  currentMileage: number | null;
  onSave: (mileage: number) => void;
  onClose: () => void;
}

const inputStyle: React.CSSProperties = {
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

export default function MileageSheet({ currentMileage, onSave, onClose }: Props) {
  const [value, setValue] = useState(currentMileage !== null ? String(currentMileage) : '');
  const [error, setError] = useState('');

  function handleSave() {
    const num = Number(value.replace(/,/g, ''));
    if (!Number.isFinite(num) || num <= 0) {
      setError('올바른 주행거리를 입력해 주세요.');
      return;
    }
    if (currentMileage !== null && num < currentMileage) {
      setError('이전 주행거리보다 낮은 값은 입력할 수 없습니다.');
      return;
    }
    onSave(num);
    onClose();
  }

  return (
    <BottomSheet onClose={onClose} ariaLabel="주행거리 업데이트">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)' }}>
          주행거리 업데이트
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

      {/* Input */}
      <div style={{ marginBottom: error ? 8 : 24 }}>
        <label
          htmlFor="mileage-sheet-input"
          style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 500 }}
        >
          현재 주행거리 (km)
        </label>
        <input
          id="mileage-sheet-input"
          type="number"
          inputMode="numeric"
          min="0"
          value={value}
          onChange={e => { setValue(e.target.value); setError(''); }}
          placeholder="예: 99000"
          autoFocus
          style={{ ...inputStyle, borderColor: error ? 'var(--color-urgent-text)' : 'var(--color-border)' }}
        />
      </div>

      {error && (
        <p role="alert" style={{ fontSize: 12, color: 'var(--color-urgent-text)', marginBottom: 16 }}>
          {error}
        </p>
      )}

      <button
        onClick={handleSave}
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
        }}
      >
        저장
      </button>
    </BottomSheet>
  );
}
