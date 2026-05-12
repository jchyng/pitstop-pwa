interface CarOption {
  car_id: string;
  name_ko: string;
}

interface Props {
  cars: CarOption[];
  selectedCarId: string;
  currentMileage: number | null;
  onSelect: (carId: string) => void;
}

export default function CarChip({ cars, selectedCarId, currentMileage, onSelect }: Props) {
  const selected = cars.find(c => c.car_id === selectedCarId);

  function handleClick() {
    const idx = cars.findIndex(c => c.car_id === selectedCarId);
    const next = cars[(idx + 1) % cars.length];
    onSelect(next.car_id);
  }

  const mileageText = currentMileage !== null
    ? `${currentMileage.toLocaleString()}km`
    : '주행거리 미입력';

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`선택된 차량: ${selected?.name_ko ?? ''}, ${mileageText}. 차량 변경`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '8px 12px',
        border: '1.5px solid var(--color-border)',
        borderRadius: 24,
        background: 'var(--color-surface)',
        minHeight: 44,
        fontSize: 13,
        fontWeight: 500,
        fontFamily: 'var(--font)',
        whiteSpace: 'nowrap',
        color: 'var(--color-text-primary)',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
    >
      <span aria-hidden="true">🚗</span>
      <span>{selected?.name_ko ?? '—'}</span>
      <span aria-hidden="true" style={{ color: 'var(--color-text-muted)', margin: '0 1px' }}>|</span>
      <span>{mileageText}</span>
    </button>
  );
}
