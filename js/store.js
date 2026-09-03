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

    set(key, value) {
      try {
        localStorage.setItem(NS + key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.warn('저장 실패', e);
        return false;
      }
    },

    remove(key) {
      localStorage.removeItem(NS + key);
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
    },
    hasToken() {
      return !!this.getToken();
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
