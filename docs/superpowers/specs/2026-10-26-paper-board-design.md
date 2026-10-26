# 홈을 차가운 종이 보드로

2026-10-26. 시안은 이 대화의 브라우저 비교에서 골랐다. 비교 화면은 저장소의 `.superpowers/`에 있고, 그 폴더는 커밋하지 않는다.

이 문서는 `docs/superpowers/specs/2026-10-20-work-art-design.md`의 “애니메이션은 하지 않는다”와 “그림은 `<img>`로만 보여 준다”를 두 기존 그림에 한해 바꾼다. 그 문서의 그림 내용, 비율, 색은 유지한다.

## 1. 의도

홈은 지금 파란 글자 밭 위의 큰 이름이다. 그 아래 작업, 활자 프레스, 플레이 띠가 세로로 쌓인다. 이를 차가운 종이 위의 한 화면으로 바꾼다. 큰 이름은 남고, 작업 상자가 그 옆에 앉는다. 개발 중인 프로젝트가 늘어도 첫 화면의 칸 수는 늘지 않는다.

## 2. 목표와 범위 밖

**목표**

- 홈의 바닥은 `#fafafa`, 글자는 `#171717`, 선은 `#ebebeb`, 모서리는 6px이다.
- 첫 화면에 상단 막대, 이름, 링크, 작업 상자 둘, 스네이크 상자가 함께 있다.
- 새 프로젝트 글 하나가 보드와 ⌘K를 함께 늘린다.
- `/play`의 게임 판과 규칙은 그대로다.

**범위 밖**

- `/play`의 캔버스, 글자 밭, 점수, 입력, 게임 안의 신원 띠를 다시 배치하거나 다시 칠하는 일.
- 새 영상 파일. 새 프로젝트를 위한 맞춤 애니메이션.
- 프로젝트 글의 제목, 요약, 태그, 주소를 다시 쓰는 일.
- 명령 메뉴의 검색, Esc, 이메일 복사 동작을 바꾸는 일.

## 3. 결정

| 항목 | 결정 |
|---|---|
| 바닥 | 차가운 종이. 홈에만 적용 |
| 첫 화면 | 이름과 상자가 한 화면 |
| 이름 반응 | 가까운 글자가 최대 5px 움직이고, 굵기가 450에서 610까지 변한다 |
| 첫 화면의 작업 | `order`가 큰 그림 있는 작업 둘 |
| 그 아래 | 나머지 그림 있는 작업, 그다음 바닥글 |
| 스네이크와 링크 | 프로젝트 목록 밖. 첫 화면에서 밀리지 않음 |
| 상자 내용 | 그림, 제목, 요약, 태그, 소스 |
| 두 기존 그림 | 캐럿과 획이 움직이도록 층을 다시 그린다 |
| 이후 그림 | 정지 `<img>` |
| 활자 프레스 | 홈에서 제거하고 코드도 지운다 |
| 홈 플레이 띠 | 제거. 스네이크 상자가 `/play`로 보낸다 |
| 상단 | 아바타, `lucas.flatwhite`, ⌘K. Work와 Play 글자 링크는 없음 |
| ⌘K | 종이 메뉴. 작업은 보드와 같은 순서로 Work와 Play 사이 |
| 그림 없는 `featured` | ⌘K에만 있다 |
| `featured: false` | 보드와 ⌘K 둘 다 없음 |

## 4. 홈의 순서

720px보다 넓은 화면의 첫 화면은 두 열이다. 720px 이하에서는 한 열이다. 이 기준은 `/play`가 이미 쓰는 폭과 같다.

- 왼쪽: 이름, 한글 이름, 소개, 주요 링크.
- 오른쪽 열의 행 비율은 `1.35fr 0.9fr 0.7fr`이다. 위가 첫 작업, 가운데가 둘째 작업, 아래가 스네이크다. 그림은 칸을 채우며 잘린다.

720px 이하에서는 이름과 링크 다음에 작업 순서로 상자가 오고, 두 번째 작업 다음에 스네이크가 온다. 나머지 작업이 그 뒤를 잇는다.

첫 화면 아래의 작업은 두 열 격자다. 그림이 있는 작업만 세어, 3번째, 6번째, 9번째 상자가 두 행을 차지해 높이가 달라진다. 720px 이하에서는 이 확장을 하지 않고, 그림 비율 그대로 한 줄로 쌓는다.

바닥글은 그 다음이다.

- `siteLinks` 전부. 아이콘, 이름, blurb. 지금보다 작은 본문 크기이고, 가는 선으로 구분한다.
- `Set in Anybody and Noto Sans KR.`
- `Press ⌘K to jump anywhere.` 맥이 아니면 지금처럼 `Ctrl K`다. 굵은 포인터가 없는 환경에서는 지금처럼 이 줄을 숨긴다.
- `© {year} Lucas Flatwhite`

바닥글에 큰 이름을 다시 찍지 않는다. `Every line of moving text is laid out with pretext.`는 홈에서 빼는 문장이다. pretext는 `/play`에 남는다.

이름 칸의 링크는 `featuredLinks`다. 바닥글과 ⌘K는 `siteLinks` 전부다. 이 구분은 유지한다.

## 5. 이름

서체는 Anybody Variable과 Noto Sans KR Variable 그대로다. 한글 줄은 `lang="ko"`다.

이름 두 줄의 크기는 `clamp(48px, 6.5vw, 120px)`, 쉬는 굵기는 450, 행간은 0.86이다. 한글 이름과 소개 문장은 `siteProfile`의 문장 그대로이고 움직이지 않는다.

포인터가 글자에서 120px 안에 있으면 그 글자만 포인터 쪽으로 최대 5px 움직이고, 굵기는 `450 + 영향 × 160`이다. 포인터가 떠나면 제자리와 굵기 450으로 돌아온다. `prefers-reduced-motion: reduce`이면 이 반응을 걸지 않는다.

홈의 글자 밭 캔버스는 없다.

## 6. 프로젝트 데이터

스키마에 선택 필드 하나를 더한다.

```ts
motion: z.enum(['caret', 'strokes']).optional()
```

`ai-timeline-log.md`는 `motion: caret`, `lucasflatwhite-com.md`는 `motion: strokes`다. 새 글은 이 필드를 쓰지 않는다.

정렬은 한 함수다. `featured`만 남기고, `order`가 큰 것이 앞이다. `order`가 같으면 제목의 오름차순으로 고정한다. 보드와 ⌘K가 이 함수를 함께 쓴다.

나누기:

- 메뉴: 정렬된 `featured` 전부. 그림이 없어도 포함한다.
- 보드: 그 가운데 그림이 있는 것.
- 첫 화면: 보드의 앞 둘.
- 아래 줄: 보드의 나머지.

`order`를 올리면 그 작업이 위로 간다. 새 글의 `order`를 기존 최댓값보다 1 크게 주면 첫 화면의 위 칸을 차지하고, 밀린 작업은 아래 줄로 간다.

상자에는 그림, 제목, 요약, 태그, 소스가 있다. 제목은 `href`로 가는 외부 링크다. `repo`가 있을 때만 Source가 있고, 그 주소로 간다. 저장소가 없으면 Source 줄은 없다. 대체 텍스트는 글의 `art.alt`다.

`motion`이 없으면 그림은 `<img>`다. `caret`이나 `strokes`면 생성된 SVG를 그 자리에 인라인한다. 인라인 SVG에 약속한 요소가 없으면 애니메이션 없이 그림을 보여 주고, 상자를 비우지 않는다.

약속한 요소:

- 목판 SVG는 캐럿만 따로 둔 요소를 가지고 `id="caret"`이다. 캐럿은 1.1초 간격으로 깜빡인다.
- 초상화 SVG의 단어는 한 그룹 `id="strokes"` 안에 있다. 그 단어의 굵기가 450과 700 사이를 천천히 왕복한다.

두 파일은 `npm run art`로 다시 만들고 커밋한다. 그림의 장면, 3:2, 720×480, 짙은 파랑 바탕은 2026-10-20 문서 그대로다. 이 애니메이션은 그 두 파일에만 있다.

`prefers-reduced-motion: reduce`이면 캐럿과 획은 멈춘다.

## 7. 스네이크 상자

첫 화면의 마지막 칸은 어두운 상자다. 바탕 `#171717`, 글자 `#fff`, 모서리 6px, 보이는 이름은 Snake다. 링크의 접근 가능한 이름은 `Play Snake, in a field of words`이고, 주소는 홈의 `play/`다.

상자 안은 작은 격자를 도는 뱀의 미리보기다. 먹이 경쟁, CPU, 단어 밭, 점수는 없다. `snake-experience.ts`를 부르지 않는다. 상자 전체가 하나의 링크다.

`prefers-reduced-motion: reduce`이면 움직이는 루프 없이 한 프레임만 보여 준다.

## 8. 상단과 ⌘K

상단 막대는 홈과 `/play`가 같은 구성이다. 아바타, `lucas.flatwhite`( `#top`으로 가는 링크. `/play`에서는 홈으로 간다), ⌘K 버튼. 지금 홈 상단의 Work, Play 글자 링크는 빼는 것이다.

메뉴 순서는 Work, 프로젝트, Play, `siteLinks`다. Work는 홈의 `#work`로 간다. `/play`에서 열어도 홈의 `#work`로 간다. Play는 `/play/`로 간다. 프로젝트 항목의 id는 `project-`에 글의 슬러그를 붙인다. 라벨은 제목, 힌트는 태그를 `, `로 잇는다. 주소는 `href`이고 새 탭으로 연다.

메뉴 표면은 흰 바탕, `#ebebeb` 선, 모서리 6px이다. 선택된 행은 `#171717` 바탕에 흰 글자다. 이 스타일은 홈과 `/play`에서 같다. 검색, Esc, 빈 결과 문장 `Nothing matches that.`, 이메일 복사는 유지한다.

## 9. 색이 새지 않게

종이 토큰과 `color-scheme: light`는 `body.landing`에만 둔다. `:root`의 파랑을 종이색으로 바꾸지 않는다. 홈 문서의 바탕도 종이다. `/play`의 문서 바탕과 `theme-color` `#1f35b5`는 유지한다. 홈의 `theme-color`는 `#fafafa`다.

`/play`에는 이 상단 막대와 종이 메뉴만 더한다. `SnakeExperience`, `play.css`, 게임 규칙, 게임 안의 신원 띠는 수정하지 않는다.

홈의 글자 밭이 사라지면 홈은 `view-transition-name: text-field`에 참여하지 않는다. `play.css`와 `global.css`에 있는 그 전이 규칙은 그대로 둔다. 스네이크 상자에 그 이름을 붙이지 않는다. `body` 전역 규칙에 `overflow: hidden`을 넣지 않는다. `/play`의 스크롤 잠금은 `body.play`에만 있다.

## 10. 지우는 파일

홈에서만 쓰이므로 구현과 함께 지운다.

- `src/lib/type-case.ts`
- `src/lib/type-case-loader.ts`
- `src/lib/press-timeline.ts`
- `src/lib/specimen.ts`
- `src/lib/play-band.ts`
- `src/lib/text-field.ts`
- `src/data/type-sorts.json`
- `scripts/build-type-sorts.py`
- `tests/type-case-source.test.ts`
- `tests/press-timeline.test.ts`
- `tests/specimen-source.test.ts`

`three`와 `@types/three`는 `type-case.ts`만 쓴다. 의존성에서 빼는 것이다. `@chenglou/pretext`는 `/play`가 쓰므로 남긴다.

README의 Set by hand 설명과 `build-type-sorts.py` 안내도 지운다. 홈이 종이 보드라는 설명으로 바꾼다.

`tests/routes-source.test.ts`는 홈이 `mountSpecimen`, `mountPlayBand`, `#play`, 글자 밭 캔버스를 갖지 않는다고 바꾼다. `tests/site-data.test.ts`의 섹션 목록은 `top`, `work`다. `homepageSections`에서 `play`를 빼는 이유다. Play는 섹션이 아니라 페이지다.

## 11. 테스트

정렬과 나누기를 단위 테스트로 고정한다.

- `order` 1, 2, 3인 featured 작업은 3, 2, 1 순이다.
- 같은 `order`는 제목 오름차순이다.
- `featured: false`는 메뉴와 보드에 없다.
- 그림이 없는 featured는 메뉴에만 있고, 보드의 앞 둘과 아래 줄에 없다.
- 그림이 있는 것이 다섯이면 앞 둘이 첫 화면, 나머지 셋이 아래 줄이다.

⌘K 단위 테스트:

- 순서는 Work, 프로젝트(위와 같은 정렬), Play, 링크다.
- 프로젝트 id는 `project-`로 시작하고 서로 겹치지 않는다.
- 프로젝트는 새 탭이다. 이메일은 복사고, GitHub와 Twitter만 그 밖의 외부 링크다.
- Work의 주소는 베이스 경로의 `#work`다. Play의 주소는 베이스 경로의 `play/`다.

그림 생성 결과:

- 목판 SVG에 `id="caret"`이 있다.
- 초상화 SVG에 `id="strokes"`가 있다.

소스 계약:

- 홈은 `snake-experience`를 import하지 않는다.
- 홈은 `specimen`, `play-band`, `type-case`를 import하지 않는다.
- `/play`는 `SnakeExperience`를 그대로 마운트한다.

## 12. 실패할 때의 동작

- 그림 층이 없으면 정지 그림으로 보여 준다.
- 클립보드를 거절하면 이메일은 지금처럼 `mailto:`로 연다.
- 움직임을 줄이면 이름, 캐럿, 획, 스네이크 미리보기는 멈춘다. 링크 아이콘의 기존 호버 동작은 유지한다.
- 작업이 둘보다 적어도 빈 칸을 만들지 않는다. 스네이크는 있는 작업 다음에 온다.
