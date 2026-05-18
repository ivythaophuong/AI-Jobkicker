import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import './landing.css';
import './landing-v10.css';
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
  {
    icon: '', label: 'TrustMatch', tag: 'New',
    tools: [
      { icon: '', label: 'TrustMatch', sub: 'Verified employer matching', moduleId: 'trustmatch' },
    ],
  },
];

// 3-column megamenu arrangement
const MEGA_COLS = [
  [NAV_CATEGORIES[0], NAV_CATEGORIES[3]], // Job Search + Get the Offer
  [NAV_CATEGORIES[1], NAV_CATEGORIES[4]], // Get Seen + Get Paid
  [NAV_CATEGORIES[2], NAV_CATEGORIES[5]], // Get Ready + TrustMatch
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
        {cat.tag === 'Pro'  && <span className="lp-hub-pill-badge">Pro</span>}
        {cat.tag === 'New'  && <span className="lp-hub-pill-badge" style={{ background: 'linear-gradient(135deg,#B026FF,#00D4FF)' }}>NEW</span>}
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
  { icon: '🧬', label: 'AI Memory',      moduleId: 'memory'      },
  { icon: '',   label: 'TrustMatch',    moduleId: 'trustmatch'  },
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

// ── JOURNEY SECTION ──────────────────────────────────────────────────────────

const JOURNEY_STAGES = [
  {
    num: '01', label: 'Get Seen', color: '#1D9E75',
    problem: 'Your resume is filtered out before a human ever reads it.',
    pain: '"75% of resumes are rejected by ATS software — not people."',
    bullets: [
      'Resume Scan — ATS score & issue flags in 20 seconds',
      'ATS Builder — rebuild your resume for keywords & format',
      'JD Analyzer — decode any job description instantly',
      'Cover Letter — AI-written, role-tailored in seconds',
    ],
    outcome: '↑ ATS score 38→91 avg — in 20 seconds',
  },
  {
    num: '02', label: 'Get Ready', color: '#7F77DD',
    problem: 'Your personalized plan — built from your scores, not a template.',
    pain: '"Most people prep randomly. AI targets your exact weaknesses."',
    bullets: [
      'AI hiring managers in 8 archetypes — real pressure, real feedback',
      'STAR story builder & bank your best answers',
      'Scored on clarity, STAR structure, and relevance',
      'Get Ready plan — personalized study roadmap',
    ],
    outcome: '9 days avg. time to interview-ready',
  },
  {
    num: '03', label: 'Get the Offer', color: '#BA7517',
    problem: 'Negotiate with data, not hope.',
    pain: '"I always take the first number."',
    bullets: [
      'Salary Coach — market benchmarks & negotiation scripts',
      'Market Intel — salary + hiring demand live data',
      'Counter-offer scripts with position anchors',
      'Pushback simulation with AI playing the recruiter',
    ],
    outcome: '↑ SGD 4–12k more per month',
  },
  {
    num: '04', label: 'Get Found', color: '#D4537E',
    problem: 'Skip the black hole. Get found in 4 minutes.',
    pain: '"Applied to 60 roles. Heard back from 3."',
    bullets: [
      'AI Marketplace — dual-screen match engine',
      'Credential verify — Singpass, Credly, university',
      'TrustChat — recruiter ping with verified sidebar',
      'Trust Score built from your actual ATS + interview performance',
    ],
    outcome: '↑ 95% match · 4 min avg time-to-recruiter',
  },
];

// ── JOURNEY DECK CARD COMPONENTS ─────────────────────────────────────────────

function JnyCard({ step, title, statusCls, statusTxt, children }) {
  const sc = statusCls === 'done' ? 'jny-st-done' : statusCls === 'live' ? 'jny-st-live' : 'jny-st-run';
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div className="jny-dcard-top">
        <div className="jny-dct-dots"><div className="jny-dct-dot"/><div className="jny-dct-dot"/><div className="jny-dct-dot"/></div>
        <span className="jny-dct-step">{step}</span>
        <span className={`jny-dct-status ${sc}`}>{statusTxt}</span>
      </div>
      <div className="jny-dcard-body">
        <div className="jny-dcard-title">{title}</div>
        {children}
      </div>
    </div>
  );
}

// Stage 0: Get Seen (teal)
function S0Card1({ color: c, active }) {
  const [upW, setUpW] = useState(0);
  const [upDone, setUpDone] = useState(false);
  const [score, setScore] = useState(38);
  const [scoreCol, setScoreCol] = useState('#ef4444');
  const [tagVis, setTagVis] = useState(false);
  const [b0, setB0] = useState({ cls:'', txt:'Helped drive product roadmap with teams' });
  const [b1, setB1] = useState({ cls:'', txt:'Was involved in major decisions' });
  const [b2, setB2] = useState({ cls:'', txt:'Worked with stakeholders on delivery' });
  const [kw, setKw] = useState([0,0,0,0,0,0]);
  useEffect(() => {
    if (!active) {
      setUpW(0); setUpDone(false); setScore(38); setScoreCol('#ef4444'); setTagVis(false);
      setB0({ cls:'', txt:'Helped drive product roadmap with teams' });
      setB1({ cls:'', txt:'Was involved in major decisions' });
      setB2({ cls:'', txt:'Worked with stakeholders on delivery' });
      setKw([0,0,0,0,0,0]); return;
    }
    const ids = [];
    const s = (ms, fn) => ids.push(setTimeout(fn, ms));
    const anim = (from, to, col) => {
      let cur = from;
      const iv = setInterval(() => { cur=Math.min(cur+1,to); setScore(cur); setScoreCol(col); if(cur>=to)clearInterval(iv); }, 28);
      ids.push(iv);
    };
    s(200, () => setUpW(100));
    s(900, () => setUpDone(true));
    s(1300, () => setB0(b=>({...b,cls:'bad'})));
    s(1680, () => { setB0({cls:'good',txt:'Led OKR-driven roadmap → cut time-to-market 30%'}); anim(38,58,'#f0a832'); });
    s(2530, () => setB1(b=>({...b,cls:'bad'})));
    s(2910, () => { setB1({cls:'good',txt:'Drove 3-team alignment — zero escalations Q3'}); anim(58,72,'#8b82f0'); });
    s(3760, () => setB2(b=>({...b,cls:'bad'})));
    s(4140, () => { setB2({cls:'good',txt:'Delivered $2.4M feature on schedule, 12 stakeholders'}); anim(72,90,c); });
    s(4600, () => setTagVis(true));
    [4700,4810,4920,5030,5140,5250].forEach((ms,i)=>s(ms,()=>setKw(v=>{const n=[...v];n[i]=1;return n;})));
    return () => ids.forEach(clearTimeout);
  }, [active]);
  return (
    <JnyCard step="Step 01" title="Upload → ATS scan → 38 to 91 in 90s" statusCls="run" statusTxt="⚡ Scanning">
      <div style={{display:'flex',alignItems:'center',gap:9,background:'rgba(30,201,138,.03)',border:'1px solid rgba(30,201,138,.12)',borderRadius:7,padding:'7px 10px'}}>
        <span style={{fontSize:14}}>📄</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:'monospace',fontSize:8,color:'rgba(255,255,255,.3)',marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>resume_ivy_chen_seniorAI.pdf</div>
          <div style={{height:2,background:'rgba(255,255,255,.08)',borderRadius:2,overflow:'hidden'}}>
            <div style={{height:2,width:`${upW}%`,background:c,borderRadius:2,transition:'width .6s steps(14,end)'}}/>
          </div>
        </div>
        <div style={{fontSize:8,color:upDone?c:'rgba(255,255,255,.3)',fontFamily:'monospace',whiteSpace:'nowrap',transition:'color .3s'}}>{upDone?'✓ Memory seeded':'uploading…'}</div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <div>
          <div style={{fontSize:7,fontFamily:'monospace',color:'rgba(255,255,255,.25)',letterSpacing:1,textTransform:'uppercase',marginBottom:2}}>ATS Score</div>
          <div style={{display:'flex',alignItems:'baseline',gap:3}}>
            <span style={{fontFamily:'monospace',fontSize:24,fontWeight:700,color:scoreCol,lineHeight:1,transition:'color .4s'}}>{score}</span>
            <span style={{fontSize:9,color:'rgba(255,255,255,.25)',fontFamily:'monospace'}}>/100</span>
          </div>
        </div>
        <div style={{flex:1,padding:'0 6px'}}>
          <div style={{height:5,background:'rgba(255,255,255,.06)',borderRadius:3,overflow:'hidden'}}>
            <div style={{height:'100%',borderRadius:3,background:scoreCol,width:`${score}%`,transition:'width .7s cubic-bezier(.22,1,.36,1),background .5s'}}/>
          </div>
        </div>
        <div style={{fontSize:7.5,fontFamily:'monospace',padding:'1px 6px',borderRadius:10,background:'rgba(30,201,138,.1)',color:c,border:'1px solid rgba(30,201,138,.22)',opacity:tagVis?1:0,transition:'opacity .3s',whiteSpace:'nowrap'}}>+52 pts</div>
      </div>
      {[b0,b1,b2].map((b,i)=>(
        <div key={i} className={`jny-ats-bullet${b.cls?' '+b.cls:''}`}>{b.txt}</div>
      ))}
      <div style={{display:'flex',flexWrap:'wrap',gap:3,marginTop:2}}>
        {[{t:'Agile',k:'exist'},{t:'Roadmap',k:'exist'},{t:'OKR-driven',k:'new'},{t:'cross-functional',k:'new'},{t:'P&L ownership',k:'new'},{t:'stakeholder mgmt',k:'new'}].map((kv,i)=>(
          <span key={i} className={`jny-ats-kw ${kv.k}${kw[i]?' vis':''}`}>{kv.t}</span>
        ))}
      </div>
    </JnyCard>
  );
}

function S0Card2({ color: c, active }) {
  const [bars, setBars] = useState([0,0,0,0]);
  const [vals, setVals] = useState([false,false,false,false]);
  const [pills, setPills] = useState([0,0,0,0,0]);
  const bCols = [c,'#8b82f0','#f0a832','#8b82f0'];
  const bLabels = ['Keywords','Seniority','Impact','Format'];
  const bPcts = [94,88,91,88];
  useEffect(() => {
    if (!active) { setBars([0,0,0,0]); setVals([false,false,false,false]); setPills([0,0,0,0,0]); return; }
    const ids=[];
    const s=(ms,fn)=>ids.push(setTimeout(fn,ms));
    bPcts.forEach((t,i)=>{
      s(i*150,()=>setBars(b=>{const n=[...b];n[i]=t;return n;}));
      s(620+i*150,()=>setVals(v=>{const n=[...v];n[i]=true;return n;}));
    });
    [0,1,2,3,4].forEach(i=>s(900+i*130,()=>setPills(p=>{const n=[...p];n[i]=1;return n;})));
    return()=>ids.forEach(clearTimeout);
  }, [active]);
  return (
    <JnyCard step="Step 02" title="JD Match · 94% — gap analysis" statusCls="run" statusTxt="⚡ 94%">
      <div style={{fontFamily:'monospace',fontSize:7.5,color:'rgba(255,255,255,.3)',letterSpacing:1,textTransform:'uppercase',marginBottom:6}}>Senior AI Engineer · Vertex AI Labs</div>
      <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:7}}>
        {bLabels.map((l,i)=>(
          <div key={i} className="jny-mbar-row">
            <span className="jny-mbar-label">{l}</span>
            <div className="jny-mbar-track"><div className="jny-mbar-fill" style={{width:`${bars[i]}%`,background:bCols[i]}}/></div>
            <span className="jny-mbar-val" style={{color:bCols[i]}}>{vals[i]?bPcts[i]+'%':'—'}</span>
          </div>
        ))}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
        <span style={{fontSize:8,fontFamily:'monospace',color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:.5}}>Keyword gaps</span>
        <span style={{fontSize:8,fontFamily:'monospace',color:'rgba(255,255,255,.3)'}}>→ injected by AI</span>
      </div>
      <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
        {[{t:'✗ "LLM fine-tuning"',k:'gap'},{t:'✗ "MLOps pipeline"',k:'gap'},{t:'✓ AWS SageMaker',k:'match'},{t:'✓ Python / PyTorch',k:'match'},{t:'✓ cross-functional',k:'match'}].map((p,i)=>(
          <span key={i} className={`jny-kpill ${p.k}${pills[i]?' vis':''}`}>{p.t}</span>
        ))}
      </div>
    </JnyCard>
  );
}

function S0Card3({ color: c, active }) {
  const [text, setText] = useState('');
  const [pills, setPills] = useState([0,0,0,0]);
  const ivRef = useRef(null);
  const full = "Dear Vertex AI Labs — I'm applying for the Senior AI Engineer role. Having built LLM pipelines delivering 40% inference cost reduction and led MLOps rollouts across 3 markets, I align closely with your requirements. My NUS background and AWS credentials are verified on my CareerAiHub profile.";
  useEffect(() => {
    clearInterval(ivRef.current);
    if (!active) { setText(''); setPills([0,0,0,0]); return; }
    let i=0;
    ivRef.current=setInterval(()=>{
      if(i<=full.length){ setText(full.slice(0,i)); i++; }
      else { clearInterval(ivRef.current); [0,1,2,3].forEach(j=>setTimeout(()=>setPills(p=>{const n=[...p];n[j]=1;return n;}),j*150)); }
    },18);
    return()=>clearInterval(ivRef.current);
  }, [active]);
  return (
    <JnyCard step="Step 03" title="AI cover letter · memory-personalised" statusCls="done" statusTxt="✓ Ready">
      <div style={{fontFamily:'monospace',fontSize:7.5,color:'rgba(255,255,255,.3)',letterSpacing:1,textTransform:'uppercase',marginBottom:6}}>Auto-seeded from resume + JD match</div>
      <div style={{fontSize:9.5,lineHeight:1.68,color:'rgba(255,255,255,.5)',fontStyle:'italic',minHeight:80,flex:1}}>{text}</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:4}}>
        {['Role-matched','Memory-seeded','PDF ready','30 seconds'].map((t,i)=>(
          <span key={i} className={`jny-kpill match${pills[i]?' vis':''}`}>{t}</span>
        ))}
      </div>
    </JnyCard>
  );
}

// Stage 1: Get Ready (purple)
function S1Card1({ color: c, active }) {
  const [vals, setVals] = useState([0,0,0,0]);
  const [bars, setBars] = useState([0,0,0,0]);
  const [aiVis, setAiVis] = useState(false);
  const [aiText, setAiText] = useState('');
  const ivRef = useRef(null);
  const sc = [38,44,72,84];
  const cols = ['#ef4444',c,'#8b82f0','#1ec98a'];
  const aiMsg = 'Biggest gap: concrete examples 38/100. Plan targets this first. Once you clear 70 we move to STAR. Interview-ready in 9 days.';
  const dimNames=['Concrete examples','STAR structure','Clarity & delivery','Role knowledge'];
  useEffect(() => {
    clearInterval(ivRef.current);
    if (!active) { setVals([0,0,0,0]); setBars([0,0,0,0]); setAiVis(false); setAiText(''); return; }
    const ids=[];
    const s=(ms,fn)=>ids.push(setTimeout(fn,ms));
    sc.forEach((t,i)=>{
      s(i*220,()=>{
        setBars(b=>{const n=[...b];n[i]=t;return n;});
        let cur=0; const iv=setInterval(()=>{cur=Math.min(cur+1,t);setVals(v=>{const n=[...v];n[i]=cur;return n;});if(cur>=t)clearInterval(iv);},16);ids.push(iv);
      });
    });
    s(1200,()=>setAiVis(true));
    s(1300,()=>{ let j=0; ivRef.current=setInterval(()=>{if(j<=aiMsg.length){setAiText(aiMsg.slice(0,j));j++;}else clearInterval(ivRef.current);},14); });
    return()=>ids.forEach(clearTimeout);
  }, [active]);
  return (
    <JnyCard step="Step 01" title="Personalised readiness plan" statusCls="done" statusTxt="✓ Plan ready">
      <div style={{fontFamily:'monospace',fontSize:7.5,color:'rgba(255,255,255,.3)',letterSpacing:1,textTransform:'uppercase',marginBottom:7}}>Your scores — built from last 2 sessions</div>
      <div className="jny-dim-grid">
        {[0,1,2,3].map(i=>(
          <div key={i} className="jny-dim-cell">
            <div className="jny-dim-val" style={{color:cols[i]}}>{vals[i]}</div>
            <div className="jny-dim-name">{dimNames[i]}</div>
            <div className="jny-dim-bar"><div className="jny-dim-bfill" style={{width:`${bars[i]}%`,background:cols[i]}}/></div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:7,alignItems:'flex-start',background:'rgba(139,130,240,.07)',border:'1px solid rgba(139,130,240,.18)',borderRadius:7,padding:'7px 9px',opacity:aiVis?1:0,transition:'opacity .5s'}}>
        <div style={{width:18,height:18,borderRadius:4,background:c,display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,fontWeight:700,color:'#000',flexShrink:0}}>AI</div>
        <div style={{fontSize:9,color:'rgba(255,255,255,.55)',lineHeight:1.6}}>{aiText}</div>
      </div>
    </JnyCard>
  );
}

function S1Card2({ color: c, active }) {
  const [q, setQ] = useState('');
  const [scores, setScores] = useState([0,0,0,0]);
  const [fb, setFb] = useState('');
  const [fbVis, setFbVis] = useState(false);
  const qIvRef = useRef(null);
  const fbIvRef = useRef(null);
  const qTxt = 'Tell me about a time you delivered an AI feature under tight constraints. What was the outcome?';
  const fbTxt = 'AI feedback: Strong role fit. Missing concrete outcome number — add the % improvement or $ impact.';
  const sCols=['#ef4444','#f0a832',c,'#1ec98a'];
  const sLabels=['Examples','STAR','Clarity','Role fit'];
  const sVals=[62,55,78,80];
  useEffect(() => {
    clearInterval(qIvRef.current); clearInterval(fbIvRef.current);
    if (!active) { setQ(''); setScores([0,0,0,0]); setFb(''); setFbVis(false); return; }
    const ids=[];
    const s=(ms,fn)=>ids.push(setTimeout(fn,ms));
    let i=0; qIvRef.current=setInterval(()=>{if(i<=qTxt.length){setQ(qTxt.slice(0,i));i++;}else clearInterval(qIvRef.current);},16);
    s(1700,()=>{ sVals.forEach((t,idx)=>{ s(idx*180,()=>{ let cur=0; const iv=setInterval(()=>{cur=Math.min(cur+1,t);setScores(v=>{const n=[...v];n[idx]=cur;return n;});if(cur>=t)clearInterval(iv);},16); ids.push(iv); }); }); });
    s(2600,()=>setFbVis(true));
    s(2700,()=>{ let j=0; fbIvRef.current=setInterval(()=>{if(j<=fbTxt.length){setFb(fbTxt.slice(0,j));j++;}else clearInterval(fbIvRef.current);},14); });
    return()=>ids.forEach(clearTimeout);
  }, [active]);
  return (
    <JnyCard step="Step 02" title="HM Simulator — mock interview" statusCls="live" statusTxt="● Live">
      <div style={{fontFamily:'monospace',fontSize:7.5,color:'rgba(255,255,255,.3)',letterSpacing:1,textTransform:'uppercase',marginBottom:6}}>AI Hiring Manager · Senior AI Engineer</div>
      <div style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:7,padding:'8px 10px',fontSize:9.5,color:'rgba(255,255,255,.6)',lineHeight:1.6,marginBottom:6,minHeight:38}}>{q}</div>
      <div style={{display:'flex',gap:5,marginBottom:7}}>
        {[0,1,2,3].map(i=>(
          <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:6,padding:'6px 4px'}}>
            <div style={{fontFamily:'monospace',fontSize:15,fontWeight:700,color:sCols[i],lineHeight:1}}>{scores[i]||'–'}</div>
            <div style={{fontSize:7.5,color:'rgba(255,255,255,.3)'}}>{sLabels[i]}</div>
          </div>
        ))}
      </div>
      <div style={{fontSize:8.5,color:'rgba(255,255,255,.4)',lineHeight:1.55,fontStyle:'italic',minHeight:22,opacity:fbVis?1:0,transition:'opacity .4s'}}>{fb}</div>
    </JnyCard>
  );
}

function S1Card3({ color: c, active }) {
  const [vis, setVis] = useState([0,0,0]);
  const stories=[
    {t:'LLM rollout · cut latency 40%',a:'RESULT ✓',ac:'#1ec98a'},
    {t:'Cross-team alignment · zero escalations',a:'IMPACT ✓',ac:c},
    {t:'$2.4M feature delivery — on schedule',a:'QUANTIFIED ✓',ac:'#f0a832'},
  ];
  useEffect(() => {
    if (!active) { setVis([0,0,0]); return; }
    const ids=[0,1,2].map(i=>setTimeout(()=>setVis(v=>{const n=[...v];n[i]=1;return n;}),300+i*380));
    return()=>ids.forEach(clearTimeout);
  }, [active]);
  return (
    <JnyCard step="Step 03" title="STAR builder — story bank" statusCls="done" statusTxt="✓ 3 stories">
      <div style={{fontFamily:'monospace',fontSize:7.5,color:'rgba(255,255,255,.3)',letterSpacing:1,textTransform:'uppercase',marginBottom:6}}>Story bank · grows with every session</div>
      <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:7}}>
        {stories.map((st,i)=>(
          <div key={i} className={`jny-story${vis[i]?' vis':''}`}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:2}}>
              <span style={{fontSize:9.5,fontWeight:600,color:'rgba(255,255,255,.8)'}}>{st.t}</span>
              <span style={{fontFamily:'monospace',fontSize:7.5,color:st.ac,background:st.ac+'18',padding:'1px 6px',borderRadius:10}}>{st.a}</span>
            </div>
            <div style={{fontSize:8.5,color:'rgba(255,255,255,.3)'}}>Situation · Task · Action · Result — AI-structured</div>
          </div>
        ))}
      </div>
      <div style={{fontSize:8.5,color:'rgba(255,255,255,.3)'}}><span style={{fontFamily:'monospace',fontSize:9,color:c,fontWeight:700}}>3</span> stories ready · reused in every interview question</div>
    </JnyCard>
  );
}

function S1Card4({ color: c, active }) {
  const [bars, setBars] = useState([0,0,0,0]);
  const [valVis, setValVis] = useState([0,0,0,0]);
  const [anchorVis, setAnchorVis] = useState(false);
  const pcts=[40,55,72,100];
  const bCols=['rgba(139,130,240,.5)','rgba(139,130,240,.65)','rgba(232,92,128,.55)',c];
  const labels=['P25','Median','P75','Top 10%'];
  const vals=['SGD 9k','SGD 12k','SGD 16k','SGD 22k'];
  const vCols=['rgba(255,255,255,.3)','rgba(255,255,255,.5)','#e85c80',c];
  useEffect(() => {
    if (!active) { setBars([0,0,0,0]); setValVis([0,0,0,0]); setAnchorVis(false); return; }
    const ids=[];
    const s=(ms,fn)=>ids.push(setTimeout(fn,ms));
    pcts.forEach((p,i)=>{ s(i*180,()=>setBars(b=>{const n=[...b];n[i]=p;return n;})); s(600+i*180,()=>setValVis(v=>{const n=[...v];n[i]=1;return n;})); });
    s(1500,()=>setAnchorVis(true));
    return()=>ids.forEach(clearTimeout);
  }, [active]);
  return (
    <JnyCard step="Step 04" title="Salary coach — SGD market benchmarks" statusCls="done" statusTxt="✓ Benchmarked">
      <div style={{fontFamily:'monospace',fontSize:7.5,color:'rgba(255,255,255,.3)',letterSpacing:1,textTransform:'uppercase',marginBottom:6}}>Market Intel · Senior AI Engineer · Singapore</div>
      <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:8}}>
        {labels.map((l,i)=>(
          <div key={i} className="jny-mbar-row">
            <span className="jny-mbar-label" style={{width:42,fontSize:8}}>{l}</span>
            <div className="jny-mbar-track"><div className="jny-mbar-fill smooth" style={{width:`${bars[i]}%`,background:bCols[i]}}/></div>
            <span className="jny-mbar-val" style={{color:vCols[i],width:42,opacity:valVis[i]?1:0}}>{vals[i]}</span>
          </div>
        ))}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(240,168,50,.07)',border:'1px solid rgba(240,168,50,.22)',borderRadius:7,padding:'7px 10px',opacity:anchorVis?1:0,transition:'opacity .5s'}}>
        <div>
          <div style={{fontSize:7.5,fontFamily:'monospace',color:c,textTransform:'uppercase',letterSpacing:.5,marginBottom:2}}>AI anchor — P75 strategy</div>
          <div style={{fontSize:10,color:'rgba(255,255,255,.55)'}}>Open at <strong style={{color:'rgba(255,255,255,.9)'}}>SGD 16k</strong> · accept <strong style={{color:'#1ec98a'}}>≥ 14k</strong></div>
        </div>
        <div style={{fontFamily:'monospace',fontSize:13,fontWeight:700,color:c}}>+33%</div>
      </div>
    </JnyCard>
  );
}

// Stage 2: Get the Offer (gold)
function S2Card1({ color: c, active }) {
  const [bars, setBars] = useState([0,0,0,0]);
  const [offerVis, setOfferVis] = useState(false);
  const [ancNum, setAncNum] = useState(0);
  const pcts=[40,55,72,100];
  const bCols=['rgba(99,102,241,.5)','rgba(139,130,240,.6)','rgba(232,92,128,.55)',c];
  const labels=['P25','Median','P75','Top 10%'];
  useEffect(() => {
    if (!active) { setBars([0,0,0,0]); setOfferVis(false); setAncNum(0); return; }
    const ids=[];
    const s=(ms,fn)=>ids.push(setTimeout(fn,ms));
    pcts.forEach((p,i)=>s(i*160,()=>setBars(b=>{const n=[...b];n[i]=p;return n;})));
    s(800,()=>setOfferVis(true));
    s(900,()=>{ let cur=0; const iv=setInterval(()=>{ cur=Math.min(cur+200,14000); setAncNum(cur); if(cur>=14000)clearInterval(iv); },16); ids.push(iv); });
    return()=>ids.forEach(clearTimeout);
  }, [active]);
  return (
    <JnyCard step="Step 01" title="Offer received · market benchmark" statusCls="run" statusTxt="⚡ Analysing">
      <div style={{fontFamily:'monospace',fontSize:7.5,color:'rgba(255,255,255,.3)',letterSpacing:1,textTransform:'uppercase',marginBottom:7}}>Market Intel · Senior PM · Singapore</div>
      <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:8}}>
        {labels.map((l,i)=>(
          <div key={i} className="jny-mbar-row">
            <span className="jny-mbar-label" style={{width:40,fontSize:8}}>{l}</span>
            <div className="jny-mbar-track"><div className="jny-mbar-fill smooth" style={{width:`${bars[i]}%`,background:bCols[i]}}/></div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,opacity:offerVis?1:0,transition:'opacity .5s'}}>
        <div style={{background:'rgba(239,68,68,.05)',border:'1px solid rgba(239,68,68,.18)',borderRadius:7,padding:'7px 9px'}}>
          <div style={{fontFamily:'monospace',fontSize:7,color:'rgba(239,68,68,.65)',textTransform:'uppercase',letterSpacing:.5,marginBottom:3}}>Their offer</div>
          <div style={{fontSize:16,fontWeight:700,color:'#ef4444',fontFamily:'monospace'}}>$10,500</div>
          <div style={{fontSize:8,color:'rgba(239,68,68,.45)'}}>P28 · below market</div>
        </div>
        <div style={{background:'rgba(240,168,50,.07)',border:'1px solid rgba(240,168,50,.25)',borderRadius:7,padding:'7px 9px'}}>
          <div style={{fontFamily:'monospace',fontSize:7,color:c,textTransform:'uppercase',letterSpacing:.5,marginBottom:3}}>AI anchor</div>
          <div style={{fontSize:16,fontWeight:700,color:c,fontFamily:'monospace'}}>${ancNum.toLocaleString()}</div>
          <div style={{fontSize:8,color:'rgba(240,168,50,.5)'}}>P75 · AI-set</div>
        </div>
      </div>
    </JnyCard>
  );
}

function S2Card2({ color: c, active }) {
  const [steps, setSteps] = useState(['','','','']);
  const stepsData=[
    {t:'Express gratitude, signal confidence',s:'"I\'m excited — let me share where I\'d need to land."'},
    {t:'Anchor at P75 with market data',s:'"Based on SG market data, my range is SGD 14–16k."'},
    {t:'Stay silent for 6 seconds',s:'Silence after anchoring wins more than any word.'},
    {t:'Close with a bridge',s:'"I can start immediately if we\'re aligned on that."'},
  ];
  useEffect(() => {
    if (!active) { setSteps(['','','','']); return; }
    const ids=[];
    const s=(ms,fn)=>ids.push(setTimeout(fn,ms));
    s(0,()=>setSteps(['act','','','']));
    s(1000,()=>setSteps(['done','act','','']));
    s(2000,()=>setSteps(['done','done','act','']));
    s(2900,()=>setSteps(['done','done','done','act']));
    s(3700,()=>setSteps(['done','done','done','done']));
    return()=>ids.forEach(clearTimeout);
  }, [active]);
  return (
    <JnyCard step="Step 02" title="4-step negotiation script" statusCls="run" statusTxt="⚡ Active">
      <div style={{fontFamily:'monospace',fontSize:7.5,color:'rgba(255,255,255,.3)',letterSpacing:1,textTransform:'uppercase',marginBottom:6}}>Word-for-word · ready to say or send</div>
      <div className="jny-neg-steps">
        {stepsData.map((st,i)=>(
          <div key={i} className={`jny-nstep${steps[i]?' '+steps[i]:''}`}>
            <div className="jny-nstep-num">{i+1}</div>
            <div>
              <div className="jny-nstep-text">{st.t}</div>
              <div className="jny-nstep-sub">{st.s}</div>
            </div>
          </div>
        ))}
      </div>
    </JnyCard>
  );
}

function S2Card3({ color: c, active }) {
  const [fade, setFade] = useState(false);
  const [label, setLabel] = useState('AI counter');
  const [uplift, setUplift] = useState(false);
  const [pills, setPills] = useState([0,0,0]);
  useEffect(() => {
    if (!active) { setFade(false); setLabel('AI counter'); setUplift(false); setPills([0,0,0]); return; }
    const ids=[];
    const s=(ms,fn)=>ids.push(setTimeout(fn,ms));
    s(900,()=>setFade(true));
    s(1250,()=>setLabel('✓ Accepted'));
    s(1630,()=>setUplift(true));
    [2230,2380,2530].forEach((ms,i)=>s(ms,()=>setPills(p=>{const n=[...p];n[i]=1;return n;})));
    return()=>ids.forEach(clearTimeout);
  }, [active]);
  return (
    <JnyCard step="Step 03" title="Deal closed · +SGD 3,500/mo" statusCls="done" statusTxt="✓ +33% uplift">
      <div className="jny-offer-compare">
        <div className={`jny-ob jny-ob-their${fade?' fade':''}`}>
          <div className="jny-ob-label" style={{color:'rgba(239,68,68,.65)'}}>Their offer</div>
          <div className="jny-ob-amount" style={{color:'#ef4444'}}>$10,500</div>
          <div className="jny-ob-sub" style={{color:'rgba(239,68,68,.45)'}}>P28 · below market</div>
        </div>
        <div className="jny-ob jny-ob-ours">
          <div className="jny-ob-label" style={{color:c}}>{label}</div>
          <div className="jny-ob-amount" style={{color:c}}>$14,000</div>
          <div className="jny-ob-sub" style={{color:'rgba(240,168,50,.5)'}}>P75 strategy</div>
        </div>
      </div>
      <div className={`jny-uplift-banner${uplift?' vis':''}`}>
        <span style={{fontSize:10.5,fontWeight:600,color:'#1ec98a'}}>✓ Deal closed · offer accepted</span>
        <span style={{fontFamily:'monospace',fontSize:10.5,color:'#1ec98a',fontWeight:700}}>+SGD 3,500/mo</span>
      </div>
      <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:7}}>
        {['Salary Coach','Market Intel','Negotiation Script'].map((t,i)=>(
          <span key={i} className={`jny-kpill match${pills[i]?' vis':''}`}>{t}</span>
        ))}
      </div>
    </JnyCard>
  );
}

// Stage 3: Get Found (pink)
function S3Card1({ color: c, active }) {
  const [chks, setChks] = useState([0,0,0,0]);
  const [bdgs, setBdgs] = useState([0,0,0,0]);
  const [cosVis, setCosVis] = useState(false);
  const [cosVal, setCosVal] = useState(0);
  const creds=['Singpass ID · Ivy Chen','NUS CS · OpenCerts','AWS Solutions Architect · Credly','7 yr AI Engineering · verified'];
  useEffect(() => {
    if (!active) { setChks([0,0,0,0]); setBdgs([0,0,0,0]); setCosVis(false); setCosVal(0); return; }
    const ids=[];
    const s=(ms,fn)=>ids.push(setTimeout(fn,ms));
    [0,1,2,3].forEach(i=>{ s(460+i*460,()=>{ setChks(v=>{const n=[...v];n[i]=1;return n;}); s(150,()=>setBdgs(v=>{const n=[...v];n[i]=1;return n;})); }); });
    s(2200,()=>{ setCosVis(true); let n=0; const iv=setInterval(()=>{n=Math.min(n+2,88);setCosVal(n);if(n>=88)clearInterval(iv);},28); ids.push(iv); });
    return()=>ids.forEach(clearTimeout);
  }, [active]);
  return (
    <JnyCard step="Step 01" title="Credential verify · blockchain-backed" statusCls="done" statusTxt="✓ All verified">
      <div style={{fontFamily:'monospace',fontSize:7.5,color:'rgba(255,255,255,.3)',letterSpacing:1,textTransform:'uppercase',marginBottom:7}}>Singpass · OpenCerts · Credly · Work history</div>
      <div className="jny-cred-list" style={{marginBottom:7}}>
        {creds.map((cr,i)=>(
          <div key={i} className="jny-cred-row">
            <div className={`jny-cred-chk${chks[i]?' ver':''}`}>{chks[i]?'✓':''}</div>
            <span className="jny-cred-name">{cr}</span>
            <span className={`jny-cred-badge${bdgs[i]?' vis':''}`}>✓ Blockchain</span>
          </div>
        ))}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(232,92,128,.06)',border:'1px solid rgba(232,92,128,.18)',borderRadius:7,padding:'7px 10px',opacity:cosVis?1:0,transition:'opacity .5s'}}>
        <span style={{fontSize:9,color:'rgba(255,255,255,.5)'}}>Career OS Score</span>
        <span style={{fontFamily:'monospace',fontSize:16,fontWeight:700,color:c}}>{cosVal} / 100</span>
        <span style={{fontSize:8,padding:'2px 7px',background:'rgba(232,92,128,.09)',color:c,border:'1px solid rgba(232,92,128,.22)',borderRadius:20,fontFamily:'monospace'}}>Top 8%</span>
      </div>
    </JnyCard>
  );
}

function S3Card2({ color: c, active }) {
  const [scanTxt, setScanTxt] = useState('Scanning 0…');
  const [scanDone, setScanDone] = useState(false);
  const [ringPct, setRingPct] = useState(0);
  const [confVis, setConfVis] = useState(false);
  const [fBars, setFBars] = useState([0,0,0,0]);
  const [creds, setCreds] = useState([0,0,0,0]);
  const funnels=[{l:'Total pool',v:'2,714',bg:'#3d3875'},{l:'Skills match',v:'142',bg:'#5a54a8'},{l:'Verified creds',v:'31',bg:'#7F77DD'},{l:'95%+ match',v:'1',bg:c}];
  useEffect(() => {
    if (!active) { setScanTxt('Scanning 0…'); setScanDone(false); setRingPct(0); setConfVis(false); setFBars([0,0,0,0]); setCreds([0,0,0,0]); return; }
    const ids=[];
    let cn=0; const civ=setInterval(()=>{ cn=Math.min(cn+68,2714); setScanTxt('Scanning '+cn.toLocaleString()+'…'); if(cn>=2714){clearInterval(civ);setScanTxt('2,714 scanned ✓');setScanDone(true);} },40); ids.push(civ);
    let sc=0; const siv=setInterval(()=>{ sc=Math.min(sc+1.3,95); setRingPct(Math.round(sc)); if(sc>=95){clearInterval(siv);setConfVis(true);} },20); ids.push(siv);
    [100,50,20,5].forEach((tgt,i)=>ids.push(setTimeout(()=>setFBars(b=>{const n=[...b];n[i]=tgt;return n;}),i*280)));
    [0,1,2,3].forEach(i=>ids.push(setTimeout(()=>setCreds(v=>{const n=[...v];n[i]=1;return n;}),1200+i*200)));
    return()=>ids.forEach(clearTimeout);
  }, [active]);
  const deg=Math.round(ringPct/100*360);
  return (
    <JnyCard step="Step 02" title="TrustMatch engine · 2,714 scanned" statusCls="run" statusTxt="● Scanning">
      <div className="jny-mp-dark">
        <div className="jny-mp-hrow">
          <span className="jny-mp-badge">AI Match Engine</span>
          <span className={`jny-mp-scan${scanDone?' done':''}`}>{scanTxt}</span>
        </div>
        <div className="jny-mp-mrow">
          <div>
            <div className="jny-sring" style={{background:`conic-gradient(${c} 0deg,${c} ${deg}deg,rgba(26,21,48,.9) ${deg}deg)`}}>
              <div className="jny-sring-inner">
                <div className="jny-sring-num">{ringPct}%</div>
                <div className="jny-sring-lbl">MATCH</div>
              </div>
            </div>
            <div className={`jny-mp-confirm${confVis?' vis':''}`} style={{color:c}}>✓ 95% MATCH</div>
          </div>
          <div className="jny-funnels">
            {funnels.map((f,i)=>(
              <div key={i} className="jny-fn-row">
                <span className="jny-fn-lbl">{f.l}</span>
                <div className="jny-fn-track"><div className="jny-fn-fill" style={{width:`${fBars[i]}%`,background:f.bg}}/></div>
                <span className="jny-fn-val" style={{color:i===3?c:undefined}}>{f.v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="jny-mp-creds">
          {['Singpass','NUS CS','AWS SAA','7yr AI'].map((cr,i)=>(
            <span key={i} className={`jny-mp-cred${creds[i]?' vis':''}`}><span style={{color:'#7F77DD'}}>✓</span> {cr}</span>
          ))}
        </div>
      </div>
    </JnyCard>
  );
}

function S3Card3({ color: c, active }) {
  const [msg, setMsg] = useState('');
  const [timerW, setTimerW] = useState(100);
  const [secs, setSecs] = useState(240);
  const msgIvRef = useRef(null);
  const timerIvRef = useRef(null);
  const fullMsg='Hi Ivy — I can see your ✓NUS · ✓AWS · ✓Singpass credentials and your 95% match score. Impressive AI engineering background. Are you open to a 20-min call this Friday?';
  useEffect(() => {
    clearInterval(msgIvRef.current); clearInterval(timerIvRef.current);
    if (!active) { setMsg(''); setTimerW(100); setSecs(240); return; }
    let i=0;
    msgIvRef.current=setInterval(()=>{
      if(i<=fullMsg.length){ setMsg(fullMsg.slice(0,i)); i++; }
      else {
        clearInterval(msgIvRef.current);
        timerIvRef.current=setInterval(()=>{
          setSecs(s=>{ const ns=Math.max(0,s-4); if(ns<=0)clearInterval(timerIvRef.current); return ns; });
          setTimerW(w=>Math.max(0,w-4/240*100));
        },65);
      }
    },19);
    return()=>{ clearInterval(msgIvRef.current); clearInterval(timerIvRef.current); };
  }, [active]);
  const m=Math.floor(secs/60), s2=secs%60;
  return (
    <JnyCard step="Step 03" title="TrustChat recruiter ping · 3:42" statusCls="live" statusTxt="● Live">
      <div style={{background:'rgba(232,92,128,.06)',border:'1px solid rgba(232,92,128,.2)',borderRadius:9,padding:'10px 12px'}}>
        <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:6}}>
          <div style={{width:22,height:22,borderRadius:'50%',background:'rgba(232,92,128,.15)',border:'1px solid rgba(232,92,128,.28)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,flexShrink:0}}>👤</div>
          <div>
            <div style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,.85)'}}>Sarah L. · Head of Talent · Vertex AI Labs</div>
            <div style={{fontSize:9,color:'rgba(255,255,255,.3)'}}>Senior AI Engineer · 95% match</div>
          </div>
        </div>
        <div style={{fontSize:10,lineHeight:1.58,color:'rgba(255,255,255,.6)',marginBottom:6,minHeight:48}}>{msg}</div>
        <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:6}}>
          {['✓ NUS CS','✓ AWS SAA','✓ Singpass'].map(t=>(
            <span key={t} style={{fontSize:8,padding:'1px 6px',borderRadius:10,background:'rgba(30,201,138,.08)',color:'#1ec98a',border:'1px solid rgba(30,201,138,.18)',fontFamily:'monospace'}}>{t}</span>
          ))}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:5,fontFamily:'monospace',fontSize:8.5,color:c}}>
          <span>Response window</span>
          <div className="jny-rtbar"><div style={{height:'100%',borderRadius:2,background:c,width:`${timerW}%`,transition:'width 4s linear'}}/></div>
          <span>{m}:{s2<10?'0':''}{s2}</span>
        </div>
      </div>
    </JnyCard>
  );
}

function S3Card4({ color: c, active }) {
  const [tscore, setTscore] = useState(0);
  const [rows, setRows] = useState([0,0,0]);
  const [badges, setBadges] = useState([0,0,0,0]);
  const matches=[{co:'Vertex AI Labs',pct:'95%',col:'#1ec98a'},{co:'Grab',pct:'88%',col:c},{co:'Sea Group',pct:'81%',col:'#e85c80'}];
  const bdgTxt=['🔐 Identity & credentials blockchain-verified','🎯 95% match · TrustChat opened in 3:42','📅 Intro call scheduled — Friday 10am','🧠 AI memory profile active · all 4 stages'];
  useEffect(() => {
    if (!active) { setTscore(0); setRows([0,0,0]); setBadges([0,0,0,0]); return; }
    const ids=[];
    let n=0; const iv=setInterval(()=>{n=Math.min(n+2,88);setTscore(n);if(n>=88)clearInterval(iv);},22); ids.push(iv);
    [400,700,1000].forEach((ms,i)=>ids.push(setTimeout(()=>setRows(v=>{const nv=[...v];nv[i]=1;return nv;}),ms)));
    [0,1,2,3].forEach(i=>ids.push(setTimeout(()=>setBadges(v=>{const nv=[...v];nv[i]=1;return nv;}),1400+i*280)));
    return()=>ids.forEach(clearTimeout);
  }, [active]);
  return (
    <JnyCard step="Step 04" title="TrustMatch profile · Trust Score 88" statusCls="done" statusTxt="✓ Top 8%">
      <div style={{fontFamily:'monospace',fontSize:7.5,color:'rgba(255,255,255,.3)',letterSpacing:1,textTransform:'uppercase',marginBottom:6}}>Candidate view · Ivy Chen</div>
      <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:8}}>
        <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(232,92,128,.15)',border:'2px solid rgba(232,92,128,.35)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'rgba(255,255,255,.8)',flexShrink:0}}>IC</div>
        <div style={{flex:1}}>
          <div style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,.85)'}}>Ivy Chen · Senior AI Engineer</div>
          <div style={{fontSize:8.5,color:'rgba(255,255,255,.3)'}}>Trust Score <span style={{fontFamily:'monospace',fontWeight:700,color:c}}>{tscore}</span>/100 · <span style={{color:'#1ec98a'}}>Top 8%</span></div>
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:7}}>
        {matches.map((m,i)=>(
          <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 9px',borderRadius:6,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)',opacity:rows[i]?1:0,transform:rows[i]?'none':'translateX(6px)',transition:'opacity .4s,transform .4s'}}>
            <span style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,.8)'}}>{m.co}</span>
            <span style={{fontFamily:'monospace',fontSize:12,fontWeight:700,color:m.col}}>{m.pct}</span>
          </div>
        ))}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:3}}>
        {bdgTxt.map((t,i)=>(
          <div key={i} className={`jny-tbadge${badges[i]?' vis':''}`}>{t}<span style={{marginLeft:'auto',color:'#1ec98a',fontSize:9.5}}>✓</span></div>
        ))}
      </div>
    </JnyCard>
  );
}

function mkStage0Cards(color) {
  return [
    { Component: S0Card1, props: { color } },
    { Component: S0Card2, props: { color } },
    { Component: S0Card3, props: { color } },
  ];
}

function mkStage1Cards(color) {
  return [
    { Component: S1Card1, props: { color } },
    { Component: S1Card2, props: { color } },
    { Component: S1Card3, props: { color } },
    { Component: S1Card4, props: { color } },
  ];
}

function mkStage2Cards(color) {
  return [
    { Component: S2Card1, props: { color } },
    { Component: S2Card2, props: { color } },
    { Component: S2Card3, props: { color } },
  ];
}

function mkStage3Cards(color) {
  return [
    { Component: S3Card1, props: { color } },
    { Component: S3Card2, props: { color } },
    { Component: S3Card3, props: { color } },
    { Component: S3Card4, props: { color } },
  ];
}


function JourneyDeck({ cards, color }) {
  const [current, setCurrent] = useState(0);
  const [fanned, setFanned] = useState(false);
  const [hintVis, setHintVis] = useState(false);
  const wrapRef = useRef(null);
  const timerRef = useRef(null);
  const N = cards.length;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      timerRef.current = setInterval(() => setCurrent(c => (c + 1) % N), 3800);
      setTimeout(() => setHintVis(true), 2200);
      obs.disconnect();
    }, { threshold: 0.25 });
    obs.observe(el);
    return () => { obs.disconnect(); clearInterval(timerRef.current); };
  }, [N]);

  const goTo = (idx) => {
    setCurrent(idx);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % N), 3800);
  };

  return (
    <div className="jny-deck-wrap" ref={wrapRef}>
      <div className="jny-steps">
        {cards.map((_, i) => {
          const isDone = i < current, isAct = i === current;
          return (
            <button key={i}
              className={`jny-step${isAct ? ' active' : isDone ? ' done' : ''}`}
              style={{ '--sc': color }}
              onClick={() => { setFanned(false); goTo(i); }}>
              {String(i + 1).padStart(2, '0')}
            </button>
          );
        })}
      </div>
      <div
        className={`jny-deck-stack${fanned ? ' fanned' : ''}`}
        onMouseEnter={() => setFanned(true)}
        onMouseLeave={() => setFanned(false)}>
        {cards.map((cardDef, i) => {
          const slot = (i - current + N) % N;
          const posProps = fanned ? { 'data-fan': slot } : { 'data-pos': slot };
          const { Component, props } = cardDef;
          return (
            <div key={i} className="jny-dcard" {...posProps}
              style={{ borderColor: slot === 0 ? color + '55' : undefined }}
              onClick={() => {
                if (!fanned) setFanned(true);
                else if (slot !== 0) { setFanned(false); goTo(i); }
                else setFanned(false);
              }}>
              <Component {...props} active={slot === 0} />
            </div>
          );
        })}
      </div>
      <div className={`jny-deck-hint${hintVis ? ' vis' : ''}`}>hover to explore · click to select</div>
    </div>
  );
}


function TrustChatSection({ onJoin }) {
  return (
    <section style={{ padding: '72px 24px 80px', background: 'var(--lp-bg)' }}>
      <style>{`
        @keyframes tsmPulse { 0%,100%{opacity:1} 50%{opacity:.35} }
      `}</style>

      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div className="ey">Trust Chat</div>
        <h2 className="sh" style={{ textAlign: 'center', maxWidth: 'none', margin: '0 0 10px' }}>Built for candidates and recruiters<br />
          <span style={{ background: 'var(--lp-grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            to connect through verified trust.
          </span>
        </h2>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, overflow: 'hidden' }}>

        {/* 3-panel demo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 1fr', padding: '28px 28px 24px' }}>

          {/* Left: Your profile — Ben Tan candidate card */}
          <div style={{ paddingRight: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>
              Your profile
            </div>
            <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '14px 14px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #7F77DD, #D4537E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>BT</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--lp-text)' }}>Ben Tan <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#00e5a0', boxShadow: '0 0 4px rgba(0,229,160,.5)', marginLeft: 4, verticalAlign: 'middle' }} /></div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>ML Research Scientist · 6 yrs · NTU MSc CS</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {['NTU OpenCerts ✓', 'TensorFlow cert ✓'].map(v => <span key={v} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(0,212,255,.07)', border: '1px solid rgba(0,212,255,.2)', color: 'var(--lp-teal)' }}>{v}</span>)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ position: 'relative', width: 54, height: 54 }}>
                    <svg width="54" height="54" viewBox="0 0 54 54" style={{ position: 'absolute', inset: 0 }}>
                      <circle cx="27" cy="27" r="21" fill="none" stroke="rgba(0,212,255,.1)" strokeWidth="4"/>
                      <circle cx="27" cy="27" r="21" fill="none" stroke="#00D4FF" strokeWidth="4" strokeDasharray="131.9" strokeDashoffset="23.7" strokeLinecap="round" transform="rotate(-90 27 27)"/>
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--lp-teal)', lineHeight: 1 }}>82</span>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,.4)' }}>trust</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#00e5a0' }}>High trust</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 8, padding: '5px 8px', background: 'rgba(255,255,255,.03)', borderLeft: '2px solid rgba(255,255,255,.1)', borderRadius: '0 4px 4px 0' }}>
                "ML researcher focused on efficient inference. Published 2 papers at NeurIPS."
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 8 }}>
                {[['ATS', '84/100', 'var(--lp-teal)'], ['Interview', '79/100', '#7F77DD'], ['STAR', 'Good', '#00e5a0']].map(([l, v, c]) => (
                  <div key={l} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 6, padding: '5px', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>{l}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: c }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                {['TensorFlow', 'CUDA', 'Python', 'Research'].map((s, i) => (
                  <span key={s} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(255,255,255,.03)', border: `1px solid ${i < 3 ? 'rgba(0,212,255,.2)' : 'rgba(255,255,255,.08)'}`, color: i < 3 ? 'rgba(0,212,255,.75)' : 'rgba(255,255,255,.4)' }}>{s}</span>
                ))}
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 800, color: 'var(--lp-teal)' }}>91% match</div>
            </div>
          </div>

          {/* Center atom bridge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.2)' }}>←</span>
              <OrbitMark size={64} animated duration={6} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.2)' }}>→</span>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', textAlign: 'center', lineHeight: 1.55 }}>Verified trust<br/>matches the<br/>right opportunities</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[...Array(4)].map((_, i) => <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(0,212,255,.4)', animation: `tsmPulse 2s ${i * 0.4}s infinite` }} />)}
            </div>
          </div>

          {/* Right: Jobs matching your profile */}
          <div style={{ paddingLeft: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>
              Jobs matching your profile
            </div>
            {[
              { logo: 'VA', logoClr: 'rgba(139,124,246,.2)', logoBdr: 'rgba(139,124,246,.3)', logoTxt: '#a89bf8', co: 'Vertex AI Labs', tag: 'verified employer', role: 'Senior AI Engineer · SGD 12–16k', pct: '95%', tags: ['Remote-first','Visa sponsorship','Equity'], active: true },
              { logo: 'GR', logoClr: 'rgba(0,229,160,.1)', logoBdr: 'rgba(0,229,160,.2)', logoTxt: '#00e5a0', co: 'Grab', tag: 'verified employer', role: 'ML Research Scientist · SGD 14–18k', pct: '88%', tags: ['Hybrid','L7 senior track','Stock options'], active: false },
            ].map((job, i) => (
              <div key={i} style={{ background: job.active ? 'rgba(0,212,255,.04)' : 'rgba(255,255,255,.02)', border: `1px solid ${job.active ? 'rgba(0,212,255,.18)' : 'rgba(255,255,255,.06)'}`, borderRadius: 12, padding: '12px 14px', marginBottom: i === 0 ? 10 : 0 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: job.logoClr, border: `1px solid ${job.logoBdr}`, color: job.logoTxt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{job.logo}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--lp-text)' }}>{job.co} <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--lp-teal)', background: 'rgba(0,212,255,.1)', borderRadius: 10, padding: '1px 6px', border: '1px solid rgba(0,212,255,.2)' }}>{job.tag}</span></div>
                    <div style={{ fontSize: 11, color: 'var(--lp-text2)' }}>{job.role}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--lp-teal)', fontFamily: 'var(--lp-ffm)', flexShrink: 0 }}>{job.pct}<span style={{ fontSize: 9, fontWeight: 400, color: 'rgba(255,255,255,.35)' }}>fit</span></div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {job.tags.map(t => <span key={t} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', color: 'rgba(255,255,255,.5)' }}>{t}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}


function JourneyStage({ stage, cards, swapped, stageIdx, isLast }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); obs.disconnect(); }
    }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const copyPanel = (
    <div className="jny-tcard" style={{ borderColor: stage.color + '22' }}>
      <div className="jny-stage-badge" style={{ color: stage.color, background: stage.color + '12', border: `1px solid ${stage.color}30` }}>
        <span className="jny-badge-dot" style={{ background: stage.color }} />
        {stage.num} · {stage.label}
      </div>
      <h3 className="jny-copy-h3">{stage.problem}</h3>
      <p className="jny-pain" style={{ borderLeftColor: stage.color + '44' }}>{stage.pain}</p>
      <div className="jny-feats">
        {stage.bullets.map((b, j) => (
          <div key={j} className="jny-feat">
            <span className="jny-feat-ic" style={{ background: stage.color + '18', color: stage.color }}>✦</span>
            <span>
              {b.includes(' — ')
                ? <><strong style={{ color: 'var(--lp-text)', fontWeight: 700 }}>{b.split(' — ')[0]}</strong>{' — '}{b.split(' — ').slice(1).join(' — ')}</>
                : b}
            </span>
          </div>
        ))}
      </div>
      <div className="jny-outcome" style={{ background: stage.color + '15', color: stage.color, border: `1px solid ${stage.color}30` }}>
        {stage.outcome}
      </div>
    </div>
  );

  const deckPanel = (
    <div className="jny-deck-side">
      <JourneyDeck cards={cards} color={stage.color} />
    </div>
  );

  const nodeContent = (
    <div className="jny-tnode-col">
      <div className="jny-tnode" style={{ borderColor: stage.color + '66', color: stage.color, boxShadow: `0 0 18px ${stage.color}22` }}>
        {stageIdx + 1}
      </div>
      {!isLast && <div className="jny-tconnector" />}
    </div>
  );

  return (
    <div ref={ref} className={`jny-tstage${vis ? ' vis' : ''}`}>
      {swapped ? deckPanel : copyPanel}
      {nodeContent}
      {swapped ? copyPanel : deckPanel}
    </div>
  );
}

function JourneySection({ onJoin }) {
  const DECK_FACTORIES = [mkStage0Cards, mkStage1Cards, mkStage2Cards, mkStage3Cards];
  const containerRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height - vh * 0.5;
      const pct = Math.max(0, Math.min(100, (-rect.top + vh * 0.25) / total * 100));
      setProgress(pct);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section style={{ background: 'var(--lp-bg)', padding: '80px 0 40px' }}>
      <div style={{ textAlign: 'center', padding: '0 24px 56px', maxWidth: 680, margin: '0 auto' }}>
        <div className="ey">Your career journey</div>
        <h2 className="sh" style={{ fontFamily: 'var(--lp-ffm)', fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, letterSpacing: '-1px', lineHeight: 1.08, maxWidth: 'none', margin: '0 0 16px' }}>
          From invisible<br />to{' '}
          <em style={{ fontStyle: 'italic', background: 'var(--lp-grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>hired.</em>
        </h2>
        <p className="ss">One AI memory powers four stages. Every tool knows who you are.</p>
      </div>
      <div className="jny-timeline" ref={containerRef}>
        <div className="jny-spine" />
        <div className="jny-progress-spine" style={{ height: progress + '%' }} />
        {JOURNEY_STAGES.map((stage, i) => (
          <JourneyStage key={i} stage={stage} cards={DECK_FACTORIES[i](stage.color)} swapped={i % 2 === 1} stageIdx={i} isLast={i === JOURNEY_STAGES.length - 1} />
        ))}
      </div>
      <div style={{ textAlign: 'center', padding: '40px 24px 20px' }}>
        <button className="lp-btn-join" onClick={onJoin}>✦ Start free — no card →</button>
      </div>
    </section>
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
  const fnRef = useRef({});

  useEffect(() => {
    const cleanup = [];

    // Load Instrument Serif font
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&family=DM+Mono:wght@400;500&display=swap';
    document.head.appendChild(fontLink);
    document.documentElement.style.scrollBehavior = 'smooth';

    /* MOBILE NAV */
    fnRef.current.toggleMobileNav = function(){const h=document.getElementById('navHamburger'),m=document.getElementById('mobileNav');h.classList.toggle('open');m.classList.toggle('open');}
    fnRef.current.closeMobileNav = function(){document.getElementById('navHamburger').classList.remove('open');document.getElementById('mobileNav').classList.remove('open');}

    /* HERO CARD ANIMATION — ring → badges → match → TrustChat */
    ;(function(){
      function runHeroAnim(){
        const ringArc=document.getElementById('hcRingArc');
        const scoreNum=document.getElementById('hcScoreNum');
        const scoreLbl=document.getElementById('hcScoreLbl');
        const badge=document.getElementById('hcBadge');
        const bottom=document.getElementById('hcBottom');
        const matchNum=document.getElementById('hcMatchNum');
        const matchBar=document.getElementById('hcMatchBar');
        const trustChat=document.getElementById('hcTrustChat');
        const msgEl=document.getElementById('hcMsg');
        if(!ringArc)return;

        // t=0: badge label fades in
        if(badge){badge.style.opacity='1';badge.style.transform='translateY(0)';}

        // t=400: score ring animates (188.5 * (1-92/100) = 15.08)
        setTimeout(()=>{
          ringArc.style.strokeDashoffset='15.08';
          let n=0;
          const iv=setInterval(()=>{n=Math.min(n+2,92);if(scoreNum)scoreNum.textContent=n;if(n>=92){clearInterval(iv);if(scoreLbl)scoreLbl.textContent='Excellent';}},22);
        },400);

        // t=900–1450: 4 verification badges stagger in
        ['hcb0','hcb1','hcb2','hcb3'].forEach((id,i)=>{
          setTimeout(()=>{
            const el=document.getElementById(id);
            if(el){el.style.opacity='1';el.style.transform='translateY(0)';}
          },900+i*160);
        });
        // t=1560: verification sources strip fades in
        setTimeout(()=>{
          const strip=document.getElementById('hcb4');
          if(strip){strip.style.opacity='1';strip.style.transform='translateY(0)';}
        },1560);

        // t=1600: AI insight + match score slide up, bar animates
        setTimeout(()=>{
          if(bottom){bottom.style.opacity='1';bottom.style.transform='translateY(0)';}
          setTimeout(()=>{
            if(matchBar)matchBar.style.width='87%';
            let m=0;const mv=setInterval(()=>{m=Math.min(m+2,87);if(matchNum)matchNum.textContent=m+'%';if(m>=87)clearInterval(mv);},18);
          },200);
        },1600);

        // t=2600: TrustChat notification slides up with typewriter message
        setTimeout(()=>{
          if(trustChat){trustChat.style.opacity='1';trustChat.style.transform='translateY(0)';}
          if(msgEl){
            const msg='Hi Marcus — I can see your ✓NUS · ✓AWS · ✓Singpass credentials and your VCS 92/100. Are you open to a quick call this Friday?';
            let i=0;
            const tv=setInterval(()=>{
              if(i<msg.length){msgEl.textContent+=msg[i];i++;}else clearInterval(tv);
            },22);
          }
        },2600);
      }
      runHeroAnim();
  
    })();

    /* GA4 — consent-gated loader */
    function loadGA4(){const gid=import.meta.env.VITE_GA4_ID;if(!gid||document.getElementById('ga4-script'))return;const s=document.createElement('script');s.id='ga4-script';s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+gid;document.head.appendChild(s);window.dataLayer=window.dataLayer||[];function gtag(){window.dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config',gid);}

    /* COOKIE BANNER */
    ;(function(){
      function hasConsent(){try{return localStorage.getItem('cah_cookie_consent')||sessionStorage.getItem('cah_cookie_consent');}catch(e){return sessionStorage.getItem('cah_cookie_consent');}}
      function showBanner(){const b=document.getElementById('cookieBanner');if(b)b.style.transform='translateY(0)';}
      if(!hasConsent()){showBanner();}else{try{if((localStorage.getItem('cah_cookie_consent')||sessionStorage.getItem('cah_cookie_consent'))==='all')loadGA4();}catch(e){}}
    })();
    fnRef.current.hideCookieBanner = function(){const b=document.getElementById('cookieBanner');if(b)b.style.transform='translateY(100%)';}
    fnRef.current.acceptCookies = function(){try{localStorage.setItem('cah_cookie_consent','all');}catch(e){sessionStorage.setItem('cah_cookie_consent','all');}fnRef.current.hideCookieBanner();loadGA4();}
    fnRef.current.declineCookies = function(){try{localStorage.setItem('cah_cookie_consent','essential');}catch(e){sessionStorage.setItem('cah_cookie_consent','essential');}fnRef.current.hideCookieBanner();}
    fnRef.current.cookiePrefs = function(){try{localStorage.setItem('cah_cookie_consent','all');}catch(e){sessionStorage.setItem('cah_cookie_consent','all');}fnRef.current.hideCookieBanner();loadGA4();}


    const $=id=>document.getElementById(id);
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    function cu(el,target,dur,sfx=''){let cur=0,step=target/(dur/16);const iv=setInterval(()=>{cur=Math.min(cur+step,target);el.textContent=Math.round(cur)+sfx;if(cur>=target)clearInterval(iv);},16);}
    function typeIn(el,text,speed=22){return new Promise(res=>{let i=0;el.textContent='';const cur=document.createElement('span');cur.className='tcursor';cur.style.color='inherit';el.appendChild(cur);const iv=setInterval(()=>{if(i<text.length){el.insertBefore(document.createTextNode(text[i]),cur);i++;}else{clearInterval(iv);cur.remove();res();}},speed);});}

    /* ATS MODAL */
    fnRef.current.openATSDemo = function(){$('atsModalBg').classList.add('open');document.body.style.overflow='hidden';setTimeout(wRunScan,500);}
    fnRef.current.closeATSDemo = function(){$('atsModalBg').classList.remove('open');document.body.style.overflow='';}
    var mb=$('atsModalBg');if(mb){mb.addEventListener('click',function(e){if(e.target===mb)fnRef.current.closeATSDemo();});}
    const escHandler=function(e){if(e.key==='Escape')fnRef.current.closeATSDemo?.();};
    document.addEventListener('keydown',escHandler);
    cleanup.push(()=>document.removeEventListener('keydown',escHandler));

    /* ATS ENGINE */
    ;(function(){
      const ENG=[
        {lbl:'Keyword match',bef:'12% — missing OKR, SQL',aft:'+22 pts · 89% match',pts:22,dims:{rd0:'91%',rb0:91},ins:'<strong>Keyword match:</strong> "Responsible for team tasks" scores 0 for "OKR-driven roadmap". We injected 6 exact-match keywords — immediate ATS pass.'},
        {lbl:'Bullet impact',bef:'No numbers anywhere',aft:'+15 pts · 3 fixed',pts:15,dims:{rd2:'85%',rb2:85},ins:'<strong>Bullet impact:</strong> Numberless bullets are invisible to ATS. "Led OKR roadmap → +28% retention" scores on both machine and human scan.'},
        {lbl:'Section headers',bef:'Non-standard labels',aft:'+8 pts · ATS-readable',pts:8,dims:{rd1:'88%',rb1:88},ins:'<strong>Section headers:</strong> Parsers need exact strings. "What I\'ve done" → section skipped. "Experience" → fully parsed.'},
        {lbl:'Action verbs',bef:'Helped, worked, assisted',aft:'+7 pts · Led, Built, Drove',pts:7,dims:{},ins:'<strong>Action verbs:</strong> Weak openers flag a junior role.'},
        {lbl:'Seniority framing',bef:'Junior-level framing',aft:'+5 pts · Senior aligned',pts:5,dims:{rd3:'94%',rb3:94},ins:'<strong>Seniority framing:</strong> ATS cross-checks years, language, and impact scope against the role level.'},
        {lbl:'File & format',bef:'Tables + parse errors',aft:'+4 pts · Clean column',pts:4,dims:{},ins:'<strong>File format:</strong> PDF tables scramble text order in parsers. Single-column plain text passes every major ATS system.'},
      ];
      let step=0,score=38,done=false,scanStarted=false;
      function buildChecks(){const c=$('engChecks');if(!c)return;c.innerHTML=ENG.map((e,i)=>`<div class="check-row" id="cr${i}"><span class="cr-ic" id="ci${i}"></span><span class="cr-lbl">${e.lbl}</span><span class="cr-st" id="cs${i}">${e.bef}</span></div>`).join('');}
      function buildFixes(){const c=$('engFixes');if(!c)return;c.innerHTML=ENG.map((e,i)=>`<div class="fix-row" id="fr${i}"><span class="fix-ic" id="fi${i}"></span><span class="fix-lbl">${e.lbl}</span><span class="fix-st" id="fs${i}">${e.bef}</span></div>`).join('');}
      function wReset(){step=0;score=38;done=false;scanStarted=false;for(let i=0;i<8;i++){const l=$('rl'+i);if(l)l.className='w-rl';}for(let i=0;i<5;i++){const s=$('ss'+i);if(s)s.className='wss';}const sb=$('scanBar');if(sb)sb.style.width='0';$('scanPct').textContent='0%';$('scoreBefore').textContent='38%';$('scoreAfter').textContent='—';$('barAfter').style.width='0';$('scoreDelta').classList.remove('show');$('scoreDelta').textContent='';const badge=$('engBadge');if(badge){badge.textContent='Running';badge.style.background='rgba(30,201,138,.06)';badge.style.color='var(--c1)';badge.style.borderColor='rgba(30,201,138,.18)';}const dot=$('engDot');if(dot){dot.style.background='var(--c1)';dot.style.animation='wglow 2s infinite';}$('engTitle').textContent='ATS Engine — scanning…';$('atsBadge').textContent='Scanning';const p1=$('ph1'),p2=$('ph2');if(p1){p1.style.display='block';p1.style.opacity='1';}if(p2)p2.style.display='none';$('engKw').style.opacity='0';$('engFin').style.display='none';$('engGate').style.display='none';$('engInsight').style.opacity='0';const rc=$('wrc');if(rc)rc.classList.add('dim');$('rcScore').textContent='—';$('rcVd').style.display='none';$('rcAi').style.opacity='.4';$('rcHd').textContent='AI result card';$('rcTx').textContent='Analysing — results appear here.';for(let i=0;i<4;i++){const d=$('rd'+i),b=$('rb'+i);if(d)d.textContent='—';if(b)b.style.width='0';}const ab=$('applyBtn');if(ab){ab.disabled=false;ab.style.opacity='1';}buildChecks();}
      fnRef.current.wRunScan=function(){if(scanStarted)return;scanStarted=true;wReset();setTimeout(()=>{buildChecks();const lo=[0,2,4,1,6,3,5,7];lo.forEach((li,i)=>{setTimeout(()=>{const el=$('rl'+li);if(el){el.classList.add('scanning');const sw=document.createElement('div');sw.style.cssText='position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(30,201,138,.45),transparent);animation:wsweep 1s ease-in-out infinite';el.appendChild(sw);}},i*70);setTimeout(()=>{const el=$('rl'+li);if(el){el.innerHTML='';el.classList.remove('scanning');el.classList.add(li===1||li===3?'weak':'found');}},i*70+540);});const pcts=['20%','42%','65%','82%','100%'];[160,580,1050,1520,2000].forEach((t,i)=>{setTimeout(()=>{for(let k=0;k<5;k++){const s=$('ss'+k);if(s)s.className='wss'+(k<i?' dn':k===i?' on':'');}const sb=$('scanBar');if(sb)sb.style.width=pcts[i];$('scanPct').textContent=pcts[i];},t);});setTimeout(()=>{const ins=$('engInsight');if(ins){ins.textContent='Checking keywords, headers, bullet impact, seniority framing…';ins.style.opacity='1';}ENG.forEach((_,i)=>setTimeout(()=>{const r=$('cr'+i),ic=$('ci'+i);if(r)r.classList.add('dn');if(ic){ic.style.background='var(--c1)';ic.style.borderColor='var(--c1)';}},i*180));},900);setTimeout(()=>{done=true;$('atsBadge').textContent='Complete';const badge=$('engBadge');if(badge){badge.textContent='Fix mode';badge.style.background='rgba(139,130,240,.07)';badge.style.color='var(--c2)';badge.style.borderColor='rgba(139,130,240,.22)';}const dot=$('engDot');if(dot){dot.style.background='var(--c2)';dot.style.animation='none';}$('engTitle').textContent='ATS Engine — 6 fixes ready';$('engKw').style.opacity='1';const p1=$('ph1'),p2=$('ph2');if(p1)p1.style.display='none';if(p2)p2.style.display='block';buildFixes();const rc=$('wrc');if(rc)rc.classList.remove('dim');$('rcScore').textContent='38%';$('rcVd').style.display='block';$('rcVd').className='wrc-vd low';$('rcVd').textContent='Below average';$('rcAi').style.opacity='1';$('rcTx').innerHTML='<strong>Your score is 38%.</strong> 6 specific issues found. Apply each fix to see your score climb to 91%.';$('rcHd').textContent='Result — fix mode active';},2600);},300);};
      fnRef.current.wResetScanner=function(){scanStarted=false;wRunScan();};
      fnRef.current.wApplyFix=function(){if(step>=ENG.length)return;const e=ENG[step];score+=e.pts;const fi=$('fi'+step),fs=$('fs'+step),fr=$('fr'+step);if(fi){fi.style.background='var(--c1)';fi.style.borderColor='var(--c1)';}if(fs)fs.textContent=e.aft;if(fr)fr.classList.add('done');const fi2=$('fixInsight');if(fi2)fi2.innerHTML=e.ins;$('scoreAfter').textContent=score+'%';$('barAfter').style.width=score+'%';const delta=score-38;$('scoreDelta').textContent='+'+delta+' pts';$('scoreDelta').classList.add('show');Object.entries(e.dims).forEach(([id,v])=>{const el=$(id);if(el){if(id.startsWith('rd'))el.textContent=v;else{el.style.transition='width 1.2s ease';el.style.width=v+'%';}}});step++;const ab=$('applyBtn');if(step>=ENG.length){if(ab){ab.disabled=true;ab.style.opacity='.4';}$('rcScore').textContent='91%';$('rcVd').className='wrc-vd good';$('rcVd').textContent='Excellent — top 5%';$('rcTx').innerHTML='<strong>ATS score: 91%.</strong> Your resume now passes every major scanner. Keyword match 94%, bullet impact 85%, seniority framing 94%.';$('rcHd').textContent='✓ ATS Optimized';setTimeout(()=>{$('engFin').style.display='block';setTimeout(()=>{$('engGate').style.display='block';},1200);},500);}};
      fnRef.current.wCtaClick=function(){const gate=$('engGate');if(gate){gate.style.display='block';gate.scrollIntoView({behavior:'smooth',block:'nearest'});}};
      fnRef.current.wSubmitGate=async function(){const email=($('gateEmail')?.value||'').trim();if(!email||!email.includes('@')){$('gateEmail')?.focus();return;}const btn=document.querySelector('.gate-btn');if(btn){btn.textContent='Saving…';btn.disabled=true;}try{await fetch((import.meta.env.VITE_SUPABASE_URL||'https://ruibdsvrcctxgxctaxwe.supabase.co')+'/rest/v1/waitlist',{method:'POST',headers:{'Content-Type':'application/json','apikey':import.meta.env.VITE_SUPABASE_ANON||'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1aWJkc3ZyY2N0eGd4Y3RheHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0Nzg3MjksImV4cCI6MjA4OTA1NDcyOX0.TB2jdImKiHx6oP0aNNXObShT_eHk0wvtN_As5tkbcmE','Prefer':'return=minimal'},body:JSON.stringify({email,source:'ats_demo'})});}catch(e){}setAuthModal('register');};
    })();

    /* UTILITIES FOR DECK CARDS */
    /* $d and waitD defined here; modal uses $ and wait from the ATS section */
    const $d=id=>document.getElementById(id);
    const waitD=ms=>new Promise(r=>setTimeout(r,ms));
    function cuD(el,target,dur){let s=0,step=target/(dur/16);const iv=setInterval(()=>{s=Math.min(s+step,target);el.textContent=Math.round(s);if(s>=target)clearInterval(iv);},16);}
    async function typeInD(el,txt,spd){const cur=document.createElement('span');cur.className='d-cursor2';el.textContent='';el.appendChild(cur);await new Promise(res=>{let i=0;const iv=setInterval(()=>{if(i<txt.length){el.insertBefore(document.createTextNode(txt[i]),cur);i++;}else{clearInterval(iv);cur.remove();res();}},spd||18);});}

    /* STAGE CARD DATA */
    const STAGES=[
    /* ══ STAGE 1 — GET SEEN ══ */
    {cards:[
    {step:'Step 01',title:'The bot rejected you before anyone read a word',sCls:'st-run',sTxt:'● Scanning',
     html:`<div style="font-size:8px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--ink3);margin-bottom:6px">ATS scan · before → after AI rebuild</div>
    <div style="display:flex;gap:8px;margin-bottom:9px">
      <div style="flex:1;background:rgba(239,68,68,.05);border:1px solid rgba(239,68,68,.2);border-radius:7px;padding:7px 9px">
        <div style="font-size:7px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:#ef4444;margin-bottom:5px">Before — ATS 38%</div>
        <div style="font-size:8.5px;color:rgba(138,135,156,.6);line-height:1.7;font-style:italic">Led product roadmap and strategy initiatives across teams.</div>
        <div style="font-size:8.5px;color:rgba(138,135,156,.6);line-height:1.7;font-style:italic">Managed collaboration and drove business outcomes.</div>
      </div>
      <div style="flex:1;background:var(--c1d);border:1px solid rgba(30,201,138,.2);border-radius:7px;padding:7px 9px;opacity:0;transform:translateX(8px);transition:opacity .5s,transform .5s" id="dc1after">
        <div style="font-size:7px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--c1);margin-bottom:5px">After — ATS 91% ✓</div>
        <div style="font-size:8.5px;color:var(--ink2);line-height:1.7">OKR-driven roadmap · cut TTM 30% · $2.4M delivered.</div>
        <div style="font-size:8.5px;color:var(--ink2);line-height:1.7">Led 3-team alignment · zero escalations · MLOps pipeline.</div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:7px">
      <div style="flex:1;height:5px;background:var(--border2);border-radius:3px;overflow:hidden"><div id="dc1sbar" style="height:100%;border-radius:3px;width:38%;background:#ef4444;transition:width 1.2s cubic-bezier(.22,1,.36,1),background 1.2s"></div></div>
      <span style="font-family:'DM Mono',monospace;font-size:10px;font-weight:700;width:32px;text-align:right" id="dc1snum" style="color:#ef4444">38%</span>
    </div>
    <div style="font-size:8px;color:var(--ink3);font-family:'DM Mono',monospace;margin-top:3px" id="dc1lbl">ATS score · 6 issues detected</div>`,
     anim:async()=>{
      const after=$d('dc1after');if(after){after.style.opacity='0';after.style.transform='translateX(8px)';}
      const bar=$d('dc1sbar');const num=$d('dc1snum');const lbl=$d('dc1lbl');
      if(bar){bar.style.width='38%';bar.style.background='#ef4444';}if(num)num.textContent='38%';if(lbl)lbl.textContent='ATS score · 6 issues detected';
      await waitD(900);
      if(after){after.style.opacity='1';after.style.transform='none';}
      if(bar){bar.style.width='91%';bar.style.background='var(--c1)';}
      let n=38;const iv=setInterval(()=>{n=Math.min(n+2,91);if(num)num.textContent=n+'%';if(n>=91){clearInterval(iv);if(lbl)lbl.textContent='✓ ATS score · top 5% · 90 sec to fix';}},22);
     }},

    {step:'Step 02',title:'Every keyword gap — found, named, injected in one pass',sCls:'st-run',sTxt:'⚡ Matching',
     html:`<div style="font-size:8px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--ink3);margin-bottom:6px">JD match engine · Senior PM · Shopee · this exact role</div>
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:7px;padding:8px 10px;margin-bottom:8px">
      <div style="font-size:7px;color:var(--ink3);font-family:'DM Mono',monospace;margin-bottom:5px;letter-spacing:.5px">JD KEYWORDS — MATCH STATUS</div>
      <div style="display:flex;flex-direction:column;gap:3px">
        <div style="display:flex;align-items:center;justify-content:space-between;font-size:9px"><span style="color:var(--ink2)">OKR-driven roadmap</span><span id="dc2s0" style="font-size:8px;font-family:'DM Mono',monospace;color:var(--ink3)">···</span></div>
        <div style="display:flex;align-items:center;justify-content:space-between;font-size:9px"><span style="color:var(--ink2)">P&amp;L ownership</span><span id="dc2s1" style="font-size:8px;font-family:'DM Mono',monospace;color:var(--ink3)">···</span></div>
        <div style="display:flex;align-items:center;justify-content:space-between;font-size:9px"><span style="color:var(--ink2)">cross-functional leadership</span><span id="dc2s2" style="font-size:8px;font-family:'DM Mono',monospace;color:var(--ink3)">···</span></div>
        <div style="display:flex;align-items:center;justify-content:space-between;font-size:9px"><span style="color:var(--ink2)">data-informed decisions</span><span id="dc2s3" style="font-size:8px;font-family:'DM Mono',monospace;color:var(--ink3)">···</span></div>
        <div style="display:flex;align-items:center;justify-content:space-between;font-size:9px"><span style="color:var(--ink2)">growth experimentation</span><span id="dc2s4" style="font-size:8px;font-family:'DM Mono',monospace;color:var(--ink3)">···</span></div>
      </div>
    </div>
    <div id="dc2result" style="display:flex;align-items:center;gap:8px;background:var(--c1d);border:1px solid rgba(30,201,138,.2);border-radius:7px;padding:7px 10px;opacity:0;transition:opacity .5s">
      <span style="font-size:16px;font-weight:700;color:var(--c1);font-family:'DM Mono',monospace">94%</span>
      <span style="font-size:9px;color:var(--ink2);line-height:1.5">match after AI injection · 3 keywords added · 2 bullets rewritten</span>
    </div>`,
     anim:async()=>{
      const res=$d('dc2result');if(res)res.style.opacity='0';
      const statuses=[['dc2s0',false],['dc2s1',true],['dc2s2',false],['dc2s3',false],['dc2s4',true]];
      statuses.forEach(([id])=>{const e=$d(id);if(e){e.textContent='···';e.style.color='var(--ink3)';}});
      for(const [id,missing] of statuses){
        await waitD(420);const e=$d(id);if(e){e.textContent=missing?'✗ Missing':'✓ Match';e.style.color=missing?'#ef4444':'var(--c1)';}
      }
      await waitD(600);
      for(const [id,missing] of statuses){if(missing){const e=$d(id);if(e){e.textContent='✓ Injected';e.style.color='var(--c1)';}}}
      await waitD(300);if(res)res.style.opacity='1';
     }},

    {step:'Step 03',title:'A recruiter replies 3 days after you apply — because your resume reads right',sCls:'st-done',sTxt:'✓ Callback',
     html:`<div style="font-size:8px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--ink3);margin-bottom:7px">Application timeline · what changed</div>
    <div style="display:flex;flex-direction:column;gap:5px;margin-bottom:9px">
      <div style="display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:6px;background:rgba(239,68,68,.05);border:1px solid rgba(239,68,68,.15)">
        <span style="font-size:9px;font-family:'DM Mono',monospace;color:#ef4444;width:36px;flex-shrink:0">Before</span>
        <span style="font-size:9px;color:var(--ink3)">40 apps · 2 callbacks · ATS 38%</span>
        <span style="margin-left:auto;font-size:8px;font-family:'DM Mono',monospace;color:rgba(239,68,68,.6)">5% reply</span>
      </div>
      <div id="dc3after" style="display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:6px;background:var(--c1d);border:1px solid rgba(30,201,138,.2);opacity:0;transform:translateY(5px);transition:opacity .5s,transform .5s">
        <span style="font-size:9px;font-family:'DM Mono',monospace;color:var(--c1);width:36px;flex-shrink:0">After</span>
        <span style="font-size:9px;color:var(--ink2)">First 6 apps · 3 interviews · ATS 91%</span>
        <span style="margin-left:auto;font-size:8px;font-family:'DM Mono',monospace;color:var(--c1)">50% reply</span>
      </div>
    </div>
    <div id="dc3ping" style="background:rgba(232,92,128,.05);border:1px solid rgba(232,92,128,.2);border-radius:8px;padding:9px 11px;opacity:0;transition:opacity .6s">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">
        <div style="width:20px;height:20px;border-radius:50%;background:var(--c4d);border:1px solid rgba(232,92,128,.3);display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:var(--c4)">JC</div>
        <div><div style="font-size:9.5px;font-weight:600;color:var(--ink)">Jamie C. · Tech Recruiter, Shopee</div><div style="font-size:8px;color:var(--ink3)">3 days after applying</div></div>
      </div>
      <div id="dc3msg" style="font-size:9px;color:var(--ink2);line-height:1.6"></div>
    </div>`,
     anim:async()=>{
      const after=$d('dc3after');const ping=$d('dc3ping');const msg=$d('dc3msg');
      if(after){after.style.opacity='0';after.style.transform='translateY(5px)';}
      if(ping)ping.style.opacity='0';if(msg)msg.textContent='';
      await waitD(600);if(after){after.style.opacity='1';after.style.transform='none';}
      await waitD(800);if(ping)ping.style.opacity='1';
      await waitD(300);
      await typeInD(msg,'Your experience caught my eye — especially the OKR track record. Are you open to a quick call this week about a Senior PM opening?',16);
     }}
    ]},

    /* ══ STAGE 2 — GET READY ══ */
    {cards:[
    {step:'Step 01',title:'Your AI Memory Dashboard — built from everything you\'ve done',sCls:'st-done',sTxt:'✓ Synced',
     html:`<div style="font-size:8px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--ink3);margin-bottom:7px">AI Memory Dashboard · Senior AI Engineer · Alex Tan · session 3</div>
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:9px 11px;margin-bottom:7px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div style="font-size:10px;font-weight:600;color:var(--ink)">Readiness Score</div>
        <div style="font-family:'DM Mono',monospace;font-size:11px;font-weight:700" id="dd-ready" style="color:#ef4444">–</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:7px">
        <div style="background:var(--surf);border-radius:5px;padding:5px 7px;border:1px solid var(--border)"><div style="font-size:14px;font-weight:700;font-family:'DM Mono',monospace" id="dd0" style="color:#ef4444">–</div><div style="font-size:7.5px;color:var(--ink3)">Concrete examples</div><div style="height:2px;background:var(--border2);border-radius:1px;margin-top:3px;overflow:hidden"><div id="ddb0" style="height:100%;border-radius:1px;background:#ef4444;width:0%;transition:width 1s"></div></div></div>
        <div style="background:var(--surf);border-radius:5px;padding:5px 7px;border:1px solid var(--border)"><div style="font-size:14px;font-weight:700;font-family:'DM Mono',monospace" id="dd1" style="color:var(--c3)">–</div><div style="font-size:7.5px;color:var(--ink3)">STAR structure</div><div style="height:2px;background:var(--border2);border-radius:1px;margin-top:3px;overflow:hidden"><div id="ddb1" style="height:100%;border-radius:1px;background:var(--c3);width:0%;transition:width 1s"></div></div></div>
        <div style="background:var(--surf);border-radius:5px;padding:5px 7px;border:1px solid var(--border)"><div style="font-size:14px;font-weight:700;font-family:'DM Mono',monospace" id="dd2" style="color:var(--c2)">–</div><div style="font-size:7.5px;color:var(--ink3)">Clarity &amp; delivery</div><div style="height:2px;background:var(--border2);border-radius:1px;margin-top:3px;overflow:hidden"><div id="ddb2" style="height:100%;border-radius:1px;background:var(--c2);width:0%;transition:width 1s"></div></div></div>
        <div style="background:var(--surf);border-radius:5px;padding:5px 7px;border:1px solid var(--border)"><div style="font-size:14px;font-weight:700;font-family:'DM Mono',monospace" id="dd3" style="color:var(--c1)">–</div><div style="font-size:7.5px;color:var(--ink3)">Role knowledge</div><div style="height:2px;background:var(--border2);border-radius:1px;margin-top:3px;overflow:hidden"><div id="ddb3" style="height:100%;border-radius:1px;background:var(--c1);width:0%;transition:width 1s"></div></div></div>
      </div>
      <div id="dd-mem" style="display:flex;flex-wrap:wrap;gap:3px;opacity:0;transition:opacity .5s">
        <span style="font-size:7.5px;padding:2px 6px;border-radius:20px;background:var(--c1d);color:var(--c1);border:1px solid rgba(30,201,138,.2);font-family:'DM Mono',monospace">✓ LLM rollout memory</span>
        <span style="font-size:7.5px;padding:2px 6px;border-radius:20px;background:var(--c2d);color:var(--c2);border:1px solid rgba(139,130,240,.2);font-family:'DM Mono',monospace">✓ 3 STAR stories</span>
        <span style="font-size:7.5px;padding:2px 6px;border-radius:20px;background:var(--c3d);color:var(--c3);border:1px solid rgba(240,168,50,.2);font-family:'DM Mono',monospace">✓ salary anchored 16k</span>
      </div>
    </div>
    <div id="dd-aibox" style="display:flex;gap:7px;align-items:flex-start;background:var(--c2d);border:1px solid rgba(139,130,240,.22);border-radius:7px;padding:7px 9px;opacity:0;transition:opacity .5s">
      <div style="width:17px;height:17px;border-radius:4px;background:var(--c2);display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700;color:#fff;flex-shrink:0">AI</div>
      <div id="dd-aitxt" style="font-size:9px;color:var(--ink2);line-height:1.6"></div>
    </div>`,
     anim:async()=>{
      const sc=[38,44,72,84];const ready=$d('dd-ready');const mem=$d('dd-mem');const aibox=$d('dd-aibox');const aitxt=$d('dd-aitxt');
      if(ready)ready.textContent='–';if(mem)mem.style.opacity='0';if(aibox)aibox.style.opacity='0';if(aitxt)aitxt.textContent='';
      for(let i=0;i<4;i++){const dEl=$d('dd'+i);const bEl=$d('ddb'+i);if(dEl)dEl.textContent='–';if(bEl)bEl.style.width='0%';}
      await waitD(300);
      for(let i=0;i<4;i++){cuD($d('dd'+i),sc[i],900);$d('ddb'+i).style.width=sc[i]+'%';await waitD(220);}
      let r=0;const rv=setInterval(()=>{r=Math.min(r+1,59);if(ready){ready.textContent=r+'/100';ready.style.color=r<50?'#ef4444':r<70?'var(--c3)':'var(--c2)';}if(r>=59)clearInterval(rv);},28);
      await waitD(1000);if(mem)mem.style.opacity='1';
      await waitD(400);if(aibox)aibox.style.opacity='1';
      await typeInD(aitxt,'Weakest gap: Concrete examples (38). Targeting this first. You\'ll hit 88 readiness in 3 sessions.',14);
     }},

    {step:'Step 02',title:'After each answer — a score and the exact line to fix',sCls:'st-live',sTxt:'● Live',
     html:`<div style="font-size:8px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--ink3);margin-bottom:6px">AI Hiring Manager · Senior AI Engineer</div>
    <div id="ds2q" style="background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:7px 9px;font-size:9.5px;color:var(--ink2);line-height:1.6;margin-bottom:7px;min-height:36px"></div>
    <div style="display:flex;gap:4px;margin-bottom:7px">
      <div style="flex:1;text-align:center;background:var(--surf);border:1px solid var(--border);border-radius:6px;padding:5px 3px"><div id="ds2sc0" style="font-size:14px;font-weight:700;color:#ef4444;font-family:'DM Mono',monospace">–</div><div style="font-size:7.5px;color:var(--ink3)">Examples</div></div>
      <div style="flex:1;text-align:center;background:var(--surf);border:1px solid var(--border);border-radius:6px;padding:5px 3px"><div id="ds2sc1" style="font-size:14px;font-weight:700;color:var(--c3);font-family:'DM Mono',monospace">–</div><div style="font-size:7.5px;color:var(--ink3)">STAR</div></div>
      <div style="flex:1;text-align:center;background:var(--surf);border:1px solid var(--border);border-radius:6px;padding:5px 3px"><div id="ds2sc2" style="font-size:14px;font-weight:700;color:var(--c2);font-family:'DM Mono',monospace">–</div><div style="font-size:7.5px;color:var(--ink3)">Clarity</div></div>
      <div style="flex:1;text-align:center;background:var(--surf);border:1px solid var(--border);border-radius:6px;padding:5px 3px"><div id="ds2sc3" style="font-size:14px;font-weight:700;color:var(--c1);font-family:'DM Mono',monospace">–</div><div style="font-size:7.5px;color:var(--ink3)">Role fit</div></div>
    </div>
    <div id="ds2fb" style="font-size:8.5px;color:var(--ink3);line-height:1.55;font-style:italic;min-height:20px;opacity:0;transition:opacity .4s"></div>`,
     anim:async()=>{
      $d('ds2q').textContent='';['ds2sc0','ds2sc1','ds2sc2','ds2sc3'].forEach(id=>$d(id).textContent='–');
      $d('ds2fb').textContent='';$d('ds2fb').style.opacity='0';
      await typeInD($d('ds2q'),'Tell me about a time you delivered an AI feature under tight constraints. What was the outcome?',16);
      await waitD(500);
      const scores=[{id:'ds2sc0',v:62,c:'#ef4444'},{id:'ds2sc1',v:55,c:'var(--c3)'},{id:'ds2sc2',v:78,c:'var(--c2)'},{id:'ds2sc3',v:80,c:'var(--c1)'}];
      for(const s of scores){cuD($d(s.id),s.v,700);$d(s.id).style.color=s.c;await waitD(180);}
      await waitD(700);$d('ds2fb').style.opacity='1';
      await typeInD($d('ds2fb'),'Score: 61/100. Missing: a quantified result. Add "which cut latency by 40%" and your Examples score jumps to 84.',14);
     }},

    {step:'Step 03',title:'Your best answers — built once, reused in every interview',sCls:'st-done',sTxt:'✓ 3 stories',
     html:`<div style="font-size:8px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--ink3);margin-bottom:4px">Before → After · AI rewrites vague bullets into scored STAR stories</div>
    <div style="font-size:8.5px;color:rgba(232,92,128,.7);font-family:'DM Mono',monospace;margin-bottom:6px;padding:4px 7px;background:rgba(232,92,128,.05);border-radius:4px;border-left:2px solid rgba(232,92,128,.3)">✗ Before: "Led the product team through a difficult launch"</div>
    <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:7px">
      <div id="ds3s0" style="background:var(--surf2);border:1px solid rgba(139,130,240,.2);border-radius:6px;padding:6px 9px;opacity:0;transform:translateX(-7px);transition:opacity .4s,transform .4s">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1px"><span style="font-size:9.5px;font-weight:600;color:var(--ink)">LLM rollout · cut latency 40%</span><span style="font-size:7.5px;font-weight:700;color:var(--c1);background:var(--c1d);padding:1px 6px;border-radius:10px;font-family:'DM Mono',monospace">RESULT ✓</span></div>
        <div style="font-size:8.5px;color:var(--ink3);font-family:'DM Mono',monospace">Situation · Task · Action · Result</div>
      </div>
      <div id="ds3s1" style="background:var(--surf2);border:1px solid rgba(139,130,240,.2);border-radius:6px;padding:6px 9px;opacity:0;transform:translateX(-7px);transition:opacity .4s,transform .4s">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1px"><span style="font-size:9.5px;font-weight:600;color:var(--ink)">Cross-team alignment · zero escalations</span><span style="font-size:7.5px;font-weight:700;color:var(--c2);background:var(--c2d);padding:1px 6px;border-radius:10px;font-family:'DM Mono',monospace">IMPACT ✓</span></div>
        <div style="font-size:8.5px;color:var(--ink3);font-family:'DM Mono',monospace">Situation · Task · Action · Result</div>
      </div>
      <div id="ds3s2" style="background:var(--surf2);border:1px solid var(--border2);border-radius:6px;padding:6px 9px;opacity:0;transform:translateX(-7px);transition:opacity .4s,transform .4s">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1px"><span style="font-size:9.5px;font-weight:600;color:var(--ink)">$2.4M feature delivery — on schedule</span><span style="font-size:7.5px;font-weight:700;color:var(--c3);background:var(--c3d);padding:1px 6px;border-radius:10px;font-family:'DM Mono',monospace">QUANTIFIED ✓</span></div>
        <div style="font-size:8.5px;color:var(--ink3);font-family:'DM Mono',monospace">Situation · Task · Action · Result</div>
      </div>
    </div>
    <div style="font-size:8.5px;color:var(--ink3);font-family:'DM Mono',monospace"><span style="font-size:9px;color:var(--c2);font-weight:700">3</span> stories ready · reused in every interview question</div>`,
     anim:async()=>{
      ['ds3s0','ds3s1','ds3s2'].forEach(id=>{$d(id).style.opacity='0';$d(id).style.transform='translateX(-7px)';});
      await waitD(300);
      for(const id of ['ds3s0','ds3s1','ds3s2']){$d(id).style.opacity='1';$d(id).style.transform='none';await waitD(380);}
     }},

    {step:'Step 04',title:'You find your P75 rate — and get a script to ask for it',sCls:'st-done',sTxt:'✓ Benchmarked',
     html:`<div style="font-size:8px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--ink3);margin-bottom:7px">Market Intel · Senior AI Engineer · Singapore · unlocks at readiness 75</div>
    <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:8px">
      <div class="d-mbar-row"><span class="d-mbar-label" style="width:40px">P25</span><div class="d-mbar-track"><div class="d-mbar-fill" id="ds4b0" style="background:rgba(139,130,240,.5)"></div></div><span class="d-mbar-val" id="ds4v0" style="color:var(--ink3);width:42px;text-align:right">SGD 9k</span></div>
      <div class="d-mbar-row"><span class="d-mbar-label" style="width:40px">Median</span><div class="d-mbar-track"><div class="d-mbar-fill" id="ds4b1" style="background:rgba(139,130,240,.7)"></div></div><span class="d-mbar-val" id="ds4v1" style="color:var(--ink2);width:42px;text-align:right">SGD 12k</span></div>
      <div class="d-mbar-row"><span class="d-mbar-label" style="width:40px">P75</span><div class="d-mbar-track"><div class="d-mbar-fill" id="ds4b2" style="background:rgba(232,92,128,.6)"></div></div><span class="d-mbar-val" id="ds4v2" style="color:var(--c4);width:42px;text-align:right">SGD 16k</span></div>
      <div class="d-mbar-row"><span class="d-mbar-label" style="width:40px">Top 10%</span><div class="d-mbar-track"><div class="d-mbar-fill" id="ds4b3" style="background:var(--c3)"></div></div><span class="d-mbar-val" id="ds4v3" style="color:var(--c3);width:42px;text-align:right">SGD 22k</span></div>
    </div>
    <div id="ds4anchor" style="display:flex;justify-content:space-between;align-items:center;background:var(--c3d);border:1px solid rgba(240,168,50,.22);border-radius:7px;padding:7px 10px;opacity:0;transition:opacity .5s">
      <div><div style="font-size:7.5px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--c3);margin-bottom:2px;font-family:'DM Mono',monospace">Your opening ask — P75 strategy</div>
      <div style="font-size:10px;color:var(--ink2)">Open at <strong style="color:var(--ink)">SGD 16k</strong> · accept <strong style="color:var(--c1)">≥ 14k</strong> · script ready to send</div></div>
      <div style="font-size:13px;font-weight:700;color:var(--c3);font-family:'DM Mono',monospace">+33%</div>
    </div>`,
     anim:async()=>{
      const pcts=[40,55,72,100];$d('ds4anchor').style.opacity='0';
      for(let i=0;i<4;i++){$d('ds4b'+i).style.width='0%';}
      for(let i=0;i<4;i++){$d('ds4b'+i).style.width=pcts[i]+'%';await waitD(180);}
      await waitD(700);$d('ds4anchor').style.opacity='1';
     }}
    ]},

    /* ══ STAGE 4 — GET FOUND ══ */
    {cards:[
    {step:'Step 01',title:'Recruiters see your proof — before they message you',sCls:'st-done',sTxt:'✓ All verified',
     html:`<div style="font-size:8px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--ink3);margin-bottom:7px">Each credential verified · blockchain-anchored · VCS builds as you go</div>
    <div class="d-cred-list" style="margin-bottom:7px">
      <div class="d-cred-row"><div class="d-cred-chk" id="df1c0"></div><span class="d-cred-name">Singpass ID · Alex Tan</span><span class="d-cred-badge ver" id="df1b0">✓ Blockchain</span></div>
      <div class="d-cred-row"><div class="d-cred-chk" id="df1c1"></div><span class="d-cred-name">NUS CS · OpenCerts</span><span class="d-cred-badge ver" id="df1b1">✓ Blockchain</span></div>
      <div class="d-cred-row"><div class="d-cred-chk" id="df1c2"></div><span class="d-cred-name">AWS Solutions Architect · Credly</span><span class="d-cred-badge ver" id="df1b2">✓ Blockchain</span></div>
      <div class="d-cred-row"><div class="d-cred-chk" id="df1c3"></div><span class="d-cred-name">7 yr AI Engineering · verified</span><span class="d-cred-badge ver" id="df1b3">✓ Blockchain</span></div>
    </div>
    <div id="df1cos" style="display:flex;justify-content:space-between;align-items:center;background:var(--c4d);border:1px solid rgba(232,92,128,.2);border-radius:7px;padding:7px 10px;opacity:0;transition:opacity .5s">
      <span style="font-size:9px;color:var(--ink2)">VCS · marketplace unlocked at 80</span>
      <span id="df1cosnum" style="font-size:16px;font-weight:700;color:var(--c4);font-family:'DM Mono',monospace">0 / 100</span>
      <span style="font-size:8px;padding:2px 7px;background:var(--c4d);color:var(--c4);border:1px solid rgba(232,92,128,.22);border-radius:20px;font-weight:700;font-family:'DM Mono',monospace">🔓 Live</span>
    </div>`,
     anim:async()=>{
      for(let i=0;i<4;i++){$d('df1c'+i).classList.remove('ver');$d('df1c'+i).textContent='';$d('df1b'+i).classList.remove('vis');}
      $d('df1cos').style.opacity='0';$d('df1cosnum').textContent='0 / 100';
      for(let i=0;i<4;i++){await waitD(460);$d('df1c'+i).classList.add('ver');$d('df1c'+i).textContent='✓';$d('df1b'+i).classList.add('vis');}
      await waitD(300);$d('df1cos').style.opacity='1';
      let n=0;const iv=setInterval(()=>{n=Math.min(n+2,88);$d('df1cosnum').textContent=n+' / 100';if(n>=88)clearInterval(iv);},28);
     }},

    {step:'Step 02',title:'You appear in front of the one recruiter who matches you',sCls:'st-run',sTxt:'● Scanning',
     html:`<div class="d-mp-dark">
      <div class="d-mp-hrow"><span class="d-mp-badge">AI Match Engine</span><span class="d-mp-scan" id="df2scan">Scanning 0…</span></div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:7px">
        <div class="d-sring" id="df2ring" style="background:conic-gradient(var(--c4) 0deg,var(--c4) 0deg,#1a0814 0deg)"><div class="d-sring-inner"><div class="d-sring-num" id="df2rnum">0%</div><div class="d-sring-lbl">MATCH</div></div></div>
        <div style="flex:1">
          <div class="d-fn-row"><span class="d-fn-lbl">Total pool</span><div class="d-fn-track"><div class="d-fn-fill" style="background:#3d3875" id="df2f0" data-t="100%"></div></div><span class="d-fn-val">2,714</span></div>
          <div class="d-fn-row"><span class="d-fn-lbl">Skills</span><div class="d-fn-track"><div class="d-fn-fill" style="background:#5a54a8" id="df2f1" data-t="5.2%"></div></div><span class="d-fn-val">142</span></div>
          <div class="d-fn-row"><span class="d-fn-lbl">Verified</span><div class="d-fn-track"><div class="d-fn-fill" style="background:#7F77DD" id="df2f2" data-t="1.1%"></div></div><span class="d-fn-val">31</span></div>
          <div class="d-fn-row"><span class="d-fn-lbl">95%+ match</span><div class="d-fn-track"><div class="d-fn-fill" style="background:var(--c4)" id="df2f3" data-t="0.04%"></div></div><span class="d-fn-val" style="color:var(--c4);font-weight:700">1</span></div>
        </div>
      </div>
      <div class="d-mp-creds">
        <span class="d-mp-cred" id="df2m0"><span style="color:#7F77DD">✓</span> Singpass</span>
        <span class="d-mp-cred" id="df2m1"><span style="color:#7F77DD">✓</span> NUS CS</span>
        <span class="d-mp-cred" id="df2m2"><span style="color:#7F77DD">✓</span> AWS SAA</span>
        <span class="d-mp-cred" id="df2m3"><span style="color:#7F77DD">✓</span> 7yr AI</span>
      </div>
    </div>`,
     anim:async()=>{
      $d('df2scan').classList.remove('done');$d('df2scan').textContent='Scanning 0…';$d('df2rnum').textContent='0%';
      ['df2f0','df2f1','df2f2','df2f3'].forEach(id=>$d(id).style.width='0%');
      ['df2m0','df2m1','df2m2','df2m3'].forEach(id=>$d(id).classList.remove('vis'));
      $d('df2ring').style.background='conic-gradient(var(--c4) 0deg,var(--c4) 0deg,#1a0814 0deg)';
      let cn=0;const civ=setInterval(()=>{cn=Math.min(cn+68,2714);$d('df2scan').textContent='Scanning '+cn.toLocaleString()+'…';if(cn>=2714){clearInterval(civ);$d('df2scan').textContent='2,714 scanned ✓';$d('df2scan').classList.add('done');}},40);
      let sc=0;const siv=setInterval(()=>{sc=Math.min(sc+1.4,95);$d('df2rnum').textContent=Math.round(sc)+'%';const deg=Math.round(sc/100*360);$d('df2ring').style.background=`conic-gradient(var(--c4) 0deg,var(--c4) ${deg}deg,#1a0814 ${deg}deg)`;if(sc>=95)clearInterval(siv);},20);
      ['df2f0','df2f1','df2f2','df2f3'].forEach((id,i)=>setTimeout(()=>{const el=$d(id);el.style.transition='width .9s cubic-bezier(.22,1,.36,1)';el.style.width=el.getAttribute('data-t');},i*280));
      ['df2m0','df2m1','df2m2','df2m3'].forEach((id,i)=>setTimeout(()=>$d(id).classList.add('vis'),1200+i*200));
     }},

    {step:'Step 03',title:'A recruiter who already knows your credentials messages you',sCls:'st-live',sTxt:'● Live',
     html:`<div class="d-rec-ping">
      <div class="d-rec-hd"><div class="d-rec-av">👤</div><div><div class="d-rec-name">Sarah L. · Head of Talent · Vertex AI Labs</div><div class="d-rec-role">Senior AI Engineer · 95% match · <span style="color:var(--c1);font-weight:700">3:42 after you went live</span></div></div></div>
      <div class="d-rec-msg" id="df3msg"></div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:5px">
        <span style="font-size:7.5px;padding:1px 6px;border-radius:10px;background:var(--c1d);color:var(--c1);border:1px solid rgba(30,201,138,.2);font-family:'DM Mono',monospace;font-weight:700">✓ NUS CS</span>
        <span style="font-size:7.5px;padding:1px 6px;border-radius:10px;background:var(--c1d);color:var(--c1);border:1px solid rgba(30,201,138,.2);font-family:'DM Mono',monospace;font-weight:700">✓ AWS SAA</span>
        <span style="font-size:7.5px;padding:1px 6px;border-radius:10px;background:var(--c1d);color:var(--c1);border:1px solid rgba(30,201,138,.2);font-family:'DM Mono',monospace;font-weight:700">✓ Singpass</span>
        <span style="font-size:7.5px;padding:1px 6px;border-radius:10px;background:var(--c1d);color:var(--c1);border:1px solid rgba(30,201,138,.2);font-family:'DM Mono',monospace;font-weight:700">✓ 7yr AI exp</span>
      </div>
    </div>`,
     anim:async()=>{
      const el=$d('df3msg');el.textContent='';
      await typeInD(el,'Hi Alex — I can see your ✓NUS CS degree, ✓AWS cert, and 7 years AI experience. You\'re shortlisted for our Senior AI Engineer role. Are you open to a call this Friday at SGD 14k/mo?',19);
     }},

    {step:'Step 04',title:'Your profile is live — 3 employers shortlisted you today',sCls:'st-done',sTxt:'✓ Top 8%',
     html:`<div style="font-size:8px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--ink3);margin-bottom:7px">Candidate view · Alex Tan</div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <div style="width:30px;height:30px;border-radius:50%;background:var(--c4d);border:2px solid rgba(232,92,128,.3);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:var(--ink);flex-shrink:0;font-family:'DM Mono',monospace">AT</div>
      <div style="flex:1"><div style="font-size:11px;font-weight:600;color:var(--ink)">Alex Tan · Senior AI Engineer</div><div style="font-size:8.5px;color:var(--ink3)">VCS <span id="df4ts" style="font-family:'DM Mono',monospace;font-weight:700;color:var(--c4)">0</span>/100 · <span style="color:var(--c1)">Top 8%</span></div></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:3px;margin-bottom:7px">
      <div id="df4m0" style="display:flex;justify-content:space-between;align-items:center;padding:5px 8px;border-radius:5px;background:var(--bg2);border:1px solid var(--border);opacity:0;transform:translateX(6px);transition:opacity .4s,transform .4s"><span style="font-size:9.5px;font-weight:600;color:var(--ink)">Vertex AI Labs</span><span style="font-size:12px;font-weight:700;color:var(--c1);font-family:'DM Mono',monospace">95%</span></div>
      <div id="df4m1" style="display:flex;justify-content:space-between;align-items:center;padding:5px 8px;border-radius:5px;background:var(--bg2);border:1px solid var(--border);opacity:0;transform:translateX(6px);transition:opacity .4s,transform .4s"><span style="font-size:9.5px;font-weight:600;color:var(--ink)">Grab</span><span style="font-size:12px;font-weight:700;color:var(--c2);font-family:'DM Mono',monospace">88%</span></div>
      <div id="df4m2" style="display:flex;justify-content:space-between;align-items:center;padding:5px 8px;border-radius:5px;background:var(--bg2);border:1px solid var(--border);opacity:0;transform:translateX(6px);transition:opacity .4s,transform .4s"><span style="font-size:9.5px;font-weight:600;color:var(--ink)">Sea Group</span><span style="font-size:12px;font-weight:700;color:var(--c4);font-family:'DM Mono',monospace">81%</span></div>
    </div>
    <div class="d-tbadge" id="df4t0">🔐 Identity &amp; credentials verified — recruiters see proof<span>✓</span></div>
    <div class="d-tbadge" id="df4t1">⚡ 95% match · first ping in 3:42 · avg 9 days to shortlist<span>✓</span></div>
    <div class="d-tbadge" id="df4t2">🧠 AI memory profile active · gets sharper every session<span>✓</span></div>`,
     anim:async()=>{
      ['df4t0','df4t1','df4t2'].forEach(id=>$d(id).classList.remove('vis'));
      ['df4m0','df4m1','df4m2'].forEach(id=>{$d(id).style.opacity='0';$d(id).style.transform='translateX(6px)';});
      $d('df4ts').textContent='0';
      let n=0;const iv=setInterval(()=>{n=Math.min(n+2,88);$d('df4ts').textContent=n;if(n>=88)clearInterval(iv);},22);
      await waitD(400);
      for(const id of ['df4m0','df4m1','df4m2']){$d(id).style.opacity='1';$d(id).style.transform='none';await waitD(300);}
      await waitD(300);['df4t0','df4t1','df4t2'].forEach((id,i)=>setTimeout(()=>$d(id).classList.add('vis'),400+i*280));
     }}
    ]}
    ];

    /* ── DECK ENGINE (manual, no auto-timer) ── */
    function makeCardEl(card,si){
      const isV=si===1||si===2;
      const d=document.createElement('div');d.className='dcard';
      d.innerHTML=`<div class="dcard-top"><div class="dct-dots"><div class="dct-dot"></div><div class="dct-dot"></div><div class="dct-dot"></div></div><div class="dct-step">${card.step}</div><div class="dct-status ${card.sCls}">${card.sTxt}</div></div><div class="dcard-body"><div class="dcard-title">${card.title}</div>${card.html}</div>`;
      return d;
    }

    STAGES.forEach((stage,si)=>{
      const stackEl=$d('dk'+si),stepsEl=$d('ds'+si);
      const fillEl=$d('dpfill'+si),lblEl=$d('dplbl'+si);
      const prevBtn=$d('dprev'+si),nextBtn=$d('dnext'+si);
      if(!stackEl||!stepsEl)return;
      const isV=si===1||si===2;
      const N=stage.cards.length;
      let current=0,fanned=false;
      const animRunning=Array(N).fill(false),cardEls=[];

      stage.cards.forEach((_,i)=>{
        const el=document.createElement('div');el.className='dstep';
        el.innerHTML=`<span>${String(i+1).padStart(2,'0')}</span>`;
        el.addEventListener('click',()=>{unfan();goTo(i);});
        stepsEl.appendChild(el);
      });
      stage.cards.forEach((card,i)=>{
        const el=makeCardEl(card,si);
        el.addEventListener('click',()=>{if(!fanned)fan();else{unfan();goTo(i);}});
        stackEl.appendChild(el);cardEls.push(el);
      });

      function updateProgress(){
        const pct=N>1?Math.round((current/(N-1))*100):100;
        if(fillEl)fillEl.style.width=pct+'%';
        if(lblEl)lblEl.textContent=`Step ${current+1} / ${N}`;
        stepsEl.querySelectorAll('.dstep').forEach((el,i)=>{
          el.classList.toggle('done',i<current);
          el.style.opacity=i===current?'1':i<current?'.6':'.3';
        });
      }
      function position(){
        if(fanned){
          cardEls.forEach((el,i)=>{const ord=(i-current+N)%N;el.removeAttribute('data-pos');el.setAttribute('data-fan',ord);});
          stackEl.classList.add('fanned');
        }else{
          cardEls.forEach((el,i)=>{const pos=(i-current+N)%N;el.removeAttribute('data-fan');el.setAttribute('data-pos',pos);});
          stackEl.classList.remove('fanned');
        }
        updateProgress();
      }
      function fan(){fanned=true;position();}
      function unfan(){fanned=false;position();}
      async function runAnim(idx){
        if(animRunning[idx])return;animRunning[idx]=true;
        const cls='card-enter';
        cardEls[idx].classList.remove(cls);void cardEls[idx].offsetWidth;cardEls[idx].classList.add(cls);
        try{await stage.cards[idx].anim();}catch(e){}
        animRunning[idx]=false;
      }
      function goTo(idx){current=idx;position();runAnim(idx);for(let i=0;i<N;i++)if(i!==idx)animRunning[i]=false;}

      /* prev / next buttons */
      if(prevBtn)prevBtn.addEventListener('click',e=>{e.stopPropagation();unfan();goTo((current-1+N)%N);});
      if(nextBtn)nextBtn.addEventListener('click',e=>{e.stopPropagation();unfan();goTo((current+1)%N);});

      /* hover fan */
      stackEl.addEventListener('mouseenter',()=>{if(!fanned)fan();});
      stackEl.addEventListener('mouseleave',()=>{if(fanned)unfan();});

      position();
      stage._start=()=>{goTo(0);};
      stage._started=false;
    });

    /* NAV PROGRESS + INTERSECTION */
    const navItems=document.querySelectorAll('.sni');
    const snavFill=document.getElementById('snavFill');
    const progWidths=['0%','50%','100%'];
    // Auto-start all stages immediately so they are always visible
    document.querySelectorAll('.stage').forEach(s=>s.classList.add('vis'));
    STAGES.forEach((stage,si)=>{if(!stage._started){stage._started=true;stage._start();}});
    // Also auto-activate TrustMatch
    ;(function(){var tm=document.querySelector('.tmatch');if(tm){tm.classList.add('vis');tm.classList.add('beat2');tm.classList.add('beat3');}})();
    navItems[0]&&navItems[0].classList.add('active');
    const stageObs=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        const sec=entry.target,si=parseInt(sec.dataset.si);
        sec.classList.add('vis');
        navItems.forEach((n,i)=>n.classList.toggle('active',i===si));
        if(snavFill)snavFill.style.width=progWidths[si];
        if(!STAGES[si]._started){STAGES[si]._started=true;STAGES[si]._start();}
      });
    },{threshold:0.25});
    document.querySelectorAll('.stage').forEach(s=>stageObs.observe(s));
    cleanup.push(()=>stageObs.disconnect());

    /* TRUSTMATCH ANIMATION */
    ;(function(){
      function activateTmatch(){var sec=document.querySelector('.tmatch');if(!sec||sec.classList.contains('vis'))return;sec.classList.add('vis');setTimeout(function(){sec.classList.add('beat2');},280);setTimeout(function(){sec.classList.add('beat3');},680);}
      if('IntersectionObserver' in window){var obs2=new IntersectionObserver(function(entries){entries.forEach(function(e){if(!e.isIntersecting)return;activateTmatch();obs2.disconnect();});},{threshold:0.08,rootMargin:'0px 0px -40px 0px'});var sec2=document.querySelector('.tmatch');if(sec2)obs2.observe(sec2);}
    })();

    /* FLOAT CTA */
    ;(function(){
      const floatCta=document.getElementById('floatCta');
      const hero=document.querySelector('#hero');
      if(!floatCta||!hero)return;
      const heroObs=new IntersectionObserver(entries=>{entries.forEach(e=>floatCta.classList.toggle('vis',!e.isIntersecting));},{threshold:0});
      heroObs.observe(hero);
      cleanup.push(()=>heroObs.disconnect());
    })();
    /* duplicate nav observer removed */

    ;

    ;

    /* RECRUITER TOGGLE */
    fnRef.current.toggleRecruiterSection = function(scrollTo){
      const sec=document.getElementById('for-recruiters');
      const btn=document.getElementById('recruiterToggleBtn');
      const navBtn=document.getElementById('navRecruiterBtn');
      if(!sec||!btn)return;
      const isOpen=sec.classList.contains('recruiter-open');
      if(isOpen){
        sec.classList.remove('recruiter-open');
        btn.classList.remove('open');
        if(navBtn)navBtn.classList.remove('open');
      } else {
        sec.classList.add('recruiter-open');
        btn.classList.add('open');
        if(navBtn)navBtn.classList.add('open');
        if(scrollTo!==false){
          setTimeout(()=>{
            document.getElementById('recruiter-trigger').scrollIntoView({behavior:'smooth',block:'start'});
          },80);
        }
      }
    }
    /* Nav recruiter access button opens + scrolls */
    ;(function(){
      const navA=document.querySelector('.nav-cta a.btn-ghost');
      if(navA&&navA.textContent.trim()==='Recruiter Access'){
        navA.id='navRecruiterBtn';
        navA.href='#recruiter-trigger';
        navA.addEventListener('click',function(e){
          e.preventDefault();
          const sec=document.getElementById('for-recruiters');
          if(!sec.classList.contains('recruiter-open')){
            toggleRecruiterSection(false);
          }
          setTimeout(()=>{
            document.getElementById('recruiter-trigger').scrollIntoView({behavior:'smooth',block:'start'});
          },80);
        });
      }
    })();

    fnRef.current.toggleFaqMore = function(btn){
      const m=document.getElementById('faqMore');
      const arrow=document.getElementById('faqMoreArrow');
      const txt=document.getElementById('faqMoreBtnTxt');
      const open=m.style.display==='flex';
      m.style.display=open?'none':'flex';
      arrow.style.transform=open?'':'rotate(180deg)';
      if(txt)txt.textContent=open?'See more questions':'Show fewer questions';
    }

    /* LEGAL MODALS */
    const LEGAL={
      tos:{title:'Terms of Service — CareerAiHub',body:'<p style="font-size:11px;color:var(--ink3);margin-bottom:20px">Last updated: April 2026 · CareerAiHub Pte. Ltd. · Singapore</p><h3 style="font-size:14px;font-weight:600;color:var(--ink);margin:0 0 8px">1. Acceptance of terms</h3><p style="margin-bottom:16px">By using CareerAiHub, you agree to these Terms of Service. If you do not agree, please do not use the platform.</p><h3 style="font-size:14px;font-weight:600;color:var(--ink);margin:0 0 8px">2. Service description</h3><p style="margin-bottom:16px">CareerAiHub provides AI-powered career tools including resume scanning, ATS scoring, mock interview coaching, salary benchmarking, and related services. Features marked "Building next" are roadmap items not currently available.</p><h3 style="font-size:14px;font-weight:600;color:var(--ink);margin:0 0 8px">3. User obligations</h3><ul style="margin-bottom:16px;padding-left:20px;line-height:2"><li>You must be 18 or older to use the platform</li><li>You may only upload resumes you have the right to share</li><li>You may not use the platform for any unlawful purpose</li><li>You may not attempt to reverse-engineer or copy the platform</li></ul><h3 style="font-size:14px;font-weight:600;color:var(--ink);margin:0 0 8px">4. Subscription and billing</h3><p style="margin-bottom:16px">Pro subscription: SGD 8.99 for a 7-day trial, then SGD 21/month automatically. You may cancel before the trial ends for no charge. Refunds available within 7 days of initial charge.</p><h3 style="font-size:14px;font-weight:600;color:var(--ink);margin:0 0 8px">5. Limitation of liability</h3><p style="margin-bottom:16px">CareerAiHub provides career guidance tools, not guaranteed employment outcomes. AI-generated scores are for informational purposes. We are not liable for employment decisions made by third parties.</p><h3 style="font-size:14px;font-weight:600;color:var(--ink);margin:0 0 8px">6. Governing law</h3><p>These terms are governed by the laws of Singapore. Disputes shall be resolved in Singapore courts.</p>'},
      privacy:{title:'Privacy Policy — CareerAiHub',body:'<p style="font-size:11px;color:var(--ink3);margin-bottom:20px">Last updated: April 2026 · CareerAiHub Pte. Ltd. · Singapore</p><h3 style="font-size:14px;font-weight:600;color:var(--ink);margin:0 0 8px">1. What data we collect</h3><p style="margin-bottom:16px">We collect your resume file (PDF or DOCX), your email address when you create an account, and your usage data within the platform. We do not collect payment card data directly — this is handled by our payment processor.</p><h3 style="font-size:14px;font-weight:600;color:var(--ink);margin:0 0 8px">2. How we use your data</h3><p style="margin-bottom:16px">Your resume is used solely to power your CareerAiHub modules. It is never shared with recruiters, employers, or third-party advertisers without your explicit consent.</p><h3 style="font-size:14px;font-weight:600;color:var(--ink);margin:0 0 8px">3. Data storage and security</h3><p style="margin-bottom:16px">All data is encrypted at rest (AES-256) and in transit (TLS 1.3). Your resume is stored on secure cloud infrastructure in Singapore. Access is restricted to essential engineering staff only.</p><h3 style="font-size:14px;font-weight:600;color:var(--ink);margin:0 0 8px">4. Your rights (PDPA)</h3><ul style="margin-bottom:16px;padding-left:20px;line-height:2"><li>Access your personal data at any time from account settings</li><li>Request correction of inaccurate data</li><li>Request deletion — processed within 24 hours</li><li>Withdraw consent for data processing at any time</li></ul><h3 style="font-size:14px;font-weight:600;color:var(--ink);margin:0 0 8px">5. Cookies</h3><p style="margin-bottom:16px">We use essential cookies for session management and optional analytics cookies (Google Analytics 4). You can decline optional cookies via the consent banner.</p><h3 style="font-size:14px;font-weight:600;color:var(--ink);margin:0 0 8px">6. Contact</h3><p>privacy@careeraihub.com · CareerAiHub Pte. Ltd. · Singapore</p>'},
      security:{title:'Security Statement — CareerAiHub',body:'<p style="font-size:11px;color:var(--ink3);margin-bottom:20px">Last updated: April 2026</p><h3 style="font-size:14px;font-weight:600;color:var(--ink);margin:0 0 8px">Encryption</h3><p style="margin-bottom:16px">All data is encrypted at rest using AES-256 and in transit using TLS 1.3. Resume files are encrypted immediately upon upload before being stored.</p><h3 style="font-size:14px;font-weight:600;color:var(--ink);margin:0 0 8px">Blockchain anchoring</h3><p style="margin-bottom:16px">Verified credentials are cryptographically hashed and written to a public blockchain — immutable and tamper-evident.</p><h3 style="font-size:14px;font-weight:600;color:var(--ink);margin:0 0 8px">Access control</h3><p style="margin-bottom:16px">Access to production systems is restricted to essential engineering staff. All access is logged and audited. Regular security reviews are conducted.</p><h3 style="font-size:14px;font-weight:600;color:var(--ink);margin:0 0 8px">Responsible disclosure</h3><p>Found a vulnerability? Email security@careeraihub.com. We respond within 48 hours and resolve critical issues within 7 days.</p>'},
      deletion:{title:'Data Deletion Request — CareerAiHub',body:'<p style="font-size:13px;color:var(--ink2);line-height:1.75;margin-bottom:20px">You have the right to request deletion of all personal data CareerAiHub holds about you at any time, in accordance with Singapore\'s PDPA.</p><h3 style="font-size:14px;font-weight:600;color:var(--ink);margin:0 0 8px">What gets deleted</h3><ul style="margin-bottom:16px;padding-left:20px;line-height:2"><li>Your resume file(s) and all parsed content</li><li>Your account and profile data</li><li>Your session history and AI coaching records</li><li>Your Verification Clarity Score and verified credential links</li></ul><h3 style="font-size:14px;font-weight:600;color:var(--ink);margin:0 0 8px">Timeline</h3><p style="margin-bottom:16px">Active data is deleted within 24 hours. Backup copies are purged within 30 days. Blockchain credential hashes are pseudonymous and contain no personal data.</p><h3 style="font-size:14px;font-weight:600;color:var(--ink);margin:0 0 8px">How to request</h3><p style="margin-bottom:8px">Delete directly from Settings → Account → Delete Account.</p><p>Or email: <a href="mailto:privacy@careeraihub.com" style="color:var(--g1)">privacy@careeraihub.com</a> with subject "Data Deletion Request".</p>'}
    };
    fnRef.current.openLegal = function(key){
      const modal=document.getElementById('legalModal');
      const sheet=document.getElementById('legalSheet');
      const title=document.getElementById('legalTitle');
      const body=document.getElementById('legalBody');
      const d=LEGAL[key];if(!d||!modal)return;
      title.textContent=d.title;body.innerHTML=d.body;
      modal.style.display='flex';document.body.style.overflow='hidden';
      requestAnimationFrame(()=>requestAnimationFrame(()=>{sheet.style.transform='translateY(0)';}));
    }
    fnRef.current.closeLegal = function(){
      const modal=document.getElementById('legalModal');
      const sheet=document.getElementById('legalSheet');
      if(!modal)return;
      sheet.style.transform='translateY(100%)';
      setTimeout(()=>{modal.style.display='none';document.body.style.overflow='';},400);
    }
    fnRef.current.toggleRecruiter = fnRef.current.toggleRecruiterSection;

    return () => {
      if (document.head.contains(fontLink)) document.head.removeChild(fontLink);
      document.documentElement.style.scrollBehavior = '';
      cleanup.forEach(fn => { try { fn(); } catch(e) {} });
    };
  }, []);

  return (
    <div className="v10lp">
      {/* NAV */}
      <nav>
        <a href="#" onClick={e => e.preventDefault()} className="nav-logo">
          <div className="nav-logo-mark">C</div>
          <div>
            <div className="nav-logo-text">CareerAiHub</div>
            <div className="nav-logo-sub">Proof over claims.</div>
          </div>
        </a>
        <div className="nav-links">
          <a href="#howitworks">How It Works</a>
          <a href="#s1">For Candidates</a>
          <a href="#for-recruiters">For Recruiters</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className="nav-cta">
          <button className="btn-ghost" onClick={() => fnRef.current.toggleRecruiter?.()}>Recruiter Access</button>
          <button className="btn-primary" onClick={() => setAuthModal("register")}>Get Early Access →</button>
          <button className="nav-hamburger" id="navHamburger" aria-label="Menu" onClick={() => fnRef.current.toggleMobileNav?.()}><span></span><span></span><span></span></button>
        </div>
      </nav>
      {/* MOBILE NAV */}
      <div className="mobile-nav" id="mobileNav">
        <a href="#trust-gap" onClick={() => fnRef.current.closeMobileNav?.()}>Why CareerAiHub</a>
        <a href="#howitworks" onClick={() => fnRef.current.closeMobileNav?.()}>How It Works</a>
        <a href="#trustmatch" onClick={() => fnRef.current.closeMobileNav?.()}>TrustMatch</a>
        <a href="#for-recruiters" onClick={() => fnRef.current.closeMobileNav?.()}>For Recruiters</a>
        <a href="#pricing" onClick={() => fnRef.current.closeMobileNav?.()}>Pricing</a>
        <a href="#testimonials" onClick={() => fnRef.current.closeMobileNav?.()}>Stories</a>
        <a href="#faq" onClick={() => fnRef.current.closeMobileNav?.()}>FAQ</a>
        <button onClick={() => { fnRef.current.closeMobileNav?.(); setAuthModal("register"); }} style={{color: "var(--g1)", fontWeight: "600", background:"none",border:"none",cursor:"pointer",fontSize:"14px",padding:"10px 0",borderBottom:"1px solid var(--border)",width:"100%",textAlign:"left"}}>Get Early Access →</button>
      </div>

      {/* HERO */}
      <section id="hero">
        <div className="hero-bg">
          <div className="hero-grid"></div>
          <div className="hero-glow1"></div>
          <div className="hero-glow2"></div>
        </div>
        <div className="wrap" style={{display: 'contents'}}>
          <div className="hero-copy" style={{paddingLeft: '48px'}} id="hero-copy">
            <div className="hero-badge"><span className="hero-badge-dot"></span>The Trust Infrastructure for Hiring</div>
            <h1 className="hero-h1">Hiring Beyond<br /><span className="accent">Resumes.</span></h1>
            <p className="hero-sub">CareerAiHub helps candidates prove real skills and helps recruiters hire with verified trust signals — <strong>not keyword spam.</strong></p>
            <div className="hero-actions">
              <button className="btn-hero" onClick={() => setAuthModal("register")}>Get Early Access →</button>
              <button className="btn-watch" onClick={() => fnRef.current.openATSDemo?.()}><span className="btn-watch-ic">▶</span> Watch Demo</button>
            </div>
            <div className="hero-stats">
              <div className="hero-stat"><div className="val">10+</div><div className="lbl">Modules Live</div></div>
              <div className="hero-stat"><div className="val">2,714</div><div className="lbl">Verified Profiles</div></div>
              <div className="hero-stat"><div className="val">Early</div><div className="lbl">Access Open</div></div>
              <div className="hero-stat"><div className="val">SG</div><div className="lbl">Founded &amp; Built</div></div>
            </div>
          </div>
          <div className="hero-visual" style={{paddingRight: '48px'}}>
            <div className="hc-wrap">

              {/* Single animated Trust Card */}
              <div className="trust-card hc-card" id="hcCard">

                {/* Header row: badge left, score ring right */}
                <div className="tc-header">
                  <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                    <div className="tc-badge" id="hcBadge" style={{opacity: '0', transform: 'translateY(-6px)', transition: 'opacity .5s,transform .5s'}}>✓ Clarity Verified</div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                      <div className="tc-avatar">ML</div>
                      <div className="tc-info">
                        <div className="tc-name">Marcus Lee</div>
                        <div className="tc-role">Product Designer</div>
                        <div className="tc-skills">
                          <span className="tc-skill">UI/UX</span><span className="tc-skill">Figma</span><span className="tc-skill">Design Systems</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Animated score ring */}
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: '0'}}>
                    <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '8px', color: 'var(--ink3)', letterSpacing: '.04em'}}>Verification Clarity Score</div>
                    <div style={{position: 'relative', width: '72px', height: '72px'}}>
                      <svg viewBox="0 0 72 72" width="72" height="72" style={{position: 'absolute', top: '0', left: '0'}}>
                        <circle cx="36" cy="36" r="30" fill="none" stroke="var(--surf2)" strokeWidth="5"/>
                        <circle cx="36" cy="36" r="30" fill="none" stroke="var(--c1)" strokeWidth="5"
                          strokeDasharray="188.5" strokeDashoffset="188.5"
                          strokeLinecap="round" transform="rotate(-90 36 36)"
                          id="hcRingArc" style={{transition: 'stroke-dashoffset 2s cubic-bezier(.22,1,.36,1)'}}/>
                      </svg>
                      <div style={{position: 'absolute', inset: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                        <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '18px', fontWeight: '700', color: 'var(--ink)', lineHeight: '1'}} id="hcScoreNum">0</div>
                        <div style={{fontSize: '8px', color: 'var(--ink3)', fontFamily: '\'DM Mono\',monospace'}}>VCS</div>
                      </div>
                    </div>
                    <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '8px', color: 'var(--c1)', opacity: '0'}} id="hcScoreLbl">···</div>
                  </div>
                </div>

                {/* Verification badges — stagger in */}
                <div className="tc-verified" style={{marginTop: '4px'}}>
                  <div className="tc-verified-title">Verification Clarity Breakdown</div>
                  <div className="tc-proof-grid">
                    <div className="tc-proof-item" id="hcb0" style={{opacity: '0', transform: 'translateY(8px)', transition: 'opacity .45s,transform .45s'}}>
                      <div className="tc-proof-ic">🎓</div><div className="tc-proof-name">Education</div><div className="tc-proof-chk">✓ Verified</div>
                    </div>
                    <div className="tc-proof-item" id="hcb1" style={{opacity: '0', transform: 'translateY(8px)', transition: 'opacity .45s .13s,transform .45s .13s'}}>
                      <div className="tc-proof-ic">💼</div><div className="tc-proof-name">Work</div><div className="tc-proof-chk">✓ Verified</div>
                    </div>
                    <div className="tc-proof-item" id="hcb2" style={{opacity: '0', transform: 'translateY(8px)', transition: 'opacity .45s .26s,transform .45s .26s'}}>
                      <div className="tc-proof-ic">🔥</div><div className="tc-proof-name">Projects</div><div className="tc-proof-chk">✓ Verified</div>
                    </div>
                    <div className="tc-proof-item" id="hcb3" style={{opacity: '0', transform: 'translateY(8px)', transition: 'opacity .45s .39s,transform .45s .39s'}}>
                      <div className="tc-proof-ic">🏅</div><div className="tc-proof-name">Certificate</div><div className="tc-proof-chk">✓ Verified</div>
                    </div>
                  </div>
                  {/* Verification sources strip */}
                  <div id="hcb4" style={{display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px', opacity: '0', transform: 'translateY(6px)', transition: 'opacity .45s .55s,transform .45s .55s'}}>
                    <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '7px', padding: '2px 6px', borderRadius: '20px', background: 'rgba(30,201,138,.07)', color: 'var(--c1)', border: '1px solid rgba(30,201,138,.18)'}}>🇸🇬 Singpass</span>
                    <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '7px', padding: '2px 6px', borderRadius: '20px', background: 'rgba(30,201,138,.07)', color: 'var(--c1)', border: '1px solid rgba(30,201,138,.18)'}}>🎓 OpenCerts</span>
                    <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '7px', padding: '2px 6px', borderRadius: '20px', background: 'rgba(139,130,240,.07)', color: 'var(--c2)', border: '1px solid rgba(139,130,240,.18)'}}>🏅 Credly</span>
                    <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '7px', padding: '2px 6px', borderRadius: '20px', background: 'rgba(99,102,241,.07)', color: 'var(--g1)', border: '1px solid rgba(99,102,241,.18)'}}>⚖️ MOM COMPASS</span>
                  </div>
                </div>

                {/* Bottom: AI insight + match score */}
                <div className="tc-bottom" id="hcBottom" style={{opacity: '0', transform: 'translateY(6px)', transition: 'opacity .5s,transform .5s'}}>
                  <div className="tc-insight">
                    <div className="tc-insight-lbl">AI Insight</div>
                    <div className="tc-insight-text">Strong design systems thinking. High potential for senior product design roles.</div>
                  </div>
                  <div className="tc-match">
                    <div className="tc-match-lbl">Role Match</div>
                    <div className="tc-match-num" id="hcMatchNum">0%</div>
                    <div className="tc-match-role">Product Designer</div>
                    <div className="tc-match-bar"><div className="tc-match-fill" id="hcMatchBar" style={{width: '0%', transition: 'width 1.4s cubic-bezier(.22,1,.36,1)'}}></div></div>
                  </div>
                </div>

                {/* TrustChat notification — slides up last */}
                <div className="hc-trustchat" id="hcTrustChat" style={{opacity: '0', transform: 'translateY(12px)', transition: 'opacity .55s,transform .55s cubic-bezier(.34,1.12,.64,1)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                    <div style={{width: '8px', height: '8px', borderRadius: '50%', background: 'var(--c4)', boxShadow: '0 0 8px rgba(232,92,128,.6)', animation: 'hbPulse 1.5s ease infinite'}}></div>
                    <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '9px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--c4)'}}>TrustChat · New message</div>
                    <div style={{marginLeft: 'auto', fontFamily: '\'DM Mono\',monospace', fontSize: '8px', color: 'var(--ink3)'}} id="hcTimer">3:42</div>
                  </div>
                  <div style={{display: 'flex', gap: '8px', alignItems: 'flex-start'}}>
                    <div style={{width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(232,92,128,.12)', border: '1px solid rgba(232,92,128,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '700', color: 'var(--c4)', flexShrink: '0'}}>RC</div>
                    <div>
                      <div style={{fontSize: '11px', fontWeight: '600', color: 'var(--ink)', marginBottom: '2px'}}>Rachel Chen · Talent Lead, Grab</div>
                      <div style={{fontSize: '11px', color: 'var(--ink2)', lineHeight: '1.55'}} id="hcMsg"></div>
                    </div>
                  </div>
                </div>

              </div>{/* /trust-card */}
            </div>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <div className="stats-strip">
        <div className="stats-strip-inner">
          <div className="ss-item"><div className="ss-val">2,714</div><div className="ss-lbl">Verified Profiles</div></div>
          <div className="ss-item"><div className="ss-val">9 days</div><div className="ss-lbl">Avg to Shortlist</div></div>
          <div className="ss-item"><div className="ss-val">SGD 4–12k</div><div className="ss-lbl">Avg Salary Uplift</div></div>
          <div className="ss-item"><div className="ss-val">Blockchain</div><div className="ss-lbl">Verified Credentials</div></div>
          <div className="ss-item"><div className="ss-val">4.9★</div><div className="ss-lbl">User Rating</div></div>
        </div>
      </div>

      {/* TRUST GAP */}
      <section id="trust-gap">
        <div className="wrap">
          <div className="tg-eyebrow">The Trust Gap</div>
          <h2 className="tg-headline">95% of candidates filtered out<br /><span className="broken">before a human ever reads.</span></h2>
          <p className="tg-sub">Recruiters wade through 250–1,000 applications per role. Only 10% are qualified. Neither side wins — until now.</p>

          <div className="tg-grid">

            {/* CARD 1: Candidates */}
            <div className="tg-panel tg-c">
              <div className="tg-panel-title">
                <div className="tg-panel-ic">👤</div>For Candidates
              </div>
              {/* Pain */}
              <div className="tg-pain">
                <div className="tg-pain-item"><div className="tg-pain-x">✕</div>AI-generated resumes look identical</div>
                <div className="tg-pain-item"><div className="tg-pain-x">✕</div>No replies from applications</div>
                <div className="tg-pain-item"><div className="tg-pain-x">✕</div>No verified proof of skill</div>
                <div className="tg-pain-item"><div className="tg-pain-x">✕</div>Invisible to the right recruiters</div>
              </div>
              {/* Divider + fix */}
              <div className="tg-divider"></div>
              <div className="tg-fix-label">CareerAiHub fixes this</div>
              <div className="tg-fix">
                <div className="tg-fix-item"><div className="tg-fix-check">✓</div>ATS-optimised resume in 90 seconds</div>
                <div className="tg-fix-item"><div className="tg-fix-check">✓</div>Blockchain-verified credential proof</div>
                <div className="tg-fix-item"><div className="tg-fix-check">✓</div>TrustMatch surfaces you to recruiters</div>
                <div className="tg-fix-item"><div className="tg-fix-check">✓</div>AI coaching before every interview</div>
              </div>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '12px'}}>
                <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '7px', padding: '2px 6px', borderRadius: '20px', background: 'rgba(30,201,138,.07)', color: 'var(--c1)', border: '1px solid rgba(30,201,138,.18)'}}>🇸🇬 Singpass</span>
                <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '7px', padding: '2px 6px', borderRadius: '20px', background: 'rgba(30,201,138,.07)', color: 'var(--c1)', border: '1px solid rgba(30,201,138,.18)'}}>🎓 OpenCerts</span>
                <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '7px', padding: '2px 6px', borderRadius: '20px', background: 'rgba(139,130,240,.07)', color: 'var(--c2)', border: '1px solid rgba(139,130,240,.18)'}}>🏅 Credly</span>
                <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '7px', padding: '2px 6px', borderRadius: '20px', background: 'rgba(99,102,241,.07)', color: 'var(--g1)', border: '1px solid rgba(99,102,241,.18)'}}>⚖️ MOM COMPASS</span>
              </div>
            </div>

            {/* BRIDGE: animated logo */}
            <div className="tg-center">
              <div className="tg-logo-bridge">
                <svg width="64" height="64" viewBox="0 0 100 100" fill="none" className="tg-orbit-svg">
                  <defs>
                    <linearGradient id="tg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366F1"/>
                      <stop offset="55%" stopColor="#EC4899"/>
                      <stop offset="100%" stopColor="#F59E0B"/>
                    </linearGradient>
                    <path id="tg-path" d="M 8 50 a 42 18 0 1 0 84 0 a 42 18 0 1 0 -84 0 Z"/>
                  </defs>
                  <g style={{transformOrigin: '50px 50px', animation: 'orbit-spin-cw 16s linear infinite'}}>
                    <ellipse cx="50" cy="50" rx="42" ry="18" transform="rotate(-28 50 50)" stroke="url(#tg-grad)" strokeWidth="2" fill="none" opacity="0.35"/>
                  </g>
                  <g style={{transformOrigin: '50px 50px', animation: 'orbit-spin-ccw 16s linear infinite'}}>
                    <ellipse cx="50" cy="50" rx="42" ry="18" transform="rotate(28 50 50)" stroke="url(#tg-grad)" strokeWidth="2" fill="none" opacity="0.35"/>
                  </g>
                  <circle cx="50" cy="50" r="13" fill="url(#tg-grad)"/>
                  <g transform="rotate(-28 50 50)">
                    <circle r="4.5" fill="url(#tg-grad)"><animateMotion dur="16s" repeatCount="indefinite"><mpath href="#tg-path"/></animateMotion></circle>
                    <circle r="3.5" fill="url(#tg-grad)"><animateMotion dur="16s" repeatCount="indefinite" begin="-7s"><mpath href="#tg-path"/></animateMotion></circle>
                  </g>
                  <g transform="rotate(28 50 50)">
                    <circle r="4" fill="url(#tg-grad)"><animateMotion dur="16s" repeatCount="indefinite" begin="-3s"><mpath href="#tg-path"/></animateMotion></circle>
                  </g>
                </svg>
                <div className="tg-bridge-text">CareerAiHub<span>closes the gap</span></div>
              </div>
            </div>

            {/* CARD 2: Recruiters */}
            <div className="tg-panel tg-r">
              <div className="tg-panel-title">
                <div className="tg-panel-ic">🏢</div>For Recruiters
              </div>
              {/* Pain */}
              <div className="tg-pain">
                <div className="tg-pain-item"><div className="tg-pain-x">✕</div>Too many irrelevant applications</div>
                <div className="tg-pain-item"><div className="tg-pain-x">✕</div>Fake experience is everywhere</div>
                <div className="tg-pain-item"><div className="tg-pain-x">✕</div>Difficult screening &amp; verification</div>
                <div className="tg-pain-item"><div className="tg-pain-x">✕</div>Hiring decisions feel uncertain</div>
              </div>
              {/* Divider + fix */}
              <div className="tg-divider"></div>
              <div className="tg-fix-label">CareerAiHub fixes this</div>
              <div className="tg-fix">
                <div className="tg-fix-item"><div className="tg-fix-check">✓</div>Verified-only candidate pool</div>
                <div className="tg-fix-item"><div className="tg-fix-check">✓</div>Verification Clarity Score replaces guesswork</div>
                <div className="tg-fix-item"><div className="tg-fix-check">✓</div>95% match engine — ranked shortlists</div>
                <div className="tg-fix-item"><div className="tg-fix-check">✓</div>0% fake credentials, blockchain-anchored</div>
              </div>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '12px'}}>
                <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '7px', padding: '2px 6px', borderRadius: '20px', background: 'rgba(30,201,138,.07)', color: 'var(--c1)', border: '1px solid rgba(30,201,138,.18)'}}>🇸🇬 Singpass</span>
                <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '7px', padding: '2px 6px', borderRadius: '20px', background: 'rgba(30,201,138,.07)', color: 'var(--c1)', border: '1px solid rgba(30,201,138,.18)'}}>🎓 OpenCerts</span>
                <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '7px', padding: '2px 6px', borderRadius: '20px', background: 'rgba(139,130,240,.07)', color: 'var(--c2)', border: '1px solid rgba(139,130,240,.18)'}}>🏅 Credly</span>
                <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '7px', padding: '2px 6px', borderRadius: '20px', background: 'rgba(99,102,241,.07)', color: 'var(--g1)', border: '1px solid rgba(99,102,241,.18)'}}>⚖️ MOM COMPASS</span>
              </div>
            </div>

          </div>
        </div>
      </section>
      <section id="howitworks" style={{padding: '100px 0', position: 'relative', overflow: 'hidden', background: 'var(--bg2)', borderTop: '1px solid var(--border)'}}>
        <div style={{position: 'absolute', inset: '0', background: 'radial-gradient(ellipse 60% 50% at 50% 50%,rgba(99,102,241,.04),transparent 70%)', pointerEvents: 'none'}}></div>
        <div className="wrap">

          {/* Header */}
          <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '9px', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--c1)', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '14px'}}>
            <span style={{width: '24px', height: '1px', background: 'rgba(30,201,138,.3)', display: 'block'}}></span>How It Works<span style={{width: '24px', height: '1px', background: 'rgba(30,201,138,.3)', display: 'block'}}></span>
          </div>
          <h2 style={{fontFamily: '\'Instrument Serif\',serif', fontSize: 'clamp(30px,3.8vw,52px)', lineHeight: '1.06', letterSpacing: '-1.5px', textAlign: 'center', marginBottom: '8px'}}>One system. <span style={{background: 'var(--grad)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Three stages.</span> From invisible to <em style={{color: 'var(--c1)'}}>verified.</em></h2>
          <p style={{textAlign: 'center', fontSize: '13px', color: 'var(--ink2)', marginBottom: '48px', fontWeight: '300', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto'}}>Build your identity. Verify your credentials. Improve your readiness. Get matched to the right roles.</p>

          {/* 4-step horizontal cards */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0', background: 'var(--surf)', border: '1px solid var(--border2)', borderRadius: '18px', overflow: 'hidden'}}>

            {/* CARD 1: BUILD */}
            <div style={{padding: '28px 24px', borderRight: '1px solid var(--border)', transition: 'background .2s', display: 'flex', flexDirection: 'column'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px'}}>
                <div style={{fontSize: '20px'}}>✍️</div>
                <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '8px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--c1)', fontWeight: '600'}}>Build</div>
              </div>
              <div style={{fontSize: '13px', fontWeight: '700', color: 'var(--ink)', marginBottom: '6px', lineHeight: '1.3'}}>Create a career identity recruiters can actually understand.</div>
              <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '8px', color: 'var(--ink3)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '10px'}}>AI resume builder · ATS optimisation · Cover letter gen</div>
              <div style={{fontSize: '11.5px', color: 'var(--ink2)', lineHeight: '1.7', fontWeight: '300', marginBottom: '16px', flex: '1'}}>Paste a job description. AI injects exact keywords, rewrites weak bullets, and generates a personalised cover letter. Done in 90 seconds.</div>
              <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '9px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(30,201,138,.07)', color: 'var(--c1)', border: '1px solid rgba(30,201,138,.2)', alignSelf: 'flex-start'}}>38 → 91 ATS score</span>
            </div>

            {/* CARD 2: VERIFY */}
            <div style={{padding: '28px 24px', borderRight: '1px solid var(--border)', transition: 'background .2s', display: 'flex', flexDirection: 'column'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px'}}>
                <div style={{fontSize: '20px'}}>🛡️</div>
                <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '8px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--c2)', fontWeight: '600'}}>Verify</div>
              </div>
              <div style={{fontSize: '13px', fontWeight: '700', color: 'var(--ink)', marginBottom: '6px', lineHeight: '1.3'}}>Turn your resume into verified proof of capability.</div>
              <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '8px', color: 'var(--ink3)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '10px'}}>Degree verify · Skills verify · Work verify · On-chain</div>
              <div style={{fontSize: '11.5px', color: 'var(--ink2)', lineHeight: '1.7', fontWeight: '300', marginBottom: '14px', flex: '1'}}>Connect Singpass, OpenCerts, or Credly. Every credential is cryptographically hashed on-chain — tamper-proof, instantly verifiable by recruiters. Done in under 4 minutes.</div>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px'}}>
                <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '7.5px', padding: '3px 8px', borderRadius: '20px', background: 'rgba(30,201,138,.07)', color: 'var(--c1)', border: '1px solid rgba(30,201,138,.2)'}}>🇸🇬 Singpass</span>
                <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '7.5px', padding: '3px 8px', borderRadius: '20px', background: 'rgba(30,201,138,.07)', color: 'var(--c1)', border: '1px solid rgba(30,201,138,.2)'}}>🎓 OpenCerts</span>
                <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '7.5px', padding: '3px 8px', borderRadius: '20px', background: 'rgba(139,130,240,.07)', color: 'var(--c2)', border: '1px solid rgba(139,130,240,.2)'}}>🏅 Credly</span>
                <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '7.5px', padding: '3px 8px', borderRadius: '20px', background: 'rgba(99,102,241,.07)', color: 'var(--g1)', border: '1px solid rgba(99,102,241,.2)'}}>⚖️ MOM COMPASS</span>
              </div>
              <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '9px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(139,130,240,.07)', color: 'var(--c2)', border: '1px solid rgba(139,130,240,.2)', alignSelf: 'flex-start'}}>≤ 4 min · blockchain-anchored</span>
            </div>

            {/* CARD 3: IMPROVE */}
            <div style={{padding: '28px 24px', borderRight: '1px solid var(--border)', transition: 'background .2s', display: 'flex', flexDirection: 'column'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px'}}>
                <div style={{fontSize: '20px'}}>📈</div>
                <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '8px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--c3)', fontWeight: '600'}}>Improve</div>
              </div>
              <div style={{fontSize: '13px', fontWeight: '700', color: 'var(--ink)', marginBottom: '6px', lineHeight: '1.3'}}>Train with AI pressure before the real interview.</div>
              <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '8px', color: 'var(--ink3)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '10px'}}>HM Simulator · STAR Builder · Salary Coach · Readiness scoring</div>
              <div style={{fontSize: '11.5px', color: 'var(--ink2)', lineHeight: '1.7', fontWeight: '300', marginBottom: '14px', flex: '1'}}>AI hiring manager runs pressure rounds, targets your weakest dimension first, and scores your readiness. Don't walk in below 88/100.</div>
              {/* 4 dimension pills */}
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px'}}>
                <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '7.5px', padding: '3px 8px', borderRadius: '20px', background: 'rgba(240,168,50,.07)', color: 'var(--c3)', border: '1px solid rgba(240,168,50,.2)'}}>HM Simulator</span>
                <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '7.5px', padding: '3px 8px', borderRadius: '20px', background: 'rgba(240,168,50,.07)', color: 'var(--c3)', border: '1px solid rgba(240,168,50,.2)'}}>STAR Builder</span>
                <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '7.5px', padding: '3px 8px', borderRadius: '20px', background: 'rgba(240,168,50,.07)', color: 'var(--c3)', border: '1px solid rgba(240,168,50,.2)'}}>Salary Coach</span>
                <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '7.5px', padding: '3px 8px', borderRadius: '20px', background: 'rgba(240,168,50,.07)', color: 'var(--c3)', border: '1px solid rgba(240,168,50,.2)'}}>Readiness scoring</span>
              </div>
              <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '9px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(240,168,50,.07)', color: 'var(--c3)', border: '1px solid rgba(240,168,50,.2)', alignSelf: 'flex-start'}}>88/100 readiness target</span>
            </div>

            {/* CARD 4: GET MATCHED */}
            <div style={{padding: '28px 24px', transition: 'background .2s', display: 'flex', flexDirection: 'column'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px'}}>
                <div style={{fontSize: '20px'}}>🎯</div>
                <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '8px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--c4)', fontWeight: '600'}}>Get Matched</div>
              </div>
              <div style={{fontSize: '13px', fontWeight: '700', color: 'var(--ink)', marginBottom: '6px', lineHeight: '1.3'}}>Stop applying cold. Let verified roles find you.</div>
              <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '8px', color: 'var(--ink3)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '10px'}}>TrustMatch marketplace · TrustChat · VCS unlock</div>
              <div style={{fontSize: '11.5px', color: 'var(--ink2)', lineHeight: '1.7', fontWeight: '300', marginBottom: '14px', flex: '1'}}>Verification Clarity Score 80+ unlocks TrustMatch. Recruiters see your full verified proof before the first message — no cold applying, no black hole.</div>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px'}}>
                <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '7.5px', padding: '3px 8px', borderRadius: '20px', background: 'rgba(30,201,138,.07)', color: 'var(--c1)', border: '1px solid rgba(30,201,138,.2)'}}>🇸🇬 Singpass</span>
                <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '7.5px', padding: '3px 8px', borderRadius: '20px', background: 'rgba(30,201,138,.07)', color: 'var(--c1)', border: '1px solid rgba(30,201,138,.2)'}}>🎓 OpenCerts</span>
                <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '7.5px', padding: '3px 8px', borderRadius: '20px', background: 'rgba(139,130,240,.07)', color: 'var(--c2)', border: '1px solid rgba(139,130,240,.2)'}}>🏅 Credly</span>
                <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '7.5px', padding: '3px 8px', borderRadius: '20px', background: 'rgba(99,102,241,.07)', color: 'var(--g1)', border: '1px solid rgba(99,102,241,.2)'}}>⚖️ MOM COMPASS</span>
              </div>
              <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '9px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(232,92,128,.07)', color: 'var(--c4)', border: '1px solid rgba(232,92,128,.2)', alignSelf: 'flex-start'}}>avg 9 days to shortlist</span>
            </div>

          </div>

          {/* Stats strip + CTA */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', background: 'var(--surf)', border: '1px solid var(--border2)', borderRadius: '14px', overflow: 'hidden', maxWidth: '780px', margin: '28px auto 32px'}}>
            <div style={{padding: '16px 20px', textAlign: 'center', borderRight: '1px solid var(--border)'}}><div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '19px', fontWeight: '700', color: 'var(--ink)', marginBottom: '3px'}}>2,714</div><div style={{fontSize: '8px', color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: '\'DM Mono\',monospace'}}>Verified profiles</div></div>
            <div style={{padding: '16px 20px', textAlign: 'center', borderRight: '1px solid var(--border)'}}><div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '19px', fontWeight: '700', color: 'var(--ink)', marginBottom: '3px'}}>9 days</div><div style={{fontSize: '8px', color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: '\'DM Mono\',monospace'}}>Avg to shortlist</div></div>
            <div style={{padding: '16px 20px', textAlign: 'center', borderRight: '1px solid var(--border)'}}><div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '19px', fontWeight: '700', color: 'var(--ink)', marginBottom: '3px'}}>+SGD 8k</div><div style={{fontSize: '8px', color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: '\'DM Mono\',monospace'}}>Avg salary uplift</div></div>
            <div style={{padding: '16px 20px', textAlign: 'center'}}><div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '19px', fontWeight: '700', color: 'var(--ink)', marginBottom: '3px'}}>0%</div><div style={{fontSize: '8px', color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: '\'DM Mono\',monospace'}}>Fake credentials</div></div>
          </div>

          <p style={{textAlign: 'center', fontSize: '12px', color: 'var(--ink3)', fontFamily: '\'DM Mono\',monospace', letterSpacing: '.04em', marginBottom: '32px'}}>✦ AI Memory Flywheel — every session teaches our models more about you, so coaching, matching, and scoring get sharper over time.</p>

          <div style={{textAlign: 'center'}}>
            <button style={{display: 'inline-flex', alignItems: 'center', gap: '9px', background: 'var(--grad)', color: '#fff', padding: '14px 30px', borderRadius: '100px', fontSize: '14px', fontWeight: '600', textDecoration: 'none', boxShadow: '0 0 36px rgba(99,102,241,.3)'}} onClick={() => setAuthModal("register")}>Get Early Access →</button>
          </div>

        </div>
      </section>
      <div className="snav-wrap">
        <nav className="snav" id="snav">
          <div className="snav-track"></div>
          <div className="snav-fill" id="snavFill"></div>
          <a className="sni s1 active" href="#s1"><div className="sni-dot">·</div><span className="sni-lbl">Get Seen</span></a>
          <a className="sni s2" href="#s2"><div className="sni-dot">·</div><span className="sni-lbl">Get Ready</span></a>
          <a className="sni s3" href="#s3"><div className="sni-dot">·</div><span className="sni-lbl">Get Matched</span></a>
        </nav>
      </div>

      {/* STAGES */}
      <div className="stages">

      {/* S1 */}
      <section className="stage terminal s1" id="s1" data-si="0">
        <div className="wrap">
          <div className="stage-grid">
            <div className="scopy">
              <div className="stage-badge terminal"><span className="badge-dot"></span>ATS · Data Engine</div>
              <div className="stag-num">Get seen</div>
              <h2>You find out in 90 seconds <span className="hl">exactly why you're not getting callbacks.</span></h2>
              <p className="stage-sub">95% of resumes are filtered by a bot before a human sees them — you get a precise diagnosis, then your resume fixes itself.</p>
              <p className="pain">"40 applications. 2 callbacks. I didn't know the bot was the problem."</p>
              <div className="outcome">↑ 38 → 91 ATS score · your resume, rebuilt in 90 sec</div>
              <button className="ats-soft-btn" onClick={() => fnRef.current.openATSDemo?.()}>⚡ See live ATS demo</button>
            </div>
            <div className="scard">
              <div className="deck-wrap">
                <div className="deck-steps" id="ds0"></div>
                <div className="deck-stack h-stack" id="dk0"></div>
                <div className="deck-progress" id="dh0">
                <div className="deck-progress-track" id="dptrack0"><div className="deck-progress-fill" id="dpfill0"></div></div>
                <div className="deck-progress-label"><span id="dplbl0">Step 1 / 3</span><span>click card or use arrows</span></div>
                <div className="deck-nav-btns">
                  <button className="deck-nav-btn" id="dprev0">←</button>
                  <button className="deck-nav-btn" id="dnext0">→</button>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* S2 */}
      <section className="stage human s2" id="s2" data-si="1">
        <div className="wrap">
          <div className="stage-grid">
            <div className="scopy">
              <div className="stage-badge human"><span className="badge-dot"></span>Interview · AI Coach</div>
              <div className="stag-num">Get ready</div>
              <h2>You find out your weakest interview dimension — <span className="hl">and fix it before you walk in.</span></h2>
              <p className="stage-sub">AI targets your weakest dimension first, scores every answer, and won't let you walk in below 88/100.</p>
              <p className="pain">"I knew the role cold. Blanked on the one question that mattered."</p>
              <div className="outcome">↑ 88/100 readiness · salary script unlocks at 75</div>
            </div>
            <div className="scard">
              <div className="deck-wrap">
                <div className="deck-steps" id="ds1"></div>
                <div className="deck-stack v-stack" id="dk1"></div>
                <div className="deck-progress" id="dh1">
                <div className="deck-progress-track" id="dptrack1"><div className="deck-progress-fill" id="dpfill1"></div></div>
                <div className="deck-progress-label"><span id="dplbl1">Step 1 / 4</span><span>click card or use arrows</span></div>
                <div className="deck-nav-btns">
                  <button className="deck-nav-btn" id="dprev1">←</button>
                  <button className="deck-nav-btn" id="dnext1">→</button>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* S4 (now S3) */}
      <section className="stage human s4" id="s3" data-si="2">
        <div className="wrap">
          <div className="stage-grid">
            <div className="scopy">
              <div className="stage-badge s4"><span className="badge-dot"></span>TrustMatch · AI Market</div>
              <div className="stag-num">Get matched</div>
              <h2>Recruiters who match your brief <span className="hl">find you — you don't apply to them.</span></h2>
              <p className="stage-sub">Verify once — Singpass, Credly, university — and recruiters who match your brief find you in an average of 9 days.</p>
              <p className="pain">"60 applications. 3 callbacks. I was invisible — not unqualified."</p>
              <div className="outcome">↑ avg 9 days to shortlist · 4 min to first recruiter ping</div>
            </div>
            <div className="scard">
              <div className="deck-wrap">
                <div className="deck-steps" id="ds2"></div>
                <div className="deck-stack v-stack" id="dk2"></div>
                <div className="deck-progress" id="dh2">
                <div className="deck-progress-track" id="dptrack2"><div className="deck-progress-fill" id="dpfill2"></div></div>
                <div className="deck-progress-label"><span id="dplbl2">Step 1 / 4</span><span>click card or use arrows</span></div>
                <div className="deck-nav-btns">
                  <button className="deck-nav-btn" id="dprev2">←</button>
                  <button className="deck-nav-btn" id="dnext2">→</button>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>

      {/* LOGOS SECTION REMOVED: unverified partner logos —>

      <!-- ═══════════════════════════════════════════════ */}
      {/* PRICING */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="pricing" style={{padding: '100px 0', position: 'relative', overflow: 'hidden'}}>
        <div style={{position: 'absolute', inset: '0', background: 'radial-gradient(ellipse 60% 50% at 50% 50%,rgba(99,102,241,.04),transparent 70%)', pointerEvents: 'none'}}></div>
        <div className="wrap">
          <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '9px', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--g1)', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '16px'}}>
            <span style={{width: '24px', height: '1px', background: 'rgba(99,102,241,.3)', display: 'block'}}></span>Pricing<span style={{width: '24px', height: '1px', background: 'rgba(99,102,241,.3)', display: 'block'}}></span>
          </div>
          <h2 style={{fontFamily: '\'Instrument Serif\',serif', fontSize: 'clamp(32px,4vw,52px)', lineHeight: '1.08', letterSpacing: '-1.5px', textAlign: 'center', marginBottom: '8px'}}>Free to start. <span style={{background: 'var(--grad)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Proven to pay off.</span></h2>
          <p style={{textAlign: 'center', fontSize: '13px', color: 'var(--ink2)', marginBottom: '52px', fontWeight: '300'}}>Try everything free. Upgrade when you're ready to be found.</p>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px', maxWidth: '920px', margin: '0 auto'}}>

            {/* Free */}
            <div style={{background: 'var(--surf)', border: '1px solid var(--border2)', borderRadius: '16px', padding: '28px', position: 'relative'}}>
              <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: '16px'}}>Candidate · Free</div>
              <div style={{fontFamily: '\'Instrument Serif\',serif', fontSize: '42px', lineHeight: '1', color: 'var(--ink)', marginBottom: '4px'}}>$0</div>
              <div style={{fontSize: '11px', color: 'var(--ink3)', marginBottom: '24px'}}>Free forever · no card required</div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '28px'}}>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--ink2)'}}><span style={{color: 'var(--c1)', fontSize: '11px', marginTop: '1px'}}>✓</span><span><strong style={{color: 'var(--ink)', fontWeight: '500'}}>2 resume scans</strong> + ATS fixes with keyword injection</span></div>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--ink2)'}}><span style={{color: 'var(--c1)', fontSize: '11px', marginTop: '1px'}}>✓</span><span>JD gap analysis — missing keywords, instant</span></div>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--ink2)'}}><span style={{color: 'var(--c1)', fontSize: '11px', marginTop: '1px'}}>✓</span><span>1 AI cover letter generation</span></div>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--ink2)'}}><span style={{color: 'var(--c1)', fontSize: '11px', marginTop: '1px'}}>✓</span><span>3 AI interview prep sessions</span></div>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--ink2)'}}><span style={{color: 'var(--c1)', fontSize: '11px', marginTop: '1px'}}>✓</span><span>Basic Verification Clarity Score</span></div>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--ink2)'}}><span style={{color: 'var(--c1)', fontSize: '11px', marginTop: '1px'}}>✓</span><span><strong style={{color: 'var(--ink)', fontWeight: '500'}}>AI Memory Dashboard</strong> — basic career profile</span></div>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--ink3)'}}><span style={{color: 'var(--ink3)', fontSize: '11px', marginTop: '1px'}}>—</span><span>TrustMatch marketplace</span></div>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--ink3)'}}><span style={{color: 'var(--ink3)', fontSize: '11px', marginTop: '1px'}}>—</span><span>Salary coach</span></div>
              </div>
              <button style={{display: 'block', textAlign: 'center', padding: '11px', borderRadius: '100px', border: '1px solid var(--border2)', fontSize: '13px', fontWeight: '600', color: 'var(--ink2)', textDecoration: 'none', transition: 'all .2s'}} onClick={() => setAuthModal("register")}>Get started free</button>
            </div>

            {/* Pro */}
            <div style={{background: 'var(--surf)', border: '1px solid rgba(99,102,241,.35)', borderRadius: '16px', padding: '28px', position: 'relative', boxShadow: '0 0 48px rgba(99,102,241,.1)'}}>
              <div style={{position: 'absolute', top: '0', left: '0', right: '0', height: '2px', background: 'var(--grad)', borderRadius: '16px 16px 0 0'}}></div>
              <div style={{position: 'absolute', top: '16px', right: '16px', fontFamily: '\'DM Mono\',monospace', fontSize: '8px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(99,102,241,.1)', color: 'var(--g1)', border: '1px solid rgba(99,102,241,.25)'}}>Most popular</div>
              <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--g1)', marginBottom: '16px'}}>Candidate · Pro</div>
              {/* Trial offer */}
              <div style={{background: 'rgba(99,102,241,.07)', border: '1px solid rgba(99,102,241,.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px'}}>
                <div style={{fontSize: '12px', fontWeight: '600', color: 'var(--g1)', marginBottom: '2px'}}>🎯 Try free for 7 days</div>
                <div style={{fontSize: '11px', color: 'var(--ink2)', fontWeight: '300'}}>SGD 8.99 for 7 days — full access. Then <strong style={{color: 'var(--ink)', fontWeight: '500'}}>SGD 21/month</strong>, billed automatically. Cancel anytime.</div>
              </div>
              <div style={{fontFamily: '\'Instrument Serif\',serif', fontSize: '42px', lineHeight: '1', color: 'var(--ink)', marginBottom: '4px'}}>SGD 21<span style={{fontSize: '18px', color: 'var(--ink2)'}}>/mo</span></div>
              <div style={{fontSize: '11px', color: 'var(--ink3)', marginBottom: '24px'}}>After trial · cancel anytime</div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '28px'}}>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--ink2)'}}><span style={{color: 'var(--c1)', fontSize: '11px', marginTop: '1px'}}>✓</span><span>Everything in Free</span></div>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--ink2)'}}><span style={{color: 'var(--c1)', fontSize: '11px', marginTop: '1px'}}>✓</span><span><strong style={{color: 'var(--ink)', fontWeight: '500'}}>Unlimited</strong> resume scans + fixes</span></div>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--ink2)'}}><span style={{color: 'var(--c1)', fontSize: '11px', marginTop: '1px'}}>✓</span><span>Unlimited AI cover letters</span></div>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--ink2)'}}><span style={{color: 'var(--c1)', fontSize: '11px', marginTop: '1px'}}>✓</span><span>Unlimited verifications (Singpass, Credly, OpenCerts)</span></div>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--ink2)'}}><span style={{color: 'var(--c1)', fontSize: '11px', marginTop: '1px'}}>✓</span><span>TrustMatch marketplace — be discovered by recruiters</span></div>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--ink2)'}}><span style={{color: 'var(--c1)', fontSize: '11px', marginTop: '1px'}}>✓</span><span>Salary coach + P75 counter scripts</span></div>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--ink2)'}}><span style={{color: 'var(--c1)', fontSize: '11px', marginTop: '1px'}}>✓</span><span>HM Simulator · all 4 personas</span></div>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--ink2)'}}><span style={{color: 'var(--c1)', fontSize: '11px', marginTop: '1px'}}>✓</span><span><strong style={{color: 'var(--ink)', fontWeight: '500'}}>AI Memory Dashboard</strong> — full adaptive profile</span></div>
              </div>
              <button style={{display: 'block', textAlign: 'center', padding: '11px', borderRadius: '100px', background: 'var(--grad)', fontSize: '13px', fontWeight: '600', color: '#fff', textDecoration: 'none', boxShadow: '0 0 24px rgba(99,102,241,.3)', transition: 'all .2s'}} onClick={() => setAuthModal("register")}>Start 7-day trial — SGD 8.99 →</button>
            </div>

            {/* Recruiter — no price shown */}
            <div style={{background: 'var(--surf)', border: '1px solid var(--border2)', borderRadius: '16px', padding: '28px', position: 'relative'}}>
              <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--c4)', marginBottom: '16px'}}>Recruiter · Team</div>
              <div style={{fontFamily: '\'Instrument Serif\',serif', fontSize: '32px', lineHeight: '1.1', color: 'var(--ink)', marginBottom: '4px'}}>Custom pricing</div>
              <div style={{fontSize: '11px', color: 'var(--ink3)', marginBottom: '24px'}}>Per seat · billed annually · contact us</div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '28px'}}>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--ink2)'}}><span style={{color: 'var(--c1)', fontSize: '11px', marginTop: '1px'}}>✓</span><span>Access full verified candidate pool</span></div>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--ink2)'}}><span style={{color: 'var(--c1)', fontSize: '11px', marginTop: '1px'}}>✓</span><span>TrustMatch + TrustChat — message verified candidates directly</span></div>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--ink2)'}}><span style={{color: 'var(--c1)', fontSize: '11px', marginTop: '1px'}}>✓</span><span>AI-ranked shortlists in minutes, not hours</span></div>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--ink2)'}}><span style={{color: 'var(--c1)', fontSize: '11px', marginTop: '1px'}}>✓</span><span>Zero fake credentials — blockchain-verified only</span></div>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--ink2)'}}><span style={{color: 'var(--c1)', fontSize: '11px', marginTop: '1px'}}>✓</span><span>ATS &amp; HRIS integration</span></div>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--ink2)'}}><span style={{color: 'var(--c1)', fontSize: '11px', marginTop: '1px'}}>✓</span><span>Dedicated customer success manager</span></div>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--ink2)'}}><span style={{color: 'var(--c1)', fontSize: '11px', marginTop: '1px'}}>✓</span><span>Analytics dashboard + hiring pipeline insights</span></div>
              </div>
              <a href="mailto:recruiters@careeraihub.com" style={{display: 'block', textAlign: 'center', padding: '11px', borderRadius: '100px', border: '1px solid rgba(232,92,128,.35)', fontSize: '13px', fontWeight: '600', color: 'var(--c4)', textDecoration: 'none', transition: 'all .2s'}}>Request recruiter access →</a>
            </div>

          </div>
          <p style={{textAlign: 'center', fontSize: '11px', color: 'var(--ink3)', marginTop: '24px', fontFamily: '\'DM Mono\',monospace'}}>No contracts. No hidden fees. Cancel anytime.</p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* TESTIMONIALS / FEEDBACK */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="testimonials" style={{padding: '72px 0', background: 'var(--bg2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', overflow: 'hidden'}}>
        <div className="wrap">
          <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '9px', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--c2)', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '12px'}}>
            <span style={{width: '24px', height: '1px', background: 'rgba(139,130,240,.3)', display: 'block'}}></span>Early users<span style={{width: '24px', height: '1px', background: 'rgba(139,130,240,.3)', display: 'block'}}></span>
          </div>
          <h2 style={{fontFamily: '\'Instrument Serif\',serif', fontSize: 'clamp(24px,3vw,38px)', lineHeight: '1.1', letterSpacing: '-1px', textAlign: 'center', marginBottom: '36px'}}>What early access users are saying</h2>
        </div>
        {/* Horizontal scroll row — no wrap */}
        <div style={{display: 'flex', gap: '16px', overflowX: 'auto', padding: '4px 48px 16px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch'}} id="testimRow">
    

          <div style={{background: 'var(--surf)', border: '1px solid var(--border2)', borderRadius: '14px', padding: '20px', minWidth: '280px', maxWidth: '280px', flexShrink: '0'}}>
            <div style={{color: 'var(--g1)', fontSize: '12px', marginBottom: '12px'}}>★★★★★</div>
            <p style={{fontSize: '12.5px', color: 'var(--ink2)', lineHeight: '1.7', marginBottom: '16px', fontWeight: '300'}}>"First verified match led to an interview in 11 days. The Verification Clarity Score made me feel real to recruiters."</p>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <div style={{width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(99,102,241,.15)', border: '1px solid rgba(99,102,241,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '700', color: 'var(--g1)', flexShrink: '0'}}>PM</div>
              <div><div style={{fontSize: '11.5px', fontWeight: '600', color: 'var(--ink)'}}>Priya M.</div><div style={{fontSize: '9.5px', color: 'var(--ink3)'}}>Senior AI Engineer · SG</div><div style={{fontSize: '8.5px', color: 'var(--c1)', fontFamily: '\'DM Mono\',monospace', marginTop: '2px'}}>✓ VCS 88/100</div></div>
            </div>
          </div>

          <div style={{background: 'var(--surf)', border: '1px solid var(--border2)', borderRadius: '14px', padding: '20px', minWidth: '280px', maxWidth: '280px', flexShrink: '0'}}>
            <div style={{color: 'var(--g1)', fontSize: '12px', marginBottom: '12px'}}>★★★★★</div>
            <p style={{fontSize: '12.5px', color: 'var(--ink2)', lineHeight: '1.7', marginBottom: '16px', fontWeight: '300'}}>"ATS score went from 38 to 91 in under two minutes. Within a week I had three interviews lined up."</p>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <div style={{width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '700', color: 'var(--g1)', flexShrink: '0'}}>AT</div>
              <div><div style={{fontSize: '11.5px', fontWeight: '600', color: 'var(--ink)'}}>Alex T.</div><div style={{fontSize: '9.5px', color: 'var(--ink3)'}}>Software Engineer · 3 YOE</div><div style={{fontSize: '8.5px', color: 'var(--c1)', fontFamily: '\'DM Mono\',monospace', marginTop: '2px'}}>✓ ATS 91%</div></div>
            </div>
          </div>

          <div style={{background: 'var(--surf)', border: '1px solid var(--border2)', borderRadius: '14px', padding: '20px', minWidth: '280px', maxWidth: '280px', flexShrink: '0'}}>
            <div style={{color: 'var(--c1)', fontSize: '12px', marginBottom: '12px'}}>★★★★★</div>
            <p style={{fontSize: '12.5px', color: 'var(--ink2)', lineHeight: '1.7', marginBottom: '16px', fontWeight: '300'}}>"The verified shortlist is a game-changer. The first 10 TrustMatch results beat my best manual screen."</p>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <div style={{width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(30,201,138,.1)', border: '1px solid rgba(30,201,138,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '700', color: 'var(--c1)', flexShrink: '0'}}>RC</div>
              <div><div style={{fontSize: '11.5px', fontWeight: '600', color: 'var(--ink)'}}>Rachel C.</div><div style={{fontSize: '9.5px', color: 'var(--ink3)'}}>Talent Lead · Grab</div><div style={{fontSize: '8.5px', color: 'var(--c1)', fontFamily: '\'DM Mono\',monospace', marginTop: '2px'}}>✓ Verified Recruiter</div></div>
            </div>
          </div>

          <div style={{background: 'var(--surf)', border: '1px solid var(--border2)', borderRadius: '14px', padding: '20px', minWidth: '280px', maxWidth: '280px', flexShrink: '0'}}>
            <div style={{color: 'var(--c3)', fontSize: '12px', marginBottom: '12px'}}>★★★★★</div>
            <p style={{fontSize: '12.5px', color: 'var(--ink2)', lineHeight: '1.7', marginBottom: '16px', fontWeight: '300'}}>"NUS and Credly badge both instantly verified. Recruiters saw my proof before we spoke. Offer in 9 days."</p>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <div style={{width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(240,168,50,.12)', border: '1px solid rgba(240,168,50,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '700', color: 'var(--c3)', flexShrink: '0'}}>ML</div>
              <div><div style={{fontSize: '11.5px', fontWeight: '600', color: 'var(--ink)'}}>Mei Lin C.</div><div style={{fontSize: '9.5px', color: 'var(--ink3)'}}>Data Analyst · NUS grad</div><div style={{fontSize: '8.5px', color: 'var(--c1)', fontFamily: '\'DM Mono\',monospace', marginTop: '2px'}}>✓ NUS · AWS · Singpass</div></div>
            </div>
          </div>

          <div style={{background: 'var(--surf)', border: '1px solid var(--border2)', borderRadius: '14px', padding: '20px', minWidth: '280px', maxWidth: '280px', flexShrink: '0'}}>
            <div style={{color: 'var(--c4)', fontSize: '12px', marginBottom: '12px'}}>★★★★★</div>
            <p style={{fontSize: '12.5px', color: 'var(--ink2)', lineHeight: '1.7', marginBottom: '16px', fontWeight: '300'}}>"The salary coach script got me SGD 9k above the offer. First time I negotiated without feeling like I was guessing."</p>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <div style={{width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(232,92,128,.12)', border: '1px solid rgba(232,92,128,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '700', color: 'var(--c4)', flexShrink: '0'}}>DK</div>
              <div><div style={{fontSize: '11.5px', fontWeight: '600', color: 'var(--ink)'}}>David K.</div><div style={{fontSize: '9.5px', color: 'var(--ink3)'}}>PM · Series B startup</div><div style={{fontSize: '8.5px', color: 'var(--c1)', fontFamily: '\'DM Mono\',monospace', marginTop: '2px'}}>↑ SGD 9k uplift</div></div>
            </div>
          </div>

        </div>
        <div style={{textAlign: 'center', marginTop: '20px'}}>
          <a href="mailto:feedback@careeraihub.com" style={{display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 20px', borderRadius: '100px', border: '1px solid var(--border2)', fontSize: '12.5px', color: 'var(--ink2)', textDecoration: 'none', fontFamily: '\'DM Sans\',sans-serif'}}>💬 Share your experience →</a>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* FAQ */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="faq" style={{padding: '80px 0', position: 'relative'}}>
        <div className="wrap" style={{maxWidth: '780px'}}>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '56px', alignItems: 'flex-start'}}>

            {/* Left: heading */}
            <div style={{position: 'sticky', top: '100px'}}>
              <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '9px', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--c3)', marginBottom: '14px'}}>FAQ</div>
              <h2 style={{fontFamily: '\'Instrument Serif\',serif', fontSize: 'clamp(26px,3.5vw,40px)', lineHeight: '1.12', letterSpacing: '-1px', marginBottom: '14px'}}>Questions,<br /><em style={{color: 'var(--c3)'}}>answered.</em></h2>
              <p style={{fontSize: '13px', color: 'var(--ink2)', lineHeight: '1.7', fontWeight: '300', marginBottom: '20px'}}>Everything you need to know before signing up.</p>
              <a href="mailto:hello@careeraihub.com" style={{fontSize: '12.5px', color: 'var(--g1)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px'}}>Still have questions? Email us →</a>
            </div>

            {/* Right: accordions */}
            <div>
              {/* 3 always-visible questions */}
              <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>

                <details style={{background: 'var(--surf)', border: '1px solid var(--border2)', borderRadius: '12px', padding: '18px 20px', cursor: 'pointer'}}>
                  <summary style={{fontSize: '13.5px', fontWeight: '600', color: 'var(--ink)', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px'}}>Is my data shared with recruiters without my consent?<span style={{fontSize: '16px', color: 'var(--ink3)', fontWeight: '300', flexShrink: '0'}}>+</span></summary>
                  <p style={{fontSize: '13px', color: 'var(--ink2)', lineHeight: '1.75', marginTop: '12px', fontWeight: '300'}}>No. You control exactly what's visible. Recruiters see only your Verification Clarity Score and the credential badges you choose to publish. Raw data, documents, or personal identifiers are never shared without your explicit opt-in. You can withdraw from the marketplace at any time.</p>
                </details>

                <details style={{background: 'var(--surf)', border: '1px solid var(--border2)', borderRadius: '12px', padding: '18px 20px', cursor: 'pointer'}}>
                  <summary style={{fontSize: '13.5px', fontWeight: '600', color: 'var(--ink)', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px'}}>How does credential verification work?<span style={{fontSize: '16px', color: 'var(--ink3)', fontWeight: '300', flexShrink: '0'}}>+</span></summary>
                  <p style={{fontSize: '13px', color: 'var(--ink2)', lineHeight: '1.75', marginTop: '12px', fontWeight: '300'}}>We connect directly to institutional sources — Singpass for identity, OpenCerts for academic credentials, Credly for professional certifications, and employer APIs for work history. Every check is real-time. Nothing is self-reported and we never store your raw documents.</p>
                </details>

                <details style={{background: 'var(--surf)', border: '1px solid var(--border2)', borderRadius: '12px', padding: '18px 20px', cursor: 'pointer'}}>
                  <summary style={{fontSize: '13.5px', fontWeight: '600', color: 'var(--ink)', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px'}}>How is CareerAiHub different from LinkedIn?<span style={{fontSize: '16px', color: 'var(--ink3)', fontWeight: '300', flexShrink: '0'}}>+</span></summary>
                  <p style={{fontSize: '13px', color: 'var(--ink2)', lineHeight: '1.75', marginTop: '12px', fontWeight: '300'}}>LinkedIn is a social network built on self-reported claims. Anyone can write anything. We're a trust infrastructure — every signal is verified against an external source. Recruiters don't need to guess; they see proof. We're also not ad-supported, so we have no incentive to show you irrelevant jobs.</p>
                </details>

              </div>

              {/* See more button */}
              <button onClick={(e) => fnRef.current.toggleFaqMore?.(e.currentTarget)} style={{display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid var(--border2)', color: 'var(--ink2)', padding: '10px 18px', borderRadius: '100px', fontSize: '12.5px', cursor: 'pointer', fontFamily: '\'DM Sans\',sans-serif', marginTop: '12px', transition: 'all .2s'}} id="faqMoreBtn">
                <span id="faqMoreBtnTxt">See more questions</span> <span id="faqMoreArrow" style={{transition: 'transform .3s'}}>↓</span>
              </button>

              {/* Hidden questions */}
              <div id="faqMore" style={{display: 'none', flexDirection: 'column', gap: '4px', marginTop: '4px', overflow: 'hidden'}}>

                <details style={{background: 'var(--surf)', border: '1px solid var(--border2)', borderRadius: '12px', padding: '18px 20px', cursor: 'pointer'}}>
                  <summary style={{fontSize: '13.5px', fontWeight: '600', color: 'var(--ink)', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px'}}>What is a Verification Clarity Score and how is it calculated?<span style={{fontSize: '16px', color: 'var(--ink3)', fontWeight: '300', flexShrink: '0'}}>+</span></summary>
                  <p style={{fontSize: '13px', color: 'var(--ink2)', lineHeight: '1.75', marginTop: '12px', fontWeight: '300'}}>Verification Clarity Score (VCS) is a 100-point facts-based index across four independently verified dimensions: identity verification (25%), credential depth (35%), platform activity (20%), and engagement signals (20%). All inputs are verified against external sources — every point is traceable to a verified source — no black-box algorithms, no self-reporting.</p>
                </details>

                <details style={{background: 'var(--surf)', border: '1px solid var(--border2)', borderRadius: '12px', padding: '18px 20px', cursor: 'pointer'}}>
                  <summary style={{fontSize: '13.5px', fontWeight: '600', color: 'var(--ink)', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px'}}>I'm actively employed. Can I stay private?<span style={{fontSize: '16px', color: 'var(--ink3)', fontWeight: '300', flexShrink: '0'}}>+</span></summary>
                  <p style={{fontSize: '13px', color: 'var(--ink2)', lineHeight: '1.75', marginTop: '12px', fontWeight: '300'}}>Yes. You can use all AI tools — resume builder, interview coach, salary coach — in complete privacy without appearing in TrustMatch. You choose when to go "discoverable," and you can turn it off instantly.</p>
                </details>

                <details style={{background: 'var(--surf)', border: '1px solid var(--border2)', borderRadius: '12px', padding: '18px 20px', cursor: 'pointer'}}>
                  <summary style={{fontSize: '13.5px', fontWeight: '600', color: 'var(--ink)', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px'}}>Which countries are supported?<span style={{fontSize: '16px', color: 'var(--ink3)', fontWeight: '300', flexShrink: '0'}}>+</span></summary>
                  <p style={{fontSize: '13px', color: 'var(--ink2)', lineHeight: '1.75', marginTop: '12px', fontWeight: '300'}}>We're live in Singapore with deep Singpass and OpenCerts integration. Malaysia, Hong Kong, and Australia are on our 2025 roadmap. International candidates can still use all AI tools and Credly-based verification from day one.</p>
                </details>

                <details style={{background: 'var(--surf)', border: '1px solid var(--border2)', borderRadius: '12px', padding: '18px 20px', cursor: 'pointer'}}>
                  <summary style={{fontSize: '13.5px', fontWeight: '600', color: 'var(--ink)', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px'}}>How does blockchain verification actually work?<span style={{fontSize: '16px', color: 'var(--ink3)', fontWeight: '300', flexShrink: '0'}}>+</span></summary>
                  <p style={{fontSize: '13px', color: 'var(--ink2)', lineHeight: '1.75', marginTop: '12px', fontWeight: '300'}}>When a credential is verified, we create a cryptographic hash of the key facts (issuer, date, credential type, holder ID) and write it to a public blockchain. This creates an immutable, tamper-evident record. Anyone — including recruiters — can verify the hash matches the original credential without seeing your personal data.</p>
                </details>

                <details style={{background: 'var(--surf)', border: '1px solid var(--border2)', borderRadius: '12px', padding: '18px 20px', cursor: 'pointer'}}>
                  <summary style={{fontSize: '13.5px', fontWeight: '600', color: 'var(--ink)', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px'}}>What can I do on the free tier?<span style={{fontSize: '16px', color: 'var(--ink3)', fontWeight: '300', flexShrink: '0'}}>+</span></summary>
                  <p style={{fontSize: '13px', color: 'var(--ink2)', lineHeight: '1.75', marginTop: '12px', fontWeight: '300'}}>Free includes: 2 resume scans + ATS fixes, JD gap analysis, 1 cover letter, 3 interview prep sessions, basic Verification Clarity Score, and AI Memory Dashboard. TrustMatch marketplace visibility requires Pro (SGD 21/mo). You only upgrade when you're ready to be discovered by recruiters.</p>
                </details>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* RECRUITER TRIGGER (always visible) */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="recruiter-trigger-section" id="recruiter-trigger">
        <div className="wrap">
          <div className="recruiter-trigger-eyebrow">For Recruiters &amp; Hiring Committees</div>
          <h2 className="recruiter-trigger-headline">Pre-verified candidates.<br /><em>Before you spend a dollar.</em></h2>
          <p className="recruiter-trigger-sub">Save 10–15 days of BGC. Zero resume spam. COMPASS-aligned profiles, ready to shortlist.</p>
          <button className="recruiter-toggle-btn" id="recruiterToggleBtn" onClick={() => fnRef.current.toggleRecruiter?.()}>
            View Recruiter Intelligence <span className="btn-arrow">↓</span>
          </button>
          <div className="recruiter-hint"><span></span>Expand to see VCS breakdown &amp; compliance tools<span></span></div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* FOR RECRUITERS (hidden by default) */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="for-recruiters" style={{padding: '96px 0', background: 'var(--bg2)', borderTop: '1px solid var(--border)', position: 'relative', overflow: 'hidden'}}>
        <div style={{position: 'absolute', inset: '0', background: 'radial-gradient(ellipse 55% 50% at 80% 50%,rgba(139,130,240,.05),transparent 70%)', pointerEvents: 'none'}}></div>
        <div className="wrap">
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '72px', alignItems: 'start'}}>

            {/* Left copy */}
            <div>
              <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '9px', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--c2)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px'}}><span style={{width: '20px', height: '1px', background: 'rgba(139,130,240,.4)', display: 'block'}}></span>For Recruiters &amp; Hiring Committees</div>
              <h2 style={{fontFamily: '\'Instrument Serif\',serif', fontSize: 'clamp(28px,3vw,44px)', lineHeight: '1.08', letterSpacing: '-1.5px', marginBottom: '16px'}}>The verification is <em style={{color: 'var(--c2)'}}>already done</em><br />before you ever meet them.</h2>
              <p style={{fontSize: '14px', color: 'var(--ink2)', lineHeight: '1.75', fontWeight: '300', marginBottom: '28px'}}>Singapore hiring reqs attract 250–1,000+ applicants. Only 10% are technically qualified. Traditional BGC takes 10–15 business days and costs SGD 300–800 per candidate — <em>after</em> the offer. CareerAiHub flips this. Candidates arrive pre-verified, COMPASS-aligned, and screened before you spend a dollar.</p>

              <div style={{display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '32px'}}>
                <div style={{background: 'var(--surf)', border: '1px solid var(--border2)', borderRadius: '12px', padding: '18px 16px', textAlign: 'center'}}>
                  <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '22px', fontWeight: '700', color: 'var(--c4)', lineHeight: '1', marginBottom: '4px'}}>$240k</div>
                  <div style={{fontSize: '9px', color: 'var(--ink3)', fontFamily: '\'DM Mono\',monospace', letterSpacing: '.06em', textTransform: 'uppercase'}}>Cost of a bad hire (SGD)</div>
                </div>
                <div style={{background: 'var(--surf)', border: '1px solid var(--border2)', borderRadius: '12px', padding: '18px 16px', textAlign: 'center'}}>
                  <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '22px', fontWeight: '700', color: 'var(--c3)', lineHeight: '1', marginBottom: '4px'}}>15 days</div>
                  <div style={{fontSize: '9px', color: 'var(--ink3)', fontFamily: '\'DM Mono\',monospace', letterSpacing: '.06em', textTransform: 'uppercase'}}>Avg BGC wait (traditional)</div>
                </div>
                <div style={{background: 'var(--surf)', border: '1px solid var(--border2)', borderRadius: '12px', padding: '18px 16px', textAlign: 'center'}}>
                  <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '22px', fontWeight: '700', color: 'var(--c1)', lineHeight: '1', marginBottom: '4px'}}>50%</div>
                  <div style={{fontSize: '9px', color: 'var(--ink3)', fontFamily: '\'DM Mono\',monospace', letterSpacing: '.06em', textTransform: 'uppercase'}}>Faster time-to-hire</div>
                </div>
              </div>

              <div style={{display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px'}}>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--ink2)'}}><span style={{color: 'var(--c1)', fontSize: '11px', marginTop: '2px', flexShrink: '0'}}>✓</span><span><strong style={{color: 'var(--ink)', fontWeight: '500'}}>Verification Clarity Score</strong> — not a black box. Every point is traceable: education via OpenCerts, employment via Singpass, credentials via Credly. Full audit trail.</span></div>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--ink2)'}}><span style={{color: 'var(--c1)', fontSize: '11px', marginTop: '2px', flexShrink: '0'}}>✓</span><span><strong style={{color: 'var(--ink)', fontWeight: '500'}}>MOM COMPASS-aligned</strong> — profiles carry the data points you need for Fair Consideration Framework compliance. No extra legwork.</span></div>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--ink2)'}}><span style={{color: 'var(--c1)', fontSize: '11px', marginTop: '2px', flexShrink: '0'}}>✓</span><span><strong style={{color: 'var(--ink)', fontWeight: '500'}}>Spam eliminated at source</strong> — AI-optimised resume spam never earns a verified profile. You only see candidates who proved their credentials.</span></div>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--ink2)'}}><span style={{color: 'var(--c4)', fontSize: '11px', marginTop: '2px', flexShrink: '0'}}>◎</span><span><strong style={{color: 'var(--ink)', fontWeight: '500'}}>AI Integrity Signal</strong> <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '8px', color: 'var(--c4)', padding: '1px 6px', border: '1px solid rgba(232,92,128,.3)', borderRadius: '20px', marginLeft: '4px'}}>Building next</span> — flags likely real-time AI copilot use during live interviews, the #1 unresolved gap in 2026 hiring.</span></div>
              </div>

              {/* Verification source badges */}
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '28px'}}>
                <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '8px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(30,201,138,.07)', color: 'var(--c1)', border: '1px solid rgba(30,201,138,.2)'}}>🇸🇬 Singpass</span>
                <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '8px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(30,201,138,.07)', color: 'var(--c1)', border: '1px solid rgba(30,201,138,.2)'}}>🎓 OpenCerts</span>
                <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '8px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(139,130,240,.07)', color: 'var(--c2)', border: '1px solid rgba(139,130,240,.2)'}}>🏅 Credly</span>
                <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '8px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(99,102,241,.07)', color: 'var(--g1)', border: '1px solid rgba(99,102,241,.2)'}}>⚖️ MOM COMPASS-aligned</span>
              </div>

              <button onClick={() => setAuthModal("register")} style={{display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--surf)", border: "1px solid var(--borderA)", color: "var(--ink2)", padding: "11px 22px", borderRadius: "100px", fontSize: "13px", fontWeight: "500", cursor: "pointer", fontFamily: "sans-serif", transition: "all .2s"}}>Request recruiter access →</button>
            </div>

            {/* Right: VCS card */}
            <div style={{position: 'sticky', top: '80px'}}>
              <div style={{background: 'var(--surf)', border: '1px solid var(--border2)', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,.5)'}}>
                <div style={{padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                  <div>
                    <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '8px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--c2)', marginBottom: '4px'}}>Verification Clarity Score</div>
                    <div style={{fontSize: '14px', fontWeight: '600', color: 'var(--ink)'}}>Sarah Lim · Senior Data Engineer</div>
                    <div style={{fontSize: '11px', color: 'var(--ink3)', marginTop: '2px'}}>NUS · 6 yrs exp · Singapore PR</div>
                  </div>
                  <div style={{textAlign: 'center', flexShrink: '0'}}>
                    <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '32px', fontWeight: '700', color: 'var(--c1)', lineHeight: '1'}}>91</div>
                    <div style={{fontSize: '8px', color: 'var(--ink3)', fontFamily: '\'DM Mono\',monospace'}}>/100 VCS</div>
                  </div>
                </div>
                <div style={{padding: '16px 20px', borderBottom: '1px solid var(--border)'}}>
                  <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '8px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: '12px'}}>Clarity Breakdown — Auditable</div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
                    <div style={{fontSize: '11px', color: 'var(--ink2)', width: '170px', flexShrink: '0'}}>🎓 Education (OpenCerts)</div>
                    <div style={{flex: '1', height: '4px', background: 'var(--border2)', borderRadius: '2px', overflow: 'hidden'}}><div style={{height: '100%', width: '100%', background: 'var(--c1)', borderRadius: '2px'}}></div></div>
                    <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '9px', color: 'var(--c1)', width: '32px', textAlign: 'right'}}>25/25</div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
                    <div style={{fontSize: '11px', color: 'var(--ink2)', width: '170px', flexShrink: '0'}}>💼 Employment (Singpass)</div>
                    <div style={{flex: '1', height: '4px', background: 'var(--border2)', borderRadius: '2px', overflow: 'hidden'}}><div style={{height: '100%', width: '97%', background: 'var(--c1)', borderRadius: '2px'}}></div></div>
                    <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '9px', color: 'var(--c1)', width: '32px', textAlign: 'right'}}>34/35</div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
                    <div style={{fontSize: '11px', color: 'var(--ink2)', width: '170px', flexShrink: '0'}}>🏅 Credentials (Credly)</div>
                    <div style={{flex: '1', height: '4px', background: 'var(--border2)', borderRadius: '2px', overflow: 'hidden'}}><div style={{height: '100%', width: '90%', background: 'var(--c2)', borderRadius: '2px'}}></div></div>
                    <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '9px', color: 'var(--c2)', width: '32px', textAlign: 'right'}}>18/20</div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <div style={{fontSize: '11px', color: 'var(--ink2)', width: '170px', flexShrink: '0'}}>⚡ Platform Activity</div>
                    <div style={{flex: '1', height: '4px', background: 'var(--border2)', borderRadius: '2px', overflow: 'hidden'}}><div style={{height: '100%', width: '70%', background: 'var(--c3)', borderRadius: '2px'}}></div></div>
                    <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '9px', color: 'var(--c3)', width: '32px', textAlign: 'right'}}>14/20</div>
                  </div>
                </div>
                <div style={{padding: '14px 20px', display: 'flex', gap: '6px', flexWrap: 'wrap', borderBottom: '1px solid var(--border)'}}>
                  <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '8px', padding: '3px 9px', borderRadius: '20px', background: 'rgba(30,201,138,.07)', color: 'var(--c1)', border: '1px solid rgba(30,201,138,.2)'}}>✓ 🇸🇬 Singpass</span>
                  <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '8px', padding: '3px 9px', borderRadius: '20px', background: 'rgba(30,201,138,.07)', color: 'var(--c1)', border: '1px solid rgba(30,201,138,.2)'}}>✓ 🎓 OpenCerts</span>
                  <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '8px', padding: '3px 9px', borderRadius: '20px', background: 'rgba(99,102,241,.07)', color: 'var(--g1)', border: '1px solid rgba(99,102,241,.2)'}}>⚖️ MOM COMPASS-aligned</span>
                  <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '8px', padding: '3px 9px', borderRadius: '20px', background: 'rgba(139,130,240,.07)', color: 'var(--c2)', border: '1px solid rgba(139,130,240,.2)'}}>🏅 Credly</span>
                  <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '8px', padding: '3px 9px', borderRadius: '20px', background: 'rgba(139,130,240,.07)', color: 'var(--c2)', border: '1px solid rgba(139,130,240,.2)'}}>⛓ On-chain hash</span>
                </div>
                <div style={{padding: '12px 20px', background: 'rgba(30,201,138,.03)'}}>
                  <div style={{fontSize: '11px', color: 'var(--ink2)', lineHeight: '1.6'}}>No BGC vendor needed. <strong style={{color: 'var(--ink)', fontWeight: '500'}}>Save SGD 300–800</strong> per candidate and <strong style={{color: 'var(--ink)', fontWeight: '500'}}>10–15 business days</strong> of wait — before you make an offer.</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* DATA PRIVACY */}
      <section id="privacy" style={{padding: '80px 0', background: 'var(--bg)', borderTop: '1px solid var(--border)'}}>
        <div className="wrap">

          {/* Header */}
          <div style={{marginBottom: '40px'}}>
            <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '9px', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--c1)', marginBottom: '14px'}}>Your Data, Protected</div>
            <h2 style={{fontFamily: '\'Instrument Serif\',serif', fontSize: 'clamp(28px,3.5vw,46px)', lineHeight: '1.08', letterSpacing: '-1.5px', marginBottom: '10px'}}>Your resume is yours. <em style={{color: 'var(--c1)'}}>Always.</em></h2>
            <p style={{fontSize: '14px', color: 'var(--ink2)', fontWeight: '300', maxWidth: '520px'}}>We know you're uploading something personal. Here's exactly how we handle it.</p>
          </div>

          {/* 4 cards in a row */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '32px'}}>

            <div style={{background: 'var(--surf)', border: '1px solid var(--border2)', borderRadius: '14px', padding: '24px'}}>
              <div style={{fontSize: '26px', marginBottom: '14px'}}>🔒</div>
              <div style={{fontSize: '13px', fontWeight: '600', color: 'var(--ink)', marginBottom: '8px'}}>Encrypted in transit and at rest</div>
              <div style={{fontSize: '12px', color: 'var(--ink3)', lineHeight: '1.65'}}>Your resume is encrypted with AES-256 the moment it's uploaded. It travels over TLS 1.3 and is stored in encrypted form. Only you can access it.</div>
            </div>

            <div style={{background: 'var(--surf)', border: '1px solid var(--border2)', borderRadius: '14px', padding: '24px'}}>
              <div style={{fontSize: '26px', marginBottom: '14px'}}>🚫</div>
              <div style={{fontSize: '13px', fontWeight: '600', color: 'var(--ink)', marginBottom: '8px'}}>Never sold. Never shared.</div>
              <div style={{fontSize: '12px', color: 'var(--ink3)', lineHeight: '1.65'}}>We do not sell your data to recruiters, job boards, or third parties. Ever. Your resume is used only to power your own CareerAiHub modules — nothing else.</div>
            </div>

            <div style={{background: 'var(--surf)', border: '1px solid var(--border2)', borderRadius: '14px', padding: '24px'}}>
              <div style={{fontSize: '26px', marginBottom: '14px'}}>🗑️</div>
              <div style={{fontSize: '13px', fontWeight: '600', color: 'var(--ink)', marginBottom: '8px'}}>Delete anytime</div>
              <div style={{fontSize: '12px', color: 'var(--ink3)', lineHeight: '1.65'}}>Delete your resume, profile, and all data from account settings at any time. We process deletion within 24 hours and purge backups within 30 days.</div>
            </div>

            <div style={{background: 'var(--surf)', border: '1px solid var(--border2)', borderRadius: '14px', padding: '24px'}}>
              <div style={{fontSize: '26px', marginBottom: '14px'}}>🇸🇬</div>
              <div style={{fontSize: '13px', fontWeight: '600', color: 'var(--ink)', marginBottom: '8px'}}>PDPA compliant · Singapore</div>
              <div style={{fontSize: '12px', color: 'var(--ink3)', lineHeight: '1.65'}}>CareerAiHub is built to comply with Singapore's Personal Data Protection Act (PDPA). GDPR compliance planned for our European expansion.</div>
            </div>

          </div>

          {/* Legal pill links */}
          <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
            <button onClick={() => fnRef.current.openLegal?.("tos")} style={{display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '100px', border: '1px solid var(--border2)', background: 'transparent', fontSize: '12.5px', color: 'var(--ink2)', cursor: 'pointer', fontFamily: '\'DM Sans\',sans-serif', transition: 'all .2s'}}>Terms of Service ↗</button>
            <button onClick={() => fnRef.current.openLegal?.("privacy")} style={{display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '100px', border: '1px solid var(--border2)', background: 'transparent', fontSize: '12.5px', color: 'var(--ink2)', cursor: 'pointer', fontFamily: '\'DM Sans\',sans-serif', transition: 'all .2s'}}>Privacy Policy ↗</button>
            <button onClick={() => fnRef.current.openLegal?.("security")} style={{display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '100px', border: '1px solid var(--border2)', background: 'transparent', fontSize: '12.5px', color: 'var(--ink2)', cursor: 'pointer', fontFamily: '\'DM Sans\',sans-serif', transition: 'all .2s'}}>Security Statement ↗</button>
            <button onClick={() => fnRef.current.openLegal?.("deletion")} style={{display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '100px', border: '1px solid var(--border2)', background: 'transparent', fontSize: '12.5px', color: 'var(--ink2)', cursor: 'pointer', fontFamily: '\'DM Sans\',sans-serif', transition: 'all .2s'}}>Data Deletion Request ↗</button>
          </div>

        </div>
      </section>

      {/* LEGAL MODALS */}
      <div id="legalModal" style={{display: 'none', position: 'fixed', inset: '0', zIndex: '8500', background: 'rgba(0,0,0,.82)', backdropFilter: 'blur(8px)', alignItems: 'flex-end', justifyContent: 'center', padding: '0'}} onClick={(e) => { if(e.target===e.currentTarget) fnRef.current.closeLegal?.(); }}>
        <div id="legalSheet" style={{background: 'var(--surf)', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '680px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', transform: 'translateY(100%)', transition: 'transform .4s cubic-bezier(.22,1,.36,1)'}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border)', flexShrink: '0'}}>
            <div id="legalTitle" style={{fontFamily: '\'Instrument Serif\',serif', fontSize: '18px', letterSpacing: '-.3px', color: 'var(--ink)'}}></div>
            <button onClick={() => fnRef.current.closeLegal?.()} style={{width: '30px', height: '30px', borderRadius: '50%', background: 'var(--surf2)', border: '1px solid var(--border2)', color: 'var(--ink2)', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>✕</button>
          </div>
          <div id="legalBody" style={{overflowY: 'auto', padding: '24px', fontSize: '13px', color: 'var(--ink2)', lineHeight: '1.8', fontWeight: '300'}}></div>
        </div>
      </div>

      {/* FINAL CTA */}
      <section id="final-cta">
        <div className="wrap" style={{position: 'relative', zIndex: '1'}}>
          <div className="fcta-pre">The future of hiring</div>
          <h2 className="fcta-h">The future of hiring is<br /><span className="proof">proof,</span> <span className="not">not</span> keywords.</h2>
          <p className="fcta-sub">CareerAiHub is building the trust infrastructure for modern hiring. Join 2,714 verified candidates and forward-thinking companies already on the platform.</p>
          <div className="fcta-actions">
            <button className="btn-fcta" onClick={() => setAuthModal("register")}>Get Early Access →</button>
            <a href="#" className="btn-fcta2">Request Recruiter Access ↗</a>
          </div>
          <div className="fcta-note">Free forever · No card required · 10 AI modules unlocked instantly</div>
        </div>
      </section>

      {/* FLOAT CTA */}
      <div className="float-cta" id="floatCta">
        <button onClick={() => setAuthModal("register")}>Get Early Access →</button>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* FOOTER */}
      {/* ═══════════════════════════════════════════════ */}
      <footer style={{background: 'var(--bg2)', borderTop: '1px solid var(--border)', padding: '64px 0 32px'}}>
        <div className="wrap">
          <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '48px', marginBottom: '56px'}}>

            {/* Brand */}
            <div>
              <a href="#" style={{display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '16px'}}>
                <div style={{width: '28px', height: '28px', borderRadius: '8px', background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#fff', flexShrink: '0'}}>C</div>
                <div>
                  <div style={{fontWeight: '700', fontSize: '15px', color: 'var(--ink)', letterSpacing: '-.02em'}}>CareerAiHub</div>
                  <div style={{fontSize: '9px', color: 'var(--ink3)', fontFamily: '\'DM Mono\',monospace', letterSpacing: '.08em', textTransform: 'uppercase'}}>Proof over claims.</div>
                </div>
              </a>
              <p style={{fontSize: '12.5px', color: 'var(--ink3)', lineHeight: '1.7', maxWidth: '240px', fontWeight: '300'}}>The trust infrastructure for modern hiring. Built in Singapore.</p>
              <div style={{display: 'flex', gap: '10px', marginTop: '18px'}}>
                <a href="#" style={{width: '30px', height: '30px', borderRadius: '8px', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', textDecoration: 'none', color: 'var(--ink3)', transition: '.2s'}} title="LinkedIn">in</a>
                <a href="#" style={{width: '30px', height: '30px', borderRadius: '8px', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', textDecoration: 'none', color: 'var(--ink3)', transition: '.2s'}} title="X/Twitter">𝕏</a>
                <a href="#" style={{width: '30px', height: '30px', borderRadius: '8px', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', textDecoration: 'none', color: 'var(--ink3)', transition: '.2s'}} title="GitHub">⌨</a>
              </div>
            </div>

            {/* Product */}
            <div>
              <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '8.5px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: '14px'}}>Product</div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                <a href="#s1" style={{fontSize: '12.5px', color: 'var(--ink2)', textDecoration: 'none', transition: '.2s'}}>ATS Builder</a>
                <a href="#s2" style={{fontSize: '12.5px', color: 'var(--ink2)', textDecoration: 'none', transition: '.2s'}}>AI Interview Coach</a>
                <a href="#s3" style={{fontSize: '12.5px', color: 'var(--ink2)', textDecoration: 'none', transition: '.2s'}}>Salary Coach</a>
                <a href="#s3" style={{fontSize: '12.5px', color: 'var(--ink2)', textDecoration: 'none', transition: '.2s'}}>TrustMatch</a>
                <a href="#pricing" style={{fontSize: '12.5px', color: 'var(--ink2)', textDecoration: 'none', transition: '.2s'}}>Pricing</a>
              </div>
            </div>

            {/* Company */}
            <div>
              <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '8.5px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: '14px'}}>Company</div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                <a href="#" style={{fontSize: '12.5px', color: 'var(--ink2)', textDecoration: 'none', transition: '.2s'}}>About</a>
                <a href="#" style={{fontSize: '12.5px', color: 'var(--ink2)', textDecoration: 'none', transition: '.2s'}}>Blog</a>
                <a href="#" style={{fontSize: '12.5px', color: 'var(--ink2)', textDecoration: 'none', transition: '.2s'}}>Careers</a>
                <a href="#" style={{fontSize: '12.5px', color: 'var(--ink2)', textDecoration: 'none', transition: '.2s'}}>Press</a>
                <a href="mailto:hello@careeraihub.com" style={{fontSize: '12.5px', color: 'var(--ink2)', textDecoration: 'none', transition: '.2s'}}>Contact</a>
              </div>
            </div>

            {/* Legal */}
            <div>
              <div style={{fontFamily: '\'DM Mono\',monospace', fontSize: '8.5px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: '14px'}}>Legal</div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                <a href="#privacy" style={{fontSize: '12.5px', color: 'var(--ink2)', textDecoration: 'none', transition: '.2s'}}>Privacy Policy</a>
                <a href="#" style={{fontSize: '12.5px', color: 'var(--ink2)', textDecoration: 'none', transition: '.2s'}}>Terms of Service</a>
                <a href="#" style={{fontSize: '12.5px', color: 'var(--ink2)', textDecoration: 'none', transition: '.2s'}}>Cookie Policy</a>
                <a href="#" onClick={(e) => {e.preventDefault(); fnRef.current.cookiePrefs?.();}} style={{fontSize: '12.5px', color: 'var(--ink2)', textDecoration: 'none', transition: '.2s'}}>Cookie Preferences</a>
                <a href="#faq" style={{fontSize: '12.5px', color: 'var(--ink2)', textDecoration: 'none', transition: '.2s'}}>FAQ</a>
                <a href="mailto:security@careeraihub.com" style={{fontSize: '12.5px', color: 'var(--ink2)', textDecoration: 'none', transition: '.2s'}}>Security</a>
              </div>
            </div>

          </div>

          {/* Bottom bar */}
          <div style={{borderTop: '1px solid var(--border)', paddingTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px'}}>
            <div style={{fontSize: '11px', color: 'var(--ink3)', fontFamily: '\'DM Mono\',monospace'}}>© 2025 CareerAiHub Pte. Ltd. · Registered in Singapore</div>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
              <span style={{fontSize: '11px', color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: '5px'}}><span style={{width: '6px', height: '6px', borderRadius: '50%', background: 'var(--c1)', display: 'inline-block'}}></span>All systems operational</span>
              <span style={{fontFamily: '\'DM Mono\',monospace', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(30,201,138,.07)', color: 'var(--c1)', border: '1px solid rgba(30,201,138,.18)'}}>PDPA Compliant</span>
            </div>
          </div>

        </div>
      </footer>

      {/* ATS DEMO MODAL (full from v7) */}
      <div className="ats-modal-bg" id="atsModalBg" role="dialog" aria-modal="true">
        <div className="ats-modal">
          <div className="ats-modal-bar">
            <div><h3>ATS Score: 38 → 91% — live</h3><p>Paste your JD snippet to personalise · press Apply to fix each issue</p></div>
            <button className="ats-modal-close" onClick={() => fnRef.current.closeATSDemo?.()} aria-label="Close">✕</button>
          </div>
          <div className="ats-modal-body">
            <div className="ats-grid">
              <div className="ats-col">
                <div className="wc">
                  <div className="wc-hd"><span>Resume.pdf</span><span className="wc-badge" id="atsBadge">Scanning</span></div>
                  <div className="rl-wrap"><div className="w-rl" id="rl0"></div><div className="w-rl" id="rl1"></div><div className="w-rl" id="rl2"></div><div className="w-rl" id="rl3"></div><div className="w-rl" id="rl4"></div><div className="w-rl" id="rl5"></div><div className="w-rl" id="rl6"></div><div className="w-rl" id="rl7"></div></div>
                  <div className="scan-steps"><div className="wss" id="ss0">Parse structure</div><div className="wss" id="ss1">Extract keywords</div><div className="wss" id="ss2">Score JD alignment</div><div className="wss" id="ss3">Detect issues</div><div className="wss" id="ss4">Build fix plan</div></div>
                </div>
                <div className="wc">
                  <div className="wc-hd"><span>Your JD snippet</span></div>
                  <div className="try-in"><div className="try-lbl">Paste job description</div><textarea className="try-ta" id="userJd" placeholder="e.g. Senior PM, OKR, SQL, stakeholder management…"></textarea><button className="try-btn" onClick={() => fnRef.current.wResetScanner?.()}>⚡ Scan against this JD</button></div>
                </div>
              </div>
              <div className="ats-col">
                <div className="wc">
                  <div className="eng-hd"><div className="eng-ti"><span className="eng-dot" id="engDot"></span><span id="engTitle">ATS Engine — scanning…</span></div><span className="eng-badge" id="engBadge">Running</span></div>
                  <div className="eng-prog"><div className="ep-row"><span>Scan progress</span><span id="scanPct">0%</span></div><div className="ep-bg"><div className="ep-bar" id="scanBar"></div></div></div>
                  <div className="eng-sc"><div className="sc-box wbefore"><div className="sc-lbl">Before</div><div className="sc-num" id="scoreBefore">38%</div><div className="sc-bg"><div className="sc-bar" id="barBefore"></div></div></div><div className="sc-box wafter"><div className="sc-lbl">After AI</div><div className="sc-num" id="scoreAfter">—</div><div className="sc-bg"><div className="sc-bar" id="barAfter"></div></div><div className="sc-delta" id="scoreDelta"></div></div></div>
                  <div id="ph1"><div className="eng-insight" id="engInsight"></div><div className="eng-checks" id="engChecks"></div></div>
                  <div id="ph2" style={{display: 'none'}}><div style={{padding: '6px 12px', fontSize: '10px', color: 'var(--ink3)', borderBottom: '1px solid rgba(30,201,138,.06)'}}>6 fixes ready — apply one at a time</div><div className="eng-fixes" id="engFixes"></div><div className="eng-insight" id="fixInsight" style={{opacity: '1'}}></div><div className="eng-acts"><button className="btn-fix" id="applyBtn" onClick={() => fnRef.current.wApplyFix?.()}>⚡ Apply next fix</button><button className="btn-re" onClick={() => fnRef.current.wResetScanner?.()}>↺ Replay</button></div></div>
                  <div className="eng-kw" id="engKw"><span className="kw-lbl">Keywords detected</span><span className="kwt miss">OKR</span><span className="kwt miss">SQL</span><span className="kwt hit">Stakeholder</span><span className="kwt hit">Roadmap</span><span className="kwt hit">Agile</span><span className="kwt miss">A/B testing</span></div>
                  <div className="eng-fin" id="engFin"><div className="eng-fin-t">✓ ATS optimized — 91%</div><div className="eng-fin-s">Create your account to save + unlock 9 more AI modules.</div></div>
                  <div className="eng-gate" id="engGate"><div className="gate-t">Your full ATS report is ready</div><div className="gate-s">Free account — 3 scans + 9 AI modules</div><div className="gate-row"><input className="gate-in" id="gateEmail" type="email" placeholder="you@email.com" /><button className="gate-btn" onClick={() => fnRef.current.wSubmitGate?.()}>Get started →</button></div><div className="gate-note">Free forever · No card required</div></div>
                </div>
              </div>
              <div className="ats-col">
                <div className="wrc dim" id="wrc">
                  <div className="wrc-hd" id="rcHd">AI result card</div>
                  <div className="wrc-score"><div className="wrc-sl">ATS Match Score</div><div className="wrc-sn" id="rcScore">—</div><div className="wrc-vd" id="rcVd"></div></div>
                  <div className="wrc-dims"><div className="wrd"><div className="wrd-row"><span className="wrd-lbl">Keyword match</span><span className="wrd-val" id="rd0">—</span></div><div className="wrd-bg"><div className="wrd-fill" id="rb0"></div></div></div><div className="wrd"><div className="wrd-row"><span className="wrd-lbl">Section headers</span><span className="wrd-val" id="rd1">—</span></div><div className="wrd-bg"><div className="wrd-fill" id="rb1"></div></div></div><div className="wrd"><div className="wrd-row"><span className="wrd-lbl">Bullet impact</span><span className="wrd-val" id="rd2">—</span></div><div className="wrd-bg"><div className="wrd-fill" id="rb2"></div></div></div><div className="wrd"><div className="wrd-row"><span className="wrd-lbl">Seniority framing</span><span className="wrd-val" id="rd3">—</span></div><div className="wrd-bg"><div className="wrd-fill" id="rb3"></div></div></div></div>
                  <div className="wrc-ai" id="rcAi"><div className="ai-bub"><div className="ai-av">AI</div><div className="ai-tx" id="rcTx">Analysing — results appear here.</div></div></div>
                  <div className="wrc-cta"><button className="wrc-cta-btn" onClick={() => fnRef.current.wCtaClick?.()}>✦ Create free account →</button></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COOKIE BANNER */}
      <div id="cookieBanner" style={{position: 'fixed', bottom: '0', left: '0', right: '0', zIndex: '9000', background: 'rgba(12,14,26,.97)', borderTop: '1px solid var(--border2)', backdropFilter: 'blur(12px)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', transform: 'translateY(100%)', transition: 'transform .38s cubic-bezier(.22,1,.36,1)'}}>
        <div style={{flex: '1', minWidth: '220px', display: 'flex', alignItems: 'center', gap: '12px'}}>
          <span style={{fontSize: '18px'}}>🍪</span>
          <div>
            <div style={{fontSize: '13px', color: 'var(--ink)', lineHeight: '1.5', fontWeight: '300'}}>We use cookies to improve your experience and analyze platform usage. <strong style={{fontWeight: '500', color: 'var(--ink)'}}>Your resume data is encrypted and never sold.</strong> <a href="#privacy" onClick={() => fnRef.current.hideCookieBanner?.()} style={{color: 'var(--g1)', textDecoration: 'none'}}>Privacy Policy →</a></div>
          </div>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', flexShrink: '0'}}>
          <button onClick={() => fnRef.current.declineCookies?.()} style={{fontSize: '12px', color: 'var(--ink2)', background: 'transparent', border: '1px solid var(--border2)', padding: '8px 16px', borderRadius: '100px', cursor: 'pointer', fontFamily: '\'DM Sans\',sans-serif', whiteSpace: 'nowrap'}}>Decline optional</button>
          <button onClick={() => fnRef.current.acceptCookies?.()} style={{fontSize: '12px', fontWeight: '600', color: '#fff', background: 'var(--grad)', border: 'none', padding: '9px 20px', borderRadius: '100px', cursor: 'pointer', fontFamily: '\'DM Sans\',sans-serif', whiteSpace: 'nowrap', boxShadow: '0 2px 12px rgba(99,102,241,.3)'}}>Accept &amp; continue</button>
        </div>
      </div>
    </div>
  );
}
