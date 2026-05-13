import type { ConsumableItem, UrgencyResult, InspectCondition } from '@/types';

interface UrgencyInput {
  item: ConsumableItem;
  currentMileage: number | null;
  lastLoggedMileage: number | null;
  lastLoggedDate: string | null; // ISO 날짜 문자열 (YYYY-MM-DD)
  /**
   * inspect 항목의 마지막 점검 결과. 'caution'이면 ratio×0.5로 단축,
   * 'replace_needed'이면 즉시 과기한(ratio=-1)으로 격상.
   * 교체형(replace) 항목 또는 점검 이력 없음일 때는 null/undefined.
   */
  lastInspectCondition?: InspectCondition | null;
}

export function calculateUrgency({
  item,
  currentMileage,
  lastLoggedMileage,
  lastLoggedDate,
  lastInspectCondition,
}: UrgencyInput): UrgencyResult {
  // 점검형 항목 + 마지막 점검에서 '교체 필요'면 즉시 과기한 카드로
  const isInspectItem = item.item_type === 'inspect';
  if (isInspectItem && lastInspectCondition === 'replace_needed') {
    return {
      status: 'overdue',
      ratio: -1,
      displayText: '교체 필요',
    };
  }

  const kmRatio = calcKmRatio(item, currentMileage, lastLoggedMileage);
  const daysRatio = calcDaysRatio(item, lastLoggedDate);

  // 유효한 ratio만 모아서 min() 계산
  const validRatios = [kmRatio, daysRatio].filter((r): r is number => r !== null);

  if (validRatios.length === 0) {
    return { status: 'unknown', ratio: null, displayText: '미기록' };
  }

  let ratio = Math.min(...validRatios);

  // 점검형 + '주의 관찰'이면 ratio를 절반으로 압축해 더 빨리 위급으로
  if (isInspectItem && lastInspectCondition === 'caution' && ratio > 0) {
    ratio = ratio * 0.5;
  }

  const status = ratio <= 0 ? 'overdue' : ratio <= 1 ? 'urgent' : 'ok';
  const displayText = buildDisplayText(item, ratio, currentMileage, lastLoggedMileage, lastLoggedDate);

  return { status, ratio, displayText };
}

function calcKmRatio(
  item: ConsumableItem,
  currentMileage: number | null,
  lastLoggedMileage: number | null,
): number | null {
  if (item.interval_km === null || item.urgency_threshold_km === null) return null;
  if (currentMileage === null) return null;

  const baseMileage = lastLoggedMileage ?? 0;
  const kmRemaining = item.interval_km - (currentMileage - baseMileage);
  return kmRemaining / item.urgency_threshold_km;
}

function calcDaysRatio(item: ConsumableItem, lastLoggedDate: string | null): number | null {
  if (item.interval_months === null || item.urgency_threshold_days === null) return null;
  if (lastLoggedDate === null) return null;

  const today = new Date();
  const logged = new Date(lastLoggedDate);
  const daysElapsed = Math.floor((today.getTime() - logged.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = item.interval_months * 30 - daysElapsed;

  return daysRemaining / item.urgency_threshold_days;
}

function buildDisplayText(
  item: ConsumableItem,
  ratio: number,
  currentMileage: number | null,
  lastLoggedMileage: number | null,
  lastLoggedDate: string | null,
): string {
  // km 기준 항목이 있고 현재 주행거리가 있을 때 (미기록이면 0km 기준)
  if (item.interval_km !== null && currentMileage !== null) {
    const baseMileage = lastLoggedMileage ?? 0;
    const kmRemaining = item.interval_km - (currentMileage - baseMileage);
    if (kmRemaining <= 0) {
      return `${Math.abs(kmRemaining).toLocaleString()} km 초과`;
    }
    return `${kmRemaining.toLocaleString()} km 남음`;
  }

  // 시간 기준만 있을 때
  if (item.interval_months !== null && lastLoggedDate !== null) {
    const today = new Date();
    const logged = new Date(lastLoggedDate);
    const daysElapsed = Math.floor((today.getTime() - logged.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = item.interval_months * 30 - daysElapsed;

    if (daysRemaining <= 0) {
      const monthsOver = Math.ceil(Math.abs(daysRemaining) / 30);
      return `${monthsOver}개월 초과`;
    }
    const monthsLeft = Math.ceil(daysRemaining / 30);
    return `${monthsLeft}개월 남음`;
  }

  // ratio는 있으나 표시 불가 (이론상 도달 안 함)
  void ratio;
  return '—';
}
