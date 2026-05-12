# 커밋 규칙

**하나의 커밋 = 하나의 논리적 변경**

## 메시지 형식
```
<type>(<scope>): <요약>
```

| type | 사용 시점 |
|------|-----------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `refactor` | 동작 변화 없는 코드 정리 |
| `style` | 디자인·CSS (로직 무관) |
| `data` | 소모품 JSON 등 정적 데이터 |
| `docs` | 문서 |
| `chore` | 설정, 의존성, 빌드 |

## 예시
```
feat(dashboard): 봐야 할 항목 / 전체보기 뷰 토글 구현
feat(urgency): calculateUrgency 함수 구현
data(cars): 아반떼 MD 소모품 JSON 추가 (17개 항목)
style(card): 과기한 카드 테두리 스타일 적용
fix(localStorage): 이전 기록보다 낮은 주행거리 입력 방어 처리
```

## 커밋 금지 파일
- `.env`, `.env.local`
- `node_modules/`
- `.next/`, `out/`
