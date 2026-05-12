# 코드 작성 원칙

- 디자인 값은 항상 `docs/DESIGN.md`의 CSS 변수 사용 (`--color-*`, `--radius-*` 등)
- 소모품 데이터 구조는 `docs/ARCHITECTURE.md`의 JSON 스키마를 따름
- **Phase 1 범위**: 정적 JSON + localStorage만. Supabase·인증 코드 작성 금지
- 컴포넌트는 `design-reference/` HTML을 시각적 기준으로 삼되, Next.js/React 방식으로 구현
