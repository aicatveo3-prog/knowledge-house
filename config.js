/**
 * 사이트 설정
 * 이 파일만 고치면 사이트 이름, 대상 저장소를 바꿀 수 있습니다.
 */
window.SITE_CONFIG = {
  // 사이트 이름 (헤더에 표시)
  siteName: '지식의 집',

  // 홈 화면 상단 소개 문구 (비우면 표시 안 함)
  tagline: '읽고 생각한 것을 쌓아두는 곳',

  // 글이 저장될 GitHub 저장소
  owner: 'aicatveo3-prog',
  repo: 'knowledge-house',
  branch: 'main',

  // 메인 메뉴(홈)에 항상 보여줄 폴더(책) 목록
  // 글이 아직 없어도 여기에 적힌 폴더는 카드로 나타납니다.
  // 새 책을 추가하려면 이 배열에 이름만 넣으면 됩니다. (예: '책4')
  declaredFolders: ['책1', '책2', '책3', '책4'],

  // 글이 저장되는 폴더
  postsDir: 'posts',
  draftsDir: 'drafts',
  imagesDir: 'assets/images',

  // 글마다 짝이 되는 문서들이 저장되는 폴더
  // posts/2026-09-03-챕터1.md
  //   ↔ summaries/2026-09-03-챕터1.md  (요약본)
  //   ↔ originals/2026-09-03-챕터1.md  (원문)
  //   ↔ posts2/2026-09-03-챕터1.md     (정리2)
  //   ↔ summaries2/2026-09-03-챕터1.md (요약본2)
  summariesDir: 'summaries',
  originalsDir: 'originals',
  posts2Dir: 'posts2',
  summaries2Dir: 'summaries2',
};
