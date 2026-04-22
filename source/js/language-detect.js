(function () {
  var LANGUAGE_KEY = "portfolio-language";

  function safeGetLanguage() {
    try {
      var value = window.localStorage.getItem(LANGUAGE_KEY);
      return value === "ru" || value === "en" ? value : null;
    } catch (error) {
      return null;
    }
  }

  function detectBrowserLanguage() {
    var languages = Array.isArray(window.navigator.languages) && window.navigator.languages.length
      ? window.navigator.languages
      : [window.navigator.language || "en"];

    return languages.some(function (lang) {
      return String(lang).toLowerCase().startsWith("ru");
    })
      ? "ru"
      : "en";
  }

  function getFilename(pathname) {
    var clean = pathname.replace(/\/+$/, "");
    if (!clean) return "index.html";
    var parts = clean.split("/");
    var last = parts[parts.length - 1];
    return /\.html$/i.test(last) ? last : "index.html";
  }

  function isRussianPath(pathname) {
    return /\/ru(\/|$)/i.test(pathname);
  }

  function getBasePrefix(pathname) {
    var clean = pathname.replace(/\/+$/, "");
    var parts = clean.split("/").filter(Boolean);

    if (parts.length && /\.html$/i.test(parts[parts.length - 1])) {
      parts.pop();
    }

    if (parts[parts.length - 1] === "ru") {
      parts.pop();
    }

    return parts.length ? "/" + parts.join("/") : "";
  }

  function buildTargetPath(pathname, targetLanguage) {
    var filename = getFilename(pathname);
    var basePrefix = getBasePrefix(pathname);
    var languagePrefix = targetLanguage === "ru" ? "/ru" : "";
    return (basePrefix + languagePrefix + "/" + filename).replace(/\/{2,}/g, "/");
  }

  var preferred = safeGetLanguage() || detectBrowserLanguage();
  var pathname = window.location.pathname;
  var currentLanguage = isRussianPath(pathname) ? "ru" : "en";

  if (preferred === currentLanguage) return;

  var targetPath = buildTargetPath(pathname, preferred);
  if (targetPath !== pathname) {
    window.location.replace(targetPath + window.location.search + window.location.hash);
  }
})();