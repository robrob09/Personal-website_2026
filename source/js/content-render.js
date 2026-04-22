(function () {
  var CONTENT_READY_EVENT = 'portfolio:content-ready';

  function appendTextElement(parent, tagName, text, className) {
    var element = document.createElement(tagName);
    if (className) {
      element.className = className;
    }
    element.textContent = text;
    parent.appendChild(element);
    return element;
  }

  function renderAbout(container, about, runtime) {
    runtime.clearNode(container);

    if (!about || !about.paragraphs) {
      return;
    }

    (about.paragraphs || []).forEach(function (paragraph) {
      appendTextElement(container, 'p', paragraph, 'about-text');
    });
  }

  function createEducationCard(item) {
    var article = document.createElement('article');
    article.className = 'card education-card';

    appendTextElement(article, 'p', item.years, 'card-meta');
    appendTextElement(article, 'h3', item.title);
    appendTextElement(article, 'p', item.subtitle, 'card-subtitle');
    appendTextElement(article, 'p', item.text);

    return article;
  }

  function getEducationGroups(items, ui) {
    return [
      {
        key: 'formal',
        label: ui.educationFormalTab || 'Education',
        items: items.filter(function (item) {
          return item.category !== 'additional';
        }),
      },
      {
        key: 'additional',
        label: ui.educationAdditionalTab || 'Additional training',
        items: items.filter(function (item) {
          return item.category === 'additional';
        }),
      },
    ].filter(function (group) {
      return group.items.length > 0;
    });
  }

  function renderEducation(container, items, ui, runtime) {
    runtime.clearNode(container);
    container.classList.remove('education-switcher');

    if (!items.length) {
      return;
    }

    var groups = getEducationGroups(items, ui || {});

    if (groups.length < 2) {
      groups[0].items.forEach(function (item) {
        container.appendChild(createEducationCard(item));
      });
      return;
    }

    container.classList.add('education-switcher');

    var tabList = document.createElement('div');
    tabList.className = 'education-tabs';
    tabList.setAttribute('role', 'tablist');

    var panel = document.createElement('div');
    panel.className = 'education-panel';
    panel.id = 'education-panel-' + (document.body.getAttribute('data-track') || 'portfolio');
    panel.setAttribute('role', 'tabpanel');

    var buttons = groups.map(function (group, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'education-tab';
      button.id = 'education-tab-' + group.key;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', panel.id);
      button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      button.tabIndex = index === 0 ? 0 : -1;
      button.textContent = group.label;

      button.addEventListener('click', function () {
        selectGroup(index, true);
      });

      button.addEventListener('keydown', function (event) {
        var nextIndex = index;

        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
          nextIndex = (index + 1) % groups.length;
        } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
          nextIndex = (index - 1 + groups.length) % groups.length;
        } else if (event.key === 'Home') {
          nextIndex = 0;
        } else if (event.key === 'End') {
          nextIndex = groups.length - 1;
        } else {
          return;
        }

        event.preventDefault();
        selectGroup(nextIndex, true);
      });

      tabList.appendChild(button);
      return button;
    });

    function selectGroup(index, focusTab) {
      var group = groups[index];

      buttons.forEach(function (button, buttonIndex) {
        var isSelected = buttonIndex === index;
        button.setAttribute('aria-selected', String(isSelected));
        button.tabIndex = isSelected ? 0 : -1;
      });

      if (focusTab) {
        buttons[index].focus();
      }

      runtime.clearNode(panel);
      panel.setAttribute('aria-labelledby', buttons[index].id);
      group.items.forEach(function (item) {
        panel.appendChild(createEducationCard(item));
      });
    }

    container.appendChild(tabList);
    container.appendChild(panel);
    selectGroup(0, false);
  }

  function createAchievementCard(item) {
    var article = document.createElement('article');
    article.className = 'card achievement-item';

    appendTextElement(article, 'h3', item.title);
    appendTextElement(article, 'p', item.text);

    return article;
  }

  function getAchievementGroups(items, ui) {
    return [
      {
        key: 'olympiads',
        label: ui.achievementsOlympiadsTab || 'Olympiads',
        items: items.filter(function (item) {
          return item.category !== 'competition';
        }),
      },
      {
        key: 'competitions',
        label: ui.achievementsCompetitionsTab || 'Competitions',
        items: items.filter(function (item) {
          return item.category === 'competition';
        }),
      },
    ].filter(function (group) {
      return group.items.length > 0;
    });
  }

  function renderAchievements(container, items, ui, runtime) {
    runtime.clearNode(container);
    container.classList.remove('achievement-switcher', 'education-switcher');

    if (!items.length) {
      return;
    }

    var groups = getAchievementGroups(items, ui || {});

    if (groups.length < 2) {
      groups[0].items.forEach(function (item) {
        container.appendChild(createAchievementCard(item));
      });
      return;
    }

    container.classList.add('achievement-switcher', 'education-switcher');

    var tabList = document.createElement('div');
    tabList.className = 'education-tabs achievement-tabs';
    tabList.setAttribute('role', 'tablist');

    var panel = document.createElement('div');
    panel.className = 'education-panel achievement-panel';
    panel.id = 'achievements-panel-' + (document.body.getAttribute('data-track') || 'portfolio');
    panel.setAttribute('role', 'tabpanel');

    var buttons = groups.map(function (group, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'education-tab achievement-tab';
      button.id = 'achievements-tab-' + group.key;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', panel.id);
      button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      button.tabIndex = index === 0 ? 0 : -1;
      button.textContent = group.label;

      button.addEventListener('click', function () {
        selectGroup(index, true);
      });

      button.addEventListener('keydown', function (event) {
        var nextIndex = index;

        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
          nextIndex = (index + 1) % groups.length;
        } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
          nextIndex = (index - 1 + groups.length) % groups.length;
        } else if (event.key === 'Home') {
          nextIndex = 0;
        } else if (event.key === 'End') {
          nextIndex = groups.length - 1;
        } else {
          return;
        }

        event.preventDefault();
        selectGroup(nextIndex, true);
      });

      tabList.appendChild(button);
      return button;
    });

    function selectGroup(index, focusTab) {
      var group = groups[index];

      buttons.forEach(function (button, buttonIndex) {
        var isSelected = buttonIndex === index;
        button.setAttribute('aria-selected', String(isSelected));
        button.tabIndex = isSelected ? 0 : -1;
      });

      if (focusTab) {
        buttons[index].focus();
      }

      runtime.clearNode(panel);
      panel.setAttribute('aria-labelledby', buttons[index].id);
      group.items.forEach(function (item) {
        panel.appendChild(createAchievementCard(item));
      });
    }

    container.appendChild(tabList);
    container.appendChild(panel);
    selectGroup(0, false);
  }

  function appendTagList(container, items, className) {
    if (!items || !items.length) {
      return null;
    }

    var tagList = document.createElement('ul');
    tagList.className = className || 'tag-list';

    items.forEach(function (item) {
      appendTextElement(tagList, 'li', item);
    });

    container.appendChild(tagList);
    return tagList;
  }

  function setProjectAccent(node, index) {
    var palettes = [
      ['#7ba39a', '#456975'],
      ['#8b9ab8', '#5b6f95'],
      ['#98b49c', '#617e69'],
      ['#a6b4c8', '#6d7f9b'],
    ];
    var pair = palettes[index % palettes.length];
    node.style.setProperty('--project-preview-from', pair[0]);
    node.style.setProperty('--project-preview-to', pair[1]);
  }

  function createProjectAction(actionMeta, className, runtime) {
    if (!actionMeta || !runtime.isUsableHref(actionMeta.href) || !actionMeta.icon) {
      return null;
    }

    var link = document.createElement('a');
    link.className = className;
    link.href = actionMeta.href;
    if (actionMeta.ariaLabel) {
      link.setAttribute('aria-label', actionMeta.ariaLabel);
    }
    runtime.decorateLink(link, actionMeta.href);

    var icon = document.createElement('img');
    runtime.bindThemedAsset(icon, 'src', actionMeta.icon, actionMeta.iconDark);
    icon.alt = '';
    link.appendChild(icon);
    return link;
  }

  function createProjectOverlayLink(linkMeta, className, runtime) {
    if (!linkMeta || !runtime.isUsableHref(linkMeta.href)) {
      return null;
    }

    var link = document.createElement('a');
    link.className = className;
    link.href = linkMeta.href;
    if (linkMeta.ariaLabel) {
      link.setAttribute('aria-label', linkMeta.ariaLabel);
    }
    runtime.decorateLink(link, linkMeta.href);
    return link;
  }

  function appendActionSet(container, actions, wrapClassName, actionClassName, runtime) {
    var entries = actions ? [actions.github, actions.external] : [];
    var usableEntries = entries.filter(function (item) {
      return item && runtime.isUsableHref(item.href) && item.icon;
    });

    if (!usableEntries.length) {
      return null;
    }

    var wrap = document.createElement('div');
    wrap.className = wrapClassName;

    usableEntries.forEach(function (entry) {
      var link = createProjectAction(entry, actionClassName, runtime);
      if (link) {
        wrap.appendChild(link);
      }
    });

    if (!wrap.children.length) {
      return null;
    }

    container.appendChild(wrap);
    return wrap;
  }

  function appendFeaturedActions(container, actions, runtime) {
    return appendActionSet(
      container,
      actions,
      'featured-project-actions',
      'featured-project-action',
      runtime
    );
  }

  function appendArchiveActions(container, actions, runtime) {
    return appendActionSet(
      container,
      actions,
      'project-card-links',
      'project-card-action',
      runtime
    );
  }

  function createFeaturedProject(item, index, ui, runtime) {
    var article = document.createElement('article');
    article.className = 'featured-project';
    if (index % 2 === 1) {
      article.classList.add('is-reversed');
    }

    var mediaHref = item.previewLink && item.previewLink.href;
    var media = document.createElement(runtime.isUsableHref(mediaHref) ? 'a' : 'div');
    media.className = 'featured-project-preview';
    setProjectAccent(media, index);

    if (media.tagName === 'A') {
      media.href = mediaHref;
      if (item.previewLink && item.previewLink.ariaLabel) {
        media.setAttribute('aria-label', item.previewLink.ariaLabel);
      }
      runtime.decorateLink(media, mediaHref);
    }

    if (item.previewImage) {
      var previewImage = document.createElement('img');
      previewImage.className = 'featured-project-preview-copy';
      runtime.bindThemedAsset(
        previewImage,
        'src',
        item.previewImage,
        item.previewImageDark
      );
      previewImage.alt = item.previewAlt || '';
      media.appendChild(previewImage);
    }

    appendTextElement(media, 'p', item.title, 'featured-project-preview-title');

    var mediaWrap = document.createElement('div');
    mediaWrap.className = 'featured-project-media';
    mediaWrap.appendChild(media);
    article.appendChild(mediaWrap);

    var content = document.createElement('div');
    content.className = 'featured-project-content';

    var header = document.createElement('div');
    header.className = 'featured-project-header';
    appendTextElement(header, 'p', ui.projectFeaturedLabel, 'featured-project-label');
    appendFeaturedActions(header, item.actions, runtime);
    content.appendChild(header);

    var titleHeading = document.createElement('h3');
    titleHeading.className = 'featured-project-title';
    var contentLink = createProjectOverlayLink(item.contentLink, 'featured-project-content-link', runtime);
    var titleLink = !contentLink
      ? runtime.createExternalAwareLink(item.titleLink && item.titleLink.href, item.title)
      : null;
    if (contentLink) {
      var titleText = document.createElement('span');
      titleText.className = 'featured-project-title-link';
      titleText.textContent = item.title;
      titleHeading.appendChild(titleText);
    } else if (titleLink) {
      titleLink.className = 'featured-project-title-link';
      if (item.titleLink && item.titleLink.ariaLabel) {
        titleLink.setAttribute('aria-label', item.titleLink.ariaLabel);
      }
      titleHeading.appendChild(titleLink);
    } else {
      titleHeading.textContent = item.title;
    }
    content.appendChild(titleHeading);

    appendTextElement(content, 'div', item.summary, 'featured-project-summary card');
    appendTagList(content, item.stack || [], 'tag-list featured-project-tags');
    if (contentLink) {
      content.appendChild(contentLink);
    }

    article.appendChild(content);
    return article;
  }

  function createCompactProjectCard(item, runtime) {
    var article = document.createElement('article');
    article.className = 'card project-card project-card-compact';
    var cardLink = createProjectOverlayLink(item.cardLink, 'project-card-link-overlay', runtime);

    var header = document.createElement('div');
    header.className = 'project-card-top';

    var folderLink = createProjectOverlayLink(item.folderLink, 'project-card-folder-link', runtime);
    var folder = document.createElement('span');
    folder.className = 'project-card-folder';
    folder.setAttribute('aria-hidden', 'true');
    if (folderLink) {
      folderLink.appendChild(folder);
      header.appendChild(folderLink);
    } else {
      header.appendChild(folder);
    }

    appendArchiveActions(header, item.actions, runtime);
    article.appendChild(header);

    appendTextElement(article, 'h3', item.title, 'project-card-title');
    appendTextElement(article, 'p', item.summary, 'project-summary');
    appendTagList(article, item.stack || [], 'tag-list project-card-tags');
    if (cardLink) {
      article.appendChild(cardLink);
    }

    return article;
  }

  function createArchiveShell(item, ui, runtime) {
    var shell = document.createElement('div');
    shell.className = 'project-card-shell';
    shell.hidden = true;
    shell.setAttribute('aria-hidden', 'true');

    var inner = document.createElement('div');
    inner.className = 'project-card-shell-inner';
    inner.appendChild(createCompactProjectCard(item, runtime));
    shell.appendChild(inner);
    return shell;
  }

  function renderProjects(container, projects, ui, runtime) {
    runtime.clearNode(container);

    if (!projects) {
      return;
    }

    var featuredItems = projects.featured || [];
    var archiveItems = projects.archive || [];

    if (featuredItems.length) {
      var featuredList = document.createElement('div');
      featuredList.className = 'featured-project-list';
      featuredItems.forEach(function (item, index) {
        featuredList.appendChild(createFeaturedProject(item, index, ui, runtime));
      });
      container.appendChild(featuredList);
    }

    if (!archiveItems.length) {
      return;
    }

    var archiveSection = document.createElement('div');
    archiveSection.className = 'archive-projects';

    var archiveGrid = document.createElement('div');
    archiveGrid.className = 'project-card-grid';
    archiveSection.appendChild(archiveGrid);

    var shells = archiveItems.map(function (item) {
      var shell = createArchiveShell(item, ui, runtime);
      archiveGrid.appendChild(shell);
      return shell;
    });

    var isArchiveExpanded = false;
    var archiveTransitionDuration = 240;
    var archiveGridId =
      'project-archive-' +
      (document.body.getAttribute('data-track') || 'portfolio') +
      '-' +
      (document.body.getAttribute('data-page-language') || 'en');
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var scrollCompensationFrame = null;
    var toggleRow = document.createElement('div');
    var toggleButton = document.createElement('button');

    archiveGrid.id = archiveGridId;
    toggleRow.className = 'projects-toggle-row';
    toggleRow.setAttribute('aria-hidden', 'false');

    toggleButton.type = 'button';
    toggleButton.className = 'button button-ghost projects-toggle';
    toggleButton.textContent = ui.projectShowMore;
    toggleButton.setAttribute('aria-controls', archiveGridId);
    toggleButton.setAttribute('aria-expanded', 'false');

    toggleRow.appendChild(toggleButton);

    function clearShellStateTimers(shell) {
      if (!shell) {
        return;
      }

      if (shell.__toggleTimer) {
        window.clearTimeout(shell.__toggleTimer);
        shell.__toggleTimer = null;
      }

      if (shell.__hideTimer) {
        window.clearTimeout(shell.__hideTimer);
        shell.__hideTimer = null;
      }

      if (shell.__revealFrame) {
        window.cancelAnimationFrame(shell.__revealFrame);
        shell.__revealFrame = null;
      }
    }

    function getScrollTop() {
      return window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    }

    function setScrollTop(nextScrollTop) {
      window.scrollTo(0, Math.max(0, nextScrollTop));
    }

    function clearScrollCompensation() {
      if (scrollCompensationFrame) {
        window.cancelAnimationFrame(scrollCompensationFrame);
        scrollCompensationFrame = null;
      }
    }

    function keepToggleRowPosition(targetTop) {
      if (toggleRow.hidden) {
        return;
      }

      var currentTop = toggleRow.getBoundingClientRect().top;
      var delta = currentTop - targetTop;

      if (Math.abs(delta) < 0.5) {
        return;
      }

      setScrollTop(getScrollTop() + delta);
    }

    function compensateToggleRowScroll(targetTop) {
      clearScrollCompensation();

      if (prefersReducedMotion) {
        keepToggleRowPosition(targetTop);
        return;
      }

      var animationStart = null;

      function step(timestamp) {
        if (animationStart === null) {
          animationStart = timestamp;
        }

        keepToggleRowPosition(targetTop);

        if (timestamp - animationStart < archiveTransitionDuration) {
          scrollCompensationFrame = window.requestAnimationFrame(step);
          return;
        }

        scrollCompensationFrame = null;
        keepToggleRowPosition(targetTop);
      }

      scrollCompensationFrame = window.requestAnimationFrame(step);
    }

    function setShellVisibility(shell, isVisible) {
      if (!shell) {
        return;
      }

      clearShellStateTimers(shell);

      function reveal() {
        shell.hidden = false;
        shell.setAttribute('aria-hidden', 'false');

        if (prefersReducedMotion) {
          shell.classList.add('is-visible');
          return;
        }

        shell.classList.remove('is-visible');
        shell.__revealFrame = window.requestAnimationFrame(function () {
          shell.__revealFrame = null;

          if (shell.hidden) {
            return;
          }

          shell.classList.add('is-visible');
        });
      }

      function conceal() {
        shell.classList.remove('is-visible');
        shell.setAttribute('aria-hidden', 'true');

        if (prefersReducedMotion) {
          shell.hidden = true;
          return;
        }

        shell.__hideTimer = window.setTimeout(function () {
          shell.__hideTimer = null;
          shell.hidden = true;
        }, archiveTransitionDuration);
      }

      if (isVisible) {
        reveal();
        return;
      }

      conceal();
    }

    function syncToggleButton() {
      var hasArchiveItems = shells.length > 0;

      toggleRow.toggleAttribute('hidden', !hasArchiveItems);
      toggleRow.setAttribute('aria-hidden', String(!hasArchiveItems));
      toggleButton.textContent = isArchiveExpanded ? ui.projectShowLess : ui.projectShowMore;
      toggleButton.setAttribute('aria-expanded', String(isArchiveExpanded));
    }

    function applyArchiveState(isExpanded, shouldCompensateScroll) {
      var toggleTopBeforeUpdate = toggleRow.getBoundingClientRect().top;

      clearScrollCompensation();
      isArchiveExpanded = Boolean(isExpanded) && shells.length > 0;
      shells.forEach(function (shell) {
        setShellVisibility(shell, isArchiveExpanded);
      });
      syncToggleButton();

      if (shouldCompensateScroll !== false) {
        compensateToggleRowScroll(toggleTopBeforeUpdate);
      }
    }

    toggleButton.addEventListener('click', function () {
      applyArchiveState(!isArchiveExpanded, true);
    });

    applyArchiveState(false, false);
    archiveSection.appendChild(toggleRow);
    container.appendChild(archiveSection);
  }

  function renderSkills(container, items, runtime) {
    runtime.clearNode(container);

    items.forEach(function (group) {
      var article = document.createElement('article');
      article.className = 'card skill-card';
      appendTextElement(article, 'h3', group.title);

      var tagList = document.createElement('ul');
      tagList.className = 'tag-list';
      group.items.forEach(function (item) {
        appendTextElement(tagList, 'li', item);
      });

      article.appendChild(tagList);
      container.appendChild(article);
    });
  }

  function renderContacts(container, items, runtime) {
    runtime.clearNode(container);

    items.forEach(function (item) {
      var listItem = document.createElement('li');
      var labelWrap = document.createElement('span');
      labelWrap.className = 'contact-label-wrap';

      var icon = document.createElement('img');
      icon.className = 'contact-inline-icon';
      runtime.bindThemedAsset(icon, 'src', item.icon, item.iconDark);
      icon.alt = '';
      labelWrap.appendChild(icon);
      appendTextElement(labelWrap, 'span', item.label);

      var link = runtime.createExternalAwareLink(item.href, item.value);
      if (!link) {
        return;
      }

      listItem.appendChild(labelWrap);
      listItem.appendChild(link);
      container.appendChild(listItem);
    });
  }

  function appendCareerCard(container, item) {
    var article = document.createElement('article');
    article.className = 'card career-card';

    if (item.meta) {
      appendTextElement(article, 'p', item.meta, 'card-meta');
    }

    appendTextElement(article, 'h3', item.title);
    appendTextElement(article, 'p', item.text);
    container.appendChild(article);
  }

  function renderCareerPath(container, careerPath, runtime) {
    runtime.clearNode(container);

    if (!careerPath) {
      return;
    }

    var body = document.createElement('div');
    body.className = 'career-path-body';

    if (careerPath.intro || (careerPath.pillars && careerPath.pillars.length)) {
      var overview = document.createElement('div');
      overview.className = 'career-overview';

      if (careerPath.intro) {
        appendTextElement(overview, 'p', careerPath.intro, 'section-intro');
      }

      if (careerPath.pillars && careerPath.pillars.length) {
        var pillarGrid = document.createElement('div');
        pillarGrid.className = 'career-pillar-grid';
        careerPath.pillars.forEach(function (item) {
          appendCareerCard(pillarGrid, item);
        });
        overview.appendChild(pillarGrid);
      }

      body.appendChild(overview);
    }

    if (careerPath.timeline && careerPath.timeline.length) {
      var timelineSection = document.createElement('section');
      timelineSection.className = 'career-section';
      appendTextElement(timelineSection, 'h2', careerPath.timelineTitle, 'section-title');

      var timelineList = document.createElement('div');
      timelineList.className = 'career-timeline-list';
      careerPath.timeline.forEach(function (item) {
        var milestone = document.createElement('article');
        milestone.className = 'card career-milestone';
        appendTextElement(milestone, 'p', item.date, 'career-milestone-date');

        var content = document.createElement('div');
        content.className = 'career-milestone-content';
        appendTextElement(content, 'h3', item.title);
        appendTextElement(content, 'p', item.text);
        milestone.appendChild(content);
        timelineList.appendChild(milestone);
      });

      timelineSection.appendChild(timelineList);
      body.appendChild(timelineSection);
    }

    if (careerPath.highlights && careerPath.highlights.length) {
      var highlightsSection = document.createElement('section');
      highlightsSection.className = 'career-section';
      appendTextElement(highlightsSection, 'h2', careerPath.highlightsTitle, 'section-title');

      var highlightGrid = document.createElement('div');
      highlightGrid.className = 'career-highlight-grid';
      careerPath.highlights.forEach(function (item) {
        appendCareerCard(highlightGrid, item);
      });

      highlightsSection.appendChild(highlightGrid);
      body.appendChild(highlightsSection);
    }

    if (careerPath.focus && careerPath.focus.length) {
      var focusSection = document.createElement('section');
      focusSection.className = 'career-section';
      appendTextElement(focusSection, 'h2', careerPath.focusTitle, 'section-title');

      var focusGrid = document.createElement('div');
      focusGrid.className = 'career-focus-grid';
      careerPath.focus.forEach(function (item) {
        appendCareerCard(focusGrid, item);
      });

      focusSection.appendChild(focusGrid);
      body.appendChild(focusSection);
    }

    container.appendChild(body);
  }

  function renderSocialIcons(container, items, runtime) {
    runtime.clearNode(container);

    items.forEach(function (item) {
      if (!runtime.isUsableHref(item.href)) {
        return;
      }

      var link = document.createElement('a');
      link.className = 'social-link';
      link.href = item.href;
      link.setAttribute('aria-label', item.label);
      runtime.decorateLink(link, item.href);

      var icon = document.createElement('img');
      runtime.bindThemedAsset(icon, 'src', item.icon, item.iconDark);
      icon.alt = '';

      link.appendChild(icon);
      container.appendChild(link);
    });
  }

  function renderAttribution(container, attribution, runtime) {
    runtime.clearNode(container);

    if (!attribution || !attribution.prefix) {
      return;
    }

    container.appendChild(document.createTextNode(attribution.prefix));

    var link = runtime.createExternalAwareLink(
      attribution.href,
      attribution.linkText || attribution.href
    );
    if (link) {
      container.appendChild(link);
    }

    if (attribution.suffix) {
      container.appendChild(document.createTextNode(attribution.suffix));
    }
  }

  function dispatchContentReady() {
    window.__portfolioContentReady = true;
    window.dispatchEvent(new window.CustomEvent(CONTENT_READY_EVENT));
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

        var about = document.querySelector('[data-about]');
        var education = document.querySelector('[data-list="education"]');
        var achievements = document.querySelector('[data-list="achievements"]');
        var projects = document.querySelector('[data-list="projects"]');
        var skills = document.querySelector('[data-list="skills"]');
        var contacts = document.querySelector('[data-list="contacts"]');
        var careerPath = document.querySelector('[data-career-path]');
        var socials = document.querySelector('[data-social-icons]');
        var attribution = document.querySelector('[data-attribution]');

        if (about) {
          renderAbout(about, context.page.about, runtime);
        }
        if (education) {
          renderEducation(education, context.page.education || [], context.ui, runtime);
        }
        if (achievements) {
          renderAchievements(achievements, context.page.achievements || [], context.ui, runtime);
        }
        if (projects) {
          renderProjects(projects, context.page.projects || {}, context.ui, runtime);
        }
        if (skills) {
          renderSkills(skills, (context.page.skills && context.page.skills.groups) || [], runtime);
        }
        if (contacts) {
          renderContacts(contacts, context.page.contacts || [], runtime);
        }
        if (careerPath) {
          renderCareerPath(careerPath, context.page.careerPath, runtime);
        }
        if (socials) {
          renderSocialIcons(socials, context.page.socialIcons || [], runtime);
        }
        if (attribution) {
          renderAttribution(attribution, context.page.inspiredBy, runtime);
        }

        dispatchContentReady();
      })
      .catch(function () {
        /* no-op */
      });
  });
})();
