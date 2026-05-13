# 작업 완료 → 체크 후 커밋

1. **정합성** — 변경 코드가 `docs/ARCHITECTURE.md` 데이터 구조·긴급도 로직과 일치하는가
2. **디자인** — 새 컴포넌트가 `docs/DESIGN.md` 토큰(`--color-*`, `--radius-*` 등)을 쓰는가
3. **Phase 범위** — `docs/PRD.md`의 Phase 1 범위를 벗어난 기능이 없는가

```bash
npx tsc --noEmit   # 타입 에러 없어야 함
npx eslint .       # 린트 에러 없어야 함
npm test -- --run  # 유닛 테스트 통과 (설정된 경우)
npm run build      # 빌드 에러 없어야 함
```

모두 통과하면 `/commit` 커맨드로 커밋을 실행한다. 문제가 있으면 수정 후 재실행한다.
