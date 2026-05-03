import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import './landing.css';
import { OrbitMark } from '../../components/OrbitMark';
import { l1Html, l1HtmlHeight, l2Html, l2HtmlHeight, l3Html, l3HtmlHeight, l4Html, l4HtmlHeight } from './demoHtml';

// ── DATA ─────────────────────────────────────────────────────────────────────

const TYPEWRITER_PHRASES = [
  'resume to verified hire,',
  'interview-ready in days,',
  'the salary you deserve,',
  'your next career level,',
  'an ATS score that gets you seen,',
];

const AC_DATA = [
  { title: 'Product Manager', sal: 'SGD 7K–11K', meta: '340 open roles · Most in demand' },
  { title: 'Senior Product Manager', sal: 'SGD 9K–13K', meta: '128 open roles · +22% YoY' },
  { title: 'Product Designer', sal: 'SGD 6K–9K', meta: '210 open roles · High velocity' },
  { title: 'Software Engineer', sal: 'SGD 6K–12K', meta: '890 open roles · Always hiring' },
  { title: 'Data Analyst', sal: 'SGD 5K–8K', meta: '180 open roles · Growing fast' },
  { title: 'Marketing Manager', sal: 'SGD 5K–9K', meta: '140 open roles' },
  { title: 'Business Analyst', sal: 'SGD 5K–8K', meta: '160 open roles' },
  { title: 'UX Designer', sal: 'SGD 5.5K–8.5K', meta: '95 open roles' },
  { title: 'DevOps Engineer', sal: 'SGD 7K–12K', meta: '210 open roles · Hot skill' },
  { title: 'Data Scientist', sal: 'SGD 7K–13K', meta: '150 open roles · AI boom' },
];

const ATS_KW_MAP = {
  pm:      { found: ['product strategy', 'roadmap', 'agile', 'stakeholder', 'metrics', 'delivery'],
             missing: ['OKR framework', 'A/B testing', 'growth metrics', 'SQL', 'go-to-market', 'user research'] },
  eng:     { found: ['API design', 'system architecture', 'code review', 'CI/CD', 'testing', 'deployment'],
             missing: ['distributed systems', 'Kubernetes', 'TypeScript', 'performance tuning', 'microservices', 'system design'] },
  design:  { found: ['user research', 'wireframing', 'prototyping', 'design systems', 'Figma', 'UX'],
             missing: ['accessibility (WCAG)', 'usability testing', 'motion design', 'design tokens', 'journey mapping', 'A/B testing'] },
  data:    { found: ['SQL', 'data analysis', 'dashboards', 'reporting', 'Python', 'Excel'],
             missing: ['machine learning', 'statistical modeling', 'Tableau', 'dbt', 'data pipeline', 'ETL'] },
  default: { found: ['communication', 'project management', 'stakeholder management', 'problem solving'],
             missing: ['data-driven decision making', 'KPI tracking', 'cross-functional leadership', 'strategic planning'] },
};

const HERO_ATS_KW = {
  pm:      { found: ['roadmap', 'stakeholder', 'agile', 'cross-functional', 'metrics', 'delivery'],
             missing: ['OKR', 'go-to-market', 'A/B testing', 'growth', 'SQL', 'product strategy'] },
  eng:     { found: ['API', 'backend', 'deployment', 'testing', 'code review', 'CI/CD'],
             missing: ['system design', 'scalability', 'microservices', 'Kubernetes', 'TypeScript', 'performance optimization'] },
  design:  { found: ['user research', 'wireframe', 'prototype', 'UX', 'design system', 'Figma'],
             missing: ['accessibility', 'usability testing', 'design tokens', 'motion design', 'user journey', 'A/B testing'] },
  default: { found: ['leadership', 'communication', 'problem-solving', 'collaboration', 'project management'],
             missing: ['data analysis', 'KPI', 'strategic planning', 'stakeholder management', 'cross-functional', 'metrics'] },
};

function getKwSet(role) {
  const r = (role || '').toLowerCase();
  if (r.includes('product') || r.includes(' pm ')) return ATS_KW_MAP.pm;
  if (r.includes('engineer') || r.includes('developer') || r.includes('software')) return ATS_KW_MAP.eng;
  if (r.includes('design') || r.includes('ux') || r.includes('ui')) return ATS_KW_MAP.design;
  if (r.includes('data') || r.includes('analyst')) return ATS_KW_MAP.data;
  return ATS_KW_MAP.default;
}

function getHeroKwSet(job) {
  const j = (job || '').toLowerCase();
  if (j.includes('product') || j.includes('pm')) return HERO_ATS_KW.pm;
  if (j.includes('engineer') || j.includes('developer') || j.includes('software')) return HERO_ATS_KW.eng;
  if (j.includes('design') || j.includes('ux') || j.includes('ui')) return HERO_ATS_KW.design;
  return HERO_ATS_KW.default;
}

const STORE_KEY = 'cah_applications';
const STAGES = ['applied', 'screening', 'interview', 'offer', 'rejected'];
const STAGE_LABELS = { applied: 'Applied', screening: 'Phone Screen', interview: 'Interview', offer: 'Offer', rejected: 'Closed' };
const EMOJIS = ['🏢', '💼', '🏬', '🏦', '🖥️', '🏗️', '🔬', '📱'];

function timeAgo(date) {
  try {
    const s = Math.floor((Date.now() - date) / 1000);
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
  } catch (e) { return 'recently'; }
}

function formatDate(iso) {
  try {
    const d = new Date(iso), now = new Date();
    const diff = Math.floor((now - d) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return diff + 'd ago';
    return d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short' });
  } catch (e) { return ''; }
}

const STATS = [
  { value: 75, suffix: '%', cls: 'n-r', label: 'of resumes rejected by ATS before a human reads them' },
  { value: 18, prefix: '$', suffix: 'K', cls: 'n-a', label: 'average salary left on table without negotiation prep' },
  { value: 5, suffix: ' mo', cls: 'n-t', label: 'average job search going in blind with no system' },
  { value: 32, suffix: '×', scale: 10, cls: 'n-p', label: 'higher return when AI memory tracks your progress' },
];

const LAYER_DATA = [
  {
    label: 'l1', n: 'Layer 01', title: 'Resume creation', sub: 'ATS · editor · cover letter',
    status: 'live', ey: 'Layer 01 — Live now', panelTitle: 'Intelligent resume creation',
    desc: 'Choose from professional templates · Write in our In-App Editor with live ATS scoring as you type · XYZ bullet guidance structures every achievement to international standards · Version control saves every draft · One-click PDF & DOCX export · Cover Letter auto-generated from your profile and target role.',
    cta: 'See How It Works →', ctaCls: 'cta-t',
    bg: 'var(--lp-teal-dim)', eyC: 'var(--lp-teal)', borderC: 'var(--lp-teal-b2)',
    mods: [
      { n: 'Resume Scan + ATS', d: 'Instant ATS match score against any job description. See missing keywords and exactly which changes move the needle.' },
      { n: 'In-App Editor', d: 'Write and edit directly in CareerAiHub. Live ATS score updates as you type. Professional templates. One-click PDF & DOCX export.' },
      { n: 'Cover Letter Generator', d: 'Auto-generated from your profile and target role. Tone control from formal to direct. Sounds like you, not a template.' },
    ],
    mem: [
      { n: 'Resume parsed', l: 'History extracted' }, { n: 'Target role', l: 'Seeded everywhere' },
      { n: 'Skills mapped', l: 'Gaps flagged' }, { n: 'Versions saved', l: 'Tracked over time' },
      { n: 'ATS score', l: 'Benchmark stored' },
    ],
  },
  {
    label: 'l2', n: 'Layer 02', title: 'Interview + salary prep', sub: 'Mock interviews · HM sim · salary',
    status: 'live', ey: 'Layer 02 — Live now', panelTitle: 'Interview + salary preparation',
    desc: "AI coaches that know your resume, your target role, and every past session. The mock interview knows which role you're targeting. HM Simulator pressure-tests your answers. Salary coach knows your market level.",
    cta: 'See How It Works →', ctaCls: 'cta-t',
    bg: 'var(--lp-violet-dim)', eyC: 'var(--lp-violet)', borderC: 'var(--lp-violet-b)',
    mods: [
      { n: 'Mock interviews', d: 'Role-specific question sets. AI scoring and feedback. Tracks improvement across sessions.' },
      { n: 'HM simulator', d: 'Simulates a hiring manager. Pressure-tests your answers. Knows your experience from memory.' },
      { n: 'Salary coach', d: 'Market benchmarks. Live AI negotiation roleplay. Multi-offer comparison.' },
    ],
    mem: [
      { n: 'Interview log', l: 'Sessions tracked' }, { n: 'Answer score', l: 'Trend visible' },
      { n: 'Weak spots', l: 'Practice flagged' }, { n: 'Salary range', l: 'Market-calibrated' },
      { n: 'Offer history', l: 'Negotiation context' },
    ],
  },
  {
    label: 'l3', n: 'Layer 03', title: 'Verified credentials', sub: 'Blockchain · school partners',
    status: 'building', ey: 'Layer 03 — Building next', panelTitle: 'Verified identity + credentials',
    desc: "Blockchain-backed institutional verification. School partnerships issue credentials directly onto your profile with a green verified badge — making your profile trustworthy to recruiters from day one.",
    cta: 'See Demo →', ctaCls: 'cta-a',
    bg: 'var(--lp-amber-dim)', eyC: 'var(--lp-amber)', borderC: 'var(--lp-amber-b)',
    mods: [
      { n: 'School partnerships', d: "University partnerships with free student access via MOU. Institutions issue credentials directly onto your profile." },
      { n: 'Credential verify', d: 'Blockchain-backed degree and certification verification. Green verified badge on profile.' },
      { n: 'Skills assessment', d: 'Verified skills tests linked to credential. Displayed on profile. Recruiter-searchable.' },
    ],
    mem: [
      { n: 'Degree verified', l: 'Blockchain hash' }, { n: 'GPA confirmed', l: 'Institution-issued' },
      { n: 'Skills tested', l: 'Scores stored' }, { n: 'Badge issued', l: 'Trust score up' },
      { n: 'Recruiter visible', l: 'Searchable' },
    ],
  },
  {
    label: 'l4', n: 'Layer 04', title: 'AI marketplace', sub: 'Match engine · TrustChat',
    status: 'planned', ey: 'Layer 04 — Planned', panelTitle: 'AI-powered HR marketplace',
    desc: "Two-sided AI matching on verified data + TrustChat — verified in-platform messaging with credential sidebar. Recruiters access pre-verified, AI-matched candidates. No cold contact.",
    cta: 'See Demo →', ctaCls: 'cta-p',
    bg: 'var(--lp-purple-dim)', eyC: 'var(--lp-purple)', borderC: 'var(--lp-purple-b)',
    mods: [
      { n: 'AI match engine', d: 'Scores verified profiles against recruiter requirements. Auto-shortlist. Both sides notified on match.' },
      { n: 'TrustChat', d: 'Verified messaging. Recruiter initiates post-match. Credentials visible in sidebar.' },
      { n: 'Recruiter dashboard', d: 'Pipeline management. Hiring analytics. Application tracker. SGD 299–499/month.' },
    ],
    mem: [
      { n: 'Verified profile', l: 'Full trust score' }, { n: 'Match scored', l: 'AI fit calc' },
      { n: 'Both notified', l: 'No cold contact' }, { n: 'Chat started', l: 'Creds visible' },
      { n: 'Outcome logged', l: 'Memory improves' },
    ],
  },
];

const FEAT_DATA = [
  {
    icon: '🔍', label: 'Job Search', isFree: true, moduleId: 'jobs',
    ey: 'Module 1 — Always free', title: 'Job Search Engine',
    desc: 'Find live jobs from 20+ platforms in one place. AI ranks results by fit to your memory profile, surfaces salary data for each role, and shows which companies are actively hiring.',
    bullets: ['Live jobs from LinkedIn, Indeed, Glassdoor, and 17 more in one search', 'AI salary intel shows market rate for each role before you apply', 'Application tracker logs every job across all platforms in one dashboard', "Market intelligence shows hiring velocity — who's growing fast, who's slowing"],
    previewHd: 'Job Search · Live AI-ranked results',
    preview: `<div class="mk-lbl">Live results · "Product Manager · Singapore"</div>
      <div class="mk-row"><span class="mk-l">Senior PM · Tech company · SGD 8K–11K</span><span class="mk-v">94% fit</span></div>
      <div class="mk-row"><span class="mk-l">Product Manager · E-commerce · SGD 7K–10K</span><span class="mk-v">87% fit</span></div>
      <div class="mk-row"><span class="mk-l">Associate PM · Fintech · SGD 5K–7.5K</span><span class="mk-v">81% fit</span></div>
      <div class="mk-stat-row" style="margin-top:12px">
        <div class="mk-stat"><div class="mk-stat-n">340</div><div class="mk-stat-l">Open PM roles SG</div></div>
        <div class="mk-stat"><div class="mk-stat-n">SGD 8.2K</div><div class="mk-stat-l">Median salary</div></div>
        <div class="mk-stat"><div class="mk-stat-n">+18%</div><div class="mk-stat-l">YoY demand</div></div>
      </div>`,
    pw: null,
  },
  {
    icon: '⚡', label: 'Resume Scan', isFree: false, moduleId: 'scan',
    ey: 'Module 2 — Premium', title: 'Resume Scan + ATS Scorer',
    desc: "Upload your resume and a job description. Real-time ATS match score, keyword gap analysis, and specific improvement suggestions — all informed by your AI memory.",
    bullets: ["Real-time ATS score vs the exact job description you're applying to", "Keyword gap analysis — see exactly what's missing before you submit", 'AI memory means it already knows your work history from onboarding', 'Version control tracks every resume iteration and its ATS score over time'],
    previewHd: 'Resume Scan + ATS · live scoring',
    preview: `<div class="roast-toggle"><button class="roast-opt on">Professional</button><button class="roast-opt snarky">Snarky Roast</button></div>
      <div class="mk-lbl">ATS score vs Senior PM · Job description</div>
      <div class="mk-score" style="margin-bottom:12px"><div class="mk-track"><div class="mk-bar" style="width:91%"></div></div><span class="mk-pct">91%</span></div>
      <div class="mk-lbl">Keywords matched</div>
      <div style="margin-bottom:9px"><span class="mk-tag m">product strategy</span><span class="mk-tag m">roadmap</span><span class="mk-tag m">agile</span><span class="mk-tag m">data-driven</span></div>
      <div class="mk-lbl">Missing — add these</div>
      <div><span class="mk-tag x">OKR framework</span><span class="mk-tag x">growth metrics</span><span class="mk-tag x">SQL</span></div>`,
    pw: { h: "You've used your 1 free resume scan.", s: 'Unlock the full editor to fix every gap and re-score as many times as you need.', cta: 'Unlock full editor →' },
  },
  {
    icon: '✦', label: 'ATS Builder', isFree: false, moduleId: 'ats',
    ey: 'Module 3 — Premium', title: 'In-App ATS Builder',
    desc: 'Write and edit your resume directly in CareerAiHub with live ATS scoring as you type. XYZ bullet guidance shows you exactly how to quantify each achievement. Version control means you never lose a draft.',
    bullets: ['XYZ formula: Achieved X, measured by Y, by doing Z — for every bullet', 'Live ATS score updates as you type — see impact of every change in real time', 'Version control with named snapshots — revert to any previous draft instantly', 'One-click download as PDF or DOCX with formatting preserved'],
    previewHd: 'ATS Builder · live edit mode',
    preview: `<div class="mk-lbl">Before XYZ formula</div>
      <div class="mk-chat" style="border-left:2px solid var(--red);margin-bottom:8px;font-size:11px">Led product team to ship new checkout flow.</div>
      <div class="mk-lbl">AI suggestion — XYZ format</div>
      <div class="mk-chat ai">Reduced checkout abandonment by 34% (X), measured by Amplitude funnel data (Y), by shipping a 2-step guest checkout flow in 6 weeks (Z).</div>
      <div class="mk-lbl" style="margin-top:10px">Live ATS score after edit</div>
      <div class="mk-score"><div class="mk-track"><div class="mk-bar" style="width:91%"></div></div><span class="mk-pct">+6pts</span></div>`,
    pw: { h: "You've hit the free editing limit.", s: 'Unlock full editor access — apply all suggestions, save versions, and download your updated resume.', cta: 'Unlock full editor →' },
  },
  {
    icon: '🔎', label: 'JD Analyzer', isFree: false, moduleId: 'jd',
    ey: 'Module 4 — Premium', title: 'JD Analyzer',
    desc: "Paste any job description. CareerAiHub decodes it — surfacing the real requirements hidden in vague language, mapping them to your resume, and flagging gaps you need to address before applying.",
    bullets: ['Decodes vague JD language into specific, actionable skill requirements', "Maps each requirement to your resume — shows what you have and what's missing", 'AI memory means it already knows your background before you paste the JD', 'Priority ranking: which gaps matter most to close before you apply'],
    previewHd: 'JD Analyzer · requirements decoded',
    preview: `<div class="mk-lbl">Tech Company · Senior PM · decoded</div>
      <div class="mk-row"><span class="mk-l">5+ years product experience</span><span class="mk-v">✓ You have 7 years</span></div>
      <div class="mk-row"><span class="mk-l">Growth stage experience</span><span class="mk-v">✓ Matched via memory</span></div>
      <div class="mk-row"><span class="mk-l">SQL / data analysis</span><span class="mk-v neg">⚠ Not on resume</span></div>
      <div class="mk-row"><span class="mk-l">OKR framework</span><span class="mk-v neg">⚠ Add to resume</span></div>
      <div class="mk-chat ai" style="margin-top:10px"><strong style="color:var(--teal)">AI:</strong> Add a bullet in your Shopee role about the SQL dashboards you built. Closes the data gap, lifts ATS by ~10 points.</div>`,
    pw: { h: "You've used your 1 free JD analysis.", s: "Unlock unlimited analyses to decode every role you're targeting — before spending time applying.", cta: 'Unlock unlimited sessions →' },
  },
  {
    icon: '⭐', label: 'STAR Builder', isFree: false, moduleId: 'star',
    ey: 'Module 5 — Premium', title: 'STAR Answer Builder',
    desc: "CareerAiHub builds STAR-structured interview answers from your memory-stored work history — tailored to the specific role you're targeting. Quantified, compelling, and uniquely yours.",
    bullets: ['Generates role-specific STAR answers from your actual work history in memory', 'Quantifies results using your real data — no generic placeholders', 'AI scores each answer for clarity, relevance, and impact', 'Saved answer library you can refine and reuse across applications'],
    previewHd: 'STAR Builder · answer preview',
    preview: `<div class="mk-star"><div class="mk-star-l">Situation</div><div class="mk-star-t">At a major e-commerce platform, checkout abandonment was 61% on mobile — above the 45% SEA benchmark.</div></div>
      <div class="mk-star"><div class="mk-star-l">Task</div><div class="mk-star-t">Reduce abandonment 15 points in one quarter, leading a cross-functional team of 8.</div></div>
      <div class="mk-star"><div class="mk-star-l">Action</div><div class="mk-star-t">Ran discovery sprint, shipped 2-step guest checkout eliminating mandatory account creation on mobile.</div></div>
      <div class="mk-star"><div class="mk-star-l">Result</div><div class="mk-star-t">Abandonment dropped 34% in 6 weeks. SGD 2.1M recovered GMV in Q4 2023.</div></div>`,
    pw: { h: "You've used your 1 free STAR answer.", s: "Unlock unlimited answers to build a complete library for every role you're targeting.", cta: 'Unlock unlimited sessions →' },
  },
  {
    icon: '🧠', label: 'HM Simulator', isFree: false, moduleId: 'simulate',
    ey: 'Module 6 — Premium', title: 'Hiring Manager Simulator',
    desc: "Practice against an AI that behaves like a real hiring manager — asking follow-ups, probing weak answers, and challenging vague claims. It knows your resume and target role, so every question is contextually relevant.",
    bullets: ['Simulates a real hiring manager — not a generic question bot', 'Probes weak answers: "Can you quantify that?" "What was the hardest part?"', 'Knows your resume from memory — asks about your actual experience', 'Scores each answer and gives immediate, specific feedback on what to sharpen'],
    previewHd: 'HM Simulator · choose your interviewer',
    preview: `<div class="archetype-row">
      <div class="archetype-chip active"><span class="archetype-chip-icon">📊</span><div><div class="archetype-chip-name">Metrics-Obsessed Head of Growth</div><div class="archetype-chip-focus">Focus: Hard numbers · SQL · conversion funnels</div></div></div>
      <div class="archetype-chip"><span class="archetype-chip-icon">🚀</span><div><div class="archetype-chip-name">Visionary Founder</div><div class="archetype-chip-focus">Focus: Culture fit · big picture · first principles</div></div></div>
      <div class="archetype-chip"><span class="archetype-chip-icon">🔥</span><div><div class="archetype-chip-name">Stress-Tester</div><div class="archetype-chip-focus">Focus: High-pressure · edge cases · failure modes</div></div></div>
    </div>
    <div class="mk-chat ai" style="margin-top:4px"><strong style="color:var(--teal)">HM:</strong> Walk me through the SQL query you used to identify the drop-off. What was your p-value?</div>`,
    pw: { h: "You've used your 1 free mock interview session.", s: 'Unlock unlimited sessions to practice until every answer is sharp — before the real interview.', cta: 'Unlock unlimited sessions →' },
  },
  {
    icon: '💰', label: 'Salary Coach', isFree: false, moduleId: 'salary',
    ey: 'Module 7 — Premium', title: 'Salary Coach + Negotiation Roleplay',
    desc: 'Know your market rate before any negotiation. Live Singapore market data, AI negotiation roleplay, and multi-offer comparison. The coach already knows your level from your AI memory.',
    bullets: ['Real-time salary benchmarks by role, experience, and company size in Singapore', 'Live AI negotiation roleplay — practice the number before the real call', 'Multi-offer comparison: total comp, equity, benefits, and growth trajectory', 'AI memory means the coach already knows your current salary and target level'],
    previewHd: 'Salary Coach · negotiation prep',
    preview: `<div class="mk-lbl">Your market position · Senior PM · Singapore</div>
      <div class="mk-row"><span class="mk-l">25th percentile</span><span class="mk-v" style="color:var(--text2)">SGD 6,500/mo</span></div>
      <div class="mk-row"><span class="mk-l">Median (50th)</span><span class="mk-v">SGD 8,200/mo</span></div>
      <div class="mk-row"><span class="mk-l">Your current offer</span><span class="mk-v neg">SGD 7,500/mo — below median</span></div>
      <div class="mk-chat ai" style="margin-top:10px"><strong style="color:var(--teal)">Coach:</strong> They offered SGD 7,500. Based on your 7 years, anchor at SGD 9,000. Say: "Based on my research and the scope, I was expecting closer to SGD 9,000." Try it.</div>`,
    pw: { h: "You've used your 1 free salary coaching session.", s: "Unlock negotiation roleplay — practice your counter-offer out loud so you're ready when it matters.", cta: 'Unlock negotiation roleplay →' },
  },
  {
    icon: '📄', label: 'Cover Letter', isFree: false, moduleId: 'cover',
    ey: 'Module 8 — Premium', title: 'Cover Letter Generator',
    desc: "CareerAiHub writes a cover letter tailored to each specific role — pulling from your AI memory to reference your actual experience, match the company's language, and hit the right tone. Not a template. A letter that sounds like you.",
    bullets: ['Reads the JD and your resume from memory — no copy-pasting needed', 'Matches tone: formal for finance, direct for startups, technical for engineering', 'References your actual achievements, not generic placeholders', 'Editable in-app with tone control — adjust formality before downloading'],
    previewHd: 'Cover Letter Generator · Tech Company · Senior PM',
    preview: `<div class="mk-lbl">Generated · tone: professional · length: medium</div>
      <div class="mk-letter"><div class="mll hl w90"></div><div class="mll w100"></div><div class="mll w85"></div><div style="height:8px"></div><div class="mll w100"></div><div class="mll w100"></div><div class="mll w75"></div><div class="mll w90"></div><div style="height:8px"></div><div class="mll w100"></div><div class="mll w85"></div><div class="mll w60"></div><div style="height:8px"></div><div class="mll w50"></div></div>
      <div style="display:flex;gap:8px;margin-top:12px;align-items:center"><span style="font-size:10px;color:var(--text3)">Tone:</span><div style="flex:1;height:4px;border-radius:2px;background:var(--bg4)"><div style="width:65%;height:100%;background:var(--teal);border-radius:2px"></div></div><span style="font-size:10px;color:var(--text3)">Professional</span></div>`,
    pw: { h: "You've used your 1 free cover letter.", s: 'Unlock unlimited cover letters — one tailored letter for every role, generated in seconds.', cta: 'Unlock unlimited sessions →' },
  },
  {
    icon: '📡', label: 'Weakness Radar', isFree: false, moduleId: 'radar',
    ey: 'Module 9 — Premium', title: 'Weakness Radar',
    desc: 'AI maps your full skill profile and flags the exact gaps most likely to cost you the offer. Not generic advice — targeted intelligence built from your resume, target role, and live Singapore market demand.',
    bullets: ['6-dimension skill radar: technical, leadership, communication, execution, and more', 'Gaps ranked by impact — which ones hurt you most for your specific target role', 'Prioritised action plan: close these gaps before your next application', 'Tracks improvement across sessions as you develop new skills'],
    previewHd: 'Weakness Radar · skill gap analysis',
    preview: `<div class="mk-lbl">Skill gaps · Senior PM · Singapore</div>
      <div class="mk-row"><span class="mk-l">Product strategy</span><span class="mk-v">Strong ✓</span></div>
      <div class="mk-row"><span class="mk-l">Data analysis / SQL</span><span class="mk-v neg">Gap ⚠</span></div>
      <div class="mk-row"><span class="mk-l">Stakeholder management</span><span class="mk-v">Strong ✓</span></div>
      <div class="mk-row"><span class="mk-l">Technical depth</span><span class="mk-v neg">Gap ⚠</span></div>
      <div class="mk-chat ai" style="margin-top:10px"><strong style="color:var(--teal)">AI:</strong> Close the SQL gap first — it appears in 73% of senior PM JDs in Singapore. One project reference lifts ATS by ~8 points.</div>`,
    pw: { h: "You've used your 1 free weakness analysis.", s: 'Unlock unlimited radar scans to track improvement across every application cycle.', cta: 'Unlock weakness radar →' },
  },
  {
    icon: '🏆', label: 'Readiness Score', isFree: false, moduleId: 'score',
    ey: 'Module 10 — Premium', title: 'Job Readiness Score',
    desc: "A single composite score that tells you exactly how ready you are for your target role right now — and the 3 moves that will lift it the most. Built from your resume, ATS score, interview performance, and market fit.",
    bullets: ['Composite readiness score 0–100 across resume, interview, salary, and market fit', 'Tells you the exact 3 actions that will move the needle most', 'Updates live as you complete modules and improve your profile', 'Benchmark against other candidates at your experience level in Singapore'],
    previewHd: 'Readiness Score · composite analysis',
    preview: `<div class="mk-lbl">Overall readiness · Senior PM · Target company</div>
      <div class="mk-score" style="margin-bottom:16px"><div class="mk-track"><div class="mk-bar" style="width:74%"></div></div><span class="mk-pct">74%</span></div>
      <div class="mk-row"><span class="mk-l">Resume + ATS match</span><span class="mk-v">91%</span></div>
      <div class="mk-row"><span class="mk-l">Interview readiness</span><span class="mk-v neg">58% ↑ needs work</span></div>
      <div class="mk-row"><span class="mk-l">Salary knowledge</span><span class="mk-v neg">61% ↑ needs work</span></div>
      <div class="mk-stat-row" style="margin-top:12px">
        <div class="mk-stat"><div class="mk-stat-n">74</div><div class="mk-stat-l">Your score</div></div>
        <div class="mk-stat"><div class="mk-stat-n">+16pts</div><div class="mk-stat-l">To reach 90</div></div>
      </div>`,
    pw: { h: "You've used your 1 free readiness check.", s: 'Unlock full readiness tracking to monitor your score as you work through every module.', cta: 'Unlock readiness score →' },
  },
  {
    icon: '🌏', label: 'Market Intel', isFree: true, moduleId: 'market',
    ey: 'Module 11 — Always free', title: 'Market Intelligence',
    desc: "Live Singapore job market data — hiring velocity by company, salary benchmarks by role and level, and demand trends by skill. Know who's growing, which roles are oversupplied, and where to focus your energy.",
    bullets: ['Hiring velocity: who is growing fast, who is slowing — updated weekly', 'Salary benchmarks by role, level, and company size in Singapore', 'Skill demand trends: which skills are rising, which are declining in demand', 'Company intel: funding stage, headcount growth, recent layoffs'],
    previewHd: 'Market Intel · Singapore · live data',
    preview: `<div class="mk-lbl">Hiring velocity · Product roles · Singapore</div>
      <div class="mk-row"><span class="mk-l">Grab</span><span class="mk-v">↑ Growing fast</span></div>
      <div class="mk-row"><span class="mk-l">Sea Group</span><span class="mk-v">↑ Growing</span></div>
      <div class="mk-row"><span class="mk-l">Shopee</span><span class="mk-v neg">→ Flat</span></div>
      <div class="mk-stat-row" style="margin-top:12px">
        <div class="mk-stat"><div class="mk-stat-n">340</div><div class="mk-stat-l">PM roles open</div></div>
        <div class="mk-stat"><div class="mk-stat-n">+18%</div><div class="mk-stat-l">YoY demand</div></div>
        <div class="mk-stat"><div class="mk-stat-n">SGD 8.2K</div><div class="mk-stat-l">Median salary</div></div>
      </div>`,
    pw: null,
  },
  {
    icon: '🧬', label: 'AI Memory', isFree: false, moduleId: 'memory',
    ey: 'Module 12 — Premium', title: 'AI Memory Dashboard',
    desc: "CareerAiHub reads your resume once and seeds context to every module instantly. Your mock interview knows your target role. Your salary coach knows your level. Every session writes back — the platform compounds over time.",
    bullets: ['One-time setup — upload your resume and the AI seeds every module', 'Every module reads from shared memory — no copy-pasting between tools', 'Memory updates with every session — platform gets smarter over time', 'View, edit, and export your full AI memory profile at any time'],
    previewHd: 'AI Memory · career profile snapshot',
    preview: `<div class="mk-lbl">Memory core — seeded from your resume</div>
      <div class="mk-row"><span class="mk-l">Target role</span><span class="mk-v">Senior PM · Grab</span></div>
      <div class="mk-row"><span class="mk-l">Experience</span><span class="mk-v">7 years · product</span></div>
      <div class="mk-row"><span class="mk-l">ATS score</span><span class="mk-v">91% ↑ from 38%</span></div>
      <div class="mk-row"><span class="mk-l">Sessions logged</span><span class="mk-v">12 across 6 modules</span></div>
      <div class="mk-stat-row" style="margin-top:12px">
        <div class="mk-stat"><div class="mk-stat-n">6</div><div class="mk-stat-l">Modules active</div></div>
        <div class="mk-stat"><div class="mk-stat-n">12</div><div class="mk-stat-l">Sessions logged</div></div>
        <div class="mk-stat"><div class="mk-stat-n">+34%</div><div class="mk-stat-l">Score delta</div></div>
      </div>`,
    pw: { h: 'Unlock your full AI memory dashboard.', s: 'See every data point the AI knows about you — and edit it anytime to keep every module in sync.', cta: 'Unlock full memory →' },
  },
];

const FAQ_DATA = [
  { q: 'What is CareerAiHub and how is it different from LinkedIn?', a: "CareerAiHub owns professional execution — the active, AI-guided layer that turns a static LinkedIn profile into a verified, interview-ready, AI-matched candidate. LinkedIn owns professional identity. We complete it, not compete with it. CareerAiHub has 10 AI modules across 4 layers at $19/month, replacing 5 tools costing $175+/month." },
  { q: 'How does the AI memory work across all 10 modules?', a: 'Upload your resume once at onboarding. The AI memory core reads it and seeds context to every module instantly. Your mock interview knows your target role. Your Salary Coach knows your experience level. Your cover letter knows your latest resume version. Every session writes back to the core — compounding switching costs no point solution can replicate.' },
  { q: 'Is the ATS resume scanner accurate for Singapore job applications?', a: "Yes — CareerAiHub scores your resume against the specific job description you're applying to, not generic templates. Users consistently see ATS scores jump from under 40% to above 85% in a single session. The scanner shows exactly which keywords are missing, which sections need work, and which changes will have the biggest impact on your score." },
  { q: 'Can I try CareerAiHub free without a credit card?', a: "Yes. The free tier includes 1 ATS resume scan, 1–2 uses per module, and unlimited access to the job search engine and market intelligence. No credit card required. Premium is $19/month or $180/year — replacing $175+/month of separate tools, saving $156/month." },
  { q: 'What is the Hiring Manager Simulator?', a: "The HM Simulator is an AI that behaves like a real hiring manager — asking follow-up questions, probing vague answers, and challenging unsupported claims. Unlike generic interview bots, it knows your resume and target role from your AI memory, making every question contextually relevant to your actual background." },
  { q: 'Is CareerAiHub only for Singapore?', a: "Not at all — CareerAiHub is built for every English-speaking professional. Singapore is our launch market because it is the ideal environment: high digital maturity, English as the dominant business language, and a concentration of ambitious professionals at every career stage. From Singapore, we expand across Southeast Asia, then into Australia, the UK, Canada, and the USA. Wherever you are, if you are navigating a job search in English, CareerAiHub works for you." },
];

// ── HOOKS ─────────────────────────────────────────────────────────────────────

function useTypewriter(phrases) {
  const [text, setText] = useState('');
  const state = useRef({ pi: 0, ci: 0, deleting: false });
  useEffect(() => {
    let timer;
    const tick = () => {
      const { pi, ci, deleting } = state.current;
      const phrase = phrases[pi];
      const next = deleting ? phrase.substring(0, ci - 1) : phrase.substring(0, ci + 1);
      setText(next);
      if (!deleting && next === phrase) { timer = setTimeout(() => { state.current.deleting = true; tick(); }, 1800); return; }
      if (deleting && next === '') { state.current = { pi: (pi + 1) % phrases.length, ci: 0, deleting: false }; timer = setTimeout(tick, 300); return; }
      state.current = { pi, ci: deleting ? ci - 1 : ci + 1, deleting };
      timer = setTimeout(tick, deleting ? 38 : 72);
    };
    const init = setTimeout(tick, 600);
    return () => { clearTimeout(timer); clearTimeout(init); };
  }, []);
  return text;
}

function useCounter(target, scale = 1, started = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!started) return;
    const real = target / scale, dur = 1500, startTs = performance.now();
    let raf;
    const tick = (now) => {
      const prog = Math.min((now - startTs) / dur, 1);
      const ease = 1 - Math.pow(1 - prog, 3);
      setVal(real * ease);
      if (prog < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started]);
  return val;
}

function useScrollReveal(rootRef) {
  useEffect(() => {
    const el = rootRef?.current || document;
    const targets = el.querySelectorAll('.reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('up'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    targets.forEach(t => io.observe(t));
    return () => io.disconnect();
  }, []);
}

// ── SUBCOMPONENTS ─────────────────────────────────────────────────────────────

function StatBox({ stat, started }) {
  const val = useCounter(stat.value, stat.scale || 1, started);
  const real = stat.value / (stat.scale || 1);
  const display = Number.isInteger(real) ? Math.round(val) : val.toFixed(1);
  return (
    <div className="stt">
      <div className={`stt-n ${stat.cls}`}>{stat.prefix || ''}{display}{stat.suffix || ''}</div>
      <div className="stt-l">{stat.label}</div>
    </div>
  );
}

export const LogoMark = ({ size = 28 }) => (
  <OrbitMark size={size} animated duration={18} />
);

// ── NAV ───────────────────────────────────────────────────────────────────────

// Maps moduleId → FEAT_DATA tab index for the feature demo modal
export const NAV_FEAT_MAP = {
  jobs: 0, scan: 1, ats: 2, jd: 3, star: 4, simulate: 5,
  salary: 6, cover: 7, radar: 8, score: 9, market: 10, memory: 11,
};

export const NAV_CATEGORIES = [
  {
    icon: '🔍', label: 'Job Search', tag: 'Free',
    tools: [
      { icon: '🔎', label: 'Job Search',   sub: 'Browse & track open roles',      moduleId: 'jobs'   },
      { icon: '🌏', label: 'Market Intel',  sub: 'Salary & hiring demand data',    moduleId: 'market' },
    ],
  },
  {
    icon: '🎯', label: 'Get Seen',
    tools: [
      { icon: '⚡', label: 'Resume Scan',   sub: 'ATS score & issue flags',        moduleId: 'scan'  },
      { icon: '✨', label: 'ATS Builder',   sub: 'Rebuild resume for keywords',    moduleId: 'ats'   },
      { icon: '🔍', label: 'JD Analyzer',   sub: 'Decode any job description',     moduleId: 'jd'    },
      { icon: '📄', label: 'Cover Letter',  sub: 'AI-written, role-tailored',      moduleId: 'cover' },
    ],
  },
  {
    icon: '✅', label: 'Get Ready', tag: 'Pro',
    tools: [
      { icon: '📡', label: 'Weakness Radar',  sub: 'Find gaps before they do',       moduleId: 'radar'  },
      { icon: '🏆', label: 'Readiness Score', sub: 'How ready are you, really',      moduleId: 'score'  },
      { icon: '⭐', label: 'STAR Builder',    sub: 'Structure your stories',         moduleId: 'star'   },
      { icon: '🧬', label: 'AI Memory',       sub: 'Your career intelligence layer', moduleId: 'memory' },
    ],
  },
  {
    icon: '🏆', label: 'Get the Offer',
    tools: [
      { icon: '🧠', label: 'HM Simulator', sub: 'Mock hiring manager interview', moduleId: 'simulate' },
    ],
  },
  {
    icon: '💰', label: 'Get Paid',
    tools: [
      { icon: '💰', label: 'Salary Coach', sub: 'Negotiate what you deserve', moduleId: 'salary' },
    ],
  },
];

// 3-column megamenu arrangement
const MEGA_COLS = [
  [NAV_CATEGORIES[0], NAV_CATEGORIES[3]], // Job Search + Get the Offer
  [NAV_CATEGORIES[1], NAV_CATEGORIES[4]], // Get Seen + Get Paid
  [NAV_CATEGORIES[2]],                    // Get Ready
];

export function NavFeatMenu({ onFeatOpen }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div className="lp-ncd" ref={ref}>
      <button
        className={`lp-nl lp-ncd-trigger${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        Features
        <span className="lp-ncd-caret" />
      </button>
      {open && (
        <div className="lp-feat-mega">
          {MEGA_COLS.map((col, ci) => (
            <div key={ci} className="lp-feat-mega-col">
              {col.map((cat, gi) => (
                <div key={gi} className={`lp-feat-mega-group${gi > 0 ? ' lp-feat-mega-group-sep' : ''}`}>
                  <div className="lp-feat-mega-head">
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    {cat.tag && <span className={`lp-ncd-tag ${cat.tag === 'Free' ? 'free' : 'pro'}`}>{cat.tag}</span>}
                  </div>
                  {cat.tools.map((t, ti) => (
                    <button
                      key={ti}
                      className="lp-ncd-item"
                      onClick={() => { onFeatOpen(t.moduleId); setOpen(false); }}
                    >
                      <span className="lp-ncd-item-icon">{t.icon}</span>
                      <div>
                        <div className="lp-ncd-item-label">{t.label}</div>
                        {t.sub && <div className="lp-ncd-item-sub">{t.sub}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function NavCategoryDropdown({ cat, onNavigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="lp-ncd" ref={ref}>
      <button
        className={`lp-nl lp-ncd-trigger${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        {cat.label}
        {cat.tag && <span className={`lp-ncd-tag ${cat.tag === 'Free' ? 'free' : 'pro'}`}>{cat.tag}</span>}
        <span className="lp-ncd-caret" />
      </button>
      {open && (
        <div className="lp-ncd-panel">
          <div className="lp-ncd-panel-head">{cat.icon} {cat.label}</div>
          {cat.tools.map((t, i) => (
            <button
              key={i}
              className="lp-ncd-item"
              onClick={() => { onNavigate(t.moduleId); setOpen(false); }}
            >
              <span className="lp-ncd-item-icon">{t.icon}</span>
              <div>
                <div className="lp-ncd-item-label">{t.label}</div>
                {t.sub && <div className="lp-ncd-item-sub">{t.sub}</div>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NavBar({ onSignIn, onJoin, scrolled, lightMode, onToggleLightMode, onFeatOpen }) {
  const ss = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return (
    <nav className={`lp-nav${scrolled ? ' scrolled' : ''}`}>
      <button className="lp-nav-logo">
        <LogoMark />
        <span className="lp-wordmark">career<span className="lp-wordmark-ai">ai</span>hub</span>
      </button>
      <div className="lp-nav-center">
        <NavFeatMenu onFeatOpen={onFeatOpen} />
        <button className="lp-nl" onClick={() => ss('price-sec')}>Pricing</button>
        <button className="lp-nl" onClick={() => ss('faq-sec')}>FAQ</button>
      </div>
      <div className="lp-nav-r">
        <button className="lp-btn-lmode" onClick={onToggleLightMode} title={lightMode ? 'Switch to dark mode' : 'Switch to light mode'}>{lightMode ? '🌙' : '☀️'}</button>
        <button className="lp-btn-si" onClick={onSignIn}>Sign In</button>
        <button className="lp-btn-join" onClick={onJoin}>✦ Join Free</button>
      </div>
    </nav>
  );
}

export function GuestNav({ onSignIn, onJoin, onHome }) {
  return (
    <nav className="lp-nav scrolled">
      <button className="lp-nav-logo" onClick={onHome}>
        <LogoMark />
        <span className="lp-wordmark">career<span className="lp-wordmark-ai">ai</span>hub</span>
      </button>
      <div className="lp-nav-r">
        <button className="lp-btn-si" onClick={onSignIn}>Sign In</button>
        <button className="lp-btn-join" onClick={onJoin}>✦ Join Free</button>
      </div>
    </nav>
  );
}

// ── APP HUB NAV (same pill style as HubNav, with tool dropdowns) ──────────────

function AppHubPill({ cat, activeModule, onNavigate }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const isActive = cat.tools.some(t => t.moduleId === activeModule);

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 8, left: r.left + r.width / 2 });
    }
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (btnRef.current && btnRef.current.contains(e.target)) return;
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        className={`lp-hub-pill${isActive ? ' on' : ''}${cat.tag === 'Pro' ? ' ready' : ''}`}
        onClick={handleOpen}
      >
        <span style={{ fontSize: 15 }}>{cat.icon}</span>
        <span className="lp-hub-pill-label">{cat.label}</span>
        {cat.tag === 'Free' && <span className="lp-hub-pill-sub">Always free</span>}
        {cat.tag === 'Pro' && <span className="lp-hub-pill-badge">Pro</span>}
      </button>
      {open && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div
          ref={panelRef}
          className="lp-ncd-panel"
          style={{ position: 'fixed', top: pos.top, left: pos.left, transform: 'translateX(-50%)', minWidth: 220, zIndex: 9999 }}
        >
          <div className="lp-ncd-panel-head">{cat.icon} {cat.label}</div>
          {cat.tools.map((t, i) => (
            <button
              key={i}
              className="lp-ncd-item"
              style={ t.moduleId === activeModule ? { background: 'rgba(0,212,255,.1)' } : {} }
              onClick={() => { onNavigate(t.moduleId); setOpen(false); }}
            >
              <span className="lp-ncd-item-icon">{t.icon}</span>
              <div>
                <div className="lp-ncd-item-label">{t.label}</div>
                {t.sub && <div className="lp-ncd-item-sub">{t.sub}</div>}
              </div>
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

export function AppHubNav({ activeModule, onNavigate }) {
  return (
    <div className="lp-hub-nav">
      {NAV_CATEGORIES.map((cat, i) => (
        <AppHubPill key={i} cat={cat} activeModule={activeModule} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

// ── PILLS ─────────────────────────────────────────────────────────────────────

export const PILLS = [
  { icon: '🔎', label: 'Job Search',      moduleId: 'jobs'     },
  { icon: '⚡', label: 'Resume Scan',     moduleId: 'scan'     },
  { icon: '✨', label: 'ATS Builder',     moduleId: 'ats'      },
  { icon: '🔍', label: 'JD Analyzer',     moduleId: 'jd'       },
  { icon: '⭐', label: 'STAR Builder',    moduleId: 'star'     },
  { icon: '🧠', label: 'HM Simulator',   moduleId: 'simulate' },
  { icon: '💰', label: 'Salary Coach',   moduleId: 'salary'   },
  { icon: '📄', label: 'Cover Letter',   moduleId: 'cover'    },
  { icon: '📡', label: 'Weakness Radar', moduleId: 'radar'    },
  { icon: '🏆', label: 'Readiness Score',moduleId: 'score'    },
  { icon: '🌏', label: 'Market Intel',   moduleId: 'market'   },
  { icon: '🧬', label: 'AI Memory',      moduleId: 'memory'   },
];

export function ModulePills({ active, setActive }) {
  return (
    <div className="lp-mod-nav">
      {PILLS.map((p, i) => (
        <button key={i} className={`lp-mpill${active === i ? ' on' : ''}`} onClick={() => setActive(i)}>
          <span className="lp-mi">{p.icon}</span>{p.label}
        </button>
      ))}
    </div>
  );
}

// ── HUB NAV ───────────────────────────────────────────────────────────────────

const HUB_GROUPS = [
  { icon: '🎯', label: 'Get Seen', sub: 'Application layer', tools: [
    { icon: '⚡', label: 'Resume Scan', moduleId: 'scan' },
    { icon: '✦', label: 'ATS Builder', moduleId: 'ats' },
    { icon: '🔎', label: 'JD Analyzer', moduleId: 'jd' },
    { icon: '📄', label: 'Cover Letter', moduleId: 'cover' },
  ]},
  { icon: '🏆', label: 'Get the Offer', sub: 'Interview & prep', tools: [
    { icon: '⭐', label: 'STAR Builder', moduleId: 'star' },
    { icon: '🧠', label: 'HM Simulator', moduleId: 'simulate' },
  ]},
  { icon: '💰', label: 'Get Paid', sub: 'Negotiate & track', tools: [
    { icon: '💰', label: 'Salary Coach', moduleId: 'salary' },
    { icon: '📋', label: 'App Tracker', moduleId: '__tracker__' },
  ]},
];

const ALL_TOOLS_LIST = [
  { icon: '⚡', label: 'Resume Scan', moduleId: 'scan' },
  { icon: '✦', label: 'ATS Builder', moduleId: 'ats' },
  { icon: '🔎', label: 'JD Analyzer', moduleId: 'jd' },
  { icon: '⭐', label: 'STAR Builder', moduleId: 'star' },
  { icon: '🧠', label: 'HM Simulator', moduleId: 'simulate' },
  { icon: '💰', label: 'Salary Coach', moduleId: 'salary' },
  { icon: '📄', label: 'Cover Letter', moduleId: 'cover' },
  { icon: '📋', label: 'App Tracker', moduleId: '__tracker__' },
  { icon: '📡', label: 'Weakness Radar', moduleId: 'radar' },
  { icon: '🏆', label: 'Readiness Score', moduleId: 'score' },
  { icon: '🌏', label: 'Market Intel', moduleId: 'market' },
  { icon: '🧬', label: 'AI Memory', moduleId: 'memory' },
];

function LandingHubPill({ cat, activeIdx, myIdx, setActive, onFeatModal, onGetReady, onModuleSelect }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const isReady = cat.tag === 'Pro';
  const isFree  = cat.tag === 'Free';

  const handleClick = () => {
    if (isReady) { setActive(myIdx); onGetReady?.(); return; }
    if (isFree)  { setActive(myIdx); onModuleSelect?.('jobs'); return; }
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 8, left: r.left + r.width / 2 });
    }
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      if (panelRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        className={`lp-hub-pill${activeIdx === myIdx ? ' on' : ''}${isReady ? ' ready' : ''}`}
        onClick={handleClick}
      >
        <span style={{ fontSize: 15 }}>{cat.icon}</span>
        <span className="lp-hub-pill-label">{cat.label}</span>
        {isFree  && <span className="lp-hub-pill-sub">Always free</span>}
        {isReady && <span className="lp-hub-pill-badge">Pro</span>}
      </button>
      {open && ReactDOM.createPortal(
        <div
          ref={panelRef}
          className="lp-ncd-panel"
          style={{ position:'fixed', top:pos.top, left:pos.left, transform:'translateX(-50%)', minWidth:220, zIndex:9999 }}
        >
          <div className="lp-ncd-panel-head">{cat.icon} {cat.label}</div>
          {cat.tools.map((t, i) => (
            <button
              key={i}
              className="lp-ncd-item"
              onClick={() => { onModuleSelect?.(t.moduleId); setOpen(false); setActive(myIdx); }}
            >
              <span className="lp-ncd-item-icon">{t.icon}</span>
              <div>
                <div className="lp-ncd-item-label">{t.label}</div>
                {t.sub && <div className="lp-ncd-item-sub">{t.sub}</div>}
              </div>
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

export function HubNav({ onModuleSelect, onTrackerOpen, onGetReady, onFeatModal }) {
  const [active, setActive] = useState(0);

  return (
    <div className="lp-hub-nav">
      {NAV_CATEGORIES.map((cat, i) => (
        <LandingHubPill
          key={i}
          cat={cat}
          myIdx={i}
          activeIdx={active}
          setActive={setActive}
          onFeatModal={onFeatModal}
          onGetReady={onGetReady}
          onModuleSelect={onModuleSelect}
        />
      ))}
    </div>
  );
}

// ── TRANSIT BANNER ───────────────────────────────────────────────────────────

function TransitBanner() {
  return (
    <div className="lp-transit">
      <span className="lp-transit-pulse" />
      <span className="lp-transit-label">Career Market Signal</span>
      <span className="lp-transit-sep">·</span>
      <span className="lp-transit-phase">Current Phase: Expansion</span>
      <span className="lp-transit-sep">·</span>
      <span className="lp-transit-desc">Hiring Velocity High — Singapore tech roles up 18% YoY</span>
      <span className="lp-transit-sep">·</span>
      <span className="lp-transit-cta">Opportunity window: Apply now, market favours candidates</span>
    </div>
  );
}

// ── TICKER ────────────────────────────────────────────────────────────────────

const TICKER_ITEMS = ['✦ 10 AI modules active', 'Market Signal: Expansion Phase — Hiring velocity high in Tech & Fintech SG', 'Job search & market intel — always free', 'Premium — $19/month · save $156/mo vs separate tools', 'ATS resume scanner Singapore', 'AI mock interview coach'];

export function TickerBar() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="lp-ticker">
      <div className="lp-ticker-t">
        {items.map((t, i) => (
          <React.Fragment key={i}>
            <span className="lp-tseg">{t}</span>
            <span className="lp-tdiv"> · </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ── ATS INTERCEPT per job card ────────────────────────────────────────────────

function AtsIntercept({ jobId, role, company, link, state, onApply, onClose, onOpenImprove }) {
  const circleRef = useRef(null);

  useEffect(() => {
    if (state?.loading === false && state?.score && circleRef.current) {
      let cur = 0;
      const target = state.score;
      const interval = setInterval(() => {
        cur = Math.min(cur + Math.ceil(target / 20), target);
        if (circleRef.current) circleRef.current.textContent = cur + '%';
        if (cur >= target) clearInterval(interval);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [state?.loading, state?.score]);

  if (!state?.show) return null;

  return (
    <div className="ats-intercept show">
      <div className="ats-int-hd">
        <div>
          <div className="ats-int-title">ATS Score Check — {role}</div>
          <div className="ats-int-subtitle">Most ATS systems filter 7 in 10 resumes before a human reads them</div>
        </div>
        <button className="ats-int-close" onClick={() => onClose(jobId)}>✕</button>
      </div>
      <div className="ats-int-body">
        {state.loading ? (
          <div className="ats-int-loading">
            <div className="res-spinner" />
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Scanning your resume against this role...</div>
              <div className="ats-int-bar"><div className="ats-int-bar-fill" style={{ width: '85%' }} /></div>
            </div>
          </div>
        ) : (
          <>
            <div className="ats-int-score-row">
              <div className={`ats-int-score-circle ${state.level}`} ref={circleRef}>0%</div>
              <div className="ats-int-verdict">
                <div className="ats-int-verdict-title">
                  {state.level === 'good' ? "Strong match — you're ready to apply" : state.level === 'mid' ? 'A few gaps — worth a quick fix' : 'Resume needs work for this role'}
                </div>
                <div className="ats-int-verdict-sub">
                  {state.level === 'good'
                    ? 'Your resume passes this ATS filter. Apply with confidence, or fine-tune a few keywords to push your score even higher.'
                    : state.level === 'mid'
                    ? 'Your resume partially matches this role. Closing the keyword gaps below could significantly increase your chance of a phone screen.'
                    : 'Your resume is likely to be filtered out before a recruiter reads it. Add the missing keywords below before applying.'}
                </div>
                <div className="ats-stat-highlight">
                  {state.level === 'good' ? '✓ Resume passes ATS filter for this role' : '⬤ Fixing these gaps increases phone screen rate by up to 3×'}
                </div>
              </div>
            </div>
            <div className="ats-int-kw">
              <div className="ats-int-kw-label">Keywords matched</div>
              <div style={{ marginBottom: 10 }}>{state.kws.found.slice(0, 3).map(k => <span key={k} className="mk-tag m">{k}</span>)}</div>
              <div className="ats-int-kw-label">Missing — add these to improve score</div>
              <div>{state.kws.missing.slice(0, 4).map(k => <span key={k} className="mk-tag x">{k}</span>)}</div>
            </div>
            <div className="ats-int-cta">
              {state.level === 'good' ? (
                <>
                  <button className="ats-int-primary" onClick={() => onApply(jobId, role, company, link)}>Apply now →</button>
                  <button className="ats-int-secondary" onClick={() => onOpenImprove(jobId)}>Fine-tune keywords</button>
                  <button className="ats-int-skip" onClick={() => onClose(jobId)}>Close</button>
                </>
              ) : (
                <>
                  <button className="ats-int-primary" onClick={() => onOpenImprove(jobId)}>✦ Fix it — improve score</button>
                  <button className="ats-int-secondary" onClick={() => onApply(jobId, role, company, link)}>Apply anyway →</button>
                  <button className="ats-int-skip" onClick={() => onClose(jobId)}>Skip</button>
                </>
              )}
            </div>
            {state.showImprove && (
              <div className="ats-improve show">
                <div className="ats-improve-title">How to add these keywords naturally</div>
                {state.kws.missing.slice(0, 4).map((kw, i) => (
                  <div key={i} className="ats-improve-tip">
                    <span className="ats-improve-num">{i + 1}</span>
                    <span>Add <strong style={{ color: 'var(--lp-text)' }}>"{kw}"</strong> — mention a specific example in your experience or skills section</span>
                  </div>
                ))}
                <button className="ats-rescan" onClick={() => { onClose(jobId); document.getElementById('feat-sec')?.scrollIntoView({ behavior: 'smooth' }); }}>
                  ✦ Re-scan after edits — open ATS Builder →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── SEARCH CARD ───────────────────────────────────────────────────────────────

function SearchCard({ onJoin, onModuleSelect, onTrackerOpen, onSnack, onAgenticCta }) {
  const [jobQ, setJobQ] = useState('');
  const [locQ, setLocQ] = useState('Singapore');
  const [exp, setExp] = useState('Any level');
  const [jobType, setJobType] = useState('All types');
  const [kw, setKw] = useState('');
  const [acItems, setAcItems] = useState([]);
  const [acOpen, setAcOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [resCount, setResCount] = useState('');
  const [resOpen, setResOpen] = useState(false);
  const [atsMap, setAtsMap] = useState({});
  const [ms1, setMs1] = useState(306);
  const [appCount, setAppCount] = useState(0);
  const [liveCount, setLiveCount] = useState(512);

  useEffect(() => {
    let v = 512, dir = 1;
    const t = setInterval(() => {
      const delta = Math.floor(Math.random() * 3) + 1;
      v += dir * delta; if (v >= 750) dir = -1; if (v <= 480) dir = 1;
      setLiveCount(v);
    }, 3800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const refresh = () => {
      try { setAppCount(JSON.parse(localStorage.getItem(STORE_KEY) || '[]').length); } catch { setAppCount(0); }
    };
    refresh();
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);

  useEffect(() => {
    let v = 306, dir = 1;
    const t = setInterval(() => {
      v += dir * (Math.floor(Math.random() * 3) + 1);
      if (v > 360) dir = -1; if (v < 300) dir = 1;
      setMs1(v);
    }, 3200);
    return () => clearInterval(t);
  }, []);

  const showAc = (val) => {
    if (!val || val.length < 2) { setAcItems([]); setAcOpen(false); return; }
    const f = AC_DATA.filter(d => d.title.toLowerCase().includes(val.toLowerCase())).slice(0, 5);
    setAcItems(f); setAcOpen(f.length > 0);
  };
  const pickAc = (title) => { setJobQ(title); setAcOpen(false); };
  const hideAc = () => setTimeout(() => setAcOpen(false), 160);

  const logApp = (role, company, url) => {
    const stored = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    if (!stored.find(a => a.role === role && a.company === company)) {
      stored.unshift({ id: Date.now().toString(), role, company, url, source: 'Job Search', status: 'applied', date: new Date().toISOString(), notes: '' });
      localStorage.setItem(STORE_KEY, JSON.stringify(stored));
      setAppCount(stored.length);
      onSnack?.('Application logged: ' + role);
    }
  };

  const applyNow = (jobId, role, company, link) => {
    logApp(role, company, link);
    if (link && link !== '#') window.open(link, '_blank', 'noopener');
  };

  const toggleAts = async (jobId, role, company, link) => {
    setAtsMap(prev => {
      const cur = prev[jobId];
      if (cur?.show && !cur?.loading) return { ...prev, [jobId]: { show: false } };
      return { ...prev, [jobId]: { show: true, loading: true } };
    });
    await new Promise(r => setTimeout(r, 1600));
    const kws = getKwSet(role);
    const score = Math.min(91, Math.max(32, 42 + Math.floor(Math.random() * 35)));
    const level = score >= 75 ? 'good' : score >= 50 ? 'mid' : 'low';
    setAtsMap(prev => ({ ...prev, [jobId]: { show: true, loading: false, score, level, role, company, link, kws, showImprove: false } }));
  };

  const closeAts = (jobId) => setAtsMap(prev => ({ ...prev, [jobId]: { show: false } }));
  const openImprove = (jobId) => setAtsMap(prev => ({ ...prev, [jobId]: { ...prev[jobId], showImprove: true } }));

  const runSearch = async () => {
    const title = jobQ.trim() || 'Product Manager';
    const loc = locQ.trim() || 'Singapore';
    setSearching(true); setResOpen(true);
    setResults([{ type: 'loading' }]); setResCount('');

    const appId = import.meta.env.VITE_ADZUNA_APP_ID;
    const appKey = import.meta.env.VITE_ADZUNA_APP_KEY;
    const adzunaReady = appId && appId !== 'your_app_id';

    if (adzunaReady) {
      try {
        const country = loc.toLowerCase().includes('singapore') ? 'sg' : 'gb';
        const expMap = { 'Entry level': 1, 'Mid level': 3, 'Senior': 5, 'Director+': 10 };
        const minSal = expMap[exp] ? `&salary_min=${expMap[exp] * 12000}` : '';
        const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&what=${encodeURIComponent(title)}&where=${encodeURIComponent(loc)}&results_per_page=6&sort_by=date&content-type=application/json${minSal}`;
        const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!resp.ok) throw new Error('adzuna ' + resp.status);
        const data = await resp.json();
        const jobs = data.results || [];
        if (!jobs.length) throw new Error('no results');
        setResCount(`${(data.count || 0).toLocaleString()} live results · Showing top ${jobs.length}`);
        setResults(jobs.map((j, i) => ({
          type: 'job', id: `job-${Date.now()}-${i}`,
          role: j.title || title,
          company: j.company?.display_name || 'Company',
          location: j.location?.display_name || loc,
          link: j.redirect_url || '#',
          salary: j.salary_min ? `SGD ${Math.round(j.salary_min / 12).toLocaleString()}–${Math.round(j.salary_max / 12).toLocaleString()}/mo` : '',
          ago: j.created ? timeAgo(new Date(j.created)) : '',
          desc: j.description ? j.description.replace(/<[^>]+>/g, '').slice(0, 120) + '...' : '',
          emoji: EMOJIS[i % EMOJIS.length],
        })));
      } catch {
        setResCount(`Results for "${title}" in ${loc}`);
        setResults([{ type: 'fallback', title, location: loc }]);
      }
    } else {
      await new Promise(r => setTimeout(r, 800));
      setResCount(`Results for "${title}" in ${loc}`);
      setResults([{ type: 'fallback', title, location: loc }]);
    }
    setSearching(false);
    setTimeout(() => document.getElementById('searchResults')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300);
  };

  const fallbackLinks = (title, loc) => {
    const q = encodeURIComponent(title), l = encodeURIComponent(loc);
    return [
      { id: `fb-0`, role: `${title} roles on Indeed`, company: 'Indeed', location: loc, link: `https://www.indeed.com/jobs?q=${q}&l=${l}&sort=date`, salary: '', ago: '', desc: '', emoji: '🔍', type: 'job' },
      { id: `fb-1`, role: `${title} roles on LinkedIn`, company: 'LinkedIn Jobs', location: loc, link: `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${l}`, salary: '', ago: '', desc: '', emoji: '💼', type: 'job' },
      { id: `fb-2`, role: `${title} roles on JobStreet`, company: 'JobStreet · Southeast Asia', location: loc, link: `https://www.jobstreet.com.sg/en/job-search/${encodeURIComponent(title.toLowerCase().replace(/ /g, '-'))}-jobs/`, salary: '', ago: '', desc: '', emoji: '🏬', type: 'job' },
      { id: `fb-3`, role: `${title} roles on MyCareersFuture`, company: 'MyCareersFuture · Singapore', location: loc, link: `https://www.mycareersfuture.gov.sg/search?search=${q}&sortBy=new_posting_date`, salary: '', ago: '', desc: '', emoji: '🏦', type: 'job' },
    ];
  };

  const renderedResults = results[0]?.type === 'fallback'
    ? fallbackLinks(results[0].title, results[0].location)
    : results.filter(r => r.type === 'job');

  return (
    <div className="hero-right">
      <div className="search-card-label">Find your next role — AI-ranked from 20+ platforms, free</div>
      <div className="search-card">
        <div className="search-card-hd">
          <div className="search-card-title"><span className="search-card-dot" />Job Search</div>
          <span className="search-card-badge">Always Free</span>
        </div>
        <div className="market-signals">
          <div className="ms-pill">
            <div className="ms-top"><span className="ms-val">{ms1}</span><span className="ms-live">live</span></div>
            <span className="ms-lbl">open roles in Singapore</span>
          </div>
          <div className="ms-pill">
            <div className="ms-top"><span className="ms-val">SGD 8.2K</span><span className="ms-live">live</span></div>
            <span className="ms-lbl">median salary</span>
          </div>
          <div className="ms-pill">
            <div className="ms-top"><span className="ms-val">+18%</span><span className="ms-live">↑ YoY</span></div>
            <span className="ms-lbl">hiring velocity</span>
          </div>
        </div>
        <div className="sc-live-bar">
          <span className="sc-live-dot" />
          <span className="sc-live-text"><strong>{liveCount.toLocaleString()}</strong> job seekers active · <strong>2,400+</strong> resumes analyzed</span>
        </div>
        <div className="search-body">
          <div className="fg2">
            <div className="ac-wrap">
              <div className="flbl">Job title</div>
              <input className="fin" placeholder="e.g. Senior Product Manager" value={jobQ}
                onChange={e => { setJobQ(e.target.value); showAc(e.target.value); }}
                onBlur={hideAc} autoComplete="off" />
              <div className={`ac-dropdown${acOpen ? ' show' : ''}`}>
                {acItems.map((d, i) => (
                  <div key={i} className="ac-item" onMouseDown={() => pickAc(d.title)}>
                    <div><div className="ac-item-title">{d.title}</div><div className="ac-item-meta">{d.meta}</div></div>
                    <div className="ac-item-sal">{d.sal}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flbl">Location</div>
              <input className="fin" value={locQ} onChange={e => setLocQ(e.target.value)} />
            </div>
          </div>
          <div className="fg3">
            <div>
              <div className="flbl">Experience</div>
              <select className="fsel" value={exp} onChange={e => setExp(e.target.value)}>
                <option>Any level</option><option>Entry level</option><option>Mid level</option><option>Senior</option><option>Director+</option>
              </select>
            </div>
            <div>
              <div className="flbl">Type</div>
              <select className="fsel" value={jobType} onChange={e => setJobType(e.target.value)}>
                <option>All types</option><option>Full-time</option><option>Contract</option><option>Internship</option>
              </select>
            </div>
            <div>
              <div className="flbl">Keywords</div>
              <input className="fin" placeholder="React, B2B..." value={kw} onChange={e => setKw(e.target.value)} />
            </div>
          </div>
          <button className="fbtn" disabled={searching} onClick={runSearch}>
            {searching ? 'Searching...' : '🔍 Search with AI'}
          </button>
        </div>
        <div className="search-sub-btns">
          <button className="ssb" onClick={onTrackerOpen}>📋 App Tracker {appCount > 0 && <span style={{ background: 'var(--lp-teal)', color: '#08090D', borderRadius: 10, fontSize: 10, fontWeight: 800, padding: '1px 5px', marginLeft: 3 }}>{appCount}</span>}</button>
          <button className="ssb" onClick={() => onModuleSelect?.('salary')}>💰 Salary Intel</button>
          <button className="ssb" onClick={() => onModuleSelect?.('market')}>📈 Market Intel</button>
        </div>
        <div className={`search-results${resOpen ? ' open' : ''}`} id="searchResults">
          <div className="results-inner">
            <div className="results-hd">
              <div className="results-hd-title"><span className="results-hd-dot" />AI-ranked results</div>
              <span className="results-count">{resCount}</span>
            </div>
            {results[0]?.type === 'loading' ? (
              <div className="res-loading"><div className="res-spinner" /><span>Searching live jobs across 20+ platforms...</span></div>
            ) : (
              <>
                {results[0]?.type === 'fallback' && (
                  <div className="res-redirect">
                    <div className="res-redirect-icon">🔍</div>
                    <div>
                      <div className="res-redirect-title">Live jobs across 20+ platforms</div>
                      <div className="res-redirect-sub">Apply from here to track your application automatically. Check ATS score before applying.</div>
                    </div>
                  </div>
                )}
                {renderedResults.map((job) => (
                  <div key={job.id} className="result-item">
                    <div className="result-item-top">
                      <div className="result-logo">{job.emoji}</div>
                      <div className="result-body">
                        <div className="result-role">{job.role}</div>
                        <div className="result-company">{job.company} · {job.location}</div>
                        <div className="result-meta">
                          {job.salary && <span className="result-sal">{job.salary}</span>}
                          <span className="result-type">Full-time</span>
                          {job.ago && <span className="result-ago">{job.ago}</span>}
                        </div>
                      </div>
                    </div>
                    {job.desc && <div className="result-desc-strip">{job.desc}</div>}
                    <div className="result-actions">
                      <button className="btn-apply-now" onClick={() => applyNow(job.id, job.role, job.company, job.link)}>Apply now →</button>
                      <button className={`btn-ats-check${atsMap[job.id]?.show ? ' active' : ''}`} onClick={() => toggleAts(job.id, job.role, job.company, job.link)}>✦ Check ATS first</button>
                      <button className="btn-skip-apply" onClick={() => applyNow(job.id, job.role, job.company, job.link)}>Skip and apply anyway ↗</button>
                    </div>
                    <AtsIntercept
                      jobId={job.id} role={job.role} company={job.company} link={job.link}
                      state={atsMap[job.id]}
                      onApply={applyNow} onClose={closeAts} onOpenImprove={openImprove}
                    />
                  </div>
                ))}
                {results[0]?.type === 'fallback' && (
                  <div className="api-setup-hint">
                    <span className="api-hint-icon">⚡</span>
                    <span>Want inline AI-ranked results? <a href="https://developer.adzuna.com" target="_blank" rel="noopener noreferrer" className="api-hint-link">Get your free Adzuna API key</a> — takes 2 minutes.</span>
                  </div>
                )}
                {renderedResults.length > 0 && (
                  <div className="results-nudge">
                    <div className="rn-text"><strong>Sign up free</strong> to unlock your full AI fit score and salary intel for every role</div>
                    <button className="rn-btn" onClick={onJoin}>✦ Join free →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ATS ANIMATED DEMO ────────────────────────────────────────────────────────

const ATS_ENGINES = [
  { label:'Keyword match',    before:'12% — missing OKR, SQL',   after:'89% match',             pts:22, dims:{ d0:'91%', b0:91 }, insight:'ATS systems tokenise your resume against the JD word-for-word. "Responsible for team tasks" scores 0 for a JD listing "OKR-driven roadmap". We injected 6 exact-match keywords.' },
  { label:'Bullet impact',    before:'No numbers anywhere',        after:'3 bullets quantified',  pts:15, dims:{ d2:'85%', b2:85 }, insight:'Bullets without numbers are skipped in 7-second recruiter scans. "Led OKR roadmap → +28% retention" triggers both ATS keyword match AND the recruiter eye-scan.' },
  { label:'Section headers',  before:'Non-standard labels',        after:'ATS-readable headers',  pts:8,  dims:{ d1:'88%', b1:88 }, insight:"Many parsers look for exact strings: \"Experience\", \"Skills\", \"Education\". A header like \"What I've done\" causes the parser to skip the section — your best content disappears." },
  { label:'Action verbs',     before:'Helped, worked, assisted',   after:'Led, Built, Drove',     pts:7,  dims:{},                  insight:'Weak openers signal a supporting role to ATS seniority models. Strong verbs also match JD language — "led" matches "leadership experience required".' },
  { label:'Role seniority',   before:'Junior-level framing',       after:'Senior PM aligned',     pts:5,  dims:{ d3:'94%', b3:94 }, insight:'ATS cross-checks your years, seniority language, and impact scope against the role level. We align your framing without inventing anything.' },
  { label:'File & format',    before:'Tables + parse errors',      after:'Clean single-column',   pts:4,  dims:{},                  insight:'PDF tables and multi-column layouts scramble text order in ATS parsers. Single-column plain text is the safest format across all systems.' },
];

function AtsDemoSection({ onJoin }) {
  const [phase, setPhase] = useState('pre');
  const [scanPct, setScanPct] = useState(0);
  const [stepsLit, setStepsLit] = useState([false,false,false,false,false]);
  const [lineStates, setLineStates] = useState([0,0,0,0,0]);
  const [scanScore, setScanScore] = useState(0);
  const [afterVisible, setAfterVisible] = useState(false);
  const [cardTitle, setCardTitle] = useState('AI Scanning…');
  const [badgeColor, setBadgeColor] = useState('#00D4FF');
  const [fixStep, setFixStep] = useState(0);
  const [fixApplied, setFixApplied] = useState(new Array(6).fill(false));
  const [afterScore, setAfterScore] = useState(38);
  const [dimVals, setDimVals] = useState({ d0:'—', d1:'—', d2:'—', d3:'—' });
  const [dimBars, setDimBars] = useState({ b0:0, b1:0, b2:0, b3:0 });
  const [afterTitle, setAfterTitle] = useState('Waiting for scan…');
  const [afterSub, setAfterSub] = useState('Results will appear here');
  const [showDelta, setShowDelta] = useState(false);
  const [showKw, setShowKw] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [finalBanner, setFinalBanner] = useState(false);
  const [insight, setInsight] = useState('');
  const timers = useRef([]);
  const ivRef = useRef(null);

  const clearAll = () => {
    timers.current.forEach(clearTimeout); timers.current = [];
    if (ivRef.current) { clearInterval(ivRef.current); ivRef.current = null; }
  };
  const addT = (fn, d) => { timers.current.push(setTimeout(fn, d)); };

  const completeScan = useCallback(() => {
    setAfterVisible(true);
    setAfterTitle('Scan complete — apply fixes');
    setAfterSub('Press "Apply next fix" to see AI improve each issue');
    addT(() => {
      setPhase('fixmode');
      setCardTitle('ATS engine — 6 checks');
      setBadgeColor('#B026FF');
    }, 600);
  }, []);

  const startScan = useCallback(() => {
    setPhase('scanning');
    const order = [0,2,4,1,3];
    order.forEach((li,i) => {
      addT(() => setLineStates(s => { const n=[...s]; n[li]=1; return n; }), i*80);
      addT(() => setLineStates(s => { const n=[...s]; n[li]=2; return n; }), i*80+480);
    });
    [20,42,65,82,100].forEach((p,i) => addT(() => setScanPct(p), i*340));
    [0,350,700,1050,1400].forEach((d,i) => addT(() => setStepsLit(s => { const n=[...s]; n[i]=true; return n; }), d));
    addT(() => {
      let cur = 0;
      ivRef.current = setInterval(() => {
        cur = Math.min(cur+3, 38);
        setScanScore(cur);
        if (cur >= 38) { clearInterval(ivRef.current); ivRef.current=null; completeScan(); }
      }, 28);
    }, 500);
  }, [completeScan]);

  const replay = useCallback(() => {
    clearAll();
    setPhase('pre'); setScanPct(0); setStepsLit([false,false,false,false,false]);
    setLineStates([0,0,0,0,0]); setScanScore(0); setAfterVisible(false);
    setCardTitle('AI Scanning…'); setBadgeColor('#00D4FF');
    setFixStep(0); setFixApplied(new Array(6).fill(false)); setAfterScore(38);
    setDimVals({ d0:'—', d1:'—', d2:'—', d3:'—' }); setDimBars({ b0:0, b1:0, b2:0, b3:0 });
    setAfterTitle('Waiting for scan…'); setAfterSub('Results will appear here');
    setShowDelta(false); setShowKw(false); setShowNote(false); setFinalBanner(false); setInsight('');
    addT(startScan, 600);
  }, [startScan]);

  useEffect(() => { addT(startScan, 1200); return clearAll; }, [startScan]);

  const applyFix = () => {
    if (fixStep >= ATS_ENGINES.length) return;
    const e = ATS_ENGINES[fixStep];
    setFixApplied(s => { const n=[...s]; n[fixStep]=true; return n; });
    const ns = afterScore + e.pts;
    setAfterScore(ns); setInsight(e.insight);
    if ('d0' in e.dims) setDimVals(s => ({ ...s, d0:e.dims.d0 }));
    if ('d1' in e.dims) setDimVals(s => ({ ...s, d1:e.dims.d1 }));
    if ('d2' in e.dims) setDimVals(s => ({ ...s, d2:e.dims.d2 }));
    if ('d3' in e.dims) setDimVals(s => ({ ...s, d3:e.dims.d3 }));
    if ('b0' in e.dims) setDimBars(s => ({ ...s, b0:e.dims.b0 }));
    if ('b1' in e.dims) setDimBars(s => ({ ...s, b1:e.dims.b1 }));
    if ('b2' in e.dims) setDimBars(s => ({ ...s, b2:e.dims.b2 }));
    if ('b3' in e.dims) setDimBars(s => ({ ...s, b3:e.dims.b3 }));
    if (ns >= 80) { setAfterTitle('Strong ATS match ✓'); setAfterSub('Passes filter for Senior PM roles in Singapore.'); setShowDelta(true); }
    else { setAfterTitle('Improving… keep going'); setAfterSub(`${ns}% — ${91-ns} pts left to reach 91%`); }
    if (ns >= 60) setShowKw(true);
    if (ns >= 85) setShowNote(true);
    const nxt = fixStep + 1;
    setFixStep(nxt);
    if (nxt >= ATS_ENGINES.length) { setPhase('done'); setFinalBanner(true); setAfterScore(91); }
  };

  const lw = [false,true,false,true,false];
  const lineColor = i => lineStates[i]===1 ? 'rgba(0,212,255,.15)' : lineStates[i]===2 ? (lw[i] ? 'rgba(255,210,51,.1)' : 'rgba(0,229,160,.14)') : 'rgba(255,255,255,.07)';
  const lineBdr = i => lineStates[i]===1 ? '2px solid #00D4FF' : lineStates[i]===2 ? (lw[i] ? '2px solid rgba(255,210,51,.5)' : '2px solid #00E5A0') : '';
  const stepLabels = ['Reading structure','Extracting keywords','Matching PM roles','Scoring 5 dimensions','Generating fix recommendations'];
  const dimColors = ['#00D4FF','#00E5A0','#B026FF','#FFD233'];
  const dimKeys = ['d0','d1','d2','d3'];
  const barKeys = ['b0','b1','b2','b3'];
  const dimLabels = ['Keywords','Formatting','Impact','Role fit'];

  const C = { glass:'rgba(13,20,40,.9)', bdr:'rgba(255,255,255,.06)', bdr2:'rgba(255,255,255,.12)', text2:'var(--lp-text2)', text3:'var(--lp-text3)' };

  return (
    <div id="ats-demo" className="hero-bottom reveal" style={{ gridTemplateColumns:'1fr', paddingBottom:56 }}>
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, flexWrap:'wrap', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--lp-teal)', animation:'lp-pulse 2s infinite', display:'inline-block', flexShrink:0 }} />
            <span style={{ fontSize:11, fontWeight:700, color:'var(--lp-teal)', textTransform:'uppercase', letterSpacing:'.08em' }}>ATS Scanner — from invisible to interview-ready</span>
          </div>
          <button onClick={replay} style={{ padding:'4px 10px', borderRadius:6, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', color:'var(--lp-text2)', fontSize:11, cursor:'pointer', fontFamily:'var(--lp-ff)' }}>↺ Replay</button>
        </div>

        <div style={{ background:'rgba(13,20,40,.7)', border:'1px solid rgba(0,212,255,.2)', borderRadius:16, overflow:'hidden', padding:24, backdropFilter:'blur(20px)', boxShadow:'0 0 60px rgba(0,212,255,.08),0 24px 64px rgba(0,0,0,.5)' }}>
          <div style={{ textAlign:'center', marginBottom:20 }}>
            <div style={{ fontSize:18, fontWeight:800, color:'var(--lp-text)', letterSpacing:'-.3px', marginBottom:6 }}>Watch the ATS system scan your resume and how AI completes it</div>
            <div style={{ fontSize:12, color:'var(--lp-text3)' }}>Before → Scanning → After · auto-plays on load</div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1.15fr 1fr', gap:14, alignItems:'start', marginBottom:20 }}>

            {/* Card 1: Before */}
            <div style={{ background:C.glass, border:'1px solid rgba(255,77,106,.22)', borderRadius:12, overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 14px', background:'rgba(255,77,106,.05)', borderBottom:`1px solid ${C.bdr}` }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:'#FF4D6A', boxShadow:'0 0 8px rgba(255,77,106,.8)', flexShrink:0 }} />
                <span style={{ fontSize:11, fontWeight:700, color:C.text2, flex:1 }}>Original Resume</span>
                <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:5, background:'rgba(255,77,106,.1)', color:'#FF4D6A', border:'1px solid rgba(255,77,106,.2)' }}>Before</span>
              </div>
              <div style={{ padding:14 }}>
                <div style={{ fontSize:11, fontWeight:800, color:'var(--lp-text)', marginBottom:2 }}>Minh Tran</div>
                <div style={{ fontSize:9, color:C.text3, marginBottom:8 }}>minh@email.com · Singapore · +65 9123 4567</div>
                <div style={{ fontSize:8, fontWeight:700, color:'#4A5A7A', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4 }}>Experience</div>
                <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,.08)', marginBottom:4 }} />
                <div style={{ height:6, borderRadius:3, background:'rgba(255,77,106,.22)', borderLeft:'2px solid #FF4D6A', marginBottom:4, width:'90%' }} />
                <div style={{ fontSize:9, color:'#FF4D6A', fontStyle:'italic', padding:'4px 6px', background:'rgba(255,77,106,.06)', borderRadius:4, marginBottom:4, lineHeight:1.4 }}>"Helped drive product roadmap, worked with teams on deliverables…"</div>
                <div style={{ height:6, borderRadius:3, background:'rgba(255,77,106,.18)', borderLeft:'2px solid #FF4D6A', marginBottom:4, width:'85%' }} />
                <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,.08)', marginBottom:4, width:'70%' }} />
                <div style={{ fontSize:8, fontWeight:700, color:'#4A5A7A', textTransform:'uppercase', letterSpacing:'.08em', marginTop:6, marginBottom:4 }}>Skills</div>
                <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,.08)', marginBottom:4 }} />
                <div style={{ height:6, borderRadius:3, background:'rgba(255,210,51,.12)', borderLeft:'2px solid rgba(255,210,51,.5)', marginBottom:4, width:'80%' }} />
                <div style={{ marginTop:10, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 10px', borderRadius:20, background:'rgba(255,77,106,.1)', border:'1px solid rgba(255,77,106,.25)' }}>
                    <span style={{ fontSize:18, fontWeight:800, color:'#FF4D6A', fontFamily:'var(--lp-ffm)', lineHeight:1 }}>38</span>
                    <span style={{ fontSize:9, color:'#FF4D6A', fontWeight:600 }}>ATS score</span>
                  </div>
                  <div style={{ fontSize:9, color:'#FF4D6A', textAlign:'right', lineHeight:1.5 }}>Filtered before<br />recruiter sees it</div>
                </div>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:8 }}>
                  {['Missing: OKR','Missing: SQL','Vague bullets','No metrics'].map(t => (
                    <span key={t} style={{ fontSize:8, fontWeight:600, padding:'2px 6px', borderRadius:4, background:'rgba(255,77,106,.08)', color:'#FF4D6A', border:'1px solid rgba(255,77,106,.18)' }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 2: Scanning / ATS Engine */}
            <div style={{ background:C.glass, border:`1.5px solid ${phase==='scanning'?'rgba(0,212,255,.35)':badgeColor==='#B026FF'?'rgba(176,38,255,.35)':'rgba(0,229,160,.35)'}`, borderRadius:12, overflow:'hidden', boxShadow:`0 0 40px ${phase==='scanning'?'rgba(0,212,255,.12)':'rgba(176,38,255,.08)'}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 14px', background:'rgba(0,212,255,.06)', borderBottom:`1px solid rgba(0,212,255,.1)` }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:phase==='done'?'#00E5A0':badgeColor, flexShrink:0, boxShadow:`0 0 8px ${badgeColor}80`, animation:phase==='scanning'?'lp-pulse 2s infinite':'' }} />
                <span style={{ fontSize:11, fontWeight:700, color:C.text2, flex:1 }}>{cardTitle}</span>
                <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:5, background:`${badgeColor}18`, color:badgeColor, border:`1px solid ${badgeColor}40` }}>
                  {phase==='pre'||phase==='scanning'?'Running':phase==='fixmode'?'Fix mode':'Done'}
                </span>
              </div>
              <div style={{ padding:14 }}>
                {phase === 'scanning' || phase === 'pre' ? (
                  <div>
                    {[0,1,2,3,4].map(i => (
                      <div key={i} style={{ height:6, borderRadius:3, background:lineColor(i), borderLeft:lineBdr(i), marginBottom:4, width:i===1?'88%':i===2?'95%':i===3?'80%':i===4?'92%':'100%', overflow:'hidden', position:'relative' }}>
                        {lineStates[i]===1 && <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent,rgba(0,212,255,.5),transparent)', animation:'lp-sweepLine 1s ease-in-out infinite' }} />}
                      </div>
                    ))}
                    <div style={{ height:4, borderRadius:2, background:'rgba(255,255,255,.06)', overflow:'hidden', marginBottom:4 }}>
                      <div style={{ height:4, borderRadius:2, background:'linear-gradient(90deg,#00D4FF,#B026FF)', width:`${scanPct}%`, transition:'width .35s ease' }} />
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'#4A5A7A', marginBottom:10 }}>
                      <span>Scanning progress</span><span style={{ color:'#00D4FF', fontWeight:700, fontFamily:'monospace' }}>{scanPct}%</span>
                    </div>
                    <div style={{ textAlign:'center', padding:10, background:'rgba(0,212,255,.05)', borderRadius:8, border:'1px solid rgba(0,212,255,.12)' }}>
                      <div style={{ fontSize:32, fontWeight:800, color:'#00D4FF', fontFamily:'var(--lp-ffm)', letterSpacing:'-1.5px', lineHeight:1 }}>{scanPct>0?scanScore+'%':'—'}</div>
                      <div style={{ fontSize:9, color:C.text3, marginTop:3 }}>ATS score building…</div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:5, marginTop:10 }}>
                      {stepLabels.map((lbl,i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:10, color:stepsLit[i]?'#00E5A0':C.text3, transition:'color .3s' }}>
                          <span style={{ width:14, height:14, borderRadius:'50%', border:`1.5px solid currentColor`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:7, flexShrink:0, fontFamily:'monospace' }}>{i+1}</span>
                          {lbl}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize:9, fontWeight:700, color:C.text3, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>ATS engine — 6 checks</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      {ATS_ENGINES.map((e,i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 8px', borderRadius:7, border:`1px solid ${fixApplied[i]?'rgba(0,229,160,.28)':C.bdr}`, background:fixApplied[i]?'rgba(0,229,160,.07)':'rgba(255,255,255,.02)', transition:'all .4s' }}>
                          <span style={{ width:12, height:12, borderRadius:'50%', border:`1.5px solid ${fixApplied[i]?'#00E5A0':'rgba(255,255,255,.2)'}`, flexShrink:0, display:'inline-block', background:fixApplied[i]?'#00E5A0':'transparent', transition:'all .3s' }} />
                          <span style={{ flex:1, fontSize:11, color:C.text2 }}>{e.label}</span>
                          <span style={{ fontSize:10, color:fixApplied[i]?'#00E5A0':'#FF4D6A', whiteSpace:'nowrap' }}>{fixApplied[i]?`${e.after} +${e.pts}pts`:e.before}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:'flex', gap:6, marginTop:10 }}>
                      <button onClick={applyFix} disabled={phase==='done'} style={{ flex:1, padding:'7px 10px', borderRadius:8, background:'linear-gradient(135deg,#00D4FF,#B026FF)', color:'#fff', fontSize:11, fontWeight:700, border:'none', cursor:phase==='done'?'default':'pointer', fontFamily:'var(--lp-ff)', opacity:phase==='done'?.4:1, transition:'opacity .2s' }}>
                        {phase==='done'?'All fixes applied ✓':`⚡ Apply fix ${fixStep+1} of ${ATS_ENGINES.length} →`}
                      </button>
                      <button onClick={replay} style={{ padding:'7px 10px', borderRadius:8, background:'rgba(255,255,255,.05)', color:C.text2, fontSize:11, fontWeight:600, border:`1px solid ${C.bdr}`, cursor:'pointer', fontFamily:'var(--lp-ff)' }}>↺</button>
                    </div>
                    {insight && <div style={{ marginTop:9, fontSize:10, color:C.text2, lineHeight:1.6, padding:'8px 10px', background:'rgba(0,212,255,.04)', borderLeft:'2px solid #00D4FF', borderRadius:'0 6px 6px 0', transition:'opacity .3s' }}>{insight}</div>}
                  </div>
                )}
              </div>
            </div>

            {/* Card 3: After */}
            <div style={{ background:C.glass, border:'1px solid rgba(0,229,160,.25)', borderRadius:12, overflow:'hidden', opacity:afterVisible?1:.35, transition:'opacity .6s', boxShadow:'0 0 24px rgba(0,229,160,.08)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 14px', background:'rgba(0,229,160,.05)', borderBottom:`1px solid ${C.bdr}` }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:'#00E5A0', boxShadow:'0 0 8px rgba(0,229,160,.9)', flexShrink:0 }} />
                <span style={{ fontSize:11, fontWeight:700, color:C.text2, flex:1 }}>After CareerAiHub</span>
                <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:5, background:'rgba(0,229,160,.1)', color:'#00E5A0', border:'1px solid rgba(0,229,160,.25)' }}>Result</span>
              </div>
              <div style={{ padding:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <div style={{ width:56, height:56, borderRadius:'50%', border:'2px solid #00E5A0', background:'rgba(0,229,160,.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 0 20px rgba(0,229,160,.25)', flexDirection:'column' }}>
                    <span style={{ fontSize:16, fontWeight:800, color:'#00E5A0', fontFamily:'var(--lp-ffm)', lineHeight:1 }}>{afterScore<40?'—':afterScore+'%'}</span>
                    <span style={{ fontSize:7, color:'#00E5A0', opacity:.7 }}>ATS score</span>
                  </div>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--lp-text)', lineHeight:1.3 }}>{afterTitle}</div>
                    <div style={{ fontSize:10, color:C.text3, lineHeight:1.4, marginTop:2 }}>{afterSub}</div>
                  </div>
                </div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:10, background:'rgba(0,229,160,.1)', border:'1px solid rgba(0,229,160,.25)', fontSize:10, fontWeight:700, color:'#00E5A0', marginBottom:8, opacity:showDelta?1:0, transition:'opacity .5s' }}>↑ +53 points · from 38% to 91%</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5, marginBottom:8 }}>
                  {dimLabels.map((lbl,i) => (
                    <div key={i} style={{ padding:'6px 8px', borderRadius:6, background:'rgba(255,255,255,.03)', border:`1px solid ${C.bdr}` }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                        <div style={{ fontSize:8, color:C.text3, fontWeight:600 }}>{lbl}</div>
                        <div style={{ fontSize:11, fontWeight:800, color:dimColors[i], fontFamily:'var(--lp-ffm)' }}>{dimVals[dimKeys[i]]}</div>
                      </div>
                      <div style={{ height:3, borderRadius:2, background:'rgba(255,255,255,.06)' }}>
                        <div style={{ height:3, borderRadius:2, background:dimColors[i], width:`${dimBars[barKeys[i]]}%`, transition:'width 1s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', gap:3, flexWrap:'wrap', marginBottom:8, opacity:showKw?1:0, transition:'opacity .5s' }}>
                  {['product strategy','OKR framework','roadmap','SQL'].map(k => <span key={k} style={{ fontSize:8, fontWeight:600, padding:'2px 6px', borderRadius:4, background:'rgba(0,229,160,.1)', color:'#00E5A0', border:'1px solid rgba(0,229,160,.2)' }}>{k}</span>)}
                  <span style={{ fontSize:8, fontWeight:600, padding:'2px 6px', borderRadius:4, background:'rgba(255,77,106,.09)', color:'#FF4D6A', border:'1px solid rgba(255,77,106,.18)' }}>go-to-market</span>
                </div>
                {showNote && <div style={{ fontSize:10, color:C.text2, lineHeight:1.6, padding:'8px 10px', background:'rgba(0,212,255,.04)', borderLeft:'2px solid #00D4FF', borderRadius:'0 6px 6px 0', opacity:showNote?1:0, transition:'opacity .5s' }}><strong style={{ color:'#00D4FF' }}>AI:</strong> 4 keywords added, 3 bullets quantified. Passes 94% of Senior PM roles in Singapore.</div>}
                {finalBanner && <div style={{ marginTop:8, padding:'8px 10px', borderRadius:8, background:'rgba(0,229,160,.07)', border:'1px solid rgba(0,229,160,.28)' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#00E5A0' }}>Interview-ready — all 6 fixes applied</div>
                  <div style={{ fontSize:10, color:'#00E5A0', opacity:.75, marginTop:2 }}>Passes 94% of Senior PM roles in SG</div>
                </div>}
              </div>
            </div>

          </div>

          {/* CTA */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, paddingTop:20, borderTop:'1px solid rgba(255,255,255,.07)' }}>
            <button onClick={onJoin} style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'15px 40px', borderRadius:30, background:'linear-gradient(135deg,#00D4FF,#B026FF)', color:'#fff', fontSize:15, fontWeight:700, border:'none', cursor:'pointer', fontFamily:'var(--lp-ff)', boxShadow:'0 0 36px rgba(0,212,255,.4),0 8px 28px rgba(0,0,0,.3)', letterSpacing:'.01em' }}>
              <span style={{ fontSize:17 }}>⚡</span>
              Scan my resume with AI — free
              <span style={{ fontSize:14, opacity:.85 }}>→</span>
            </button>
            <div style={{ fontSize:11, color:'var(--lp-text3)' }}>No account needed · ATS results in 20 seconds · 1 free scan included</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── HERO ──────────────────────────────────────────────────────────────────────

function HeroSection({ onJoin, onModuleSelect, onTrackerOpen, onSnack, onAgenticCta }) {
  const text = useTypewriter(TYPEWRITER_PHRASES);
  const [statsStarted, setStatsStarted] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStatsStarted(true); io.disconnect(); } }, { threshold: 0.2 });
    if (statsRef.current) io.observe(statsRef.current);
    return () => io.disconnect();
  }, []);

  return (
    <>
    <header className="hero">
      <div className="hero-top">
        {/* LEFT */}
        <div className="hero-left">
          <div className="hero-eyeline">The AI career platform that takes you</div>
          <h1>From <span className="acc">{text}</span><span className="cursor" aria-hidden="true" /><br /><span style={{ color: 'var(--lp-text)' }}>one platform, one memory.</span></h1>
          <p className="hero-sub">One AI memory learns your profile once — and powers every module from ATS scoring to salary negotiation.</p>
          <div className="hero-btns">
            <button className="btn-p" onClick={onJoin}>✦ Start free — no card needed</button>
            <button className="btn-o" onClick={() => document.getElementById('ats-demo')?.scrollIntoView({ behavior: 'smooth' })}>See ATS demo ↓</button>
          </div>
          <div className="cta-microcopy">Free to start · No credit card required · ATS results in 20 seconds</div>
          <div className="hero-fill">
            <div className="hf-stats">
              <div className="hf-stat">
                <div className="hf-stat-n">10</div>
                <div className="hf-stat-l">AI modules<br />in one platform</div>
              </div>
              <div className="hf-stat">
                <div className="hf-stat-n"><span className="hf-acc">38%</span> → <span className="hf-acc">91%</span></div>
                <div className="hf-stat-l">ATS score lift<br />in 90 seconds</div>
              </div>
              <div className="hf-stat">
                <div className="hf-stat-n"><span className="hf-acc">5×</span></div>
                <div className="hf-stat-l">faster job search<br />with AI memory</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Search Card + Agentic Card */}
        <SearchCard onJoin={onJoin} onModuleSelect={onModuleSelect} onTrackerOpen={onTrackerOpen} onSnack={onSnack} onAgenticCta={onAgenticCta} />
      </div>

      {/* BOTTOM — Full-width animated ATS demo */}
      <AtsDemoSection onJoin={onJoin} />
    </header>

    {/* WHY SEEKERS BAND — full-width strip below hero */}
    <div className="why-band" ref={statsRef}>
      <div className="why-band-label">📊 Why job seekers use CareerAiHub</div>
      <div className="why-band-divider" />
      {STATS.map((s, i) => (
        <React.Fragment key={i}>
          <div className="why-band-stat">
            <span className={`why-band-n ${s.cls}`}>
              {statsStarted
                ? `${s.prefix || ''}${s.value}${s.suffix}`
                : `${s.prefix || ''}0${s.suffix}`}
            </span>
            <span className="why-band-l">{s.label}</span>
          </div>
          {i < STATS.length - 1 && <div className="why-band-divider" />}
        </React.Fragment>
      ))}
    </div>
    </>
  );
}

// ── LAYER DEMO PANELS ─────────────────────────────────────────────────────────

const DS = {
  bg:'#09090d', s1:'#111218', s2:'#161820', s3:'#1c1f2c',
  bdr:'rgba(255,255,255,0.06)', bdr2:'rgba(255,255,255,0.12)',
  text:'#e8eaf0', text2:'#8b92a8', text3:'#3d4560',
  teal:'#00d4aa', tdim:'rgba(0,212,170,0.1)', tb:'rgba(0,212,170,0.25)',
  cyan:'#00c8ff', cdim:'rgba(0,200,255,0.1)', cb:'rgba(0,200,255,0.25)',
  green:'#00e5a0', gdim:'rgba(0,229,160,0.1)', gb:'rgba(0,229,160,0.25)',
  gold:'#f5c842', goldim:'rgba(245,200,66,0.1)', goldb:'rgba(245,200,66,0.25)',
  red:'#ff5f6e', rdim:'rgba(255,95,110,0.1)',
  purple:'#b026ff', pdim:'rgba(176,38,255,0.1)', pb:'rgba(176,38,255,0.25)',
};

function DemoShell({ label, accent, borderC, onClose, onNext, children }) {
  return (
    <div style={{ marginTop:20, borderRadius:12, overflow:'hidden', border:`1px solid ${borderC}`, boxShadow:`0 0 40px rgba(0,0,0,0.3)` }}>
      <div style={{ background:`rgba(9,9,13,0.97)`, borderBottom:`1px solid ${borderC}`, padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', backdropFilter:'blur(12px)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, fontFamily:'var(--lp-ffm)', color:accent }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:accent, boxShadow:`0 0 8px ${accent}`, display:'inline-block' }} />
          {label}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {onNext && <button onClick={onNext} style={{ background:`${accent}22`, border:`1px solid ${accent}55`, color:accent, cursor:'pointer', fontSize:11, fontFamily:'var(--lp-ffm)', padding:'4px 12px', borderRadius:6 }}>Explore next layer →</button>}
          <button onClick={onClose} style={{ background:'none', border:'none', color:DS.text3, cursor:'pointer', fontSize:11, fontFamily:'var(--lp-ffm)' }}>✕ Close</button>
        </div>
      </div>
      <div style={{ background:DS.bg, color:DS.text, fontFamily:'DM Sans, sans-serif', fontSize:13 }}>
        {children}
      </div>
    </div>
  );
}

function L1DemoPanel({ onClose, onNext }) {
  return (
    <DemoShell label="LAYER 01 — RESUME CREATION · LIVE DEMO" accent={DS.teal} borderC={DS.tb} onClose={onClose} onNext={onNext}>
      <iframe srcdoc={l1Html} style={{ width:'100%', height:l1HtmlHeight, border:'none', display:'block', background:'#09090d' }} title="Layer 01 Resume Creation Demo" />
    </DemoShell>
  );
}

function L2DemoPanel({ onClose, onNext }) {
  return (
    <DemoShell label="LAYER 02 — INTERVIEW + SALARY PREP · LIVE DEMO" accent={DS.cyan} borderC={DS.cb} onClose={onClose} onNext={onNext}>
      <iframe srcdoc={l2Html} style={{ width:'100%', height:l2HtmlHeight, border:'none', display:'block', background:'#09090d' }} title="Layer 02 Interview Salary Demo" />
    </DemoShell>
  );
}

function L3DemoPanel({ onClose, onNext }) {
  return (
    <DemoShell label="LAYER 03 LIVE DASHBOARD" accent={DS.green} borderC={DS.gb} onClose={onClose} onNext={onNext}>
      <iframe srcdoc={l3Html} style={{ width:'100%', height:l3HtmlHeight, border:'none', display:'block', background:'#0a0b0d' }} title="Layer 03 Verified Credentials Dashboard" />
    </DemoShell>
  );
}

function L4DemoPanel({ onClose, onNext }) {
  return (
    <DemoShell label="LAYER 04 AI MARKETPLACE — LIVE DEMO" accent={DS.purple} borderC={DS.pb} onClose={onClose} onNext={onNext}>
      <iframe srcdoc={l4Html} style={{ width:'100%', height:l4HtmlHeight, border:'none', display:'block', background:'#09090d' }} title="Layer 04 AI Marketplace Demo" />
    </DemoShell>
  );
}

// ── PLATFORM LAYERS ───────────────────────────────────────────────────────────

function PlatformLayers({ onJoin }) {
  const [active, setActive] = useState(0);
  const [demoLayer, setDemoLayer] = useState(null);
  const sectionRef = useRef(null);
  const d = LAYER_DATA[active];
  const handleTab = (i) => { setActive(i); setDemoLayer(null); };
  const handleCta = () => {
    setDemoLayer(active);
    setTimeout(() => sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };
  const goNextLayer = () => {
    const next = (active + 1) % LAYER_DATA.length;
    setActive(next);
    setDemoLayer(next);
  };

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) setDemoLayer(null);
    }, { threshold: 0.05 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="section alt" ref={sectionRef}>
      <div className="reveal">
        <div className="ey">Platform architecture</div>
        <h2 className="sh">Four layers. One memory. Built to compound.</h2>
        <p className="ss">Each layer builds on the last. Your profile deepens with every session — every module smarter, every recommendation more precise.</p>
      </div>
      <div className="reveal d1">
        <div className="layer-tabs">
          {LAYER_DATA.map((layer, i) => (
            <button key={i} className={`ltab ${layer.label}${active === i ? ' on' : ''}`} onClick={() => handleTab(i)}>
              <div className="ltab-n">{layer.n}</div>
              <div className="ltab-title">{layer.title}</div>
              <div className="ltab-sub">{layer.sub}</div>
              {layer.status === 'live' && (
                <span className="lstatus ls-live">
                  <span className="sdot" />
                  Live now
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="layer-panel" style={{ borderColor: d.borderC }}>
          <div className="lp-head lp-anim" style={{ background: d.bg }}>
            <div>
              <div className="lp-ey" style={{ color: d.eyC }}>{d.ey}</div>
              <div className="lp-title">{d.panelTitle}</div>
              <div className="lp-desc">{d.desc}</div>
            </div>
            <button className={`lp-cta ${d.ctaCls}`} onClick={handleCta}>{d.cta}</button>
          </div>
          <div className="lp-mods lp-anim">
            {d.mods.map((m, i) => (
              <div key={i} className="lp-mod">
                <div className="lp-mod-n">{m.n}</div>
                <div className="lp-mod-d">{m.d}</div>
              </div>
            ))}
          </div>
          <div className="lp-mem-hd">AI memory — what this layer writes to the core</div>
          <div className="lp-mem lp-anim">
            {d.mem.map((m, i) => (
              <div key={i} className="mem-s">
                <div className="mem-n">{m.n}</div>
                <div className="mem-l">{m.l}</div>
              </div>
            ))}
          </div>
          {demoLayer === 0 && <L1DemoPanel onClose={() => setDemoLayer(null)} onNext={goNextLayer} />}
          {demoLayer === 1 && <L2DemoPanel onClose={() => setDemoLayer(null)} onNext={goNextLayer} />}
          {demoLayer === 2 && <L3DemoPanel onClose={() => setDemoLayer(null)} onNext={goNextLayer} />}
          {demoLayer === 3 && <L4DemoPanel onClose={() => setDemoLayer(null)} onNext={goNextLayer} />}
        </div>
      </div>
    </section>
  );
}

// ── FUNNEL METRICS STRIP ──────────────────────────────────────────────────────

function FunnelStrip() {
  return (
    <div className="lp-funnel-strip">
      <div className="lp-funnel-live">
        <span className="lp-funnel-dot" />
        <span className="lp-funnel-label">Live today on CareerAiHub</span>
      </div>
      <div className="lp-funnel-stats">
        <div className="lp-funnel-stat"><span className="lp-funnel-n">47</span><span className="lp-funnel-s">resumes scanned</span></div>
        <span className="lp-funnel-sep">·</span>
        <div className="lp-funnel-stat"><span className="lp-funnel-n">31</span><span className="lp-funnel-s">accounts created</span></div>
        <span className="lp-funnel-sep">·</span>
        <div className="lp-funnel-stat"><span className="lp-funnel-n">12</span><span className="lp-funnel-s">upgrades today</span></div>
      </div>
    </div>
  );
}

// ── PLATFORM ARCH (FLAT) ──────────────────────────────────────────────────────

function PlatformArchSection() {
  const rows = [
    { icon:'🧠', acc:'var(--lp-teal-dim)', bdr:'var(--lp-teal-b)', title:'Data layer · AI Memory', desc:'Upload your resume once. AI reads, indexes, and retains your full professional history — seeding context into every module instantly. Every session writes back, compounding your profile over time.', lbl:'Layer 01', statusBg:'var(--lp-teal-dim)', statusC:'var(--lp-teal)', statusBdr:'var(--lp-teal-b)', statusTxt:'Live', dot:true },
    { icon:'⚡', acc:'var(--lp-teal-dim)', bdr:'var(--lp-teal-b)', title:'Intelligence layer · 10 AI Modules', desc:'ATS Scanner · ATS Builder · JD Analyzer · STAR Builder · HM Simulator · Mock Interview · Salary Coach · Cover Letter · Get Ready · Job Search — all powered by the same AI memory, all compounding with each session.', lbl:'Layer 02', statusBg:'var(--lp-teal-dim)', statusC:'var(--lp-teal)', statusBdr:'var(--lp-teal-b)', statusTxt:'Live', dot:true },
    { icon:'🏅', acc:'var(--lp-amber-dim)', bdr:'var(--lp-amber-b)', title:'Verification layer · Readiness Certificate', desc:"Candidates who hit 80/100 across all interview dimensions earn a shareable Readiness Certificate — blockchain-anchored, verifiable by employers. The credential that proves you didn't just prepare, you proved it.", lbl:'Layer 03', statusBg:'var(--lp-amber-dim)', statusC:'var(--lp-amber)', statusBdr:'var(--lp-amber-b)', statusTxt:'Building', dot:false, dim:true },
    { icon:'🌐', acc:'var(--lp-purple-dim)', bdr:'var(--lp-purple-b)', title:'Market layer · Live Singapore Data', desc:'Real-time salary benchmarks, hiring velocity signals, and role-level demand pulled from 20+ platforms. Powers every salary recommendation, job search rank, and market intelligence alert — live, not cached.', lbl:'Layer 04', statusBg:'var(--lp-purple-dim)', statusC:'var(--lp-purple)', statusBdr:'var(--lp-purple-b)', statusTxt:'Planned', dot:false, dim:true },
  ];
  return (
    <section className="section alt">
      <div className="reveal">
        <div className="ey">Platform architecture</div>
        <h2 className="sh">Four layers. One memory. Built to compound.</h2>
        <p className="ss">Each layer builds on the last. Your profile deepens with every session — every module smarter, every recommendation more precise.</p>
      </div>
      <div className="reveal d1">
        <div className="lp-arch-list">
          {rows.map((r, i) => (
            <div key={i} className="lp-arch-row" style={{ opacity: r.dim ? 0.85 : 1 }}>
              <div className="lp-arch-icon" style={{ background: r.acc, border: `1px solid ${r.bdr}` }}>{r.icon}</div>
              <div className="lp-arch-body">
                <div className="lp-arch-title">{r.title}</div>
                <div className="lp-arch-desc">{r.desc}</div>
              </div>
              <div className="lp-arch-lbl">{r.lbl}</div>
              <div className="lp-arch-status" style={{ background: r.statusBg, color: r.statusC, border: `1px solid ${r.statusBdr}` }}>
                {r.dot && <span className="lp-arch-dot" style={{ background: r.statusC }} />}
                {r.statusTxt}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FEATURES ──────────────────────────────────────────────────────────────────

function FeatureSection({ onJoin, activePill, onModuleSelect }) {
  const [active, setActive] = useState(activePill || 0);
  const [nurture, setNurture] = useState(false);

  useEffect(() => { if (activePill !== undefined) { setActive(activePill); setNurture(false); } }, [activePill]);

  const f = FEAT_DATA[active];
  const handleTab = (i) => { setActive(i); setNurture(false); };

  return (
    <section className="section" id="feat-sec">
      <div className="reveal">
        <div className="ey">Every tool, explored</div>
        <h2 className="sh">See exactly what you unlock at $19/month.</h2>
        <p className="ss">Each tool shows a live preview. Free users get 1–2 uses — then a contextual upgrade prompt specific to that tool.</p>
      </div>
      <div className="reveal d1" style={{ marginTop: 8 }}>
        <div className="feat-tabs">
          {FEAT_DATA.map((ft, i) => (
            <button key={i} className={`ftab${active === i ? ' on' : ''}`} onClick={() => handleTab(i)}>
              <span className="ftab-icon">{ft.icon}</span>
              <span className="ftab-lbl">{ft.label}</span>
              <span className={`ftab-badge ${ft.isFree ? 'free' : 'prem'}`}>{ft.isFree ? 'Free' : 'Premium'}</span>
            </button>
          ))}
        </div>
        <div className="feat-panel">
          <div className="fp-left fp-anim" key={active + '-left'}>
            <div className="fp-ey">{f.ey}</div>
            <h3 className="fp-title">{f.title}</h3>
            <p className="fp-desc">{f.desc}</p>
            <ul className="fp-bullets">
              {f.bullets.map((b, i) => <li key={i} className="fp-bullet"><span className="fp-dot" />{b}</li>)}
            </ul>
            <div className="fp-actions">
              {f.isFree
                ? <button className="fp-primary" onClick={() => onModuleSelect ? onModuleSelect(f.moduleId) : onJoin()}>Try it free →</button>
                : <>
                    <button className="fp-primary" onClick={() => onModuleSelect ? onModuleSelect(f.moduleId) : onJoin()}>Open {f.label} →</button>
                    <button className="fp-secondary" onClick={() => onModuleSelect ? onModuleSelect(f.moduleId) : onJoin()}>1 free use available</button>
                  </>
              }
            </div>
            {!f.isFree && (
              <div className="fp-note">
                <span style={{ color: 'var(--lp-amber)' }}>⚡</span>
                Unlimited with Premium · $19/month · save $156/mo vs separate tools
              </div>
            )}
          </div>
          <div className="fp-right">
            <div className="fp-preview-hd"><span className="fp-pdot" />{f.previewHd}</div>
            <div className="fp-body fp-anim" key={active + '-right'} dangerouslySetInnerHTML={{ __html: f.preview }} />
          </div>
          {f.pw && (
            <div className="pw-wrap">
              <div className="pw-block">
                <div className="pw-ico">⚡</div>
                <div>
                  <div className="pw-hl">{f.pw.h}</div>
                  <div className="pw-sub">{f.pw.s}</div>
                </div>
                <div className="pw-btns">
                  <button className="pw-cta" onClick={onJoin}>{f.pw.cta}</button>
                  <button className="pw-later" onClick={() => setNurture(true)}>Not now</button>
                </div>
              </div>
              {nurture && (
                <div className="nurture show">
                  <span style={{ fontSize: 20 }}>✉️</span>
                  <div className="nurture-msg">
                    <div className="nurture-title">No problem — we'll remind you when you're ready.</div>
                    <div className="nurture-sub">Enter your email and we'll send a 3-day personalised upgrade summary.</div>
                  </div>
                  <div className="nurture-row">
                    <input className="nurture-in" placeholder="your@email.com" type="email" />
                    <button className="nurture-btn" onClick={onJoin}>Remind me →</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── TESTIMONIALS ──────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote: "I uploaded my resume and within 20 seconds could see exactly why I wasn't getting callbacks. The ATS score went from 41% to 88% after following the suggestions. Got a phone screen the following week.",
    name: 'James L.',
    role: 'Software Engineer · Singapore',
    initials: 'JL',
  },
  {
    quote: "The salary coach showed me I was asking for 18% below market rate. I practiced the negotiation roleplay three times before my offer call. Ended up with SGD 1,200 more per month than the initial offer.",
    name: 'Priya W.',
    role: 'Product Manager · Singapore',
    initials: 'PW',
  },
  {
    quote: "The HM Simulator is unlike anything I've used. It actually pushed back on my vague answers and made me quantify everything. My interview confidence went from 5/10 to 9/10 after four sessions.",
    name: 'Marcus T.',
    role: 'Marketing Manager · Singapore',
    initials: 'MT',
  },
];

function TestimonialsSection() {
  return (
    <section className="section lp-testi-section" id="testimonials">
      <div className="reveal">
        <div className="ey">Early users</div>
        <h2 className="sh">What beta users say.</h2>
        <p className="ss" style={{ marginBottom: 32 }}>Real feedback from our early beta group. We're collecting more every week.</p>
      </div>
      <div className="lp-testi-grid reveal d1">
        {TESTIMONIALS.map((t, i) => (
          <div key={i} className="lp-testi-card">
            <div className="lp-testi-stars">★★★★★</div>
            <p className="lp-testi-quote">{t.quote}</p>
            <div className="lp-testi-author">
              <div className="lp-testi-avatar">{t.initials}</div>
              <div>
                <div className="lp-testi-name">{t.name}</div>
                <div className="lp-testi-role">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="lp-testi-proof reveal d2">
        <div className="lp-tsp-item"><span className="lp-tsp-n">500+</span><span className="lp-tsp-l">beta users analyzed</span></div>
        <div className="lp-tsp-div" />
        <div className="lp-tsp-item"><span className="lp-tsp-n">89%</span><span className="lp-tsp-l">saw ATS score improvement</span></div>
        <div className="lp-tsp-div" />
        <div className="lp-tsp-item"><span className="lp-tsp-n">4.8★</span><span className="lp-tsp-l">average rating</span></div>
        <div className="lp-tsp-div" />
        <div className="lp-tsp-item"><span className="lp-tsp-n">SGD 1,200</span><span className="lp-tsp-l">avg salary gain reported</span></div>
      </div>
    </section>
  );
}

// ── TRUST SECTION ─────────────────────────────────────────────────────────────

const TRUST_QA = [
  {
    q: 'Why CareerAiHub over five separate tools?',
    points: [
      'One AI memory powers every module — your resume data flows across all 10 tools without re-entering anything.',
      'Compounding intelligence: each session makes the next one smarter, unlike stateless tools that forget you.',
      'Singapore-specific: salary benchmarks, job boards, and market data tuned for SEA — not US-generic.',
      'All-in at $19/month vs $175+/month for LinkedIn Premium + Resume.io + Interviewing.io combined.',
    ],
  },
  {
    q: 'Is my resume data safe with you?',
    points: [
      'AES-256 encryption at rest, TLS 1.3 in transit — your resume is encrypted from the moment it lands.',
      'We never sell or share your data with recruiters, job boards, or any third party. Your data powers only your own modules.',
      'Delete anytime: request full deletion from account settings, processed within 24 hours and purged from backups within 30 days.',
      'PDPA compliant (Singapore) with GDPR compliance planned for our European expansion.',
    ],
  },
  {
    q: 'How is this different from just using ChatGPT?',
    points: [
      'ChatGPT has no memory of your resume, target role, or salary data — you re-explain yourself every session.',
      'CareerAiHub has structured modules purpose-built for hiring: ATS scoring, STAR frameworks, live salary benchmarks.',
      'We pull live Singapore job data and salary ranges — ChatGPT cannot access real-time market intelligence.',
      'Readiness Certificate and blockchain-verifiable credentials are not possible through a generic chat interface.',
    ],
  },
  {
    q: 'What happens after the free tier?',
    points: [
      'Free tier never expires: job search, market intelligence, and 1–2 uses per module stay free forever.',
      'Premium at $19/month unlocks unlimited use of all 10 tools with full AI memory — cancel anytime.',
      'Pro Get Ready adds the AI-built study plan and Readiness Certificate for interview-ready candidates.',
      '7-day free trial on all paid plans — no credit card required to start the trial.',
    ],
  },
];

function DataProtectedSection({ onPrivacy, onTerms }) {
  return (
    <section className="section lp-trust-section" id="trust">
      <div className="reveal">
        <div className="ey">Your data, protected</div>
        <h2 className="sh">Your resume is yours. Always.</h2>
        <p className="ss" style={{ marginBottom: 32 }}>We know you're uploading something personal. Here's exactly how we handle it.</p>
      </div>
      <div className="lp-trust-grid reveal d1">
        <div className="lp-trust-item">
          <div className="lp-trust-icon">🔒</div>
          <div className="lp-trust-title">Encrypted in transit and at rest</div>
          <div className="lp-trust-desc">Your resume is encrypted with AES-256 the moment it's uploaded. It travels over TLS 1.3 and is stored in encrypted form. Only you can access it.</div>
        </div>
        <div className="lp-trust-item">
          <div className="lp-trust-icon">🚫</div>
          <div className="lp-trust-title">Never sold. Never shared.</div>
          <div className="lp-trust-desc">We do not sell your data to recruiters, job boards, or third parties. Ever. Your resume is used only to power your own CareerAiHub modules — nothing else.</div>
        </div>
        <div className="lp-trust-item">
          <div className="lp-trust-icon">🗑️</div>
          <div className="lp-trust-title">Delete anytime</div>
          <div className="lp-trust-desc">Delete your resume, profile, and all data from account settings at any time. We process deletion within 24 hours and purge backups within 30 days.</div>
        </div>
        <div className="lp-trust-item">
          <div className="lp-trust-icon">🇸🇬</div>
          <div className="lp-trust-title">PDPA compliant · Singapore</div>
          <div className="lp-trust-desc">CareerAiHub is built to comply with Singapore's Personal Data Protection Act (PDPA). GDPR compliance planned for our European expansion.</div>
        </div>
      </div>
      <div className="lp-trust-links reveal d2">
        <button className="lp-trust-link" onClick={onPrivacy}>Privacy Policy ↗</button>
        <button className="lp-trust-link" onClick={onTerms}>Terms of Service ↗</button>
        <span className="lp-trust-link">Security Statement ↗</span>
        <span className="lp-trust-link">Data Deletion Request ↗</span>
      </div>
    </section>
  );
}

// ── GROWTH SECTION ────────────────────────────────────────────────────────────

function GrowthSection({ onJoin }) {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const copyRef = () => {
    navigator.clipboard?.writeText('careeraihub.com/ref/your-code').catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendGuide = () => {
    if (!email) return;
    setSent(true);
  };

  return (
    <section className="section alt lp-growth-section" id="growth">
      <div className="lp-growth-inner">
        <div className="reveal">
          <div className="ey">Refer a friend</div>
          <h2 className="sh" style={{ maxWidth: 380 }}>Give a friend a free ATS scan. Get one extra scan yourself.</h2>
          <p className="ss" style={{ marginBottom: 24 }}>Know someone in a job search? Share your referral link. When they complete their first scan, you both get a bonus free session.</p>
          <div className="lp-referral-box">
            <div className="lp-referral-link">careeraihub.com/ref/your-code</div>
            <button className="lp-referral-copy" onClick={copyRef}>{copied ? 'Copied!' : 'Copy link'}</button>
          </div>
          <div className="lp-referral-share">
            <button className="lp-ref-share-btn">Share on LinkedIn</button>
            <button className="lp-ref-share-btn">Share on Telegram</button>
          </div>
        </div>
        <div className="reveal d1">
          <div className="ey">Free resource</div>
          <h2 className="sh" style={{ maxWidth: 380 }}>Get the free guide: 7 resume mistakes that cost you interviews.</h2>
          <p className="ss" style={{ marginBottom: 20 }}>Downloaded by 500+ job seekers. Covers the ATS filters most candidates never know about.</p>
          {!sent ? (
            <>
              <div className="lp-lead-form">
                <input
                  className="lp-lead-input"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendGuide()}
                />
                <button className="lp-lead-btn" onClick={sendGuide}>Send me the guide →</button>
              </div>
              <div className="lp-lead-note">No spam. Unsubscribe anytime. PDPA compliant.</div>
            </>
          ) : (
            <div style={{ padding: '14px 18px', background: 'var(--lp-teal-dim)', border: '1px solid var(--lp-teal-b)', borderRadius: 'var(--lp-r)', fontSize: 13, color: 'var(--lp-teal)' }}>
              ✓ Guide sent! Check your inbox.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── HOW IT WORKS ─────────────────────────────────────────────────────────────

const HIW_STEPS = [
  { num:'01', tag:'Free', tagCls:'free', title:'Drop your resume', desc:'CareerAiHub reads your work history once and builds a persistent AI memory — every module knows your story instantly.', bullets: FEAT_DATA[11].bullets, outcome:'AI memory activated — all modules know your background', dotColor:'var(--lp-teal)' },
  { num:'02', tag:'Free · 1 scan', tagCls:'free', title:'Get your ATS score', desc:"Paste any job description. See your exact match %, missing keywords, and what to fix — before a recruiter sees your name.", bullets: FEAT_DATA[1].bullets, outcome:'Most users jump 20+ ATS points in a single session', dotColor:'var(--lp-teal)' },
  { num:'03', tag:'Free', tagCls:'free', title:'Apply in 5 minutes', desc:'AI memory powers a tailored application. Search 20+ live job boards. One-click apply with ATS score already checked.', bullets: FEAT_DATA[0].bullets, outcome:'329 open roles in Singapore · AI-ranked for you', dotColor:'var(--lp-teal)' },
  { num:'04', tag:'Premium', tagCls:'premium', title:'AI mock interviews', desc:'Practice with an AI that knows your resume and target role. Scored on clarity, STAR structure, and relevance.', bullets: FEAT_DATA[5].bullets, outcome:'Battle-ready before the real call', dotColor:'var(--lp-violet)' },
  { num:'05', tag:'Pro', tagCls:'pro', title:'Get Ready readiness plan', desc:'Scored across 5 interview dimensions. AI builds your personalized study plan targeting weakest areas first.', bullets: FEAT_DATA[9].bullets, outcome:'Hit 80/100 to earn a shareable Readiness Certificate', dotColor:'var(--lp-violet)' },
  { num:'06', tag:'Premium', tagCls:'premium', title:'Negotiate with market data', desc:'Live salary benchmarks for your exact role and level. Practice your counter-offer with AI — scripts, pushback simulations, data-backed anchoring.', bullets: FEAT_DATA[6].bullets, outcome:'Users average +$8K first-year comp', dotColor:'var(--lp-violet)' },
];

function HowItWorksSection({ onJoin, onSampleReport }) {
  const [expanded, setExpanded] = useState(null);
  const ss = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const isPremium = (s) => s.tagCls !== 'free';
  return (
    <section className="section lp-hiw-section" id="how-it-works">
      <div className="reveal">
        <div className="ey">How it works</div>
        <h2 className="sh" style={{whiteSpace:'nowrap'}}>Six steps. <span style={{background:'var(--lp-grad-primary)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>Zero guesswork.</span></h2>
        <p className="ss" style={{ marginBottom: 24 }}>From first upload to signed offer. Every step builds on the last.</p>
      </div>

      <div className="lp-hiw6-grid reveal d2">
        {HIW_STEPS.map((s, i) => (
          <div key={i} className={`lp-hiw6-step${isPremium(s) ? ' premium' : ''}`}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <span className={`lp-hiw6-tag ${s.tagCls}`}>{s.tag}</span>
              <div className="lp-hiw6-step-num" style={{ margin:0, fontSize:11 }}>{s.num}</div>
            </div>
            <div className="lp-hiw6-step-title">{s.title}</div>
            <div className="lp-hiw6-step-desc">{s.desc}</div>
            <button
              className="lp-hiw6-toggle"
              onClick={() => setExpanded(expanded === i ? null : i)}
              aria-expanded={expanded === i}
            >
              {expanded === i ? 'Less detail ▲' : 'Show detail ▼'}
            </button>
            {expanded === i && (
              <ul className="lp-hiw6-bullets" style={{ marginTop:8 }}>
                {s.bullets.map((b, j) => <li key={j} className="lp-hiw6-bullet"><span className="lp-hiw6-bdot" />{b}</li>)}
              </ul>
            )}
            <div className="lp-hiw6-outcome" style={{ marginTop: expanded === i ? 10 : 8 }}>
              <span className="lp-hiw6-dot" style={{ background: s.dotColor, animation:'lp-pulse 2s infinite' }} />
              {s.outcome}
            </div>
          </div>
        ))}
      </div>

      <div className="lp-hiw6-divider reveal d2">
        <div style={{flex:1,height:1,background:'linear-gradient(90deg,transparent,rgba(176,38,255,.3))'}}/>
        <button onClick={() => ss('price-sec')} className="lp-hiw6-plans-btn">See pricing plans</button>
        <div style={{flex:1,height:1,background:'linear-gradient(90deg,rgba(176,38,255,.3),transparent)'}}/>
      </div>

      <div className="lp-hiw-sample reveal d2">
        <button className="lp-hiw-sample-btn" onClick={onSampleReport}>See a sample ATS report →</button>
        <span className="lp-hiw-sample-note">No signup · Opens in 2 seconds</span>
      </div>
    </section>
  );
}

// ── PRICING ───────────────────────────────────────────────────────────────────

function PricingSection({ onJoin, onGetReady }) {
  return (
    <section className="section alt" id="price-sec">
      <div className="reveal">
        <div className="ey">Pricing</div>
        <h2 className="sh">Try free. Upgrade when it works.</h2>
        <p className="ss">No card required to start. Free tier gives you enough to feel the value — then upgrade to unlock every tool, unlimited.</p>
      </div>

      <div className="price-grid reveal d1">
        <article className="pcard">
          <h3 className="pc-name">Free</h3>
          <div className="pc-price">$0<span>/month</span></div>
          <div className="pc-note">No credit card · always free</div>
          <ul className="pc-feats">
            <li className="pcf"><span className="ck">✓</span>1 resume ATS scan</li>
            <li className="pcf"><span className="ck">✓</span>1–2 free uses per module</li>
            <li className="pcf"><span className="ck">✓</span>Job search — always free</li>
            <li className="pcf"><span className="ck">✓</span>Market intelligence — always free</li>
          </ul>
          <button className="pbtn" onClick={onJoin}>Start free — no card →</button>
        </article>

        <article className="pcard hot">
          <h3 className="pc-name">Premium · Pro</h3>
          <div className="pc-price">$22.99<span>/month</span></div>
          <div className="pc-note">$219/year · saves 20% · interview-ready in 9 days</div>
          <ul className="pc-feats">
            <li className="pcf"><span className="ck">✓</span>Unlimited resume scans + full editor</li>
            <li className="pcf"><span className="ck">✓</span>Unlimited Mock Interviews + HM Simulator</li>
            <li className="pcf"><span className="ck">✓</span>Unlimited Salary Coaching + negotiation</li>
            <li className="pcf"><span className="ck">✓</span>Full AI memory across all 10 modules</li>
            <li className="pcf"><span className="ck">✓</span>Unlimited JD analyzer + STAR builder</li>
            <li className="pcf"><span className="ck">✓</span>Unlimited Cover Letter generation</li>
            <li className="pcf"><span className="ck">✓</span><strong style={{ color: 'var(--lp-teal)' }}>Get Ready plan</strong> — AI-built from your scores + weak spots</li>
            <li className="pcf"><span className="ck">✓</span>Adaptive plan re-scored every 7 days as you improve</li>
            <li className="pcf"><span className="ck">✓</span><strong style={{ color: 'var(--lp-teal)' }}>Readiness Certificate</strong> — shareable with employers at 80+</li>
          </ul>
          <button className="pbtn pri" onClick={onGetReady}>Open Get Ready ✦</button>
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 10, color: 'var(--lp-text3)' }}>7-day free trial · cancel anytime</div>
        </article>

        <article className="pcard">
          <h3 className="pc-name">Recruiter</h3>
          <div className="pc-price">SGD 299<span>/mo</span></div>
          <div className="pc-note">Enterprise from SGD 1,500/mo</div>
          <ul className="pc-feats">
            <li className="pcf"><span className="ck">✓</span>Verified candidate pipeline</li>
            <li className="pcf"><span className="ck">✓</span>AI match shortlisting</li>
            <li className="pcf"><span className="ck">✓</span>TrustChat + credential sidebar</li>
            <li className="pcf"><span className="ck">✓</span>Recruiter Dashboard + analytics</li>
            <li className="pcf"><span className="ck">✓</span>10–20× ROI vs headhunter fees</li>
          </ul>
          <button className="pbtn" onClick={onJoin}>Request pilot →</button>
        </article>
      </div>

      <div className="reveal d2" style={{ marginTop: 22, background: 'linear-gradient(135deg,rgba(0,212,255,.06) 0%,rgba(176,38,255,.05) 100%)', border: '1px solid var(--lp-teal-b)', borderRadius: 'var(--lp-rl)', padding: '22px 28px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--lp-teal)', marginBottom: 6 }}>Included in Premium · Pro — Get Ready</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--lp-text)', marginBottom: 6, lineHeight: 1.3 }}>Interview-ready in 9 days.<br />AI builds your plan from your exact weaknesses.</div>
          <div style={{ fontSize: 12, color: 'var(--lp-text2)', lineHeight: 1.7 }}>After your mock interview, the AI scores you across 5 dimensions. It then creates a session-by-session study plan targeting your weakest areas first — and re-scores your plan every 7 days as you improve. When you hit 80+ on all dimensions, you earn a shareable Readiness Certificate.</div>
        </div>
        <button className="pbtn pri" style={{ width: 'auto', padding: '12px 28px', whiteSpace: 'nowrap', flexShrink: 0 }} onClick={onGetReady}>See Get Ready demo ✦</button>
      </div>
    </section>
  );
}

// ── COMPARE ───────────────────────────────────────────────────────────────────

function CompareSection() {
  const rows = [
    ['ATS resume scorer + builder', '✓ Live', '—', '✓', '—'],
    ['JD analyzer + STAR builder', '✓ Live', '—', '—', '—'],
    ['AI mock interview + HM simulator', '✓ Live', '—', '—', '✓'],
    ['Salary coach + negotiation roleplay', '✓ Live', '—', '—', '—'],
    ['Get Ready — interview readiness plan', '✓ Pro only', '—', '—', '—'],
    ['Readiness Certificate at 80+ score', '✓ Pro only', '—', '—', '—'],
    ['AI memory across all modules', '✓ Live', '—', '—', '—'],
    ['Blockchain credential verification', '◎ Roadmap', '—', '—', '—'],
    ['Monthly price', '$24.99/mo', '$40/mo', '$25/mo', '$40/mo'],
  ];
  return (
    <section className="section" id="compare-sec">
      <div className="reveal">
        <div className="ey">CareerAiHub vs alternatives</div>
        <h2 className="sh">$24.99/month vs $175+. One platform vs five.</h2>
        <p className="ss" style={{ marginBottom: 22 }}>The most complete AI career tool in Southeast Asia — at a fraction of what you'd pay for LinkedIn Premium, Resume.io, and Interviewing.io combined.</p>
      </div>
      <div className="reveal d1" style={{ border: '1px solid var(--lp-bdr)', borderRadius: 'var(--lp-rl)', overflow: 'hidden' }}>
        <table className="ctbl">
          <thead>
            <tr>
              <th style={{ width: '34%' }}>Feature</th>
              <th className="us">CareerAiHub</th>
              <th>LinkedIn Premium</th>
              <th>Resume.io</th>
              <th>Interviewing.io</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([feat, us, li, ri, io], i) => (
              <tr key={i}>
                <td>{feat}</td>
                <td className={us.startsWith('✓') ? 'cy' : 'cr2'}>{us}</td>
                <td className="cn">{li}</td>
                <td className={ri === '✓' ? 'cy' : 'cn'}>{ri}</td>
                <td className={io === '✓' ? 'cy' : 'cn'}>{io}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── WHY CAREERAIHUB (merged FAQ + trust Q&A) ─────────────────────────────────

const WHY_DATA = [
  ...FAQ_DATA.map(f => ({ q: f.q, body: f.a, type: 'text' })),
  ...TRUST_QA.map(t => ({ q: t.q, body: t.points, type: 'bullets' })),
];

function WhyCareerAiHubSection() {
  const [open, setOpen] = useState(null);
  return (
    <section className="section alt" id="faq-sec">
      <div className="reveal">
        <div className="ey">Why CareerAiHub</div>
        <h2 className="sh">Everything you need to know.</h2>
        <p className="ss" style={{ marginBottom: 26 }}>Common questions about CareerAiHub — the AI career platform built for Singapore job seekers.</p>
      </div>
      <div className="reveal d1 faq-list">
        {WHY_DATA.map((item, i) => (
          <div key={i} className="faq-item">
            <button className={`faq-q${open === i ? ' open' : ''}`} onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
              {item.q}<span className="faq-ch">▼</span>
            </button>
            <div className={`faq-a${open === i ? ' open' : ''}`} style={{ maxHeight: open === i ? 600 : 0 }}>
              {item.type === 'bullets'
                ? <ul className="faq-a-in" style={{ paddingLeft: 0, margin: 0 }}>
                    {item.body.map((pt, j) => (
                      <li key={j} style={{ listStyle: 'none', display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: 'var(--lp-text2)', lineHeight: 1.7 }}>
                        <span style={{ color: 'var(--lp-teal)', marginTop: 5, flexShrink: 0, fontSize: 6 }}>●</span>{pt}
                      </li>
                    ))}
                  </ul>
                : <div className="faq-a-in">{item.body}</div>
              }
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── FOOTER ────────────────────────────────────────────────────────────────────

function FooterSection({ onJoin, onPrivacy, onTerms }) {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <div className="fb"><LogoMark size={22} /><span className="lp-wordmark">career<span className="lp-wordmark-ai">ai</span>hub</span></div>
          <p className="fbsub">The AI career operating system for every professional — from first job to executive role. Singapore · 2026 · careeraihub.com</p>
        </div>
        <nav className="fcol">
          <div className="fch">Platform</div>
          {['Resume Builder', 'Mock Interviews', 'Salary Coach', 'JD Analyzer', 'HM Simulator'].map(l => (
            <a key={l} href="#feat-sec" onClick={e => { e.preventDefault(); document.getElementById('feat-sec')?.scrollIntoView({ behavior: 'smooth' }); }}>{l}</a>
          ))}
        </nav>
        <nav className="fcol">
          <div className="fch">Company</div>
          <a href="#" onClick={e => e.preventDefault()}>About</a>
          <a href="#" onClick={e => e.preventDefault()}>For investors</a>
          <a href="#" onClick={e => e.preventDefault()}>For recruiters</a>
          <a href="#" onClick={e => e.preventDefault()}>Institutions</a>
        </nav>
        <nav className="fcol">
          <div className="fch">Legal</div>
          <button style={{background:'none',border:'none',color:'inherit',cursor:'pointer',padding:0,fontSize:'inherit',fontFamily:'inherit',textAlign:'left'}} onClick={onPrivacy}>Privacy Policy</button>
          <button style={{background:'none',border:'none',color:'inherit',cursor:'pointer',padding:0,fontSize:'inherit',fontFamily:'inherit',textAlign:'left'}} onClick={onTerms}>Terms of Service</button>
          <a href="/sitemap.xml">Sitemap</a>
        </nav>
      </div>
      <div className="fbot">
        <span>© 2026 CareerAiHub Pte. Ltd. · Singapore</span>
        <div className="fbot-links">
          <button style={{background:'none',border:'none',color:'inherit',cursor:'pointer',fontFamily:'inherit',fontSize:'inherit'}} onClick={onPrivacy}>Privacy</button>
          <button style={{background:'none',border:'none',color:'inherit',cursor:'pointer',fontFamily:'inherit',fontSize:'inherit'}} onClick={onTerms}>Terms</button>
        </div>
      </div>
    </footer>
  );
}

// ── TRACKER OVERLAY ───────────────────────────────────────────────────────────

function TrackerOverlay({ onClose, onSnack }) {
  const [apps, setApps] = useState([]);

  useEffect(() => {
    try { setApps(JSON.parse(localStorage.getItem(STORE_KEY) || '[]')); } catch { setApps([]); }
  }, []);

  const saveApps = (list) => {
    setApps(list);
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
  };

  const moveApp = (id, status) => {
    saveApps(apps.map(a => a.id === id ? { ...a, status } : a));
  };

  const deleteApp = (id) => saveApps(apps.filter(a => a.id !== id));

  const updateNotes = (id, notes) => {
    saveApps(apps.map(a => a.id === id ? { ...a, notes } : a));
  };

  const stats = {
    total: apps.length,
    active: apps.filter(a => ['applied', 'screening', 'interview'].includes(a.status)).length,
    interview: apps.filter(a => a.status === 'interview').length,
    offer: apps.filter(a => a.status === 'offer').length,
  };

  return (
    <div className="lp-tracker-overlay">
      <div className="lp-tv-nav">
        <div className="lp-tv-nav-inner">
          <div className="lp-tv-logo">
            <LogoMark size={20} /><span className="lp-wordmark">career<span className="lp-wordmark-ai">ai</span>hub</span>
          </div>
          <span className="lp-tv-title">Application Tracker</span>
          <button className="lp-tv-close" onClick={onClose}>✕ Close</button>
        </div>
      </div>
      <div className="lp-tv-body">
        <div className="lp-tv-stats">
          <div className="lp-tv-stat"><div className="lp-tv-stat-n">{stats.total}</div><div className="lp-tv-stat-l">Total applied</div></div>
          <div className="lp-tv-stat"><div className="lp-tv-stat-n">{stats.active}</div><div className="lp-tv-stat-l">Active</div></div>
          <div className="lp-tv-stat"><div className="lp-tv-stat-n">{stats.interview}</div><div className="lp-tv-stat-l">Interviews</div></div>
          <div className="lp-tv-stat"><div className="lp-tv-stat-n">{stats.offer}</div><div className="lp-tv-stat-l">Offers</div></div>
        </div>
        {apps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--lp-text2)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--lp-text)' }}>No applications yet</div>
            <div style={{ fontSize: 13 }}>Search for jobs above and click "Apply now" to start tracking.</div>
          </div>
        ) : (
          <div className="lp-tv-kanban">
            {STAGES.map(stage => (
              <div key={stage} className="lp-tv-col">
                <div className="lp-tv-col-hd">
                  <span>{STAGE_LABELS[stage]}</span>
                  <span className="lp-tv-col-count">{apps.filter(a => a.status === stage).length}</span>
                </div>
                <div className="lp-tv-col-items">
                  {apps.filter(a => a.status === stage).length === 0 ? (
                    <div className="lp-tv-col-empty">No applications</div>
                  ) : (
                    apps.filter(a => a.status === stage).map(app => (
                      <div key={app.id} className="lp-app-card">
                        <div className="lp-app-card-role">{app.role}</div>
                        <div className="lp-app-card-company">{app.company}</div>
                        <div className="lp-app-card-meta">
                          <span className="lp-app-card-date">{formatDate(app.date)}</span>
                          <span className="lp-app-card-source">{app.source || 'Job Search'}</span>
                        </div>
                        {app.url && <a className="lp-app-card-link" href={app.url} target="_blank" rel="noopener noreferrer">↗ View listing</a>}
                        <div className="lp-app-card-actions">
                          {STAGES.filter(s => s !== stage).slice(0, 3).map(s => (
                            <button key={s} className="lp-app-card-btn" onClick={() => moveApp(app.id, s)}>{STAGE_LABELS[s]}</button>
                          ))}
                          <button className="lp-app-card-btn" style={{ color: 'var(--lp-red)', borderColor: 'rgba(255,107,107,.2)' }} onClick={() => deleteApp(app.id)}>Remove</button>
                        </div>
                        <textarea className="lp-app-card-notes" placeholder="Add notes — interview date, contact name, follow-up..." defaultValue={app.notes || ''} onBlur={e => updateNotes(app.id, e.target.value)} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── COVER LETTERS MODAL ───────────────────────────────────────────────────────

const SAMPLE_LETTERS = [
  {
    role: 'Senior Product Manager',
    company: 'Grab',
    preview: `Dear Hiring Team,\n\nI'm applying for the Senior PM role at Grab. In my previous role at Shopee, I led the checkout redesign that reduced abandonment by 34% and recovered SGD 2.1M in GMV within one quarter — directly aligned with Grab's focus on conversion and retention.\n\nI'd welcome the opportunity to bring that same rigour to Grab's payments and super-app experience.\n\nBest,\nAman Ashwin`,
    score: 91,
    status: 'Ready to send',
    statusColor: '#10B981',
  },
  {
    role: 'Head of Product',
    company: 'Carousell',
    preview: `Dear Hiring Team,\n\nYour recent expansion into financial services caught my attention — it maps closely to work I led at Shopee scaling cross-border payments across SEA. I drove a 3x increase in payment method coverage while reducing failed transaction rates by 18%.\n\nCarousell's trajectory from marketplace to fintech is exactly the kind of 0→1 challenge I thrive in.\n\nBest,\nAman Ashwin`,
    score: 87,
    status: 'Needs tailoring',
    statusColor: '#F59E0B',
  },
  {
    role: 'Product Lead, Growth',
    company: 'Stripe',
    preview: `Dear Hiring Team,\n\nStripe's developer-first philosophy resonates deeply — I've spent the past 4 years building products that make complex financial infrastructure invisible to end users. My work at Shopee reduced integration time for new payment partners from 6 weeks to 8 days through a self-serve API layer.\n\nI'd love to bring that mindset to Stripe's expansion in Southeast Asia.\n\nBest,\nAman Ashwin`,
    score: 83,
    status: 'Needs tailoring',
    statusColor: '#F59E0B',
  },
];

function CoverLetterModal({ onClose }) {
  const [active, setActive] = useState(0);
  const letter = SAMPLE_LETTERS[active];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div style={{ background: '#0F1219', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 16, width: '100%', maxWidth: 720, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ color: '#6366F1', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Agentic Job Search</div>
            <div style={{ color: '#EDF1F8', fontWeight: 800, fontSize: 16 }}>Drafted Cover Letters · 3 matches found</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#8896AD', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          {SAMPLE_LETTERS.map((l, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                flex: 1, padding: '12px 8px', border: 'none', cursor: 'pointer', background: active === i ? 'rgba(99,102,241,0.09)' : 'transparent',
                borderBottom: active === i ? '2px solid #6366F1' : '2px solid transparent',
                color: active === i ? '#EDF1F8' : '#8896AD', fontSize: 12, fontWeight: active === i ? 700 : 500,
                transition: 'all 0.18s', fontFamily: 'inherit', textAlign: 'center', lineHeight: 1.4
              }}
            >
              <div>{l.company}</div>
              <div style={{ fontSize: 10, marginTop: 2, color: active === i ? '#8896AD' : '#4F5C6E' }}>{l.role}</div>
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#EDF1F8' }}>{letter.role} · {letter.company}</div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: letter.statusColor + '18', color: letter.statusColor, border: `1px solid ${letter.statusColor}33` }}>{letter.status}</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#6366F1', fontFamily: 'monospace' }}>ATS {letter.score}%</div>
            </div>
          </div>

          <div style={{ background: '#141A24', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '20px 22px', fontSize: 13, color: '#8896AD', lineHeight: 1.85, whiteSpace: 'pre-line', fontFamily: 'inherit' }}>
            {letter.preview}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 10, flexShrink: 0 }}>
          <button style={{ flex: 1, padding: '11px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Use This Letter →
          </button>
          <button onClick={onClose} style={{ padding: '11px 18px', background: 'transparent', color: '#8896AD', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── GET READY TAB DEFINITIONS ─────────────────────────────────────────────────

const GR_TABS_DEF = [
  { k: 'dashboard', label: 'Dashboard',       icon: '📊' },
  { k: 'modules',   label: 'Study Modules',   icon: '📚' },
  { k: 'radar',     label: 'Weakness Radar',  icon: '📡', moduleId: 'radar',  fi: 8  },
  { k: 'star',      label: 'STAR Builder',    icon: '⭐', moduleId: 'star',   fi: 4  },
  { k: 'score',     label: 'Readiness Score', icon: '🏆', moduleId: 'score',  fi: 9  },
  { k: 'memory',    label: 'AI Memory',       icon: '🧬', moduleId: 'memory', fi: 11 },
];

// ── GET READY TAB STRIP (used inside each Get Ready feature in the app) ───────

export function GetReadyTabStrip({ activeModuleId, onNavigate, onStudyPlan }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 20px', background:'rgba(0,212,255,.04)', borderBottom:'1px solid rgba(0,212,255,.1)', fontFamily:'var(--lp-ff)', overflowX:'auto', flexWrap:'nowrap', scrollbarWidth:'none' }}>
      <span style={{ fontSize:9, fontWeight:800, color:'var(--lp-teal)', textTransform:'uppercase', letterSpacing:'.12em', flexShrink:0, marginRight:6, whiteSpace:'nowrap' }}>✦ GET READY</span>
      <div style={{ width:1, height:16, background:'rgba(0,212,255,.15)', flexShrink:0, marginRight:2 }} />
      {GR_TABS_DEF.map(t => {
        const isActive = t.moduleId && t.moduleId === activeModuleId;
        return (
          <button
            key={t.k}
            style={{ padding:'4px 12px', borderRadius:6, fontSize:12, fontWeight:600, color: isActive ? 'var(--lp-teal)' : 'var(--lp-text2)', background: isActive ? 'var(--lp-teal-dim)' : 'transparent', border:`1px solid ${isActive ? 'var(--lp-teal-b)' : 'transparent'}`, cursor:'pointer', transition:'all .15s', fontFamily:'var(--lp-ff)', whiteSpace:'nowrap', flexShrink:0 }}
            onClick={() => t.moduleId ? onNavigate(t.moduleId) : onStudyPlan(t.k)}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ── STUDY PLAN MODAL ─────────────────────────────────────────────────────────

export function StudyPlanModal({ onClose, initialTab = 'dashboard', onModuleSelect }) {
  const [tab, setTab] = useState(initialTab);
  return (
    <div className="lp-modal-overlay" onClick={onClose}>
      <div className="lp-sp-modal" style={{ maxWidth: 780 }} onClick={e => e.stopPropagation()}>
        <div className="lp-modal-hd">
          <div className="lp-modal-title">
            ✅ Get Ready
            <span className="lp-sp-modal-badge">Interview Readiness · Pro</span>
          </div>
          <button className="lp-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="lp-modal-body">
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
            {GR_TABS_DEF.map(t => (
              <button key={t.k} className={`lp-sp-tab${tab === t.k ? ' on' : ''}`} onClick={() => setTab(t.k)}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'dashboard' && (
            <div>
              <div className="lp-sp-score-strip">
                {[{n:38,l:'Concrete examples',c:'#FF4D6A'},{n:44,l:'STAR structure',c:'#FFD233'},{n:72,l:'Clarity',c:'#00E5A0'},{n:84,l:'Role knowledge',c:'#00E5A0'},{n:'61/100',l:'Overall readiness',c:'var(--lp-teal)',sm:true}].map((s,i)=>(
                  <div key={i} className="lp-sp-sc">
                    <div className="lp-sp-sc-num" style={{color:s.c,fontSize:s.sm?18:undefined}}>{s.n}</div>
                    <div className="lp-sp-sc-lbl">{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="lp-sp-coach">
                <div className="lp-sp-coach-av">AI</div>
                <div className="lp-sp-coach-text"><strong>Based on your last 2 sessions,</strong> your biggest gap is concrete examples — you score 38/100. You describe situations generally without naming outcomes, numbers, or impact. Your readiness plan targets this first. Once you clear 70, we move to STAR structure. <strong>Estimated time to interview-ready: 9 days.</strong></div>
              </div>
              <div className="lp-sp-next">
                <div>
                  <div className="lp-sp-next-lbl">Recommended next · start now</div>
                  <div className="lp-sp-next-title">Concrete examples drill — behavioral questions</div>
                  <div className="lp-sp-next-meta">20 min · targets your weakest dimension · session 1 of 3</div>
                </div>
                <button className="lp-sp-start-btn" onClick={onClose}>Start session →</button>
              </div>
              <div className="lp-sp-section-lbl">Your readiness plan</div>
              <div className="lp-sp-mod-grid">
                {[
                  {title:'Concrete examples',badge:'Weakest',bc:'weak',pct:38,bg:'#FF4D6A',desc:'Anchor every answer with a specific number, outcome, or named result.',sessions:'3 sessions · unlocked · start today',active:true},
                  {title:'STAR structure',badge:'Gap',bc:'weak',pct:44,bg:'#FFD233',desc:'Situation · Task · Action · Result — every behavioral answer follows this arc.',sessions:'2 sessions · unlocks after concrete examples clears 70'},
                  {title:'Clarity + delivery',badge:'Good',bc:'ok',pct:72,bg:'#00E5A0',desc:'Maintenance sessions only — 1 drill/week to hold your score above 70.',sessions:'1 maintenance session/week'},
                  {title:'Salary negotiation roleplay',badge:'Locked',bc:'locked',pct:0,bg:'var(--lp-bdr)',desc:'Live AI roleplay · market data · pre-built scripts. Unlocks at readiness 75+.',sessions:'Unlocks when readiness reaches 75',locked:true},
                ].map((m,i)=>(
                  <div key={i} className={`lp-sp-mod${m.active?' sp-active':''}${m.locked?' sp-locked':''}`}>
                    <div className="lp-sp-mod-hd">
                      <span className="lp-sp-mod-title">{m.title}</span>
                      <span className={`lp-sp-mod-badge sp-badge-${m.bc}`}>{m.badge}</span>
                    </div>
                    <div className="lp-sp-bar-bg"><div className="lp-sp-bar" style={{width:m.pct+'%',background:m.bg}}/></div>
                    <div className="lp-sp-mod-desc">{m.desc}</div>
                    <div className="lp-sp-mod-sessions">{m.sessions}</div>
                  </div>
                ))}
              </div>
              <div className="lp-sp-upgrade-strip">
                <div className="lp-sp-upgrade-text"><strong>Get Ready · Pro — $24.99/month</strong> · This plan re-scores every 7 days. Once you hit 80+ on all 5 dimensions, we generate your shareable Readiness Certificate.</div>
                <button className="lp-sp-upgrade-btn" onClick={onClose}>Upgrade to Pro ✦</button>
              </div>
            </div>
          )}

          {tab === 'modules' && (
            <div>
              <div className="lp-sp-section-lbl">Get Ready modules — AI-sequenced for you</div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {[
                  {n:'1',title:'Concrete examples drill',badge:'Active — session 1/3',bc:'weak',pct:38,bg:'#FF4D6A',desc:"You'll practice 6 behavioral questions. For each, AI coaches you to replace vague language with a specific number, outcome, or named result. Score must reach 70 before module 2 unlocks.",active:true},
                  {n:'2',title:'STAR structure mastery',badge:'Unlocks after module 1',bc:'',pct:44,bg:'#FFD233',desc:'2-session deep dive on Situation, Task, Action, Result framing. AI gives real-time feedback on each section of your answer.'},
                  {n:'3',title:'Clarity + filler word reduction',badge:'Maintenance',bc:'ok',pct:72,bg:'#00E5A0',desc:'You\'re already strong here. 1 drill per week keeps you above 70. AI tracks "um", "like", and hedging language across every session.'},
                  {n:'4',title:'Salary negotiation roleplay',badge:'Premium · locked',bc:'locked',pct:0,bg:'var(--lp-bdr)',desc:'AI plays the hiring manager. Practice counter-offer language with live Singapore market data for your target role. Most users gain SGD 800–1,200/month after 3 sessions.',locked:true},
                  {n:'5',title:'Weakness framing',badge:'Premium · locked',bc:'locked',pct:0,bg:'var(--lp-bdr)',desc:'The most-failed question type. Pre-built frameworks, AI scores your framing, practice until it sounds natural — not rehearsed.',locked:true},
                ].map((m,i)=>(
                  <div key={i} className={`lp-sp-mod${m.active?' sp-active':''}${m.locked?' sp-locked':''}`} style={{borderRadius:'var(--lp-r)'}}>
                    <div className="lp-sp-mod-hd">
                      <span className="lp-sp-mod-title">{m.n} · {m.title}</span>
                      <span className={`lp-sp-mod-badge${m.bc?' sp-badge-'+m.bc:''}`} style={!m.bc?{background:'var(--lp-bg5)',color:'var(--lp-text3)'}:{}}>{m.badge}</span>
                    </div>
                    <div className="lp-sp-bar-bg"><div className="lp-sp-bar" style={{width:m.pct+'%',background:m.bg}}/></div>
                    <div className="lp-sp-mod-desc">{m.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {['radar','star','score','memory'].includes(tab) && (() => {
            const tDef = GR_TABS_DEF.find(t => t.k === tab);
            const f = FEAT_DATA[tDef.fi];
            return (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--lp-teal)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>{f.ey}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--lp-text)', marginBottom: 8, letterSpacing: '-.3px' }}>{f.title}</div>
                  <p style={{ fontSize: 13, color: 'var(--lp-text2)', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                </div>
                <div className="lp" style={{ background: 'transparent', minHeight: 'unset', overflow: 'visible' }}>
                  <div style={{ background: 'var(--lp-bg3)', border: '1px solid var(--lp-bdr)', borderRadius: 'var(--lp-r)', padding: 16, marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--lp-text3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>{f.previewHd}</div>
                    <div dangerouslySetInnerHTML={{ __html: f.preview }} />
                  </div>
                </div>
                <ul style={{ margin: '0 0 20px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {f.bullets.map((b, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--lp-text2)', lineHeight: 1.55 }}>
                      <span style={{ color: 'var(--lp-teal)', flexShrink: 0, marginTop: 1 }}>✓</span>{b}
                    </li>
                  ))}
                </ul>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {onModuleSelect ? (
                    <button className="lp-sp-start-btn" onClick={() => { onModuleSelect(tab); onClose(); }}>
                      Open {f.label} →
                    </button>
                  ) : (
                    <button className="lp-sp-upgrade-btn">Upgrade to Pro — $24.99/mo ✦</button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// ── SAMPLE REPORT MODAL ───────────────────────────────────────────────────────

function SampleReportModal({ onClose }) {
  return (
    <div className="lp-modal-overlay" onClick={onClose}>
      <div className="lp-modal-box" onClick={e => e.stopPropagation()}>
        <div className="lp-modal-hd">
          <div className="lp-modal-title">Sample ATS Report — Senior Product Manager</div>
          <button className="lp-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="lp-modal-body">
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'var(--lp-amber-dim)',border:'1px solid var(--lp-amber-b)',borderRadius:'var(--lp-rs)',marginBottom:20,fontSize:11,color:'var(--lp-amber)'}}>
            <span>👁</span><strong>Demo mode</strong> — real analysis from an anonymised beta user. Your report will be personalised to your actual resume.
          </div>
          <div style={{display:'flex',alignItems:'center',gap:16,padding:16,background:'var(--lp-bg3)',borderRadius:'var(--lp-r)',border:'1px solid var(--lp-bdr)',marginBottom:16}}>
            <div style={{textAlign:'center',flexShrink:0}}>
              <div style={{fontSize:44,fontWeight:800,color:'var(--lp-amber)',fontFamily:'var(--lp-ffm)',letterSpacing:-1.5,lineHeight:1}}>74%</div>
              <div style={{fontSize:10,color:'var(--lp-text3)',marginTop:3}}>ATS Match</div>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:'var(--lp-amber)',marginBottom:6}}>3 gaps found — fixing them could push to 91%+</div>
              <div style={{height:6,borderRadius:3,background:'var(--lp-bg4)',overflow:'hidden',marginBottom:8}}><div style={{width:'74%',height:'100%',background:'var(--lp-amber)',borderRadius:3}}/></div>
              <div style={{fontSize:11,color:'var(--lp-text2)'}}>Passing 5 of 8 ATS filters. Three critical keywords missing.</div>
            </div>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--lp-text3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:10}}>Findings — grouped by severity</div>
            <div style={{padding:'12px 14px',background:'var(--lp-red-dim)',border:'1px solid rgba(255,107,107,.2)',borderRadius:'var(--lp-rs)',marginBottom:8}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--lp-red)',marginBottom:5}}>High — Missing critical keywords</div>
              <div style={{fontSize:12,color:'var(--lp-text2)',marginBottom:8}}>These appear in 78% of Senior PM job descriptions but are absent from this resume.</div>
              <div><span className="mk-tag x">OKR framework</span><span className="mk-tag x">go-to-market</span></div>
            </div>
            <div style={{padding:'12px 14px',background:'var(--lp-amber-dim)',border:'1px solid var(--lp-amber-b)',borderRadius:'var(--lp-rs)',marginBottom:8}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--lp-amber)',marginBottom:5}}>Medium — Weak impact language</div>
              <div style={{fontSize:12,color:'var(--lp-text2)'}}>3 bullets use passive voice. ATS and recruiters favour active, quantified verbs.</div>
            </div>
            <div style={{padding:'12px 14px',background:'var(--lp-teal-dim)',border:'1px solid var(--lp-teal-b)',borderRadius:'var(--lp-rs)'}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--lp-teal)',marginBottom:5}}>Passing — Strong keywords found</div>
              <div><span className="mk-tag m">product strategy</span><span className="mk-tag m">roadmap</span><span className="mk-tag m">agile</span><span className="mk-tag m">data-driven</span></div>
            </div>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--lp-text3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:8}}>Before → After — one bullet rewritten</div>
            <div className="lp-ats-diff-row">
              <div className="lp-ats-diff-panel before"><div className="lp-ats-diff-lbl">Before</div><div className="lp-ats-diff-text">Helped drive product roadmap for checkout feature, working with engineering team.</div></div>
              <div className="lp-ats-diff-arrow">→</div>
              <div className="lp-ats-diff-panel after"><div className="lp-ats-diff-lbl">After</div><div className="lp-ats-diff-text">Spearheaded go-to-market strategy for checkout redesign, applying OKR framework to reduce abandonment 34% with 8-person engineering team.</div></div>
            </div>
          </div>
          <div style={{padding:16,background:'var(--lp-teal-dim)',border:'1px solid var(--lp-teal-b)',borderRadius:'var(--lp-r)'}}>
            <div style={{fontSize:13,fontWeight:700,color:'var(--lp-teal)',marginBottom:4}}>Your real report is personalised to your resume and target role.</div>
            <div style={{fontSize:12,color:'var(--lp-text2)',marginBottom:14}}>Paste your resume snippet above to see your actual ATS score, specific gaps, and line-by-line rewrites.</div>
            <button className="lp-sp-start-btn" onClick={onClose}>Get my real score — free</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PRIVACY MODAL ─────────────────────────────────────────────────────────────

function PrivacyModal({ onClose }) {
  return (
    <div className="lp-modal-overlay" onClick={onClose}>
      <div className="lp-modal-box" onClick={e => e.stopPropagation()}>
        <div className="lp-modal-hd">
          <div className="lp-modal-title">Privacy Policy — CareerAiHub</div>
          <button className="lp-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="lp-modal-body">
          <div className="lp-legal-content">
            <p style={{fontSize:11,color:'var(--lp-text3)',marginBottom:16}}>Last updated: April 2026 · CareerAiHub Pte. Ltd. · Singapore</p>
            <h3>1. What data we collect</h3>
            <p>We collect your resume file (PDF or DOCX), your email address when you create an account, and your usage data within the platform (modules used, scores generated, sessions completed). We do not collect payment card data directly — this is handled by our payment processor.</p>
            <h3>2. How we use your data</h3>
            <p>Your resume is used solely to power your CareerAiHub modules — ATS scoring, cover letter generation, interview coaching, and salary benchmarking. It is never shared with recruiters, employers, or third-party advertisers without your explicit consent.</p>
            <h3>3. Data storage and security</h3>
            <p>All data is encrypted at rest (AES-256) and in transit (TLS 1.3). Your resume is stored on secure cloud infrastructure in Singapore. We conduct regular security audits and access is restricted to essential engineering staff only.</p>
            <h3>4. Your rights (PDPA)</h3>
            <ul>
              <li>Access your personal data at any time from your account settings</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data — processed within 24 hours</li>
              <li>Withdraw consent for data processing at any time</li>
            </ul>
            <h3>5. Cookies</h3>
            <p>We use essential cookies for session management and optional analytics cookies (Google Analytics 4) to understand platform usage. You can decline optional cookies via the consent banner.</p>
            <h3>6. Contact</h3>
            <p>For any privacy questions: privacy@careeraihub.com · CareerAiHub Pte. Ltd. · Singapore</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TERMS OF SERVICE MODAL ────────────────────────────────────────────────────

function ToSModal({ onClose }) {
  return (
    <div className="lp-modal-overlay" onClick={onClose}>
      <div className="lp-modal-box" onClick={e => e.stopPropagation()}>
        <div className="lp-modal-hd">
          <div className="lp-modal-title">Terms of Service — CareerAiHub</div>
          <button className="lp-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="lp-modal-body">
          <div className="lp-legal-content">
            <p style={{fontSize:11,color:'var(--lp-text3)',marginBottom:16}}>Last updated: April 2026 · CareerAiHub Pte. Ltd. · Singapore</p>
            <h3>1. Acceptance of terms</h3>
            <p>By using CareerAiHub, you agree to these Terms of Service. If you do not agree, please do not use the platform.</p>
            <h3>2. Service description</h3>
            <p>CareerAiHub provides AI-powered career tools including resume scanning, ATS scoring, mock interview coaching, salary benchmarking, and related services. Features marked "Building next" or "Planned" are roadmap items and not currently available.</p>
            <h3>3. User obligations</h3>
            <ul>
              <li>You must be 18 years or older to use the platform</li>
              <li>You may only upload resumes and documents you have the right to share</li>
              <li>You may not use the platform for any unlawful purpose</li>
              <li>You may not attempt to reverse-engineer or copy the platform</li>
            </ul>
            <h3>4. Subscription and billing</h3>
            <p>Premium subscriptions are billed monthly at $19 USD (Premium) or $24.99 USD (Pro · Get Ready), or annually at $180 USD / $239 USD respectively. You may cancel at any time. Refunds are available within 7 days of initial purchase if you are unsatisfied.</p>
            <h3>5. Limitation of liability</h3>
            <p>CareerAiHub provides career guidance tools, not guaranteed employment outcomes. AI-generated scores and suggestions are for informational purposes. We are not liable for employment decisions made by third parties.</p>
            <h3>6. Governing law</h3>
            <p>These terms are governed by the laws of Singapore. Disputes shall be resolved in Singapore courts.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── COOKIE BANNER ─────────────────────────────────────────────────────────────

function CookieBanner({ onPrivacy, onTerms }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem('lp_cookie_consent')) setVisible(true);
  }, []);
  if (!visible) return null;
  const accept = () => { localStorage.setItem('lp_cookie_consent', '1'); setVisible(false); };
  const decline = () => { localStorage.setItem('lp_cookie_consent', 'declined'); setVisible(false); };
  return (
    <div className="lp-cookie-banner show">
      <div className="lp-cookie-text">
        We use cookies to improve your experience and analyze platform usage. Your resume data is encrypted and never sold.{' '}
        <button onClick={onPrivacy}>Privacy Policy</button> · <button onClick={onTerms}>Terms of Service</button>
      </div>
      <button className="lp-cookie-decline" onClick={decline}>Decline optional</button>
      <button className="lp-cookie-accept" onClick={accept}>Accept &amp; continue</button>
    </div>
  );
}

// ── SNACK ─────────────────────────────────────────────────────────────────────

function SuccessSnack({ msg, visible }) {
  return (
    <div className={`lp-snack${visible ? ' show' : ''}`}>
      <span className="lp-snack-icon">✓</span>
      <span>{msg}</span>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

export default function LandingPage({ setAuthModal, onModuleSelect }) {
  const [activePill, setActivePill] = useState(0);
  const [featModalOpen, setFeatModalOpen] = useState(false);
  const [featModalTab, setFeatModalTab] = useState(0);
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [coverLetterOpen, setCoverLetterOpen] = useState(false);
  const [studyPlanOpen, setStudyPlanOpen] = useState(false);
  const [sampleReportOpen, setSampleReportOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [tosOpen, setTosOpen] = useState(false);
  const [lightMode, setLightMode] = useState(false);
  const [snack, setSnack] = useState({ msg: '', visible: false });
  const [navScrolled, setNavScrolled] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const rootRef = useRef(null);
  useScrollReveal(rootRef);

  useEffect(() => {
    document.body.classList.toggle('lp-light', lightMode);
    return () => document.body.classList.remove('lp-light');
  }, [lightMode]);

  useEffect(() => {
    const onScroll = () => {
      const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
      setScrollPct(Math.min(pct, 100));
      setNavScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);


  const showSnack = (msg) => {
    setSnack({ msg, visible: true });
    setTimeout(() => setSnack(s => ({ ...s, visible: false })), 4000);
  };

  const onSignIn = () => setAuthModal('login');
  const onJoin = () => setAuthModal('register');

  const handlePill = (i) => {
    setActivePill(i);
    const moduleId = PILLS[i]?.moduleId;
    if (moduleId && onModuleSelect) onModuleSelect(moduleId);
  };

  return (
    <div className="lp" ref={rootRef}>
      <div className="lp-progress-bar" style={{ width: scrollPct + '%' }} aria-hidden="true" />
      <div className="lp-ambient" aria-hidden="true">
        <div className="lp-amb-orb a1" /><div className="lp-amb-orb a2" /><div className="lp-amb-orb a3" />
      </div>

      <NavBar
        onSignIn={onSignIn} onJoin={onJoin} scrolled={navScrolled}
        lightMode={lightMode} onToggleLightMode={() => setLightMode(lm => !lm)}
        onFeatOpen={(moduleId) => {
          const tab = NAV_FEAT_MAP[moduleId] ?? 0;
          setFeatModalTab(tab);
          setFeatModalOpen(true);
        }}
      />
      <HubNav onModuleSelect={onModuleSelect} onTrackerOpen={() => setTrackerOpen(true)} onGetReady={() => setStudyPlanOpen(true)} onFeatModal={(tab) => { setFeatModalTab(tab ?? 0); setFeatModalOpen(true); }} />

      <HeroSection onJoin={onJoin} onModuleSelect={onModuleSelect} onTrackerOpen={() => setTrackerOpen(true)} onSnack={showSnack} onAgenticCta={() => setCoverLetterOpen(true)} />

      <FunnelStrip />

      <div className="sec-divider" />

      <PlatformLayers onJoin={onJoin} />

      <div className="sec-divider" />

      <HowItWorksSection onJoin={onJoin} onSampleReport={() => setSampleReportOpen(true)} />

      <div className="sec-divider" />

      <TestimonialsSection />

      <div className="sec-divider" />

      <PricingSection onJoin={onJoin} onGetReady={() => setStudyPlanOpen(true)} />

      <div className="sec-divider" />

      <WhyCareerAiHubSection />

      <div className="sec-divider" />

      <DataProtectedSection onPrivacy={() => setPrivacyOpen(true)} onTerms={() => setTosOpen(true)} />

      <div className="sec-divider" />

      <GrowthSection onJoin={onJoin} />

      <FooterSection onJoin={onJoin} onPrivacy={() => setPrivacyOpen(true)} onTerms={() => setTosOpen(true)} />

      {trackerOpen && <TrackerOverlay onClose={() => setTrackerOpen(false)} onSnack={showSnack} />}
      {coverLetterOpen && <CoverLetterModal onClose={() => setCoverLetterOpen(false)} />}
      {studyPlanOpen && <StudyPlanModal onClose={() => setStudyPlanOpen(false)} />}
      {sampleReportOpen && <SampleReportModal onClose={() => setSampleReportOpen(false)} />}
      {privacyOpen && <PrivacyModal onClose={() => setPrivacyOpen(false)} />}
      {tosOpen && <ToSModal onClose={() => setTosOpen(false)} />}
      {featModalOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(9,12,18,.92)', backdropFilter:'blur(10px)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', borderBottom:'1px solid rgba(255,255,255,.08)', flexShrink:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--lp-teal)', textTransform:'uppercase', letterSpacing:'.08em' }}>Every tool, explored</div>
            <button onClick={() => setFeatModalOpen(false)} style={{ background:'none', border:'1px solid rgba(255,255,255,.1)', color:'var(--lp-text2)', cursor:'pointer', borderRadius:6, padding:'5px 14px', fontSize:12, fontFamily:'var(--lp-ff)' }}>✕ Close</button>
          </div>
          <div style={{ flex:1, overflow:'auto' }}>
            <FeatureSection onJoin={onJoin} activePill={featModalTab} onModuleSelect={(id) => { onModuleSelect?.(id); setFeatModalOpen(false); }} />
          </div>
        </div>
      )}
      <CookieBanner onPrivacy={() => { setPrivacyOpen(true); }} onTerms={() => { setTosOpen(true); }} />
      <button className="lp-get-ready-float" onClick={() => setStudyPlanOpen(true)}>
        <span className="lp-float-dot" />✦ Get Ready
      </button>
      <button className="lp-feedback-btn" onClick={() => { window.open('mailto:feedback@careeraihub.com?subject=CareerAiHub%20Feedback&body=Hi%2C%0A%0AFeedback%3A%0A%0A'); }}>
        💬 Send feedback
      </button>
      <SuccessSnack msg={snack.msg} visible={snack.visible} />
    </div>
  );
}
