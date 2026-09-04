/**
 * 글 하나가 가질 수 있는 문서 종류
 *
 *   posts/<id>.md      정리   — 기본 글
 *   summaries/<id>.md  요약본
 *   originals/<id>.md  원문
 *
 * 세 파일은 이름이 같아서 짝이 됩니다.
 * 종류를 더 늘리려면 여기 KINDS 에 한 줄만 추가하면 됩니다.
 */
(function () {
  const cfg = () => window.SITE_CONFIG || {};

  const KINDS = [
    { key: 'main', label: '정리', dirKey: 'postsDir' },
    { key: 'summary', label: '요약본', dirKey: 'summariesDir' },
    { key: 'original', label: '원문', dirKey: 'originalsDir' },
  ];

  function all() {
    return KINDS.slice();
  }

  function byKey(key) {
    return KINDS.find((k) => k.key === key) || null;
  }

  /** 기본 글이 아닌 종류들 (요약본, 원문) */
  function companions() {
    return KINDS.filter((k) => k.key !== 'main');
  }

  function isCompanion(key) {
    return !!key && key !== 'main' && !!byKey(key);
  }

  function dirOf(key) {
    const kind = byKey(key);
    if (!kind) return '';
    return cfg()[kind.dirKey] || '';
  }

  function pathFor(key, id) {
    const dir = dirOf(key);
    if (!dir || !id) return '';
    return `${dir}/${id}.md`;
  }

  function labelOf(key) {
    const kind = byKey(key);
    return kind ? kind.label : '';
  }

  /** 색인에 쓰는 이름: summary → hasSummary */
  function flagName(key) {
    return 'has' + key.charAt(0).toUpperCase() + key.slice(1);
  }

  window.Docs = {
    all,
    byKey,
    companions,
    isCompanion,
    dirOf,
    pathFor,
    labelOf,
    flagName,
  };
})();
