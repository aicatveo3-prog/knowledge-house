/**
 * 홈 — 폴더 카드로 시작해서 폴더 안으로 들어간다
 *
 *   index.html                 최상위 폴더 카드
 *   index.html?folder=책1      책1 폴더 안 (하위 폴더 + 글)
 *   index.html?tag=독서        태그로 걸러진 글
 *   검색어를 넣으면 폴더와 상관없이 전체에서 찾는다
 */
(function () {
  const cfg = window.SITE_CONFIG;
  const el = App.el;
  const F = window.Folders;

  const state = {
    posts: [],
    drafts: [],
    tree: new Map(),
    folder: '',
    query: '',
    tag: null,
    showDrafts: false,
    sortMode: null, // 사용자가 고른 정렬 (null 이면 자동)
  };

  const listNode = document.getElementById('list');
  const tagNode = document.getElementById('tag-row');
  const searchNode = document.getElementById('search');
  const draftBtn = document.getElementById('toggle-drafts');
  const crumbNode = document.getElementById('breadcrumb');

  // ── 데이터 불러오기 ─────────────────────────

  async function loadIndex() {
    try {
      const res = await fetch(`data/posts.json?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const data = await res.json();
      return Array.isArray(data.posts) ? data.posts : [];
    } catch (e) {
      return null;
    }
  }

  async function loadFromApi(dir) {
    return (await GH.listDir(dir)).filter(
      (f) => f.type === 'file' && f.name.endsWith('.md')
    );
  }

  async function fileToPost(file, extra = {}) {
    const found = await GH.readFile(file.path);
    if (!found) return null;
    const { meta, body } = MD.parseFrontmatter(found.text);
    const id = file.name.replace(/\.md$/, '');
    return {
      id,
      path: file.path,
      title: meta.title || id,
      date: meta.date || '',
      folder: F.normalizePath(meta.folder),
      tags: meta.tags || [],
      status: meta.status || '',
      excerpt: MD.excerpt(body),
      readingTime: MD.readingTime(body),
      ...extra,
    };
  }

  async function load() {
    const indexed = await loadIndex();
    let posts = (indexed || []).map((p) => ({
      ...p,
      folder: F.normalizePath(p.folder),
    }));

    if (Store.hasToken()) {
      try {
        const files = await loadFromApi(cfg.postsDir);
        const liveIds = new Set(files.map((f) => f.name.replace(/\.md$/, '')));

        posts = posts.filter((p) => liveIds.has(p.id));

        const known = new Set(posts.map((p) => p.id));
        const missing = files
          .filter((f) => !known.has(f.name.replace(/\.md$/, '')))
          .slice(0, 30);

        const fetched = await Promise.all(
          missing.map((f) => fileToPost(f, { pending: !!indexed }))
        );
        posts = posts.concat(fetched.filter(Boolean));

        const draftFiles = await loadFromApi(cfg.draftsDir);
        const drafts = await Promise.all(
          draftFiles.slice(0, 30).map((f) => fileToPost(f, { draft: true }))
        );
        state.drafts = drafts.filter(Boolean);

        if (state.drafts.length) {
          draftBtn.classList.remove('hidden');
          draftBtn.textContent = `초안 ${state.drafts.length}개`;
        }
      } catch (err) {
        if (err.status !== 404) App.toast(err.message, 'error');
      }
    }

    state.posts = posts;
    state.tree = F.buildTree(posts);
    render();
  }

  // ── 화면 조각 ─────────────────────────────

  function renderBreadcrumb() {
    crumbNode.innerHTML = '';

    if (!state.folder && !state.tag && !state.query) {
      crumbNode.classList.add('hidden');
      return;
    }
    crumbNode.classList.remove('hidden');

    crumbNode.appendChild(
      el('a', { class: 'crumb', href: 'index.html', text: '전체' })
    );

    if (state.query) {
      crumbNode.appendChild(el('span', { class: 'crumb-sep', text: '›' }));
      crumbNode.appendChild(
        el('span', { class: 'crumb is-current', text: `'${state.query}' 검색` })
      );
      return;
    }

    if (state.tag) {
      crumbNode.appendChild(el('span', { class: 'crumb-sep', text: '›' }));
      crumbNode.appendChild(
        el('span', { class: 'crumb is-current', text: '#' + state.tag })
      );
      return;
    }

    F.breadcrumb(state.folder).forEach((part, i, arr) => {
      crumbNode.appendChild(el('span', { class: 'crumb-sep', text: '›' }));
      const last = i === arr.length - 1;
      crumbNode.appendChild(
        last
          ? el('span', { class: 'crumb is-current', text: part.name })
          : el('a', {
              class: 'crumb',
              href: 'index.html?folder=' + encodeURIComponent(part.path),
              text: part.name,
            })
      );
    });
  }

  function folderCard(node) {
    const bits = [];
    if (node.children.length) {
      bits.push(`폴더 ${node.children.length}개`);
    }
    bits.push(`글 ${node.total}편`);

    return el('a', {
      class: 'folder-card',
      href: 'index.html?folder=' + encodeURIComponent(node.path),
    }, [
      el('span', { class: 'folder-icon', text: '🗂' }),
      el('span', { class: 'folder-body' }, [
        el('span', { class: 'folder-name', text: node.name }),
        el('span', { class: 'folder-meta', text: bits.join(' · ') }),
      ]),
      el('span', { class: 'folder-arrow', text: '→' }),
    ]);
  }

  function unfiledCard(count) {
    return el('a', {
      class: 'folder-card is-unfiled',
      href: 'index.html?folder=' + encodeURIComponent(F.UNFILED),
    }, [
      el('span', { class: 'folder-icon', text: '📄' }),
      el('span', { class: 'folder-body' }, [
        el('span', { class: 'folder-name', text: F.UNFILED_LABEL }),
        el('span', { class: 'folder-meta', text: `글 ${count}편` }),
      ]),
      el('span', { class: 'folder-arrow', text: '→' }),
    ]);
  }

  function postRow(post, index, showFolder) {
    const meta = [];

    if (typeof index === 'number') {
      // 연재물은 순서를 앞에 보여준다
      meta.push(el('span', { class: 'post-index', text: String(index) }));
    }
    if (post.date) meta.push(el('span', { text: App.formatDate(post.date) }));
    if (post.readingTime) {
      meta.push(el('span', { class: 'dot' }));
      meta.push(el('span', { text: `${post.readingTime}분` }));
    }
    if (post.status) meta.push(el('span', { class: 'badge', text: post.status }));
    if (showFolder && post.folder) {
      meta.push(el('span', { class: 'badge badge-folder', text: post.folder }));
    }
    (post.tags || []).slice(0, 3).forEach((t) => {
      meta.push(el('span', { class: 'badge', text: '#' + t }));
    });
    if (post.hasOriginal) {
      meta.push(el('span', { class: 'badge badge-original', text: '원문' }));
    }
    if (post.pending) {
      meta.push(el('span', { class: 'badge badge-pending', text: '반영 중' }));
    }
    if (post.draft) {
      meta.push(el('span', { class: 'badge badge-draft', text: '초안' }));
    }

    const href =
      'post.html?id=' +
      encodeURIComponent(post.id) +
      (post.draft ? '&draft=1' : '');

    return el('li', { class: 'post-item' }, [
      el('a', { href }, [
        el('h2', { text: post.title }),
        post.excerpt ? el('p', { text: post.excerpt }) : null,
        el('div', { class: 'post-meta' }, meta),
      ]),
    ]);
  }

  /** 글 목록 + 정렬 바꾸기 */
  function postSection(posts, options = {}) {
    const wrap = el('div', { class: 'post-section' });
    if (!posts.length) return wrap;

    const auto = F.detectSortMode(posts);
    const mode = state.sortMode || auto;
    const sorted = F.sortPosts(posts, mode);

    if (options.title || posts.length > 1) {
      const head = el('div', { class: 'section-head' }, [
        el('h2', { class: 'section-title', text: options.title || '글' }),
        el('span', { class: 'spacer' }),
      ]);

      if (posts.length > 1) {
        head.appendChild(
          el('button', {
            class: 'btn btn-sm btn-quiet',
            type: 'button',
            text: mode === 'order' ? '순서대로' : '최신순',
            title: '정렬 바꾸기',
            onclick: () => {
              state.sortMode = mode === 'order' ? 'recent' : 'order';
              render();
            },
          })
        );
      }
      wrap.appendChild(head);
    }

    const ul = el('ul', { class: 'post-list' });
    sorted.forEach((p, i) => {
      ul.appendChild(postRow(p, mode === 'order' ? i + 1 : null, options.showFolder));
    });
    wrap.appendChild(ul);
    return wrap;
  }

  // ── 태그 줄 ───────────────────────────────

  function renderTags(posts) {
    tagNode.innerHTML = '';

    // 최상위 화면은 폴더만 보여주므로 태그를 감춘다
    if (!state.folder && !state.query && !state.tag) return;

    const counts = new Map();
    posts.forEach((p) => {
      (p.tags || []).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1));
    });
    if (!counts.size) return;

    [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .forEach(([tag, count]) => {
        tagNode.appendChild(
          el('button', {
            class: 'tag-chip' + (state.tag === tag ? ' is-active' : ''),
            type: 'button',
            text: `${tag} ${count}`,
            onclick: () => {
              state.tag = state.tag === tag ? null : tag;
              render();
            },
          })
        );
      });
  }

  // ── 빈 상태 ───────────────────────────────

  function emptyState(message, hint) {
    const box = el('div', { class: 'empty' }, [
      el('span', { class: 'empty-mark', text: '🗂' }),
      el('h2', { text: message }),
      el('p', { text: hint }),
    ]);

    if (Store.hasToken()) {
      box.appendChild(
        el('a', {
          class: 'btn btn-primary',
          href: state.folder && state.folder !== F.UNFILED
            ? 'write.html?folder=' + encodeURIComponent(state.folder)
            : 'write.html',
          text: '글쓰기',
        })
      );
    } else {
      box.appendChild(
        el('button', {
          class: 'btn btn-primary',
          type: 'button',
          text: '설정 열기',
          onclick: App.openSettings,
        })
      );
    }
    return box;
  }

  // ── 그리기 ────────────────────────────────

  function render() {
    renderBreadcrumb();
    listNode.innerHTML = '';

    const source = state.showDrafts ? state.drafts : state.posts;

    // 1) 검색 — 폴더와 상관없이 전체에서
    if (state.query.trim()) {
      const q = state.query.trim().toLowerCase();
      const hits = source.filter((p) =>
        [p.title, p.excerpt, p.folder, (p.tags || []).join(' ')]
          .join(' ')
          .toLowerCase()
          .includes(q)
      );
      renderTags(hits);

      if (!hits.length) {
        listNode.appendChild(
          emptyState('찾는 글이 없습니다', '다른 검색어로 찾아보세요.')
        );
        return;
      }
      listNode.appendChild(
        postSection(hits, { title: `검색 결과 ${hits.length}편`, showFolder: true })
      );
      return;
    }

    // 2) 태그로 걸러보기
    if (state.tag) {
      const hits = source.filter((p) => (p.tags || []).includes(state.tag));
      renderTags(source);
      listNode.appendChild(
        hits.length
          ? postSection(hits, { title: `#${state.tag} ${hits.length}편`, showFolder: true })
          : emptyState('이 태그의 글이 없습니다', '다른 태그를 골라보세요.')
      );
      return;
    }

    // 3) 초안 보기 — 폴더 없이 한 줄로
    if (state.showDrafts) {
      renderTags(state.drafts);
      listNode.appendChild(
        state.drafts.length
          ? postSection(state.drafts, { title: '초안', showFolder: true })
          : emptyState('초안이 없습니다', '쓰다 만 글을 초안으로 저장해두면 모입니다.')
      );
      return;
    }

    // 4) 미분류 폴더
    if (state.folder === F.UNFILED) {
      const posts = F.unfiledPosts(state.posts);
      renderTags(posts);
      listNode.appendChild(
        posts.length
          ? postSection(posts, { title: F.UNFILED_LABEL })
          : emptyState('비어 있습니다', '폴더를 정하지 않은 글이 여기 모입니다.')
      );
      return;
    }

    // 5) 폴더 보기 (최상위 포함)
    const children = F.childrenOf(state.tree, state.folder);
    const here = F.postsIn(state.posts, state.folder);
    const unfiled = state.folder ? [] : F.unfiledPosts(state.posts);

    renderTags(here);

    if (!children.length && !here.length && !unfiled.length) {
      listNode.appendChild(
        state.folder
          ? emptyState('이 폴더가 비어 있습니다', '이 폴더에 첫 글을 써보세요.')
          : emptyState(
              '아직 글이 없습니다',
              Store.hasToken()
                ? '글을 쓰면서 폴더 이름을 적으면 폴더가 만들어집니다.'
                : '글을 쓰려면 먼저 설정에서 토큰을 등록해 주세요.'
            )
      );
      return;
    }

    // 폴더 카드
    if (children.length || unfiled.length) {
      const grid = el('div', { class: 'folder-grid' });
      children.forEach((node) => grid.appendChild(folderCard(node)));
      if (unfiled.length) grid.appendChild(unfiledCard(unfiled.length));
      listNode.appendChild(grid);
    }

    // 이 폴더에 바로 담긴 글
    if (here.length) {
      listNode.appendChild(
        postSection(here, { title: state.folder ? F.nameOf(state.folder) : '글' })
      );
    }
  }

  // ── 시작 ──────────────────────────────────

  function init() {
    App.init('home');

    document.getElementById('site-title').textContent = cfg.siteName;
    document.title = cfg.siteName;
    const tagline = document.getElementById('site-tagline');
    if (cfg.tagline) tagline.textContent = cfg.tagline;

    const params = new URLSearchParams(location.search);
    state.folder = F.normalizePath(params.get('folder') || '');
    if (params.get('folder') === F.UNFILED) state.folder = F.UNFILED;
    state.tag = params.get('tag') || null;

    if (state.folder && state.folder !== F.UNFILED) {
      document.title = `${F.nameOf(state.folder)} · ${cfg.siteName}`;
    }

    searchNode.addEventListener(
      'input',
      App.debounce((e) => {
        state.query = e.target.value;
        render();
      }, 150)
    );

    draftBtn.addEventListener('click', () => {
      state.showDrafts = !state.showDrafts;
      draftBtn.classList.toggle('btn-quiet', !state.showDrafts);
      draftBtn.textContent = state.showDrafts
        ? '폴더 보기'
        : `초안 ${state.drafts.length}개`;
      render();
    });

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchNode.focus();
        searchNode.select();
      }
    });

    document.addEventListener('kh:auth-changed', () => {
      setTimeout(() => window.location.reload(), 1300);
    });

    load();
  }

  init();
})();
