// Phase 1 localStorage 레이어
// 키 형식:
//   pitstop_mileage_{car_id}
//   pitstop_last_log_{car_id}_{item_id}
//   pitstop_last_mileage_{car_id}_{item_id}
//   pitstop_last_log_type_{car_id}_{item_id}

import type { LogType } from '@/types';

const key = {
  mileage: (carId: string) => `pitstop_mileage_${carId}`,
  lastLog: (carId: string, itemId: string) => `pitstop_last_log_${carId}_${itemId}`,
  lastMileage: (carId: string, itemId: string) => `pitstop_last_mileage_${carId}_${itemId}`,
  lastLogType: (carId: string, itemId: string) => `pitstop_last_log_type_${carId}_${itemId}`,
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
