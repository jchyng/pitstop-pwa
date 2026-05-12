import type { ConsumableItem, UrgencyResult, LogType } from '@/types';

interface Props {
  item: ConsumableItem;
  urgency: UrgencyResult;
  currentMileage: number | null;
  lastLoggedDate: string | null;
  lastLoggedMileage: number | null;
  lastLogType: LogType | null;
  onClick: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

function buildNextKmText(item: ConsumableItem, lastKm: number | null): string {
  if (item.interval_km === null) return '';
  if (lastKm === null) return `권장 ${item.interval_km.toLocaleString()}km 주기`;
  const next = lastKm + item.interval_km;
  const max = lastKm + (item.max_km ?? item.interval_km);
  if (item.max_km && item.max_km !== item.interval_km) {
    return `권장 ${next.toLocaleString()}km — 마지노선 ${max.toLocaleString()}km`;
  }
  return `권장 ${next.toLocaleString()}km`;
}

function parseStatDisplay(displayText: string): { num: string; unit: string } {
  if (displayText === '미기록') return { num: '—', unit: '미기록' };
  if (displayText === '—') return { num: '—', unit: '' };

  const spaceIdx = displayText.search(/\s/);
  if (spaceIdx === -1) {
    // "N개월 남음" / "N개월 초과" — no leading space
    const m = displayText.match(/^(\d+)(개월.+)$/);
    if (m) return { num: m[1], unit: m[2] };
    return { num: displayText, unit: '' };
  }
  return { num: displayText.slice(0, spaceIdx), unit: displayText.slice(spaceIdx + 1) };
}

export default function ConsumableCard({
  item,
  urgency,
  lastLoggedDate,
  lastLoggedMileage,
  lastLogType,
  onClick,
}: Props) {
  const { status, displayText } = urgency;
  const { num, unit } = parseStatDisplay(displayText);

  const isOverdue = status === 'overdue';
  const isUrgent = status === 'urgent';
  const isUnknown = status === 'unknown';

  const cardBorder = isOverdue
    ? 'rgba(185, 28, 28, 0.2)'
    : 'var(--color-border)';

  const statColor = isOverdue
    ? 'var(--color-overdue-sub)'
    : isUrgent
    ? 'var(--color-urgent-text)'
    : isUnknown
    ? 'var(--color-text-muted)'
    : 'var(--color-text-primary)';

  const metaColor = isOverdue
    ? 'var(--color-overdue-sub)'
    : isUrgent
    ? 'var(--color-urgent-text)'
    : 'var(--color-text-secondary)';

  const nextKmText = buildNextKmText(item, lastLoggedMileage);

  return (
    <li style={{ listStyle: 'none' }}>
      <div
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'stretch',
          background: 'var(--color-surface)',
          border: `1px solid ${cardBorder}`,
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        role="button"
        tabIndex={0}
        aria-label={`${item.name_ko} 기록하기`}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      >
        {/* Body */}
        <div style={{ flex: 1, minWidth: 0, padding: '12px 6px 12px 15px' }}>
          <p
            style={{
              fontSize: 15,
              fontWeight: 600,
              lineHeight: 1.3,
              marginBottom: 5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'var(--color-text-primary)',
            }}
          >
            {item.name_ko}
          </p>

          {/* Last service line */}
          {lastLoggedDate ? (
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
              {lastLogType === 'inspect' ? '점검' : '교체'} {formatDate(lastLoggedDate)}
              {lastLoggedMileage !== null ? ` · ${lastLoggedMileage.toLocaleString()}km` : ''}
            </p>
          ) : (
            <p
              style={{
                fontSize: 12,
                color: 'var(--color-text-muted)',
                fontStyle: 'italic',
                lineHeight: 1.55,
              }}
            >
              기록 없음
            </p>
          )}

          {/* Next service line */}
          {nextKmText ? (
            <p
              style={{
                fontSize: 12,
                color: metaColor,
                lineHeight: 1.55,
                fontWeight: (isOverdue || isUrgent) ? 500 : 400,
              }}
            >
              {nextKmText}
            </p>
          ) : null}
        </div>

        {/* Stat */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '12px 14px 12px 6px',
            flexShrink: 0,
            minWidth: 80,
            textAlign: 'right',
          }}
        >
          <span
            style={{
              fontSize: isUnknown ? 22 : 20,
              fontWeight: isUnknown ? 300 : 700,
              lineHeight: 1.1,
              letterSpacing: '-0.5px',
              fontVariantNumeric: 'tabular-nums',
              color: statColor,
            }}
          >
            {num}
          </span>
          {unit && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                marginTop: 2,
                whiteSpace: 'nowrap',
                color: isUnknown ? 'var(--color-text-muted)' : statColor,
              }}
            >
              {unit}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
