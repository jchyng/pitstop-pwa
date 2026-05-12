// 정비 기록 유형: 교체 or 점검
export type LogType = 'replace' | 'inspect';

// 소모품 항목 하나의 정적 데이터 (JSON에서 읽어오는 원본 구조)
export interface ConsumableItem {
  id: string;
  name_ko: string;
  category: string;
  interval_km: number | null;
  max_km: number | null;
  interval_months: number | null;
  urgency_threshold_km: number | null;
  urgency_threshold_days: number | null;
  notes?: string;
  item_type?: LogType; // 생략 시 'replace'로 간주
}

// 차종 데이터 (car_id, 차종명, 소모품 목록 포함)
export interface CarData {
  car_id: string;
  name_ko: string;
  items: ConsumableItem[];
}

// 긴급도 상태: 과기한 / 위급 / 정상 / 알 수 없음
export type UrgencyStatus = 'overdue' | 'urgent' | 'ok' | 'unknown';

// calculateUrgency() 반환값: 상태 + ratio(정렬용) + 화면에 표시할 텍스트
export interface UrgencyResult {
  status: UrgencyStatus;
  ratio: number | null;
  displayText: string;
}

// 소모품 원본 데이터와 긴급도 계산 결과를 묶은 뷰 전용 타입
export interface ItemWithUrgency {
  item: ConsumableItem;
  urgency: UrgencyResult;
}
