# Work 그림: 텍스트 발췌를 프로젝트 그림으로 바꾸기

2026-10-20. 시안은 이 대화의 브라우저 시안 화면에서 골랐다. 시안 코드는 저장소 밖 세션 임시 폴더에 있고(`atl-in-work.html`, `self-portrait-b2.html`), 구현 때 `scripts/work-art/` 의 생성기로 옮겨 커밋한다.

## 1. 의도

Work 의 두 항목은 오른쪽 칸에 각 프로젝트에서 뽑은 한국어 문장(“ChatGPT 공개…”, “백남준은 TV로 그림을 그렸고…”)을 크게 보여 줬다. 사이트 주인이 보기에 이 문장들은 프로젝트가 무엇인지 와닿게 하지 못했다. 그 자리를 프로젝트마다 하나씩, 그 프로젝트다운 정지 그림으로 바꾼다.

- **AI Timeline Log**: 그 프로젝트가 실제로 쓰는 목판 엔진으로 새긴 판 한 장. “입력창에 질문을 쓰는 일이 곧 AI를 쓰는 일이 됐다”를 그림으로 옮긴다.
- **lucasflatwhite.com**: 이 랜딩 사이트가 해 보는 시도(단어가 흐르는 들판, Anybody 의 폭 축)를 그림 한 장으로. 고흐의 1889년 자화상처럼 파란 소용돌이 속에 앉은 고양이를, 붓질 대신 단어로 칠한 “자화상”이다.

## 2. 목표, 비목표, 안티 목표

**목표**
- 두 그림 모두 정지된 SVG 파일 하나씩. 런타임 JavaScript 없이 `<img>` 로 뜬다.
- 두 그림은 같은 3:2 비율(720×480)과 같은 짙은 파랑 바탕(`--blue-deep`)을 써서 한 쌍으로 보인다.
- 그림은 미리 한 번 생성해 저장소에 커밋한다. 다시 만들 수 있도록 생성 스크립트도 커밋한다(`scripts/build-type-sorts.py` 와 같은 방식).

**비목표**
- 애니메이션. 지금의 발췌 제목 스크롤 효과(`excerpt-set`)도 함께 없앤다.
- three.js 나 캔버스로 페이지에서 그리기.
- 프로젝트 요약, 태그, 링크, Source 버튼 바꾸기. 왼쪽 칸은 그대로다.
- AI Timeline Log 저장소 수정. 엔진 코드는 이 저장소로 옮겨 온다(같은 작성자, MIT).

**안티 목표** (기술적으로 동작해도 실패로 본다)
- 그림 안의 단어가 시스템 대체 글꼴로 그려지는 것. 폭 축이 무시되어 B-3 의 “붓의 힘”이 사라지는 것.
- 목판 결이 경로 단순화로 뭉개져 목판처럼 보이지 않는 것.
- 승인된 시안과 다른 그림(구도, 색, 밀도, 시드가 바뀐 것).
- 랜딩 페이지가 눈에 띄게 무거워지는 것. 기준은 gzip 기준 두 그림 합쳐 약 150KB 이하다.
- 이미지가 뜨면서 레이아웃이 밀리는 것.

## 3. 결정된 것

사이트 주인이 고른 것과 내가 정한 것을 나눠 적는다.

| 항목 | 결정 | 누가 |
|---|---|---|
| 형식 | 정지 이미지, SVG | 사이트 주인 |
| AI Timeline Log 장면 | 입력창 판 (시안 1-B) | 사이트 주인 |
| AI Timeline Log 색 | 짙은 파랑 바탕에 흰 선 (시안 2-C) | 사이트 주인 |
| lucasflatwhite.com 장면 | 단어로 칠한 고양이 자화상, “붓의 힘” (시안 B-3) | 사이트 주인 |
| 고양이 | 프로필 고양이가 아니라 그냥 앉아 있는 고양이 | 사이트 주인 |
| 그림 아래 설명 글 | 없음. 설명은 `alt` 로만 | 내 결정 |
| 배치 | 지금 발췌가 있던 오른쪽 칸(7fr), 폭 100%. 휴대폰에서는 요약 아래 한 칸 | 내 결정 |
| 파일 위치 | `src/assets/work/*.svg`, 콘텐츠 스키마의 `image()` 로 연결 | 내 결정 |

### 3.1 AI Timeline Log 판 (시안 1-B, 2-C)

`ai-timeline-log/src/engine` 의 `compose`, `engrave`, `vignette`, 난수 함수를 그대로 옮겨 쓴다. 판 테두리는 원본 `border()` 와 달리 위쪽 여백을 비우지 않고 네 변 모두 같은 간격으로 새긴다(`m = 8 + s`, 선 굵기 `s × 2.2`).

승인된 값:
- 판 720×480, `s = 6`, `mode: 'rings'`, 중심 `(360, 244)`, `maxR 0.9`, `seed 5`, `sweep 2.2`.
- 밑그림 순서:
  1. 전체에 `rgba(0,0,0,.08)` 을 깐다.
  2. 비네트 0.15.
  3. 중심 원판. 반지름 250, `rgba(0,0,0,.22)`.
  4. 입력창. `(96, 196)` 에서 528×96, 모서리 48. 흰색으로 채우고 검정 20px 선을 두른다.
  5. 커서. `(150, 220)` 에서 14×48.
  6. 보내기 버튼. `(574, 244)` 에 반지름 30 원, 그 안에 흰 화살표.
  7. 테두리.
- 색: 바탕 `#16278a`, 선 `#f2f3f7`. 64개 버킷을 모두 한 색으로 채우므로 경로는 하나다.

### 3.2 고양이 자화상 (시안 B-3)

단어 흐름 생성기는 시안 화면 `self-portrait-b2.html` 의 B-3 그대로다. 아래 값을 바꾸지 않는다.

- **앉은 고양이 윤곽**: 머리 타원, 두 귀, 가슴, 엉덩이, 앞다리 둘, 발 둘, 꼬리. 시안 좌표를 그대로 쓰고 `x − 36` 만큼 옮긴다.
- **윤곽 구멍 메우기**: 판 가장자리에서 닿지 않는 바탕(꼬리가 감싼 틈)은 고양이로 친다.
- **소용돌이 여섯 개**: 시안의 `vort` 목록 그대로. 각 소용돌이 중심 18px 안에는 흐름을 두지 않는다.
- **흐름 배치**:
  - 바탕: 칸 8, 글자 크기 10, 굵기 250–760.
  - 고양이: 칸 6, 글자 크기 9.4, 굵기 500–900.
  - 시드 63.
- **붓의 힘**: 한 흐름 안에서 단어마다 `p = sin(πt) × (0.6 + 0.4 × 난수)` 를 구한다. 굵기는 범위 안에서 `p` 만큼, 폭은 `70% + 60% × p`.
- **색**:
  - 바탕 단어는 `#3d57d9 #5b6fe0 #2b43c8 #8494ea #b8c1ee` 를 시안의 가중치로 섞는다.
  - 고양이 털은 크레마 계열, 가슴과 주둥이는 밝은 크림.
  - 고양이 밑에는 `#5c3a1e` 를 0.9 로 깐다.
  - 윤곽은 `#0e1a5e` 2.4px.
- **단어 목록**: 시안의 `groundWords`, `catWords` 그대로. 고양이 쪽에 `lucas · flatwhite · 루카스 · 플랫화이트` 가 섞여 있다.
- **얼굴**: 눈, 동공, 눈의 빛, 코, 입, 수염. 시안 그대로.

## 4. 제약과 시험 결과

`<img>` 로 띄운 SVG 는 바깥 글꼴을 불러오지 못한다. 그래서 자화상은 쓰는 글자만 남긴 글꼴을 SVG 안에 base64 로 넣는다. 구현 전에 시험해 봤다.

- **시험 방법**: B-3 시안을 `XMLSerializer` 로 꺼냈다. `@fontsource-variable/anybody` 의 latin standard woff2 와, 쓰인 한글 50자를 덮는 Noto Sans KR 조각 11개를 줄이지 않은 채 넣었다. 그 파일을 `<img>` 로 Chrome 155 와 WebKit 27.2 에서 띄웠다.
- **결과**: 두 엔진이 같은 그림을 그렸다. 경로를 따라 휘는 글자, 단어마다 달라지는 굵기와 폭이 시안과 같다. 한글 글꼴을 뺀 대조군은 한글이 시스템 글꼴로 바뀌어 글자 흐름까지 달라졌다. 그러니 내장 글꼴이 실제로 쓰인다.
- **크기**: 그림 본문은 96KB(gzip 23KB). 글꼴을 줄이지 않은 파일 전체는 gzip 261KB 라서, 쓰는 글자만 남기는 단계가 꼭 필요하다.
- **목판 크기**: 경로를 그대로 두면 581KB(gzip 214KB)다. 점을 줄이고(허용 오차 0.15px) 좌표를 0.5px 단위 상대 좌표로 쓰면 97KB(gzip 29KB)가 된다. 2배 확대 화면에서 원본과 구별되지 않았다.

## 5. 만드는 방법

### 5.1 생성 스크립트 (`scripts/work-art/`)

- 생성기는 브라우저에서 돈다. 밑그림을 캔버스로 래스터화하고 SVG 직렬화가 필요해서다. Node 스크립트가 설치된 Chrome 을 `playwright-core` 로 띄워 생성기를 돌리고, 결과 SVG 문자열을 받아 후처리한 뒤 `src/assets/work/` 에 쓴다.
- 새 개발 의존성은 둘이다. `playwright-core`(브라우저를 내려받지 않고 설치된 Chrome 사용)와 `subset-font`(harfbuzz 로 글꼴 줄이기, 가변 축 유지). `subset-font` 가 woff2 입력이나 가변 축을 제대로 다루지 못하면, `build-type-sorts.py` 처럼 fonttools(`pyftsubset`)로 바꾼다.
- **목판 후처리**: 하위 경로마다 Ramer–Douglas–Peucker 단순화(0.15px), 0.5px 반올림, 상대 좌표 `l`.
- **자화상 후처리**:
  - 최종 SVG 의 글자 내용 전체에 공백 하나를 더해 쓰인 글자 집합을 만든다. 단어 목록에서 만들지 않는다.
  - Anybody 는 latin standard woff2 를 그 글자로 줄이되 wght·wdth 축을 둘 다 남긴다. `@font-face` 에 `font-weight: 100 900; font-stretch: 50% 150%` 를 적는다.
  - Noto Sans KR 은 쓰인 한글이 들어 있는 fontsource 조각마다 줄여서, 조각의 `unicode-range` 를 단 `@font-face` 로 각각 넣는다. `font-weight: 100 900`.
- **두 SVG 공통**: 루트에 `xmlns`, `viewBox="0 0 720 480"`, `width="720" height="480"` 을 둔다. Astro 가 크기를 읽고 레이아웃이 밀리지 않게 하기 위해서다. 바깥 URL 참조는 없다.
- **재현성**: 같은 시드로 같은 파일이 나와야 한다. 다시 돌렸을 때 diff 가 없어야 한다.
- 재생성 명령은 README 의 Development 목록에 적는다.

### 5.2 사이트

- `src/content.config.ts`: `excerpt` 를 빼고 `art: { image: image(), alt: string }` 을 넣는다. 스키마는 `({ image }) => z.object(...)` 형태가 된다. “실제 발췌가 증거” 라는 주석은 “프로젝트를 한 장으로 보여 주는 그림” 으로 바꾼다.
- `src/content/projects/*.md`: `excerpt` 블록을 지우고 `art` 를 적는다. alt 초안:
  - AI Timeline Log: `A woodcut plate: a chat input with a blinking caret, its grain cut in rings that spread outward.`
  - lucasflatwhite.com: `A tabby cat seated in blue swirls after Van Gogh's 1889 self-portrait, every stroke a word that swells in weight and width.`
- `src/pages/index.astro`: Work 목록은 `art` 가 있는 항목만 보여 준다. 오른쪽 칸은 `<figure class="work-art"><img src width height alt loading="lazy" decoding="async"></figure>`.
- `src/styles/landing.css`: `.excerpt*` 규칙과 `excerpt-set` 키프레임을 지운다. `.work-art img` 는 `display: block; width: 100%; height: auto`. 모서리는 각지게 둔다(각진 모서리 규칙).

### 5.3 테스트 (`tests/work-art.test.ts`)

- Work 에 나오는 프로젝트마다 `art` 가 있고, 파일이 있고, alt 가 비어 있지 않다.
- 두 SVG 모두 다음을 만족한다.
  - `xmlns`, `viewBox`, `width`, `height` 가 있다.
  - `http(s)://` 참조는 `xmlns` 와 `xlink` 선언뿐이다.
- 자화상은 다음을 만족한다.
  - Anybody `@font-face` 에 굵기 범위와 폭 범위가 있다.
  - 글자 내용의 모든 한글이 내장된 Noto 조각 하나의 `unicode-range` 안에 든다.
- 크기 예산(gzip): 목판 40KB 이하, 자화상 100KB 이하. 실제로 재 보고 정한다. 예산을 넘으면 늘리지 말고 알린다.
- 기존 anti-slop 테스트를 통과한다. alt 와 문서에 en/em 대시를 쓰지 않는다.

### 5.4 문서

- 이 문서.
- `docs/superpowers/specs/2026-10-05-landing-redesign-plan.md` 에 날짜를 단 항목으로 남긴다.
  - 첫 화면 링크 정렬: 따로 커밋한 변경이다.
  - Work 의 발췌를 그림으로 바꾼 것.
- README 의 Work 설명과 폴더 구조, 재생성 명령.

## 6. 확인

- 생성된 두 파일을 `<img>` 로 Chrome 과 WebKit 에서 띄운다. 승인된 시안 캡처와 나란히 놓고 구도, 색, 밀도가 같은지 본다.
- 목판은 2배 화면에서 단순화 전후를 비교한다.
- 로컬 빌드에서 Work 구간을 1440px 와 390px 로 캡처한다. 그림이 뜨기 전후로 레이아웃이 움직이지 않아야 한다.
- `npm test`, `npm run check`, `npm run build`.

## 7. 구현하는 사람에게 맡기는 것

- 생성기 모듈을 어떻게 나눌지, 브라우저에 어떻게 넣을지(작은 정적 서버 또는 스크립트 주입).
- 테스트의 정확한 예산 숫자(5.3 의 상한 안에서).
- npm 스크립트 이름.
