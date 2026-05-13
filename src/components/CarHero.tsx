interface Props {
  carId: string;
  carName: string;
  currentMileage: number | null;
  onEditClick: () => void;
}

function getCarImagePath(carId: string): string {
  const base = carId.replace(/-(?:gasoline|diesel)$/, '');
  return `/cars/images/${base}.png`;
}

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CarHero({ carId, carName, currentMileage, onEditClick }: Props) {
  const imagePath = getCarImagePath(carId);

  return (
    <section aria-label="내 차량">
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 16,
          padding: 16,
          minHeight: 96,
        }}
      >
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: 'calc(100% - 130px)',
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 4,
              fontFamily: 'var(--font)',
            }}
          >
            내 차량
          </p>

          <p
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              lineHeight: 1.3,
              marginBottom: 6,
              fontFamily: 'var(--font)',
            }}
          >
            {carName || ' '}
          </p>

          {currentMileage !== null ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <p
                aria-label={`현재 주행거리 ${currentMileage.toLocaleString()}킬로미터`}
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.1,
                  letterSpacing: '-0.5px',
                  fontVariantNumeric: 'tabular-nums',
                  fontFamily: 'var(--font)',
                }}
              >
                {currentMileage.toLocaleString()}
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    letterSpacing: 0,
                    marginLeft: 2,
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  km
                </span>
              </p>
              <button
                type="button"
                onClick={onEditClick}
                aria-label="주행거리 수정"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  flexShrink: 0,
                }}
              >
                <PencilIcon />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onEditClick}
              aria-label="주행거리 입력"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 2,
                padding: '7px 12px',
                border: '1.5px solid var(--color-nav-active)',
                borderRadius: 8,
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--color-nav-active)',
                fontFamily: 'var(--font)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <PencilIcon />
              주행거리 입력하기
            </button>
          )}
        </div>

        <img
          src={imagePath}
          alt={carName}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: 160,
            height: 96,
            objectFit: 'contain',
            objectPosition: 'right bottom',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />
      </div>
    </section>
  );
}
