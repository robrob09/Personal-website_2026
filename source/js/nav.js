document.addEventListener('DOMContentLoaded', function () {
  if (document.body.getAttribute('data-page-kind') !== 'home') {
    return;
  }

  var SECTION_STORAGE_KEY = 'portfolio-last-section';
  var SCROLL_TARGET_KEY = 'portfolio-scroll-target';
  var RESTORE_INTENT_KEY = 'portfolio-scroll-restore-intent';
  var HEADER_READY_EVENT = 'portfolio:header-ready';
  var CONTENT_READY_EVENT = 'portfolio:content-ready';
  var header = document.querySelector('[data-site-header]');
  var navLinks = Array.from(document.querySelectorAll('[data-nav-link]'));
  var TARGETED_SMOOTH_SCROLL_SELECTOR = [
    '.site-brand[href^="#"]',
    'a[data-ui="heroProjects"][href^="#"]',
    'a[data-ui="heroContacts"][href^="#"]',
  ].join(',');
  var allHashLinks = Array.from(document.querySelectorAll('a[href^="#"]')).filter(function (link) {
    var href = link.getAttribute('href');
    return href && href.length > 1 && document.querySelector(href);
  });
  var sections = Array.from(document.querySelectorAll('main section[id]'));
  var sectionIds = sections.map(function (section) {
    return section.id;
  });
  var linkMap = new Map();

  navLinks.forEach(function (link) {
    var target = link.getAttribute('href');
    if (target && target.startsWith('#')) {
      linkMap.set(target.slice(1), link);
    }
  });

  function getHeaderOffset() {
    return header ? header.offsetHeight + 6 : 72;
  }

  function isKnownSection(id) {
    return sectionIds.indexOf(id) !== -1;
  }

  function safeStoreSection(id) {
    if (!isKnownSection(id)) {
      return;
    }

    try {
      window.localStorage.setItem(SECTION_STORAGE_KEY, id);
    } catch (error) {
      /* no-op */
    }
  }

  function safeTakeStoredScrollTarget() {
    try {
      var rawIntent = window.sessionStorage.getItem(RESTORE_INTENT_KEY);
      var raw = window.sessionStorage.getItem(SCROLL_TARGET_KEY);
      window.sessionStorage.removeItem(SCROLL_TARGET_KEY);
      window.sessionStorage.removeItem(RESTORE_INTENT_KEY);

      if (!raw || !rawIntent) {
        return null;
      }

      var value = JSON.parse(raw);
      var intent = JSON.parse(rawIntent);
      var createdAt = Number(value.createdAt || intent.createdAt || 0);

      if (!value || !intent || !isKnownSection(value.section)) {
        return null;
      }

      if (Date.now() - createdAt > 15000) {
        return null;
      }

      if (intent.path && intent.path !== window.location.pathname) {
        return null;
      }

      return {
        section: value.section,
        offset: Math.max(0, Number(value.offset) || 0),
        atBottom: Boolean(value.atBottom),
      };
    } catch (error) {
      return null;
    }
  }

  function setActive(id) {
    navLinks.forEach(function (link) {
      link.removeAttribute('aria-current');
    });

    var current = linkMap.get(id);
    if (current) {
      current.setAttribute('aria-current', 'location');
    }

    safeStoreSection(id);
  }

  function jumpTo(top) {
    var root = document.documentElement;
    var previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, Math.max(0, top));
    root.style.scrollBehavior = previousBehavior;
  }

  function getMaxScroll() {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }

  function waitForNextFrame() {
    return new Promise(function (resolve) {
      window.requestAnimationFrame(function () {
        resolve();
      });
    });
  }

  function waitForFontsReady() {
    if (!document.fonts || !document.fonts.ready || typeof document.fonts.ready.then !== 'function') {
      return Promise.resolve();
    }

    return document.fonts.ready.catch(function () {
      /* no-op */
    });
  }

  function waitForWindowFlag(eventName, flagName) {
    return new Promise(function (resolve) {
      if (window[flagName]) {
        resolve();
        return;
      }

      function handleReady() {
        window.removeEventListener(eventName, handleReady);
        resolve();
      }

      window.addEventListener(eventName, handleReady);
    });
  }

  function waitForPageRestoreReadiness() {
    return Promise.all([
      waitForWindowFlag(HEADER_READY_EVENT, '__portfolioHeaderReady'),
      waitForWindowFlag(CONTENT_READY_EVENT, '__portfolioContentReady'),
    ])
      .then(waitForFontsReady)
      .then(waitForNextFrame)
      .then(waitForNextFrame);
  }

  function getAbsoluteTop(element) {
    return element.getBoundingClientRect().top + window.scrollY;
  }

  function getMaxOffsetInsideSection(target) {
    var maxOffsetInsideSection = Math.max(0, target.offsetHeight - 1);

    if (target.id !== 'projects') {
      return maxOffsetInsideSection;
    }

    var toggleRow = target.querySelector('.projects-toggle-row');
    if (!toggleRow || toggleRow.hidden) {
      return maxOffsetInsideSection;
    }

    var toggleRowOffset = Math.max(0, Math.round(getAbsoluteTop(toggleRow) - target.offsetTop));
    return Math.min(maxOffsetInsideSection, toggleRowOffset);
  }

  function shouldSmoothScroll(link) {
    if (!link) {
      return false;
    }

    if (link.hasAttribute('data-nav-link')) {
      return true;
    }

    return typeof link.matches === 'function' && link.matches(TARGETED_SMOOTH_SCROLL_SELECTOR);
  }

  function scrollToSection(target, updateHash, behavior) {
    if (!target) {
      return;
    }

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var top = target.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
    var scrollBehavior = behavior || 'auto';

    if (scrollBehavior === 'auto') {
      jumpTo(top);
    } else {
      window.scrollTo({
        top: Math.max(0, top),
        behavior: scrollBehavior,
      });
    }

    if (updateHash) {
      var newHash = '#' + target.id;
      if (window.location.hash !== newHash) {
        history.pushState(null, '', newHash);
      }
    }

    setActive(target.id);
  }

  function restoreStoredScrollTarget(storedTarget) {
    var target = document.getElementById(storedTarget.section);
    if (!target) {
      return;
    }

    function applyRestore() {
      if (storedTarget.atBottom) {
        jumpTo(getMaxScroll());
      } else {
        var maxOffsetInsideSection = getMaxOffsetInsideSection(target);
        var offset = Math.min(storedTarget.offset, maxOffsetInsideSection);
        var top = target.offsetTop - getHeaderOffset() + offset;
        jumpTo(Math.min(top, getMaxScroll()));
      }

      setActive(target.id);
      updateActiveFromScroll();
    }

    window.requestAnimationFrame(function () {
      applyRestore();
      window.requestAnimationFrame(applyRestore);
    });
  }

  function updateActiveFromScroll() {
    var marker = window.scrollY + getHeaderOffset() + 12;
    var currentSection = sections[0];

    sections.forEach(function (section) {
      if (section.offsetTop <= marker) {
        currentSection = section;
      }
    });

    if (currentSection) {
      setActive(currentSection.id);
    }
  }

  allHashLinks.forEach(function (link) {
    link.addEventListener('click', function (event) {
      var targetSelector = link.getAttribute('href');
      var target = targetSelector ? document.querySelector(targetSelector) : null;
      if (!target) {
        return;
      }

      event.preventDefault();
      var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var behavior = shouldSmoothScroll(link) && !prefersReducedMotion ? 'smooth' : 'auto';
      scrollToSection(target, true, behavior);
    });
  });

  var hashId = window.location.hash ? window.location.hash.slice(1) : '';
  var initialTarget = hashId && isKnownSection(hashId) ? document.getElementById(hashId) : null;
  var storedScrollTarget = safeTakeStoredScrollTarget();
  if (initialTarget) {
    storedScrollTarget = null;
  }

  if (storedScrollTarget) {
    waitForPageRestoreReadiness().then(function () {
      restoreStoredScrollTarget(storedScrollTarget);
    });
  } else if (initialTarget) {
    waitForPageRestoreReadiness().then(function () {
      var target = initialTarget;
      window.requestAnimationFrame(function () {
        scrollToSection(target, false, 'auto');
      });
    });
  }

  updateActiveFromScroll();
  window.addEventListener('scroll', updateActiveFromScroll, { passive: true });
  window.addEventListener('resize', updateActiveFromScroll);
  window.addEventListener('load', updateActiveFromScroll);
});
