/**
 * HTML 안의 CSS·JS 주소에 배포 판번호를 붙입니다.
 *   <script src="js/app.js">  →  <script src="js/app.js?v=ed00040">
 *
 * 브라우저가 옛 파일을 계속 쓰는 일을 막습니다.
 * 배포할 때만 실행되며 저장소에는 커밋되지 않습니다.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';

/** 커밋 해시가 있으면 그것을, 없으면 시각을 쓴다 */
function version() {
  const sha = process.env.GITHUB_SHA;
  if (sha) return sha.slice(0, 7);
  return Date.now().toString(36);
}

/** 우리 저장소 안의 파일만 대상 (CDN 주소는 건드리지 않는다) */
function isLocalAsset(url) {
  if (!url) return false;
  if (/^(https?:)?\/\//.test(url)) return false;
  if (url.startsWith('data:') || url.startsWith('#')) return false;
  if (url.includes('?')) return false; // 이미 붙어 있으면 그대로
  return /\.(?:js|css)$/i.test(url);
}

async function main() {
  const stamp = version();
  const pages = (await readdir('.')).filter((f) => f.endsWith('.html'));
  let changed = 0;

  for (const page of pages) {
    const before = await readFile(page, 'utf8');

    const after = before
      .replace(/(<script[^>]+src=")([^"]+)(")/g, (m, a, url, b) =>
        isLocalAsset(url) ? `${a}${url}?v=${stamp}${b}` : m
      )
      .replace(/(<link[^>]+href=")([^"]+)(")/g, (m, a, url, b) =>
        isLocalAsset(url) ? `${a}${url}?v=${stamp}${b}` : m
      );

    if (after !== before) {
      await writeFile(page, after, 'utf8');
      changed++;
    }
  }

  console.log(`판번호 ${stamp} 를 ${changed}개 페이지에 붙였습니다.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
