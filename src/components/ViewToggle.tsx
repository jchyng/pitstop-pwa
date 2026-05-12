interface Props {
  view: 'attention' | 'full';
  attentionCount: number;
  onChange: (view: 'attention' | 'full') => void;
}

export default function ViewToggle({ view, attentionCount, onChange }: Props) {
  const btnBase: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '8px 10px',
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 500,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font)',
    minHeight: 38,
    whiteSpace: 'nowrap' as const,
    transition: 'background 0.15s, color 0.15s',
  };

  const activeStyle: React.CSSProperties = {
    background: 'var(--color-text-primary)',
    color: 'var(--color-bg)',
  };
  const inactiveStyle: React.CSSProperties = {
    color: 'var(--color-text-secondary)',
  };

  return (
    <div
      role="tablist"
      aria-label="보기 방식 선택"
      style={{
        display: 'flex',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-toggle)',
        padding: 3,
        gap: 2,
        marginBottom: 18,
      }}
    >
      <button
        role="tab"
        aria-selected={view === 'full'}
        aria-controls="view-all"
        type="button"
        onClick={() => onChange('full')}
        style={{ ...btnBase, ...(view === 'full' ? activeStyle : inactiveStyle) }}
      >
        전체보기
      </button>

      <button
        role="tab"
        aria-selected={view === 'attention'}
        aria-controls="view-attention"
        type="button"
        onClick={() => onChange('attention')}
        style={{ ...btnBase, ...(view === 'attention' ? activeStyle : inactiveStyle) }}
      >
        봐야 할 항목
        {attentionCount > 0 && (
          <span
            aria-label={`${attentionCount}개`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 18,
              height: 18,
              padding: '0 4px',
              borderRadius: 9,
              fontSize: 10.5,
              fontWeight: 700,
              background: view === 'attention'
                ? 'var(--color-nav-active)'
                : 'var(--color-text-muted)',
              color: '#fff',
              lineHeight: 1,
            }}
          >
            {attentionCount}
          </span>
        )}
      </button>
    </div>
  );
}
