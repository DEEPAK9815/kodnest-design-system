(function () {
  'use strict';

  var ROUTES = {
    '/': 'Home',
    '/dashboard': 'Dashboard',
    '/saved': 'Saved',
    '/digest': 'Digest',
    '/settings': 'Settings',
    '/proof': 'Proof'
  };

  var STORAGE_KEY = 'job-notification-tracker-saved';
  var filterState = {
    keyword: '',
    location: '',
    mode: '',
    experience: '',
    source: '',
    sort: 'latest'
  };

  var navLinks = document.querySelectorAll('.app-nav-links a');
  var main = document.getElementById('app-content');
  var toggle = document.getElementById('app-nav-toggle');
  var navLinksContainer = document.querySelector('.app-nav-links');

  function getJobs() {
    return window.JOBS_DATA || [];
  }

  function getSavedIds() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function setSavedIds(ids) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch (e) {}
  }

  function toggleSaved(jobId) {
    var ids = getSavedIds();
    var i = ids.indexOf(jobId);
    if (i === -1) ids.push(jobId);
    else ids.splice(i, 1);
    setSavedIds(ids);
  }

  function isSaved(jobId) {
    return getSavedIds().indexOf(jobId) !== -1;
  }

  function getPath() {
    return window.location.pathname.replace(/\/$/, '') || '/';
  }

  function postedLabel(days) {
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return days + ' days ago';
  }

  function escapeHtml(s) {
    if (!s) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function getLandingHTML() {
    return (
      '<div class="landing">' +
        '<h1 class="landing-headline">Stop Missing The Right Jobs.</h1>' +
        '<p class="landing-subtext">Precision-matched job discovery delivered daily at 9AM.</p>' +
        '<a href="/settings" class="btn btn-primary landing-cta">Start Tracking</a>' +
      '</div>'
    );
  }

  function getSettingsHTML() {
    return (
      '<div class="settings-page">' +
        '<h1>Settings</h1>' +
        '<form class="settings-form" action="#" method="get" novalidate>' +
          '<div class="form-group">' +
            '<label for="role-keywords">Role keywords</label>' +
            '<input type="text" id="role-keywords" class="input" name="role-keywords" placeholder="e.g. Frontend, React, Product Manager">' +
          '</div>' +
          '<div class="form-group">' +
            '<label for="locations">Preferred locations</label>' +
            '<input type="text" id="locations" class="input" name="locations" placeholder="e.g. New York, Remote">' +
          '</div>' +
          '<div class="form-group">' +
            '<label for="mode">Mode</label>' +
            '<select id="mode" class="input" name="mode">' +
              '<option value="">Select</option>' +
              '<option value="remote">Remote</option>' +
              '<option value="hybrid">Hybrid</option>' +
              '<option value="onsite">Onsite</option>' +
            '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label for="experience">Experience level</label>' +
            '<select id="experience" class="input" name="experience">' +
              '<option value="">Select</option>' +
              '<option value="entry">Entry</option>' +
              '<option value="mid">Mid</option>' +
              '<option value="senior">Senior</option>' +
              '<option value="lead">Lead</option>' +
            '</select>' +
          '</div>' +
        '</form>' +
      '</div>'
    );
  }

  function filterAndSortJobs(jobs, state) {
    var list = jobs.slice();
    var kw = (state.keyword || '').toLowerCase().trim();
    if (kw) {
      list = list.filter(function (j) {
        return (j.title && j.title.toLowerCase().indexOf(kw) !== -1) ||
               (j.company && j.company.toLowerCase().indexOf(kw) !== -1);
      });
    }
    if (state.location) {
      list = list.filter(function (j) { return (j.location || '').toLowerCase() === state.location.toLowerCase(); });
    }
    if (state.mode) {
      list = list.filter(function (j) { return (j.mode || '').toLowerCase() === state.mode.toLowerCase(); });
    }
    if (state.experience) {
      list = list.filter(function (j) { return (j.experience || '').toLowerCase() === state.experience.toLowerCase(); });
    }
    if (state.source) {
      list = list.filter(function (j) { return (j.source || '').toLowerCase() === state.source.toLowerCase(); });
    }
    if (state.sort === 'oldest') {
      list.sort(function (a, b) { return (b.postedDaysAgo || 0) - (a.postedDaysAgo || 0); });
    } else {
      list.sort(function (a, b) { return (a.postedDaysAgo || 0) - (b.postedDaysAgo || 0); });
    }
    return list;
  }

  function getUnique(arr) {
    var seen = {};
    return arr.filter(function (x) {
      var k = (x || '').toLowerCase();
      if (seen[k]) return false;
      seen[k] = true;
      return true;
    }).sort();
  }

  function buildFilterOptions(jobs) {
    var locations = getUnique(jobs.map(function (j) { return j.location; }));
    var modes = getUnique(jobs.map(function (j) { return j.mode; }));
    var experiences = getUnique(jobs.map(function (j) { return j.experience; }));
    var sources = getUnique(jobs.map(function (j) { return j.source; }));
    return { locations: locations, modes: modes, experiences: experiences, sources: sources };
  }

  function jobCardHTML(job, showSaveButton) {
    var saved = isSaved(job.id);
    var saveLabel = saved ? 'Unsave' : 'Save';
    return (
      '<div class="job-card" data-job-id="' + escapeHtml(job.id) + '">' +
        '<h3 class="job-card-title">' + escapeHtml(job.title) + '</h3>' +
        '<div class="job-card-company">' + escapeHtml(job.company) + '</div>' +
        '<div class="job-card-meta">' +
          escapeHtml(job.location || '') + ' · ' + escapeHtml(job.mode || '') + ' · ' + escapeHtml(job.experience || '') + ' · ' + escapeHtml(job.salaryRange || '') +
        '</div>' +
        '<div class="job-card-footer">' +
          '<div class="job-card-badges">' +
            '<span class="job-source-badge">' + escapeHtml(job.source || '') + '</span>' +
            '<span class="job-posted">' + postedLabel(typeof job.postedDaysAgo === 'number' ? job.postedDaysAgo : 0) + '</span>' +
          '</div>' +
          '<div class="job-card-actions">' +
            '<button type="button" class="btn btn-secondary job-btn-view" data-action="view" data-job-id="' + escapeHtml(job.id) + '">View</button>' +
            (showSaveButton ? '<button type="button" class="btn btn-secondary job-btn-save" data-action="save" data-job-id="' + escapeHtml(job.id) + '">' + saveLabel + '</button>' : '') +
            '<a href="' + escapeHtml(job.applyUrl || '#') + '" target="_blank" rel="noopener" class="btn btn-primary job-btn-apply">Apply</a>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function getDashboardHTML(state) {
    var jobs = getJobs();
    var opts = buildFilterOptions(jobs);
    var filtered = filterAndSortJobs(jobs, state);
    var locOpts = opts.locations.map(function (l) {
      return '<option value="' + escapeHtml(l) + '"' + (state.location === l ? ' selected' : '') + '>' + escapeHtml(l) + '</option>';
    }).join('');
    var modeOpts = opts.modes.map(function (m) {
      return '<option value="' + escapeHtml(m) + '"' + (state.mode === m ? ' selected' : '') + '>' + escapeHtml(m) + '</option>';
    }).join('');
    var expOpts = opts.experiences.map(function (e) {
      return '<option value="' + escapeHtml(e) + '"' + (state.experience === e ? ' selected' : '') + '>' + escapeHtml(e) + '</option>';
    }).join('');
    var srcOpts = opts.sources.map(function (s) {
      return '<option value="' + escapeHtml(s) + '"' + (state.source === s ? ' selected' : '') + '>' + escapeHtml(s) + '</option>';
    }).join('');
    var cards = filtered.map(function (j) { return jobCardHTML(j, true); }).join('');
    return (
      '<div class="dashboard-page">' +
        '<h1>Dashboard</h1>' +
        '<div class="filter-bar">' +
          '<div class="filter-group">' +
            '<label for="filter-keyword">Keyword</label>' +
            '<input type="text" id="filter-keyword" class="input" placeholder="Title or company" value="' + escapeHtml(state.keyword) + '">' +
          '</div>' +
          '<div class="filter-group">' +
            '<label for="filter-location">Location</label>' +
            '<select id="filter-location" class="input">' +
              '<option value="">All</option>' + locOpts +
            '</select>' +
          '</div>' +
          '<div class="filter-group">' +
            '<label for="filter-mode">Mode</label>' +
            '<select id="filter-mode" class="input">' +
              '<option value="">All</option>' + modeOpts +
            '</select>' +
          '</div>' +
          '<div class="filter-group">' +
            '<label for="filter-experience">Experience</label>' +
            '<select id="filter-experience" class="input">' +
              '<option value="">All</option>' + expOpts +
            '</select>' +
          '</div>' +
          '<div class="filter-group">' +
            '<label for="filter-source">Source</label>' +
            '<select id="filter-source" class="input">' +
              '<option value="">All</option>' + srcOpts +
            '</select>' +
          '</div>' +
          '<div class="filter-group">' +
            '<label for="filter-sort">Sort</label>' +
            '<select id="filter-sort" class="input">' +
              '<option value="latest"' + (state.sort === 'latest' ? ' selected' : '') + '>Latest</option>' +
              '<option value="oldest"' + (state.sort === 'oldest' ? ' selected' : '') + '>Oldest</option>' +
            '</select>' +
          '</div>' +
        '</div>' +
        '<div class="jobs-list">' + (cards || '<p class="app-empty-state-text">No jobs match your filters.</p>') + '</div>' +
      '</div>'
    );
  }

  function getSavedHTML() {
    var jobs = getJobs();
    var savedIds = getSavedIds();
    var savedJobs = jobs.filter(function (j) { return savedIds.indexOf(j.id) !== -1; });
    var cards = savedJobs.map(function (j) { return jobCardHTML(j, true); }).join('');
    return (
      '<div class="saved-page">' +
        '<h1>Saved</h1>' +
        (savedJobs.length
          ? '<div class="jobs-list">' + cards + '</div>'
          : '<div class="app-empty-state">' +
              '<h2 class="app-empty-state-title">No saved jobs</h2>' +
              '<p class="app-empty-state-text">Jobs you save will appear here.</p>' +
            '</div>') +
      '</div>'
    );
  }

  function getDigestHTML() {
    return (
      '<div class="app-empty-state">' +
        '<h2 class="app-empty-state-title">Digest</h2>' +
        '<p class="app-empty-state-text">Your daily digest will appear here.</p>' +
      '</div>'
    );
  }

  function getProofHTML() {
    return (
      '<div class="proof-placeholder">' +
        '<h1>Proof</h1>' +
        '<p>Placeholder for artifact collection.</p>' +
      '</div>'
    );
  }

  function getPageHTML(path) {
    var key = path === '' ? '/' : path;
    if (key === '/') return getLandingHTML();
    if (key === '/settings') return getSettingsHTML();
    if (key === '/dashboard') return getDashboardHTML(filterState);
    if (key === '/saved') return getSavedHTML();
    if (key === '/digest') return getDigestHTML();
    if (key === '/proof') return getProofHTML();
    return getLandingHTML();
  }

  function getModalHTML(job) {
    var skills = (job.skills || []).map(function (s) {
      return '<span class="modal-skill-tag">' + escapeHtml(s) + '</span>';
    }).join('');
    return (
      '<div class="modal-overlay is-hidden" id="job-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
        '<div class="modal">' +
          '<h2 class="modal-title" id="modal-title">' + escapeHtml(job.title) + '</h2>' +
          '<div class="modal-company">' + escapeHtml(job.company) + '</div>' +
          '<div class="modal-description">' + escapeHtml(job.description || '') + '</div>' +
          (skills ? '<div class="modal-skills-title">Skills</div><div class="modal-skills">' + skills + '</div>' : '') +
          '<button type="button" class="btn btn-secondary modal-close" id="modal-close">Close</button>' +
        '</div>' +
      '</div>'
    );
  }

  function showModal(job) {
    var existing = document.getElementById('job-modal');
    if (existing) existing.remove();
    var wrap = document.createElement('div');
    wrap.innerHTML = getModalHTML(job);
    var overlay = wrap.firstElementChild;
    overlay.classList.remove('is-hidden');
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) hideModal();
    });
    document.getElementById('modal-close').addEventListener('click', hideModal);
  }

  function hideModal() {
    var el = document.getElementById('job-modal');
    if (el) el.remove();
  }

  function render(path) {
    var key = path === '' ? '/' : path;
    var name = ROUTES[key] || 'Home';
    if (!main) return;
    main.innerHTML = getPageHTML(path);
    document.title = name + ' — Job Notification Tracker';
    bindPageEvents(key);
  }

  function bindPageEvents(path) {
    if (!main) return;
    if (path === '/dashboard') {
      var keywordEl = document.getElementById('filter-keyword');
      var locationEl = document.getElementById('filter-location');
      var modeEl = document.getElementById('filter-mode');
      var experienceEl = document.getElementById('filter-experience');
      var sourceEl = document.getElementById('filter-source');
      var sortEl = document.getElementById('filter-sort');
      function applyFilters() {
        filterState.keyword = keywordEl ? keywordEl.value : '';
        filterState.location = locationEl ? locationEl.value : '';
        filterState.mode = modeEl ? modeEl.value : '';
        filterState.experience = experienceEl ? experienceEl.value : '';
        filterState.source = sourceEl ? sourceEl.value : '';
        filterState.sort = sortEl ? sortEl.value : 'latest';
        render('/dashboard');
      }
      if (keywordEl) {
        keywordEl.addEventListener('input', applyFilters);
        keywordEl.addEventListener('change', applyFilters);
      }
      if (locationEl) locationEl.addEventListener('change', applyFilters);
      if (modeEl) modeEl.addEventListener('change', applyFilters);
      if (experienceEl) experienceEl.addEventListener('change', applyFilters);
      if (sourceEl) sourceEl.addEventListener('change', applyFilters);
      if (sortEl) sortEl.addEventListener('change', applyFilters);
    }
  }

  function handleJobCardClick(e) {
    var btn = e.target.closest('[data-action][data-job-id]');
    if (!btn) return;
    var action = btn.getAttribute('data-action');
    var jobId = btn.getAttribute('data-job-id');
    var jobs = getJobs();
    var job = jobs.filter(function (j) { return j.id === jobId; })[0];
    if (action === 'view' && job) {
      e.preventDefault();
      showModal(job);
    }
    if (action === 'save') {
      e.preventDefault();
      toggleSaved(jobId);
      var path = getPath();
      if (path === '/dashboard') render('/dashboard');
      if (path === '/saved') render('/saved');
    }
  }

  function setActiveLink(path) {
    var normalized = path === '' ? '/' : path;
    navLinks.forEach(function (a) {
      var href = a.getAttribute('href') || '/';
      if (href === normalized) {
        a.classList.add('active');
      } else {
        a.classList.remove('active');
      }
    });
  }

  function go(path) {
    path = path || '/';
    var current = getPath();
    if (path !== current) {
      window.history.pushState({ path: path }, '', path === '/' ? '/' : path);
    }
    render(path);
    setActiveLink(path);
  }

  function handleClick(e) {
    var a = e.target.closest('a');
    if (!a) return;
    var path = (a.getAttribute('href') || '').replace(/^#/, '') || '/';
    var isNav = a.classList.contains('app-nav-link');
    var isBrand = a.classList.contains('app-nav-brand');
    if (!isNav && !isBrand) return;
    if (path.indexOf('://') !== -1 || path[0] !== '/') return;
    if (ROUTES[path] === undefined && path !== '/') return;
    e.preventDefault();
    go(path);
    if (navLinksContainer && navLinksContainer.classList.contains('is-open')) {
      navLinksContainer.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  }

  function handlePopState() {
    var path = getPath();
    if (ROUTES[path] !== undefined) {
      render(path);
      setActiveLink(path);
    } else {
      go('/');
    }
  }

  if (toggle && navLinksContainer) {
    toggle.addEventListener('click', function () {
      var open = navLinksContainer.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  var appNav = document.querySelector('.app-nav');
  if (appNav) {
    appNav.addEventListener('click', handleClick);
  }

  function handleMainClick(e) {
    var a = e.target.closest('a');
    if (!a || !a.href) return;
    var href = a.getAttribute('href');
    if (href.indexOf('://') !== -1 || href.indexOf('/') !== 0) return;
    if (ROUTES[href] === undefined && href !== '/') return;
    e.preventDefault();
    go(href);
  }

  if (main) {
    main.addEventListener('click', handleMainClick);
    main.addEventListener('click', handleJobCardClick);
  }

  window.addEventListener('popstate', handlePopState);

  var initialPath = getPath();
  if (ROUTES[initialPath] !== undefined || initialPath === '') {
    render(initialPath);
    setActiveLink(initialPath);
  } else {
    go('/');
  }
})();
