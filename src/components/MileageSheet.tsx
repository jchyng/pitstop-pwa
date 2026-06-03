'use client';

import { useState } from 'react';
import BottomSheet from '@/components/BottomSheet';
import SheetHeader from '@/components/SheetHeader';
import PrimaryButton from '@/components/PrimaryButton';
import FormField from '@/components/FormField';
import { sheetInputStyle } from '@/lib/sheetStyles';

interface Props {
  currentMileage: number | null;
  onSave: (mileage: number) => void;
  onClose: () => void;
}

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
      <SheetHeader title="주행거리 업데이트" onClose={onClose} marginBottom={24} />

      <FormField id="mileage-sheet-input" label="현재 주행거리 (km)" marginBottom={error ? 8 : 24}>
        <input
          id="mileage-sheet-input"
          type="number"
          inputMode="numeric"
          min="0"
          value={value}
          onChange={e => { setValue(e.target.value); setError(''); }}
          placeholder="예: 99000"
          autoFocus
          style={{ ...sheetInputStyle, borderColor: error ? 'var(--color-urgent-text)' : 'var(--color-border)' }}
        />
      </FormField>

      {error && (
        <p role="alert" style={{ fontSize: 12, color: 'var(--color-urgent-text)', marginBottom: 16 }}>
          {error}
        </p>
      )}

      <PrimaryButton onClick={handleSave}>저장</PrimaryButton>
    </BottomSheet>
  );
}
