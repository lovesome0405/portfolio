# portfolio

유주상의 포트폴리오 사이트입니다. 한국폴리텍대학 춘천캠퍼스 AI융합과.

수록 프로젝트: MARU, 내돈내편, Villagen, Lolypoly, 공통 RAG 엔진

## 구조

- `index.html`: 페이지 본문
- `style.css`: 페이지 스타일 (장별 배경 색조, 점 목차, 상세 구간 배치)
- `script.js`: 장마다 바뀌는 배경색과 점 형체, 점 목차, 나타나기 (외부 라이브러리 없음, `prefers-reduced-motion`이면 움직임을 끔)
- `assets/`: 각 프로젝트의 실제 화면 캡처와 시연 영상
- `drafts/`: 리디자인 시안 기록

빌드 과정이 없는 정적 사이트라 `index.html`을 브라우저로 바로 열어 볼 수 있습니다.

## 배포

GitHub Pages: Settings → Pages → Source를 `Deploy from a branch`, Branch를 `main` / `(root)`로 지정합니다.
