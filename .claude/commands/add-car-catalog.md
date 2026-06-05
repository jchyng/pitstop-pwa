---
description: 차량 취급설명서 PDF → 정비 JSON + 메뉴얼 인덱스 자동 생성
---

차량 취급설명서 PDF를 분석하여 정비 항목 JSON과 메뉴얼 인덱스를 생성하는 커맨드입니다.

## 인자 형식

```
/add-car-catalog <car_id> <PDF경로> [선택 메타데이터]
```

- `$ARGUMENTS`에서 첫 번째 토큰을 **car_id**로 파싱한다 (예: `avante-cn7-gasoline`)
- `.pdf` 확장자를 가진 토큰을 **PDF 경로**로 파싱한다
- 나머지 텍스트는 **추가 컨텍스트** (차량명, 연식, 취급설명서 버전 등)로 활용한다

입력값: `$ARGUMENTS`

---

## 작업 순서

### 1. 인자 파싱 및 사전 확인

1. `$ARGUMENTS`에서 car_id와 PDF 경로를 추출한다.
2. PDF 경로가 없으면 작업을 중단하고 사용법을 안내한다.
3. `public/cars/index.json`을 읽어 해당 car_id가 이미 존재하는지 확인한다.
   - 존재하면: 업데이트 모드로 진행한다고 사용자에게 알린다.
   - 존재하지 않으면: 신규 등록 모드임을 알린다.

### 2. PDF 전체 구조 파악

Read 툴로 PDF 파일을 읽어 전체 내용을 파악한다 (최대 20페이지씩 분할).

- 총 페이지 수를 확인한다.
- 다음 키워드가 등장하는 페이지를 찾는다: `정비`, `교체`, `점검`, `주기`, `km`, `개월`, `엔진오일`, `브레이크`, `타이어`, `냉각수`, `점화`, `에어필터`, `변속기`, `가혹`, `일반 조건`, `가혹 조건`.
- 정비 주기 표(정기 점검 항목표)가 있는 페이지들을 **관련 페이지 목록**으로 선정한다.
- 표에 **일반 조건**과 **가혹 조건** 컬럼이 모두 있는지 특별히 확인한다.

### 3. 관련 페이지를 이미지로 추출

선정된 페이지들을 Python(PyMuPDF)을 사용해 이미지로 추출한다.

`public/manuals/{car_id}/` 디렉토리가 없으면 먼저 생성한다:

```bash
mkdir -p public/manuals/{car_id}
```

그 다음 아래 Python 스크립트로 페이지를 이미지로 추출한다 (페이지 번호는 0-based):

```python
import fitz  # PyMuPDF
import sys

pdf_path = sys.argv[1]
output_dir = sys.argv[2]
pages = [int(p) for p in sys.argv[3:]]  # 0-based 페이지 번호

doc = fitz.open(pdf_path)
for page_num in pages:
    page = doc[page_num]
    mat = fitz.Matrix(2.0, 2.0)  # 2x 해상도 (144 DPI)
    pix = page.get_pixmap(matrix=mat)
    out_path = f"{output_dir}/page-{page_num + 1}.png"
    pix.save(out_path)
    print(f"Saved: {out_path}")
doc.close()
```

스크립트를 `/tmp/extract_pdf_pages.py`에 저장하고 Bash로 실행한다.

### 4. 추출된 이미지 분석 및 카테고리 분류

추출된 이미지 파일들을 Read 툴로 읽어 **내용 기반으로** 다음 6개 카테고리 중 어디에 해당하는지 판단한다:

| 카테고리 (name_ko) | 슬러그 |
|--------------------|--------|
| 엔진·오일 | `engine-oil` |
| 연료·증발가스 | `fuel-evap` |
| 공조·외부 | `hvac-exterior` |
| 제동·냉각·변속 | `brake-coolant-transmission` |
| 점화·벨트 | `ignition-belt` |
| 타이어·배터리 | `tire-battery` |

- 한 이미지에 복수 카테고리가 포함된 경우 주요 카테고리로 분류하거나, 가장 관련 깊은 카테고리 슬러그를 사용한다.
- 같은 카테고리 이미지가 여러 장이면 `-2`, `-3` 순번을 붙인다.

### 5. 이미지 최종 저장 (이름 변경 포함)

추출된 이미지(`page-N.png`)를 카테고리 슬러그 기반으로 이름 변경하여 복사한다:

- 형식: `{category-slug}.png` (예: `engine-oil.png`)
- 복수일 때: `engine-oil-2.png`, `engine-oil-3.png`
- Bash의 `cp` 명령으로 복사하고 원본 `page-N.png`는 삭제한다.

### 6. `public/manuals/{car_id}/index.json` 생성 또는 업데이트

아래 스키마를 따른다:

```json
{
  "car_id": "{car_id}",
  "source": "{취급설명서 출처 — PDF나 인자에서 추출, 없으면 '{차량명} 취급설명서'}",
  "version": "{연도판 — PDF나 인자에서 추출, 없으면 null}",
  "categories": {
    "엔진·오일": {
      "images": ["/manuals/{car_id}/engine-oil.png"],
      "page_ref": "{PDF에서 읽은 페이지 번호, 없으면 빈 문자열}"
    },
    "연료·증발가스": { "images": [], "page_ref": "" },
    "공조·외부": { "images": [], "page_ref": "" },
    "제동·냉각·변속": { "images": [], "page_ref": "" },
    "점화·벨트": { "images": [], "page_ref": "" },
    "타이어·배터리": { "images": [], "page_ref": "" }
  }
}
```

- 이미지가 없는 카테고리도 빈 배열로 반드시 포함한다.
- 파일이 이미 존재하면 해당 카테고리의 `images` 배열에 경로를 추가(중복 제외)하고 나머지 필드는 유지한다.

### 7. `public/cars/{car_id}.json` 생성 또는 업데이트

**이미지에서 직접 추출한 데이터**를 우선으로 하고, 다음 규칙으로 보완한다:

#### 가혹 조건 우선 원칙

한국 실도로 환경(도심 정체, 단거리 반복, 혹서·혹한)은 제조사 기준 **가혹 조건**에 해당한다. 따라서 아래 우선순위로 주기를 결정한다:

1. **가혹 조건 컬럼이 있으면** → 해당 값을 `interval_km` / `interval_months`로 사용한다.
2. **가혹 조건 컬럼이 없으면** → 일반 조건 값을 사용하되, `notes`에 `"일반 조건 기준 (취급설명서 가혹 조건 미기재)"` 를 기록한다.
3. **표 자체가 없거나 판독 불가면** → 유사 차종 JSON을 참고해 합리적으로 채우고, `notes`에 `"추정값 (취급설명서 판독 불가)"` 를 기록한다.

가혹 조건 값을 사용한 항목의 `notes`에는 `"가혹 조건 기준"` 을 기재한다. 기존 notes 내용이 있으면 ` · ` 로 연결한다.

#### 기타 추출 규칙

- `urgency_threshold_km` = `interval_km`의 10%, `urgency_threshold_days` = `interval_months` × 30일의 10% (소수점 반올림, 최솟값 1)로 계산한다.
- `max_km`: 취급설명서에 마지노선(절대 교환 한계)이 명시된 경우에만 채운다. 없으면 `null`.
- `behavior` 규칙:
  - 점검만 하는 항목 (브레이크패드, 증발가스 계통 등) → `inspect_only`
  - 교체만 하는 항목 → `replace_only`
  - 점검 후 교체 기준이 별도인 항목 → `both`

스키마:
```json
{
  "car_id": "{car_id}",
  "name_ko": "{name_ko}",
  "items": [ /* ConsumableItem[] */ ]
}
```

파일이 이미 존재하면 덮어쓰지 않고 사용자에게 확인 후 진행한다.

### 8. `public/cars/index.json` 업데이트

car_id가 index.json에 없으면 다음 항목을 배열 끝에 추가한다:

```json
{
  "car_id": "{car_id}",
  "name_ko": "{name_ko}",
  "brand": "{brand — 인자나 car_id에서 추론}",
  "model_name": "{model_name}",
  "model": "{model}",
  "fuel": "{gasoline|diesel|ev|hev — car_id 접미사에서 추론}",
  "file": "/cars/{car_id}.json"
}
```

`brand` 추론 규칙 (car_id 기반):
- 현대: avante, sonata, grandeur, tucson, santafe, kona, ioniq, palisade, staria, veloster, i30, accent, veracruz
- 기아: k3, k5, k7, k8, sportage, sorento, carnival, seltos, niro, ev6, morning, ray, stinger
- KGM: rexton, tivoli, korando, musso

### 9. 완료 보고

다음 내용을 한국어로 요약하여 출력한다:
- PDF에서 발견된 관련 페이지 번호 목록
- 생성/업데이트된 파일 목록
- 각 페이지 → 카테고리 → 저장 경로 매핑
- 항목별 주기 출처: 가혹 조건 / 일반 조건 / 추정 구분 목록
- PDF에서 읽지 못해 추정으로 채운 항목 목록 (있으면)
- `public/cars/index.json`에 신규 추가 여부

---

## 주의사항

- `public/cars/index.json`은 JSON 배열 포맷을 유지한다 (후행 쉼표 금지).
- 원본 PDF 파일은 삭제하지 않는다.
- `docs/ARCHITECTURE.md`의 ConsumableItem 스키마와 일치하는 JSON만 생성한다.
- Phase 1 규칙: Supabase·외부 API 호출 없이 정적 파일만 생성한다.
- PyMuPDF(`fitz`)가 없으면 `pip3 install pymupdf --break-system-packages`로 먼저 설치한다.
