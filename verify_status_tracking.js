// Verification Script for Job Status Tracking
// Simulates app.js logic for Status Persistence, Filtering, and Notifications.

// --- Mocks ---
const localStorageMock = (function () {
    let store = {};
    return {
        getItem: function (key) { return store[key] || null; },
        setItem: function (key, value) { store[key] = value.toString(); },
        clear: function () { store = {}; }
    };
})();
global.localStorage = localStorageMock;

// Mock Global Data
global.JOBS_DATA = [
    { id: '1', title: 'React Dev', location: 'Remote', mode: 'Remote', postedDaysAgo: 1 },
    { id: '2', title: 'Java Dev', location: 'Onsite', mode: 'Onsite', postedDaysAgo: 5 }
];

// --- Replicate Logic (Simplified for Test) ---
const STORAGE_KEY_STATUS = 'jobTrackerStatus';
const STORAGE_KEY_UPDATES = 'jobTrackerStatusUpdates';

function getStatusMap() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_STATUS)) || {}; } catch (e) { return {}; }
}
function getStatus(id) { return getStatusMap()[id] || 'not-applied'; }

function setStatus(id, status) {
    let map = getStatusMap();
    if (map[id] === status) return;
    map[id] = status;
    localStorage.setItem(STORAGE_KEY_STATUS, JSON.stringify(map));

    let updates = JSON.parse(localStorage.getItem(STORAGE_KEY_UPDATES)) || [];
    updates.unshift({ jobId: id, status: status, date: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY_UPDATES, JSON.stringify(updates));
    console.log(`[Toast] Status updated: ${status}`);
}

function filterJobs(jobs, state) {
    return jobs.filter(j => {
        // Status Filter
        if (state.status && getStatus(j.id) !== state.status) return false;
        // Location Filter (Simulate AND logic)
        if (state.location && j.location !== state.location) return false;
        return true;
    });
}

// --- Verification Suite ---
console.log('--- VERIFYING STATUS TRACKING ---\n');

// 1. Persistence
console.log('[1/4] Persistence Test');
setStatus('1', 'applied');
let savedStatus = getStatus('1');
if (savedStatus === 'applied') {
    console.log('✅ PASS: Status persisted as "applied".');
} else {
    console.error(`❌ FAIL: Expected "applied", got "${savedStatus}".`);
}

// 2. Filtering
console.log('\n[2/4] Filter Logic Test');
// Case A: Filter by Status 'applied' -> Should find Job 1
let res1 = filterJobs(global.JOBS_DATA, { status: 'applied' });
if (res1.length === 1 && res1[0].id === '1') {
    console.log('✅ PASS: Filter by status found correct job.');
} else {
    console.error(`❌ FAIL: Status filter failed. Found ${res1.length}.`);
}

// Case B: Filter by Status 'applied' AND Location 'Onsite' -> Should find 0 (Job 1 is Remote)
let res2 = filterJobs(global.JOBS_DATA, { status: 'applied', location: 'Onsite' });
if (res2.length === 0) {
    console.log('✅ PASS: Combined filter (Status + Location) correctly returned 0 matches.');
} else {
    console.error(`❌ FAIL: Combined filter failed. Found ${res2.length}.`);
}

// 3. Updates Log (Digest)
console.log('\n[3/4] Status Updates Log Test');
let updates = JSON.parse(localStorage.getItem(STORAGE_KEY_UPDATES));
if (updates && updates.length > 0 && updates[0].jobId === '1' && updates[0].status === 'applied') {
    console.log('✅ PASS: Status update logged for Digest.');
} else {
    console.error('❌ FAIL: Update log missing or incorrect.');
}

// 4. Edge Case: Clear Storage
console.log('\n[4/4] Clear Storage Test');
localStorage.clear();
if (getStatus('1') === 'not-applied') {
    console.log('✅ PASS: Default status is "not-applied" after clear.');
} else {
    console.error('❌ FAIL: Default status incorrect.');
}

console.log('\n--- VERIFICATION COMPLETE ---');
