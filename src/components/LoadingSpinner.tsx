export default function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: '2.5px solid var(--color-border)',
        borderTop: '2.5px solid var(--color-nav-active)',
        borderRadius: '50%',
        animation: 'pitstop-spin 0.75s linear infinite',
        flexShrink: 0,
      }}
    />
  );
}
