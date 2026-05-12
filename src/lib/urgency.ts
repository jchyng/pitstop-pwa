import type { ConsumableItem, UrgencyResult } from '@/types';

interface UrgencyInput {
  item: ConsumableItem;
  currentMileage: number | null;
  lastLoggedMileage: number | null;
  lastLoggedDate: string | null; // ISO 날짜 문자열 (YYYY-MM-DD)
}

export function calculateUrgency({
  item,
  currentMileage,
  lastLoggedMileage,
  lastLoggedDate,
}: UrgencyInput): UrgencyResult {
  const kmRatio = calcKmRatio(item, currentMileage, lastLoggedMileage);
  const daysRatio = calcDaysRatio(item, lastLoggedDate);

  // 유효한 ratio만 모아서 min() 계산
  const validRatios = [kmRatio, daysRatio].filter((r): r is number => r !== null);

  if (validRatios.length === 0) {
    return { status: 'unknown', ratio: null, displayText: '미기록' };
  }

  const ratio = Math.min(...validRatios);
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
  if (currentMileage === null || lastLoggedMileage === null) return null;

  const kmRemaining = item.interval_km - (currentMileage - lastLoggedMileage);
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
  // km 기준 항목이 있고 데이터가 있을 때
  if (item.interval_km !== null && currentMileage !== null && lastLoggedMileage !== null) {
    const kmRemaining = item.interval_km - (currentMileage - lastLoggedMileage);
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
