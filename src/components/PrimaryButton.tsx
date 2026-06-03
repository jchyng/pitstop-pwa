interface Props {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export default function PrimaryButton({ onClick, disabled = false, children, style }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '15px 0',
        borderRadius: 12,
        border: 'none',
        background: disabled ? 'var(--color-border)' : 'var(--color-text-primary)',
        color: disabled ? 'var(--color-text-muted)' : 'var(--color-bg)',
        fontSize: 16,
        fontWeight: 700,
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'var(--font)',
        transition: 'background 0.12s',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
