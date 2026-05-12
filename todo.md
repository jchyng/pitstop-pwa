# Pitstop PWA — Phase 1 할 일 목록

## 0. 프로젝트 생성 (직접)
```bash
npx create-next-app@latest . --typescript --eslint --no-tailwind --app --src-dir --import-alias "@/*"
npm install next-pwa
```

---

## 1. 타입 정의
- [ ] `src/types/index.ts` — `ConsumableItem`, `CarData`, `UrgencyStatus`, `UrgencyResult`, `ItemWithUrgency`

## 2. 긴급도 계산 로직
- [ ] `src/lib/urgency.ts` — `calculateUrgency()` 함수 구현
  - km 기반 ratio, 일수 기반 ratio → min() → 상태 판정
  - displayText: "N km 초과" / "N km 남음" / "N개월 남음" / "— / 미기록"
- [ ] `src/lib/urgency.test.ts` — Vitest 단위 테스트 (과기한·위급·정상·알수없음 케이스)

## 3. localStorage 레이어
- [ ] `src/lib/storage.ts` — get/setMileage, get/setLastLog, get/setLastMileage
  - 키 형식: `pitstop_mileage_{car_id}`, `pitstop_last_log_{car_id}_{item_id}`, `pitstop_last_mileage_{car_id}_{item_id}`

## 4. 정적 JSON 데이터 (3개 차종)
- [ ] `public/cars/avante-md-gasoline.json` — 아반떼 MD 가솔린 (15~17개 항목)
- [ ] `public/cars/grandeur-hg-gasoline.json` — 그랜저 HG 가솔린
- [ ] `public/cars/rexton-sports-khan-diesel.json` — 렉스턴 스포츠 칸 디젤
- [ ] `public/cars/index.json` — 차종 목록 인덱스

## 5. 글로벌 CSS (디자인 토큰)
- [ ] `src/app/globals.css` — `docs/DESIGN.md`의 모든 CSS 변수 적용
  - `:root` (라이트) + `@media (prefers-color-scheme: dark)`
  - Noto Sans KR Google Fonts import

## 6. UI 컴포넌트
- [ ] `src/components/StatusChip.tsx` — 과기한/위급/정상/알수없음 배지
- [ ] `src/components/ConsumableCard.tsx` — 소모품 카드 (이름 + 상태 + 남은 km/월)
- [ ] `src/components/CategorySection.tsx` — 전체보기 카테고리 헤더 + 카드 목록
- [ ] `src/components/ViewToggle.tsx` — "봐야 할 항목 (N)" / "전체보기" 탭
- [ ] `src/components/CarChip.tsx` — 상단 차종 선택 칩 (선택 UI 포함)
- [ ] `src/components/MileageInput.tsx` — 현재 주행거리 입력 + 저장
- [ ] `src/components/AlertBanner.tsx` — 과기한/위급 항목 수 요약 배너
- [ ] `src/components/BottomNav.tsx` — 하단 3탭 내비게이션

> 시각적 기준: `design-reference/main-dashboard.html`

## 7. 메인 페이지
- [ ] `src/app/page.tsx` — 메인 대시보드
  - 상태: `selectedCarId`, `currentMileage`, `carData`, `view`('attention'|'full')
  - 봐야 할 항목: overdue+urgent만, ratio 오름차순 정렬, 두 섹션 구분
  - 전체보기: 6개 카테고리 섹션으로 그룹핑

## 8. PWA 설정
- [ ] `public/manifest.json` — name, icons(192/512), theme_color, display: standalone
- [ ] `public/icons/` — icon-192x192.png, icon-512x512.png
- [ ] `next.config.ts` — next-pwa 래핑

---

## 커밋 순서
```
chore(setup): Next.js + TypeScript + next-pwa 초기 설정
feat(types): ConsumableItem, CarData, UrgencyResult 타입 정의
feat(urgency): calculateUrgency 함수 + 단위 테스트
feat(storage): localStorage 레이어 구현
data(cars): 아반떼 MD · 그랜저 HG · 렉스턴 스포츠 칸 JSON 추가
style(tokens): DESIGN.md CSS 변수 globals.css 적용
feat(components): StatusChip, ConsumableCard, ViewToggle 등 UI 컴포넌트
feat(dashboard): 메인 대시보드 페이지 구현
chore(pwa): manifest.json + 아이콘 + next-pwa 설정
```

---

## 완료 전 체크리스트 (`.claude/rules/checklist.md`)
```bash
npx tsc --noEmit
npx eslint .
npx vitest run
npm run build
```
