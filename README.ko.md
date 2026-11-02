# lucasflatwhite.com

[English](README.md) | 한국어

저는 문제를 발견하고 해결 방법을 찾는 일을 좋아하는 소프트웨어 엔지니어, 루카스 플랫화이트입니다. 이곳에 직접 만든 프로젝트와 X에 올리는 AI 소식, 일상 사진을 모아 둡니다.

[사이트 방문하기](https://www.lucasflatwhite.com/) · [GitHub](https://github.com/lucas-flatwhite) · [X](https://x.com/lucas_flatwhite)

## 담고 있는 것

- 종이 게시판에 프로젝트와 작업 관련 링크를 담았습니다. 사진 카드는 여러 사진을 차례로 보여 줍니다.
- 영수증 모양의 Daily Shot 카드를 누르면 AI 소식을 올리는 X로 이동합니다.
- ChatGPT 이후 생성형 AI를 기록한 [AI Timeline Log](https://www.lucasflatwhite.com/ai-timeline-log/)와 작은 브라우저 게임을 모은 [Flatwhite Arcade](https://www.lucasflatwhite.com/arcade/)로 연결됩니다.
- 명령 메뉴(`Cmd/Ctrl + K`)에서 프로젝트와 링크로 바로 이동할 수 있습니다.

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
