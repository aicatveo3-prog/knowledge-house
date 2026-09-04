/**
 * 글 보기 — 정리 / 요약본 / 원문 전환, 수정/삭제, 변경 기록
 *
 * 글 하나는 이름이 같은 파일 여러 개를 가질 수 있습니다.
 *   posts/<id>.md      정리
 *   summaries/<id>.md  요약본
 *   originals/<id>.md  원문
 */
(function () {
  const cfg = window.SITE_CONFIG;
  const el = App.el;
  const Docs = window.Docs;

  const params = new URLSearchParams(location.search);
  const id = params.get('id') || '';
  const isDraft = params.get('draft') === '1';
  const isFresh = params.get('fresh') === '1';

  const root = document.getElementById('post');

  const state = {
    // 종류별 문서 { text, sha } / 없으면 null
    docs: {},
    view: 'main',
  };

  // ── 경로 ──────────────────────────────────

  function pathOf(kind) {
    if (kind === 'main') {
      const dir = isDraft ? cfg.draftsDir : cfg.postsDir;
      return `${dir}/${id}.md`;
    }
    return Docs.pathFor(kind, id);
  }

  // ── 불러오기 ──────────────────────────────

  function encodePathForFetch(p) {
    return p.split('/').map(encodeURIComponent).join('/');
  }

  async function fromSite(path) {
    try {
      const res = await fetch(`${encodePathForFetch(path)}?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const text = await res.text();
      if (/^\s*<(!doctype|html)/i.test(text)) return null;
      return { text, sha: null };
    } catch (e) {
      return null;
    }
  }

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

  async function loadDoc(path, apiFirst) {
    if (!path) return null;
    if (apiFirst) return (await fromApi(path)) || (await fromSite(path));
    return (await fromSite(path)) || (await fromApi(path));
  }

  async function load() {
    if (!id) {
      renderMissing('주소에 글 번호가 없습니다.');
      return;
    }

    const apiFirst = isFresh || isDraft;

    // 초안에는 딸린 문서를 붙이지 않는다
    const kinds = isDraft ? [Docs.byKey('main')] : Docs.all();

    const loaded = await Promise.all(
      kinds.map((kind) => loadDoc(pathOf(kind.key), apiFirst))
    );
    kinds.forEach((kind, i) => {
      state.docs[kind.key] = loaded[i];
    });

    if (!state.docs.main) {
      renderMissing(
        Store.hasToken()
          ? '글을 찾을 수 없습니다. 삭제되었거나 주소가 잘못되었을 수 있습니다.'
          : '글을 찾을 수 없습니다. 방금 발행한 글이라면 반영까지 잠시 기다려 주세요.'
      );
      return;
    }

    // 보려는 문서가 아직 없으면 정리본으로 돌린다
    const wanted = params.get('view') || 'main';
    if (wanted !== 'main' && Docs.byKey(wanted) && state.docs[wanted]) {
      state.view = wanted;
    } else {
      state.view = 'main';
      if (wanted !== 'main' && Store.hasToken()) {
        App.toast(
          `${Docs.labelOf(wanted) || '문서'}이 아직 없습니다. 탭에서 추가할 수 있습니다.`
        );
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

  function currentDoc() {
    return state.docs[state.view];
  }

  function currentPath() {
    return pathOf(state.view);
  }

  function render() {
    const doc = currentDoc();
    const parsed = MD.parseFrontmatter(doc.text);
    const body = parsed.body;

    // 제목·날짜·태그는 언제나 정리본 기준
    const mainMeta = MD.parseFrontmatter(state.docs.main.text).meta;
    const title = mainMeta.title || id;
    const isMain = state.view === 'main';

    document.title =
      (isMain ? title : `${title} — ${Docs.labelOf(state.view)}`) +
      ` · ${cfg.siteName}`;

    // ── 머리말 ──
    const header = el('header', { class: 'post-header' }, []);

    const folder = window.Folders
      ? window.Folders.normalizePath(mainMeta.folder)
      : '';
    if (folder) {
      const crumb = el('nav', { class: 'breadcrumb', 'aria-label': '폴더 위치' }, [
        el('a', { class: 'crumb', href: 'index.html', text: '전체' }),
      ]);
      window.Folders.breadcrumb(folder).forEach((part) => {
        crumb.appendChild(el('span', { class: 'crumb-sep', text: '›' }));
        crumb.appendChild(
          el('a', {
            class: 'crumb',
            href: 'index.html?folder=' + encodeURIComponent(part.path),
            text: part.name,
          })
        );
      });
      header.appendChild(crumb);
    }

    header.appendChild(el('h1', { text: title }));

    const metaBits = [];
    if (mainMeta.date) {
      metaBits.push(el('span', { text: App.formatDate(mainMeta.date) }));
      metaBits.push(el('span', { class: 'dot' }));
    }
    metaBits.push(el('span', { text: `${MD.readingTime(body)}분 읽기` }));
    if (isMain && mainMeta.status) {
      metaBits.push(el('span', { class: 'dot' }));
      metaBits.push(el('span', { text: mainMeta.status }));
    }
    if (!isMain) {
      metaBits.push(
        el('span', {
          class: 'badge badge-' + state.view,
          text: Docs.labelOf(state.view),
        })
      );
    }
    if (isDraft) {
      metaBits.push(el('span', { class: 'badge badge-draft', text: '초안' }));
    }
    header.appendChild(el('div', { class: 'post-meta' }, metaBits));

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
    if (body.trim()) {
      prose.innerHTML = MD.render(body);
    } else {
      prose.appendChild(
        el('p', {
          class: 'muted-note',
          text: `${Docs.labelOf(state.view) || '내용'}이 아직 비어 있습니다.`,
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

  /** 정리 / 요약본 / 원문 전환 */
  function buildSwitcher() {
    if (isDraft) return null;

    const canEdit = Store.hasToken();
    const existing = Docs.companions().filter((k) => state.docs[k.key]);

    // 딸린 문서가 없고 만들 권한도 없으면 탭을 감춘다
    if (!existing.length && !canEdit) return null;

    const box = el('div', { class: 'view-switch', role: 'tablist' });

    const tabHref = (key) =>
      'post.html?id=' +
      encodeURIComponent(id) +
      (key === 'main' ? '' : '&view=' + key);

    Docs.all().forEach((kind) => {
      const has = kind.key === 'main' || !!state.docs[kind.key];

      if (has) {
        box.appendChild(
          el('a', {
            class: 'view-tab' + (state.view === kind.key ? ' is-active' : ''),
            href: tabHref(kind.key),
            text: kind.label,
            role: 'tab',
            'aria-selected': state.view === kind.key ? 'true' : 'false',
          })
        );
      } else if (canEdit) {
        box.appendChild(
          el('a', {
            class: 'view-tab is-add',
            href:
              'write.html?id=' +
              encodeURIComponent(id) +
              '&kind=' +
              kind.key,
            text: '＋ ' + kind.label,
            title: `${kind.label} 추가`,
          })
        );
      }
    });

    return box;
  }

  function buildActions(title) {
    const box = el('div', { class: 'post-actions' });
    const isMain = state.view === 'main';
    const label = Docs.labelOf(state.view);

    box.appendChild(
      el('a', {
        class: 'btn btn-sm',
        href:
          'write.html?id=' +
          encodeURIComponent(id) +
          (isDraft ? '&draft=1' : '') +
          (isMain ? '' : '&kind=' + state.view),
        text: isMain ? '수정' : `${label} 수정`,
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
        text: isMain ? '삭제' : `${label} 삭제`,
        onclick: () => remove(title),
      })
    );

    return box;
  }

  // ── 동작 ──────────────────────────────────

  async function remove(title) {
    const isMain = state.view === 'main';
    const label = Docs.labelOf(state.view);
    const what = isMain ? `"${title}"` : `"${title}" 의 ${label}`;

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
        isMain ? `post: ${title} 삭제` : `post: ${title} ${label} 삭제`
      );
      App.toast('삭제했습니다.', 'success');
      setTimeout(() => {
        window.location.href = isMain
          ? 'index.html'
          : `post.html?id=${encodeURIComponent(id)}`;
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
        pathOf('main'),
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
    const isMain = state.view === 'main';
    const box = el('div', {}, [
      el('p', { class: 'modal-text', text: '불러오는 중…' }),
    ]);
    App.openModal(
      isMain ? '변경 기록' : `${Docs.labelOf(state.view)} 변경 기록`,
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
