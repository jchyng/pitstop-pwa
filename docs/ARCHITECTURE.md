# Pitstop PWA — 기술 설계

## 스택
- **Frontend**: Next.js + TypeScript
- **PWA**: next-pwa (서비스 워커, cache-first)
- **DB**: Supabase PostgreSQL (Phase 2+)
- **Auth**: Supabase Custom OAuth → 카카오 (Phase 2)
- **Push**: Supabase Edge Functions + VAPID (Phase 3)
- **배포**: Vercel

## 데이터 구조

### 소모품 JSON (Phase 1 정적 파일)
```json
{
  "car_id": "avante-gasoline",
  "name_ko": "아반떼 가솔린",
  "items": [
    {
      "id": "engine-oil",
      "name_ko": "엔진오일",
      "category": "엔진·오일",
      "interval_km": 10000,
      "max_km": 11000,
      "interval_months": 12,
      "urgency_threshold_km": 1000,
      "urgency_threshold_days": 30,
      "notes": "합성유 기준. 광유는 7,500km"
    },
    {
      "id": "coolant",
      "name_ko": "냉각수 (부동액)",
      "category": "제동·냉각·변속",
      "interval_km": null,
      "max_km": null,
      "interval_months": 24,
      "urgency_threshold_km": null,
      "urgency_threshold_days": 60,
      "notes": "주행거리 무관, 2년마다 교환"
    }
  ]
}
```

**필드 설명:**
- `interval_km`: 권장 교체 주기 km ("권장 N km")
- `max_km`: 마지노선 km — 절대 넘기면 안 되는 상한 ("마지노선 N km"). `null`이면 interval_km과 동일하게 처리.
- `category`: 전체보기 섹션 그룹명 (6개: 엔진·오일 / 연료·증발가스 / 공조·외부 / 제동·냉각·변속 / 점화·벨트 / 타이어·배터리)
- `interval_km: null` → 시간 기준만 적용. 둘 다 있으면 먼저 도달하는 조건으로 알림.

### localStorage 키 (Phase 1)
- `pitstop_mileage_{car_id}` — 현재 주행거리
- `pitstop_last_log_{car_id}_{item_id}` — 마지막 정비 날짜
- `pitstop_last_mileage_{car_id}_{item_id}` — 마지막 정비 시 주행거리

## 긴급도 계산 로직

```
// km 기준
km_remaining = interval_km - (current_mileage - last_logged_mileage)
km_ratio = km_remaining / urgency_threshold_km

// 시간 기준
days_elapsed = today - last_logged_date
days_remaining = (interval_months × 30) - days_elapsed
days_ratio = days_remaining / urgency_threshold_days

// 최종 ratio: 둘 중 작은 값 (interval_km이 null이면 해당 ratio 제외)
ratio = min(km_ratio, days_ratio)

// 상태 판정
overdue  → ratio ≤ 0
urgent   → 0 < ratio ≤ 1
ok       → ratio > 1
unknown  → 계산 불가
```

목록 정렬: ratio 오름차순 (과기한 먼저, unknown 마지막)

**stat 단위 결정:**
- `interval_km` 존재 → "N km 초과" / "N km 남음"
- `interval_km: null` (시간 기반만) → "N개월 남음" / "N일 초과"
- 기록 없음 → "—" + "미기록"

## DB 스키마 (Phase 2)

```sql
create table user_cars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  car_id text not null,
  current_mileage int not null default 0,
  mileage_updated_at timestamptz default now()
);

create table maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  car_id text not null,
  item_id text not null,
  logged_at timestamptz default now(),
  mileage_at_log int,
  note text          -- 선택 입력 메모 (예: "합성유 5W-30, 오일필터 동시 교체")
);
```

## 테스트 전략

### Unit
- `calculateUrgency`: overdue / urgent / ok / unknown 4가지 상태
- `sortByUrgency`: 혼합 상태 정렬 순서

### E2E (Playwright)
- 신규 유저: 차종 선택 → 주행거리 입력 → 소모품 목록 (10초 이내)
- 복귀 유저: 앱 재진입 → localStorage 복원 → 올바른 긴급도 표시
- PWA 오프라인: 서비스 워커 캐시로 Phase 1 전체 기능 동작

### 엣지 케이스
- `last_logged_date === null` (신규) → unknown 표시
- `currentMileage` 미입력 + `interval_km` 존재 → km ratio 생략, 시간 ratio만
- `interval_km && interval_months` 둘 다 → min(ratio) 사용
- 음수 주행거리 입력 → 유효성 검사
- 이전 기록보다 낮은 주행거리 입력 처리
