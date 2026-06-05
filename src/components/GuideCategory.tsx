import type { ConsumableItem, ManualCategoryData } from '@/types';
import GuideItemRow from './GuideItemRow';
import { FileText, ChevronDown } from 'lucide-react';

interface Props {
  category: string;
  items: ConsumableItem[];
  manualData?: ManualCategoryData;
  onEvidenceTap: () => void;
  collapsed: boolean;
  onToggle: () => void;
}

export default function GuideCategory({
  category,
  items,
  manualData,
  onEvidenceTap,
  collapsed,
  onToggle,
}: Props) {
  const hasImages = (manualData?.images.length ?? 0) > 0;

  return (
    <div style={{ marginBottom: 4 }}>
      {/* 섹션 헤더 */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onToggle()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: '10px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            flex: 1,
          }}
        >
          {category}
        </span>

        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            padding: '2px 7px',
            borderRadius: 5,
            background: 'var(--color-surface-hover)',
            color: 'var(--color-text-muted)',
            flexShrink: 0,
          }}
        >
          {items.length}개
        </span>

        {hasImages && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEvidenceTap();
            }}
            aria-label="공식 취급설명서 보기"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              background: 'transparent',
              cursor: 'pointer',
              flexShrink: 0,
              color: 'var(--color-nav-active)',
            }}
          >
            <FileText size={12} aria-hidden="true" />
            <span style={{ fontSize: 10, fontWeight: 600 }}>공식자료</span>
          </button>
        )}

        <ChevronDown
          size={14}
          aria-hidden="true"
          color="var(--color-text-muted)"
          style={{
            transition: 'transform 0.2s',
            transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        />
      </div>

      {/* 아이템 목록 */}
      {!collapsed && (
        <div
          style={{
            borderTop: '1px solid var(--color-border)',
          }}
        >
          {items.map((item, idx) => (
            <GuideItemRow
              key={item.id}
              item={item}
              hasEvidence={hasImages}
              onEvidenceTap={onEvidenceTap}
              isLast={idx === items.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
