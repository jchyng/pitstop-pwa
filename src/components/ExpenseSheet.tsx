'use client';

import { useState } from 'react';
import type { ExpenseCategory } from '@/types';
import { addExpense, getRecentLabels, addRecentLabel } from '@/lib/storage';
import { EXPENSE_CATEGORIES } from '@/lib/expenseCategories';
import BottomSheet from '@/components/BottomSheet';
import SheetHeader from '@/components/SheetHeader';
import PrimaryButton from '@/components/PrimaryButton';
import FormField from '@/components/FormField';
import CurrencyInput from '@/components/CurrencyInput';
import { todayISO } from '@/lib/dateUtils';
import { sheetInputStyle } from '@/lib/sheetStyles';

interface Props {
  carId: string;
  onSave: () => void;
  onClose: () => void;
}


export default function ExpenseSheet({ carId, onSave, onClose }: Props) {
  const [category, setCategory] = useState<ExpenseCategory>('fuel');
  const [customLabel, setCustomLabel] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');

  const annualCats = EXPENSE_CATEGORIES.filter(c => c.isAnnual);
  const variableCats = EXPENSE_CATEGORIES.filter(c => !c.isAnnual);
  const recentLabels = getRecentLabels(carId).slice(0, 5);
  const canSave =
    !!date &&
    Number(amountStr.replace(/,/g, '')) > 0 &&
    (category !== 'other' || customLabel.trim() !== '');

  function handleCategoryChange(val: ExpenseCategory) {
    setCategory(val);
    if (val !== 'other') setCustomLabel('');
  }

  function handleSave() {
    if (!canSave) return;
    const amount = Number(amountStr.replace(/,/g, ''));
    const label = category === 'other' ? customLabel.trim() : undefined;
    addExpense(carId, {
      id: Date.now().toString(),
      carId,
      category,
      amount,
      date,
      note: note.trim() || undefined,
      customLabel: label,
    });
    if (label) addRecentLabel(carId, label);
    onSave();
    onClose();
  }

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 14px',
    borderRadius: 10,
    border: `1.5px solid ${active ? 'var(--color-nav-active)' : 'var(--color-border)'}`,
    background: active ? 'var(--color-nav-active)' : 'transparent',
    color: active ? '#fff' : 'var(--color-text-secondary)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font)',
    transition: 'all 0.12s',
    whiteSpace: 'nowrap' as const,
  });

  const recentChipStyle: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: 20,
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text-secondary)',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'var(--font)',
    whiteSpace: 'nowrap' as const,
  };

  return (
    <BottomSheet onClose={onClose} ariaLabel="지출 추가">
      <SheetHeader title="지출 추가" onClose={onClose} marginBottom={20} />

      {/* 연 1회 */}
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8, letterSpacing: '0.04em' }}>연 1회</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {annualCats.map(c => (
          <button key={c.value} onClick={() => handleCategoryChange(c.value)} style={chipStyle(category === c.value)}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* 수시 지출 */}
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8, letterSpacing: '0.04em' }}>수시 지출</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: category === 'other' ? 12 : 20, flexWrap: 'wrap' }}>
        {variableCats.map(c => (
          <button key={c.value} onClick={() => handleCategoryChange(c.value)} style={chipStyle(category === c.value)}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* 직접 입력 영역 */}
      {category === 'other' && (
        <div style={{ marginBottom: 20 }}>
          {recentLabels.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {recentLabels.map(label => (
                <button key={label} onClick={() => setCustomLabel(label)} style={recentChipStyle}>
                  {label}
                </button>
              ))}
            </div>
          )}
          <input
            type="text"
            value={customLabel}
            onChange={e => setCustomLabel(e.target.value)}
            placeholder="항목 이름 입력 (예: 세차비, 주차비)"
            style={{ ...sheetInputStyle, width: '100%', boxSizing: 'border-box' }}
            autoFocus
          />
        </div>
      )}

      <div style={{ height: 1, background: 'var(--color-border)', marginBottom: 20 }} />

      <FormField id="exp-amount" label="금액">
        <CurrencyInput id="exp-amount" value={amountStr} onChange={setAmountStr} />
      </FormField>

      <FormField id="exp-date" label="날짜">
        <input id="exp-date" type="date" value={date} onChange={e => setDate(e.target.value)} style={sheetInputStyle} />
      </FormField>

      <FormField id="exp-note" label="메모 (선택)" marginBottom={24}>
        <textarea id="exp-note" value={note} onChange={e => setNote(e.target.value)} placeholder="예: 삼성화재 갱신" rows={2} style={{ ...sheetInputStyle, resize: 'none', lineHeight: 1.5 }} />
      </FormField>

      <PrimaryButton onClick={handleSave} disabled={!canSave}>저장</PrimaryButton>
    </BottomSheet>
  );
}
