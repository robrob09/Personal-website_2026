(function () {
  var STORAGE_KEY = 'portfolio-language';
  var SCROLL_TARGET_KEY = 'portfolio-scroll-target';
  var RESTORE_INTENT_KEY = 'portfolio-scroll-restore-intent';

  function safeStore(language) {
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch (error) {
      /* no-op */
    }
  }

  function getHomeSections() {
    if (document.body.getAttribute('data-page-kind') !== 'home') {
      return [];
    }

    return Array.from(document.querySelectorAll('main section[id]'));
  }

  function getHeaderOffset() {
    var header = document.querySelector('[data-site-header]');
    return header ? header.offsetHeight + 6 : 72;
  }

  function getCurrentScrollTarget() {
    var sections = getHomeSections();
    if (!sections.length) {
      return null;
    }

    var scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    var maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    var marker = scrollTop + getHeaderOffset();
    var currentSection = sections[0];

    sections.forEach(function (section) {
      if (section.offsetTop <= marker) {
        currentSection = section;
      }
    });

    return {
      section: currentSection.id,
      offset: Math.max(0, Math.round(marker - currentSection.offsetTop)),
      atBottom: maxScroll - scrollTop <= 4,
      createdAt: Date.now(),
    };
  }

  function getTargetPath(targetUrl) {
    try {
      return new URL(targetUrl, window.location.href).pathname;
    } catch (error) {
      return '';
    }
  }

  function safeStoreScrollTarget(targetUrl) {
    var target = getCurrentScrollTarget();
    if (!target) {
      return;
    }

    target.path = getTargetPath(targetUrl);

    try {
      window.sessionStorage.setItem(SCROLL_TARGET_KEY, JSON.stringify(target));
      window.sessionStorage.setItem(
        RESTORE_INTENT_KEY,
        JSON.stringify({
          path: target.path,
          createdAt: target.createdAt,
        })
      );
    } catch (error) {
      /* no-op */
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var currentLanguage = document.body.getAttribute('data-page-language') === 'ru' ? 'ru' : 'en';

    document.querySelectorAll('[data-lang-switcher]').forEach(function (switcher) {
      switcher.querySelectorAll('[data-lang-option]').forEach(function (link) {
        var language = link.getAttribute('data-lang-option');
        var targetUrl = link.getAttribute('data-target-url');

        if (targetUrl) {
          link.setAttribute('href', targetUrl);
        }

        if (language === currentLanguage) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }

        link.addEventListener('click', function (event) {
          if (language === currentLanguage) {
            event.preventDefault();
            return;
          }

          safeStore(language);
          if (targetUrl) {
            event.preventDefault();
            safeStoreScrollTarget(targetUrl);
            window.location.assign(targetUrl);
          }
        });
      });
    });
  });
})();
