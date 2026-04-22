(function () {
  var HEADER_STATE_CLASSES = [
    'is-brand-hidden',
    'is-switcher-labels-hidden',
    'is-header-wrapped',
    'is-controls-stacked',
  ];
  var TRACK_STORAGE_KEY = 'portfolio-track';
  var LANGUAGE_STORAGE_KEY = 'portfolio-language';
  var SCROLL_TARGET_KEY = 'portfolio-scroll-target';
  var RESTORE_INTENT_KEY = 'portfolio-scroll-restore-intent';
  var HEADER_READY_EVENT = 'portfolio:header-ready';
  var headerLayoutFrame = 0;
  var hasDispatchedHeaderReady = false;

  function createSpan(className, text) {
    var span = document.createElement('span');
    span.className = className;
    span.textContent = text;
    return span;
  }

  function createImage(className, source, alt) {
    var image = document.createElement('img');
    image.className = className;
    image.src = source;
    image.alt = alt || '';
    return image;
  }

  function syncHeaderOffset() {
    var header = document.querySelector('[data-site-header]');
    var offset = header ? header.offsetHeight + 8 : 8;
    document.documentElement.style.setProperty('--header-offset', offset + 'px');
  }

  function overflowsInline(element) {
    if (!element) {
      return false;
    }

    return element.scrollWidth > element.clientWidth + 1;
  }

  function navNeedsMoreInlineSpace(header) {
    var nav = header.querySelector('.site-header-nav');
    var navList = header.querySelector('.header-nav-list');

    if (!nav || !navList || !nav.clientWidth) {
      return false;
    }

    var previousWrap = navList.style.flexWrap;
    navList.style.flexWrap = 'nowrap';
    var needsSpace = navList.scrollWidth > nav.clientWidth + 1;
    navList.style.flexWrap = previousWrap;

    return needsSpace;
  }

  function headerNeedsCompression(header) {
    var top = header.querySelector('.site-header-top');
    return overflowsInline(top) || navNeedsMoreInlineSpace(header);
  }

  function controlsNeedWrap(header) {
    var top = header.querySelector('.site-header-top');
    var controls = header.querySelector('.site-header-controls');
    var trackSwitcher = header.querySelector('.segment-switcher');
    var languageToggle = header.querySelector('.language-dropdown-toggle');

    if (!top || !controls) {
      return false;
    }

    if (controls.getBoundingClientRect().width > top.clientWidth + 1 || overflowsInline(controls)) {
      return true;
    }

    if (!trackSwitcher || !languageToggle) {
      return false;
    }

    var trackRect = trackSwitcher.getBoundingClientRect();
    var languageRect = languageToggle.getBoundingClientRect();
    var verticalOverlap = Math.min(trackRect.bottom, languageRect.bottom) - Math.max(trackRect.top, languageRect.top) > 1;
    if (!verticalOverlap) {
      return false;
    }

    return trackRect.right > languageRect.left + 0.5 && languageRect.right > trackRect.left + 0.5;
  }

  function resetHeaderState(header) {
    HEADER_STATE_CLASSES.forEach(function (className) {
      header.classList.remove(className);
    });
  }

  function syncHeaderLayout() {
    var header = document.querySelector('[data-site-header]');

    if (header) {
      resetHeaderState(header);

      if (headerNeedsCompression(header) && header.querySelector('.site-brand-mark')) {
        header.classList.add('is-brand-hidden');
      }

      if (headerNeedsCompression(header)) {
        header.classList.add('is-switcher-labels-hidden');
      }

      if (headerNeedsCompression(header)) {
        header.classList.add('is-header-wrapped');
      }

      if (controlsNeedWrap(header)) {
        header.classList.add('is-controls-stacked');
      }
    }

    syncHeaderOffset();
  }

  function scheduleHeaderLayout() {
    if (headerLayoutFrame) {
      return;
    }

    headerLayoutFrame = window.requestAnimationFrame(function () {
      headerLayoutFrame = 0;
      syncHeaderLayout();
    });
  }

  function dispatchHeaderReady() {
    if (hasDispatchedHeaderReady) {
      return;
    }

    hasDispatchedHeaderReady = true;
    window.__portfolioHeaderReady = true;
    window.dispatchEvent(new window.CustomEvent(HEADER_READY_EVENT));
  }

  function queueHeaderReadyDispatch() {
    window.requestAnimationFrame(function () {
      syncHeaderLayout();
      dispatchHeaderReady();
    });
  }

  function safeStorePreference(storageKey, value) {
    try {
      window.localStorage.setItem(storageKey, value);
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

  function attachSwitchNavigation(link, targetValue, currentValue, targetUrl, storageKey) {
    if (!targetUrl) {
      return;
    }

    link.addEventListener('click', function (event) {
      if (targetValue === currentValue) {
        event.preventDefault();
        return;
      }

      safeStorePreference(storageKey, targetValue);
      event.preventDefault();
      safeStoreScrollTarget(targetUrl);
      window.location.assign(targetUrl);
    });
  }

  function buildTrackSwitcher(container, switcher, currentTrack) {
    var runtime = window.PortfolioRuntime;
    if (!container || !switcher || !runtime) {
      return;
    }

    runtime.clearNode(container);
    if (switcher.ariaLabel) {
      container.setAttribute('aria-label', switcher.ariaLabel);
    }

    (switcher.options || []).forEach(function (option) {
      var link = document.createElement('a');
      link.href = option.href;
      link.textContent = option.label;
      link.setAttribute('data-track-option', option.value);
      link.setAttribute('data-target-url', option.href);

      if (option.current) {
        link.setAttribute('aria-current', 'page');
      }

      attachSwitchNavigation(link, option.value, currentTrack, option.href, TRACK_STORAGE_KEY);
      container.appendChild(link);
    });
  }

  function createLangMark(option, runtime) {
    if (option.icon && option.icon.src) {
      var image = createImage('language-dropdown-flag', option.icon.src, option.icon.alt || '');
      if (runtime && typeof runtime.bindThemedAsset === 'function') {
        runtime.bindThemedAsset(image, 'src', option.icon.src, option.icon.darkSrc);
      }
      return image;
    }

    return createSpan('language-dropdown-code', option.label);
  }

  function createLanguageLink(option, currentLanguage) {
    var link = document.createElement('a');
    link.className = 'language-dropdown-option';
    link.href = option.href;
    link.setAttribute('data-lang-option', option.value);
    link.setAttribute('data-target-url', option.href);

    if (option.current) {
      link.setAttribute('aria-current', 'page');
    }

    var content = document.createElement('span');
    content.className = 'language-dropdown-option-main';
    content.appendChild(createLangMark(option, window.PortfolioRuntime));
    content.appendChild(createSpan('language-dropdown-option-code', option.label));

    var label = createSpan('language-dropdown-option-label', option.description || option.label);
    link.appendChild(content);
    link.appendChild(label);

    attachSwitchNavigation(link, option.value, currentLanguage, option.href, LANGUAGE_STORAGE_KEY);
    return link;
  }

  function buildLanguageDropdown(container, switcher, currentLanguage) {
    var runtime = window.PortfolioRuntime;
    if (!container || !switcher || !runtime) {
      return;
    }

    runtime.clearNode(container);
    container.classList.remove('is-open');
    container.classList.add('is-ready');
    container.setAttribute('aria-label', switcher.ariaLabel || 'Language');

    var options = (switcher.options || []).slice();
    if (!options.length) {
      return;
    }

    options.sort(function (left, right) {
      var leftCurrent = left.current ? -1 : 0;
      var rightCurrent = right.current ? -1 : 0;
      return leftCurrent - rightCurrent;
    });

    var currentOption = options[0];
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'language-dropdown-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-haspopup', 'true');
    toggle.setAttribute('aria-label', switcher.ariaLabel || 'Language');

    var currentWrap = document.createElement('span');
    currentWrap.className = 'language-dropdown-current';
    currentWrap.appendChild(createLangMark(currentOption, runtime));
    currentWrap.appendChild(createSpan('language-dropdown-code', currentOption.label));
    toggle.appendChild(currentWrap);
    toggle.appendChild(createSpan('language-dropdown-caret', '\u25BE'));

    var menu = document.createElement('div');
    menu.className = 'language-dropdown-menu';
    options.forEach(function (option) {
      menu.appendChild(createLanguageLink(option, currentLanguage));
    });

    container.appendChild(toggle);
    container.appendChild(menu);

    function closeMenu() {
      container.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function () {
      var shouldOpen = !container.classList.contains('is-open');

      document.querySelectorAll('.language-dropdown.is-open').forEach(function (openDropdown) {
        openDropdown.classList.remove('is-open');
        var openToggle = openDropdown.querySelector('.language-dropdown-toggle');
        if (openToggle) {
          openToggle.setAttribute('aria-expanded', 'false');
        }
      });

      if (shouldOpen) {
        container.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });

    container.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeMenu();
        toggle.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (!container.contains(event.target)) {
        closeMenu();
      }
    });
  }

  function buildThemeToggle(container, themeToggle, ui) {
    if (!container || !themeToggle || !window.PortfolioTheme) {
      return;
    }

    container.innerHTML = '';

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-toggle';

    var icon = document.createElement('img');
    icon.className = 'theme-toggle-icon';
    icon.alt = '';
    button.appendChild(icon);

    function syncThemeButton() {
      var currentTheme = window.PortfolioTheme.getCurrentTheme();
      var iconMeta = currentTheme === 'dark' ? themeToggle.icons.dark : themeToggle.icons.light;
      icon.src = iconMeta.src;
      icon.alt = iconMeta.alt || '';
      button.setAttribute('aria-label', currentTheme === 'dark' ? ui.themeToggleToLight : ui.themeToggleToDark);
      button.setAttribute('title', currentTheme === 'dark' ? ui.themeToggleToLight : ui.themeToggleToDark);
      button.setAttribute('data-theme', currentTheme);
    }

    button.addEventListener('click', function () {
      window.PortfolioTheme.toggleTheme();
      syncThemeButton();
      scheduleHeaderLayout();
    });

    window.addEventListener('portfolio-theme-change', syncThemeButton);
    syncThemeButton();
    container.appendChild(button);
  }

  function initBackToTopButton(ui) {
    if (document.querySelector('.back-to-top')) {
      return;
    }

    var label = ui && ui.backToTopAria ? ui.backToTopAria : 'Scroll back to top';
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'back-to-top';
    button.setAttribute('aria-label', label);
    button.innerHTML =
      '<span class="back-to-top-icon" aria-hidden="true">&#8593;</span><span class="visually-hidden">' +
      label +
      '</span>';
    document.body.appendChild(button);

    function updateVisibility() {
      if (window.scrollY > 240) {
        button.classList.add('is-visible');
      } else {
        button.classList.remove('is-visible');
      }
    }

    button.addEventListener('click', function () {
      var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    });

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var runtime = window.PortfolioRuntime;
    if (!runtime) {
      console.error('[portfolio] PortfolioRuntime is not available.');
      return;
    }

    runtime
      .loadPortfolioData()
      .then(function (context) {
        runtime.applyMeta(context.meta);
        runtime.bindUiFields(document, context.ui);
        runtime.bindPageFields(document, context.page);

        document.querySelectorAll('[data-track-switcher]').forEach(function (switcher) {
          buildTrackSwitcher(switcher, context.page.header.trackSwitcher, context.track);
        });

        document.querySelectorAll('[data-lang-switcher]').forEach(function (switcher) {
          buildLanguageDropdown(switcher, context.page.header.languageSwitcher, context.lang);
        });

        document.querySelectorAll('[data-theme-toggle]').forEach(function (switcher) {
          buildThemeToggle(switcher, context.page.header.themeToggle, context.ui);
        });

        syncHeaderLayout();
        scheduleHeaderLayout();
        queueHeaderReadyDispatch();
        initBackToTopButton(context.ui);

        window.addEventListener('resize', scheduleHeaderLayout);
        window.addEventListener('load', scheduleHeaderLayout);

        if ('ResizeObserver' in window) {
          var header = document.querySelector('[data-site-header]');
          if (header) {
            var resizeObserver = new ResizeObserver(scheduleHeaderLayout);
            resizeObserver.observe(header);
            header.querySelectorAll('.switcher-block, .header-utility-group').forEach(function (item) {
              resizeObserver.observe(item);
            });
          }
        }
      })
      .catch(function () {
        /* no-op */
      });
  });
})();
