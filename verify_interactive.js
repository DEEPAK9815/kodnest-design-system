// Interactive Verification Script
// Simulates browser environment to test persistence, filtering, and sorting.

// --- 1. Mocks ---
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

// --- 2. Load App Logic ---
// We need to extract the relevant functions from app.js or copy them here.
// Since app.js is inside an IIFE, we'll replicate the core logic functions here for testing.

const STORAGE_KEY_PREFS = 'jobTrackerPreferences';

function getPreferences() {
    try {
        var raw = localStorage.getItem(STORAGE_KEY_PREFS);
        return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
}

function savePreferences(prefs) {
    try {
        localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
    } catch (e) { }
}

function calculateMatchScore(job, prefs) {
    if (!prefs) return 0;
    var score = 0;
    var roleKeywords = (prefs.roleKeywords || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    var titleLower = (job.title || '').toLowerCase();
    if (roleKeywords.some(kw => titleLower.includes(kw))) score += 25;

    var descLower = (job.description || '').toLowerCase();
    if (roleKeywords.some(kw => descLower.includes(kw))) score += 15;

    var prefLocs = (prefs.preferredLocations || []).map(l => l.toLowerCase());
    if (prefLocs.indexOf((job.location || '').toLowerCase()) !== -1) score += 15;

    var prefModes = (prefs.preferredMode || []).map(m => m.toLowerCase());
    if (prefModes.indexOf((job.mode || '').toLowerCase()) !== -1) score += 10;

    if (prefs.experienceLevel && (job.experience || '').toLowerCase() === prefs.experienceLevel.toLowerCase()) score += 10;

    var userSkills = (prefs.skills || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    var jobSkills = (job.skills || []).map(s => s.toLowerCase());
    if (userSkills.some(us => jobSkills.indexOf(us) !== -1)) score += 15;

    if ((job.postedDaysAgo || 0) <= 2) score += 5;
    if ((job.source || '').toLowerCase() === 'linkedin') score += 5;

    return Math.min(score, 100);
}

function filterAndSortJobs(jobs, state) {
    var list = jobs.slice();
    var prefs = getPreferences();

    if (prefs) {
        list.forEach(function (j) {
            j._matchScore = calculateMatchScore(j, prefs);
        });
    }

    if (state.showMatchesOnly && prefs) {
        var threshold = parseInt(prefs.minMatchScore || 40, 10);
        list = list.filter(function (j) {
            return (j._matchScore || 0) >= threshold;
        });
    }

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

    if (state.sort === 'match') {
        list.sort(function (a, b) { return (b._matchScore || 0) - (a._matchScore || 0); });
    } else if (state.sort === 'salary') {
        function extractSalary(s) {
            if (!s) return 0;
            var m = s.match(/(\d+)/);
            return m ? parseInt(m[1], 10) : 0;
        }
        list.sort(function (a, b) { return extractSalary(b.salaryRange) - extractSalary(a.salaryRange); });
    }
    return list;
}

// --- 3. Test Data ---
const sampleJobs = [
    { id: '1', title: 'React Dev', location: 'Remote', mode: 'Remote', salaryRange: '10 LPA', postedDaysAgo: 1, skills: ['React'] },
    { id: '2', title: 'Java Dev', location: 'Pune', mode: 'Onsite', salaryRange: '15 LPA', postedDaysAgo: 5, skills: ['Java'] },
    { id: '3', title: 'Frontend Intern', location: 'Remote', mode: 'Hybrid', salaryRange: '5 LPA', postedDaysAgo: 0, skills: ['CSS'] }
];

// --- 4. Verification Steps ---

console.log('--- TEST 1: Preference Persistence ---');
const myPrefs = {
    roleKeywords: 'React',
    preferredLocations: ['Remote'],
    preferredMode: ['Remote'], // Added
    skills: 'React',           // Added
    minMatchScore: 50
};
savePreferences(myPrefs);
const loaded = getPreferences();
if (loaded.roleKeywords === 'React' && loaded.minMatchScore == 50) {
    console.log('✅ Preferences saved and retrieved from localStorage.');
} else {
    console.log('❌ Persistence failed.');
}

console.log('\n--- TEST 2: Match Scores & Filtering ---');
// Calculate scores
const results = filterAndSortJobs(sampleJobs, { sort: 'match', showMatchesOnly: false });
const job1 = results.find(j => j.id === '1');
const job2 = results.find(j => j.id === '2');

console.log(`Job 1 (React) Score: ${job1._matchScore}`); // Expect high (Title + Loc + Mode + Skill + Recent)
console.log(`Job 2 (Java) Score: ${job2._matchScore}`);   // Expect low

if (job1._matchScore > 50 && job2._matchScore < 50) {
    console.log('✅ Scoring logic distinguishes relevant jobs.');
} else {
    console.log('❌ Scoring logic unclear.');
}

console.log('\n--- TEST 3: Toggle "Show Only Matches" ---');
const filtered = filterAndSortJobs(sampleJobs, { sort: 'match', showMatchesOnly: true }); // Threshold is 50 from myPrefs
if (filtered.length === 1 && filtered[0].id === '1') {
    console.log('✅ Toggle correctly filters jobs below threshold (50).');
} else {
    console.log(`❌ Filter failed. Got ${filtered.length} jobs.`);
}

console.log('\n--- TEST 4: Sorting by Salary ---');
const salarySorted = filterAndSortJobs(sampleJobs, { sort: 'salary' });
if (salarySorted[0].id === '2' && salarySorted[2].id === '3') { // 15 LPA > 10 LPA > 5 LPA
    console.log('✅ Sorting by salary works (15 LPA first).');
} else {
    console.log('❌ Salary sort failed.');
}

console.log('\n--- TEST 5: AND Logic (Combinatory Filters) ---');
// Filter for Location: Remote AND Mode: Hybrid (should match Job 3 only, assuming filtering logic matches app.js)
// Wait, Job 1 is Remote/Remote. Job 3 is Remote/Hybrid.
// If I filter Location=Remote, I get Job 1 and 3.
// If I add Mode=Hybrid, I should ONLY get Job 3.
const andParams = { location: 'Remote', mode: 'Hybrid', sort: 'latest' };
const andResults = filterAndSortJobs(sampleJobs, andParams);
if (andResults.length === 1 && andResults[0].id === '3') {
    console.log('✅ Multiple filters work with AND logic.');
} else {
    console.log('❌ AND logic failed.');
}
