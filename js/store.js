/**
 * 브라우저 로컬 저장소 유틸
 * 토큰과 임시 초안을 이 기기에만 보관합니다. 저장소에는 올라가지 않습니다.
 */
(function () {
  const NS = 'kh:';

  const Store = {
    get(key, fallback = null) {
      try {
        const raw = localStorage.getItem(NS + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    },

    /**
     * 값을 저장한 뒤 다시 읽어 실제로 저장됐는지 확인합니다.
     * (사파리 시크릿 모드는 오류 없이 조용히 저장을 무시하므로 되읽기가 필요합니다)
     */
    set(key, value) {
      const serialized = JSON.stringify(value);
      try {
        localStorage.setItem(NS + key, serialized);
        return localStorage.getItem(NS + key) === serialized;
      } catch (e) {
        console.warn('저장 실패', e);
        return false;
      }
    },

    remove(key) {
      try {
        localStorage.removeItem(NS + key);
      } catch (e) {
        /* 무시 */
      }
    },

    /**
     * 이 브라우저에서 저장이 되는 상태인지 점검합니다.
     * → { ok, reason }
     */
    probe() {
      const probeKey = NS + '__probe__';
      try {
        if (typeof localStorage === 'undefined') {
          return { ok: false, reason: '이 브라우저는 저장 기능을 지원하지 않습니다.' };
        }
        localStorage.setItem(probeKey, '1');
        const readBack = localStorage.getItem(probeKey);
        localStorage.removeItem(probeKey);

        if (readBack !== '1') {
          return {
            ok: false,
            reason:
              '저장이 차단되어 있습니다. 시크릿(사생활 보호) 창이라면 일반 창에서 열어주세요.',
          };
        }
        return { ok: true, reason: '' };
      } catch (e) {
        return {
          ok: false,
          reason:
            '브라우저가 저장을 막고 있습니다. 시크릿 창이거나 쿠키/사이트 데이터 차단 설정일 수 있습니다.',
        };
      }
    },

    /**
     * 브라우저에게 "이 데이터를 임의로 지우지 말라"고 요청합니다.
     * 사파리 등은 일정 기간 방문이 없으면 저장 데이터를 지우는데, 이 요청이 받아들여지면 덜 지워집니다.
     * → Promise<boolean>
     */
    async requestPersistence() {
      try {
        if (!navigator.storage || !navigator.storage.persist) return false;
        if (await navigator.storage.persisted()) return true;
        return await navigator.storage.persist();
      } catch (e) {
        return false;
      }
    },

    // ── 토큰 ───────────────────────────────
    getToken() {
      return this.get('token', '');
    },
    setToken(token) {
      return this.set('token', token.trim());
    },
    clearToken() {
      this.remove('token');
      this.remove('tokenMeta');
    },
    hasToken() {
      return !!this.getToken();
    },

    /** 토큰 확인 결과(연결된 저장소, 만료일 등)를 함께 보관 */
    getTokenMeta() {
      return this.get('tokenMeta', null);
    },
    setTokenMeta(meta) {
      return this.set('tokenMeta', { ...meta, savedAt: new Date().toISOString() });
    },

    /**
     * 만료까지 남은 일수 (만료일을 모르면 null)
     */
    daysUntilExpiry() {
      const meta = this.getTokenMeta();
      if (!meta || !meta.expiresAt) return null;
      const diff = new Date(meta.expiresAt).getTime() - Date.now();
      if (Number.isNaN(diff)) return null;
      return Math.floor(diff / 86400000);
    },

    // ── 테마 ───────────────────────────────
    getTheme() {
      return this.get('theme', 'auto');
    },
    setTheme(theme) {
      return this.set('theme', theme);
    },

    // ── 임시 초안 (자동 저장) ───────────────
    saveLocalDraft(id, data) {
      return this.set('draft:' + (id || '__new__'), {
        ...data,
        savedAt: new Date().toISOString(),
      });
    },
    getLocalDraft(id) {
      return this.get('draft:' + (id || '__new__'), null);
    },
    clearLocalDraft(id) {
      this.remove('draft:' + (id || '__new__'));
    },
  };

  window.Store = Store;
})();
