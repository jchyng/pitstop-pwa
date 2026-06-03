'use client';

import { useState } from 'react';
import type { ExpenseCategory } from '@/types';
import { addExpense } from '@/lib/storage';
import { EXPENSE_CATEGORIES } from '@/lib/expenseCategories';
import BottomSheet from '@/components/BottomSheet';
import SheetHeader from '@/components/SheetHeader';
import PrimaryButton from '@/components/PrimaryButton';

interface Props {
  carId: string;
  onSave: () => void;
  onClose: () => void;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

export default function ExpenseSheet({ carId, onSave, onClose }: Props) {
  const [category, setCategory] = useState<ExpenseCategory>('fuel');
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');

  const annualCats = EXPENSE_CATEGORIES.filter(c => c.isAnnual);
  const variableCats = EXPENSE_CATEGORIES.filter(c => !c.isAnnual);
  const canSave = !!date && Number(amountStr.replace(/,/g, '')) > 0;

  function handleSave() {
    if (!canSave) return;
    const amount = Number(amountStr.replace(/,/g, ''));
    addExpense(carId, {
      id: Date.now().toString(),
      carId,
      category,
      amount,
      date,
      note: note.trim() || undefined,
    });
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

  return (
    <BottomSheet onClose={onClose} ariaLabel="지출 추가">
      <SheetHeader title="지출 추가" onClose={onClose} marginBottom={20} />

      {/* 연 1회 */}
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8, letterSpacing: '0.04em' }}>연 1회</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {annualCats.map(c => (
          <button key={c.value} onClick={() => setCategory(c.value)} style={chipStyle(category === c.value)}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* 수시 지출 */}
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8, letterSpacing: '0.04em' }}>수시 지출</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {variableCats.map(c => (
          <button key={c.value} onClick={() => setCategory(c.value)} style={chipStyle(category === c.value)}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <div style={{ height: 1, background: 'var(--color-border)', marginBottom: 20 }} />

      {/* 금액 */}
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="exp-amount" style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 500 }}>
          금액
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="exp-amount"
            type="number"
            value={amountStr}
            onChange={e => setAmountStr(e.target.value)}
            placeholder="0"
            inputMode="numeric"
            style={{ ...sheetInputStyle, paddingRight: 36 }}
          />
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: 14, pointerEvents: 'none' }}>
            원
          </span>
        </div>
      </div>

      {/* 날짜 */}
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="exp-date" style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 500 }}>
          날짜
        </label>
        <input id="exp-date" type="date" value={date} onChange={e => setDate(e.target.value)} style={sheetInputStyle} />
      </div>

      {/* 메모 */}
      <div style={{ marginBottom: 24 }}>
        <label htmlFor="exp-note" style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 500 }}>
          메모 (선택)
        </label>
        <textarea
          id="exp-note"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="예: 삼성화재 갱신"
          rows={2}
          style={{ ...sheetInputStyle, resize: 'none', lineHeight: 1.5 }}
        />
      </div>

      <PrimaryButton onClick={handleSave} disabled={!canSave}>저장</PrimaryButton>
    </BottomSheet>
  );
}
