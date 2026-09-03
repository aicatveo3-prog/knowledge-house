/**
 * 글 보기 — 본문 표시, 원문 전환, 수정/삭제, 변경 기록
 *
 * 글 하나는 두 개의 문서를 가질 수 있습니다.
 *   posts/<id>.md      정리한 글
 *   originals/<id>.md  원문
 * 둘은 파일명이 같아서 짝이 됩니다.
 */
(function () {
  const cfg = window.SITE_CONFIG;
  const el = App.el;

  const params = new URLSearchParams(location.search);
  const id = params.get('id') || '';
  const isDraft = params.get('draft') === '1';
  const isFresh = params.get('fresh') === '1';
  const wantsOriginal = params.get('view') === 'original';

  const mainDir = isDraft ? cfg.draftsDir : cfg.postsDir;
  const mainPath = `${mainDir}/${id}.md`;
  const originalPath = `${cfg.originalsDir}/${id}.md`;

  const root = document.getElementById('post');

  // 지금 보고 있는 문서
  const state = {
    main: null, // { text, sha }
    original: null, // { text, sha } / 없으면 null
    view: wantsOriginal ? 'original' : 'main',
  };

  // ── 불러오기 ──────────────────────────────

  function encodePathForFetch(p) {
    return p.split('/').map(encodeURIComponent).join('/');
  }

  /** 배포된 사이트에서 직접 읽기 */
  async function fromSite(path) {
    try {
      const res = await fetch(`${encodePathForFetch(path)}?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const text = await res.text();
      // 없는 파일이면 404 HTML 이 올 수도 있어 확인
      if (/^\s*<(!doctype|html)/i.test(text)) return null;
      return { text, sha: null };
    } catch (e) {
      return null;
    }
  }

  /** GitHub API 로 읽기 (방금 저장한 글, 초안) */
  async function fromApi(path) {
    if (!Store.hasToken()) return null;
    try {
      const found = await GH.readFile(path);
      if (!found) return null;
      return { text: found.text, sha: found.sha };
    } catch (e) {
      return null;
    }
  }

  /** 갓 저장한 것이면 저장소를 먼저 본다 */
  async function loadDoc(path, apiFirst) {
    if (apiFirst) return (await fromApi(path)) || (await fromSite(path));
    return (await fromSite(path)) || (await fromApi(path));
  }

  async function load() {
    if (!id) {
      renderMissing('주소에 글 번호가 없습니다.');
      return;
    }

    const apiFirst = isFresh || isDraft;

    const [main, original] = await Promise.all([
      loadDoc(mainPath, apiFirst),
      // 초안에는 원문을 붙이지 않는다
      isDraft ? Promise.resolve(null) : loadDoc(originalPath, apiFirst),
    ]);

    state.main = main;
    state.original = original;

    if (!main) {
      renderMissing(
        Store.hasToken()
          ? '글을 찾을 수 없습니다. 삭제되었거나 주소가 잘못되었을 수 있습니다.'
          : '글을 찾을 수 없습니다. 방금 발행한 글이라면 반영까지 잠시 기다려 주세요.'
      );
      return;
    }

    // 원문을 보려는데 아직 없으면 정리본으로 돌린다
    if (state.view === 'original' && !original) {
      state.view = 'main';
      if (Store.hasToken()) {
        App.toast('원문이 아직 없습니다. 아래 원문 추가로 만들 수 있습니다.');
      }
    }

    render();
  }

  // ── 그리기 ────────────────────────────────

  function renderMissing(message) {
    root.innerHTML = '';
    root.appendChild(
      el('div', { class: 'empty' }, [
        el('span', { class: 'empty-mark', text: '⌀' }),
        el('h2', { text: '글이 없습니다' }),
        el('p', { text: message }),
        el('a', { class: 'btn', href: 'index.html', text: '목록으로' }),
      ])
    );
  }

  /** 지금 보고 있는 문서와 그 경로 */
  function currentDoc() {
    return state.view === 'original' ? state.original : state.main;
  }

  function currentPath() {
    return state.view === 'original' ? originalPath : mainPath;
  }

  function render() {
    const doc = currentDoc();
    const parsed = MD.parseFrontmatter(doc.text);
    const meta = parsed.meta;
    const body = parsed.body;

    // 제목은 항상 정리본 기준 (원문에도 같은 제목을 쓴다)
    const mainMeta = MD.parseFrontmatter(state.main.text).meta;
    const title = mainMeta.title || meta.title || id;

    document.title =
      (state.view === 'original' ? `${title} — 원문` : title) + ` · ${cfg.siteName}`;

    // ── 머리말 ──
    const metaBits = [];
    if (mainMeta.date) {
      metaBits.push(el('span', { text: App.formatDate(mainMeta.date) }));
      metaBits.push(el('span', { class: 'dot' }));
    }
    metaBits.push(el('span', { text: `${MD.readingTime(body)}분 읽기` }));
    if (state.view === 'main' && mainMeta.status) {
      metaBits.push(el('span', { class: 'dot' }));
      metaBits.push(el('span', { text: mainMeta.status }));
    }
    if (state.view === 'original') {
      metaBits.push(el('span', { class: 'badge badge-original', text: '원문' }));
    }
    if (isDraft) {
      metaBits.push(el('span', { class: 'badge badge-draft', text: '초안' }));
    }

    const header = el('header', { class: 'post-header' }, [
      el('h1', { text: title }),
      el('div', { class: 'post-meta' }, metaBits),
    ]);

    const tags = mainMeta.tags || [];
    if (tags.length) {
      header.appendChild(
        el(
          'div',
          { class: 'post-tags' },
          tags.map((t) =>
            el('a', {
              class: 'tag-chip',
              href: 'index.html?tag=' + encodeURIComponent(t),
              text: t,
            })
          )
        )
      );
    }

    if (Store.hasToken()) {
      header.appendChild(buildActions(title));
    }

    // ── 본문 ──
    const prose = el('div', { class: 'prose' });
    prose.innerHTML = MD.render(body);

    // 원문이 비어 있으면 안내
    if (!body.trim()) {
      prose.innerHTML = '';
      prose.appendChild(
        el('p', {
          class: 'muted-note',
          text:
            state.view === 'original'
              ? '원문이 아직 비어 있습니다.'
              : '내용이 비어 있습니다.',
        })
      );
    }

    const footer = el('div', { class: 'post-footer' }, [
      el('a', { class: 'btn btn-sm btn-quiet', href: 'index.html', text: '← 목록' }),
      el('button', {
        class: 'btn btn-sm btn-quiet',
        type: 'button',
        text: '↑ 맨 위로',
        onclick: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
      }),
    ]);

    root.innerHTML = '';

    if (isFresh) {
      root.appendChild(
        el('div', { class: 'notice' }, [
          el('span', {
            text: '방금 저장했습니다. 목록에 반영되기까지 30초쯤 걸립니다.',
          }),
        ])
      );
    }

    root.appendChild(header);

    const switcher = buildSwitcher();
    if (switcher) root.appendChild(switcher);

    root.appendChild(prose);
    root.appendChild(footer);

    addHeadingAnchors(prose);
    startProgress();
  }

  /** 정리 / 원문 전환 */
  function buildSwitcher() {
    if (isDraft) return null;

    const hasOriginal = !!state.original;

    // 원문도 없고 만들 권한도 없으면 아무것도 보여주지 않는다
    if (!hasOriginal && !Store.hasToken()) return null;

    const box = el('div', { class: 'view-switch', role: 'tablist' });

    box.appendChild(
      el('a', {
        class: 'view-tab' + (state.view === 'main' ? ' is-active' : ''),
        href: 'post.html?id=' + encodeURIComponent(id),
        text: '정리',
        role: 'tab',
        'aria-selected': state.view === 'main' ? 'true' : 'false',
      })
    );

    if (hasOriginal) {
      box.appendChild(
        el('a', {
          class: 'view-tab' + (state.view === 'original' ? ' is-active' : ''),
          href: 'post.html?id=' + encodeURIComponent(id) + '&view=original',
          text: '원문',
          role: 'tab',
          'aria-selected': state.view === 'original' ? 'true' : 'false',
        })
      );
    } else {
      box.appendChild(
        el('a', {
          class: 'view-tab is-add',
          href: 'write.html?id=' + encodeURIComponent(id) + '&kind=original',
          text: '＋ 원문 추가',
        })
      );
    }

    return box;
  }

  function buildActions(title) {
    const box = el('div', { class: 'post-actions' });
    const editingOriginal = state.view === 'original';

    // 수정 — 지금 보고 있는 문서를 고친다
    box.appendChild(
      el('a', {
        class: 'btn btn-sm',
        href:
          'write.html?id=' +
          encodeURIComponent(id) +
          (isDraft ? '&draft=1' : '') +
          (editingOriginal ? '&kind=original' : ''),
        text: editingOriginal ? '원문 수정' : '수정',
      })
    );

    if (isDraft) {
      box.appendChild(
        el('button', {
          class: 'btn btn-sm btn-primary',
          type: 'button',
          text: '발행하기',
          onclick: () => publishDraft(title),
        })
      );
    }

    box.appendChild(
      el('button', {
        class: 'btn btn-sm btn-quiet',
        type: 'button',
        text: '기록',
        onclick: showHistory,
      })
    );

    box.appendChild(
      el('button', {
        class: 'btn btn-sm btn-quiet',
        type: 'button',
        text: editingOriginal ? '원문 삭제' : '삭제',
        onclick: () => remove(title),
      })
    );

    return box;
  }

  // ── 동작 ──────────────────────────────────

  async function remove(title) {
    const editingOriginal = state.view === 'original';
    const what = editingOriginal ? `"${title}" 의 원문` : `"${title}"`;

    const ok = await App.confirmDialog(
      `${what} 을 삭제할까요? 저장소에서 파일이 지워집니다. (커밋 이력에는 남습니다)`,
      '삭제'
    );
    if (!ok) return;

    const doc = currentDoc();

    try {
      App.toast('삭제 중…');
      await GH.deleteFile(
        currentPath(),
        doc.sha || undefined,
        editingOriginal ? `post: ${title} 원문 삭제` : `post: ${title} 삭제`
      );
      App.toast('삭제했습니다.', 'success');
      setTimeout(() => {
        window.location.href = editingOriginal
          ? `post.html?id=${encodeURIComponent(id)}`
          : 'index.html';
      }, 700);
    } catch (err) {
      App.toast(err.message, 'error');
    }
  }

  async function publishDraft(title) {
    const ok = await App.confirmDialog(`"${title}" 을 발행할까요?`, '발행');
    if (!ok) return;

    try {
      App.toast('발행 중…');
      await GH.moveFile(
        mainPath,
        `${cfg.postsDir}/${id}.md`,
        `post: ${title} 발행`
      );
      App.toast('발행했습니다.', 'success');
      setTimeout(() => {
        window.location.href = `post.html?id=${encodeURIComponent(id)}&fresh=1`;
      }, 700);
    } catch (err) {
      App.toast(err.message, 'error');
    }
  }

  async function showHistory() {
    const path = currentPath();
    const box = el('div', {}, [
      el('p', { class: 'modal-text', text: '불러오는 중…' }),
    ]);
    App.openModal(
      state.view === 'original' ? '원문 변경 기록' : '변경 기록',
      box
    );

    try {
      const commits = await GH.history(path);
      box.innerHTML = '';

      if (!commits.length) {
        box.appendChild(
          el('p', { class: 'modal-text', text: '기록이 아직 없습니다.' })
        );
        return;
      }

      const list = el('ul', { class: 'history-list' });
      commits.forEach((c) => {
        const url = `https://github.com/${cfg.owner}/${cfg.repo}/commit/${c.sha}`;
        list.appendChild(
          el('li', {}, [
            el('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, [
              el('span', { class: 'history-msg', text: c.message.split('\n')[0] }),
              el('span', {
                class: 'history-when',
                text: `${App.timeAgo(c.date)} · ${c.sha.slice(0, 7)}`,
              }),
            ]),
          ])
        );
      });
      box.appendChild(list);
    } catch (err) {
      box.innerHTML = '';
      box.appendChild(el('p', { class: 'modal-text', text: err.message }));
    }
  }

  /** 제목에 겹치지 않는 id 를 주고, 마우스를 올리면 나오는 링크를 붙인다 */
  function addHeadingAnchors(prose) {
    const used = new Set();

    prose.querySelectorAll('h1, h2, h3, h4').forEach((h, i) => {
      const base = h.id || 'section-' + (i + 1);
      let unique = base;
      let n = 2;
      while (used.has(unique)) unique = `${base}-${n++}`;
      used.add(unique);
      h.id = unique;

      h.appendChild(
        el('a', {
          class: 'heading-anchor',
          href: '#' + unique,
          'aria-label': '이 부분 링크',
          text: '#',
        })
      );
    });
  }

  // ── 읽기 진행 표시 ─────────────────────────

  let progressStarted = false;

  function startProgress() {
    let bar = document.querySelector('.progress');
    if (!bar) {
      bar = el('div', { class: 'progress' });
      document.body.appendChild(bar);
    }

    const update = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = height > 0 ? window.scrollY / height : 0;
      bar.style.width = Math.min(100, Math.max(0, ratio * 100)) + '%';
    };

    if (!progressStarted) {
      progressStarted = true;
      let queued = false;
      window.addEventListener(
        'scroll',
        () => {
          if (queued) return;
          queued = true;
          requestAnimationFrame(() => {
            update();
            queued = false;
          });
        },
        { passive: true }
      );
    }
    update();
  }

  // ── 시작 ──────────────────────────────────

  App.init(null);
  load();
})();
