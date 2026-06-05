'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface CarOption {
  car_id: string;
  name_ko: string;
}

interface Props {
  cars: CarOption[];
  selectedCarId: string;
  onSelect: (carId: string) => void;
}

export default function CarChip({ cars, selectedCarId, onSelect }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = cars.find(c => c.car_id === selectedCarId);

  useEffect(() => {
    if (!isOpen) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [isOpen]);

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setIsOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="차량 선택"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '8px 10px 8px 13px',
          border: '1.5px solid var(--color-border)',
          borderRadius: 24,
          background: 'var(--color-surface)',
          minHeight: 44,
          maxWidth: 160,
          fontSize: 13,
          fontWeight: 500,
          fontFamily: 'var(--font)',
          color: 'var(--color-text-primary)',
          cursor: 'pointer',
          overflow: 'hidden',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {selected?.name_ko ?? ''}
        </span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          color="var(--color-text-muted)"
          style={{ flexShrink: 0, transition: 'transform 0.15s', transform: isOpen ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label="차량 선택"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: 180,
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.13)',
            listStyle: 'none',
            padding: '6px 0',
            margin: 0,
            zIndex: 200,
          }}
        >
          {cars.map(car => {
            const active = car.car_id === selectedCarId;
            return (
              <li
                key={car.car_id}
                role="option"
                aria-selected={active}
                onClick={() => { onSelect(car.car_id); setIsOpen(false); }}
                style={{
                  padding: '11px 16px',
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--color-nav-active)' : 'var(--color-text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font)',
                }}
              >
                {car.name_ko}
                {active && (
                  <Check size={14} aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
