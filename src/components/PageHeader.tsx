import type { ReactNode, CSSProperties } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  carLabel?: string;
  onCarClick?: () => void;
  sticky?: boolean;
}

const pillBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: 13,
  fontWeight: 600,
  padding: '6px 12px',
  borderRadius: 24,
  background: 'var(--color-surface)',
  color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border)',
  fontFamily: 'var(--font)',
  whiteSpace: 'nowrap',
};

export default function PageHeader({ title, carLabel, onCarClick, sticky }: PageHeaderProps) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px var(--page-pad) 14px',
        ...(sticky ? { position: 'sticky', top: 0, background: 'var(--color-bg)', zIndex: 10 } : {}),
      }}
    >
      <h1
        style={{
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: '-0.5px',
          userSelect: 'none',
        }}
      >
        {title}
      </h1>
      {carLabel && (
        onCarClick ? (
          <button
            type="button"
            onClick={onCarClick}
            aria-label={`차량 변경: ${carLabel}`}
            style={{ ...pillBase, cursor: 'pointer' }}
          >
            {carLabel}
          </button>
        ) : (
          <span
            aria-label={`선택된 차량: ${carLabel}`}
            style={pillBase}
          >
            {carLabel}
          </span>
        )
      )}
    </header>
  );
}
