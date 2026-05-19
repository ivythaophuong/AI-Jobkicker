import React, { useState, useEffect, useMemo } from 'react';
import { sb } from '../../lib/supabase';

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const s = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (s < 3600)  return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

function initials(name) {
  if (!name) return 'U';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ── Sub-components ────────────────────────────────────────────────────────────
function MetricCard({ value, label, delta, deltaUp, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--lp-bg3)',
        border: `1px solid ${color}22`,
        borderRadius: 10,
        padding: '14px 16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color .15s',
      }}
      onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = color + '44')}
      onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = color + '22')}
    >
      <div style={{ fontFamily: 'var(--lp-ff)', fontSize: 28, fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--lp-text2)', marginBottom: delta ? 4 : 0 }}>{label}</div>
      {delta && (
        <div style={{ fontSize: 10, color: deltaUp ? '#00E5A0' : 'var(--lp-text3)', fontFamily: 'var(--lp-ffm)' }}>
          {delta}
        </div>
      )}
    </div>
  );
}

function ProgressRow({ label, value, color, max = 100 }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <div style={{ fontSize: 12, color: 'var(--lp-text2)', width: 148, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 5, background: 'var(--lp-bg4, #1A2540)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width .7s ease' }} />
      </div>
      <div style={{ fontFamily: 'var(--lp-ffm)', fontSize: 11, color, width: 30, textAlign: 'right', flexShrink: 0 }}>
        {value > 0 ? value : '—'}
      </div>
    </div>
  );
}

function AiBubble({ children, style }) {
  return (
    <div style={{
      background: 'var(--lp-bg3)',
      border: '1px solid rgba(0,212,255,.18)',
      borderRadius: 10,
      padding: '14px 16px',
      display: 'flex',
      gap: 12,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--lp-ff)',
      ...style,
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top left, rgba(0,212,255,.04), transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#00D4FF,#B026FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#000', flexShrink: 0 }}>AI</div>
      <div style={{ fontSize: 12.5, color: 'var(--lp-text)', lineHeight: 1.65, flex: 1 }}>{children}</div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--lp-text3)', fontFamily: 'var(--lp-ffm)', marginBottom: 10 }}>
      {children}
    </div>
  );
}

// ── Activity icon map ─────────────────────────────────────────────────────────
const ACT_ICONS = { scan: '⚡', star: '⭐', jd: '🔍', mock: '🧠', cover: '✉️', salary: '💰' };
const ACT_COLORS = { scan: '#00D4FF', star: '#FFB800', jd: '#FF6B9D', mock: '#8B7CF6', cover: '#F5B340', salary: '#00E5A0' };

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Dashboard({ memory, form, user, setActiveModule }) {
  const [trustScore, setTrustScore] = useState(0);

  // Fetch trust score from candidate_trust_profiles
  useEffect(() => {
    if (!user?.id || !user?.token) return;
    sb.select('candidate_trust_profiles', { user_id: `eq.${user.id}` }, user.token)
      .then(rows => setTrustScore(rows?.[0]?.trust_score || 0))
      .catch(() => {});
  }, [user]);

  // Derived metrics
  const atsScore    = memory.scanHistory?.[0]?.score ?? 0;
  const readiness   = memory.mockSessions?.[0]?.avgScore ?? 0;
  const starCount   = memory.starBank?.length ?? 0;
  const jdCount     = memory.jdAnalyses?.length ?? 0;
  const coverCount  = memory.coverLetters?.length ?? 0;
  const totalScans  = memory.scanHistory?.length ?? 0;

  // Profile completeness (simple heuristic)
  const profilePct = Math.min(100, Math.round(
    (!!memory.resumeText ? 25 : 0) +
    (totalScans > 0 ? 20 : 0) +
    (starCount > 0 ? 20 : 0) +
    (jdCount > 0 ? 15 : 0) +
    (trustScore > 0 ? 20 : 0)
  ));

  // Activity feed — merge memory arrays by date, sort desc, take 6
  const activities = useMemo(() => {
    const rows = [
      ...(memory.scanHistory?.slice(0, 3).map(s => ({ type: 'scan', time: s.date || s.created_at, label: `Resume scanned · ATS ${s.score ?? '—'}` })) || []),
      ...(memory.starBank?.slice(0, 2).map(s => ({ type: 'star', time: s.date || s.created_at, label: `STAR saved: ${s.bankAs || s.oneLiner?.slice(0, 36) || 'Story'}` })) || []),
      ...(memory.jdAnalyses?.slice(0, 2).map(j => ({ type: 'jd', time: j.date || j.created_at, label: `JD match: ${j.roleTitle || 'Role'} · ${j.matchScore ?? '—'}%` })) || []),
      ...(memory.mockSessions?.slice(0, 1).map(m => ({ type: 'mock', time: m.date || m.created_at, label: `Interview session · ${m.questionsCount ?? '—'} questions` })) || []),
      ...(memory.coverLetters?.slice(0, 1).map(c => ({ type: 'cover', time: c.date || c.created_at, label: `Cover letter: ${c.roleTitle || 'Role'}` })) || []),
    ];
    return rows.filter(r => r.time).sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6);
  }, [memory]);

  // AI insight text
  const aiInsight = useMemo(() => {
    const gaps = [];
    if (atsScore < 70)    gaps.push(`ATS score ${atsScore}/100 — paste a JD in ATS Builder to close keyword gaps`);
    if (starCount < 3)    gaps.push(`only ${starCount} STAR ${starCount === 1 ? 'story' : 'stories'} saved — aim for 8+ to cover all question types`);
    if (readiness < 70)   gaps.push(`interview readiness ${readiness}/100 — run a mock session in Interview Coach`);
    if (trustScore < 65)  gaps.push(`trust score ${trustScore}/100 — verify credentials to unlock TrustMatch`);
    if (gaps.length === 0) return `Profile looks strong — ${profilePct}% complete. Keep running mock sessions to stay sharp.`;
    return `Top priority: ${gaps[0]}.${gaps[1] ? ` Also: ${gaps[1]}.` : ''}`;
  }, [atsScore, starCount, readiness, trustScore, profilePct]);

  const firstName = user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto', fontFamily: 'var(--lp-ff)', color: 'var(--lp-text)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--lp-ff)', fontSize: 20, fontWeight: 800, color: 'var(--lp-text)', letterSpacing: '-.02em' }}>
            {greeting}, {firstName}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--lp-text2)', marginTop: 3 }}>
            Profile {profilePct}% complete
            {form?.role ? ` · targeting ${form.role}` : ''}
            {form?.market ? ` · ${form.market}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setActiveModule('aichat')} style={btnStyle('secondary')}>🤖 Ask AI Coach</button>
          <button onClick={() => setActiveModule('simulate')} style={btnStyle('primary')}>Continue prep →</button>
        </div>
      </div>

      {/* Metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
        <MetricCard value={atsScore > 0 ? atsScore : '—'} label="ATS score" color="#00D4FF"
          delta={atsScore > 0 ? (atsScore >= 80 ? '✓ Strong' : '↑ Needs work') : 'No scans yet'}
          deltaUp={atsScore >= 80} onClick={() => setActiveModule('scan')} />
        <MetricCard value={readiness > 0 ? readiness : '—'} label="Interview readiness" color="#F5B340"
          delta={readiness > 0 ? `${100 - readiness} pts to go` : 'No sessions yet'}
          onClick={() => setActiveModule('simulate')} />
        <MetricCard value={starCount} label="STAR stories" color="#FFB800"
          delta={starCount >= 8 ? '✓ Solid bank' : `target: 8`}
          deltaUp={starCount >= 8} onClick={() => setActiveModule('star')} />
        <MetricCard value={trustScore > 0 ? trustScore : '—'} label="Trust score" color={trustScore >= 65 ? '#00E5A0' : '#FF6B6B'}
          delta={trustScore >= 65 ? '✓ TrustMatch unlocked' : 'Verify creds → +50 pts'}
          deltaUp={trustScore >= 65} onClick={() => setActiveModule('trustmatch')} />
        <MetricCard value={jdCount} label="JDs analyzed" color="#8B7CF6"
          delta={jdCount > 0 ? `${jdCount} role${jdCount !== 1 ? 's' : ''} scanned` : 'Scan a JD →'}
          onClick={() => setActiveModule('jd')} />
      </div>

      {/* AI Memory + Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        <AiBubble>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--lp-teal)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6, fontFamily: 'var(--lp-ffm)' }}>
            AI Memory · live
          </div>
          <div style={{ marginBottom: 10 }}>{aiInsight}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => setActiveModule('simulate')} style={btnStyle('outline-sm')}>Start drill →</button>
            <button onClick={() => setActiveModule('aichat')} style={btnStyle('ghost-sm')}>Ask AI why</button>
          </div>
        </AiBubble>

        <div style={cardStyle}>
          <SectionLabel>Jump back in</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              { label: '⚡ Scan resume vs new JD',          id: 'scan'     },
              { label: '🧠 Continue interview prep',         id: 'simulate' },
              { label: '⭐ Add a STAR story',                id: 'star'     },
              { label: '✉️ Generate cover letter',           id: 'cover'    },
              { label: '📊 Check skills gap',                id: 'skillsgap'},
            ].map(a => (
              <button key={a.id} onClick={() => setActiveModule(a.id)} style={btnStyle('full-secondary')}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        <div style={cardStyle}>
          <SectionLabel>Platform progress</SectionLabel>
          <ProgressRow label="Resume completeness"    value={atsScore}    color="#00D4FF" />
          <ProgressRow label="Interview readiness"    value={readiness}   color="#F5B340" />
          <ProgressRow label="STAR bank"              value={Math.min(100, starCount * 12)} color="#FFB800" />
          <ProgressRow label="JDs analyzed"           value={Math.min(100, jdCount * 10)}  color="#FF6B9D" />
          <ProgressRow label="Trust score"            value={trustScore}  color={trustScore >= 65 ? '#00E5A0' : '#FF6B6B'} />
          <ProgressRow label="Cover letters"          value={Math.min(100, coverCount * 20)} color="#8B7CF6" />
        </div>

        <div style={cardStyle}>
          <SectionLabel>Recent activity</SectionLabel>
          {activities.length === 0 ? (
            <div style={{ fontSize: 12.5, color: 'var(--lp-text3)', padding: '12px 0' }}>
              No activity yet — start with a resume scan.
            </div>
          ) : (
            activities.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < activities.length - 1 ? '1px solid var(--lp-bdr)' : 'none' }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: ACT_COLORS[a.type] + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
                  {ACT_ICONS[a.type]}
                </div>
                <div style={{ flex: 1, fontSize: 12.5, color: 'var(--lp-text)', lineHeight: 1.4 }}>{a.label}</div>
                <div style={{ fontSize: 11, color: 'var(--lp-text3)', fontFamily: 'var(--lp-ffm)', flexShrink: 0, marginTop: 1 }}>{timeAgo(a.time)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Comparison table */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <SectionLabel>Why CareerAiHub vs 5 separate tools</SectionLabel>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', background: 'linear-gradient(90deg,rgba(99,102,241,.18),rgba(236,72,153,.12))', color: '#8B7CF6', border: '1px solid rgba(139,124,246,.22)', borderRadius: 20, padding: '2px 8px', fontFamily: 'var(--lp-ffm)' }}>
            Investor view
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Feature', 'CareerAiHub', 'LinkedIn Premium', 'Resume.io', 'Interviewing.io', 'Levels.fyi'].map(h => (
                  <th key={h} style={{ fontFamily: 'var(--lp-ffm)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--lp-text3)', textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid var(--lp-bdr)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['AI resume rewriting',      '✓ Included',    '—',          '✓ Limited', '—',         '—'],
                ['ATS scanning vs JD',       '✓ Unlimited',   '—',          '✓ Paid',    '—',         '—'],
                ['AI interview coaching',    '✓ AI-scored',   '—',          '—',         '✓ Human',   '—'],
                ['Salary benchmarking',      '✓ SEA-specific','✓ Limited',  '—',         '—',         '✓ US-only'],
                ['Credential verification',  '✓ In dev',      '—',          '—',         '—',         '—'],
                ['AI memory across sessions','✓ Full',        '—',          '—',         '—',         '—'],
                ['Monthly cost',             'SGD 24',        '~SGD 54',    '~SGD 34',   '~SGD 54',   '~SGD 27'],
              ].map((row, ri) => (
                <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,.03)' }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ padding: '8px 10px', color: ci === 0 ? 'var(--lp-text)' : ci === 1 ? (cell.startsWith('✓') ? '#00E5A0' : 'var(--lp-teal)') : cell === '—' ? 'var(--lp-text3)' : 'var(--lp-text2)', fontWeight: ci === 0 ? 500 : 400, verticalAlign: 'top' }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────
const cardStyle = {
  background: 'var(--lp-bg2)',
  border: '1px solid var(--lp-bdr)',
  borderRadius: 10,
  padding: '16px 18px',
};

function btnStyle(variant) {
  const base = { fontFamily: 'var(--lp-ff, DM Sans, sans-serif)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 7, fontWeight: 600, fontSize: 12, transition: 'all .14s', border: 'none', whiteSpace: 'nowrap' };
  if (variant === 'primary')        return { ...base, background: 'var(--lp-teal, #00D4FF)', color: '#000', padding: '8px 16px' };
  if (variant === 'secondary')      return { ...base, background: 'var(--lp-bg3)', color: 'var(--lp-text)', border: '1px solid var(--lp-bdr2)', padding: '8px 14px' };
  if (variant === 'outline-sm')     return { ...base, background: 'transparent', color: 'var(--lp-teal)', border: '1px solid rgba(0,212,255,.25)', padding: '5px 12px', fontSize: 11 };
  if (variant === 'ghost-sm')       return { ...base, background: 'var(--lp-bg3)', color: 'var(--lp-text2)', border: '1px solid var(--lp-bdr)', padding: '5px 12px', fontSize: 11 };
  if (variant === 'full-secondary') return { ...base, background: 'var(--lp-bg3)', color: 'var(--lp-text2)', border: '1px solid var(--lp-bdr)', padding: '8px 12px', width: '100%', justifyContent: 'flex-start', fontSize: 12.5 };
  return base;
}
