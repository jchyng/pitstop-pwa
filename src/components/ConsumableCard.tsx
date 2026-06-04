'use client';

import { useState } from 'react';
import type { ConsumableItem, UrgencyResult, LogType, InspectCondition } from '@/types';
import { CONDITION_COLORS, CONDITION_LABEL } from '@/lib/conditionColors';
import { relativeDate, formatDate } from '@/lib/dateUtils';
import { buildIntervalText } from '@/lib/itemUtils';

interface Props {
  item: ConsumableItem;
  urgency: UrgencyResult;
  currentMileage: number | null;
  lastLoggedDate: string | null;
  lastLoggedMileage: number | null;
  lastLogType: LogType | null;
  lastInspectCondition?: InspectCondition | null;
  lastReplaceDate?: string | null;
  lastReplaceMileage?: number | null;
  isCustom?: boolean;
  onClick: () => void;
}


const BADGE_BASE: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  padding: '2px 6px',
  borderRadius: 8,
  flexShrink: 0,
  whiteSpace: 'nowrap',
};

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return formatDate(iso);
}

function buildRecentValue(lastKm: number | null, lastDate: string | null): string | null {
  if (lastKm === null && lastDate === null) return null;
  const parts: string[] = [];
  if (lastDate) parts.push(relativeDate(lastDate));
  if (lastKm !== null) parts.push(`${lastKm.toLocaleString()}km`);
  return parts.join(' · ');
}


function parseStatDisplay(displayText: string): { num: string; unit: string } {
  if (displayText === '미기록') return { num: '—', unit: '미기록' };
  if (displayText === '—') return { num: '—', unit: '' };

  const spaceIdx = displayText.search(/\s/);
  if (spaceIdx === -1) {
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
  lastInspectCondition,
  lastReplaceDate,
  lastReplaceMileage,
  isCustom,
  onClick,
}: Props) {
  const [pressed, setPressed] = useState(false);
  const { status, displayText } = urgency;
  const { num, unit: rawUnit } = parseStatDisplay(displayText);
  const isInspectItem = item.behavior !== 'replace_only';
  const unit = isInspectItem
    ? rawUnit.replace('km 남음', 'km 후 점검').replace('개월 남음', '개월 후 점검')
    : rawUnit;

  const isOverdue = status === 'overdue';
  const isCaution = status === 'caution';
  const isWarning = status === 'warning';
  const isUnknown = status === 'unknown';

  const conditionBadgeStyle = lastInspectCondition
    ? CONDITION_COLORS[lastInspectCondition]
    : CONDITION_COLORS.good;

  const statColor = isOverdue
    ? 'var(--color-overdue-sub)'
    : isCaution
    ? 'var(--color-caution-text)'
    : isWarning
    ? 'var(--color-warning-text)'
    : isUnknown
    ? 'var(--color-text-muted)'
    : 'var(--color-text-primary)';

  const recentValue = buildRecentValue(lastLoggedMileage, lastLoggedDate);
  const intervalValue = buildIntervalText(item);

  return (
    <li style={{ listStyle: 'none' }}>
      <div
        onClick={onClick}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        onTouchStart={() => setPressed(true)}
        onTouchEnd={() => setPressed(false)}
        style={{
          display: 'flex',
          alignItems: 'stretch',
          background: pressed ? 'var(--color-surface-hover)' : 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'background 0.1s',
        }}
        role="button"
        tabIndex={0}
        aria-label={`${item.name_ko} 상세 보기`}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      >
        {/* Body */}
        <div style={{ flex: 1, minWidth: 0, padding: '10px 6px 10px 15px' }}>
          {/* Name row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, flexWrap: 'wrap', minWidth: 0 }}>
            <p
              style={{
                fontSize: 16,
                fontWeight: 600,
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: 'var(--color-text-primary)',
                minWidth: 0,
              }}
            >
              {item.name_ko}
            </p>
            {isCustom && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: 8,
                  background: 'var(--color-urgent-bg)',
                  color: 'var(--color-urgent-text)',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                커스텀
              </span>
            )}
            {isInspectItem && (() => {
              if (lastLogType === 'replace') {
                return (
                  <span style={{ ...BADGE_BASE, background: 'var(--color-normal-bg)', color: 'var(--color-normal-text)' }}>
                    교체 완료
                  </span>
                );
              }
              if (lastInspectCondition) {
                return (
                  <span style={{ ...BADGE_BASE, background: conditionBadgeStyle.bg, color: conditionBadgeStyle.fg }}>
                    {CONDITION_LABEL[lastInspectCondition]}
                  </span>
                );
              }
              return (
                <span style={{ ...BADGE_BASE, fontWeight: 600, background: 'var(--color-surface-hover)', color: 'var(--color-text-muted)' }}>
                  점검
                </span>
              );
            })()}
          </div>

          {/* 최근 기록 — 기록 없을 때 주기를 인라인으로 표시 */}
          <span
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: recentValue ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
              fontStyle: recentValue ? 'normal' : 'italic',
            }}
          >
            {recentValue
              ? recentValue
              : intervalValue
              ? `기록 없음 · ${intervalValue}`
              : '기록 없음'}
          </span>
        </div>

        {/* Stat */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '10px 15px 10px 6px',
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
                fontSize: 11,
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
