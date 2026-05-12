# Pitstop PWA — Phase 1 할 일 목록

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
