// Debug Script for Digest Generation
// Simulates the exact conditions of the user's report.

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

// Mock Data
const today = new Date().toISOString().slice(0, 10);
const jobs = [
    { title: 'Java Dev', location: 'Remote', mode: 'Remote', postedDaysAgo: 1 },
    { title: 'Python Dev', location: 'Onsite', mode: 'Onsite', postedDaysAgo: 1 }
];

// Mock Preferences (User said they set them)
const prefs = {
    roleKeywords: 'React',
    preferredLocations: ['Remote'],
    preferredMode: ['Remote'],
    minMatchScore: 40
};
localStorage.setItem('jobTrackerPreferences', JSON.stringify(prefs));

// Replicate `calculateMatchScore` (Simplified for debug)
function calculateMatchScore(job, prefs) {
    if (!prefs) return 0;
    var score = 0;
    // Keywords
    if (job.title.includes(prefs.roleKeywords)) score += 25;
    // Location
    if (prefs.preferredLocations.includes(job.location)) score += 15;
    // Mode
    if (prefs.preferredMode.includes(job.mode)) score += 10;
    return score;
}

// Replicate `generateDigest`
function generateDigest() {
    console.log('--- Starting Generation ---');

    var rawPrefs = localStorage.getItem('jobTrackerPreferences');
    if (!rawPrefs) {
        console.log('❌ No preferences found in localStorage.');
        return;
    }
    var prefs = JSON.parse(rawPrefs);
    console.log('Preferences loaded:', prefs);

    // Scoping jobs
    jobs.forEach(j => {
        j._matchScore = calculateMatchScore(j, prefs);
        console.log(`Job: ${j.title}, Score: ${j._matchScore}`);
    });

    var matches = jobs.filter(j => j._matchScore > 0);
    console.log(`Found ${matches.length} matches > 0.`);

    if (matches.length === 0) {
        console.log('❌ No matches found. Digest will be empty.');
        // In app.js, we SAVE empty list to indicate "No Matches Today" state?
        // Let's check what app.js does.
    }

    matches.sort((a, b) => b._matchScore - a._matchScore);
    var top10 = matches.slice(0, 10);

    localStorage.setItem('jobTrackerDigest_' + today, JSON.stringify(top10));
    console.log(`✅ Digest saved to jobTrackerDigest_${today} with ${top10.length} items.`);
}

generateDigest();

// Check result
const result = localStorage.getItem('jobTrackerDigest_' + today);
console.log('Result in Storage:', result);
