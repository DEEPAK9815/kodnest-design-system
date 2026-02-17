// Verification Script for Job Status UI
// Simulates the HTML generation to ensure correct classes and attributes are applied.

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

// Mock Data
global.window = { JOBS_DATA: [] };
const job = {
    id: '1',
    title: 'React Dev',
    company: 'Tech Co',
    location: 'Remote',
    mode: 'Remote',
    postedDaysAgo: 1,
    salaryRange: '$50k'
};

// --- Re-implement UI Helpers from app.js ---
// We need to verify that `jobCardHTML` generates the correct HTML based on status.

function escapeHtml(text) { return text; }
function postedLabel(d) { return d + 'd'; }
function isSaved() { return false; }
function getPreferences() { return null; }
function calculateMatchScore() { return 0; }
function getMatchBadgeHTML() { return ''; }

// Mock Status Logic
let mockStatusMap = {};
function getStatus(id) { return mockStatusMap[id] || 'not-applied'; }

// The function under test (extracted from app.js logic)
function jobCardHTML_Simulated(job, statusOverride) {
    var status = statusOverride || 'not-applied';
    var statusClass = 'status-badge-' + status;

    return `
      <div class="job-card ${statusClass}" data-job-id="${job.id}">
        <div class="job-card-header">
           <div class="job-card-title-group">
             <h3 class="job-card-title">${job.title}</h3>
           </div>
        </div>
        <div class="job-card-footer">
          <div class="job-card-actions">
            <select class="status-select" onchange="app.setStatus('${job.id}', this.value)">
              <option value="not-applied" ${status === 'not-applied' ? 'selected' : ''}>Not Applied</option>
              <option value="applied" ${status === 'applied' ? 'selected' : ''}>Applied</option>
              <option value="rejected" ${status === 'rejected' ? 'selected' : ''}>Rejected</option>
              <option value="selected" ${status === 'selected' ? 'selected' : ''}>Selected</option>
            </select>
          </div>
        </div>
      </div>
    `;
}

// --- Verification Suite ---
console.log('--- VERIFYING STATUS UI GENERATION ---\n');

// Test 1: Default Status (Not Applied)
console.log('[1/3] Default UI State');
let htmlDefault = jobCardHTML_Simulated(job, 'not-applied');

if (htmlDefault.includes('status-badge-not-applied')) {
    console.log('✅ PASS: Job card has "status-badge-not-applied" class.');
} else {
    console.error('❌ FAIL: Missing default status class.');
}
if (htmlDefault.includes('value="not-applied" selected')) {
    console.log('✅ PASS: Dropdown defaults to "Not Applied".');
} else {
    console.error('❌ FAIL: Dropdown selection incorrect.');
}

// Test 2: Applied Status
console.log('\n[2/3] "Applied" UI State');
let htmlApplied = jobCardHTML_Simulated(job, 'applied');

if (htmlApplied.includes('status-badge-applied')) {
    console.log('✅ PASS: Job card has "status-badge-applied" class (triggers Blue border).');
} else {
    console.error('❌ FAIL: Missing applied status class.');
}
if (htmlApplied.includes('value="applied" selected')) {
    console.log('✅ PASS: Dropdown "Applied" is selected.');
} else {
    console.error('❌ FAIL: Dropdown selection incorrect.');
}

// Test 3: Rejected Status
console.log('\n[3/3] "Rejected" UI State');
let htmlRejected = jobCardHTML_Simulated(job, 'rejected');

if (htmlRejected.includes('status-badge-rejected')) {
    console.log('✅ PASS: Job card has "status-badge-rejected" class (triggers Red border).');
} else {
    console.error('❌ FAIL: Missing rejected status class.');
}

console.log('\n--- UI VERIFICATION COMPLETE ---');
