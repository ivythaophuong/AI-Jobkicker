import React, { useState, useEffect } from 'react';
import { C } from '../../styles/theme';
import { callLLM, extractJSON } from '../../lib/ai.jsx';
import { OrbitSpinner } from '../../components/OrbitMark';
import '../../styles/featurePage.css';

// ── Shared helpers ────────────────────────────────────────────────────────────
function SLabel({ children }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--lp-text3)', marginBottom: 10 }}>
      {children}
    </div>
  );
}

function AiBubble({ children }) {
  return (
    <div style={{
      background: 'var(--lp-bg3)', border: '1px solid rgba(0,212,255,.18)',
      borderLeft: '4px solid var(--lp-teal)',
      borderRadius: 10, padding: '14px 16px',
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        background: 'linear-gradient(135deg,#00D4FF,#B026FF)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 900, color: '#000', flexShrink: 0,
      }}>AI</div>
      <div style={{ fontSize: 12.5, color: 'var(--lp-text)', lineHeight: 1.65, flex: 1 }}>{children}</div>
    </div>
  );
}

// ── Market Data Tab ───────────────────────────────────────────────────────────
function getStaticFallback(form) {
  const role    = form?.role    || 'Professional';
  const level   = form?.level   || 'Senior';
  const market  = form?.market  || 'Singapore';
  const cur     = market === 'Singapore' ? 'SGD' : market === 'Malaysia' ? 'MYR' : market === 'Australia' ? 'AUD' : 'USD';

  const LEVEL_ROWS = [
    { label: 'Junior',    range: '3–6K',   pct: 30  },
    { label: 'Mid',       range: '6–10K',  pct: 55  },
    { label: 'Senior',    range: '9–15K',  pct: 75  },
    { label: 'Principal', range: '13–20K', pct: 90  },
    { label: 'VP / Head', range: '18K+',   pct: 100 },
  ];
  const userIdx = LEVEL_ROWS.findIndex(r => level.toLowerCase().includes(r.label.toLowerCase()));
  const levels = LEVEL_ROWS.map((r, i) => ({ ...r, isUser: i === (userIdx >= 0 ? userIdx : 2) }));

  return {
    levels,
    companies: [
      { name: 'Top tech co.',  role: level, p50: `${cur} 9K`,  p75: `${cur} 12K`  },
      { name: 'Regional tech', role: level, p50: `${cur} 8K`,  p75: `${cur} 10K`  },
      { name: 'Startup',       role: level, p50: `${cur} 7K`,  p75: `${cur} 9.5K` },
      { name: 'MNC',           role: level, p50: `${cur} 10K`, p75: `${cur} 13K`  },
      { name: 'Scale-up',      role: level, p50: `${cur} 8.5K`, p75: `${cur} 11K` },
    ],
    totalComp: {
      base:   `${cur} 9–13K / mo`,
      bonus:  '10–15% of base',
      rsus:   `${cur} 20–60K over 4yr`,
      target: `${cur} 120–180K / yr`,
    },
    aiInsight: `Market data for ${level} ${role} in ${market}. Use the Negotiation tab to get a personalised script based on your actual offer.`,
  };
}

function MarketDataTab({ form, memory, updateMemory, showToast }) {
  const cached = memory?.salaryMarket;
  const [data, setData]       = useState(cached?.data || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!data) loadMarket();
    // eslint-disable-next-line
  }, []);

  const loadMarket = async () => {
    setLoading(true);
    try {
      const raw = await callLLM([{ role: 'user', content:
        `You are a compensation analyst for ${form?.market || 'Singapore'} tech roles.
Role family: ${form?.role || 'Product Manager'}
Market: ${form?.market || 'Singapore'}

Return ONLY raw JSON (no markdown, start with {):
{
  "levels": [
    {"label":"Associate PM","range":"4–7K","pct":40,"isUser":false},
    {"label":"PM","range":"7–11K","pct":60,"isUser":false},
    {"label":"Senior PM","range":"9–15K","pct":78,"isUser":true},
    {"label":"Principal PM","range":"13–20K","pct":90,"isUser":false},
    {"label":"VP / Head of Product","range":"18K+","pct":100,"isUser":false}
  ],
  "companies": [
    {"name":"Grab","role":"Sr PM","p50":"SGD 11K","p75":"SGD 13.5K"},
    {"name":"Sea Limited","role":"Sr PM","p50":"SGD 10K","p75":"SGD 12K"},
    {"name":"ByteDance","role":"PM","p50":"SGD 9.5K","p75":"SGD 12K"},
    {"name":"Shopee","role":"Sr PM","p50":"SGD 9K","p75":"SGD 11K"},
    {"name":"Lazada","role":"Sr PM","p50":"SGD 8.5K","p75":"SGD 10.5K"}
  ],
  "totalComp": {
    "base":"SGD 11–13K / mo",
    "bonus":"10–15% of base",
    "rsus":"SGD 30–80K over 4yr",
    "target":"SGD 165–185K / yr"
  },
  "aiInsight": "2-sentence personalized insight about their market position and anchor strategy"
}` }], 900);
      const parsed = extractJSON(raw);
      if (parsed.error) throw new Error(parsed.msg);
      setData(parsed);
      if (updateMemory) updateMemory(m => ({ ...m, salaryMarket: { data: parsed, forRole: form?.role, computedAt: new Date().toISOString() } }));
    } catch {
      setData(getStaticFallback(form));
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 }}>
        <OrbitSpinner size={40} />
        <div style={{ color: 'var(--lp-text3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Loading market data…</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

        {/* Left: salary range bars */}
        <div>
          <div style={{ background: 'var(--lp-bg3)', border: '1px solid var(--lp-bdr)', borderRadius: 12, padding: '18px 20px', marginBottom: 16 }}>
            <SLabel>{form?.market || 'Singapore'} {form?.role || 'PM'} salary ranges · 2026</SLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(data.levels || []).map((lv, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 140, fontSize: 12.5, color: lv.isUser ? 'var(--lp-teal)' : 'var(--lp-text2)', fontWeight: lv.isUser ? 700 : 400, flexShrink: 0 }}>
                    {lv.label}{lv.isUser ? ' — You' : ''}
                  </div>
                  <div style={{ flex: 1, height: 8, background: 'var(--lp-bg2)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${lv.pct}%`, borderRadius: 4,
                      background: lv.isUser
                        ? 'linear-gradient(90deg,var(--lp-teal),#00E5A0)'
                        : 'rgba(255,255,255,.12)',
                      transition: 'width .6s',
                    }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: lv.isUser ? 700 : 400, color: lv.isUser ? 'var(--lp-teal)' : 'var(--lp-text3)', width: 56, textAlign: 'right', flexShrink: 0 }}>
                    {lv.range}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI bubble */}
          <AiBubble>
            {data.aiInsight}
          </AiBubble>
        </div>

        {/* Right: company benchmarks + total comp */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--lp-bg3)', border: '1px solid var(--lp-bdr)', borderRadius: 12, padding: '18px 20px' }}>
            <SLabel>Company benchmarks</SLabel>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--lp-bdr)' }}>
                  {['Company', 'Role', 'P50', 'P75'].map(h => (
                    <th key={h} style={{ padding: '4px 8px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--lp-text3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.companies || []).map((co, i) => (
                  <tr key={i} style={{ borderBottom: i < data.companies.length - 1 ? '1px solid var(--lp-bdr)' : 'none' }}>
                    <td style={{ padding: '10px 8px', fontSize: 13, fontWeight: 600, color: 'var(--lp-text)' }}>{co.name}</td>
                    <td style={{ padding: '10px 8px', fontSize: 12, color: 'var(--lp-text3)' }}>{co.role}</td>
                    <td style={{ padding: '10px 8px', fontSize: 12, color: 'var(--lp-text2)' }}>{co.p50}</td>
                    <td style={{ padding: '10px 8px', fontSize: 12, color: 'var(--lp-text2)' }}>{co.p75}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background: 'var(--lp-bg3)', border: '1px solid var(--lp-bdr)', borderRadius: 12, padding: '18px 20px' }}>
            <SLabel>Total comp breakdown</SLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { k: 'Base salary', v: data.totalComp?.base },
                { k: 'Annual bonus', v: data.totalComp?.bonus },
                { k: 'RSUs (at Grab/Sea)', v: data.totalComp?.rsus },
              ].map(({ k, v }) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 12.5, color: 'var(--lp-text2)' }}>{k}</span>
                  <span style={{ fontSize: 12.5, color: 'var(--lp-text)', fontWeight: 600 }}>{v}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--lp-bdr)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--lp-teal)' }}>Target total comp</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--lp-teal)' }}>{data.totalComp?.target}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Negotiation Roleplay Tab ──────────────────────────────────────────────────
function NegotiationTab({ form, resumeText, showToast }) {
  const [offer, setOffer]   = useState('');
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [stage, setStage]     = useState('received_offer');

  const STAGES = [
    { id: 'received_offer', label: 'Got an Offer'      },
    { id: 'pre_interview',  label: 'Before Interviews' },
    { id: 'negotiating',    label: 'Mid-Negotiation'   },
    { id: 'counter_offer',  label: 'Counter Offer'     },
  ];

  const analyze = async () => {
    if (!offer.trim()) { showToast('Describe your current offer or situation', 'error'); return; }
    setLoading(true); setResult(null);
    try {
      const resumeCtx = resumeText
        ? (typeof resumeText === 'string' ? resumeText : resumeText.content || '') : '';
      const raw = await callLLM([{ role: 'user', content:
        `You are a salary negotiation coach for ${form?.market || 'global'} tech.
Role: ${form?.role || 'Not specified'} · Stage: ${stage}
Situation: ${offer}
Target: ${target || 'Not specified'}
Resume: ${resumeCtx.slice(0, 600) || 'Not provided'}
Return ONLY raw JSON (start with {):
{"marketMin":"$X","marketMid":"$X","marketMax":"$X","assessment":"2-3 sentence honest market position","scripts":[{"label":"Opening Move","text":"ready-to-say script"},{"label":"When They Push Back","text":"counter script"},{"label":"Closing Strong","text":"closing script"}],"leverage":["point 1","point 2","point 3"],"winCondition":"what success looks like"}
Be specific. Scripts must be ready to say out loud.` }], 1200);
      const parsed = extractJSON(raw);
      if (parsed.error) throw new Error(parsed.msg);
      setResult(parsed);
    } catch (e) { showToast('Analysis failed: ' + e.message, 'error'); }
    setLoading(false);
  };

  const inp = {
    width: '100%', background: 'var(--lp-bg2)', border: '1px solid var(--lp-bdr)',
    borderRadius: 8, color: 'var(--lp-text)', padding: '10px 12px',
    fontSize: 13, outline: 'none', boxSizing: 'border-box', lineHeight: 1.6,
  };

  return (
    <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
      {/* Left: input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Stage tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STAGES.map(s => (
            <button key={s.id} onClick={() => setStage(s.id)} style={{
              background: stage === s.id ? 'rgba(0,212,255,.12)' : 'transparent',
              border: `1px solid ${stage === s.id ? 'var(--lp-teal)' : 'var(--lp-bdr)'}`,
              color: stage === s.id ? 'var(--lp-teal)' : 'var(--lp-text3)',
              borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>{s.label}</button>
          ))}
        </div>

        <div>
          <SLabel>Current offer / situation</SLabel>
          <textarea value={offer} onChange={e => setOffer(e.target.value)}
            placeholder={`e.g. "I got an offer for $95k base + 10% bonus for a ${form?.role || 'Software Engineer'} role at a mid-sized tech firm."`}
            style={{ ...inp, minHeight: 110, resize: 'vertical' }}
          />
        </div>

        <div>
          <SLabel>Your target (optional)</SLabel>
          <input value={target} onChange={e => setTarget(e.target.value)}
            placeholder="e.g. $115k minimum" style={inp} />
        </div>

        <button onClick={analyze} disabled={loading || !offer.trim()} style={{
          width: '100%', padding: '12px 0',
          background: loading ? 'var(--lp-bdr)' : 'var(--lp-teal)',
          color: loading ? 'var(--lp-text3)' : '#000',
          border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 800,
          cursor: loading || !offer.trim() ? 'default' : 'pointer',
        }}>
          {loading ? 'Analyzing…' : 'Get negotiation strategy →'}
        </button>
      </div>

      {/* Right: results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {!result && !loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'var(--lp-text3)', fontSize: 13, opacity: .5, textAlign: 'center' }}>
            Fill in your situation and click Get strategy to see your scripts and market position.
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 12 }}>
            <OrbitSpinner size={36} />
            <div style={{ color: 'var(--lp-text3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Analyzing market position…</div>
          </div>
        )}

        {result && (
          <>
            {/* Market range */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'Market min', v: result.marketMin, color: 'var(--lp-text3)' },
                { label: 'Median',     v: result.marketMid, color: '#FFB84D' },
                { label: 'Max',        v: result.marketMax, color: '#00E5A0' },
              ].map(m => (
                <div key={m.label} style={{ background: 'var(--lp-bg3)', border: '1px solid var(--lp-bdr)', borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: 'var(--lp-text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: m.color }}>{m.v}</div>
                </div>
              ))}
            </div>

            {/* Assessment */}
            <AiBubble>{result.assessment}</AiBubble>

            {/* Scripts */}
            {result.scripts?.map((s, i) => (
              <div key={i} style={{ background: 'var(--lp-bg3)', border: '1px solid var(--lp-bdr)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: '#FFB84D', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 13, color: 'var(--lp-text)', lineHeight: 1.75, fontStyle: 'italic', borderLeft: '3px solid var(--lp-teal)', paddingLeft: 12 }}>"{s.text}"</div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ── Your Strategy Tab ─────────────────────────────────────────────────────────
function StrategyTab({ form }) {
  const role   = form?.role   || 'your target role';
  const market = form?.market || 'Singapore';

  const scripts = [
    {
      title: 'Anchor high — first number wins',
      body: `"Based on my research into ${market} market rates for ${role} and my ${form?.level || 'senior'}-level experience, I'm targeting a base of [X]. I'm excited about this role and I believe we can find a number that works."`,
      color: 'var(--lp-teal)',
    },
    {
      title: 'When they ask your current salary',
      body: `"I'd prefer to keep that private, but I can tell you that I'm looking for compensation in line with market rates for this level — which based on my research is [range]. Does that work for your budget?"`,
      color: '#FFB84D',
    },
    {
      title: 'Closing on total comp',
      body: `"The base works for me. Can we talk about the equity component? I've seen similar roles at [competitor] include [X RSUs] over 4 years — is there flexibility there?"`,
      color: '#00E5A0',
    },
  ];

  const checklist = [
    'Research P50 and P75 for your exact level + company',
    'Know your BATNA (best alternative to a negotiated agreement)',
    'Never accept on the spot — ask for time to review',
    'Negotiate base, bonus, RSUs, and start date separately',
    'Get the final offer in writing before giving notice',
    'Counter at least once — 80% of companies expect it',
  ];

  return (
    <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
      {/* Left: script cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <SLabel>Word-for-word scripts</SLabel>
        {scripts.map((s, i) => (
          <div key={i} style={{ background: 'var(--lp-bg3)', border: '1px solid var(--lp-bdr)', borderLeft: `4px solid ${s.color}`, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--lp-text)', marginBottom: 10 }}>{s.title}</div>
            <div style={{ fontSize: 12.5, color: 'var(--lp-text2)', lineHeight: 1.75, fontStyle: 'italic' }}>{s.body}</div>
          </div>
        ))}
      </div>

      {/* Right: checklist */}
      <div style={{ background: 'var(--lp-bg3)', border: '1px solid var(--lp-bdr)', borderRadius: 12, padding: '18px 20px' }}>
        <SLabel>Negotiation checklist</SLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {checklist.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, border: '1.5px solid var(--lp-bdr2, rgba(255,255,255,.12))', flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12.5, color: 'var(--lp-text2)', lineHeight: 1.5 }}>{item}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const TABS = [
  { id: 'market',    label: 'Market data'         },
  { id: 'roleplay',  label: 'Negotiation roleplay' },
  { id: 'strategy',  label: 'Your strategy'        },
];

export default function SalaryCoach({ resumeText, form, memory, updateMemory, showToast }) {
  const [tab, setTab] = useState('market');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'var(--lp-ff)' }}>
      {/* Header */}
      <div style={{ padding: '18px 24px 0', borderBottom: '1px solid var(--lp-bdr)' }}>
        <div style={{ color: 'var(--lp-text)', fontWeight: 900, fontSize: 22, marginBottom: 2 }}>Salary Prep</div>
        <div style={{ color: 'var(--lp-text3)', fontSize: 13, marginBottom: 0 }}>
          {form?.market || 'Singapore'} {form?.role || 'PM'} market data for your level, AI negotiation roleplay, and your personalised anchoring strategy.
        </div>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0, marginTop: 14 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '10px 18px', fontSize: 13,
              fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? 'var(--lp-teal)' : 'var(--lp-text3)',
              background: 'transparent', border: 'none',
              borderBottom: `2px solid ${tab === t.id ? 'var(--lp-teal)' : 'transparent'}`,
              cursor: 'pointer', fontFamily: 'var(--lp-ff)', whiteSpace: 'nowrap',
              transition: 'all .15s',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      {tab === 'market'   && <MarketDataTab   form={form} memory={memory} updateMemory={updateMemory} showToast={showToast} />}
      {tab === 'roleplay' && <NegotiationTab  form={form} resumeText={resumeText} showToast={showToast} />}
      {tab === 'strategy' && <StrategyTab     form={form} />}
    </div>
  );
}
