import React, { useState, useRef, useEffect } from 'react';
import './resumeScan.css';
import { OrbitSpinner } from '../../components/OrbitMark';
import { callLLM, extractJSON } from '../../lib/ai.jsx';

// ── Preserved scan logic ──────────────────────────────────────────────────────

function buildScanPrompt(targetRole) {
  return `You are a ruthless hiring expert. Analyze this resume${targetRole ? ` for the role: ${targetRole}` : ''}.
Return ONLY raw JSON (no markdown, start with {):
{"credibilityScore":0-100,"metricsFound":0,"summary":"2-3 sentence verdict","issues":[{"severity":"critical|warning|ok","type":"Vague Bullet|Missing Metric|Weak Ownership|Strong Claim","original":"short quote max 8 words","fix":"specific XYZ-format fix: Achieved X, measured by Y, by doing Z"}],"interrogationQuestions":[{"source":"which claim","question":"tough specific question"}]}
Generate 4-6 issues and 5-7 questions hyper-specific to this resume's actual companies, roles, and claims.`;
}

function buildSnarkyPrompt(targetRole) {
  return `You are a brutally honest, entertainingly savage hiring expert who has seen 10,000 bad resumes and has zero patience for corporate fluff. Analyze this resume${targetRole ? ` for the role: ${targetRole}` : ''}.
Roast each issue with sharp wit — then immediately follow it with a specific XYZ-format fix (Achieved X, measured by Y, by doing Z) so the candidate knows exactly how to fix it.
Return ONLY raw JSON (no markdown, start with {):
{"credibilityScore":0-100,"metricsFound":0,"summary":"2-3 sentence brutally honest roast of this resume — be specific to the actual content, not generic","issues":[{"severity":"critical|warning|ok","type":"Vague Bullet|Missing Metric|Weak Ownership|Strong Claim","original":"short quote max 8 words","roast":"1 snarky sentence calling this out specifically","fix":"XYZ-format fix: Achieved X, measured by Y, by doing Z"}],"interrogationQuestions":[{"source":"which claim","question":"the most uncomfortable question a skeptical hiring manager would ask about this exact claim"}]}
Generate 4-6 issues. Be specific to this resume's actual content, companies, and claims.`;
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

// ── Log steps shown during scanning ──────────────────────────────────────────

const LOG_STEPS = [
  { t: '00:01', c: 'rs-tc-parse', cat: 'PARSE', msg: 'Parsing resume structure...' },
  { t: '00:02', c: 'rs-tc-ats',   cat: 'ATS',   msg: 'Running ATS compatibility check...' },
  { t: '00:03', c: 'rs-tc-xyz',   cat: 'XYZ',   msg: 'Detecting XYZ-format bullets...' },
  { t: '00:04', c: 'rs-tc-ats',   cat: 'ATS',   msg: 'Scoring metric density...' },
  { t: '00:05', c: 'rs-tc-cover', cat: 'QUES',  msg: 'Generating interrogation questions...' },
  { t: '00:06', c: 'rs-tc-skill', cat: 'SCORE', msg: 'Finalising credibility score...' },
];

// ── ScoreGauge SVG ────────────────────────────────────────────────────────────

function ScoreGauge({ score = 0, color = '#00c8ff' }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const arc = circ * 0.75; // 270° sweep
  const filled = (score / 100) * arc;
  return (
    <svg width="110" height="100" viewBox="0 0 100 96">
      <defs>
        <filter id="rs-glow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* background arc */}
      <circle
        cx="50" cy="54" r={r}
        fill="none" stroke="#1c1f2c" strokeWidth="7" strokeLinecap="round"
        strokeDasharray={`${arc} ${circ - arc}`}
        transform="rotate(-135 50 54)"
      />
      {/* filled arc */}
      <circle
        cx="50" cy="54" r={r}
        fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={`${filled} ${circ - filled}`}
        transform="rotate(-135 50 54)"
        style={{
          filter: `drop-shadow(0 0 7px ${color})`,
          transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)',
        }}
      />
      <text x="50" y="59" textAnchor="middle" fill="#e8eaf0" fontSize="22" fontWeight="800" fontFamily="Syne,sans-serif">{score}</text>
      <text x="50" y="72" textAnchor="middle" fill="#3d4560" fontSize="8" fontFamily="JetBrains Mono,monospace">ATS SCORE</text>
    </svg>
  );
}

// ── ProgBar ───────────────────────────────────────────────────────────────────

function ProgBar({ label, value, color }) {
  return (
    <div className="rs-prog-item">
      <div className="rs-prog-row">
        <span>{label}</span>
        <span style={{ color }}>{value}%</span>
      </div>
      <div className="rs-prog-track">
        <div
          className="rs-prog-fill"
          style={{ width: `${value}%`, background: color, boxShadow: `0 0 6px ${color}` }}
        />
      </div>
    </div>
  );
}

// ── KeywordBox ────────────────────────────────────────────────────────────────

function KeywordBox({ title, keywords = [], variant }) {
  return (
    <div className={`rs-kw-box ${variant}`}>
      <div className="rs-kw-title" style={{ color: variant === 'missing' ? 'var(--rs-red)' : 'var(--rs-green)' }}>
        {title}
      </div>
      <div className="rs-kw-list">
        {keywords.map((kw, i) => (
          <span key={i} className={`rs-kw-chip ${variant}`}>{kw}</span>
        ))}
        {keywords.length === 0 && (
          <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono,monospace', color: 'var(--rs-text3)' }}>—</span>
        )}
      </div>
    </div>
  );
}

// ── IssueCard ─────────────────────────────────────────────────────────────────

function IssueCard({ issue }) {
  const sevColor = issue.severity === 'critical' ? 'var(--rs-red)'
    : issue.severity === 'warning' ? 'var(--rs-gold)'
    : 'var(--rs-green)';

  const badgeBg = issue.severity === 'critical' ? 'rgba(255,95,110,0.12)'
    : issue.severity === 'warning' ? 'rgba(245,200,66,0.12)'
    : 'rgba(0,229,160,0.12)';

  return (
    <div className={`rs-issue-card sev-${issue.severity}`}>
      <div className="rs-issue-header">
        <span
          className="rs-sev-badge"
          style={{ background: badgeBg, color: sevColor, border: `1px solid ${sevColor}44` }}
        >
          {issue.severity}
        </span>
        <span className="rs-issue-type">{issue.type}</span>
      </div>
      <div className="rs-issue-original">"{issue.original}"</div>
      {issue.roast && (
        <div className="rs-issue-roast">{issue.roast}</div>
      )}
      <div className="rs-issue-fix">
        <span className="rs-xyz-badge rs-xyz-x">X</span>
        <span className="rs-xyz-badge rs-xyz-y">Y</span>
        <span className="rs-xyz-badge rs-xyz-z">Z</span>
        {' '}{issue.fix}
      </div>
    </div>
  );
}

// ── ScanHistoryCard (collapsible, restyled) ───────────────────────────────────

function ScanHistoryCard({ item, initExpanded }) {
  const [expanded, setExpanded] = useState(initExpanded);
  const res = item.result || { credibilityScore: item.score, issues: item.issues || [] };
  const score = res.credibilityScore || 0;
  const scoreColor = score >= 70 ? 'var(--rs-green)' : score >= 50 ? 'var(--rs-gold)' : 'var(--rs-red)';

  return (
    <div className="rs-hist-card">
      <div className="rs-hist-card-head" onClick={() => setExpanded(!expanded)}>
        <span className="rs-hist-card-name">{item.fileName}</span>
        <div className="rs-hist-card-meta">
          <span className="rs-hist-card-score" style={{ color: scoreColor }}>{score}</span>
          <span className={`rs-hist-card-chevron${expanded ? ' open' : ''}`}>▼</span>
        </div>
      </div>
      {expanded && (
        <div className="rs-hist-card-body">
          {res.summary && (
            <div style={{ fontSize: 11, color: 'var(--rs-text2)', lineHeight: 1.6 }}>{res.summary}</div>
          )}
          {res.issues?.length > 0 && res.issues.map((issue, i) => {
            const sc = issue.severity === 'critical' ? 'var(--rs-red)'
              : issue.severity === 'warning' ? 'var(--rs-gold)'
              : 'var(--rs-green)';
            return (
              <div key={i} className="rs-hist-issue" style={{ borderLeftColor: sc }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 8, fontFamily: 'JetBrains Mono,monospace', color: sc, textTransform: 'uppercase' }}>
                    {issue.severity}
                  </span>
                  <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono,monospace', color: 'var(--rs-text3)' }}>
                    {issue.type}
                  </span>
                </div>
                <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono,monospace', color: 'var(--rs-cyan)', marginBottom: 4 }}>
                  "{issue.original}"
                </div>
                {issue.roast && (
                  <div style={{ fontSize: 10, color: 'var(--rs-gold)', fontStyle: 'italic', marginBottom: 4 }}>{issue.roast}</div>
                )}
                <div style={{ fontSize: 10, color: 'var(--rs-green)' }}>{issue.fix}</div>
              </div>
            );
          })}
          {res.interrogationQuestions?.length > 0 && (
            <div>
              <div className="rs-section-head" style={{ marginBottom: 4 }}>Interrogation Questions</div>
              {res.interrogationQuestions.slice(0, 3).map((q, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 8, fontFamily: 'JetBrains Mono,monospace', color: 'var(--rs-text3)', marginBottom: 2 }}>
                    From: {q.source}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--rs-text2)' }}>{q.question}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Derive keyword lists from scan result ─────────────────────────────────────
function deriveKeywords(result) {
  if (!result) return { missing: [], matched: [] };
  const missing = [];
  const matched = [];
  (result.issues || []).forEach(issue => {
    if (issue.severity === 'critical' || issue.severity === 'warning') {
      const words = issue.fix?.match(/\b[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?\b/g) || [];
      words.slice(0, 2).forEach(w => { if (!missing.includes(w)) missing.push(w); });
    }
    if (issue.severity === 'ok') {
      const words = issue.original?.match(/\b[A-Z][a-zA-Z]+\b/g) || [];
      words.slice(0, 1).forEach(w => { if (!matched.includes(w)) matched.push(w); });
    }
  });
  return { missing: missing.slice(0, 6), matched: matched.slice(0, 6) };
}

function deriveProgBars(result) {
  if (!result) return { bullet: 0, metrics: 0, ownership: 0 };
  const score = result.credibilityScore || 0;
  const issues = result.issues || [];
  const critCount = issues.filter(i => i.severity === 'critical').length;
  const bullet = Math.max(20, Math.min(100, score - critCount * 5));
  const metrics = Math.min(100, (result.metricsFound || 0) * 14);
  const ownership = Math.max(10, Math.min(100, score + 5 - critCount * 8));
  return { bullet, metrics, ownership };
}

// ── ATS Scanner main view (matches reference: no tabs, left card + right results) ──
function JDMatchTab({ resumeText, form, setActiveModule, updateMemory }) {
  const [jd, setJd]           = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);

  const resumeCtx = resumeText
    ? (typeof resumeText === 'string' ? resumeText : resumeText.content || '') : '';

  const scan = async () => {
    if (!jd.trim()) return;
    setLoading(true); setResult(null);
    try {
      const raw = await callLLM([{ role: 'user', content:
        `Compare this resume against the job description and return a match analysis.
Resume:
${resumeCtx.slice(0, 3000) || 'No resume provided — infer from context.'}

Job Description:
${jd.slice(0, 2000)}

Return ONLY raw JSON (no markdown, start with {):
{
  "matchScore": 0-100,
  "roleTitle": "job title from the JD",
  "company": "company name from the JD or empty string",
  "verdict": "one phrase like Good match — 3 critical gaps to fix",
  "bars": [
    {"label":"Keywords matched","score":0-100},
    {"label":"Skills alignment","score":0-100},
    {"label":"Format score","score":0-100}
  ],
  "missingKeywords": ["keyword1","keyword2","keyword3","keyword4","keyword5","keyword6","keyword7"],
  "aiInsight": "2-sentence specific advice about the biggest gap and estimated score improvement after rewrite"
}` }], 800);
      const parsed = extractJSON(raw);
      if (!parsed.error) {
        setResult(parsed);
        if (updateMemory) {
          updateMemory(
            m => ({ jdAnalyses: [{ date: new Date().toISOString(), roleTitle: parsed.roleTitle, matchScore: parsed.matchScore }, ...(m.jdAnalyses || [])].slice(0, 20) }),
            { table: 'jd_analyses', data: { role_title: parsed.roleTitle || form?.role || '', company: parsed.company || '', match_score: parsed.matchScore, keywords: parsed.bars || [], gaps: parsed.missingKeywords || [], advice: parsed.aiInsight || '' } }
          );
        }
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  const scoreColor = result
    ? result.matchScore >= 80 ? '#00E5A0' : result.matchScore >= 60 ? '#FFB84D' : '#FF5A5A'
    : '#00D4FF';

  const barColor = (score) => score >= 80 ? '#00E5A0' : score >= 60 ? '#FFB84D' : '#FF5A5A';

  return (
    <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

      {/* ── Left: JD input card ── */}
      <div style={{
        background: 'var(--lp-bg3)', border: '1px solid var(--lp-bdr)', borderRadius: 12,
        padding: 20, display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--lp-text3)' }}>
          Job Description
        </div>

        {!resumeCtx && (
          <div style={{ fontSize: 11, color: 'var(--lp-text3)', fontStyle: 'italic' }}>
            No resume uploaded — score will be estimated.{' '}
            <button onClick={() => setActiveModule?.('ats')} style={{ background: 'none', border: 'none', color: 'var(--lp-teal)', cursor: 'pointer', fontWeight: 700, fontSize: 11, padding: 0, fontFamily: 'inherit' }}>
              Upload in Resume Builder →
            </button>
          </div>
        )}

        <textarea
          value={jd} onChange={e => setJd(e.target.value)}
          placeholder={`Paste the full job description here...\ne.g. We are looking for a Senior Product Manager at Grab Singapore with 5+ years experience in fintech...`}
          style={{
            width: '100%', minHeight: 260, background: 'var(--lp-bg2)', border: '1px solid var(--lp-bdr)',
            borderRadius: 10, color: 'var(--lp-text)', padding: '12px 14px',
            fontSize: 13, outline: 'none', lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box',
          }}
        />

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={scan} disabled={loading || !jd.trim()} style={{
            flex: 1, padding: '12px 0',
            background: loading || !jd.trim() ? 'var(--lp-bdr)' : 'var(--lp-teal)',
            color: loading || !jd.trim() ? 'var(--lp-text3)' : '#000',
            border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 800,
            cursor: loading || !jd.trim() ? 'default' : 'pointer', transition: 'all .15s',
          }}>
            {loading ? 'Scanning…' : 'Scan now →'}
          </button>
          <button onClick={() => setActiveModule?.('cover')} style={{
            padding: '12px 16px', background: 'transparent', border: '1px solid var(--lp-bdr)',
            color: 'var(--lp-text2)', borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            Generate cover letter →
          </button>
        </div>
      </div>

      {/* ── Right: results panel ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Empty / loading state */}
        {!result && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, color: 'var(--lp-text3)', gap: 12, opacity: .45 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <div style={{ fontSize: 13 }}>Paste a JD and click Scan now</div>
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 12 }}>
            <OrbitSpinner size={40} />
            <div style={{ color: 'var(--lp-text3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Analyzing match…</div>
          </div>
        )}

        {result && (
          <>
            {/* Match score card */}
            <div style={{ background: 'var(--lp-bg3)', border: '1px solid var(--lp-bdr)', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--lp-text3)' }}>Match score</div>
                {(result.company || form?.role) && (
                  <div style={{ background: scoreColor + '18', border: `1px solid ${scoreColor}33`, borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: scoreColor }}>
                    {result.company || form?.market} · {result.roleTitle || form?.role}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                <div style={{ fontFamily: 'var(--lp-ff)', fontSize: 52, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
                  {result.matchScore}<span style={{ fontSize: 20, color: 'var(--lp-text3)', fontWeight: 500 }}>/100</span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--lp-text2)', marginTop: 6 }}>{result.verdict}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(result.bars || []).map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 12, color: 'var(--lp-text2)', width: 140, flexShrink: 0 }}>{b.label}</div>
                    <div style={{ flex: 1, height: 6, background: 'var(--lp-bg2)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${b.score}%`, background: barColor(b.score), borderRadius: 3, transition: 'width .6s' }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: barColor(b.score), width: 24, textAlign: 'right', flexShrink: 0 }}>{b.score}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Missing keywords card */}
            <div style={{ background: 'var(--lp-bg3)', border: '1px solid var(--lp-bdr)', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--lp-text3)', marginBottom: 10 }}>Missing keywords</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {(result.missingKeywords || []).map((kw, i) => (
                  <span key={i} style={{
                    background: 'rgba(255,90,90,.1)', border: '1px solid rgba(255,90,90,.25)',
                    color: '#FF5A5A', borderRadius: 5, padding: '3px 9px', fontSize: 11, fontWeight: 600,
                  }}>{kw}</span>
                ))}
              </div>
              <button onClick={() => setActiveModule?.('ats')} style={{
                width: '100%', padding: '10px 0', background: 'var(--lp-bg2)',
                border: '1px solid var(--lp-bdr)', borderRadius: 8,
                color: 'var(--lp-text2)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
                Rewrite bullets with these keywords →
              </button>
            </div>

            {/* AI bubble */}
            <div style={{
              background: 'rgba(0,212,255,.04)', border: '1px solid rgba(0,212,255,.18)',
              borderLeft: '4px solid var(--lp-teal)', borderRadius: 10,
              padding: '14px 16px', display: 'flex', gap: 12,
            }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#00D4FF,#B026FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#000', flexShrink: 0 }}>AI</div>
              <div style={{ fontSize: 12.5, color: 'var(--lp-text)', lineHeight: 1.65 }}>{result.aiInsight}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ResumeScan({ resumeText, setResumeText, scanResult, setScanResult, form, memory, updateMemory, setActiveModule }) {
  const [scanning, setScanning] = useState(false);
  const [fileErr, setFileErr] = useState('');
  const [paste, setPaste] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [rawFile, setRawFile] = useState(null);
  const [localFile, setLocalFile] = useState(null);
  const [feedbackMode, setFeedbackMode] = useState('professional');
  const [scanLogSteps, setScanLogSteps] = useState([]);
  const [animScore, setAnimScore] = useState(0);
  const fileRef = useRef(null);

  // Derived state
  const history = memory?.scanHistory || [];
  const score = scanResult?.credibilityScore || 0;
  const gaugeColor = score >= 70 ? '#00e5a0' : score >= 50 ? '#f5c842' : '#ff5f6e';
  const { missing, matched } = deriveKeywords(scanResult);
  const progs = deriveProgBars(scanResult);

  // Animate score when result arrives
  useEffect(() => {
    if (!scanResult) { setAnimScore(0); return; }
    const target = scanResult.credibilityScore || 0;
    let cur = 0;
    const iv = setInterval(() => {
      cur += Math.ceil((target - cur) / 6);
      if (cur >= target) { setAnimScore(target); clearInterval(iv); }
      else setAnimScore(cur);
    }, 40);
    return () => clearInterval(iv);
  }, [scanResult]);

  const handleFile = async (file) => {
    if (!file) return;
    setFileErr('');
    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
    const ALLOWED = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED.includes(file.type) && ext !== 'pdf' && ext !== 'docx') {
      setFileErr('Only PDF and DOCX files are supported.'); return;
    }
    if (file.size > MAX_SIZE) {
      setFileErr('File too large — maximum 10 MB.'); return;
    }
    setRawFile(file);
    setLocalFile({ fileName: file.name, type: ext === 'pdf' ? 'pdf' : 'text' });
    setResumeText({ type: ext === 'pdf' ? 'pdf' : 'text', content: null, fileName: file.name });
    setScanResult(null);
  };

  const confirmPaste = () => {
    if (paste.trim().length < 50) { setFileErr('Resume text is too short.'); return; }
    setRawFile(null);
    setResumeText({ type: 'text', content: paste, fileName: 'Pasted Resume' });
    setLocalFile({ fileName: 'Pasted Resume', type: 'text' });
    setScanResult(null);
    setPasteOpen(false);
  };

  const runScan = async () => {
    if (!resumeText) return;
    setScanning(true);
    setScanResult(null);
    setScanLogSteps([]);
    setAnimScore(0);

    // Play through log steps
    let stepIdx = 0;
    const iv = setInterval(() => {
      if (stepIdx < LOG_STEPS.length) {
        const s = LOG_STEPS[stepIdx];
        setScanLogSteps(prev => [...prev, s]);
        setAnimScore(Math.round((stepIdx / LOG_STEPS.length) * 65));
        stepIdx++;
      }
    }, 900);

    try {
      const prompt = feedbackMode === 'snarky' ? buildSnarkyPrompt(targetRole) : buildScanPrompt(targetRole);
      let raw;
      let base64 = null;

      if (resumeText.type === 'pdf' && rawFile) {
        const arrayBuffer = await rawFile.arrayBuffer();
        base64 = arrayBufferToBase64(arrayBuffer);
        raw = await callLLM([{ role: 'user', content: prompt }], 8192, base64);
      } else {
        raw = await callLLM([{ role: 'user', content: `${prompt}\n\nResume Text:\n${resumeText.content}` }], 8192);
      }

      clearInterval(iv);

      const result = extractJSON(raw);
      if (result.error) throw new Error('Failed to parse AI response');

      setScanResult(result);

      if (updateMemory) {
        updateMemory(
          m => ({
            ...m,
            scanResult: result,
            ...(base64 ? { scanPdfBase64: base64, scanFileName: resumeText.fileName } : {}),
            scanHistory: [
              { date: new Date().toISOString(), score: result.credibilityScore, fileName: resumeText.fileName, result },
              ...(m.scanHistory || [])
            ].slice(0, 10)
          }),
          {
            table: 'resume_scans',
            data: {
              credibility_score: result.credibilityScore,
              file_name: resumeText.fileName,
              metrics_found: result.metricsFound,
              summary: result.summary || '',
              issues: result.issues || [],
              questions: result.interrogationQuestions || [],
              created_at: new Date().toISOString()
            }
          }
        );
      }
    } catch (e) {
      clearInterval(iv);
      setFileErr(e.message || 'Scan failed. Please try again.');
      console.error('[ResumeScan] Scan error:', e);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '18px 28px 16px', borderBottom: '1px solid var(--lp-bdr)' }}>
        <div style={{ color: 'var(--lp-text)', fontWeight: 900, fontSize: 22, marginBottom: 2 }}>ATS Scanner</div>
        <div style={{ color: 'var(--lp-text3)', fontSize: 13 }}>
          Paste any job description and get your match score in seconds, with AI fixes applied instantly.
        </div>
      </div>

      <JDMatchTab resumeText={resumeText} form={form} setActiveModule={setActiveModule} updateMemory={updateMemory} />

      {/* Deep Scan legacy — kept for reference only, not rendered */}
      {false && (
    <div className="rs-wrap">

      {/* ── LEFT PANEL ── */}
      <div className="rs-panel">
        <div className="rs-panel-head">
          <div className="rs-phtitle">Resume Scan</div>
          <div className="rs-phsub">Deep ATS · Issue Detector</div>
        </div>
        <div className="rs-panel-body">

          {/* Mode toggle */}
          <div>
            <div className="rs-mini-label">Feedback Mode</div>
            <div className="rs-mode-toggle">
              <button
                className={`rs-mode-btn${feedbackMode === 'professional' ? ' active-pro' : ''}`}
                onClick={() => setFeedbackMode('professional')}
              >
                ✦ Pro
              </button>
              <button
                className={`rs-mode-btn${feedbackMode === 'snarky' ? ' active-snarky' : ''}`}
                onClick={() => setFeedbackMode('snarky')}
              >
                🔥 Roast
              </button>
            </div>
            {feedbackMode === 'snarky' && (
              <div className="rs-snarky-notice" style={{ marginTop: 6 }}>
                Roast mode: AI will brutally call out every weak bullet, then give the XYZ fix.
              </div>
            )}
          </div>

          {/* Target role */}
          <div>
            <div className="rs-mini-label">Target Role</div>
            <input
              className="rs-role-input"
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Product Manager"
              disabled={scanning}
            />
          </div>

          {/* Upload / file zone */}
          <div>
            <div className="rs-mini-label">Resume File</div>
            {localFile ? (
              <div className="rs-file-loaded">
                <span className="rs-file-name">{localFile.fileName}</span>
                <button
                  className="rs-remove-btn"
                  onClick={() => { setLocalFile(null); setRawFile(null); setResumeText(null); setPaste(''); setScanResult(null); }}
                  disabled={scanning}
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <div
                  className={`rs-dropzone${dragOver ? ' dragover' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
                  onClick={() => !scanning && fileRef.current.click()}
                >
                  <div className="rs-dropzone-icon">📂</div>
                  <div className="rs-dropzone-title">Drop or click to upload</div>
                  <div className="rs-dropzone-sub">PDF · DOCX · TXT</div>
                  <button className="rs-browse-btn" tabIndex={-1}>Browse Files</button>
                  <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
                </div>
                <button className="rs-paste-toggle" onClick={() => setPasteOpen(!pasteOpen)}>
                  {pasteOpen ? '▲ hide text paste' : '▼ paste text instead'}
                </button>
                {pasteOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <textarea
                      className="rs-paste-area"
                      value={paste}
                      onChange={e => { setPaste(e.target.value); setFileErr(''); }}
                      placeholder="Paste full resume text..."
                      rows={5}
                    />
                    <button
                      className="rs-scan-btn"
                      onClick={confirmPaste}
                      disabled={paste.trim().length < 50}
                    >
                      Use This Text
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {fileErr && <div className="rs-err">⚠ {fileErr}</div>}

          {/* Scan button */}
          {(localFile || resumeText) && (
            <button
              className="rs-scan-btn"
              onClick={runScan}
              disabled={scanning}
            >
              {scanning ? 'Scanning...' : '⚡ Run Deep Scan'}
            </button>
          )}

          {/* History list */}
          {history.length > 0 && (
            <div className="rs-history-section">
              <div className="rs-history-label">Recent Scans</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {history.slice(0, 5).map((item, i) => {
                  const s = item.score || item.result?.credibilityScore || 0;
                  const sc = s >= 70 ? 'var(--rs-green)' : s >= 50 ? 'var(--rs-gold)' : 'var(--rs-red)';
                  return (
                    <div key={i} className="rs-hist-item">
                      <span className="rs-hist-name">{item.fileName}</span>
                      <span className="rs-hist-score" style={{ color: sc }}>{s}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CENTER PANEL ── */}
      <div className="rs-panel-center">
        <div className="rs-panel-head">
          <div className="rs-phtitle">
            {centerState === 'idle' && 'Issue Analysis'}
            {centerState === 'scanning' && 'Running Scan...'}
            {centerState === 'results' && `Issue Report — ${scanResult?.issues?.length || 0} flags`}
          </div>
          <div className="rs-phsub">
            {centerState === 'idle' && 'Upload a resume to start'}
            {centerState === 'scanning' && 'AI analysis in progress'}
            {centerState === 'results' && `${feedbackMode === 'snarky' ? 'Roast' : 'Professional'} mode · ${resumeText?.fileName || ''}`}
          </div>
        </div>

        {/* IDLE */}
        {centerState === 'idle' && (
          <div className="rs-idle-placeholder">
            <div className="rs-idle-icon">⚡</div>
            <div className="rs-idle-title">Deep Resume Scan</div>
            <div className="rs-idle-sub">
              Upload your resume and run a scan to get an ATS score, issue flags, and XYZ-format fix suggestions for every weak bullet.
            </div>
            <div className="rs-tip-list">
              <div className="rs-tip-row">
                <span className="rs-tip-key rs-xyz-x">X</span>
                <span>Result — what you achieved, with a number</span>
              </div>
              <div className="rs-tip-row">
                <span className="rs-tip-key rs-xyz-y">Y</span>
                <span>Action — what you specifically did</span>
              </div>
              <div className="rs-tip-row">
                <span className="rs-tip-key rs-xyz-z">Z</span>
                <span>Context — scale, team, tool, or setting</span>
              </div>
            </div>
          </div>
        )}

        {/* SCANNING */}
        {centerState === 'scanning' && (
          <div className="rs-scanning-wrap">
            <OrbitSpinner size={48} />
            <div className="rs-scanning-log">
              {scanLogSteps.map((s, i) => (
                <div key={i} className="rs-scan-log-row">
                  <span className="rs-log-ts">[{s.t}]</span>
                  <span className={s.c}>{s.cat}</span>
                  <span className="rs-log-msg">{s.msg}</span>
                </div>
              ))}
              {scanLogSteps.length < LOG_STEPS.length && (
                <div className="rs-scan-log-row">
                  <span className="rs-log-ts">[--:--]</span>
                  <span className="rs-tc-parse">…</span>
                  <span className="rs-log-msg"><span className="rs-log-cursor" /></span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* RESULTS */}
        {centerState === 'results' && (
          <div className="rs-results-area">
            {scanResult?.summary && (
              <div className="rs-summary-block">
                <div className="rs-summary-title">AI Verdict</div>
                <div className="rs-summary-text">{scanResult.summary}</div>
              </div>
            )}
            <div className="rs-section-head">Flagged Issues</div>
            {(scanResult?.issues || []).map((issue, i) => (
              <IssueCard key={i} issue={issue} />
            ))}

            {/* History cards below results */}
            {history.length > 0 && (
              <>
                <div className="rs-section-head" style={{ marginTop: 8 }}>Previous Scans</div>
                {history.map((item, i) => (
                  <ScanHistoryCard key={i} item={item} initExpanded={false} />
                ))}
              </>
            )}
          </div>
        )}

        {/* ATS Builder CTA */}
        {centerState === 'results' && history.length > 0 && setActiveModule && (
          <div className="rs-ats-cta">
            <div className="rs-ats-cta-text">
              Ready to fix these issues? Open ATS Builder with your resume pre-loaded.
            </div>
            <button className="rs-ats-cta-btn" onClick={() => setActiveModule('ats')}>
              Fix in ATS Builder →
            </button>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="rs-panel-right">
        <div className="rs-panel-head">
          <div className="rs-phtitle">ATS Metrics</div>
          <div className="rs-phsub">Score · Keywords · Questions</div>
        </div>
        <div className="rs-panel-body">

          {/* Gauge */}
          <div className="rs-gauge-wrap">
            <div className="rs-gauge-label">ATS Score</div>
            <ScoreGauge score={animScore} color={gaugeColor} />
            {scanResult && (
              <div style={{ display: 'flex', gap: 6, marginTop: 4, fontSize: 9, fontFamily: 'JetBrains Mono,monospace' }}>
                <span style={{ color: 'var(--rs-text3)' }}>Target:</span>
                <span style={{ color: 'var(--rs-green)' }}>85%+</span>
                {score < 85 && <span style={{ color: 'var(--rs-text3)' }}>· +{85 - score}% gap</span>}
              </div>
            )}
          </div>

          {/* Metric boxes */}
          {scanResult && (
            <div className="rs-metrics-row">
              <div className="rs-metric-box">
                <div className="rs-metric-val" style={{ color: 'var(--rs-cyan)' }}>{scanResult.metricsFound || 0}</div>
                <div className="rs-metric-lbl">Metrics</div>
              </div>
              <div className="rs-metric-box">
                <div className="rs-metric-val" style={{ color: 'var(--rs-red)' }}>{(scanResult.issues || []).filter(i => i.severity === 'critical').length}</div>
                <div className="rs-metric-lbl">Critical</div>
              </div>
              <div className="rs-metric-box">
                <div className="rs-metric-val" style={{ color: 'var(--rs-gold)' }}>{(scanResult.issues || []).filter(i => i.severity === 'warning').length}</div>
                <div className="rs-metric-lbl">Warnings</div>
              </div>
            </div>
          )}

          {/* Progress bars */}
          {scanResult && (
            <div className="rs-prog-section">
              <div className="rs-mini-label" style={{ marginBottom: 8 }}>Score Breakdown</div>
              <ProgBar label="Bullet Quality" value={progs.bullet} color="#00c8ff" />
              <ProgBar label="Metrics Coverage" value={progs.metrics} color="#00e5a0" />
              <ProgBar label="Ownership Signals" value={progs.ownership} color="#f5c842" />
            </div>
          )}

          {/* Keyword boxes */}
          {scanResult && (
            <>
              {missing.length > 0 && (
                <KeywordBox title="Missing Keywords" keywords={missing} variant="missing" />
              )}
              {matched.length > 0 && (
                <KeywordBox title="Matched ✓" keywords={matched} variant="matched" />
              )}
            </>
          )}

          {/* Interrogation questions */}
          {scanResult?.interrogationQuestions?.length > 0 && (
            <div className="rs-iq-section">
              <div className="rs-iq-header">
                <span className="rs-iq-title">Interrogation Questions</span>
                <span className="rs-iq-count">{scanResult.interrogationQuestions.length}</span>
              </div>
              {scanResult.interrogationQuestions.map((q, i) => (
                <div key={i} className="rs-iq-card">
                  <div className="rs-iq-num">{String(i + 1).padStart(2, '0')}</div>
                  <div className="rs-iq-body">
                    <div className="rs-iq-source-chip">{q.source}</div>
                    <div className="rs-iq-question">{q.question}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Placeholder when idle */}
          {!scanResult && !scanning && (
            <div style={{ textAlign: 'center', padding: '24px 12px' }}>
              <div style={{ fontSize: 28, opacity: .2, marginBottom: 8 }}>📊</div>
              <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono,monospace', color: 'var(--rs-text3)', lineHeight: 1.6 }}>
                Metrics, keywords, and questions will appear here after scanning.
              </div>
            </div>
          )}

          {/* Scanning placeholder */}
          {scanning && !scanResult && (
            <div style={{ textAlign: 'center', padding: '24px 12px' }}>
              <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono,monospace', color: 'var(--rs-text3)', lineHeight: 1.6 }}>
                Calculating score...
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
      )}
    </div>
  );
}
