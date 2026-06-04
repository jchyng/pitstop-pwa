# Phase 1 구현 현황

## 완성

| 기능 | 주요 파일 |
| ---- | --------- |
| 차량 목록 로드 및 선택 (캐러셀) | `src/app/page.tsx`, `src/components/CarCarousel.tsx` |
| 차량 추가 / 삭제 | `src/components/AddCarSheet.tsx`, `src/lib/storage.ts` |
| 주행거리 입력 및 수정 | `src/components/MileageSheet.tsx` |
| 소모품 긴급도 계산 | `src/lib/urgency.ts` |
| 봐야 할 항목 / 전체보기 토글 | `src/components/ViewToggle.tsx` |
| 정비 기록 추가 (교체 / 점검) | `src/components/LogSheet.tsx` |
| 정비 기록 수정 / 삭제 | `src/components/EditLogSheet.tsx` |
| 정비 이력 타임라인 조회 | `src/components/Timeline.tsx`, `src/app/log/page.tsx` |
| 소모품 교체 주기 커스텀 | `src/components/IntervalEditSheet.tsx` |
| 정비 주기 가이드 | `src/app/guide/page.tsx`, `src/components/GuideCategory.tsx` |
| 취급설명서 이미지 뷰어 (UI) | `src/components/ManualViewerSheet.tsx` |
| 유지비 입력 / 조회 / 수정 / 삭제 | `src/app/cost/page.tsx`, `src/components/ExpenseSheet.tsx` |
| 커스텀 항목 추가 / 기록 / 삭제 | `src/components/AddCustomItemSheet.tsx`, `src/lib/storage.ts` |

## 미완성

| 기능 | 상태 | 비고 |
| ---- | ---- | ---- |
| `/settings` 페이지 | 미착수 | "준비 중" 텍스트만 표시 |
| `manual_spec` 데이터 수집 | 미착수 | 차량 JSON에 필드 선언만 있음 |
| 취급설명서 이미지 수집 | 미착수 | `avante-cn7-gasoline` 빈 껍데기만 존재 |
| 소모품 이모지 | 미착수 | 기획 메모에 언급, 디자인 미확정 |
| 차종 검색 대소문자 무시 | 미착수 | `AddCarSheet` 검색 필터에 적용 필요 |

## Phase 2 이후 (미착수)

- 카카오 로그인 (Supabase Custom OAuth)
- localStorage → Supabase PostgreSQL 마이그레이션
- 기기 간 정비 이력 동기화
- 웹 푸시 알림 (Supabase Edge Functions + VAPID)
- iOS 홈 화면 추가 안내 UI
