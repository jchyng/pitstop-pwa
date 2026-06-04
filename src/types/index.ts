// 정비 기록 유형: 교체 or 점검
export type LogType = 'replace' | 'inspect';

// 점검 결과 상태 (logType === 'inspect'일 때만 의미 있음)
export type InspectCondition = 'good' | 'caution' | 'replace_needed';

// 소모품 항목 동작 유형
// replace_only: 교체 주기만 있음 (엔진오일, 에어필터 등)
// inspect_only: 점검 주기만 있음, 상태 기록 후 필요 시 교체 (브레이크패드 등)
// both: 점검 주기와 교체 주기가 별도로 존재 (에어 클리너 등 — 수동 데이터 수집 후 채움)
export type ItemBehavior = 'replace_only' | 'inspect_only' | 'both';

// 소모품 항목 하나의 정적 데이터 (JSON에서 읽어오는 원본 구조)
export interface ConsumableItem {
  id: string;
  name_ko: string;
  category: string;
  behavior: ItemBehavior;

  // 교체 주기 (replace_only, both 항목에서 사용)
  interval_km: number | null;
  max_km: number | null;
  interval_months: number | null;
  urgency_threshold_km: number | null;
  urgency_threshold_days: number | null;

  // 점검 주기 (inspect_only, both 항목에서 사용) — 차량 설명서 데이터 수집 후 채움
  inspect_interval_km?: number | null;
  inspect_interval_months?: number | null;

  notes?: string;
  manual_spec?: string; // 공식 차량 설명서 발췌 — 나중에 채움

  /** @deprecated behavior 필드로 대체됨 */
  item_type?: LogType;
}

// 차종 데이터 (car_id, 차종명, 소모품 목록 포함)
export interface CarData {
  car_id: string;
  name_ko: string;
  items: ConsumableItem[];
}

// 긴급도 상태: 5단계
// ok      — 정상 (초록)
// warning — 교체 임박 (노랑, urgency_threshold 진입)
// caution — 약간 초과 (주황, 구간 0 ~ -20% of interval)
// overdue — 많이 초과 (빨강, -20% 이상 초과)
// unknown — 계산 불가
export type UrgencyStatus = 'overdue' | 'caution' | 'warning' | 'ok' | 'unknown';

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

// 차량 목록 인덱스 항목 (index.json)
export interface CarIndex {
  car_id: string;
  name_ko: string;
  brand: string;
  model_name: string; // 모델명 (예: 아반떼)
  model: string;      // 세대/트림 (예: 아반떼 MD)
  fuel: string;
  file: string;
}

// 정비 이력 한 건
export interface LogEntry {
  id: string;           // Date.now().toString()
  itemId: string;
  itemName: string;     // ConsumableItem.name_ko 캐시
  category: string;     // ConsumableItem.category 캐시
  date: string;         // YYYY-MM-DD
  mileage: number | null;
  logType: LogType;
  condition?: InspectCondition; // logType === 'inspect'일 때 기록되는 점검 결과
  note?: string;
  cost?: number;        // 정비 비용 (원 단위, 선택)
}

// 취급설명서 카테고리별 이미지 데이터
export interface ManualCategoryData {
  images: string[];   // e.g. ["/manuals/avante-cn7-gasoline/engine-table.jpg"]
  page_ref?: string;  // e.g. "p.4-12"
}

// 차량별 취급설명서 인덱스 (/public/manuals/{carId}/index.json)
export interface ManualIndex {
  car_id: string;
  source: string;     // e.g. "아반떼 CN7 취급설명서"
  version?: string;   // e.g. "2020년판"
  categories: Partial<Record<string, ManualCategoryData>>;
}

// 유지비 지출 카테고리
export type ExpenseCategory = 'insurance' | 'tax' | 'fuel' | 'other';

// 유지비 지출 한 건 (정비 외 — 보험/세금/주유/기타)
export interface ExpenseEntry {
  id: string;
  carId: string;
  category: ExpenseCategory;
  amount: number;   // 원 단위 정수
  date: string;     // YYYY-MM-DD
  note?: string;
}
