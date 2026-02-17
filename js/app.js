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

  var SUBTEXT = 'This section will be built in the next step.';

  var navLinks = document.querySelectorAll('.app-nav-links a');
  var main = document.getElementById('app-content');
  var toggle = document.getElementById('app-nav-toggle');
  var navLinksContainer = document.querySelector('.app-nav-links');

  function getPath() {
    return window.location.pathname.replace(/\/$/, '') || '/';
  }

  function render(path) {
    var key = path === '' ? '/' : path;
    var name = ROUTES[key] || 'Home';
    if (!main) return;
    main.innerHTML =
      '<div class="app-placeholder">' +
        '<h1 class="app-placeholder-title">' + name + '</h1>' +
        '<p class="app-placeholder-subtext">' + SUBTEXT + '</p>' +
      '</div>';
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

  window.addEventListener('popstate', handlePopState);

  var initialPath = getPath();
  if (ROUTES[initialPath] !== undefined || initialPath === '') {
    render(initialPath);
    setActiveLink(initialPath);
  } else {
    go('/');
  }
})();
