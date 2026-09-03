/**
 * 에디터 — 글 작성, 슬래시 서식 메뉴, 이미지 붙여넣기, GitHub 저장
 */
(function () {
  const cfg = window.SITE_CONFIG;
  const el = App.el;

  const $title = document.getElementById('title');
  const $body = document.getElementById('body');
  const $date = document.getElementById('date');
  const $tags = document.getElementById('tags');
  const $status = document.getElementById('status');
  const $saveState = document.getElementById('save-state');
  const $btnDraft = document.getElementById('btn-draft');
  const $btnPublish = document.getElementById('btn-publish');
  const $btnPreview = document.getElementById('btn-preview');
  const $editPane = document.getElementById('edit-pane');
  const $previewPane = document.getElementById('preview-pane');
  const $previewTitle = document.getElementById('preview-title');
  const $previewBody = document.getElementById('preview-body');
  const $noToken = document.getElementById('no-token');

  const state = {
    id: null,
    path: null,
    sha: null,
    isDraft: false,
    dirty: false,
    saving: false,
    previewing: false,
  };

  // ── 서식 메뉴 항목 ─────────────────────────

  const SLASH_ITEMS = [
    { icon: 'H1', label: '큰 제목', hint: '#', keys: 'h1 title 제목', insert: '# ' },
    { icon: 'H2', label: '중간 제목', hint: '##', keys: 'h2 제목', insert: '## ' },
    { icon: 'H3', label: '작은 제목', hint: '###', keys: 'h3 제목', insert: '### ' },
    { icon: '•', label: '목록', hint: '-', keys: 'list ul 목록 불릿', insert: '- ' },
    { icon: '1.', label: '번호 목록', hint: '1.', keys: 'ol number 번호', insert: '1. ' },
    { icon: '☑', label: '체크박스', hint: '[ ]', keys: 'todo check 할일 체크', insert: '- [ ] ' },
    { icon: '❝', label: '인용', hint: '>', keys: 'quote 인용', insert: '> ' },
    { icon: '💡', label: '콜아웃', hint: '> 💡', keys: 'callout note 강조 콜아웃', insert: '> 💡 ' },
    {
      icon: '{ }',
      label: '코드 블록',
      hint: '```',
      keys: 'code 코드',
      insert: '```\n\n```\n',
      caret: 4,
    },
    { icon: '—', label: '구분선', hint: '---', keys: 'divider hr 구분선', insert: '---\n\n' },
    {
      icon: '▦',
      label: '표',
      keys: 'table 표 테이블',
      insert: '| 항목 | 설명 |\n| --- | --- |\n|  |  |\n\n',
    },
    {
      icon: '🔗',
      label: '링크',
      keys: 'link 링크',
      insert: '[표시할 글자](https://)',
      caret: 1,
    },
  ];

  let menuNode = null;
  let menuIndex = 0;
  let menuItems = [];
  let triggerPos = -1;

  // ── 텍스트 영역 자동 높이 ───────────────────

  function autoGrow(node) {
    node.style.height = 'auto';
    node.style.height = node.scrollHeight + 'px';
  }

  // ── 커서 화면 좌표 계산 ─────────────────────

  const MIRROR_PROPS = [
    'fontFamily',
    'fontSize',
    'fontWeight',
    'fontStyle',
    'letterSpacing',
    'lineHeight',
    'textTransform',
    'wordSpacing',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'boxSizing',
    'textIndent',
  ];

  function caretPoint(textarea, position) {
    const mirror = document.createElement('div');
    const style = window.getComputedStyle(textarea);
    MIRROR_PROPS.forEach((p) => {
      mirror.style[p] = style[p];
    });
    mirror.style.position = 'absolute';
    mirror.style.top = '-9999px';
    mirror.style.left = '-9999px';
    mirror.style.visibility = 'hidden';
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.overflowWrap = 'break-word';
    mirror.style.width = textarea.clientWidth + 'px';

    mirror.textContent = textarea.value.slice(0, position);
    const marker = document.createElement('span');
    marker.textContent = '\u200b';
    mirror.appendChild(marker);
    document.body.appendChild(mirror);

    const top = marker.offsetTop;
    const left = marker.offsetLeft;
    const lineHeight = parseFloat(style.lineHeight) || 24;
    mirror.remove();

    const rect = textarea.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY + top - textarea.scrollTop + lineHeight,
      left: rect.left + window.scrollX + left,
    };
  }

  // ── 슬래시 메뉴 ────────────────────────────

  function closeMenu() {
    if (menuNode) {
      menuNode.remove();
      menuNode = null;
    }
    triggerPos = -1;
  }

  function filterItems(query) {
    if (!query) return SLASH_ITEMS;
    const q = query.toLowerCase();
    return SLASH_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.keys || '').toLowerCase().includes(q)
    );
  }

  function openMenu(query) {
    menuItems = filterItems(query);
    menuIndex = 0;

    if (!menuNode) {
      menuNode = el('div', { class: 'slash-menu', role: 'listbox' });
      document.body.appendChild(menuNode);
    }

    drawMenu();

    const point = caretPoint($body, $body.selectionStart);
    const maxLeft = window.innerWidth - menuNode.offsetWidth - 16;
    menuNode.style.top = point.top + 4 + 'px';
    menuNode.style.left = Math.max(8, Math.min(point.left, maxLeft)) + 'px';

    // 화면 아래로 넘치면 커서 위쪽에 띄우기
    const menuRect = menuNode.getBoundingClientRect();
    if (menuRect.bottom > window.innerHeight - 8) {
      const lineHeight = parseFloat(window.getComputedStyle($body).lineHeight) || 24;
      menuNode.style.top = point.top - menuNode.offsetHeight - lineHeight - 6 + 'px';
    }
  }

  function drawMenu() {
    menuNode.innerHTML = '';

    if (!menuItems.length) {
      menuNode.appendChild(
        el('div', { class: 'slash-empty', text: '맞는 서식이 없습니다' })
      );
      return;
    }

    menuItems.forEach((item, i) => {
      menuNode.appendChild(
        el(
          'button',
          {
            class: 'slash-item' + (i === menuIndex ? ' is-active' : ''),
            type: 'button',
            onmousedown: (e) => {
              e.preventDefault();
              applyItem(item);
            },
            onmouseenter: () => {
              menuIndex = i;
              drawMenu();
            },
          },
          [
            el('span', { class: 'slash-icon', text: item.icon }),
            el('span', { class: 'slash-label', text: item.label }),
            item.hint ? el('span', { class: 'slash-hint', text: item.hint }) : null,
          ]
        )
      );
    });
  }

  function applyItem(item) {
    const value = $body.value;
    const caret = $body.selectionStart;
    const before = value.slice(0, triggerPos);
    const after = value.slice(caret);

    $body.value = before + item.insert + after;
    const pos = triggerPos + (item.caret !== undefined ? item.caret : item.insert.length);
    $body.setSelectionRange(pos, pos);

    closeMenu();
    autoGrow($body);
    markDirty();
    $body.focus();
  }

  /** 입력할 때 슬래시 메뉴 상태 갱신 */
  function syncMenu() {
    const caret = $body.selectionStart;
    const value = $body.value;

    if (triggerPos >= 0) {
      // 트리거 이후 텍스트로 필터링
      if (caret < triggerPos + 1 || value[triggerPos] !== '/') {
        closeMenu();
        return;
      }
      const query = value.slice(triggerPos + 1, caret);
      if (/\s/.test(query) || query.length > 20) {
        closeMenu();
        return;
      }
      openMenu(query);
      return;
    }

    // 새 트리거 감지: 줄 시작이나 공백 뒤의 '/'
    if (value[caret - 1] === '/') {
      const prev = value[caret - 2];
      if (prev === undefined || prev === '\n' || prev === ' ') {
        triggerPos = caret - 1;
        openMenu('');
      }
    }
  }

  // ── 이미지 업로드 ──────────────────────────

  function loadImageFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('이미지를 읽을 수 없습니다.'));
      };
      img.src = url;
    });
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  }

  /** 큰 이미지는 줄여서 업로드 (움직이는 GIF, SVG는 그대로) */
  async function prepareImage(file) {
    const keepAsIs = /gif|svg/i.test(file.type);
    if (keepAsIs) {
      return { blob: file, ext: file.type.includes('svg') ? 'svg' : 'gif' };
    }

    try {
      const img = await loadImageFile(file);
      const maxWidth = 1600;
      const scale = Math.min(1, maxWidth / img.naturalWidth);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      let blob = await canvasToBlob(canvas, 'image/webp', 0.85);
      let ext = 'webp';
      if (!blob) {
        blob = await canvasToBlob(canvas, 'image/jpeg', 0.85);
        ext = 'jpg';
      }
      if (!blob || blob.size >= file.size) {
        const fallbackExt = (file.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
        return { blob: file, ext: fallbackExt };
      }
      return { blob, ext };
    } catch (e) {
      const fallbackExt = (file.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
      return { blob: file, ext: fallbackExt };
    }
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = () => reject(new Error('이미지 변환에 실패했습니다.'));
      reader.readAsDataURL(blob);
    });
  }

  function replaceInBody(token, replacement) {
    const at = $body.value.indexOf(token);
    if (at === -1) return;
    $body.value =
      $body.value.slice(0, at) + replacement + $body.value.slice(at + token.length);
    const pos = at + replacement.length;
    $body.setSelectionRange(pos, pos);
    autoGrow($body);
  }

  async function uploadImage(file) {
    if (!Store.hasToken()) {
      App.toast('이미지를 올리려면 먼저 토큰을 등록해 주세요.', 'error');
      return;
    }

    const token = `![올리는 중… ${Date.now()}]()`;
    const caret = $body.selectionStart;
    $body.value =
      $body.value.slice(0, caret) + token + $body.value.slice(caret);
    autoGrow($body);

    try {
      const { blob, ext } = await prepareImage(file);
      const base64 = await blobToBase64(blob);
      const year = new Date().getFullYear();
      const name = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const path = `${cfg.imagesDir}/${year}/${name}`;

      await GH.writeBinary(path, base64, `chore: 이미지 추가 ${name}`);

      // 사이트 최상단 기준 경로 (post.html에서 그대로 표시됨)
      replaceInBody(token, `![](${path})`);
      markDirty();
      App.toast('이미지를 올렸습니다.', 'success');
    } catch (err) {
      replaceInBody(token, '');
      App.toast(err.message || '이미지 업로드에 실패했습니다.', 'error');
    }
  }

  // ── 상태 표시 ─────────────────────────────

  function markDirty() {
    state.dirty = true;
    scheduleLocalSave();
  }

  function setSaveState(text) {
    $saveState.textContent = text;
  }

  const scheduleLocalSave = App.debounce(() => {
    Store.saveLocalDraft(state.id, collect());
    setSaveState('이 기기에 임시 저장됨');
  }, 700);

  // ── 데이터 수집 / 채우기 ────────────────────

  function collect() {
    return {
      // 제목에 줄바꿈이 들어가면 메타데이터가 깨지므로 한 줄로 정리
      title: $title.value.replace(/\s*\n+\s*/g, ' ').trim(),
      date: $date.value || App.todayISO(),
      tags: $tags.value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      status: $status.value,
      body: $body.value,
    };
  }

  function fill(data) {
    $title.value = data.title || '';
    $date.value = data.date || App.todayISO();
    $tags.value = (data.tags || []).join(', ');
    $status.value = data.status || '';
    $body.value = data.body || '';
    autoGrow($title);
    autoGrow($body);
  }

  function buildMarkdown() {
    const data = collect();
    const front = MD.buildFrontmatter({
      title: data.title,
      date: data.date,
      tags: data.tags,
      status: data.status,
    });
    return `${front}\n\n${data.body.trim()}\n`;
  }

  function targetFilename() {
    const data = collect();
    return `${data.date}-${App.slugify(data.title)}.md`;
  }

  /**
   * 새 글일 때 같은 이름의 파일이 이미 있으면 뒤에 번호를 붙입니다.
   * (기존 글을 모르고 덮어쓰는 사고를 막기 위함)
   */
  async function uniquePath(dir, filename) {
    const base = filename.replace(/\.md$/, '');
    let candidate = `${dir}/${base}.md`;

    for (let n = 2; n <= 20; n++) {
      const found = await GH.readFile(candidate);
      if (!found) return candidate;
      candidate = `${dir}/${base}-${n}.md`;
    }
    return candidate;
  }

  // ── 저장 ──────────────────────────────────

  async function persist(targetDir, label) {
    if (state.saving) return;

    const data = collect();
    if (!data.title) {
      App.toast('제목을 입력해 주세요.', 'error');
      $title.focus();
      return;
    }
    if (!Store.hasToken()) {
      App.openSettings();
      return;
    }

    state.saving = true;
    const buttons = [$btnDraft, $btnPublish];
    buttons.forEach((b) => (b.disabled = true));
    setSaveState(`${label} 중…`);

    const content = buildMarkdown();
    const message = `post: ${data.title} ${label}`;

    try {
      // 저장 위치가 바뀌는 경우(새 글, 제목 변경, 초안→발행)에는
      // 남의 글을 덮어쓰지 않도록 겹치지 않는 이름을 찾는다
      let desired = `${targetDir}/${targetFilename()}`;
      if (desired !== state.path) {
        desired = await uniquePath(targetDir, targetFilename());
      }

      if (state.path && state.path !== desired) {
        // 파일명이나 폴더가 바뀐 경우: 새로 쓰고 기존 파일 삭제
        const written = await GH.writeFile(desired, content, message);
        await GH.deleteFile(state.path, state.sha, `chore: 이전 파일 정리`);
        state.sha = written.sha;
      } else {
        const written = await GH.writeFile(
          desired,
          content,
          message,
          state.sha || undefined
        );
        state.sha = written.sha;
      }

      state.path = desired;
      // 번호가 붙었을 수 있으므로 실제 저장된 경로에서 식별자를 뽑는다
      state.id = desired.split('/').pop().replace(/\.md$/, '');
      state.isDraft = targetDir === cfg.draftsDir;
      state.dirty = false;
      Store.clearLocalDraft(null);
      Store.clearLocalDraft(state.id);

      setSaveState(`${label} 완료`);
      return true;
    } catch (err) {
      setSaveState('');
      App.toast(err.message || `${label}에 실패했습니다.`, 'error');
      return false;
    } finally {
      state.saving = false;
      buttons.forEach((b) => (b.disabled = false));
    }
  }

  async function saveDraft() {
    const ok = await persist(cfg.draftsDir, '초안 저장');
    if (ok) App.toast('초안으로 저장했습니다.', 'success');
  }

  async function publish() {
    const ok = await persist(cfg.postsDir, '발행');
    if (!ok) return;

    App.toast('발행했습니다. 목록 반영까지 30초쯤 걸립니다.', 'success');
    setTimeout(() => {
      window.location.href =
        'post.html?id=' + encodeURIComponent(state.id) + '&fresh=1';
    }, 800);
  }

  // ── 미리보기 ──────────────────────────────

  function togglePreview() {
    state.previewing = !state.previewing;

    if (state.previewing) {
      const data = collect();
      $previewTitle.textContent = data.title || '제목 없음';
      $previewBody.innerHTML = MD.render(data.body);
      $editPane.classList.add('hidden');
      $previewPane.classList.remove('hidden');
      $btnPreview.textContent = '계속 쓰기';
    } else {
      $editPane.classList.remove('hidden');
      $previewPane.classList.add('hidden');
      $btnPreview.textContent = '미리보기';
      autoGrow($body);
      $body.focus();
    }
  }

  // ── 기존 글 불러오기 ────────────────────────

  async function loadExisting(id, isDraft) {
    const dir = isDraft ? cfg.draftsDir : cfg.postsDir;
    const path = `${dir}/${id}.md`;

    if (!Store.hasToken()) {
      App.toast('글을 수정하려면 토큰이 필요합니다.', 'error');
      return;
    }

    setSaveState('불러오는 중…');
    try {
      const found = await GH.readFile(path);
      if (!found) {
        App.toast('글을 찾을 수 없습니다.', 'error');
        setSaveState('');
        return;
      }
      const { meta, body } = MD.parseFrontmatter(found.text);
      fill({
        title: meta.title || id,
        date: meta.date || App.todayISO(),
        tags: meta.tags || [],
        status: meta.status || '',
        body,
      });
      state.id = id;
      state.path = path;
      state.sha = found.sha;
      state.isDraft = isDraft;
      state.dirty = false;
      setSaveState('');
      document.title = `${meta.title || id} 수정 · ${cfg.siteName}`;

      offerLocalRecovery(id);
    } catch (err) {
      setSaveState('');
      App.toast(err.message, 'error');
    }
  }

  /** 저장하지 않은 임시 변경이 있으면 복구 제안 */
  function offerLocalRecovery(id) {
    const local = Store.getLocalDraft(id);
    if (!local) return;
    const current = collect();
    if (local.body === current.body && local.title === current.title) {
      Store.clearLocalDraft(id);
      return;
    }

    const notice = el('div', { class: 'notice' }, [
      el('span', {
        text: `저장하지 않은 변경사항이 있습니다 (${App.timeAgo(local.savedAt)}).`,
      }),
      el('span', { class: 'spacer' }),
      el('button', {
        class: 'btn btn-sm',
        type: 'button',
        text: '버리기',
        onclick: () => {
          Store.clearLocalDraft(id);
          notice.remove();
        },
      }),
      el('button', {
        class: 'btn btn-sm btn-primary',
        type: 'button',
        text: '복구',
        onclick: () => {
          fill(local);
          notice.remove();
          App.toast('복구했습니다.');
        },
      }),
    ]);
    $editPane.insertBefore(notice, $editPane.firstChild);
  }

  // ── 키 입력 ───────────────────────────────

  function onBodyKeydown(e) {
    // 슬래시 메뉴가 열려 있을 때
    if (menuNode) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        menuIndex = (menuIndex + 1) % Math.max(1, menuItems.length);
        drawMenu();
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        menuIndex =
          (menuIndex - 1 + Math.max(1, menuItems.length)) %
          Math.max(1, menuItems.length);
        drawMenu();
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        if (menuItems.length) {
          e.preventDefault();
          applyItem(menuItems[menuIndex]);
          return;
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
        return;
      }
    }

    // 목록 이어쓰기
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      const value = $body.value;
      const caret = $body.selectionStart;
      const lineStart = value.lastIndexOf('\n', caret - 1) + 1;
      const line = value.slice(lineStart, caret);

      const match = line.match(/^(\s*)(-\s\[[ xX]\]\s|[-*+]\s|\d+[.)]\s)/);
      if (match) {
        const [, indent, markerRaw] = match;
        const rest = line.slice(match[0].length);

        if (!rest.trim()) {
          // 빈 항목에서 엔터 → 목록 종료
          e.preventDefault();
          $body.value = value.slice(0, lineStart) + value.slice(caret);
          $body.setSelectionRange(lineStart, lineStart);
          autoGrow($body);
          markDirty();
          return;
        }

        e.preventDefault();
        let marker = markerRaw;
        const numbered = markerRaw.match(/^(\d+)([.)])\s$/);
        if (numbered) {
          marker = `${Number(numbered[1]) + 1}${numbered[2]} `;
        } else if (/\[[ xX]\]/.test(markerRaw)) {
          marker = '- [ ] ';
        }
        const insertion = '\n' + indent + marker;
        $body.value = value.slice(0, caret) + insertion + value.slice(caret);
        const pos = caret + insertion.length;
        $body.setSelectionRange(pos, pos);
        autoGrow($body);
        markDirty();
        return;
      }
    }
  }

  function onGlobalKeydown(e) {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;

    const key = e.key.toLowerCase();
    if (key === 's') {
      e.preventDefault();
      saveDraft();
    } else if (key === 'enter') {
      e.preventDefault();
      publish();
    } else if (key === 'p' && e.shiftKey) {
      e.preventDefault();
      togglePreview();
    }
  }

  // ── 시작 ──────────────────────────────────

  function refreshTokenNotice() {
    $noToken.classList.toggle('hidden', Store.hasToken());
  }

  function init() {
    App.init('write');
    refreshTokenNotice();

    $date.value = App.todayISO();

    // 입력 처리
    [$title, $body].forEach((node) => {
      node.addEventListener('input', () => {
        autoGrow(node);
        markDirty();
      });
    });
    $body.addEventListener('input', syncMenu);
    $body.addEventListener('keydown', onBodyKeydown);
    $body.addEventListener('blur', () => setTimeout(closeMenu, 120));
    $body.addEventListener('scroll', closeMenu);
    [$tags, $status, $date].forEach((node) =>
      node.addEventListener('change', markDirty)
    );

    // 이미지 붙여넣기 / 끌어놓기
    $body.addEventListener('paste', (e) => {
      const files = [...(e.clipboardData?.files || [])].filter((f) =>
        f.type.startsWith('image/')
      );
      if (files.length) {
        e.preventDefault();
        files.forEach(uploadImage);
      }
    });
    $body.addEventListener('dragover', (e) => e.preventDefault());
    $body.addEventListener('drop', (e) => {
      const files = [...(e.dataTransfer?.files || [])].filter((f) =>
        f.type.startsWith('image/')
      );
      if (files.length) {
        e.preventDefault();
        files.forEach(uploadImage);
      }
    });

    // 버튼
    $btnDraft.addEventListener('click', saveDraft);
    $btnPublish.addEventListener('click', publish);
    $btnPreview.addEventListener('click', togglePreview);
    document
      .getElementById('btn-open-settings')
      .addEventListener('click', App.openSettings);

    document.addEventListener('keydown', onGlobalKeydown);
    window.addEventListener('resize', () => closeMenu());

    document.addEventListener('kh:auth-changed', refreshTokenNotice);

    window.addEventListener('beforeunload', (e) => {
      if (state.dirty && !state.saving) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    // 기존 글 수정 or 새 글
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      loadExisting(id, params.get('draft') === '1');
    } else {
      const local = Store.getLocalDraft(null);
      if (local && (local.title || local.body)) {
        fill(local);
        setSaveState(`이어서 쓰는 중 (${App.timeAgo(local.savedAt)} 저장)`);
      }
      $title.focus();
    }

    autoGrow($title);
    autoGrow($body);
  }

  init();
})();
