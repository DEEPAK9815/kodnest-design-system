// Verification script for Match Score Logic

function calculateMatchScore(job, prefs) {
    if (!prefs) return 0;

    var score = 0;
    var breakdown = [];

    // +25 if any roleKeyword appears in job.title
    var roleKeywords = (prefs.roleKeywords || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    var titleLower = (job.title || '').toLowerCase();
    var titleMatch = roleKeywords.some(kw => titleLower.includes(kw));
    if (titleMatch) { score += 25; breakdown.push('+25 Title match'); }

    // +15 if any roleKeyword appears in job.description
    var descLower = (job.description || '').toLowerCase();
    var descMatch = roleKeywords.some(kw => descLower.includes(kw));
    if (descMatch) { score += 15; breakdown.push('+15 Description match'); }

    // +15 if job.location matches preferredLocations
    var prefLocs = (prefs.preferredLocations || []).map(l => l.toLowerCase());
    if (prefLocs.indexOf((job.location || '').toLowerCase()) !== -1) { score += 15; breakdown.push('+15 Location match'); }

    // +10 if job.mode matches preferredMode
    var prefModes = (prefs.preferredMode || []).map(m => m.toLowerCase());
    if (prefModes.indexOf((job.mode || '').toLowerCase()) !== -1) { score += 10; breakdown.push('+10 Mode match'); }

    // +10 if job.experience matches experienceLevel
    if (prefs.experienceLevel && (job.experience || '').toLowerCase() === prefs.experienceLevel.toLowerCase()) {
        score += 10;
        breakdown.push('+10 Experience match');
    }

    // +15 if overlap between job.skills and user.skills
    var userSkills = (prefs.skills || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    var jobSkills = (job.skills || []).map(s => s.toLowerCase());
    var skillMatch = userSkills.some(us => jobSkills.indexOf(us) !== -1);
    if (skillMatch) { score += 15; breakdown.push('+15 Skill match'); }

    // +5 if postedDaysAgo <= 2
    if ((job.postedDaysAgo || 0) <= 2) { score += 5; breakdown.push('+5 Recent post'); }

    // +5 if source is LinkedIn
    if ((job.source || '').toLowerCase() === 'linkedin') { score += 5; breakdown.push('+5 Source LinkedIn'); }

    return { score: Math.min(score, 100), breakdown: breakdown };
}

// Test Cases
const testPrefs = {
    roleKeywords: 'Frontend, React',
    preferredLocations: ['Remote', 'Bangalore'],
    preferredMode: ['Remote', 'Hybrid'],
    experienceLevel: 'Fresher',
    skills: 'React, JavaScript',
    minMatchScore: 40
};

const jobs = [
    {
        title: 'Frontend Developer',
        description: 'We need a React expert.',
        location: 'Remote',
        mode: 'Remote',
        experience: 'Fresher',
        skills: ['React', 'CSS'],
        postedDaysAgo: 1,
        source: 'LinkedIn'
    },
    {
        title: 'Backend Engineer',
        description: 'Java and Spring.',
        location: 'Mumbai',
        mode: 'Onsite',
        experience: '3-5',
        skills: ['Java'],
        postedDaysAgo: 10,
        source: 'Naukri'
    }
];

console.log('--- Verification Output ---');
jobs.forEach((job, i) => {
    const result = calculateMatchScore(job, testPrefs);
    console.log(`\nJob ${i + 1}: ${job.title}`);
    console.log(`Score: ${result.score}`);
    console.log(`Breakdown: ${result.breakdown.join(', ')}`);
});
