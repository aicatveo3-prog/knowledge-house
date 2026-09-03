# 지식의 집

브라우저에서 직접 글을 쓰고 발행하는 개인 지식 저장소입니다.
서버 없이 **GitHub 저장소를 데이터베이스처럼** 사용합니다.

```
글 작성 → GitHub API로 커밋 → Actions가 색인 생성 → Pages 배포
```

## 처음 설정

### 1. GitHub Pages 켜기

저장소 **Settings → Pages** 에서 **Source** 를 `GitHub Actions` 로 선택합니다.

### 2. 토큰 발급

사이트에 접속해 우측 상단 **⚙ 설정** 을 열면 안내가 나옵니다. 요약하면:

1. GitHub → Settings → Developer settings
2. Personal access tokens → **Fine-grained tokens** → Generate new token
3. **Repository access** → *Only select repositories* → 이 저장소만 선택
4. **Permissions** → Repository permissions → **Contents** 를 *Read and write* 로
5. 생성된 토큰을 사이트 설정 창에 붙여넣기

토큰은 브라우저의 `localStorage` 에만 저장되며 저장소에 올라가지 않습니다.
따라서 사이트를 방문한 다른 사람은 글을 쓰거나 고칠 수 없습니다.

> ⚠️ 공용 컴퓨터에서는 토큰을 저장하지 마세요. 유출이 의심되면 GitHub 설정에서 즉시 무효화할 수 있습니다.

## 구조

| 경로 | 설명 |
| --- | --- |
| `index.html` | 글 목록 (검색, 태그 필터) |
| `write.html` | 에디터 (슬래시 서식 메뉴, 이미지 붙여넣기) |
| `post.html` | 글 보기 (수정, 삭제, 변경 기록) |
| `posts/` | 발행된 글 (마크다운) |
| `drafts/` | 초안 |
| `assets/images/` | 업로드된 이미지 |
| `data/posts.json` | 목록 색인 — Actions가 배포 시 생성 (커밋되지 않음) |
| `scripts/build-index.mjs` | 색인 생성 스크립트 |
| `config.js` | 사이트 이름, 대상 저장소 설정 |

## 글 파일 형식

```markdown
---
title: 글 제목
date: 2026-09-03
tags: [태그1, 태그2]
status: 자라는 중
---

본문을 마크다운으로 씁니다.
```

## 단축키

| 단축키 | 하는 일 |
| --- | --- |
| `/` | 에디터에서 서식 메뉴 열기 |
| `Ctrl`/`Cmd` + `S` | 초안 저장 |
| `Ctrl`/`Cmd` + `Enter` | 발행 |
| `Ctrl`/`Cmd` + `Shift` + `P` | 미리보기 전환 |
| `Ctrl`/`Cmd` + `K` | 목록에서 검색창으로 이동 |

## 로컬에서 확인하기

`file://` 로 열면 브라우저 보안 정책 때문에 목록을 읽지 못합니다. 간단한 서버를 띄워주세요.

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## 설정 바꾸기

`config.js` 에서 사이트 이름, 소개 문구, 대상 저장소를 바꿀 수 있습니다.

```js
window.SITE_CONFIG = {
  siteName: '지식의 집',
  tagline: '읽고 생각한 것을 쌓아두는 곳',
  owner: 'aicatveo3-prog',
  repo: 'knowledge-house',
  branch: 'main',
  ...
};
```
