/**
 * 공통 UI: 헤더, 테마, 알림, 설정 창, 자주 쓰는 유틸
 */
(function () {
  const cfg = () => window.SITE_CONFIG || {};

  // ── 유틸 ──────────────────────────────────

  /** 제목 → 파일명에 쓸 슬러그 (한글 유지) */
  function slugify(title) {
    return (
      String(title || '')
        .trim()
        .toLowerCase()
        .replace(/[\/\\?%*:|"'<>.,()[\]{}#!@$^&=+`~;]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60) || 'untitled'
    );
  }

  function todayISO() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  /** 2026-09-03 → 2026년 9월 3일 */
  function formatDate(iso) {
    if (!iso) return '';
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return iso;
    return `${m[1]}년 ${Number(m[2])}월 ${Number(m[3])}일`;
  }

  /** 상대 시간 (방금, 5분 전 …) */
  function timeAgo(iso) {
    if (!iso) return '';
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return '방금';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
  }

  // ── 입력창 높이 자동 조절 ───────────────────

  const lastLength = new WeakMap();

  /**
   * 어떻게 크기를 조절할지 결정한다. (계산만 하므로 따로 검증할 수 있다)
   *
   *   'grow'    내용이 넘쳤으니 키운다 → 스크롤을 건드리지 않아도 된다
   *   'measure' 내용이 줄었을 수 있어 다시 재야 한다 → 스크롤을 지켜야 한다
   *   'none'    할 일 없음
   */
  function autoGrowPlan({ prevLength, nextLength, scrollHeight, clientHeight }) {
    const shrunk = typeof prevLength === 'number' && nextLength < prevLength;
    if (shrunk) return 'measure';
    if (scrollHeight > clientHeight) return 'grow';
    return 'none';
  }

  /**
   * textarea 높이를 내용에 맞춘다.
   *
   * 높이를 auto 로 두면 문서가 갑자기 짧아지고, 브라우저는 그때 스크롤 위치를
   * 문서 끝으로 잘라낸다. 높이를 되돌려도 스크롤은 이미 맨 위로 간 상태다.
   * 그래서 글자를 넣는 경우(대부분)에는 auto 로 접지 않고 바로 키우며,
   * 지우는 경우에만 다시 재고 스크롤을 원래 자리로 돌려놓는다.
   */
  function autoGrow(node, options) {
    if (!node) return;
    const opts = options || {};

    const nextLength = node.value ? node.value.length : 0;
    const prevLength = lastLength.get(node);
    lastLength.set(node, nextLength);

    // 값을 통째로 바꾼 경우(글 불러오기 등)에는 반드시 다시 재야 한다.
    // 그러지 않으면 짧은 글을 열었는데 상자가 계속 커다랗게 남는다.
    const plan = opts.remeasure
      ? 'measure'
      : autoGrowPlan({
          prevLength,
          nextLength,
          scrollHeight: node.scrollHeight,
          clientHeight: node.clientHeight,
        });

    if (plan === 'none') return;

    if (plan === 'grow') {
      node.style.height = node.scrollHeight + 'px';
      return;
    }

    // plan === 'measure'
    const keep = window.scrollY;
    node.style.height = 'auto';
    const needed = node.scrollHeight;
    node.style.height = needed + 'px';

    if (window.scrollY !== keep) {
      const html = document.documentElement;
      const before = html.style.scrollBehavior;
      // 부드러운 스크롤이 켜져 있어도 눈에 띄지 않게 즉시 되돌린다
      html.style.scrollBehavior = 'auto';
      window.scrollTo(0, keep);
      html.style.scrollBehavior = before;
    }
  }

  /** 값을 프로그램이 통째로 바꿨을 때 — 다시 재서 높이를 맞춘다 */
  function remeasure(node) {
    autoGrow(node, { remeasure: true });
  }

  function debounce(fn, wait) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') node.className = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k === 'text') node.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') {
        node.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (v !== null && v !== undefined) {
        node.setAttribute(k, v);
      }
    });
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c) node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  // ── 테마 ──────────────────────────────────

  function applyTheme(theme) {
    const t = theme || window.Store.getTheme();
    if (t === 'auto') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', t);
    }
  }

  function cycleTheme() {
    const order = ['auto', 'light', 'dark'];
    const current = window.Store.getTheme();
    const next = order[(order.indexOf(current) + 1) % order.length];
    window.Store.setTheme(next);
    applyTheme(next);
    const labels = { auto: '시스템 설정', light: '밝은 모드', dark: '어두운 모드' };
    toast(labels[next]);
    updateThemeButton();
  }

  function updateThemeButton() {
    const btn = document.querySelector('[data-theme-toggle]');
    if (!btn) return;
    const icons = { auto: '◐', light: '☀', dark: '☾' };
    btn.textContent = icons[window.Store.getTheme()] || '◐';
  }

  // ── 알림 ──────────────────────────────────

  let toastTimer;
  function toast(message, type = 'info', duration = 3000) {
    let box = document.querySelector('.toast');
    if (!box) {
      box = el('div', { class: 'toast', role: 'status', 'aria-live': 'polite' });
      document.body.appendChild(box);
    }
    box.className = `toast toast-${type} is-visible`;
    box.textContent = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => box.classList.remove('is-visible'), duration);
  }

  // ── 모달 ──────────────────────────────────

  function openModal(title, contentNode, actions = []) {
    closeModal();

    const body = el('div', { class: 'modal-body' }, [contentNode]);
    const footer = el(
      'div',
      { class: 'modal-footer' },
      actions.map((a) =>
        el('button', {
          class: `btn ${a.variant ? 'btn-' + a.variant : ''}`,
          type: 'button',
          onclick: a.onClick,
          text: a.label,
        })
      )
    );

    const panel = el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' }, [
      el('div', { class: 'modal-head' }, [
        el('h2', { text: title }),
        el('button', {
          class: 'icon-btn',
          type: 'button',
          'aria-label': '닫기',
          text: '✕',
          onclick: closeModal,
        }),
      ]),
      body,
      actions.length ? footer : null,
    ]);

    const overlay = el('div', {
      class: 'overlay',
      onclick: (e) => {
        if (e.target === overlay) closeModal();
      },
    }, [panel]);

    document.body.appendChild(overlay);
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => overlay.classList.add('is-visible'));

    const input = panel.querySelector('input, textarea, button');
    if (input) input.focus();

    document.addEventListener('keydown', escClose);
    return overlay;
  }

  function escClose(e) {
    if (e.key === 'Escape') closeModal();
  }

  function closeModal() {
    const overlay = document.querySelector('.overlay');
    if (overlay) overlay.remove();
    document.body.classList.remove('modal-open');
    document.removeEventListener('keydown', escClose);
  }

  /** 확인 창 (Promise<boolean>) */
  function confirmDialog(message, confirmLabel = '확인') {
    return new Promise((resolve) => {
      openModal('확인', el('p', { class: 'modal-text', text: message }), [
        {
          label: '취소',
          onClick: () => {
            closeModal();
            resolve(false);
          },
        },
        {
          label: confirmLabel,
          variant: 'danger',
          onClick: () => {
            closeModal();
            resolve(true);
          },
        },
      ]);
    });
  }

  // ── 설정 창 ────────────────────────────────

  /** 현재 연결 상태를 사람이 읽을 수 있게 정리 */
  function authSummary() {
    const Store = window.Store;
    if (!Store.hasToken()) {
      return { level: 'none', text: '토큰이 등록되지 않았습니다.' };
    }

    const meta = Store.getTokenMeta();
    const left = Store.daysUntilExpiry();
    const where = meta && meta.fullName ? meta.fullName : `${cfg().owner}/${cfg().repo}`;

    if (left !== null && left < 0) {
      return {
        level: 'expired',
        text: `토큰이 만료되었습니다 (${formatDate(
          String(meta.expiresAt).slice(0, 10)
        )}). 새로 발급해 등록해 주세요.`,
      };
    }
    if (left !== null && left <= 7) {
      return {
        level: 'warn',
        text: `연결됨: ${where} — 토큰이 ${left}일 뒤 만료됩니다.`,
      };
    }
    if (left !== null) {
      return {
        level: 'ok',
        text: `연결됨: ${where} — 만료까지 ${left}일 (${formatDate(
          String(meta.expiresAt).slice(0, 10)
        )})`,
      };
    }
    return { level: 'ok', text: `연결됨: ${where}` };
  }

  function openSettings() {
    const c = cfg();
    const Store = window.Store;
    const wrap = el('div', { class: 'settings' });

    // ── 현재 상태 ──
    const summary = authSummary();
    const statusBox = el('p', {
      class:
        'settings-status ' +
        (summary.level === 'ok'
          ? 'is-ok'
          : summary.level === 'none'
          ? ''
          : 'is-error'),
      text: summary.text,
    });
    wrap.appendChild(statusBox);

    // ── 저장이 막혀 있으면 먼저 알림 ──
    const health = Store.probe();
    if (!health.ok) {
      wrap.appendChild(
        el('p', {
          class: 'settings-status is-error',
          text: '⚠️ ' + health.reason,
        })
      );
    }

    wrap.appendChild(
      el('p', {
        class: 'modal-text',
        html:
          '토큰은 <strong>이 브라우저에만</strong> 저장되고 저장소에는 올라가지 않습니다. ' +
          '한 번 등록하면 계속 유지되며, 매번 입력할 필요가 없습니다.',
      })
    );

    // ── 입력 폼 (비밀번호 관리자가 기억할 수 있게 form 으로) ──
    const form = el('form', { class: 'settings-form', autocomplete: 'on' });

    // 비밀번호 관리자가 계정을 식별하도록 아이디 칸을 함께 둔다
    form.appendChild(
      el('input', {
        type: 'text',
        name: 'username',
        value: `${c.owner}/${c.repo}`,
        autocomplete: 'username',
        readonly: '',
        tabindex: '-1',
        'aria-hidden': 'true',
        class: 'visually-hidden',
      })
    );

    form.appendChild(
      el('div', { class: 'field' }, [
        el('label', { for: 'token-input', text: 'GitHub 토큰' }),
        el('input', {
          id: 'token-input',
          name: 'password',
          type: 'password',
          placeholder: 'github_pat_...',
          value: Store.getToken(),
          autocomplete: 'current-password',
          spellcheck: 'false',
        }),
        el('p', {
          class: 'field-hint',
          text: '브라우저가 저장을 제안하면 받아두세요. 나중에 한 번에 다시 채워집니다.',
        }),
      ])
    );

    const result = el('p', { class: 'settings-status' });
    form.appendChild(result);

    const submitBtn = el('button', {
      class: 'btn btn-primary',
      type: 'submit',
      text: '연결 확인 후 저장',
    });

    form.appendChild(
      el('div', { class: 'form-actions' }, [
        el('button', {
          class: 'btn',
          type: 'button',
          text: '토큰 삭제',
          onclick: async () => {
            const ok = await confirmDialog(
              '이 브라우저에 저장된 토큰을 삭제할까요? 글을 쓰려면 다시 입력해야 합니다.',
              '삭제'
            );
            if (ok) {
              Store.clearToken();
              toast('토큰을 삭제했습니다.');
              document.dispatchEvent(new CustomEvent('kh:auth-changed'));
              closeModal();
            }
          },
        }),
        submitBtn,
      ])
    );

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const value = document.getElementById('token-input').value.trim();

      if (!value) {
        result.className = 'settings-status is-error';
        result.textContent = '토큰을 입력해 주세요.';
        return;
      }

      const saved = Store.setToken(value);
      if (!saved) {
        result.className = 'settings-status is-error';
        result.textContent =
          '토큰을 저장할 수 없습니다. ' + (Store.probe().reason || '브라우저 설정을 확인해 주세요.');
        return;
      }

      result.className = 'settings-status';
      result.innerHTML = '<span class="spinner"></span> 확인 중…';
      submitBtn.disabled = true;

      try {
        const info = await GH.verify();

        if (!info.canPush) {
          result.className = 'settings-status is-error';
          result.textContent =
            '읽기는 되지만 쓰기 권한이 없습니다. Contents 권한을 Read and write 로 바꿔주세요.';
          return;
        }

        Store.setTokenMeta({
          fullName: info.fullName,
          expiresAt: info.expiresAt,
        });

        // 브라우저가 저장 데이터를 함부로 지우지 않도록 요청
        const persisted = await Store.requestPersistence();

        const left = Store.daysUntilExpiry();
        result.className = 'settings-status is-ok';
        result.textContent =
          `연결됨: ${info.fullName}` +
          (left !== null ? ` (만료까지 ${left}일)` : '') +
          (persisted ? ' · 저장 유지 요청 완료' : '');

        toast('토큰을 저장했습니다. 다음부터는 바로 글을 쓸 수 있습니다.', 'success');
        document.dispatchEvent(new CustomEvent('kh:auth-changed'));
        setTimeout(closeModal, 1200);
      } catch (err) {
        result.className = 'settings-status is-error';
        result.textContent = err.message;
      } finally {
        submitBtn.disabled = false;
      }
    });

    wrap.appendChild(form);

    // ── 발급 안내 ──
    wrap.appendChild(
      el('details', { class: 'guide' }, [
        el('summary', { text: '토큰 발급 방법 (처음이시면 열어보세요)' }),
        el('ol', {
          html: `
            <li>GitHub → 우측 상단 프로필 → <strong>Settings</strong></li>
            <li>왼쪽 맨 아래 <strong>Developer settings</strong></li>
            <li><strong>Personal access tokens</strong> → <strong>Fine-grained tokens</strong></li>
            <li><strong>Generate new token</strong> 클릭</li>
            <li>이름은 아무거나 (예: <code>knowledge-house</code>)</li>
            <li><strong>Expiration</strong> — 자주 갈아끼우기 싫으면
                <em>1 year</em> 또는 <em>No expiration</em> 으로 길게 잡으세요</li>
            <li><strong>Repository access</strong> → <em>Only select repositories</em> →
                <code>${MD.escapeHtml(c.repo || '')}</code> 하나만 선택</li>
            <li><strong>Permissions</strong> → Repository permissions →
                <strong>Contents</strong> 를 <em>Read and write</em> 로 변경</li>
            <li>생성 후 나오는 토큰을 복사해서 위에 붙여넣기</li>
          `,
        }),
        el('p', {
          class: 'guide-note',
          html:
            '⚠️ 공용 컴퓨터에서는 저장하지 마세요. ' +
            '유출이 걱정되면 GitHub 설정에서 언제든 즉시 무효화할 수 있습니다.',
        }),
      ])
    );

    // ── 토큰이 사라지는 경우 안내 ──
    wrap.appendChild(
      el('details', { class: 'guide' }, [
        el('summary', { text: '토큰이 자꾸 풀린다면' }),
        el('ul', {
          html: `
            <li><strong>사파리 / 아이폰</strong> — 7일 넘게 사이트를 방문하지 않으면
                브라우저가 저장 데이터를 지웁니다. 홈 화면에 추가해두고 가끔 열어주면 유지됩니다.</li>
            <li><strong>시크릿 창</strong> — 창을 닫으면 모두 사라집니다. 일반 창을 쓰세요.</li>
            <li><strong>종료 시 데이터 삭제 설정</strong> — 브라우저 설정에서 이 사이트를
                예외로 등록해 주세요.</li>
            <li><strong>토큰 만료</strong> — 위 상태 줄에 만료일이 표시됩니다.
                만료됐다면 새로 발급해야 합니다.</li>
            <li><strong>다른 기기 / 다른 브라우저</strong> — 기기마다 따로 등록해야 합니다.</li>
          `,
        }),
      ])
    );

    wrap.appendChild(
      el('p', {
        class: 'settings-meta',
        text: `저장 위치: ${c.owner}/${c.repo} (${c.branch} 브랜치)`,
      })
    );

    openModal('설정', wrap);
  }

  // ── 헤더 ──────────────────────────────────

  function renderHeader(active) {
    const c = cfg();
    const host = document.querySelector('[data-header]');
    if (!host) return;

    host.innerHTML = '';
    host.appendChild(
      el('div', { class: 'header-inner' }, [
        el('a', { class: 'brand', href: 'index.html' }, [
          el('span', { class: 'brand-mark', text: '⌂' }),
          el('span', { text: c.siteName || 'notes' }),
        ]),
        el('nav', { class: 'nav' }, [
          el('a', {
            class: 'nav-link' + (active === 'home' ? ' is-active' : ''),
            href: 'index.html',
            text: '글',
          }),
          el('a', {
            class: 'nav-link' + (active === 'write' ? ' is-active' : ''),
            href: 'write.html',
            text: '새 글',
          }),
          el('button', {
            class: 'icon-btn',
            type: 'button',
            'data-theme-toggle': '',
            'aria-label': '테마 바꾸기',
            title: '테마 바꾸기',
            onclick: cycleTheme,
          }),
          el('button', {
            class: 'icon-btn',
            type: 'button',
            'data-settings-btn': '',
            'aria-label': '설정',
            title: '설정',
            text: '⚙',
            onclick: openSettings,
          }),
        ]),
      ])
    );
    updateThemeButton();
    updateAuthIndicator();
  }

  /** 설정 버튼에 연결 상태를 표시 (토큰 없음/만료 임박이면 눈에 띄게) */
  function updateAuthIndicator() {
    const btn = document.querySelector('[data-settings-btn]');
    if (!btn) return;

    const summary = authSummary();
    btn.classList.toggle('is-warn', summary.level !== 'ok');
    btn.title = summary.level === 'ok' ? `설정 · ${summary.text}` : summary.text;
  }

  // ── 초기화 ────────────────────────────────

  function init(active) {
    applyTheme();
    renderHeader(active);

    const Store = window.Store;

    // 저장이 막혀 있으면 토큰이 유지되지 않으므로 미리 알린다
    const health = Store.probe();
    if (!health.ok) {
      setTimeout(() => toast(health.reason, 'error', 8000), 400);
    } else if (Store.hasToken()) {
      // 저장 데이터가 임의로 지워지지 않도록 요청
      Store.requestPersistence();

      const left = Store.daysUntilExpiry();
      if (left !== null && left < 0) {
        setTimeout(
          () => toast('토큰이 만료되었습니다. 설정에서 새로 등록해 주세요.', 'error', 8000),
          400
        );
      } else if (left !== null && left <= 7) {
        setTimeout(
          () => toast(`토큰이 ${left}일 뒤 만료됩니다. 미리 갈아두세요.`, 'info', 6000),
          400
        );
      }
    }

    document.addEventListener('kh:auth-changed', updateAuthIndicator);
  }

  window.App = {
    init,
    slugify,
    todayISO,
    formatDate,
    timeAgo,
    debounce,
    el,
    toast,
    openModal,
    closeModal,
    confirmDialog,
    openSettings,
    applyTheme,
    authSummary,
    updateAuthIndicator,
    autoGrow,
    autoGrowPlan,
    remeasure,
  };
})();
