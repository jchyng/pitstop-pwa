interface Props {
  overdueCount: number;
  urgentCount: number;
}

export default function AlertBanner({ overdueCount, urgentCount }: Props) {
  if (overdueCount === 0 && urgentCount === 0) return null;

  const parts: string[] = [];
  if (overdueCount > 0) parts.push(`과기한 ${overdueCount}건`);
  if (urgentCount > 0) parts.push(`교체 임박 ${urgentCount}건`);

  return (
    <div
      role="alert"
      style={{
        border: '1px solid var(--color-alert-border)',
        borderRadius: 'var(--radius-alert)',
        padding: '12px 14px',
        marginBottom: 20,
        background: 'var(--color-alert-bg)',
        color: 'var(--color-alert-text)',
        fontSize: 14,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span aria-hidden="true">⚠️</span>
      <span>{parts.join(' · ')} 확인이 필요합니다.</span>
    </div>
  );
}
