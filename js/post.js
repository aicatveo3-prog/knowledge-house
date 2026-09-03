/**
 * 글 보기 — 본문 표시, 수정/삭제, 변경 기록
 */
(function () {
  const cfg = window.SITE_CONFIG;
  const el = App.el;

  const params = new URLSearchParams(location.search);
  const id = params.get('id') || '';
  const isDraft = params.get('draft') === '1';
  const isFresh = params.get('fresh') === '1';

  const dir = isDraft ? cfg.draftsDir : cfg.postsDir;
  const path = `${dir}/${id}.md`;
  const root = document.getElementById('post');

  let loadedSha = null;

  // ── 불러오기 ──────────────────────────────

  /** 배포된 사이트에서 직접 읽기 */
  async function fetchFromSite() {
    try {
      const res = await fetch(`${encodePathForFetch(path)}?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const text = await res.text();
      // 마크다운이 아닌 HTML(404 페이지)이 올 수도 있어 확인
      if (/^\s*<(!doctype|html)/i.test(text)) return null;
      return text;
    } catch (e) {
      return null;
    }
  }

  function encodePathForFetch(p) {
    return p.split('/').map(encodeURIComponent).join('/');
  }

  /** GitHub API로 읽기 (방금 발행한 글이나 초안용) */
  async function fetchFromApi() {
    if (!Store.hasToken()) return null;
    try {
      const found = await GH.readFile(path);
      if (!found) return null;
      loadedSha = found.sha;
      return found.text;
    } catch (e) {
      return null;
    }
  }

  async function load() {
    if (!id) {
      renderMissing('주소에 글 번호가 없습니다.');
      return;
    }

    // 방금 발행했거나 초안이면 저장소를 먼저 확인
    let raw = null;
    if (isFresh || isDraft) {
      raw = await fetchFromApi();
      if (!raw) raw = await fetchFromSite();
    } else {
      raw = await fetchFromSite();
      if (!raw) raw = await fetchFromApi();
    }

    if (!raw) {
      renderMissing(
        Store.hasToken()
          ? '글을 찾을 수 없습니다. 삭제되었거나 주소가 잘못되었을 수 있습니다.'
          : '글을 찾을 수 없습니다. 방금 발행한 글이라면 반영까지 잠시 기다려 주세요.'
      );
      return;
    }

    render(raw);
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

  function render(raw) {
    const { meta, body } = MD.parseFrontmatter(raw);
    const title = meta.title || id;

    document.title = `${title} · ${cfg.siteName}`;

    // 날짜 · 읽는 시간 · 상태는 한 줄로, 태그는 아래에 따로
    const metaBits = [];
    if (meta.date) metaBits.push(el('span', { text: App.formatDate(meta.date) }));
    if (meta.date) metaBits.push(el('span', { class: 'dot' }));
    metaBits.push(el('span', { text: `${MD.readingTime(body)}분 읽기` }));
    if (meta.status) {
      metaBits.push(el('span', { class: 'dot' }));
      metaBits.push(el('span', { text: meta.status }));
    }
    if (isDraft) {
      metaBits.push(el('span', { class: 'badge badge-draft', text: '초안' }));
    }

    const header = el('header', { class: 'post-header' }, [
      el('h1', { text: title }),
      el('div', { class: 'post-meta' }, metaBits),
    ]);

    const tags = meta.tags || [];
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

    const prose = el('div', { class: 'prose' });
    prose.innerHTML = MD.render(body);

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
            text: '방금 발행했습니다. 목록에 나타나기까지 30초쯤 걸립니다.',
          }),
        ])
      );
    }
    root.appendChild(header);

    // 제목이 여러 개인 긴 글에는 목차를 붙인다
    const toc = buildToc(prose);
    if (toc) root.appendChild(toc);

    root.appendChild(prose);
    root.appendChild(footer);

    addHeadingAnchors(prose);
    startProgress();
    if (toc) watchHeadings(prose, toc);
  }

  // ── 목차 ──────────────────────────────────

  /** 제목마다 겹치지 않는 id 를 붙이고 목차를 만든다 */
  function buildToc(prose) {
    const headings = [...prose.querySelectorAll('h2, h3')];
    if (headings.length < 3) return null;

    const used = new Set();
    const list = el('ol');

    headings.forEach((h, i) => {
      let base = h.id || 'section-' + (i + 1);
      let unique = base;
      let n = 2;
      while (used.has(unique)) unique = `${base}-${n++}`;
      used.add(unique);
      h.id = unique;

      list.appendChild(
        el('li', { class: h.tagName === 'H3' ? 'lv3' : 'lv2' }, [
          el('a', {
            href: '#' + unique,
            text: h.textContent.trim(),
            'data-toc': unique,
          }),
        ])
      );
    });

    const box = el('details', { class: 'toc', open: '' }, [
      el('summary', { text: '목차' }),
      list,
    ]);
    return box;
  }

  /** 지금 보고 있는 구역을 목차에서 표시 */
  function watchHeadings(prose, toc) {
    if (typeof IntersectionObserver === 'undefined') return;

    const links = new Map();
    toc.querySelectorAll('[data-toc]').forEach((a) => {
      links.set(a.getAttribute('data-toc'), a);
    });

    const visible = new Set();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        });

        // 화면에 보이는 것 중 가장 위쪽 제목을 현재로 본다
        const order = [...links.keys()];
        const current = order.find((key) => visible.has(key));

        links.forEach((a, key) => {
          a.classList.toggle('is-current', key === current);
        });
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );

    prose.querySelectorAll('h2, h3').forEach((h) => observer.observe(h));
  }

  /** 제목에 마우스를 올리면 나오는 링크 */
  function addHeadingAnchors(prose) {
    prose.querySelectorAll('h1, h2, h3, h4').forEach((h) => {
      if (!h.id) return;
      const link = el('a', {
        class: 'heading-anchor',
        href: '#' + h.id,
        'aria-label': '이 부분 링크',
        text: '#',
      });
      h.appendChild(link);
    });
  }

  // ── 읽기 진행 표시 ─────────────────────────

  function startProgress() {
    let bar = document.querySelector('.progress');
    if (!bar) {
      bar = el('div', { class: 'progress' });
      document.body.appendChild(bar);
    }

    let queued = false;
    const update = () => {
      const height =
        document.documentElement.scrollHeight - window.innerHeight;
      const ratio = height > 0 ? window.scrollY / height : 0;
      bar.style.width = Math.min(100, Math.max(0, ratio * 100)) + '%';
      queued = false;
    };

    window.addEventListener(
      'scroll',
      () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(update);
      },
      { passive: true }
    );
    update();
  }

  function buildActions(title) {
    const box = el('div', { class: 'post-actions' });

    box.appendChild(
      el('a', {
        class: 'btn btn-sm',
        href: `write.html?id=${encodeURIComponent(id)}${isDraft ? '&draft=1' : ''}`,
        text: '수정',
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
        text: '삭제',
        onclick: () => remove(title),
      })
    );

    return box;
  }

  // ── 동작 ──────────────────────────────────

  async function remove(title) {
    const ok = await App.confirmDialog(
      `"${title}" 을 삭제할까요? 저장소에서 파일이 지워집니다. (커밋 이력에는 남습니다)`,
      '삭제'
    );
    if (!ok) return;

    try {
      App.toast('삭제 중…');
      await GH.deleteFile(path, loadedSha || undefined, `post: ${title} 삭제`);
      App.toast('삭제했습니다.', 'success');
      setTimeout(() => (window.location.href = 'index.html'), 700);
    } catch (err) {
      App.toast(err.message, 'error');
    }
  }

  async function publishDraft(title) {
    const ok = await App.confirmDialog(`"${title}" 을 발행할까요?`, '발행');
    if (!ok) return;

    try {
      App.toast('발행 중…');
      const target = `${cfg.postsDir}/${id}.md`;
      await GH.moveFile(path, target, `post: ${title} 발행`);
      App.toast('발행했습니다.', 'success');
      setTimeout(() => {
        window.location.href = `post.html?id=${encodeURIComponent(id)}&fresh=1`;
      }, 700);
    } catch (err) {
      App.toast(err.message, 'error');
    }
  }

  async function showHistory() {
    const box = el('div', {}, [el('p', { class: 'modal-text', text: '불러오는 중…' })]);
    App.openModal('변경 기록', box);

    try {
      const commits = await GH.history(path);
      box.innerHTML = '';

      if (!commits.length) {
        box.appendChild(
          el('p', { class: 'modal-text', text: '기록이 아직 없습니다.' })
        );
        return;
      }

      const list = el('ul', { class: 'post-list' });
      commits.forEach((c) => {
        const url = `https://github.com/${cfg.owner}/${cfg.repo}/commit/${c.sha}`;
        list.appendChild(
          el('li', { class: 'post-item' }, [
            el('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, [
              el('h2', {
                text: c.message.split('\n')[0],
                style: 'font-size:0.95rem',
              }),
              el('div', { class: 'post-meta' }, [
                el('span', { text: App.timeAgo(c.date) }),
                el('span', { class: 'dot' }),
                el('span', { text: c.sha.slice(0, 7) }),
              ]),
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

  // ── 시작 ──────────────────────────────────

  App.init(null);
  load();
})();
