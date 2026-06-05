import type { ConsumableItem } from '@/types';
import { buildIntervalText } from '@/lib/itemUtils';
import { FileText } from 'lucide-react';

interface Props {
  item: ConsumableItem;
  hasEvidence: boolean;
  onEvidenceTap: () => void;
  isLast: boolean;
}

export default function GuideItemRow({ item, hasEvidence, onEvidenceTap, isLast }: Props) {
  const intervalText = buildIntervalText(item);
  const isInspect = item.behavior === 'inspect_only';
  const showMaxKm =
    item.max_km != null &&
    item.interval_km != null &&
    item.max_km !== item.interval_km;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '11px 0',
        borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
        minHeight: 44,
      }}
    >
      {/* 이름 + 배지 + notes */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.2px',
            }}
          >
            {item.name_ko}
          </span>
          {isInspect && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: 5,
                background: 'var(--color-surface-hover)',
                color: 'var(--color-text-muted)',
                flexShrink: 0,
              }}
            >
              점검
            </span>
          )}
        </div>
        {item.notes && (
          <div
            style={{
              fontSize: 11,
              color: 'var(--color-text-muted)',
              marginTop: 2,
              lineHeight: 1.45,
            }}
          >
            {item.notes}
          </div>
        )}
        {item.manual_spec && !item.notes && (
          <div
            style={{
              fontSize: 11,
              color: 'var(--color-text-muted)',
              marginTop: 2,
              lineHeight: 1.45,
            }}
          >
            {item.manual_spec}
          </div>
        )}
      </div>

      {/* 주기 텍스트 */}
      <div
        style={{
          textAlign: 'right',
          flexShrink: 0,
          maxWidth: 120,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: intervalText ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            letterSpacing: '-0.2px',
            lineHeight: 1.4,
          }}
        >
          {intervalText || '—'}
        </div>
        {showMaxKm && (
          <div
            style={{
              fontSize: 10,
              color: 'var(--color-text-muted)',
              marginTop: 1,
            }}
          >
            마지노선 {item.max_km!.toLocaleString()}km
          </div>
        )}
      </div>

      {/* 매뉴얼 증거 버튼 */}
      {hasEvidence && (
        <button
          onClick={onEvidenceTap}
          aria-label="공식 자료 보기"
          style={{
            width: 30,
            height: 30,
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: 'var(--color-text-secondary)',
          }}
        >
          <FileText size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
