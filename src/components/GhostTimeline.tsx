type GhostEntry = {
  action: string;
  date: string;
  mileage: string;
  category?: string;
  isRecent: boolean;
};

type GhostGroup = {
  month: string;
  entries: GhostEntry[];
};

const GHOST_FULL: GhostGroup[] = [
  {
    month: '2025년 11월',
    entries: [
      { action: '엔진오일 교체', date: '2025.11.12', mileage: '45,230 km', category: '엔진', isRecent: true },
    ],
  },
  {
    month: '2025년 9월',
    entries: [
      { action: '에어클리너 교체', date: '2025.09.04', mileage: '43,100 km', category: '엔진', isRecent: false },
      { action: '브레이크패드 교체', date: '2025.09.01', mileage: '42,800 km', category: '제동', isRecent: false },
    ],
  },
];

const GHOST_ITEM: GhostGroup[] = [
  {
    month: '2025년 11월',
    entries: [
      { action: '교체 완료', date: '2025.11.12', mileage: '45,230 km', isRecent: true },
    ],
  },
  {
    month: '2025년 4월',
    entries: [
      { action: '교체 완료', date: '2025.04.18', mileage: '37,500 km', isRecent: false },
    ],
  },
];

export default function GhostTimeline({ variant = 'full' }: { variant?: 'full' | 'item' }) {
  const groups = variant === 'full' ? GHOST_FULL : GHOST_ITEM;

  return (
    <ul
      aria-hidden="true"
      style={{ listStyle: 'none', padding: 0, opacity: 0.3, pointerEvents: 'none', userSelect: 'none' }}
    >
      {groups.map((group, groupIdx) => {
        const isLastGroup = groupIdx === groups.length - 1;
        return (
          <li key={group.month}>
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
                {group.month}
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            </div>

            {group.entries.map((entry, entryIdx) => {
              const isLast = isLastGroup && entryIdx === group.entries.length - 1;
              return (
                <div
                  key={entryIdx}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 14, paddingBottom: 18 }}
                >
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
                        background: entry.isRecent ? 'var(--color-nav-active)' : 'var(--color-border)',
                        border: '2px solid var(--color-surface)',
                        boxShadow: `0 0 0 1.5px ${entry.isRecent ? 'var(--color-nav-active)' : 'var(--color-border)'}`,
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
                          {entry.action}
                        </span>
                        {entry.isRecent && (
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
                      </div>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--color-text-primary)',
                          fontVariantNumeric: 'tabular-nums',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {entry.mileage}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{entry.date}</span>
                      {variant === 'full' && entry.category && (
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
                  </div>
                </div>
              );
            })}
          </li>
        );
      })}
    </ul>
  );
}
