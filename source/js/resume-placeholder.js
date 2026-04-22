(function () {
  var RESUME_PAGE_WIDTH = 794;
  var RESUME_PAGE_HEIGHT = 1123;

  function appendTextElement(parent, tagName, text, className) {
    var element = document.createElement(tagName);
    if (className) {
      element.className = className;
    }
    element.textContent = text;
    parent.appendChild(element);
    return element;
  }

  function createLink(item, runtime) {
    var link = document.createElement('a');
    link.href = item.href;
    link.textContent = item.text;
    runtime.decorateLink(link, item.href);
    return link;
  }

  function updateResumeScale(container) {
    var width = container.getBoundingClientRect().width || container.clientWidth || RESUME_PAGE_WIDTH;
    var scale = Math.min(1, width / RESUME_PAGE_WIDTH);

    container.style.setProperty('--resume-scale', scale.toFixed(5));
    container.style.height = Math.ceil(RESUME_PAGE_HEIGHT * scale) + 'px';
  }

  function bindResumeScale(container) {
    updateResumeScale(container);

    if (container.dataset.resumeScaleBound === 'true') {
      return;
    }

    container.dataset.resumeScaleBound = 'true';

    if ('ResizeObserver' in window) {
      var observer = new ResizeObserver(function () {
        updateResumeScale(container);
      });
      observer.observe(container);
    } else {
      window.addEventListener('resize', function () {
        updateResumeScale(container);
      });
    }

    requestAnimationFrame(function () {
      updateResumeScale(container);
    });
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

  function appendList(parent, items, className) {
    var list = document.createElement('ul');
    list.className = className;

    items.forEach(function (item) {
      appendTextElement(list, 'li', item);
    });

    parent.appendChild(list);
    return list;
  }

  function renderSidebarSection(parent, section) {
    var block = document.createElement('section');
    block.className = 'resume-sidebar-section';

    appendTextElement(block, 'h3', section.title, 'resume-sidebar-title');

    if (section.heading) {
      appendTextElement(block, 'p', section.heading, 'resume-sidebar-heading');
    }

    if (section.bullets) {
      appendList(block, section.bullets, 'resume-sidebar-bullets');
    }

    if (section.entries) {
      var entries = document.createElement('div');
      entries.className = 'resume-sidebar-entries';

      section.entries.forEach(function (entry) {
        var item = document.createElement('div');
        item.className = 'resume-sidebar-entry';
        appendTextElement(item, 'p', entry.title, 'resume-sidebar-entry-title');
        appendTextElement(item, 'p', entry.org, 'resume-sidebar-entry-org');
        appendTextElement(item, 'p', entry.meta, 'resume-sidebar-entry-meta');
        entries.appendChild(item);
      });

      block.appendChild(entries);
    }

    if (section.pairs) {
      var pairs = document.createElement('dl');
      pairs.className = 'resume-sidebar-pairs';

      section.pairs.forEach(function (pair) {
        appendTextElement(pairs, 'dt', pair[0]);
        appendTextElement(pairs, 'dd', pair[1]);
      });

      block.appendChild(pairs);
    }

    if (section.lines) {
      var lines = document.createElement('div');
      lines.className = 'resume-sidebar-lines';
      section.lines.forEach(function (line) {
        appendTextElement(lines, 'p', line);
      });
      block.appendChild(lines);
    }

    if (section.text) {
      appendTextElement(block, 'p', section.text, 'resume-sidebar-text');
    }

    parent.appendChild(block);
  }

  function renderContactRows(parent, rows, runtime) {
    var wrap = document.createElement('div');
    wrap.className = 'resume-contact-rows';

    rows.forEach(function (row) {
      var line = document.createElement('p');
      line.className = 'resume-contact-row';

      row.forEach(function (item, index) {
        if (index > 0) {
          line.appendChild(document.createTextNode(' | '));
        }

        var label = document.createElement('span');
        label.className = 'resume-contact-label';
        label.textContent = item.label + ' ';
        line.appendChild(label);
        line.appendChild(createLink(item, runtime));
      });

      wrap.appendChild(line);
    });

    parent.appendChild(wrap);
  }

  function renderMainSection(parent, title, contentNode) {
    var section = document.createElement('section');
    section.className = 'resume-main-section';
    appendTextElement(section, 'h2', title, 'resume-main-title');
    section.appendChild(contentNode);
    parent.appendChild(section);
  }

  function renderProject(project) {
    var item = document.createElement('article');
    item.className = 'resume-project-entry';

    var top = document.createElement('div');
    top.className = 'resume-entry-top';
    appendTextElement(top, 'h3', project.title, 'resume-entry-title');
    appendTextElement(top, 'p', project.date, 'resume-entry-date');
    item.appendChild(top);

    appendTextElement(item, 'p', project.subtitle, 'resume-entry-subtitle');
    appendList(item, project.bullets || [], 'resume-main-bullets');

    return item;
  }

  function renderResume(container, documentData, runtime) {
    runtime.clearNode(container);

    if (!documentData) {
      return;
    }

    var shell = document.createElement('article');
    shell.className = 'resume-document';

    var sidebar = document.createElement('aside');
    sidebar.className = 'resume-document-sidebar';

    var sidebarInner = document.createElement('div');
    sidebarInner.className = 'resume-sidebar-inner';

    if (documentData.avatar) {
      var avatar = document.createElement('img');
      avatar.className = 'resume-document-avatar';
      runtime.bindThemedAsset(avatar, 'src', documentData.avatar, documentData.avatarDark);
      avatar.alt = '';
      sidebarInner.appendChild(avatar);
    }

    var name = document.createElement('h2');
    name.className = 'resume-document-name';
    (documentData.nameLines || []).forEach(function (line) {
      appendTextElement(name, 'span', line);
    });
    sidebarInner.appendChild(name);

    (documentData.sidebar || []).forEach(function (section) {
      renderSidebarSection(sidebarInner, section);
    });

    sidebar.appendChild(sidebarInner);
    shell.appendChild(sidebar);

    var main = document.createElement('div');
    main.className = 'resume-document-main';
    appendTextElement(main, 'p', documentData.role, 'resume-role');
    renderContactRows(main, documentData.contactRows || [], runtime);

    var summary = appendTextElement(document.createElement('div'), 'p', documentData.summary, 'resume-summary-text');
    renderMainSection(main, documentData.summaryTitle, summary.parentNode);

    var projects = document.createElement('div');
    projects.className = 'resume-project-list';
    (documentData.projects || []).forEach(function (project) {
      projects.appendChild(renderProject(project));
    });
    renderMainSection(main, documentData.projectsTitle, projects);

    var courses = document.createElement('div');
    courses.className = 'resume-course-list';
    (documentData.courses || []).forEach(function (course) {
      var item = document.createElement('div');
      item.className = 'resume-course-item';
      appendTextElement(item, 'h3', course[0], 'resume-course-title');
      appendTextElement(item, 'p', course[1], 'resume-course-meta');
      courses.appendChild(item);
    });
    renderMainSection(main, documentData.coursesTitle, courses);

    shell.appendChild(main);
    container.appendChild(shell);
    bindResumeScale(container);
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

        var resume = document.querySelector('[data-resume-document]');
        var socials = document.querySelector('[data-social-icons]');

        if (resume) {
          renderResume(resume, context.page.document, runtime);
        }

        if (socials) {
          renderSocialIcons(socials, context.page.socialIcons || [], runtime);
        }
      })
      .catch(function () {
        /* no-op */
      });
  });
})();
