import type { UrgencyStatus } from '@/types';

interface Props {
  status: UrgencyStatus;
}

const config: Record<UrgencyStatus, { label: string; bg: string; text: string }> = {
  overdue:  { label: '과기한',   bg: 'var(--color-overdue-bg)',  text: 'var(--color-overdue-text)' },
  urgent:   { label: '위급',     bg: 'var(--color-urgent-bg)',   text: 'var(--color-urgent-text)' },
  ok:       { label: '정상',     bg: 'var(--color-normal-bg)',   text: 'var(--color-normal-text)' },
  unknown:  { label: '알수없음', bg: 'var(--color-surface-hover)', text: 'var(--color-text-muted)' },
};

export default function StatusChip({ status }: Props) {
  const { label, bg, text } = config[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-chip)',
        padding: '6px 14px',
        minWidth: 58,
        minHeight: 36,
        fontSize: 13,
        fontWeight: 600,
        backgroundColor: bg,
        color: text,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
