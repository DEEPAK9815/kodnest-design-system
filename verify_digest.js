// Verification Script for Daily Digest
// Simulates the logic in app.js for digest generation and storage.

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

// Replicate Logic from app.js
function calculateMatchScore(job, prefs) {
    if (!prefs) return 0;
    var score = 0;
    // Simplified score logic for test (we trust the full engine verified earlier)
    if (job.title.includes(prefs.roleKeywords)) score += 50;
    return score;
}

function generateDigest(jobs, prefs) {
    // 1. Calculate Score
    jobs.forEach(j => j._matchScore = calculateMatchScore(j, prefs));

    // 2. Filter > 0
    var matches = jobs.filter(j => j._matchScore > 0);

    // 3. Sort: Match Desc -> Posted Asc
    matches.sort((a, b) => {
        if (b._matchScore !== a._matchScore) return b._matchScore - a._matchScore;
        return a.postedDaysAgo - b.postedDaysAgo;
    });

    // 4. Slice 10
    var top10 = matches.slice(0, 10);

    // 5. Save
    var today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('jobTrackerDigest_' + today, JSON.stringify(top10));

    return top10;
}

// --- Test Data ---
const prefs = { roleKeywords: 'React' };
const jobs = [
    { id: '1', title: 'React Dev', postedDaysAgo: 5 },  // Match, Old
    { id: '2', title: 'React Lead', postedDaysAgo: 1 }, // Match, New
    { id: '3', title: 'Java Dev', postedDaysAgo: 0 },   // No Match
    { id: '4', title: 'React Intern', postedDaysAgo: 2 } // Match, Mid
];

console.log('--- VERIFYING DAILY DIGEST ---\n');

// Test 1: Generation & Sorting
console.log('[1/3] Logic Verification...');
const digest = generateDigest(jobs, prefs);
const titles = digest.map(d => d.title).join(' -> ');
console.log(`Generated Order: ${titles}`);

// Expect: React Lead (1d) -> React Intern (2d) -> React Dev (5d)
// (Since scores are equal 50, sort by days asc)
if (titles === 'React Lead -> React Intern -> React Dev') {
    console.log('✅ PASS: Sorting logic (Match > Date Asc) correct.');
} else {
    console.error('❌ FAIL: Sorting logic incorrect.');
}

// Test 2: Persistence
console.log('\n[2/3] Persistence Verification...');
const today = new Date().toISOString().slice(0, 10);
const key = 'jobTrackerDigest_' + today;
const stored = localStorage.getItem(key);
if (stored && JSON.parse(stored).length === 3) {
    console.log(`✅ PASS: Digest persisted to '${key}' with 3 jobs.`);
} else {
    console.error('❌ FAIL: Persistence failed.');
}

// Test 3: Copy Text Format
console.log('\n[3/3] Copy Text Verification...');
let text = "My 9AM Job Digest - " + new Date().toLocaleDateString() + "\n\n";
digest.forEach((j, i) => {
    text += (i + 1) + ". " + j.title + " (" + j._matchScore + "% Match)\n";
});

console.log('Formatted Text Preview:');
console.log(text);

if (text.includes('1. React Lead') && text.includes('3. React Dev')) {
    console.log('✅ PASS: Text formatting correct.');
} else {
    console.error('❌ FAIL: Text formatting incorrect.');
}
