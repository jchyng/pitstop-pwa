'use client';

import { useState } from 'react';
import BottomSheet from '@/components/BottomSheet';
import SheetHeader from '@/components/SheetHeader';
import PrimaryButton from '@/components/PrimaryButton';
import FormField from '@/components/FormField';
import { sheetInputStyle } from '@/lib/sheetStyles';

interface Props {
  onSave: (name: string) => void;
  onClose: () => void;
}

export default function AddCustomItemSheet({ onSave, onClose }: Props) {
  const [name, setName] = useState('');

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
    onClose();
  }

  return (
    <BottomSheet onClose={onClose} ariaLabel="항목 추가">
      <SheetHeader title="항목 추가" onClose={onClose} />
      <FormField id="custom-item-name" label="항목 이름">
        <input
          id="custom-item-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="예: 와이퍼 블레이드"
          maxLength={30}
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
          style={sheetInputStyle}
        />
      </FormField>
      <div style={{ marginTop: 24 }}>
        <PrimaryButton disabled={!name.trim()} onClick={handleSave}>
          추가
        </PrimaryButton>
      </div>
    </BottomSheet>
  );
}
