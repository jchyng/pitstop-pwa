import type { ItemWithUrgency, LogType, InspectCondition } from '@/types';
import ConsumableCard from './ConsumableCard';

interface ItemWithLog extends ItemWithUrgency {
  lastLoggedDate: string | null;
  lastLoggedMileage: number | null;
  lastLogType: LogType | null;
  lastInspectCondition: InspectCondition | null;
  lastReplaceDate: string | null;
  lastReplaceMileage: number | null;
  isCustom: boolean;
}

interface Props {
  category: string;
  items: ItemWithLog[];
  currentMileage: number | null;
  onCardClick: (item: ItemWithLog) => void;
  onHide: (item: ItemWithLog) => void;
  showSwipeHint?: boolean;
}

export default function CategorySection({ category, items, currentMileage, onCardClick, onHide, showSwipeHint }: Props) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby={`sec-${category}`}>
      <p
        id={`sec-${category}`}
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        {category}
      </p>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 0 }} role="list">
        {items.map((x, i) => (
          <ConsumableCard
            key={x.item.id}
            item={x.item}
            urgency={x.urgency}
            currentMileage={currentMileage}
            lastLoggedDate={x.lastLoggedDate}
            lastLoggedMileage={x.lastLoggedMileage}
            lastLogType={x.lastLogType}
            lastInspectCondition={x.lastInspectCondition}
            lastReplaceDate={x.lastReplaceDate}
            lastReplaceMileage={x.lastReplaceMileage}
            isCustom={x.isCustom}
            onClick={() => onCardClick(x)}
            onHide={() => onHide(x)}
            demoSwipe={showSwipeHint && i === 0}
          />
        ))}
      </ul>
    </section>
  );
}
