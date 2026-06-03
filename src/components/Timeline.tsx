import type { LogEntry } from '@/types';
import { CONDITION_COLORS, CONDITION_LABEL } from '@/lib/conditionColors';

function formatDate(iso: string): string {
  return iso.replace(/-/g, '.');
}

interface Props {
  grouped: [string, LogEntry[]][];
  mostRecentId: string | null;
  showItemName?: boolean;
  showCategory?: boolean;
  onEntryClick?: (entry: LogEntry) => void;
  onEditEntry?: (entry: LogEntry) => void;
}

export default function Timeline({
  grouped,
  mostRecentId,
  showItemName = false,
  showCategory = false,
  onEntryClick,
  onEditEntry,
}: Props) {
  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {grouped.map(([monthLabel, entries], groupIdx) => (
        <li key={monthLabel}>
          {/* Month header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: groupIdx === 0 ? '2px 0 10px' : '18px 0 10px',
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-nav-active)',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}
            >
              {monthLabel}
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          </div>

          {entries.map((entry, entryIdx) => {
            const isLast = groupIdx === grouped.length - 1 && entryIdx === entries.length - 1;
            const isRecent = entry.id === mostRecentId;
            const actionLabel = entry.logType === 'inspect'
              ? (showItemName ? `${entry.itemName} 점검` : '점검 완료')
              : (showItemName ? `${entry.itemName} 교체` : '교체 완료');
            const conditionLabel =
              entry.logType === 'inspect' && entry.condition
                ? CONDITION_LABEL[entry.condition]
                : null;
            const conditionColor = entry.condition
              ? CONDITION_COLORS[entry.condition]
              : CONDITION_COLORS.good;
            const clickable = !!onEntryClick;

            return (
              <div
                key={entry.id}
                onClick={clickable ? () => onEntryClick(entry) : undefined}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                aria-label={clickable ? `${entry.itemName} 상세 보기` : undefined}
                onKeyDown={clickable
                  ? e => { if (e.key === 'Enter' || e.key === ' ') onEntryClick(entry); }
                  : undefined
                }
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  paddingBottom: 18,
                  cursor: clickable ? 'pointer' : 'default',
                }}
              >
                {/* Timeline axis */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flexShrink: 0,
                    width: 20,
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: isRecent ? 'var(--color-nav-active)' : 'var(--color-border)',
                      border: '2px solid var(--color-surface)',
                      boxShadow: `0 0 0 1.5px ${isRecent ? 'var(--color-nav-active)' : 'var(--color-border)'}`,
                      marginTop: 5,
                      flexShrink: 0,
                    }}
                  />
                  {!isLast && (
                    <div
                      style={{
                        width: 1.5,
                        flex: 1,
                        background: 'var(--color-border)',
                        minHeight: 18,
                        marginTop: 4,
                      }}
                    />
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        minWidth: 0,
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {actionLabel}
                      </span>
                      {isRecent && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 7px',
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 600,
                            background: 'var(--color-normal-bg)',
                            color: 'var(--color-normal-text)',
                            flexShrink: 0,
                          }}
                        >
                          최근
                        </span>
                      )}
                      {conditionLabel && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 7px',
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 600,
                            background: conditionColor.bg,
                            color: conditionColor.fg,
                            flexShrink: 0,
                          }}
                        >
                          {conditionLabel}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      {entry.mileage !== null && (
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: 'var(--color-text-primary)',
                            fontVariantNumeric: 'tabular-nums',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {entry.mileage.toLocaleString()} km
                        </span>
                      )}
                      {!!onEditEntry && (
                        <button
                          onClick={e => { e.stopPropagation(); onEditEntry(entry); }}
                          aria-label={`${entry.itemName} 기록 수정`}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            color: 'var(--color-text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                              d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                      {formatDate(entry.date)}
                    </span>
                    {showCategory && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: 'var(--color-text-muted)',
                          background: 'var(--color-surface-hover)',
                          padding: '2px 7px',
                          borderRadius: 8,
                        }}
                      >
                        {entry.category}
                      </span>
                    )}
                  </div>

                  {entry.note && (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 12.5,
                        color: 'var(--color-text-muted)',
                        background: 'var(--color-surface-hover)',
                        borderRadius: 8,
                        padding: '6px 10px',
                        lineHeight: 1.5,
                      }}
                    >
                      {entry.note}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </li>
      ))}
    </ul>
  );
}
