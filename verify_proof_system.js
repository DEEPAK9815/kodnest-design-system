// Verification Script for Final Proof System
// Simulates app.js logic for Proof Validation and Submission.

// --- Mocks ---
const localStorageMock = (function () {
    let store = {};
    return {
        getItem: function (key) { return store[key] || null; },
        setItem: function (key, value) { store[key] = value.toString(); },
        removeItem: function (key) { delete store[key]; },
        clear: function () { store = {}; }
    };
})();
global.localStorage = localStorageMock;

// Mock App Constants & State
const TEST_ITEMS = [
    { id: 't1' }, { id: 't2' }, { id: 't3' }, { id: 't4' }, { id: 't5' },
    { id: 't6' }, { id: 't7' }, { id: 't8' }, { id: 't9' }, { id: 't10' }
]; // 10 items
const STORAGE_KEY_TESTS = 'jobTrackerTestStatus';
const STORAGE_KEY_PROOF = 'jobTrackerProofLinks';

// Helper to set test status
function setTests(count) {
    let status = {};
    for (let i = 0; i < count; i++) status[TEST_ITEMS[i].id] = true;
    localStorage.setItem(STORAGE_KEY_TESTS, JSON.stringify(status));
}

// Logic extracted from app.js
function getProofLinks() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_PROOF)) || { lovable: '', github: '', deployed: '' }; }
    catch (e) { return { lovable: '', github: '', deployed: '' }; }
}
function saveProofLinks(links) {
    localStorage.setItem(STORAGE_KEY_PROOF, JSON.stringify(links));
}
function getTestStatus() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_TESTS)) || {}; } catch (e) { return {}; }
}
function getProjectStatus() {
    var links = getProofLinks();
    var hasLinks = links.lovable && links.github && links.deployed;

    var testStatus = getTestStatus();
    var testCount = 0;
    TEST_ITEMS.forEach(function (item) { if (testStatus[item.id]) testCount++; });

    // Logic from app.js implementation
    if (hasLinks && testCount === 10) return 'Shipped';
    if (testCount > 0 || links.lovable || links.github || links.deployed) return 'In Progress';
    return 'Not Started';
}

// --- Verification Suite ---
console.log('--- VERIFYING PROOF SYSTEM ---\n');

// 1. Initial State
console.log('[1/4] Initial Status Test');
localStorage.clear();
if (getProjectStatus() === 'Not Started') {
    console.log('✅ PASS: Initial status is "Not Started".');
} else {
    console.error(`❌ FAIL: Expected "Not Started", got "${getProjectStatus()}".`);
}

// 2. In Progress (Partial Tests)
console.log('\n[2/4] In Progress Test');
setTests(5); // 5/10 passed
if (getProjectStatus() === 'In Progress') {
    console.log('✅ PASS: Status is "In Progress" with partial tests.');
} else {
    console.error(`❌ FAIL: Expected "In Progress", got "${getProjectStatus()}".`);
}

// 3. In Progress (Full Tests, Missing Links)
console.log('\n[3/4] Testing Gate (Full Tests, No Links)');
setTests(10); // 10/10 passed
if (getProjectStatus() === 'In Progress') { // Should still be In Progress because links are missing
    console.log('✅ PASS: Status remains "In Progress" when links are missing.');
} else {
    console.error(`❌ FAIL: Expected "In Progress", got "${getProjectStatus()}".`);
}

// 4. Shipped (Full Tests + Full Links)
console.log('\n[4/4] Shipped Test');
saveProofLinks({
    lovable: 'https://lovable.dev/p/1',
    github: 'https://github.com/u/r',
    deployed: 'https://vercel.com/PROJ'
});
if (getProjectStatus() === 'Shipped') {
    console.log('✅ PASS: Status is "Shipped" when ALL conditions met.');
} else {
    console.error(`❌ FAIL: Expected "Shipped", got "${getProjectStatus()}".`);
}

console.log('\n--- VERIFICATION COMPLETE ---');
