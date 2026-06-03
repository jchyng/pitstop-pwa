import type { ReactNode } from 'react';

interface Props {
  id: string;
  label: string;
  children: ReactNode;
  marginBottom?: number;
}

export default function FormField({ id, label, children, marginBottom = 14 }: Props) {
  return (
    <div style={{ marginBottom }}>
      <label
        htmlFor={id}
        style={{
          display: 'block',
          fontSize: 12,
          color: 'var(--color-text-muted)',
          marginBottom: 6,
          fontWeight: 500,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
