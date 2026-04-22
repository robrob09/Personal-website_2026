(function () {
  var dataCache = Object.create(null);

  function getPageContext() {
    var body = document.body;
    return {
      lang: body && body.getAttribute('data-page-language'),
      track: body && body.getAttribute('data-track'),
      pageKind: body && body.getAttribute('data-page-kind'),
    };
  }

  function getDataPath(track, lang) {
    var base = lang === 'ru' ? '../source/data/' : 'source/data/';
    return base + track + '-' + lang + '.json';
  }

  function getByPath(source, path) {
    if (!path) {
      return source;
    }

    return String(path)
      .split('.')
      .reduce(function (value, key) {
        if (value == null) {
          return undefined;
        }

        return value[key];
      }, source);
  }

  function isUsableHref(href) {
    return typeof href === 'string' && href.trim() !== '' && href.trim() !== '#';
  }

  function decorateLink(link, href) {
    if (!link || !isUsableHref(href)) {
      return;
    }

    if (/^https?:/i.test(href)) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    } else {
      link.removeAttribute('target');
      link.removeAttribute('rel');
    }
  }

  function getCurrentTheme() {
    if (window.PortfolioTheme && typeof window.PortfolioTheme.getCurrentTheme === 'function') {
      return window.PortfolioTheme.getCurrentTheme();
    }

    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function resolveThemeAsset(lightValue, darkValue) {
    return getCurrentTheme() === 'dark' && darkValue ? darkValue : lightValue;
  }

  function bindThemedAsset(node, attributeName, lightValue, darkValue) {
    if (!node || !attributeName || !lightValue) {
      return;
    }

    var sync = function () {
      node.setAttribute(attributeName, resolveThemeAsset(lightValue, darkValue));
    };

    sync();

    if (!darkValue) {
      return;
    }

    node.__portfolioThemeBindings = node.__portfolioThemeBindings || {};
    var existing = node.__portfolioThemeBindings[attributeName];
    if (existing) {
      window.removeEventListener('portfolio-theme-change', existing);
    }

    node.__portfolioThemeBindings[attributeName] = sync;
    window.addEventListener('portfolio-theme-change', sync);
  }

  function bindFieldSet(root, selector, assignValue, source) {
    root.querySelectorAll(selector).forEach(function (node) {
      var path = node.getAttribute(selector.slice(1, -1));
      var value = getByPath(source, path);

      if (value == null) {
        return;
      }

      assignValue(node, value);
    });
  }

  function bindPageFields(root, page) {
    if (!root || !page) {
      return;
    }

    bindFieldSet(
      root,
      '[data-bind]',
      function (node, value) {
        node.textContent = value;
      },
      page
    );

    bindFieldSet(
      root,
      '[data-bind-href]',
      function (node, value) {
        node.setAttribute('href', value);
        if (node.tagName === 'A') {
          decorateLink(node, value);
        }
      },
      page
    );

    bindFieldSet(
      root,
      '[data-bind-src]',
      function (node, value) {
        var darkPath = node.getAttribute('data-bind-src-dark');
        var darkValue = getByPath(page, darkPath);
        bindThemedAsset(node, 'src', value, darkValue);
      },
      page
    );

    bindFieldSet(
      root,
      '[data-bind-alt]',
      function (node, value) {
        node.setAttribute('alt', value);
      },
      page
    );

    bindFieldSet(
      root,
      '[data-bind-aria]',
      function (node, value) {
        node.setAttribute('aria-label', value);
      },
      page
    );
  }

  function bindUiFields(root, ui) {
    if (!root || !ui) {
      return;
    }

    bindFieldSet(
      root,
      '[data-ui]',
      function (node, value) {
        node.textContent = value;
      },
      ui
    );

    bindFieldSet(
      root,
      '[data-ui-aria]',
      function (node, value) {
        node.setAttribute('aria-label', value);
      },
      ui
    );
  }

  function clearNode(node) {
    while (node && node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function createExternalAwareLink(href, text) {
    if (!isUsableHref(href)) {
      return null;
    }

    var link = document.createElement('a');
    link.href = href;
    link.textContent = text;
    decorateLink(link, href);
    return link;
  }

  function applyMeta(meta) {
    if (!meta) {
      return;
    }

    if (meta.title) {
      document.title = meta.title;
    }

    if (meta.description) {
      var description = document.querySelector('meta[name="description"]');
      if (description) {
        description.setAttribute('content', meta.description);
      }
    }

    if (meta.favicon && meta.favicon.light) {
      var favicon = document.querySelector('link[rel="icon"]');

      if (!favicon) {
        favicon = document.createElement('link');
        favicon.setAttribute('rel', 'icon');
        document.head.appendChild(favicon);
      }

      if (meta.favicon.type) {
        favicon.setAttribute('type', meta.favicon.type);
      }

      bindThemedAsset(favicon, 'href', meta.favicon.light, meta.favicon.dark);
    }
  }

  function validateSiteData(siteData, pageKind) {
    if (!siteData || typeof siteData !== 'object') {
      throw new Error('Portfolio data is missing or invalid.');
    }

    if (!siteData.meta || !siteData.meta[pageKind]) {
      throw new Error('Portfolio metadata for page "' + pageKind + '" is missing.');
    }

    if (!siteData.ui || !siteData.pages || !siteData.pages[pageKind]) {
      throw new Error('Portfolio page payload for "' + pageKind + '" is missing.');
    }
  }

  function fetchSiteData(track, lang) {
    var cacheKey = track + '-' + lang;
    if (!dataCache[cacheKey]) {
      var path = getDataPath(track, lang);
      dataCache[cacheKey] = fetch(path, { cache: 'no-store' }).then(function (response) {
        if (!response.ok) {
          throw new Error('Failed to load ' + path + ' (' + response.status + ').');
        }

        return response.json();
      });
    }

    return dataCache[cacheKey];
  }

  function loadPortfolioData() {
    var context = getPageContext();

    return fetchSiteData(context.track, context.lang)
      .then(function (siteData) {
        validateSiteData(siteData, context.pageKind);
        return {
          lang: context.lang,
          track: context.track,
          pageKind: context.pageKind,
          site: siteData,
          ui: siteData.ui,
          page: siteData.pages[context.pageKind],
          meta: siteData.meta[context.pageKind],
        };
      })
      .catch(function (error) {
        console.error('[portfolio] Failed to initialize page data.', error);
        throw error;
      });
  }

  window.PortfolioRuntime = {
    applyMeta: applyMeta,
    bindPageFields: bindPageFields,
    bindUiFields: bindUiFields,
    clearNode: clearNode,
    createExternalAwareLink: createExternalAwareLink,
    decorateLink: decorateLink,
    getByPath: getByPath,
    bindThemedAsset: bindThemedAsset,
    isUsableHref: isUsableHref,
    loadPortfolioData: loadPortfolioData,
    resolveThemeAsset: resolveThemeAsset,
  };
})();
