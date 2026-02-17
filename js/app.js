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

  var STORAGE_KEY_SAVED = 'job-notification-tracker-saved';
  var STORAGE_KEY_PREFS = 'jobTrackerPreferences';

  var filterState = {
    keyword: '',
    location: '',
    mode: '',
    experience: '',
    source: '',
    sort: 'latest',
    showMatchesOnly: false
  };

  // --- Data Access ---

  function getJobs() {
    return window.JOBS_DATA || [];
  }

  function getSavedIds() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY_SAVED);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function setSavedIds(ids) {
    try {
      localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(ids));
    } catch (e) { }
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

  function getPreferences() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY_PREFS);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function savePreferences(prefs) {
    try {
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
    } catch (e) { }
  }

  // --- Match Score Engine ---

  function calculateMatchScore(job, prefs) {
    if (!prefs) return 0;

    var score = 0;

    // +25 if any roleKeyword appears in job.title
    var roleKeywords = (prefs.roleKeywords || '').toLowerCase().split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var titleLower = (job.title || '').toLowerCase();
    var titleMatch = roleKeywords.some(function (kw) { return titleLower.includes(kw); });
    if (titleMatch) score += 25;

    // +15 if any roleKeyword appears in job.description
    var descLower = (job.description || '').toLowerCase();
    var descMatch = roleKeywords.some(function (kw) { return descLower.includes(kw); });
    if (descMatch) score += 15;

    // +15 if job.location matches preferredLocations
    var prefLocs = (prefs.preferredLocations || []).map(function (l) { return l.toLowerCase(); });
    if (prefLocs.indexOf((job.location || '').toLowerCase()) !== -1) score += 15;

    // +10 if job.mode matches preferredMode
    var prefModes = (prefs.preferredMode || []).map(function (m) { return m.toLowerCase(); });
    if (prefModes.indexOf((job.mode || '').toLowerCase()) !== -1) score += 10;

    // +10 if job.experience matches experienceLevel
    if (prefs.experienceLevel && (job.experience || '').toLowerCase() === prefs.experienceLevel.toLowerCase()) {
      score += 10;
    }

    // +15 if overlap between job.skills and user.skills
    var userSkills = (prefs.skills || '').toLowerCase().split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var jobSkills = (job.skills || []).map(function (s) { return s.toLowerCase(); });
    var skillMatch = userSkills.some(function (us) { return jobSkills.indexOf(us) !== -1; });
    if (skillMatch) score += 15;

    // +5 if postedDaysAgo <= 2
    if ((job.postedDaysAgo || 0) <= 2) score += 5;

    // +5 if source is LinkedIn
    if ((job.source || '').toLowerCase() === 'linkedin') score += 5;

    return Math.min(score, 100);
  }

  // --- HTML Generators ---

  function getPath() {
    return window.location.pathname.replace(/\/$/, '') || '/';
  }

  function escapeHtml(s) {
    if (!s && s !== 0) return '';
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
    var prefs = getPreferences() || {
      roleKeywords: '',
      preferredLocations: [],
      preferredMode: [],
      experienceLevel: '',
      skills: '',
      minMatchScore: 40
    };

    var allLocations = ['Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Mumbai', 'Noida', 'Gurgaon', 'Coimbatore', 'Remote', 'Delhi', 'Kolkata'];
    var modes = ['Remote', 'Hybrid', 'Onsite'];
    var experiences = ['Fresher', '0-1', '1-3', '3-5', '5+'];

    var locOptions = allLocations.map(function (l) {
      var selected = prefs.preferredLocations.indexOf(l) !== -1 ? ' selected' : '';
      return '<option value="' + escapeHtml(l) + '"' + selected + '>' + escapeHtml(l) + '</option>';
    }).join('');

    var modeCheckboxes = modes.map(function (m) {
      var checked = prefs.preferredMode.indexOf(m) !== -1 ? ' checked' : '';
      return (
        '<label class="checkbox-label">' +
        '<input type="checkbox" name="preferredMode" value="' + escapeHtml(m) + '"' + checked + '> ' + escapeHtml(m) +
        '</label>'
      );
    }).join('');

    var expOptions = experiences.map(function (e) {
      var selected = prefs.experienceLevel === e ? ' selected' : '';
      return '<option value="' + escapeHtml(e) + '"' + selected + '>' + escapeHtml(e) + '</option>';
    }).join('');

    return (
      '<div class="settings-page">' +
      '<h1>Settings</h1>' +
      '<form class="settings-form" id="settings-form" novalidate>' +
      '<div class="form-group">' +
      '<label for="role-keywords">Role Keywords (comma-separated)</label>' +
      '<input type="text" id="role-keywords" class="input" name="roleKeywords" value="' + escapeHtml(prefs.roleKeywords) + '" placeholder="e.g. Frontend, React, Product Manager">' +
      '</div>' +
      '<div class="form-group">' +
      '<label for="locations">Preferred Locations (hold Ctrl to select multiple)</label>' +
      '<select id="locations" class="input" name="preferredLocations" multiple size="5">' +
      locOptions +
      '</select>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Preferred Mode</label>' +
      '<div class="checkbox-group">' + modeCheckboxes + '</div>' +
      '</div>' +
      '<div class="form-group">' +
      '<label for="experience">Experience Level</label>' +
      '<select id="experience" class="input" name="experienceLevel">' +
      '<option value="">Select</option>' +
      expOptions +
      '</select>' +
      '</div>' +
      '<div class="form-group">' +
      '<label for="skills">Skills (comma-separated)</label>' +
      '<input type="text" id="skills" class="input" name="skills" value="' + escapeHtml(prefs.skills) + '" placeholder="e.g. Java, Python, SQL">' +
      '</div>' +
      '<div class="form-group">' +
      '<label for="min-match-score">Minimum Match Score: <span id="score-val">' + prefs.minMatchScore + '</span></label>' +
      '<input type="range" id="min-match-score" class="input-range" name="minMatchScore" min="0" max="100" value="' + prefs.minMatchScore + '">' +
      '</div>' +
      '<div class="form-actions">' +
      '<button type="submit" class="btn btn-primary">Save Preferences</button>' +
      '</div>' +
      '</form>' +
      '</div>'
    );
  }

  function getMatchBadgeHTML(score) {
    var cls = 'match-badge-neutral';
    if (score >= 80) cls = 'match-badge-high';
    else if (score >= 60) cls = 'match-badge-amber';
    else if (score < 40) cls = 'match-badge-low';

    return '<span class="match-badge ' + cls + '">' + score + '% Match</span>';
  }

  function jobCardHTML(job, showSaveButton) {
    var saved = isSaved(job.id);
    var saveLabel = saved ? 'Unsave' : 'Save';
    var prefs = getPreferences();
    var matchScore = prefs ? calculateMatchScore(job, prefs) : null;

    return (
      '<div class="job-card" data-job-id="' + escapeHtml(job.id) + '">' +
      '<div class="job-card-header">' +
      '<h3 class="job-card-title">' + escapeHtml(job.title) + '</h3>' +
      (matchScore !== null ? getMatchBadgeHTML(matchScore) : '') +
      '</div>' +
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

  function filterAndSortJobs(jobs, state) {
    var list = jobs.slice();
    var prefs = getPreferences();

    // Calculate match scores for all jobs first if prefs exist
    if (prefs) {
      list.forEach(function (j) {
        j._matchScore = calculateMatchScore(j, prefs);
      });
    }

    // Filter by match threshold if toggle is on
    if (state.showMatchesOnly && prefs) {
      var threshold = parseInt(prefs.minMatchScore || 40, 10);
      list = list.filter(function (j) {
        return (j._matchScore || 0) >= threshold;
      });
    }

    // Keyword
    var kw = (state.keyword || '').toLowerCase().trim();
    if (kw) {
      list = list.filter(function (j) {
        return (j.title && j.title.toLowerCase().indexOf(kw) !== -1) ||
          (j.company && j.company.toLowerCase().indexOf(kw) !== -1);
      });
    }
    // Location
    if (state.location) {
      list = list.filter(function (j) { return (j.location || '').toLowerCase() === state.location.toLowerCase(); });
    }
    // Mode
    if (state.mode) {
      list = list.filter(function (j) { return (j.mode || '').toLowerCase() === state.mode.toLowerCase(); });
    }
    // Experience
    if (state.experience) {
      list = list.filter(function (j) { return (j.experience || '').toLowerCase() === state.experience.toLowerCase(); });
    }
    // Source
    if (state.source) {
      list = list.filter(function (j) { return (j.source || '').toLowerCase() === state.source.toLowerCase(); });
    }

    // Sort
    if (state.sort === 'oldest') {
      list.sort(function (a, b) { return (b.postedDaysAgo || 0) - (a.postedDaysAgo || 0); });
    } else if (state.sort === 'match') {
      list.sort(function (a, b) { return (b._matchScore || 0) - (a._matchScore || 0); });
    } else if (state.sort === 'salary') {
      // Simple salary extract (heuristic)
      function extractSalary(s) {
        if (!s) return 0;
        var m = s.match(/(\d+)/);
        return m ? parseInt(m[1], 10) : 0;
      }
      list.sort(function (a, b) { return extractSalary(b.salaryRange) - extractSalary(a.salaryRange); });
    } else {
      // Latest
      list.sort(function (a, b) { return (a.postedDaysAgo || 0) - (b.postedDaysAgo || 0); });
    }

    return list;
  }

  function getDashboardHTML(state) {
    var jobs = getJobs();
    var prefs = getPreferences();

    // Add banner if no prefs
    var bannerHTML = '';
    if (!prefs) {
      bannerHTML = (
        '<div class="preference-banner">' +
        '<p>Set your preferences to activate intelligent matching.</p>' +
        '<a href="/settings" class="btn btn-sm btn-primary">Setup</a>' +
        '</div>'
      );
    }

    var opts = buildFilterOptions(jobs);
    var filtered = filterAndSortJobs(jobs, state); // This adds _matchScore if prefs exist

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
    var emptyState = (
      '<div class="app-empty-state">' +
      '<h2 class="app-empty-state-title">No roles match your criteria</h2>' +
      '<p class="app-empty-state-text">Adjust filters or lower threshold.</p>' +
      '</div>'
    );

    return (
      '<div class="dashboard-page">' +
      '<h1>Dashboard</h1>' +
      bannerHTML +
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
      '<option value="match"' + (state.sort === 'match' ? ' selected' : '') + '>Match Score</option>' +
      '<option value="salary"' + (state.sort === 'salary' ? ' selected' : '') + '>Salary</option>' +
      '<option value="oldest"' + (state.sort === 'oldest' ? ' selected' : '') + '>Oldest</option>' +
      '</select>' +
      '</div>' +
      (prefs ?
        '<div class="filter-group toggle-group">' +
        '<label class="toggle-switch">' +
        '<input type="checkbox" id="filter-show-matches" ' + (state.showMatchesOnly ? 'checked' : '') + '>' +
        '<span class="toggle-slider"></span>' +
        '</label>' +
        '<label for="filter-show-matches" class="toggle-label">Show only matches</label>' +
        '</div>' : '') +
      '</div>' +
      '<div class="jobs-list">' + (cards || emptyState) + '</div>' +
      '</div>'
    );
  }

  // --- Helpers ---

  function postedLabel(days) {
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return days + ' days ago';
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

  // --- Other Pages ---

  function getSavedHTML() {
    var jobs = getJobs();
    var savedIds = getSavedIds();
    var savedJobs = jobs.filter(function (j) { return savedIds.indexOf(j.id) !== -1; });
    var prefs = getPreferences();
    // Calculate score for display
    if (prefs) {
      savedJobs.forEach(function (j) { j._matchScore = calculateMatchScore(j, prefs); });
    }
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
    var prefs = getPreferences();
    if (!prefs) {
      return (
        '<div class="app-empty-state">' +
        '<h2 class="app-empty-state-title">Set Preferences first</h2>' +
        '<p class="app-empty-state-text">We need your preferences to generate a personalized digest.</p>' +
        '<a href="/settings" class="btn btn-primary">Go to Settings</a>' +
        '</div>'
      );
    }

    var today = new Date().toISOString().slice(0, 10);
    var key = 'jobTrackerDigest_' + today;
    var stored = localStorage.getItem(key);

    if (stored) {
      var digestJobs = JSON.parse(stored);
      if (digestJobs.length === 0) {
        return (
          '<div class="app-empty-state">' +
          '<h2 class="app-empty-state-title">No matching roles today.</h2>' +
          '<p class="app-empty-state-text">Check again tomorrow or adjust your preferences.</p>' +
          '<button type="button" class="btn btn-secondary" onclick="localStorage.removeItem(\'' + key + '\'); location.reload();">Reset Simulation</button>' +
          '</div>'
        );
      }
      return renderDigestView(digestJobs, today);
    }

    return (
      '<div class="digest-landing">' +
      '<h1>Daily Digest</h1>' +
      '<p>Simulate the 9AM daily trigger to get your top 10 matches.</p>' +
      '<button type="button" id="btn-generate-digest" class="btn btn-primary btn-lg">Generate Today\'s 9AM Digest (Simulated)</button>' +
      '<p class="text-xs text-muted mt-4">Demo Mode: Daily 9AM trigger simulated manually.</p>' +
      '</div>'
    );
  }

  function renderDigestView(jobs, dateObj) {
    var jobItems = jobs.map(function (j) {
      return (
        '<div class="digest-job-item">' +
        '<div class="digest-job-header">' +
        '<h3 class="digest-job-title">' + escapeHtml(j.title) + '</h3>' +
        '<span class="match-badge match-badge-high">' + (j._matchScore || 0) + '% Match</span>' +
        '</div>' +
        '<div class="digest-job-meta">' + escapeHtml(j.company) + ' • ' + escapeHtml(j.location) + '</div>' +
        '<div class="digest-job-footer">' +
        '<span>' + escapeHtml(j.experience) + '</span>' +
        '<button class="btn btn-sm btn-outline btn-apply-mock" data-title="' + escapeHtml(j.title) + '">Apply Now</button>' +
        '</div>' +
        '</div>'
      );
    }).join('');

    return (
      '<div class="digest-page">' +
      '<div class="digest-container">' +
      '<div class="digest-card">' +
      '<div class="digest-header">' +
      '<h2>Top 10 jobs for you</h2>' +
      '<p>9AM Digest • ' + new Date().toLocaleDateString() + '</p>' +
      '</div>' +
      '<div class="digest-body">' + jobItems + '</div>' +
      '<div class="digest-footer">' +
      '<p>This digest was generated based on your preferences.</p>' +
      '</div>' +
      '</div>' +
      '<div class="digest-actions">' +
      '<button type="button" id="btn-copy-digest" class="btn btn-secondary">Copy Digest to Clipboard</button>' +
      '<button type="button" id="btn-email-digest" class="btn btn-secondary">Create Email Draft</button>' +
      '</div>' +
      '</div>' +
      '</div>'
    );
  }

  function generateDigest() {
    var prefs = getPreferences();
    if (!prefs) return;

    var jobs = getJobs();

    // Calculate scores
    jobs.forEach(function (j) { j._matchScore = calculateMatchScore(j, prefs); });

    // Filter > 0
    var matches = jobs.filter(function (j) { return j._matchScore > 0; });

    // Sort: Match Score Desc -> Posted Days Asc
    matches.sort(function (a, b) {
      if (b._matchScore !== a._matchScore) {
        return b._matchScore - a._matchScore;
      }
      return (a.postedDaysAgo || 0) - (b.postedDaysAgo || 0);
    });

    // Top 10
    var top10 = matches.slice(0, 10);

    // Save
    var today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('jobTrackerDigest_' + today, JSON.stringify(top10));

    render('/digest');
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

  // --- Interaction & Event Binding ---

  var main = document.getElementById('app-content');
  var navLinks = document.querySelectorAll('.app-nav-links a');
  var toggle = document.getElementById('app-nav-toggle');
  var navLinksContainer = document.querySelector('.app-nav-links');

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

    if (path === '/digest') {
      var btnGen = document.getElementById('btn-generate-digest');
      if (btnGen) {
        btnGen.addEventListener('click', generateDigest);
      }

      var btnCopy = document.getElementById('btn-copy-digest');
      if (btnCopy) {
        btnCopy.addEventListener('click', function () {
          var today = new Date().toISOString().slice(0, 10);
          var stored = localStorage.getItem('jobTrackerDigest_' + today);
          if (!stored) return;
          var jobs = JSON.parse(stored);

          var text = "My 9AM Job Digest - " + new Date().toLocaleDateString() + "\n\n";
          jobs.forEach(function (j, i) {
            text += (i + 1) + ". " + j.title + " at " + j.company + " (" + j._matchScore + "% Match)\n";
            text += "   Location: " + j.location + "\n";
            text += "   Link: #\n\n";
          });

          navigator.clipboard.writeText(text).then(function () {
            alert('Digest copied to clipboard!');
          }, function () {
            alert('Failed to copy. ' + text); // Fallback
          });
        });
      }

      var btnEmail = document.getElementById('btn-email-digest');
      if (btnEmail) {
        btnEmail.addEventListener('click', function () {
          var today = new Date().toISOString().slice(0, 10);
          var stored = localStorage.getItem('jobTrackerDigest_' + today);
          if (!stored) return;
          var jobs = JSON.parse(stored);

          var subject = encodeURIComponent("My 9AM Job Digest");
          var body = "Here are my top " + jobs.length + " job matches for today:\n\n";
          jobs.forEach(function (j) {
            body += "- " + j.title + " @ " + j.company + " (" + j._matchScore + "% Match)\n";
          });

          window.location.href = "mailto:?subject=" + subject + "&body=" + encodeURIComponent(body);
        });
      }
    }

    if (path === '/settings') {
      var range = document.getElementById('min-match-score');
      var valDisplay = document.getElementById('score-val');
      if (range && valDisplay) {
        range.addEventListener('input', function () {
          valDisplay.textContent = range.value;
        });
      }

      var form = document.getElementById('settings-form');
      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var formData = new FormData(form);
          var prefs = {
            roleKeywords: formData.get('roleKeywords'),
            preferredLocations: formData.getAll('preferredLocations'),
            preferredMode: formData.getAll('preferredMode'),
            experienceLevel: formData.get('experienceLevel'),
            skills: formData.get('skills'),
            minMatchScore: formData.get('minMatchScore')
          };
          savePreferences(prefs);
          alert('Preferences saved!');
        });
      }
    }

    if (path === '/dashboard') {
      var keywordEl = document.getElementById('filter-keyword');
      var locationEl = document.getElementById('filter-location');
      var modeEl = document.getElementById('filter-mode');
      var experienceEl = document.getElementById('filter-experience');
      var sourceEl = document.getElementById('filter-source');
      var sortEl = document.getElementById('filter-sort');
      var matchesToggle = document.getElementById('filter-show-matches');

      function applyFilters() {
        filterState.keyword = keywordEl ? keywordEl.value : '';
        filterState.location = locationEl ? locationEl.value : '';
        filterState.mode = modeEl ? modeEl.value : '';
        filterState.experience = experienceEl ? experienceEl.value : '';
        filterState.source = sourceEl ? sourceEl.value : '';
        filterState.sort = sortEl ? sortEl.value : 'latest';
        filterState.showMatchesOnly = matchesToggle ? matchesToggle.checked : false;
        render('/dashboard');
      }

      if (keywordEl) { // debounce could be added
        keywordEl.addEventListener('input', applyFilters);
      }
      if (locationEl) locationEl.addEventListener('change', applyFilters);
      if (modeEl) modeEl.addEventListener('change', applyFilters);
      if (experienceEl) experienceEl.addEventListener('change', applyFilters);
      if (sourceEl) sourceEl.addEventListener('change', applyFilters);
      if (sortEl) sortEl.addEventListener('change', applyFilters);
      if (matchesToggle) matchesToggle.addEventListener('change', applyFilters);
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
      if (path === '/dashboard') render('/dashboard'); // re-render to update label
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
    var isCta = a.classList.contains('landing-cta') || a.classList.contains('btn-primary'); // Handle checks for settings link

    // Only intercept internal links
    if (path.indexOf('://') !== -1) return;
    if (path.indexOf('/') !== 0) return;

    // Allow navigation if route exists or simple link
    if (ROUTES[path] === undefined && path !== '/') return;

    e.preventDefault();
    go(path);

    if (navLinksContainer && navLinksContainer.classList.contains('is-open')) {
      navLinksContainer.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  }

  function handleMainClick(e) {
    // Delegate click for dynamic content like cards
    handleJobCardClick(e);

    // Also handle links inside main (like Empty State cta or Banner cta)
    var a = e.target.closest('a');
    if (a && a.getAttribute('href') && a.getAttribute('href').startsWith('/')) {
      // Only if it's not handled by handleJobCardClick (which handles apply button which is an anchor but target _blank)
      // Apply button has target=_blank, so we skip it.
      if (a.target === '_blank') return;
      e.preventDefault();
      go(a.getAttribute('href'));
    }
  }

  window.addEventListener('popstate', function () {
    var path = getPath();
    if (ROUTES[path] !== undefined) {
      render(path);
      setActiveLink(path);
    } else {
      go('/');
    }
  });

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

  if (main) {
    main.addEventListener('click', handleMainClick);
  }

  // Initial load
  var initialPath = getPath();
  if (ROUTES[initialPath] !== undefined || initialPath === '') {
    render(initialPath);
    setActiveLink(initialPath);
  } else {
    go('/');
  }

})();
