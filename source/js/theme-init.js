(function () {
  var STORAGE_KEY = 'portfolio-theme';

  function normalizeTheme(value) {
    return value === 'dark' ? 'dark' : 'light';
  }

  function safeGetTheme() {
    try {
      return normalizeTheme(window.localStorage.getItem(STORAGE_KEY));
    } catch (error) {
      return 'light';
    }
  }

  function applyTheme(theme) {
    var normalized = normalizeTheme(theme);
    document.documentElement.setAttribute('data-theme', normalized);

    window.dispatchEvent(
      new CustomEvent('portfolio-theme-change', {
        detail: { theme: normalized },
      })
    );

    return normalized;
  }

  function setTheme(theme) {
    var normalized = applyTheme(theme);

    try {
      window.localStorage.setItem(STORAGE_KEY, normalized);
    } catch (error) {
      /* no-op */
    }

    return normalized;
  }

  function toggleTheme() {
    return setTheme(getCurrentTheme() === 'dark' ? 'light' : 'dark');
  }

  function getCurrentTheme() {
    return normalizeTheme(document.documentElement.getAttribute('data-theme'));
  }

  applyTheme(safeGetTheme());

  window.PortfolioTheme = {
    getCurrentTheme: getCurrentTheme,
    getStoredTheme: safeGetTheme,
    setTheme: setTheme,
    toggleTheme: toggleTheme,
  };
})();
