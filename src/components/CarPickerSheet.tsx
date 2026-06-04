'use client';

import BottomSheet from './BottomSheet';
import type { CarIndex } from '@/types';

interface Props {
  carList: CarIndex[];
  selectedCarId: string;
  onSelect: (carId: string) => void;
  onClose: () => void;
}

export default function CarPickerSheet({ carList, selectedCarId, onSelect, onClose }: Props) {
  return (
    <BottomSheet onClose={onClose} ariaLabel="차량 선택">
      <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.3px', marginBottom: 16 }}>
        차량 선택
      </p>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 0, margin: 0, listStyle: 'none' }}>
        {carList.map(car => {
          const active = car.car_id === selectedCarId;
          return (
            <li key={car.car_id}>
              <button
                type="button"
                onClick={() => { onSelect(car.car_id); onClose(); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: active ? '1.5px solid var(--color-nav-active)' : '1.5px solid transparent',
                  background: active ? 'color-mix(in srgb, var(--color-nav-active) 8%, transparent)' : 'var(--color-surface)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font)',
                  textAlign: 'left',
                  transition: 'background 0.12s',
                }}
              >
                <span style={{
                  fontSize: 15,
                  fontWeight: active ? 700 : 500,
                  color: active ? 'var(--color-nav-active)' : 'var(--color-text-primary)',
                }}>
                  {car.name_ko}
                </span>
                {active && (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M4 9l4 4 6-7" stroke="var(--color-nav-active)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );
}
