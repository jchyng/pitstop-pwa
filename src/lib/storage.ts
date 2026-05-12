// Phase 1 localStorage 레이어
// 키 형식:
//   pitstop_mileage_{car_id}
//   pitstop_last_log_{car_id}_{item_id}
//   pitstop_last_mileage_{car_id}_{item_id}
//   pitstop_last_log_type_{car_id}_{item_id}
//   pitstop_logs_{car_id}          — 정비 이력 배열 (LogEntry[])
//   pitstop_migrated_{car_id}      — 기존 last_log → 배열 마이그레이션 완료 여부

import type { LogEntry, LogType, ConsumableItem } from '@/types';

const key = {
  mileage: (carId: string) => `pitstop_mileage_${carId}`,
  lastLog: (carId: string, itemId: string) => `pitstop_last_log_${carId}_${itemId}`,
  lastMileage: (carId: string, itemId: string) => `pitstop_last_mileage_${carId}_${itemId}`,
  lastLogType: (carId: string, itemId: string) => `pitstop_last_log_type_${carId}_${itemId}`,
  logs: (carId: string) => `pitstop_logs_${carId}`,
  migrated: (carId: string) => `pitstop_migrated_${carId}`,
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
