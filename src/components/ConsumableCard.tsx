'use client';

import { useState, useRef, useEffect } from 'react';
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
  onHide?: () => void;
  demoSwipe?: boolean;
}

const BADGE_BASE: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  padding: '2px 6px',
  borderRadius: 8,
  flexShrink: 0,
  whiteSpace: 'nowrap',
};

// 감추기 액션 영역 너비 (px)
const ACTION_WIDTH = 72;
// 이 이상 스와이프하면 감추기 트리거
const HIDE_THRESHOLD = 56;

function formatDate_(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
void formatDate_;

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
  isCustom,
  onClick,
  onHide,
  demoSwipe,
}: Props) {
  const [pressed, setPressed] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const liRef = useRef<HTMLLIElement>(null);
  // swipeOffset을 클로저 없이 touchend에서 읽기 위한 ref
  const swipeOffsetRef = useRef(0);
  const blockNextClick = useRef(false);
  const gesture = useRef({
    startX: 0,
    startY: 0,
    direction: null as 'horizontal' | 'vertical' | null,
    offset: 0,
  });

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

  // passive: false touchmove는 React 합성이벤트로 불가 → native listener 사용
  useEffect(() => {
    const li = liRef.current;
    if (!li || !onHide) return;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      gesture.current = { startX: t.clientX, startY: t.clientY, direction: null, offset: 0 };
      setPressed(true);
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      const dx = t.clientX - gesture.current.startX;
      const dy = t.clientY - gesture.current.startY;
      const g = gesture.current;

      // 5px 이상 이동 후 방향 결정
      if (g.direction === null) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        g.direction = Math.abs(dx) > Math.abs(dy) && dx < 0 ? 'horizontal' : 'vertical';
      }

      if (g.direction !== 'horizontal') return;
      e.preventDefault(); // 스크롤 차단 (passive:false 필요)
      setPressed(false);

      // 액션 너비 이상 당기면 rubber band 저항
      let offset = Math.min(0, dx);
      if (offset < -ACTION_WIDTH) {
        offset = -ACTION_WIDTH + (offset + ACTION_WIDTH) * 0.25;
      }
      offset = Math.max(-ACTION_WIDTH * 2.5, offset);

      g.offset = offset;
      swipeOffsetRef.current = offset;
      setSwipeOffset(offset);
    };

    const onTouchEnd = () => {
      setPressed(false);
      const g = gesture.current;
      if (g.direction !== 'horizontal') return;

      // 클릭 이벤트가 연달아 발생하는 것을 차단
      blockNextClick.current = true;
      setTimeout(() => { blockNextClick.current = false; }, 350);

      if (g.offset < -HIDE_THRESHOLD) {
        // 임계값 초과 → 카드 날리고 감추기
        setIsTransitioning(true);
        swipeOffsetRef.current = -600;
        setSwipeOffset(-600);

        // li 높이를 0으로 애니메이션 (flex gap 제거)
        const liEl = liRef.current;
        if (liEl) {
          const h = liEl.getBoundingClientRect().height;
          liEl.style.height = `${h}px`;
          // double-rAF: 브라우저가 height 값을 확정한 뒤 transition 시작
          requestAnimationFrame(() => requestAnimationFrame(() => {
            if (!liEl) return;
            liEl.style.transition = 'height 0.24s ease, opacity 0.18s ease';
            liEl.style.height = '0';
            liEl.style.opacity = '0';
          }));
        }

        setTimeout(() => {
          if (liRef.current) liRef.current.style.display = 'none';
          onHide();
        }, 300);
      } else {
        // 임계값 미달 → 제자리 복귀 (spring)
        setIsTransitioning(true);
        swipeOffsetRef.current = 0;
        setSwipeOffset(0);
      }

      gesture.current.direction = null;
    };

    li.addEventListener('touchstart', onTouchStart, { passive: true });
    li.addEventListener('touchmove', onTouchMove, { passive: false });
    li.addEventListener('touchend', onTouchEnd, { passive: true });
    li.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      li.removeEventListener('touchstart', onTouchStart);
      li.removeEventListener('touchmove', onTouchMove);
      li.removeEventListener('touchend', onTouchEnd);
      li.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [onHide]);

  // 첫 방문 시 스와이프 힌트 peek 애니메이션 (1회만)
  useEffect(() => {
    if (!demoSwipe) return;

    const peekTimer = setTimeout(() => {
      swipeOffsetRef.current = -34;
      setSwipeOffset(-34); // isTransitioning=false → 즉시 이동 (no transition)

      const returnTimer = setTimeout(() => {
        setIsTransitioning(true);
        swipeOffsetRef.current = 0;
        setSwipeOffset(0);
        if (typeof window !== 'undefined') {
          localStorage.setItem('pitstop_swipe_hint_seen', '1');
        }
      }, 520);

      return () => clearTimeout(returnTimer);
    }, 900);

    return () => clearTimeout(peekTimer);
  }, [demoSwipe]);

  // 스와이프 비율에 따라 액션 영역 불투명도
  const actionOpacity = Math.min(1, -swipeOffset / (ACTION_WIDTH * 0.65));

  return (
    <li
      ref={liRef}
      style={{
        listStyle: 'none',
        position: 'relative',
        borderRadius: 'var(--radius-card)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden', // li가 프레임 역할 — shadow는 li에 있으므로 클리핑 없음
      }}
    >
      {/* 왼쪽 스와이프 시 뒤에서 드러나는 감추기 영역 */}
      {onHide && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: ACTION_WIDTH,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            background: 'var(--color-surface-hover)',
            opacity: actionOpacity,
          }}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <path
              d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)' }}>감추기</span>
        </div>
      )}

      {/* 카드 본문 — 스와이프로 좌우 이동 */}
      <div
        onClick={() => { if (!blockNextClick.current) onClick(); }}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        onTransitionEnd={() => {
          // spring-back 완료 후 transition 해제
          if (swipeOffsetRef.current === 0) setIsTransitioning(false);
        }}
        style={{
          position: 'relative',
          zIndex: 1,           // 액션 영역 위에 위치
          display: 'flex',
          alignItems: 'stretch',
          background: pressed ? 'var(--color-surface-hover)' : 'var(--color-surface)',
          cursor: 'pointer',
          transform: `translateX(${swipeOffset}px)`,
          transition: isTransitioning
            ? 'transform 0.32s cubic-bezier(0.25, 1, 0.5, 1)'
            : 'none',
          willChange: 'transform',
        }}
        role="button"
        tabIndex={0}
        aria-label={`${item.name_ko} 상세 보기`}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      >
        {/* 텍스트 영역 */}
        <div style={{ flex: 1, minWidth: 0, padding: '10px 6px 10px 15px' }}>
          {/* 이름 행 */}
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

          {/* 최근 기록 */}
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

        {/* 우측 상태 수치 */}
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
