/**
 * 아주 작은 마크다운 렌더러 (의존성 없음)
 *
 * 지원: 제목, 굵게/기울임/취소선, 인라인 코드, 링크, 이미지,
 *      코드블록, 인용, 콜아웃, 구분선, 순서/비순서 목록, 체크박스, 표
 *
 * 보안: 입력을 먼저 이스케이프하므로 원본 HTML은 실행되지 않습니다.
 */
(function () {
  const ESCAPE_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ESCAPE_MAP[c]);
  }

  /** 링크가 안전한 스킴인지 확인 (javascript: 차단) */
  function safeUrl(url) {
    const trimmed = url.trim();
    if (/^(javascript|data|vbscript):/i.test(trimmed)) return '#';
    return trimmed;
  }

  /** 인라인 서식 처리 */
  function renderInline(text) {
    let out = escapeHtml(text);

    // 인라인 코드를 먼저 빼두어 다른 서식이 적용되지 않도록 보호
    const codeSlots = [];
    out = out.replace(/`([^`]+)`/g, (_, code) => {
      codeSlots.push(code);
      return '\u0000CODE' + (codeSlots.length - 1) + '\u0000';
    });

    // 이미지 ![alt](src)
    out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) => {
      return `<img src="${safeUrl(src)}" alt="${alt}" loading="lazy">`;
    });

    // 링크 [텍스트](주소)
    out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
      const url = safeUrl(href);
      const external = /^https?:\/\//i.test(url);
      const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${url}"${attrs}>${label}</a>`;
    });

    // 굵게, 기울임, 취소선
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    out = out.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // 줄 끝 두 칸 공백 → 줄바꿈
    out = out.replace(/ {2}$/gm, '<br>');

    // 보호해둔 코드 복원
    out = out.replace(/\u0000CODE(\d+)\u0000/g, (_, i) => {
      return `<code>${codeSlots[Number(i)]}</code>`;
    });

    return out;
  }

  /** 표 한 줄을 셀 배열로 */
  function splitRow(line) {
    return line
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((c) => c.trim());
  }

  function isTableDivider(line) {
    return /^\|?[\s:-]+\|[\s:|-]*$/.test(line) && line.includes('-');
  }

  /** 블록 단위 렌더링 */
  function render(markdown) {
    if (!markdown) return '';

    const lines = String(markdown).replace(/\r\n?/g, '\n').split('\n');
    const html = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // ── 코드블록 ──────────────────────────
      if (/^```/.test(line)) {
        const lang = line.slice(3).trim();
        const buf = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) {
          buf.push(lines[i]);
          i++;
        }
        i++; // 닫는 ``` 건너뛰기
        const langAttr = lang ? ` data-lang="${escapeHtml(lang)}"` : '';
        html.push(
          `<pre${langAttr}><code>${escapeHtml(buf.join('\n'))}</code></pre>`
        );
        continue;
      }

      // ── 빈 줄 ────────────────────────────
      if (!line.trim()) {
        i++;
        continue;
      }

      // ── 구분선 ───────────────────────────
      if (/^\s*([-*_])\s*(\1\s*){2,}$/.test(line)) {
        html.push('<hr>');
        i++;
        continue;
      }

      // ── 제목 ─────────────────────────────
      const heading = line.match(/^(#{1,4})\s+(.*)$/);
      if (heading) {
        const level = heading[1].length;
        const text = heading[2].trim();
        const slug = text
          .toLowerCase()
          .replace(/[^\w가-힣\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-');
        html.push(
          `<h${level} id="${escapeHtml(slug)}">${renderInline(text)}</h${level}>`
        );
        i++;
        continue;
      }

      // ── 표 ───────────────────────────────
      if (
        line.includes('|') &&
        i + 1 < lines.length &&
        isTableDivider(lines[i + 1])
      ) {
        const head = splitRow(line);
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
          rows.push(splitRow(lines[i]));
          i++;
        }
        const thead = head.map((c) => `<th>${renderInline(c)}</th>`).join('');
        const tbody = rows
          .map(
            (r) =>
              `<tr>${r.map((c) => `<td>${renderInline(c)}</td>`).join('')}</tr>`
          )
          .join('');
        html.push(
          `<div class="table-wrap"><table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table></div>`
        );
        continue;
      }

      // ── 인용 / 콜아웃 ─────────────────────
      if (/^>\s?/.test(line)) {
        const buf = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          buf.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }
        const inner = buf.join('\n');
        // 첫 글자가 이모지면 콜아웃으로 취급
        const callout = inner.match(
          /^([\u231A-\u27BF\u2B00-\u2BFF\uD83C-\uDBFF\uDC00-\uDFFF]{1,3})\s+([\s\S]*)$/
        );
        if (callout) {
          html.push(
            `<div class="callout"><span class="callout-icon">${escapeHtml(
              callout[1]
            )}</span><div class="callout-body">${render(callout[2])}</div></div>`
          );
        } else {
          html.push(`<blockquote>${render(inner)}</blockquote>`);
        }
        continue;
      }

      // ── 체크박스 목록 ─────────────────────
      if (/^\s*[-*]\s+\[[ xX]\]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\s*[-*]\s+\[[ xX]\]\s+/.test(lines[i])) {
          const m = lines[i].match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/);
          const checked = m[1].toLowerCase() === 'x';
          items.push(
            `<li class="task${checked ? ' done' : ''}">` +
              `<input type="checkbox" disabled${checked ? ' checked' : ''}>` +
              `<span>${renderInline(m[2])}</span></li>`
          );
          i++;
        }
        html.push(`<ul class="task-list">${items.join('')}</ul>`);
        continue;
      }

      // ── 비순서 목록 ───────────────────────
      if (/^\s*[-*+]\s+/.test(line)) {
        const items = [];
        while (
          i < lines.length &&
          /^\s*[-*+]\s+/.test(lines[i]) &&
          !/^\s*[-*]\s+\[[ xX]\]\s+/.test(lines[i])
        ) {
          items.push(
            `<li>${renderInline(lines[i].replace(/^\s*[-*+]\s+/, ''))}</li>`
          );
          i++;
        }
        html.push(`<ul>${items.join('')}</ul>`);
        continue;
      }

      // ── 순서 목록 ─────────────────────────
      if (/^\s*\d+[.)]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
          items.push(
            `<li>${renderInline(lines[i].replace(/^\s*\d+[.)]\s+/, ''))}</li>`
          );
          i++;
        }
        html.push(`<ol>${items.join('')}</ol>`);
        continue;
      }

      // ── 문단 ─────────────────────────────
      const buf = [];
      while (
        i < lines.length &&
        lines[i].trim() &&
        !/^(#{1,4}\s|>|```|\s*[-*+]\s|\s*\d+[.)]\s)/.test(lines[i]) &&
        !/^\s*([-*_])\s*(\1\s*){2,}$/.test(lines[i])
      ) {
        buf.push(lines[i]);
        i++;
      }
      if (buf.length) {
        html.push(`<p>${renderInline(buf.join('\n'))}</p>`);
      } else {
        i++;
      }
    }

    return html.join('\n');
  }

  /** 프론트매터(--- 사이의 메타데이터) 분리 */
  function parseFrontmatter(raw) {
    const text = String(raw || '').replace(/^\uFEFF/, '');
    const meta = { tags: [] };

    if (!/^---\s*\n/.test(text)) {
      return { meta, body: text };
    }

    const end = text.indexOf('\n---', 3);
    if (end === -1) return { meta, body: text };

    const block = text.slice(4, end);
    const body = text.slice(end + 4).replace(/^\s*\n/, '');

    block.split('\n').forEach((line) => {
      const m = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
      if (!m) return;
      const key = m[1].trim();
      let value = m[2].trim();

      // 따옴표 제거
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      // 배열 형태 [a, b]
      if (value.startsWith('[') && value.endsWith(']')) {
        meta[key] = value
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
        return;
      }

      meta[key] = value;
    });

    if (typeof meta.tags === 'string') {
      meta.tags = meta.tags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (!Array.isArray(meta.tags)) meta.tags = [];

    return { meta, body };
  }

  /** 프론트매터 문자열 생성 */
  function buildFrontmatter(meta) {
    const lines = ['---'];
    if (meta.title) lines.push(`title: ${meta.title}`);
    if (meta.date) lines.push(`date: ${meta.date}`);
    if (meta.tags && meta.tags.length) {
      lines.push(`tags: [${meta.tags.join(', ')}]`);
    }
    if (meta.status) lines.push(`status: ${meta.status}`);
    lines.push('---');
    return lines.join('\n');
  }

  /** 본문에서 요약 추출 */
  function excerpt(body, limit = 140) {
    const plain = String(body || '')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^>\s?/gm, '')
      .replace(/^\s*[-*+]\s+\[[ xX]\]\s*/gm, '')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+[.)]\s+/gm, '')
      .replace(/[*_~`#|]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return plain.length > limit ? plain.slice(0, limit).trim() + '…' : plain;
  }

  /** 읽는 시간 (분) */
  function readingTime(body) {
    const chars = String(body || '').replace(/\s/g, '').length;
    return Math.max(1, Math.round(chars / 500));
  }

  window.MD = {
    render,
    renderInline,
    escapeHtml,
    parseFrontmatter,
    buildFrontmatter,
    excerpt,
    readingTime,
  };
})();
