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

    // 보려는 문서가 아직 없으면 기본 탭으로 돌린다
    const wanted = params.get('view') || '';
    if (wanted && Docs.byKey(wanted) && state.docs[wanted]) {
      state.view = wanted;
    } else if (!wanted) {
      // 주소에 view 가 없으면 기본 탭을 자동으로 고른다
      // 요약본이 있으면 요약본, 아니면 정리본
      state.view = state.docs.summary ? 'summary' : 'main';
    } else {
      state.view = 'main';
      if (wanted && Store.hasToken()) {
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

    // ── 돌아가기 ──
    //
    // 예전에는 '전체 › 책1' 같은 작은 글자 링크였다. 글을 읽고 나서
    // 목록으로 되돌아가는 건 이 화면에서 가장 자주 하는 행동인데,
    // 그 길이 본문 장식처럼 보여 눈에 띄지 않았다.
    // 그래서 누를 수 있다는 게 분명히 보이는 버튼으로 바꾼다.
    //   ← 책1   (이 글이 담긴 폴더로 — 가장 자주 쓰는 길이라 가장 크게)
    //     전체  (맨 처음 화면으로 — 보조라서 조용하게)
    const parts =
      folder && window.Folders ? window.Folders.breadcrumb(folder) : [];
    const here = parts.length ? parts[parts.length - 1] : null;

    const backNav = el('nav', { class: 'post-back', 'aria-label': '돌아가기' });

    if (here) {
      backNav.appendChild(
        el(
          'a',
          {
            class: 'back-btn',
            href: 'index.html?folder=' + encodeURIComponent(here.path),
            title: `${here.name} 목록으로 돌아가기`,
          },
          [
            el('span', { class: 'back-arrow', 'aria-hidden': 'true', text: '←' }),
            el('span', { text: here.name }),
          ]
        )
      );
    }

    // 중간 폴더가 있으면 (책1/파트2 처럼) 조용한 링크로 함께 둔다
    parts.slice(0, -1).forEach((part) => {
      backNav.appendChild(
        el('a', {
          class: 'back-btn back-btn-quiet',
          href: 'index.html?folder=' + encodeURIComponent(part.path),
          text: part.name,
          title: `${part.name} 목록으로 돌아가기`,
        })
      );
    });

    backNav.appendChild(
      el(
        'a',
        {
          class: 'back-btn back-btn-quiet',
          href: 'index.html',
          title: '전체 글 목록으로 돌아가기',
        },
        [
          // 폴더가 없는 글이면 이 링크가 유일한 길이므로 화살표를 붙인다
          here
            ? null
            : el('span', { class: 'back-arrow', 'aria-hidden': 'true', text: '←' }),
          el('span', { text: '전체' }),
        ]
      )
    );

    // backNav 는 header 안에 두지 않는다.
    // position: sticky 는 부모 영역 안에서만 붙어 있기 때문에,
    // header 안에 있으면 제목이 화면을 벗어나는 순간 함께 사라진다.
    // 글 전체를 따라오도록 article 의 직계 자식으로 붙인다. (아래 조립부 참고)

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

    // 스크롤을 내려도 따라오도록 article 바로 밑에 둔다
    root.appendChild(backNav);
    watchStuck(backNav);

    root.appendChild(header);

    // 읽을거리 카드 — 태그 아래, 버전 탭 위의 별도 자리
    const readingCard = buildReadingCard();
    if (readingCard) root.appendChild(readingCard);

    const switcher = buildSwitcher();
    if (switcher) root.appendChild(switcher);

    // ── 본문 복사 버튼 (상단) ──
    const copyBtn = el('button', {
      class: 'btn btn-sm copy-body-btn',
      type: 'button',
      text: '📋 본문 복사',
      title: '이 글의 본문을 클립보드에 복사합니다',
      onclick: function () {
        const b = this;
        navigator.clipboard.writeText(body).then(() => {
          const prev = b.textContent;
          b.textContent = '복사됨 ✓';
          b.classList.add('is-copied');
          setTimeout(() => {
            b.textContent = prev;
            b.classList.remove('is-copied');
          }, 1500);
        });
      },
    });
    root.appendChild(
      el('div', { class: 'copy-body-row' }, [copyBtn])
    );

    root.appendChild(prose);
    root.appendChild(footer);

    addHeadingAnchors(prose);
    jumpToHash();
    startProgress();
  }

  /** 정리 / 요약본 / 원문 전환 */
  /** 읽을거리 글의 첫 제목 — 카드에 보여줄 이름 */
  function readingHeadline() {
    const doc = state.docs.reading;
    if (!doc) return '읽을거리';
    const parsed = MD.parseFrontmatter(doc.text);
    const m = parsed.body.match(/^#{1,4}[ \t]+(.+)$/m);
    let t = m ? m[1].trim() : parsed.meta.title || '읽을거리';
    // 카드에 이미 아이콘이 있으므로 제목 앞 이모지는 덜어낸다
    t = t
      .replace(
        /^[\u231A-\u27BF\u2600-\u26FF\u2B00-\u2BFF\uFE0F\uD83C-\uDBFF\uDC00-\uDFFF]+\s*/,
        ''
      )
      .trim();
    return t || '읽을거리';
  }

  /**
   * 읽을거리 카드
   *
   * 읽을거리는 글의 주장을 따로 검증한 별개의 글이라, 버전 탭(글/정리본1)과
   * 섞지 않고 그 위에 독립된 카드로 둔다.
   *   - 읽을거리가 있으면      → 그리로 가는 카드
   *   - 지금 읽을거리를 보는 중 → '보는 중' 표시 (돌아가긴 아래 탭으로)
   *   - 없고 편집 권한이 있으면 → 추가 카드
   */
  function buildReadingCard() {
    if (isDraft) return null;

    const hasReading = !!state.docs.reading;
    const canEdit = Store.hasToken();

    if (!hasReading) {
      if (!canEdit) return null;
      return el(
        'a',
        {
          class: 'post-reading-card is-add',
          href:
            'write.html?id=' + encodeURIComponent(id) + '&kind=reading',
          title: '읽을거리 추가',
        },
        [
          el('span', { class: 'post-reading-icon', text: '＋' }),
          el('span', { class: 'post-reading-body' }, [
            el('span', { class: 'post-reading-label', text: '읽을거리 추가' }),
          ]),
        ]
      );
    }

    const viewing = state.view === 'reading';
    const headline = readingHeadline();

    if (viewing) {
      return el('div', { class: 'post-reading-card is-current' }, [
        el('span', { class: 'post-reading-icon', text: '📎' }),
        el('span', { class: 'post-reading-body' }, [
          el('span', {
            class: 'post-reading-label',
            text: '읽을거리 · 지금 보는 중',
          }),
          el('span', { class: 'post-reading-title', text: headline }),
        ]),
      ]);
    }

    return el(
      'a',
      {
        class: 'post-reading-card',
        href: 'post.html?id=' + encodeURIComponent(id) + '&view=reading',
      },
      [
        el('span', { class: 'post-reading-icon', text: '📎' }),
        el('span', { class: 'post-reading-body' }, [
          el('span', { class: 'post-reading-label', text: '읽을거리' }),
          el('span', { class: 'post-reading-title', text: headline }),
        ]),
        el('span', { class: 'post-reading-arrow', text: '→' }),
      ]
    );
  }

  function buildSwitcher() {
    if (isDraft) return null;

    const canEdit = Store.hasToken();
    // 읽을거리는 '같은 글의 다른 버전'이 아니라 따로 검증한 별개의 글이라
    // 이 탭 줄에 두지 않고 위쪽에 별도 카드로 보여준다.
    const existing = Docs.companions().filter(
      (k) => k.key !== 'reading' && state.docs[k.key]
    );

    // 딸린 문서가 없고 만들 권한도 없으면 탭을 감춘다
    if (!existing.length && !canEdit) return null;

    const box = el('div', { class: 'view-switch', role: 'tablist' });

    const tabHref = (key) =>
      'post.html?id=' +
      encodeURIComponent(id) +
      '&view=' + key;

    Docs.all().forEach((kind) => {
      if (kind.key === 'reading') return; // 읽을거리는 별도 카드로 (buildReadingCard)
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
          : `post.html?id=${encodeURIComponent(id)}&view=main`;
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

  /**
   * 주소 끝에 붙은 #앵커 자리로 옮겨간다.
   *
   * 본문은 파일을 받아온 뒤에 그리므로, 브라우저가 스스로 앵커를 찾는
   * 시점에는 아직 제목이 화면에 없다. 그래서 다 그린 뒤 한 번 더 찾아간다.
   * 위에 붙어 있는 헤더가 제목을 가리지 않도록 그 높이만큼 여유를 둔다.
   */
  function jumpToHash() {
    const raw = location.hash.slice(1);
    if (!raw) return;

    let target = null;
    try {
      target = document.getElementById(decodeURIComponent(raw));
    } catch (e) {
      target = document.getElementById(raw);
    }
    if (!target) return;

    const siteHeader = document.querySelector('.site-header');
    const gap = (siteHeader ? siteHeader.offsetHeight : 53) + 16;

    // 글꼴과 표 폭이 잡힌 다음에 재야 자리가 어긋나지 않는다
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const top = target.getBoundingClientRect().top + window.scrollY - gap;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      })
    );
  }

  // ── 뒤로가기 띠가 화면 위에 붙었는지 살핀다 ──
  //
  // 붙은 순간에만 아래쪽 경계선을 보여 주기 위한 장치다.
  // 띠 바로 위에 눈에 보이지 않는 표식을 두고,
  // 그 표식이 헤더 밑으로 밀려 올라가면 "붙었다"고 판단한다.

  let stuckObserver = null;

  function watchStuck(nav) {
    // render() 는 root.innerHTML 을 비우므로 이전 관찰을 반드시 끊어 준다
    if (stuckObserver) {
      stuckObserver.disconnect();
      stuckObserver = null;
    }

    if (!('IntersectionObserver' in window)) return;

    const mark = el('div', { class: 'back-sentinel', 'aria-hidden': 'true' });
    nav.parentNode.insertBefore(mark, nav);

    const siteHeader = document.querySelector('.site-header');
    const headerH = siteHeader ? siteHeader.offsetHeight : 53;

    stuckObserver = new IntersectionObserver(
      (entries) => {
        nav.classList.toggle('is-stuck', !entries[0].isIntersecting);
      },
      { rootMargin: `-${headerH + 1}px 0px 0px 0px`, threshold: 0 }
    );
    stuckObserver.observe(mark);
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
