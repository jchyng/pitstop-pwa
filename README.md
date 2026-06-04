# 프로젝트 가이드

## 화면 목록

| 경로 | 역할 |
| ---- | ---- |
| `/` | 메인 대시보드. 차량 선택·주행거리 입력·소모품 긴급도 목록 |
| `/items/[itemId]` | 소모품 상세. 정비 이력 타임라인 + 기록 추가/수정/삭제 + 교체 주기 커스텀 |
| `/log` | 정비 이력 전체 조회. 차량 전환·카테고리 필터 |
| `/guide` | 정비 주기 가이드. 소모품별 공식 권장 주기 표시 + 취급설명서 이미지 뷰어 |
| `/cost` | 유지비 관리. 정비·보험·세금·주유·기타 지출 기록 및 월별 집계 |
| `/settings` | 설정 (미구현, 준비 중) |

---

## 정보 저장 위치 가이드

## 차량 정보 (정적 데이터)

| 경로 | 내용 |
| ---- | ---- |
| `public/cars/index.json` | 지원 차량 목록 (car_id, brand, model, fuel, 각 JSON 파일 경로) |
| `public/cars/{car_id}.json` | 차량별 소모품 점검 주기 데이터 (items 배열) |
| `public/manuals/{car_id}/index.json` | 차량 취급설명서 카테고리별 이미지 및 페이지 참조 |

`car_id` 형식: `{모델명}-{세대코드}-{연료}` (예: `avante-cn7-gasoline`)

## 이미지 파일

| 경로 | 내용 |
| ---- | ---- |
| `public/cars/images/{car_id}.png` | 차량 이미지 (파일명은 세대코드까지만, 예: `avante-md.png`) |
| `public/icons/icon-192x192.png` | PWA 아이콘 192px |
| `public/icons/icon-512x512.png` | PWA 아이콘 512px |

## 새 차량 추가 절차

1. `public/cars/index.json` — 배열 끝에 항목 추가
   ```json
   {
     "car_id": "model-generation-fuel",
     "name_ko": "차종명",
     "brand": "현대 | 기아 | KGM | ...",
     "model_name": "모델명",
     "model": "모델명 세대코드",
     "fuel": "gasoline | diesel | ev | hev",
     "file": "/cars/model-generation-fuel.json"
   }
   ```
2. `public/cars/{car_id}.json` — 소모품 항목 배열 작성 (스키마: `docs/ARCHITECTURE.md`)
3. (선택) `public/cars/images/{model}-{generation}.png` — 차량 이미지 추가
4. (선택) `public/manuals/{car_id}/index.json` — 취급설명서 데이터 추가 (아래 참고)

## 취급설명서 이미지 추가 절차

`public/manuals/{car_id}/index.json` 파일을 만들고 카테고리별로 이미지 경로를 채운다.

```json
{
  "car_id": "avante-cn7-gasoline",
  "source": "아반떼 CN7 취급설명서",
  "version": "2020년판",
  "categories": {
    "엔진·오일": {
      "images": ["/manuals/avante-cn7-gasoline/engine-table.jpg"],
      "page_ref": "p.4-12"
    }
  }
}
```

- 이미지 파일은 `public/manuals/{car_id}/` 안에 저장
- 카테고리 키는 소모품 JSON의 `category` 값과 일치해야 함
- 이미지가 없는 카테고리는 `"images": []` 로 두거나 키 자체를 생략

## 사용자 데이터 (localStorage, Phase 1)

모든 키는 `src/lib/storage.ts`에서 관리한다.

| localStorage 키 | 내용 |
| --------------- | ---- |
| `pitstop_my_car_ids` | 사용자가 등록한 차량 ID 배열 |
| `pitstop_mileage_{car_id}` | 차량 현재 주행거리 |
| `pitstop_last_log_{car_id}_{item_id}` | 마지막 정비 날짜 (YYYY-MM-DD) |
| `pitstop_last_mileage_{car_id}_{item_id}` | 마지막 정비 시 주행거리 |
| `pitstop_last_log_type_{car_id}_{item_id}` | 마지막 정비 유형 (`replace` \| `inspect`) |
| `pitstop_logs_{car_id}` | 정비 이력 배열 (`LogEntry[]`) |
| `pitstop_migrated_{car_id}` | 기존 단일 키 → 이력 배열 마이그레이션 완료 여부 |
| `pitstop_custom_intervals_{car_id}` | 사용자 커스텀 교체 주기 |
| `pitstop_expenses_{car_id}` | 유지비 지출 기록 |

---

## 알려진 미완성 항목

| 항목 | 위치 | 상태 |
| ---- | ---- | ---- |
| `behavior: 'both'` 긴급도 계산 | `src/lib/urgency.ts` | 타입·필드는 정의됨. 실제 `inspect_interval_km/months` 분기 로직 미구현 |
| `manual_spec` 필드 | `src/types/index.ts`, 각 차량 JSON | 필드 선언만 있고 모든 JSON에 데이터 미수집 |
| 취급설명서 이미지 | `public/manuals/` | `avante-cn7-gasoline`만 빈 껍데기(index.json)로 존재. 나머지 차종 미생성 |
| 소모품 이모지 | 미정 | 기획 메모에만 언급됨, 미착수 |
| `/settings` 페이지 | `src/app/settings/page.tsx` | "준비 중" 텍스트만 있음 |
| `item_type` 필드 | `src/types/index.ts` | `behavior`로 대체됨. `@deprecated` 표시, 제거 전 마이그레이션 확인 필요 |
