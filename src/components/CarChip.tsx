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
  const mileageText = currentMileage !== null
    ? `${currentMileage.toLocaleString()}km`
    : '주행거리 미입력';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <select
        value={selectedCarId}
        onChange={e => onSelect(e.target.value)}
        aria-label="차량 선택"
        style={{
          padding: '8px 28px 8px 12px',
          border: '1.5px solid var(--color-border)',
          borderRadius: 24,
          background: 'var(--color-surface)',
          minHeight: 44,
          fontSize: 13,
          fontWeight: 500,
          fontFamily: 'var(--font)',
          color: 'var(--color-text-primary)',
          cursor: 'pointer',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%23888' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
        }}
      >
        {cars.map(car => (
          <option key={car.car_id} value={car.car_id}>{car.name_ko}</option>
        ))}
      </select>
      <span style={{ fontSize: 13, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
        {mileageText}
      </span>
    </div>
  );
}
