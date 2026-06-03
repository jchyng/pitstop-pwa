import { sheetInputStyle } from '@/lib/sheetStyles';

interface Props {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function CurrencyInput({ id, value, onChange, placeholder = '0' }: Props) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode="numeric"
        style={{ ...sheetInputStyle, paddingRight: 36 }}
      />
      <span
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--color-text-muted)',
          fontSize: 14,
          pointerEvents: 'none',
        }}
      >
        원
      </span>
    </div>
  );
}
