'use client';

import { useState } from 'react';

interface Props {
  currentMileage: number | null;
  onSave: (mileage: number) => void;
}

export default function MileageInput({ currentMileage, onSave }: Props) {
  const [value, setValue] = useState(currentMileage !== null ? String(currentMileage) : '');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = Number(value.replace(/,/g, ''));
    if (!Number.isFinite(num) || num < 0) {
      setError('올바른 주행거리를 입력해 주세요.');
      return;
    }
    if (currentMileage !== null && num < currentMileage) {
      setError('이전 주행거리보다 낮은 값은 입력할 수 없습니다.');
      return;
    }
    setError('');
    onSave(num);
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '16px var(--page-pad)',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <label
        htmlFor="mileage-input"
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--color-text-primary)',
        }}
      >
        현재 주행거리 (km)
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          id="mileage-input"
          type="number"
          min="0"
          value={value}
          onChange={e => { setValue(e.target.value); setError(''); }}
          placeholder="예: 45230"
          style={{
            flex: 1,
            padding: '10px 12px',
            border: `1px solid ${error ? 'var(--color-urgent-text)' : 'var(--color-border)'}`,
            borderRadius: 8,
            fontSize: 15,
            fontFamily: 'var(--font)',
            background: 'var(--color-bg)',
            color: 'var(--color-text-primary)',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 18px',
            background: 'var(--color-nav-active)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'var(--font)',
            cursor: 'pointer',
          }}
        >
          저장
        </button>
      </div>
      {error && (
        <p style={{ fontSize: 12, color: 'var(--color-urgent-text)' }} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
