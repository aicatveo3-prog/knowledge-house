/**
 * 폴더 구조 계산
 *
 * 폴더는 파일을 옮기지 않고 글의 메타데이터로 관리합니다.
 *   folder: 책1            → 책1 폴더
 *   folder: 독서/책1        → 독서 안의 책1 폴더
 *   folder 없음             → 미분류
 *
 * 파일 경로가 그대로이므로 글을 다른 폴더로 옮겨도 주소가 바뀌지 않습니다.
 */
(function () {
  /** 폴더가 없는 글이 모이는 곳 */
  const UNFILED = '__unfiled__';
  const UNFILED_LABEL = '미분류';

  /** '  독서 / / 책1 / ' → '독서/책1' */
  function normalizePath(input) {
    return String(input == null ? '' : input)
      .replace(/\\/g, '/')
      .split('/')
      .map((part) => part.trim())
      .filter(Boolean)
      .join('/');
  }

  function segments(path) {
    const clean = normalizePath(path);
    return clean ? clean.split('/') : [];
  }

  function parentOf(path) {
    const parts = segments(path);
    parts.pop();
    return parts.join('/');
  }

  function nameOf(path) {
    const parts = segments(path);
    return parts.length ? parts[parts.length - 1] : '';
  }

  /** 한 폴더가 다른 폴더 안에 있는지 */
  function isInside(path, ancestor) {
    const a = normalizePath(ancestor);
    if (!a) return true;
    const p = normalizePath(path);
    return p === a || p.startsWith(a + '/');
  }

  // ── 정렬 ──────────────────────────────────

  // '챕터2' 가 '챕터10' 보다 앞에 오도록 숫자를 알아보는 비교
  let collator = null;
  try {
    collator = new Intl.Collator('ko', { numeric: true, sensitivity: 'base' });
  } catch (e) {
    collator = null;
  }

  function naturalCompare(a, b) {
    const x = String(a == null ? '' : a);
    const y = String(b == null ? '' : b);
    if (collator) return collator.compare(x, y);
    return x.localeCompare(y);
  }

  function byRecent(a, b) {
    const da = a.date || '';
    const db = b.date || '';
    if (da !== db) return db.localeCompare(da);
    return String(b.id || '').localeCompare(String(a.id || ''));
  }

  function byOrder(a, b) {
    const cmp = naturalCompare(a.title, b.title);
    if (cmp !== 0) return cmp;
    return String(a.id || '').localeCompare(String(b.id || ''));
  }

  /**
   * 이 폴더의 글에 알맞은 정렬을 고른다.
   * 제목에 숫자가 든 글이 둘 이상이면 연재물로 보고 순서대로,
   * 아니면 최신순으로 본다.
   */
  function detectSortMode(posts) {
    const numbered = posts.filter((p) => /\d/.test(String(p.title || ''))).length;
    return numbered >= 2 ? 'order' : 'recent';
  }

  function sortPosts(posts, mode) {
    const copy = posts.slice();
    copy.sort(mode === 'order' ? byOrder : byRecent);
    return copy;
  }

  // ── 나무 만들기 ────────────────────────────

  /**
   * 글 목록에서 폴더 나무를 만든다.
   * → Map<경로, { path, name, direct, total, children[] }>
   *    direct: 이 폴더에 바로 담긴 글 수
   *    total:  하위 폴더까지 합친 글 수
   */
  function buildTree(posts) {
    const nodes = new Map();

    function ensure(path) {
      if (nodes.has(path)) return nodes.get(path);
      const node = {
        path,
        name: nameOf(path),
        direct: 0,
        total: 0,
        children: [],
      };
      nodes.set(path, node);

      const parent = parentOf(path);
      if (parent) ensure(parent).children.push(node);
      return node;
    }

    (posts || []).forEach((post) => {
      const path = normalizePath(post.folder);
      if (!path) return;

      ensure(path).direct += 1;

      // 조상 폴더의 합계도 올린다
      let cursor = path;
      while (cursor) {
        ensure(cursor).total += 1;
        cursor = parentOf(cursor);
      }
    });

    // 형제끼리 이름순으로
    nodes.forEach((node) => {
      node.children.sort((a, b) => naturalCompare(a.name, b.name));
    });

    return nodes;
  }

  /** 이 경로 바로 아래의 폴더들 */
  function childrenOf(nodes, path) {
    const clean = normalizePath(path);

    if (!clean) {
      const roots = [];
      nodes.forEach((node) => {
        if (!parentOf(node.path)) roots.push(node);
      });
      roots.sort((a, b) => naturalCompare(a.name, b.name));
      return roots;
    }

    const node = nodes.get(clean);
    return node ? node.children : [];
  }

  /** 이 폴더에 바로 담긴 글 */
  function postsIn(posts, path) {
    const clean = normalizePath(path);
    return (posts || []).filter((p) => normalizePath(p.folder) === clean);
  }

  /** 폴더를 정하지 않은 글 */
  function unfiledPosts(posts) {
    return (posts || []).filter((p) => !normalizePath(p.folder));
  }

  /** 글에 쓰인 모든 폴더 경로 (자동완성용) */
  function allPaths(posts) {
    const set = new Set();
    (posts || []).forEach((p) => {
      const path = normalizePath(p.folder);
      if (!path) return;
      // 중간 경로도 후보에 넣는다
      const parts = path.split('/');
      for (let i = 1; i <= parts.length; i++) {
        set.add(parts.slice(0, i).join('/'));
      }
    });
    return [...set].sort(naturalCompare);
  }

  /** 빵가루 내비에 쓸 조각들 */
  function breadcrumb(path) {
    const parts = segments(path);
    return parts.map((name, i) => ({
      name,
      path: parts.slice(0, i + 1).join('/'),
    }));
  }

  window.Folders = {
    UNFILED,
    UNFILED_LABEL,
    normalizePath,
    segments,
    parentOf,
    nameOf,
    isInside,
    naturalCompare,
    detectSortMode,
    sortPosts,
    buildTree,
    childrenOf,
    postsIn,
    unfiledPosts,
    allPaths,
    breadcrumb,
  };
})();
