import { toMonthLabel } from './dateUtils';

export function groupByMonth<T extends { date: string }>(items: T[]): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const label = toMonthLabel(item.date);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(item);
  }
  return [...map.entries()];
}

export function buildIntervalText(item: {
  interval_km?: number | null;
  interval_months?: number | null;
}): string {
  const parts: string[] = [];
  if (item.interval_km) parts.push(`${item.interval_km.toLocaleString()}km`);
  if (item.interval_months) parts.push(`${item.interval_months}개월`);
  return parts.join(' / ');
}

export function parseCostStr(str: string): number | undefined {
  const n = Number(str.replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
