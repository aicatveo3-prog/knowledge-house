/**
 * posts/*.md 를 읽어 data/posts.json 목록 색인을 만듭니다.
 * GitHub Actions 가 배포 직전에 실행합니다. (저장소에 커밋하지 않음)
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const POSTS_DIR = 'posts';
const OUT_DIR = 'data';
const OUT_FILE = path.join(OUT_DIR, 'posts.json');

/** --- 사이 메타데이터 분리 */
function parseFrontmatter(raw) {
  const text = raw.replace(/^\uFEFF/, '');
  const meta = { tags: [] };

  if (!/^---\s*\n/.test(text)) return { meta, body: text };

  const end = text.indexOf('\n---', 3);
  if (end === -1) return { meta, body: text };

  const block = text.slice(4, end);
  const body = text.slice(end + 4).replace(/^\s*\n/, '');

  for (const line of block.split('\n')) {
    const m = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let value = m[2].trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (value.startsWith('[') && value.endsWith(']')) {
      meta[key] = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
      continue;
    }

    meta[key] = value;
  }

  if (typeof meta.tags === 'string') {
    meta.tags = meta.tags
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (!Array.isArray(meta.tags)) meta.tags = [];

  return { meta, body };
}

/** 본문에서 요약 뽑기 */
function excerpt(body, limit = 140) {
  const plain = body
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

function readingTime(body) {
  const chars = body.replace(/\s/g, '').length;
  return Math.max(1, Math.round(chars / 500));
}

/** 파일명에서 날짜 추출 (프론트매터에 날짜가 없을 때 대비) */
function dateFromName(name) {
  const m = name.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
}

async function main() {
  let files = [];
  try {
    files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith('.md'));
  } catch (e) {
    console.log(`${POSTS_DIR}/ 폴더가 없습니다. 빈 색인을 만듭니다.`);
  }

  const posts = [];

  for (const file of files) {
    const full = path.join(POSTS_DIR, file);
    const raw = await readFile(full, 'utf8');
    const { meta, body } = parseFrontmatter(raw);
    const id = file.replace(/\.md$/, '');

    posts.push({
      id,
      path: full,
      title: meta.title || id,
      date: meta.date || dateFromName(file),
      tags: meta.tags,
      status: meta.status || '',
      excerpt: excerpt(body),
      readingTime: readingTime(body),
    });
  }

  posts.sort((a, b) => {
    if (a.date === b.date) return b.id.localeCompare(a.id);
    return (b.date || '').localeCompare(a.date || '');
  });

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(
    OUT_FILE,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), count: posts.length, posts },
      null,
      2
    ) + '\n',
    'utf8'
  );

  console.log(`색인 완료: ${posts.length}개 글 → ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
