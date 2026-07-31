// Shared Storage Utilities

const storage = {
  prefix: '',

  getJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.error('localStorage load failed:', e);
      return fallback;
    }
  },

  setJSON(key, value) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('localStorage save failed:', e);
      return false;
    }
  }
};

if (typeof window !== 'undefined') {
  window.storage = storage;
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = storage;
}
