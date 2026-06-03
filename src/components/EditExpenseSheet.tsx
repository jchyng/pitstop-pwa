'use client';

import { useState } from 'react';
import type { ExpenseEntry, ExpenseCategory } from '@/types';
import { updateExpense, deleteExpense } from '@/lib/storage';
import { EXPENSE_CATEGORIES } from '@/lib/expenseCategories';
import BottomSheet from '@/components/BottomSheet';
import SheetHeader from '@/components/SheetHeader';
import PrimaryButton from '@/components/PrimaryButton';
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog';

interface Props {
  entry: ExpenseEntry;
  carId: string;
  onSave: () => void;
  onClose: () => void;
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

export default function EditExpenseSheet({ entry, carId, onSave, onClose }: Props) {
  const [category, setCategory] = useState<ExpenseCategory>(entry.category);
  const [amountStr, setAmountStr] = useState(String(entry.amount));
  const [date, setDate] = useState(entry.date);
  const [note, setNote] = useState(entry.note ?? '');
  const canSave = !!date && Number(amountStr.replace(/,/g, '')) > 0;

  function handleSave() {
    if (!canSave) return;
    const amount = Number(amountStr.replace(/,/g, ''));
    updateExpense(carId, entry.id, { category, amount, date, note: note.trim() || undefined });
    onSave();
    onClose();
  }

  function handleDelete() {
    deleteExpense(carId, entry.id);
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

  const annualCats = EXPENSE_CATEGORIES.filter(c => c.isAnnual);
  const variableCats = EXPENSE_CATEGORIES.filter(c => !c.isAnnual);

  return (
    <BottomSheet onClose={onClose} ariaLabel="지출 수정">
      <SheetHeader title="지출 수정" onClose={onClose} marginBottom={20} />

      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8, letterSpacing: '0.04em' }}>연 1회</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {annualCats.map(c => (
          <button key={c.value} onClick={() => setCategory(c.value)} style={chipStyle(category === c.value)}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8, letterSpacing: '0.04em' }}>수시 지출</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {variableCats.map(c => (
          <button key={c.value} onClick={() => setCategory(c.value)} style={chipStyle(category === c.value)}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <div style={{ height: 1, background: 'var(--color-border)', marginBottom: 20 }} />

      <div style={{ marginBottom: 14 }}>
        <label htmlFor="edit-exp-amount" style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 500 }}>금액</label>
        <div style={{ position: 'relative' }}>
          <input
            id="edit-exp-amount"
            type="number"
            value={amountStr}
            onChange={e => setAmountStr(e.target.value)}
            inputMode="numeric"
            style={{ ...sheetInputStyle, paddingRight: 36 }}
          />
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: 14, pointerEvents: 'none' }}>원</span>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label htmlFor="edit-exp-date" style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 500 }}>날짜</label>
        <input id="edit-exp-date" type="date" value={date} onChange={e => setDate(e.target.value)} style={sheetInputStyle} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label htmlFor="edit-exp-note" style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 500 }}>메모 (선택)</label>
        <textarea
          id="edit-exp-note"
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={2}
          style={{ ...sheetInputStyle, resize: 'none', lineHeight: 1.5 }}
        />
      </div>

      <PrimaryButton onClick={handleSave} disabled={!canSave}>저장</PrimaryButton>
      <ConfirmDeleteDialog onDelete={handleDelete} confirmMessage="이 지출을 삭제할까요?" />
    </BottomSheet>
  );
}
