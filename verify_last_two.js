// Targeted Verification: Sorting & Banner
// Focuses strictly on the last two items of the checklist.

// --- Mocks ---
const localStorageMock = (function () {
    let store = {};
    return {
        getItem: function (key) { return store[key] || null; },
        setItem: function (key, value) { store[key] = value.toString(); },
        clear: function () { store = {}; },
        removeItem: function (key) { delete store[key]; }
    };
})();
global.localStorage = localStorageMock;
global.window = { JOBS_DATA: [] };

// --- Logic from app.js ---
const STORAGE_KEY_PREFS = 'jobTrackerPreferences';

function getPreferences() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_PREFS)); } catch (e) { return null; }
}

function filterAndSortJobs(jobs, state) {
    var list = jobs.slice();

    // Sort Logic
    if (state.sort === 'oldest') {
        list.sort((a, b) => (b.postedDaysAgo || 0) - (a.postedDaysAgo || 0));
    } else if (state.sort === 'match') {
        list.sort((a, b) => (b._matchScore || 0) - (a._matchScore || 0));
    } else if (state.sort === 'salary') {
        function extractSalary(s) {
            var m = s.match(/(\d+)/);
            return m ? parseInt(m[1], 10) : 0;
        }
        list.sort((a, b) => extractSalary(b.salaryRange) - extractSalary(a.salaryRange));
    } else {
        // Latest (Default)
        list.sort((a, b) => (a.postedDaysAgo || 0) - (b.postedDaysAgo || 0));
    }
    return list;
}

function getDashboardHTML(state) {
    var prefs = getPreferences();
    var bannerHTML = '';

    // Banner Logic
    if (!prefs) {
        bannerHTML = '<div class="preference-banner">Set your preferences to activate intelligent matching.</div>';
    }
    return { html: bannerHTML, hasBanner: !!bannerHTML };
}

// --- Test Data ---
const jobs = [
    { id: '1', title: 'A', postedDaysAgo: 2, _matchScore: 90, salaryRange: '20 LPA' }, // Oldest, Highest Score, Highest Salary
    { id: '2', title: 'B', postedDaysAgo: 0, _matchScore: 50, salaryRange: '10 LPA' }, // Newest, Medium Score, Medium Salary
    { id: '3', title: 'C', postedDaysAgo: 1, _matchScore: 10, salaryRange: '5 LPA' }   // Middle, Lowest Score, Lowest Salary
];

console.log('--- VERIFYING LAST TWO ITEMS ---\n');

// ITEM 6: Sorting
console.log('[Item 6] Sorting Verification:');

// 6a. Latest (Default)
// Expect: 0 days (B) -> 1 day (C) -> 2 days (A)
const sortLatest = filterAndSortJobs(jobs, { sort: 'latest' });
const orderLatest = sortLatest.map(j => j.title).join(' -> ');
console.log(`- Sort by Latest: ${orderLatest}`);
if (orderLatest === 'B -> C -> A') console.log('  ✅ PASS: Sorted by date (ascending postedDaysAgo)');
else console.error('  ❌ FAIL: Incorrect date sort');

// 6b. Match Score
// Expect: 90 (A) -> 50 (B) -> 10 (C)
const sortMatch = filterAndSortJobs(jobs, { sort: 'match' });
const orderMatch = sortMatch.map(j => j.title).join(' -> ');
console.log(`- Sort by Match:  ${orderMatch}`);
if (orderMatch === 'A -> B -> C') console.log('  ✅ PASS: Sorted by score (descending)');
else console.error('  ❌ FAIL: Incorrect score sort');

// 6c. Salary
// Expect: 20 LPA (A) -> 10 LPA (B) -> 5 LPA (C)
const sortSalary = filterAndSortJobs(jobs, { sort: 'salary' });
const orderSalary = sortSalary.map(j => j.title).join(' -> ');
console.log(`- Sort by Salary: ${orderSalary}`);
if (orderSalary === 'A -> B -> C') console.log('  ✅ PASS: Sorted by salary (descending)');
else console.error('  ❌ FAIL: Incorrect salary sort');


// ITEM 7: Banner
console.log('\n[Item 7] Banner Verification:');

// 7a. No Preferences
localStorage.removeItem(STORAGE_KEY_PREFS);
const resultNoPrefs = getDashboardHTML({});
if (resultNoPrefs.hasBanner && resultNoPrefs.html.includes('Set your preferences')) {
    console.log('✅ PASS: Banner appears when preferences are missing.');
} else {
    console.error('❌ FAIL: Banner missing when no prefs.');
}

// 7b. With Preferences
localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify({ role: 'Test' }));
const resultWithPrefs = getDashboardHTML({});
if (!resultWithPrefs.hasBanner) {
    console.log('✅ PASS: Banner hidden when preferences exist.');
} else {
    console.error('❌ FAIL: Banner shown despite existing prefs.');
}

console.log('\n--- VERIFICATION COMPLETE ---');
