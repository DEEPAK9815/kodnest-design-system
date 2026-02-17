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

  var navLinks = document.querySelectorAll('.app-nav-links a');
  var main = document.getElementById('app-content');
  var toggle = document.getElementById('app-nav-toggle');
  var navLinksContainer = document.querySelector('.app-nav-links');

  function getPath() {
    return window.location.pathname.replace(/\/$/, '') || '/';
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

  function getDashboardHTML() {
    return (
      '<div class="app-empty-state">' +
        '<h2 class="app-empty-state-title">Dashboard</h2>' +
        '<p class="app-empty-state-text">No jobs yet. In the next step, you will load a realistic dataset.</p>' +
      '</div>'
    );
  }

  function getSavedHTML() {
    return (
      '<div class="app-empty-state">' +
        '<h2 class="app-empty-state-title">Saved</h2>' +
        '<p class="app-empty-state-text">Saved jobs will appear here.</p>' +
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
    if (key === '/dashboard') return getDashboardHTML();
    if (key === '/saved') return getSavedHTML();
    if (key === '/digest') return getDigestHTML();
    if (key === '/proof') return getProofHTML();
    return getLandingHTML();
  }

  function render(path) {
    var key = path === '' ? '/' : path;
    var name = ROUTES[key] || 'Home';
    if (!main) return;
    main.innerHTML = getPageHTML(path);
    document.title = name + ' — Job Notification Tracker';
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
