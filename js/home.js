/**
 * 홈 화면 — 글 목록, 검색, 태그 필터
 */
(function () {
  const cfg = window.SITE_CONFIG;
  const el = App.el;

  const state = {
    posts: [],
    drafts: [],
    query: '',
    tag: null,
    showDrafts: false,
    loading: true,
  };

  const listNode = document.getElementById('list');
  const tagNode = document.getElementById('tag-row');
  const searchNode = document.getElementById('search');
  const draftBtn = document.getElementById('toggle-drafts');

  // ── 데이터 불러오기 ─────────────────────────

  /** 빌드된 색인 파일 읽기 */
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

  /** 저장소를 직접 조회해 색인에 없는 글까지 채우기 */
  async function loadFromApi(dir) {
    const files = (await GH.listDir(dir)).filter(
      (f) => f.type === 'file' && f.name.endsWith('.md')
    );
    return files;
  }

  /** 파일 하나를 글 객체로 */
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
      tags: meta.tags || [],
      status: meta.status || '',
      excerpt: MD.excerpt(body),
      readingTime: MD.readingTime(body),
      ...extra,
    };
  }

  async function load() {
    const indexed = await loadIndex();
    let posts = indexed || [];

    if (Store.hasToken()) {
      try {
        // 색인에 아직 없는 새 글 찾기
        const files = await loadFromApi(cfg.postsDir);
        const liveIds = new Set(files.map((f) => f.name.replace(/\.md$/, '')));

        // 저장소에서 삭제된 글은 목록에서 제외
        posts = posts.filter((p) => liveIds.has(p.id));

        const knownIds = new Set(posts.map((p) => p.id));
        const missing = files
          .filter((f) => !knownIds.has(f.name.replace(/\.md$/, '')))
          .slice(0, 30);

        const fetched = await Promise.all(
          missing.map((f) => fileToPost(f, { pending: !!indexed }))
        );
        posts = posts.concat(fetched.filter(Boolean));

        // 초안 목록
        const draftFiles = await loadFromApi(cfg.draftsDir);
        const drafts = await Promise.all(
          draftFiles.slice(0, 30).map((f) => fileToPost(f, { draft: true }))
        );
        state.drafts = drafts.filter(Boolean).sort(byDateDesc);

        if (state.drafts.length) {
          draftBtn.classList.remove('hidden');
          draftBtn.textContent = `초안 ${state.drafts.length}개`;
        }
      } catch (err) {
        if (err.status !== 404) {
          App.toast(err.message, 'error');
        }
      }
    }

    state.posts = posts.sort(byDateDesc);
    state.loading = false;
    render();
  }

  function byDateDesc(a, b) {
    const da = a.date || '';
    const db = b.date || '';
    if (da === db) return (b.id || '').localeCompare(a.id || '');
    return db.localeCompare(da);
  }

  // ── 그리기 ────────────────────────────────

  function visiblePosts() {
    const source = state.showDrafts ? state.drafts : state.posts;
    const q = state.query.trim().toLowerCase();

    return source.filter((p) => {
      if (state.tag && !(p.tags || []).includes(state.tag)) return false;
      if (!q) return true;
      const haystack = [p.title, p.excerpt, (p.tags || []).join(' ')]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  function renderTags() {
    const counts = new Map();
    state.posts.forEach((p) => {
      (p.tags || []).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1));
    });

    tagNode.innerHTML = '';
    if (!counts.size) return;

    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    sorted.forEach(([tag, count]) => {
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

  function postRow(post) {
    const meta = [];
    if (post.date) meta.push(el('span', { text: App.formatDate(post.date) }));
    if (post.readingTime) {
      meta.push(el('span', { class: 'dot' }));
      meta.push(el('span', { text: `${post.readingTime}분` }));
    }
    if (post.status) {
      meta.push(el('span', { class: 'badge', text: post.status }));
    }
    (post.tags || []).slice(0, 3).forEach((t) => {
      meta.push(el('span', { class: 'badge', text: '#' + t }));
    });
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

  function emptyState() {
    if (state.query || state.tag) {
      return el('div', { class: 'empty' }, [
        el('span', { class: 'empty-mark', text: '⌕' }),
        el('h2', { text: '찾는 글이 없습니다' }),
        el('p', { text: '다른 검색어나 태그로 찾아보세요.' }),
      ]);
    }

    if (state.showDrafts) {
      return el('div', { class: 'empty' }, [
        el('span', { class: 'empty-mark', text: '⌸' }),
        el('h2', { text: '초안이 없습니다' }),
        el('p', { text: '쓰다 만 글을 초안으로 저장해두면 여기에 모입니다.' }),
      ]);
    }

    const box = el('div', { class: 'empty' }, [
      el('span', { class: 'empty-mark', text: '⌂' }),
      el('h2', { text: '아직 글이 없습니다' }),
      el('p', {
        text: Store.hasToken()
          ? '첫 글을 써볼까요?'
          : '글을 쓰려면 먼저 설정에서 GitHub 토큰을 등록해 주세요.',
      }),
    ]);

    if (Store.hasToken()) {
      box.appendChild(
        el('a', { class: 'btn btn-primary', href: 'write.html', text: '첫 글 쓰기' })
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

  function render() {
    renderTags();
    listNode.innerHTML = '';

    const items = visiblePosts();

    if (!items.length) {
      listNode.appendChild(emptyState());
      return;
    }

    const ul = el('ul', { class: 'post-list' });
    items.forEach((p) => ul.appendChild(postRow(p)));
    listNode.appendChild(ul);
  }

  // ── 시작 ──────────────────────────────────

  function init() {
    App.init('home');

    document.getElementById('site-title').textContent = cfg.siteName;
    document.title = cfg.siteName;
    const tagline = document.getElementById('site-tagline');
    if (cfg.tagline) tagline.textContent = cfg.tagline;

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
        ? '발행된 글 보기'
        : `초안 ${state.drafts.length}개`;
      render();
    });

    // Cmd/Ctrl + K → 검색창으로
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchNode.focus();
        searchNode.select();
      }
    });

    document.addEventListener('kh:auth-changed', () => window.location.reload());

    load();
  }

  init();
})();
