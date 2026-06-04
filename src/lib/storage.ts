// Phase 1 localStorage 레이어
// 키 형식:
//   pitstop_mileage_{car_id}
//   pitstop_last_log_{car_id}_{item_id}
//   pitstop_last_mileage_{car_id}_{item_id}
//   pitstop_last_log_type_{car_id}_{item_id}
//   pitstop_logs_{car_id}               — 정비 이력 배열 (LogEntry[])
//   pitstop_migrated_{car_id}           — 기존 last_log → 배열 마이그레이션 완료 여부
//   pitstop_custom_intervals_{car_id}   — 사용자 커스텀 교체 주기
//   pitstop_hidden_items_{car_id}       — 숨긴 항목 ID 배열

import type { LogEntry, LogType, ConsumableItem, InspectCondition, ExpenseEntry, ExpenseCategory } from '@/types';

const key = {
  mileage: (carId: string) => `pitstop_mileage_${carId}`,
  lastLog: (carId: string, itemId: string) => `pitstop_last_log_${carId}_${itemId}`,
  lastMileage: (carId: string, itemId: string) => `pitstop_last_mileage_${carId}_${itemId}`,
  lastLogType: (carId: string, itemId: string) => `pitstop_last_log_type_${carId}_${itemId}`,
  logs: (carId: string) => `pitstop_logs_${carId}`,
  migrated: (carId: string) => `pitstop_migrated_${carId}`,
  customIntervals: (carId: string) => `pitstop_custom_intervals_${carId}`,
  expenses: (carId: string) => `pitstop_expenses_${carId}`,
  hiddenItems: (carId: string) => `pitstop_hidden_items_${carId}`,
};

// 현재 주행거리 (숫자, 없으면 null)
export function getMileage(carId: string): number | null {
  const raw = localStorage.getItem(key.mileage(carId));
  if (raw === null) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function setMileage(carId: string, mileage: number): void {
  localStorage.setItem(key.mileage(carId), String(mileage));
}

// 마지막 정비 날짜 (ISO 문자열 YYYY-MM-DD, 없으면 null)
export function getLastLog(carId: string, itemId: string): string | null {
  return localStorage.getItem(key.lastLog(carId, itemId));
}

export function setLastLog(carId: string, itemId: string, date: string): void {
  localStorage.setItem(key.lastLog(carId, itemId), date);
}

// 마지막 정비 시 주행거리 (숫자, 없으면 null)
export function getLastMileage(carId: string, itemId: string): number | null {
  const raw = localStorage.getItem(key.lastMileage(carId, itemId));
  if (raw === null) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function setLastMileage(carId: string, itemId: string, mileage: number): void {
  localStorage.setItem(key.lastMileage(carId, itemId), String(mileage));
}

// 마지막 정비 유형 (replace | inspect, 없으면 null)
export function getLastLogType(carId: string, itemId: string): LogType | null {
  const raw = localStorage.getItem(key.lastLogType(carId, itemId));
  if (raw === 'replace' || raw === 'inspect') return raw;
  return null;
}

export function setLastLogType(carId: string, itemId: string, type: LogType): void {
  localStorage.setItem(key.lastLogType(carId, itemId), type);
}

// 정비 이력 배열

export function getLogs(carId: string): LogEntry[] {
  const raw = localStorage.getItem(key.logs(carId));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as LogEntry[];
  } catch {
    return [];
  }
}

export function addLog(carId: string, entry: LogEntry): void {
  const logs = getLogs(carId);
  logs.push(entry);
  localStorage.setItem(key.logs(carId), JSON.stringify(logs));
}

export function updateLog(
  carId: string,
  id: string,
  patch: { date: string; mileage: number | null; note?: string; cost?: number; condition?: InspectCondition },
): void {
  const logs = getLogs(carId);
  const idx = logs.findIndex(l => l.id === id);
  if (idx === -1) return;
  logs[idx] = { ...logs[idx], ...patch };
  localStorage.setItem(key.logs(carId), JSON.stringify(logs));
}

export function deleteLog(carId: string, id: string): void {
  const logs = getLogs(carId).filter(l => l.id !== id);
  localStorage.setItem(key.logs(carId), JSON.stringify(logs));
}

// 해당 아이템의 가장 최근 점검 기록(condition 포함) 반환. 없으면 null.
export function getLastInspectEntry(carId: string, itemId: string): LogEntry | null {
  const logs = getLogs(carId);
  let latest: LogEntry | null = null;
  for (const entry of logs) {
    if (entry.itemId !== itemId) continue;
    if (entry.logType !== 'inspect') continue;
    if (!latest || entry.date.localeCompare(latest.date) > 0) {
      latest = entry;
    }
  }
  return latest;
}

// 해당 아이템의 가장 최근 점검 condition만 반환 (없으면 null)
export function getLastInspectCondition(carId: string, itemId: string): InspectCondition | null {
  return getLastInspectEntry(carId, itemId)?.condition ?? null;
}

// 해당 아이템의 가장 최근 교체 기록 반환. 없으면 null.
export function getLastReplaceEntry(carId: string, itemId: string): LogEntry | null {
  const logs = getLogs(carId);
  let latest: LogEntry | null = null;
  for (const entry of logs) {
    if (entry.itemId !== itemId) continue;
    if (entry.logType !== 'replace') continue;
    if (!latest || entry.id > latest.id) {
      latest = entry;
    }
  }
  return latest;
}

// 기존 last_log 단일 키 → 이력 배열 1회 이전
export function migrateLogsIfNeeded(carId: string, items: ConsumableItem[]): void {
  if (localStorage.getItem(key.migrated(carId))) return;
  const existing = getLogs(carId);
  if (existing.length > 0) {
    localStorage.setItem(key.migrated(carId), '1');
    return;
  }
  const migrated: LogEntry[] = [];
  for (const item of items) {
    const date = getLastLog(carId, item.id);
    if (!date) continue;
    const mileage = getLastMileage(carId, item.id);
    const logType = getLastLogType(carId, item.id) ?? 'replace';
    migrated.push({
      id: `migrated_${item.id}`,
      itemId: item.id,
      itemName: item.name_ko,
      category: item.category,
      date,
      mileage,
      logType,
    });
  }
  if (migrated.length > 0) {
    localStorage.setItem(key.logs(carId), JSON.stringify(migrated));
  }
  localStorage.setItem(key.migrated(carId), '1');
}

// 내 차량 목록 (car_id 배열)

const MY_CARS_KEY = 'pitstop_my_car_ids';

export function getMyCars(): string[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(MY_CARS_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}

export function addMyCar(carId: string): void {
  const cars = getMyCars();
  if (!cars.includes(carId)) {
    cars.push(carId);
    localStorage.setItem(MY_CARS_KEY, JSON.stringify(cars));
  }
}

export function removeMyCar(carId: string): void {
  const cars = getMyCars().filter(id => id !== carId);
  localStorage.setItem(MY_CARS_KEY, JSON.stringify(cars));
}

// 커스텀 교체 주기

type CustomIntervalData = { interval_km?: number; interval_months?: number };

function readCustomIntervalsMap(carId: string): Record<string, CustomIntervalData> {
  const raw = localStorage.getItem(key.customIntervals(carId));
  if (!raw) return {};
  try { return JSON.parse(raw) as Record<string, CustomIntervalData>; } catch { return {}; }
}

export function getCustomInterval(carId: string, itemId: string): CustomIntervalData | null {
  return readCustomIntervalsMap(carId)[itemId] ?? null;
}

export function setCustomInterval(carId: string, itemId: string, data: CustomIntervalData): void {
  const all = readCustomIntervalsMap(carId);
  all[itemId] = data;
  localStorage.setItem(key.customIntervals(carId), JSON.stringify(all));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('pitstop_custom_changed'));
  }
}

export function resetCustomInterval(carId: string, itemId: string): void {
  const all = readCustomIntervalsMap(carId);
  delete all[itemId];
  localStorage.setItem(key.customIntervals(carId), JSON.stringify(all));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('pitstop_custom_changed'));
  }
}

// 유지비 지출 (ExpenseEntry) CRUD

export function getExpenses(carId: string): ExpenseEntry[] {
  const raw = localStorage.getItem(key.expenses(carId));
  if (!raw) return [];
  try { return JSON.parse(raw) as ExpenseEntry[]; } catch { return []; }
}

export function addExpense(carId: string, entry: ExpenseEntry): void {
  const list = getExpenses(carId);
  list.push(entry);
  localStorage.setItem(key.expenses(carId), JSON.stringify(list));
}

export function updateExpense(
  carId: string,
  id: string,
  patch: { category: ExpenseCategory; amount: number; date: string; note?: string },
): void {
  const list = getExpenses(carId);
  const idx = list.findIndex(e => e.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], ...patch };
  localStorage.setItem(key.expenses(carId), JSON.stringify(list));
}

export function deleteExpense(carId: string, id: string): void {
  const list = getExpenses(carId).filter(e => e.id !== id);
  localStorage.setItem(key.expenses(carId), JSON.stringify(list));
}

// 숨긴 항목 관리

export function getHiddenItems(carId: string): Set<string> {
  const raw = localStorage.getItem(key.hiddenItems(carId));
  if (!raw) return new Set();
  try { return new Set(JSON.parse(raw) as string[]); } catch { return new Set(); }
}

export function hideItem(carId: string, itemId: string): void {
  const hidden = getHiddenItems(carId);
  hidden.add(itemId);
  localStorage.setItem(key.hiddenItems(carId), JSON.stringify([...hidden]));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('pitstop_hidden_changed'));
  }
}

export function unhideItem(carId: string, itemId: string): void {
  const hidden = getHiddenItems(carId);
  hidden.delete(itemId);
  localStorage.setItem(key.hiddenItems(carId), JSON.stringify([...hidden]));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('pitstop_hidden_changed'));
  }
}

// official item + custom override → 병합된 item 반환 (urgency threshold 비례 조정 포함)
export function mergeItemWithCustom(carId: string, item: ConsumableItem): ConsumableItem {
  const custom = readCustomIntervalsMap(carId)[item.id];
  if (!custom) return item;
  const merged = { ...item };
  if (custom.interval_km !== undefined && custom.interval_km > 0) {
    merged.interval_km = custom.interval_km;
    if (item.interval_km && item.urgency_threshold_km) {
      const ratio = item.urgency_threshold_km / item.interval_km;
      merged.urgency_threshold_km = Math.max(1, Math.round(custom.interval_km * ratio));
    }
  }
  if (custom.interval_months !== undefined && custom.interval_months > 0) {
    merged.interval_months = custom.interval_months;
    if (item.interval_months && item.urgency_threshold_days) {
      const ratio = item.urgency_threshold_days / (item.interval_months * 30);
      merged.urgency_threshold_days = Math.max(1, Math.round(custom.interval_months * 30 * ratio));
    }
  }
  return merged;
}
