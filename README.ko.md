# lucasflatwhite.com

[English](README.md) | 한국어

저는 문제를 발견하고 해결 방법을 찾는 일을 좋아하는 소프트웨어 엔지니어, 루카스 플랫화이트입니다. 이곳에 직접 만든 프로젝트와 X에 올리는 AI 소식, 일상 사진을 모아 둡니다.

[사이트 방문하기](https://lucasflatwhite.com/) · [GitHub](https://github.com/lucas-flatwhite) · [X](https://x.com/lucas_flatwhite)

## 담고 있는 것

- 종이 게시판에 프로젝트와 작업 관련 링크를 담았습니다. 사진 카드는 여러 사진을 차례로 보여 줍니다.
- 영수증 모양의 Daily Shot 카드를 누르면 AI 소식을 올리는 X로 이동합니다.
- 제가 쓴 책 「루카스의 쉽게 배우고 바로 써먹는 클로드 완벽 활용법」을 입체 책 카드로 담았습니다. 누르면 책이 펼쳐지며 살 수 있는 서점 다섯 곳이 나옵니다.
- 카카오페이손해보험 사원증 카드에서는 작은 화면이 제가 하는 일을 답해 줍니다. 누르면 보험을 바라보는 제 시각을 담은 짧은 글이 열립니다.
- ChatGPT 이후 생성형 AI를 기록한 [AI Timeline Log](https://lucasflatwhite.com/ai-timeline-log/)와 작은 브라우저 게임을 모은 [Flatwhite Arcade](https://lucasflatwhite.com/arcade/)로 연결됩니다.
- 명령 메뉴(`Cmd/Ctrl + K`)에서 프로젝트와 책, 링크로 바로 이동할 수 있습니다.

Astro, TypeScript, SVG로 만들었습니다. [AI Timeline Log](https://github.com/lucas-flatwhite/ai-timeline-log)와 [Flatwhite Arcade](https://github.com/lucas-flatwhite/flatwhite-arcade)는 각각 별도 저장소에서 개발하고 배포합니다. 이 사이트에서 하나의 도메인으로 연결합니다.

## 로컬에서 실행하기

```sh
npm install
npm run dev          # http://localhost:4321/
```

```sh
npm run check
npm test -- --run
npm run build
```

프로젝트는 `src/content/projects/`, 사진은 `src/content/photos/`, 프로필은 `src/data/site.ts`에서 관리합니다. 사진 추가, 그림 생성, 개별 앱 연결 방법은 [개발 문서(영문)](docs/development.md)에 정리했습니다.
