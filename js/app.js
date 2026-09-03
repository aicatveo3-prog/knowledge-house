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

  function openSettings() {
    const c = cfg();
    const wrap = el('div', { class: 'settings' });

    wrap.appendChild(
      el('p', {
        class: 'modal-text',
        html:
          '글을 저장하려면 이 브라우저에 GitHub 토큰이 필요합니다. ' +
          '토큰은 <strong>이 기기에만</strong> 저장되고 저장소에 올라가지 않습니다.',
      })
    );

    const field = el('div', { class: 'field' }, [
      el('label', { for: 'token-input', text: 'GitHub 토큰' }),
      el('input', {
        id: 'token-input',
        type: 'password',
        placeholder: 'github_pat_...',
        value: window.Store.getToken(),
        autocomplete: 'off',
        spellcheck: 'false',
      }),
    ]);
    wrap.appendChild(field);

    const status = el('p', { class: 'settings-status' });
    wrap.appendChild(status);

    const guide = el('details', { class: 'guide' }, [
      el('summary', { text: '토큰 발급 방법 (처음이시면 열어보세요)' }),
      el('ol', {
        html: `
          <li>GitHub → 우측 상단 프로필 → <strong>Settings</strong></li>
          <li>왼쪽 맨 아래 <strong>Developer settings</strong></li>
          <li><strong>Personal access tokens</strong> → <strong>Fine-grained tokens</strong></li>
          <li><strong>Generate new token</strong> 클릭</li>
          <li>이름은 아무거나 (예: <code>knowledge-house</code>), 만료일은 원하는 대로</li>
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
          '⚠️ 공용 컴퓨터에서는 토큰을 저장하지 마세요. ' +
          '유출이 걱정되면 GitHub 설정에서 언제든 즉시 무효화할 수 있습니다.',
      }),
    ]);
    wrap.appendChild(guide);

    wrap.appendChild(
      el('p', {
        class: 'settings-meta',
        text: `저장 위치: ${c.owner}/${c.repo} (${c.branch} 브랜치)`,
      })
    );

    const actions = [
      {
        label: '토큰 삭제',
        onClick: async () => {
          const ok = await confirmDialog(
            '이 브라우저에 저장된 토큰을 삭제할까요? 글을 쓰려면 다시 입력해야 합니다.',
            '삭제'
          );
          if (ok) {
            window.Store.clearToken();
            toast('토큰을 삭제했습니다.');
            document.dispatchEvent(new CustomEvent('kh:auth-changed'));
          }
        },
      },
      {
        label: '연결 확인 후 저장',
        variant: 'primary',
        onClick: async () => {
          const value = document.getElementById('token-input').value.trim();
          if (!value) {
            status.className = 'settings-status is-error';
            status.textContent = '토큰을 입력해 주세요.';
            return;
          }
          window.Store.setToken(value);
          status.className = 'settings-status';
          status.textContent = '확인 중…';
          try {
            const info = await GH.verify();
            if (!info.canPush) {
              status.className = 'settings-status is-error';
              status.textContent =
                '읽기는 되지만 쓰기 권한이 없습니다. Contents 권한을 Read and write 로 바꿔주세요.';
              return;
            }
            status.className = 'settings-status is-ok';
            status.textContent = `연결됨: ${info.fullName}`;
            toast('토큰을 저장했습니다. 이제 글을 쓸 수 있습니다.', 'success');
            document.dispatchEvent(new CustomEvent('kh:auth-changed'));
            setTimeout(closeModal, 900);
          } catch (err) {
            status.className = 'settings-status is-error';
            status.textContent = err.message;
          }
        },
      },
    ];

    openModal('설정', wrap, actions);
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
            'aria-label': '설정',
            title: '설정',
            text: '⚙',
            onclick: openSettings,
          }),
        ]),
      ])
    );
    updateThemeButton();
  }

  // ── 초기화 ────────────────────────────────

  function init(active) {
    applyTheme();
    renderHeader(active);
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
  };
})();
