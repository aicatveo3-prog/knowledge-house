/**
 * 붙여넣은 서식 있는 글(HTML)을 마크다운으로 바꿉니다.
 *
 * 노션, 웹페이지, 워드, 구글 문서 등에서 복사한 내용의
 * 제목 / 굵게 / 목록 / 인용 / 표 / 가로선 / 링크를 살립니다.
 *
 * DOM 표준 기능만 최소로 사용하므로 검증용 대체 구현으로도 돌릴 수 있습니다.
 */
(function () {
  const INLINE_TAGS = new Set([
    'A', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'DEL', 'CODE', 'SPAN',
    'FONT', 'SUB', 'SUP', 'SMALL', 'MARK', 'ABBR', 'TIME', 'KBD', 'SAMP',
    'VAR', 'CITE', 'BR', 'IMG', 'Q', 'LABEL', 'BDI', 'INS',
  ]);

  const SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'META', 'LINK', 'NOSCRIPT', 'HEAD', 'TITLE',
    'IFRAME', 'SVG', 'BUTTON', 'SELECT', 'TEXTAREA', 'FORM',
  ]);

  const ELEMENT = 1;
  const TEXT = 3;

  // ── 도우미 ────────────────────────────────

  function tagOf(node) {
    return node && node.tagName ? String(node.tagName).toUpperCase() : '';
  }

  function styleOf(node) {
    // 브라우저에서는 node.style, 대체 구현에서는 파싱된 객체
    return (node && node.style) || {};
  }

  function attr(node, name) {
    if (!node || typeof node.getAttribute !== 'function') return '';
    return node.getAttribute(name) || '';
  }

  function childrenOf(node) {
    if (!node || !node.childNodes) return [];
    return Array.prototype.slice.call(node.childNodes);
  }

  /** 요소 자식만 (텍스트 제외) */
  function elementChildren(node) {
    return childrenOf(node).filter((c) => c.nodeType === ELEMENT);
  }

  function isBold(node) {
    const weight = String(styleOf(node).fontWeight || '').trim();
    if (weight) {
      // 구글 문서는 <b style="font-weight:normal"> 로 전체를 감싸므로 style 을 먼저 본다
      if (weight === 'normal' || weight === 'lighter') return false;
      if (weight === 'bold' || weight === 'bolder') return true;
      const num = parseInt(weight, 10);
      if (!Number.isNaN(num)) return num >= 600;
    }
    return /^(B|STRONG)$/.test(tagOf(node));
  }

  function isItalic(node) {
    if (String(styleOf(node).fontStyle || '').trim() === 'italic') return true;
    return /^(I|EM|CITE|VAR)$/.test(tagOf(node));
  }

  function isStrike(node) {
    const deco = String(
      styleOf(node).textDecoration || styleOf(node).textDecorationLine || ''
    );
    if (deco.indexOf('line-through') !== -1) return true;
    return /^(S|STRIKE|DEL)$/.test(tagOf(node));
  }

  /** 텍스트 노드 정리: HTML 처럼 공백을 합치고 붙여넣기 찌꺼기를 제거 */
  function normalizeText(value) {
    return String(value == null ? '' : value)
      .replace(/[\u00A0\u2007\u202F]/g, ' ') // 줄바꿈 안 되는 공백 → 보통 공백
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // 보이지 않는 문자 제거
      .replace(/\s+/g, ' ');
  }

  /** 마크다운으로 오해될 문자 보호 */
  function escapeInline(text) {
    return text.replace(/([*`])/g, '\\$1');
  }

  // ── 인라인 변환 ────────────────────────────

  function inlineOf(node) {
    return childrenOf(node).map(inlineNode).join('');
  }

  function inlineNode(node) {
    if (node.nodeType === TEXT) {
      return escapeInline(normalizeText(node.nodeValue));
    }
    if (node.nodeType !== ELEMENT) return '';

    const tag = tagOf(node);
    if (SKIP_TAGS.has(tag)) return '';

    if (tag === 'BR') return '\n';

    if (tag === 'IMG') {
      const src = attr(node, 'src');
      if (!src || src.indexOf('data:') === 0) return '';
      const alt = normalizeText(attr(node, 'alt')).trim();
      return `![${alt}](${src})`;
    }

    if (tag === 'CODE' || tag === 'KBD' || tag === 'SAMP') {
      const raw = normalizeText(node.textContent).trim();
      if (!raw) return '';
      return '`' + raw.replace(/`/g, '') + '`';
    }

    if (tag === 'A') {
      const href = attr(node, 'href');
      const label = inlineOf(node).trim();
      if (!label) return '';
      if (!href || href.charAt(0) === '#' || href.indexOf('javascript:') === 0) {
        return label;
      }
      // 링크 글자와 주소가 같으면 주소만
      if (label === href) return href;
      return `[${label}](${href})`;
    }

    // 서식 감싸기
    let inner = inlineOf(node);
    if (!inner.trim()) return inner;

    // 앞뒤 공백은 강조 바깥으로 빼야 마크다운이 깨지지 않는다
    const lead = inner.match(/^\s*/)[0];
    const tail = inner.match(/\s*$/)[0];
    let core = inner.slice(lead.length, inner.length - tail.length);

    if (isStrike(node)) core = `~~${core}~~`;
    if (isItalic(node)) core = `*${core}*`;
    if (isBold(node)) core = `**${core}**`;

    return lead + core + tail;
  }

  // ── 블록 변환 ─────────────────────────────

  function blockOf(node, indent) {
    const out = [];
    let buffer = [];

    const flush = () => {
      const text = buffer
        .join('')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n[ \t]+/g, '\n')
        .trim();
      if (text) out.push(text);
      buffer = [];
    };

    childrenOf(node).forEach((child) => {
      if (child.nodeType === TEXT) {
        buffer.push(escapeInline(normalizeText(child.nodeValue)));
        return;
      }
      if (child.nodeType !== ELEMENT) return;

      const tag = tagOf(child);
      if (SKIP_TAGS.has(tag)) return;

      if (INLINE_TAGS.has(tag)) {
        buffer.push(inlineNode(child));
        return;
      }

      flush();
      const block = blockElement(child, indent || '');
      if (block) out.push(block);
    });

    flush();
    return out.filter(Boolean).join('\n\n');
  }

  function blockElement(node, indent) {
    const tag = tagOf(node);

    // 제목
    const heading = tag.match(/^H([1-6])$/);
    if (heading) {
      const text = inlineOf(node).replace(/\s*\n\s*/g, ' ').trim();
      if (!text) return '';
      // 마크다운은 4단계까지만 쓰므로 그 이하는 4로 맞춘다
      const level = Math.min(4, Number(heading[1]));
      return '#'.repeat(level) + ' ' + text;
    }

    if (tag === 'HR') return '---';

    if (tag === 'PRE') {
      const lang = detectLanguage(node);
      const code = String(node.textContent || '').replace(/\n+$/, '');
      if (!code.trim()) return '';
      return '```' + lang + '\n' + code + '\n```';
    }

    if (tag === 'BLOCKQUOTE') {
      const inner = blockOf(node, indent);
      if (!inner.trim()) return '';
      return inner
        .split('\n')
        .map((line) => (line ? '> ' + line : '>'))
        .join('\n');
    }

    if (tag === 'UL' || tag === 'OL') {
      return listOf(node, tag === 'OL', indent);
    }

    if (tag === 'TABLE') {
      return tableOf(node);
    }

    if (tag === 'LI') {
      // 목록 밖의 LI (드문 경우)
      return '- ' + blockOf(node, indent).replace(/\n/g, ' ');
    }

    if (tag === 'DL') {
      return elementChildren(node)
        .map((child) => {
          const t = tagOf(child);
          const text = inlineOf(child).trim();
          if (!text) return '';
          if (t === 'DT') return '**' + text + '**';
          if (t === 'DD') return text;
          return text;
        })
        .filter(Boolean)
        .join('\n\n');
    }

    // P, DIV, SECTION, FIGURE 등은 안쪽을 그대로
    return blockOf(node, indent);
  }

  function detectLanguage(node) {
    const cls = String(attr(node, 'class') || '');
    let match = cls.match(/(?:language|lang)-([\w+#-]+)/i);
    if (!match) {
      const codeChild = elementChildren(node).find((c) => tagOf(c) === 'CODE');
      if (codeChild) {
        match = String(attr(codeChild, 'class') || '').match(
          /(?:language|lang)-([\w+#-]+)/i
        );
      }
    }
    return match ? match[1].toLowerCase() : '';
  }

  function listOf(node, ordered, indent) {
    const pad = indent || '';
    const items = elementChildren(node).filter((c) => tagOf(c) === 'LI');
    const lines = [];
    let counter = 0;

    items.forEach((li) => {
      counter++;

      // 중첩 목록은 따로 떼어 처리
      const nested = [];
      const ownParts = [];

      childrenOf(li).forEach((child) => {
        const tag = tagOf(child);
        if (tag === 'UL' || tag === 'OL') {
          nested.push(listOf(child, tag === 'OL', pad + '  '));
        } else if (child.nodeType === TEXT) {
          ownParts.push(escapeInline(normalizeText(child.nodeValue)));
        } else if (child.nodeType === ELEMENT) {
          if (SKIP_TAGS.has(tag) && tag !== 'INPUT') return;
          if (INLINE_TAGS.has(tag)) ownParts.push(inlineNode(child));
          else ownParts.push(blockElement(child, pad + '  '));
        }
      });

      let text = ownParts.join('').replace(/\s*\n\s*/g, ' ').trim();

      // 체크박스 목록
      const checkbox = elementChildren(li).find(
        (c) => tagOf(c) === 'INPUT' && attr(c, 'type').toLowerCase() === 'checkbox'
      );
      let marker = ordered ? counter + '. ' : '- ';
      if (checkbox) {
        const checked =
          attr(checkbox, 'checked') !== '' || checkbox.checked === true;
        marker = '- [' + (checked ? 'x' : ' ') + '] ';
      }

      if (text) lines.push(pad + marker + text);
      else if (nested.length) lines.push(pad + marker.trimEnd());

      nested.forEach((block) => lines.push(block));
    });

    return lines.join('\n');
  }

  /** 표 안의 모든 행을 찾는다 (thead/tbody 를 건너서) */
  function collectRows(node, rows) {
    elementChildren(node).forEach((child) => {
      const tag = tagOf(child);
      if (tag === 'TR') rows.push(child);
      else if (tag === 'THEAD' || tag === 'TBODY' || tag === 'TFOOT') {
        collectRows(child, rows);
      }
    });
    return rows;
  }

  function tableOf(node) {
    const rows = collectRows(node, []);
    if (!rows.length) return '';

    const cellsOf = (row) =>
      elementChildren(row)
        .filter((c) => tagOf(c) === 'TD' || tagOf(c) === 'TH')
        .map((c) =>
          inlineOf(c)
            .replace(/\s*\n\s*/g, ' ')
            .replace(/\|/g, '\\|')
            .trim()
        );

    const head = cellsOf(rows[0]);
    if (!head.length) return '';

    const bodyRows = rows.slice(1).map(cellsOf).filter((r) => r.length);
    const width = Math.max(head.length, ...bodyRows.map((r) => r.length), 1);

    const pad = (cells) => {
      const copy = cells.slice();
      while (copy.length < width) copy.push('');
      return '| ' + copy.join(' | ') + ' |';
    };

    const lines = [pad(head), '| ' + Array(width).fill('---').join(' | ') + ' |'];
    bodyRows.forEach((r) => lines.push(pad(r)));
    return lines.join('\n');
  }

  // ── 마무리 정리 ────────────────────────────

  function tidy(markdown) {
    return markdown
      .split('\n')
      .map((line) => line.replace(/[ \t]+$/, ''))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s+|\s+$/g, '');
  }

  /**
   * 이 HTML 이 변환할 가치가 있는 서식을 담고 있는지.
   * 단순 텍스트 복사인데 브라우저가 HTML 을 끼워넣은 경우를 걸러냅니다.
   */
  function hasStructure(html) {
    return /<(h[1-6]|ul|ol|li|blockquote|hr|table|tr|td|th|pre|code|strong|b|em|i|del|s|img|a)\b/i.test(
      String(html || '')
    );
  }

  /** 이미 파싱된 노드를 변환 (검증용) */
  function convertNode(root) {
    return tidy(blockOf(root, ''));
  }

  /** HTML 문자열을 변환 */
  function convert(html) {
    if (typeof DOMParser === 'undefined') return '';
    const doc = new DOMParser().parseFromString(String(html), 'text/html');
    const root = doc.body || doc.documentElement;
    if (!root) return '';
    return convertNode(root);
  }

  window.HtmlToMd = { convert, convertNode, hasStructure, tidy };
})();
