import type { ItemWithUrgency } from '@/types';
import ConsumableCard from './ConsumableCard';

interface ItemWithLog extends ItemWithUrgency {
  lastLoggedDate: string | null;
  lastLoggedMileage: number | null;
}

interface Props {
  category: string;
  items: ItemWithLog[];
  currentMileage: number | null;
}

export default function CategorySection({ category, items, currentMileage }: Props) {
  if (items.length === 0) return null;

  return (
    <section style={{ marginTop: 22 }} aria-labelledby={`sec-${category}`}>
      <p
        id={`sec-${category}`}
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--color-text-muted)',
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        {category}
      </p>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 0 }} role="list">
        {items.map(({ item, urgency, lastLoggedDate, lastLoggedMileage }) => (
          <ConsumableCard
            key={item.id}
            item={item}
            urgency={urgency}
            currentMileage={currentMileage}
            lastLoggedDate={lastLoggedDate}
            lastLoggedMileage={lastLoggedMileage}
          />
        ))}
      </ul>
    </section>
  );
}
