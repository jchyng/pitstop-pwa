interface Props {
  title: React.ReactNode;
  onClose: () => void;
  marginBottom?: number;
}

export default function SheetHeader({ title, onClose, marginBottom = 20 }: Props) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)' }}>
        {title}
      </div>
      <button
        onClick={onClose}
        aria-label="닫기"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 22,
          lineHeight: 1,
          color: 'var(--color-text-muted)',
          padding: '0 2px',
          fontFamily: 'var(--font)',
        }}
      >
        ×
      </button>
    </div>
  );
}
