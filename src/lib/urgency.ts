import type { ConsumableItem, UrgencyResult, UrgencyStatus, InspectCondition } from '@/types';

interface UrgencyInput {
  item: ConsumableItem;
  currentMileage: number | null;
  lastLoggedMileage: number | null;
  lastLoggedDate: string | null;
  /**
   * inspect 항목의 마지막 점검 결과.
   * 'caution'이면 ratio×0.5로 단축, 'replace_needed'이면 즉시 overdue.
   * replace_only 항목 또는 점검 이력 없음일 때는 null/undefined.
   */
  lastInspectCondition?: InspectCondition | null;
}

interface DimensionResult {
  ratio: number;
  // 20% of interval / urgency_threshold — caution과 overdue의 경계 ratio
  cautionBoundary: number;
}

export function calculateUrgency({
  item,
  currentMileage,
  lastLoggedMileage,
  lastLoggedDate,
  lastInspectCondition,
}: UrgencyInput): UrgencyResult {
  const isInspectItem = item.behavior
    ? item.behavior !== 'replace_only'
    : item.item_type === 'inspect';

  if (isInspectItem && lastInspectCondition === 'replace_needed') {
    return { status: 'overdue', ratio: -1, displayText: '교체 필요' };
  }

  const kmResult = calcKmResult(item, currentMileage, lastLoggedMileage);
  const daysResult = calcDaysResult(item, lastLoggedDate);

  const validResults = [kmResult, daysResult].filter((r): r is DimensionResult => r !== null);

  if (validResults.length === 0) {
    return { status: 'unknown', ratio: null, displayText: '미기록' };
  }

  // 가장 긴급한 차원(ratio가 낮은 쪽)이 상태를 결정
  const winning = validResults.reduce((min, r) => r.ratio < min.ratio ? r : min);
  let ratio = winning.ratio;

  // inspect 항목 + '주의 관찰'이면 ratio를 절반으로 압축해 더 빨리 위급으로
  if (isInspectItem && lastInspectCondition === 'caution' && ratio > 0) {
    ratio = ratio * 0.5;
  }

  const status = determineStatus(ratio, winning.cautionBoundary);
  const displayText = buildDisplayText(item, ratio, currentMileage, lastLoggedMileage, lastLoggedDate);

  return { status, ratio, displayText };
}

function determineStatus(ratio: number, cautionBoundary: number): UrgencyStatus {
  if (ratio > 1) return 'ok';
  if (ratio > 0) return 'warning';
  if (ratio > cautionBoundary) return 'caution';
  return 'overdue';
}

function calcKmResult(
  item: ConsumableItem,
  currentMileage: number | null,
  lastLoggedMileage: number | null,
): DimensionResult | null {
  if (item.interval_km === null || item.urgency_threshold_km === null) return null;
  if (currentMileage === null) return null;

  const baseMileage = lastLoggedMileage ?? 0;
  const kmRemaining = item.interval_km - (currentMileage - baseMileage);
  const ratio = kmRemaining / item.urgency_threshold_km;
  // 인터벌의 20%를 초과했을 때 caution → overdue
  const cautionBoundary = -(0.2 * item.interval_km) / item.urgency_threshold_km;

  return { ratio, cautionBoundary };
}

function calcDaysResult(item: ConsumableItem, lastLoggedDate: string | null): DimensionResult | null {
  if (item.interval_months === null || item.urgency_threshold_days === null) return null;
  if (lastLoggedDate === null) return null;

  const today = new Date();
  const logged = new Date(lastLoggedDate);
  const daysElapsed = Math.floor((today.getTime() - logged.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = item.interval_months * 30 - daysElapsed;
  const ratio = daysRemaining / item.urgency_threshold_days;
  const cautionBoundary = -(0.2 * item.interval_months * 30) / item.urgency_threshold_days;

  return { ratio, cautionBoundary };
}

function buildDisplayText(
  item: ConsumableItem,
  ratio: number,
  currentMileage: number | null,
  lastLoggedMileage: number | null,
  lastLoggedDate: string | null,
): string {
  if (item.interval_km !== null && currentMileage !== null) {
    const baseMileage = lastLoggedMileage ?? 0;
    const kmRemaining = item.interval_km - (currentMileage - baseMileage);
    if (kmRemaining <= 0) {
      return `${Math.abs(kmRemaining).toLocaleString()} km 초과`;
    }
    return `${kmRemaining.toLocaleString()} km 남음`;
  }

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

  void ratio;
  return '—';
}
