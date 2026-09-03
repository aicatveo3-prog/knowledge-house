/**
 * GitHub Contents API 클라이언트
 * 글을 저장소의 파일로 읽고 쓰는 최소한의 래퍼입니다.
 */
(function () {
  const API = 'https://api.github.com';

  /** UTF-8 문자열 → base64 */
  function encodeBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(
        null,
        bytes.subarray(i, i + chunk)
      );
    }
    return btoa(binary);
  }

  /** base64 → UTF-8 문자열 */
  function decodeBase64(b64) {
    const binary = atob(String(b64).replace(/\s/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }

  function cfg() {
    return window.SITE_CONFIG || {};
  }

  function repoPath() {
    const c = cfg();
    return `/repos/${c.owner}/${c.repo}`;
  }

  /** 경로를 URL에 안전하게 (슬래시는 유지) */
  function encodePath(path) {
    return String(path)
      .split('/')
      .map(encodeURIComponent)
      .join('/');
  }

  class GitHubError extends Error {
    constructor(message, status, body) {
      super(message);
      this.status = status;
      this.body = body;
    }
  }

  function friendlyMessage(status, body) {
    const raw = (body && body.message) || '';
    switch (status) {
      case 401:
        return '토큰이 유효하지 않습니다. 설정에서 다시 등록해 주세요.';
      case 403:
        if (/rate limit/i.test(raw)) {
          return 'GitHub 요청 한도를 넘었습니다. 잠시 후 다시 시도해 주세요.';
        }
        return '권한이 없습니다. 토큰에 Contents 쓰기 권한이 있는지 확인해 주세요.';
      case 404:
        return '대상을 찾을 수 없습니다. 저장소 이름과 토큰 권한을 확인해 주세요.';
      case 409:
        return '다른 곳에서 먼저 수정되었습니다. 새로고침 후 다시 시도해 주세요.';
      case 422:
        return `요청이 거부되었습니다. ${raw}`;
      default:
        return raw || `요청이 실패했습니다. (HTTP ${status})`;
    }
  }

  async function request(path, options = {}) {
    const { auth = true, ...init } = options;
    const headers = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers || {}),
    };

    const token = window.Store ? window.Store.getToken() : '';
    if (auth && token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(API + path, { ...init, headers });

    if (res.status === 204) return null;

    let body = null;
    const text = await res.text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch (e) {
        body = { message: text };
      }
    }

    if (!res.ok) {
      throw new GitHubError(friendlyMessage(res.status, body), res.status, body);
    }

    // 응답 헤더가 필요한 호출(토큰 만료일 확인 등)을 위해 함께 돌려준다
    if (options.withHeaders) {
      return { body, headers: res.headers };
    }
    return body;
  }

  /**
   * 응답 헤더에서 토큰 만료일을 찾습니다.
   * GitHub 이 노출하지 않는 경우도 있어 없으면 null 을 돌려줍니다.
   */
  function readExpiry(headers) {
    try {
      const raw =
        headers && headers.get
          ? headers.get('github-authentication-token-expiration')
          : null;
      if (!raw) return null;
      // "2027-01-01 00:00:00 UTC" 같은 형식이 오므로 다루기 쉽게 바꾼다
      const cleaned = raw.trim().replace(' UTC', 'Z').replace(' ', 'T');
      const parsed = new Date(cleaned);
      if (Number.isNaN(parsed.getTime())) return null;
      return parsed.toISOString();
    } catch (e) {
      return null;
    }
  }

  const GH = {
    GitHubError,
    encodeBase64,
    decodeBase64,

    /** 토큰이 이 저장소에 쓸 수 있는지 확인 (+ 만료일 확인) */
    async verify() {
      const c = cfg();
      const { body: repo, headers } = await request(repoPath(), {
        withHeaders: true,
      });
      const perms = repo.permissions || {};
      return {
        ok: !!perms.push,
        fullName: repo.full_name,
        private: repo.private,
        defaultBranch: repo.default_branch,
        canPush: !!perms.push,
        expected: `${c.owner}/${c.repo}`,
        expiresAt: readExpiry(headers),
      };
    },

    /** 파일 하나 읽기 → { text, sha } / 없으면 null */
    async readFile(path) {
      const c = cfg();
      try {
        const data = await request(
          `${repoPath()}/contents/${encodePath(path)}?ref=${encodeURIComponent(
            c.branch
          )}`
        );
        return {
          text: data.content ? decodeBase64(data.content) : '',
          sha: data.sha,
          path: data.path,
        };
      } catch (e) {
        if (e.status === 404) return null;
        throw e;
      }
    },

    /** 폴더 목록 → [{name, path, sha}] / 없으면 [] */
    async listDir(path) {
      const c = cfg();
      try {
        const data = await request(
          `${repoPath()}/contents/${encodePath(path)}?ref=${encodeURIComponent(
            c.branch
          )}`
        );
        return Array.isArray(data) ? data : [];
      } catch (e) {
        if (e.status === 404) return [];
        throw e;
      }
    },

    /**
     * 파일 쓰기 (없으면 생성, 있으면 수정)
     * sha를 넘기지 않으면 기존 파일을 자동으로 찾아 sha를 채웁니다.
     */
    async writeFile(path, text, message, sha) {
      const c = cfg();
      let useSha = sha;

      if (useSha === undefined) {
        const existing = await this.readFile(path);
        useSha = existing ? existing.sha : undefined;
      }

      const payload = {
        message: message || `chore: ${path} 업데이트`,
        content: encodeBase64(text),
        branch: c.branch,
      };
      if (useSha) payload.sha = useSha;

      const res = await request(
        `${repoPath()}/contents/${encodePath(path)}`,
        {
          method: 'PUT',
          body: JSON.stringify(payload),
        }
      );
      return { sha: res.content.sha, commit: res.commit.sha };
    },

    /** base64 그대로 쓰기 (이미지 업로드용) */
    async writeBinary(path, base64, message) {
      const c = cfg();
      const res = await request(
        `${repoPath()}/contents/${encodePath(path)}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            message: message || `chore: ${path} 추가`,
            content: base64,
            branch: c.branch,
          }),
        }
      );
      return { sha: res.content.sha, path: res.content.path };
    },

    /** 파일 삭제 */
    async deleteFile(path, sha, message) {
      const c = cfg();
      let useSha = sha;
      if (!useSha) {
        const existing = await this.readFile(path);
        if (!existing) return false;
        useSha = existing.sha;
      }
      await request(`${repoPath()}/contents/${encodePath(path)}`, {
        method: 'DELETE',
        body: JSON.stringify({
          message: message || `chore: ${path} 삭제`,
          sha: useSha,
          branch: c.branch,
        }),
      });
      return true;
    },

    /** 파일 이동 (초안 → 발행 등) */
    async moveFile(fromPath, toPath, message) {
      const src = await this.readFile(fromPath);
      if (!src) throw new Error('원본 파일을 찾을 수 없습니다.');
      await this.writeFile(toPath, src.text, message);
      await this.deleteFile(fromPath, src.sha, message);
      return src.text;
    },

    /** 특정 파일의 커밋 이력 */
    async history(path, limit = 20) {
      const c = cfg();
      const data = await request(
        `${repoPath()}/commits?path=${encodePath(path)}&sha=${encodeURIComponent(
          c.branch
        )}&per_page=${limit}`
      );
      return (data || []).map((item) => ({
        sha: item.sha,
        message: item.commit.message,
        date: item.commit.author.date,
        author: item.commit.author.name,
      }));
    },
  };

  window.GH = GH;
})();
