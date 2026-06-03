'use client';

import { useState } from 'react';

interface Props {
  onDelete: () => void;
  confirmMessage?: string;
}

export default function ConfirmDeleteDialog({
  onDelete,
  confirmMessage = '이 항목을 삭제할까요?',
}: Props) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        style={{
          width: '100%',
          marginTop: 10,
          padding: '12px 0',
          borderRadius: 12,
          border: '1.5px solid var(--color-border)',
          background: 'transparent',
          color: 'var(--color-overdue-sub)',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'var(--font)',
        }}
      >
        삭제
      </button>
    );
  }

  return (
    <div
      style={{
        marginTop: 10,
        padding: '14px',
        borderRadius: 12,
        border: '1.5px solid var(--color-overdue-sub)',
        background: 'var(--color-urgent-bg)',
      }}
    >
      <p
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          marginBottom: 10,
          textAlign: 'center',
        }}
      >
        {confirmMessage}
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setConfirming(false)}
          style={{
            flex: 1,
            padding: '10px 0',
            borderRadius: 10,
            border: '1.5px solid var(--color-border)',
            background: 'transparent',
            color: 'var(--color-text-secondary)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--font)',
          }}
        >
          취소
        </button>
        <button
          onClick={onDelete}
          style={{
            flex: 1,
            padding: '10px 0',
            borderRadius: 10,
            border: 'none',
            background: 'var(--color-overdue-sub)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--font)',
          }}
        >
          삭제
        </button>
      </div>
    </div>
  );
}
