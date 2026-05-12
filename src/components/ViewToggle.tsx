interface Props {
  view: 'attention' | 'full';
  attentionCount: number;
  onChange: (view: 'attention' | 'full') => void;
}

export default function ViewToggle({ view, attentionCount, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="보기 방식 선택"
      style={{
        display: 'flex',
        borderBottom: '1px solid var(--color-border)',
        marginBottom: 20,
        gap: 0,
      }}
    >
      <button
        role="tab"
        aria-selected={view === 'full'}
        aria-controls="view-all"
        type="button"
        onClick={() => onChange('full')}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '10px 4px 11px',
          border: 'none',
          borderBottom: view === 'full' ? '2px solid var(--color-nav-active)' : '2px solid transparent',
          background: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font)',
          fontSize: 14,
          fontWeight: view === 'full' ? 700 : 400,
          color: view === 'full' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          transition: 'color 0.15s',
          marginBottom: -1,
          whiteSpace: 'nowrap',
        }}
      >
        전체보기
      </button>

      <button
        role="tab"
        aria-selected={view === 'attention'}
        aria-controls="view-attention"
        type="button"
        onClick={() => onChange('attention')}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '10px 4px 11px',
          border: 'none',
          borderBottom: view === 'attention' ? '2px solid var(--color-nav-active)' : '2px solid transparent',
          background: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font)',
          fontSize: 14,
          fontWeight: view === 'attention' ? 700 : 400,
          color: view === 'attention' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          transition: 'color 0.15s',
          marginBottom: -1,
          whiteSpace: 'nowrap',
        }}
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
              padding: '0 5px',
              borderRadius: 9,
              fontSize: 10.5,
              fontWeight: 700,
              background: 'var(--color-nav-active)',
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
