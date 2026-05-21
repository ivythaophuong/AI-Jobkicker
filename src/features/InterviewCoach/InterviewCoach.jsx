import React, { useState } from 'react';
import HiringManagerSim from '../HiringManagerSim/HiringManagerSim';
import STARBuilder from '../STARBuilder/STARBuilder';
import WeaknessRadar from '../WeaknessRadar/WeaknessRadar';
import ReadinessScore from '../ReadinessScore/ReadinessScore';
import MemoryDashboard from '../MemoryDashboard/MemoryDashboard';

const TABS = [
  { id: 'dashboard',  label: 'Overview' },
  { id: 'study',      label: 'Study Modules' },
  { id: 'session',    label: 'Live Session' },
  { id: 'weakness',   label: 'Weakness Radar' },
  { id: 'starbank',   label: 'STAR Bank' },
  { id: 'aimemory',   label: 'AI Memory' },
];

const tabBarStyle = {
  display: 'flex', alignItems: 'center', gap: 4,
  padding: '8px 20px',
  background: 'rgba(0,212,255,.04)',
  borderBottom: '1px solid rgba(0,212,255,.1)',
  overflowX: 'auto', flexWrap: 'nowrap', scrollbarWidth: 'none',
};

const tabBtnStyle = (active) => ({
  padding: '5px 13px', borderRadius: 6, fontSize: 12, fontWeight: 600,
  color: active ? 'var(--lp-teal)' : 'var(--lp-text2)',
  background: active ? 'var(--lp-teal-dim)' : 'transparent',
  border: `1px solid ${active ? 'var(--lp-teal-b)' : 'transparent'}`,
  cursor: 'pointer', transition: 'all .15s',
  fontFamily: 'var(--lp-ff)', whiteSpace: 'nowrap', flexShrink: 0,
});

// ── Interview Coach Dashboard ─────────────────────────────────────────────────
function InterviewDashboard({ memory, onNavigate }) {
  const sessions    = memory?.mockSessions  || [];
  const starStories = memory?.starBank      || [];
  const scanResult  = memory?.scanHistory?.[0]?.result;

  const concreteScore  = Math.min(100, sessions.length * 20);
  const starScore      = Math.min(100, starStories.length * 12);
  const clarityScore   = Math.min(100, sessions.length * 25 + (scanResult ? 15 : 0));
  const overallScore   = Math.min(100, Math.round((concreteScore + starScore + clarityScore) / 3));

  const RED    = '#FF5A5A';
  const AMBER  = '#FFB84D';
  const GREEN  = '#00E5A0';
  const TEAL   = 'var(--lp-teal)';

  const metrics = [
    {
      label: 'Concrete examples', score: concreteScore,
      color: concreteScore < 40 ? RED : concreteScore < 70 ? AMBER : GREEN,
      tag:   concreteScore < 40 ? 'Priority 1' : concreteScore < 70 ? 'In progress' : 'Strong',
    },
    {
      label: 'STAR structure', score: starScore,
      color: starScore < 40 ? AMBER : starScore < 70 ? AMBER : GREEN,
      tag:   starScore < 40 ? 'Unlocks at 40' : starScore < 70 ? 'Building' : 'Strong',
    },
    {
      label: 'Clarity', score: clarityScore,
      color: clarityScore > 60 ? GREEN : AMBER,
      tag:   clarityScore > 60 ? 'Strong' : 'Needs work',
    },
    {
      label: 'Overall readiness', score: overallScore,
      color: TEAL,
      tag:   overallScore < 30 ? 'Getting started' : overallScore < 70 ? 'In progress' : 'Ready',
    },
  ];

  const weakest = [...metrics].slice(0, 3).sort((a, b) => a.score - b.score)[0];

  const plan = [
    {
      label: 'Concrete examples',
      desc:  'Anchor every answer with a specific number, outcome, or named result.',
      color: concreteScore < 40 ? RED : concreteScore < 70 ? AMBER : GREEN,
      tag:   concreteScore < 40 ? 'Weakest' : concreteScore < 70 ? 'In progress' : 'Done',
      bar:   concreteScore,
      unlocked: true,
      meta: `${Math.max(0, 3 - sessions.length)} sessions · ${sessions.length > 0 ? 'in progress' : 'start today'}`,
    },
    {
      label: 'STAR structure',
      desc:  'Situation · Task · Action · Result — every behavioural answer follows this arc.',
      color: starScore < 40 ? AMBER : GREEN,
      tag:   starScore < 40 ? 'Gap' : 'Building',
      bar:   starScore,
      unlocked: concreteScore >= 40,
      meta: `2 sessions · ${concreteScore < 40 ? 'unlocks after Concrete examples clears 40' : 'start now'}`,
    },
    {
      label: 'Clarity + delivery',
      desc:  'Maintenance sessions only — 1 drill per week to hold score above 70.',
      color: clarityScore > 60 ? GREEN : AMBER,
      tag:   clarityScore > 60 ? 'Good' : 'Needs work',
      bar:   clarityScore,
      unlocked: true,
      meta: '1 maintenance session/week',
    },
    {
      label: 'Salary negotiation roleplay',
      desc:  'Live AI roleplay · market data · pre-built scripts. Unlocks at readiness 75.',
      color: overallScore >= 75 ? GREEN : '#6B7E9F',
      tag:   overallScore >= 75 ? 'Unlocked' : 'Unlocks at 75',
      bar:   0,
      unlocked: overallScore >= 75,
      meta: 'Locked',
    },
  ];

  const daysLeft = Math.max(2, 9 - sessions.length * 2);

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Sub-header */}
      <div style={{ color: 'var(--lp-text3)', fontSize: 13 }}>
        {overallScore === 0
          ? 'Start your first session to calculate your readiness score.'
          : `You are ${overallScore}% interview-ready. ${weakest.label} is your critical unlock — one focused session today moves you to ${Math.min(100, overallScore + 9)}+.`}
      </div>

      {/* 4 metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {metrics.map((m, i) => (
          <div key={i} style={{
            background: 'var(--lp-bg3)', border: '1px solid var(--lp-bdr)',
            borderRadius: 10, padding: '16px 14px',
          }}>
            <div style={{ color: m.color, fontSize: 24, fontWeight: 900, lineHeight: 1, marginBottom: 6 }}>
              {m.score}<span style={{ fontSize: 13, color: 'var(--lp-text3)', fontWeight: 500 }}>/100</span>
            </div>
            <div style={{ color: 'var(--lp-text)', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              {m.label}
            </div>
            <div style={{ color: m.color, fontSize: 10, fontWeight: 800 }}>{m.tag}</div>
          </div>
        ))}
      </div>

      {/* AI bubble */}
      <div style={{
        background: 'var(--lp-bg3)',
        border: '1px solid rgba(0,212,255,.18)',
        borderLeft: '4px solid var(--lp-teal)',
        borderRadius: 10, padding: '14px 16px',
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%',
          background: 'var(--lp-teal)', color: '#000',
          fontSize: 9, fontWeight: 900,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginTop: 1,
        }}>AI</div>
        <div style={{ color: 'var(--lp-text2)', fontSize: 13, lineHeight: 1.65 }}>
          Biggest gap:{' '}
          <span style={{ color: 'var(--lp-teal)', fontWeight: 700 }}>{weakest.label}</span>
          {' '}at {weakest.score}/100. You describe situations well but omit numbers and named outcomes.
          Once you clear 70, STAR structure drills unlock.{' '}
          <span style={{ color: AMBER }}>
            Estimated interview-ready: {daysLeft} days at current pace.
          </span>
        </div>
      </div>

      {/* Recommended next */}
      <div style={{
        background: 'var(--lp-bg3)', border: '1px solid var(--lp-bdr)',
        borderRadius: 10, padding: '18px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <div>
          <div style={{ color: 'var(--lp-text3)', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>
            Recommended next — start now
          </div>
          <div style={{ color: 'var(--lp-text)', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
            {weakest.label} drill — behavioural questions
          </div>
          <div style={{ color: 'var(--lp-text3)', fontSize: 12 }}>
            20 min · targets your weakest dimension · session {sessions.length + 1} of 3
          </div>
        </div>
        <button
          onClick={() => onNavigate?.('session')}
          style={{
            background: 'var(--lp-teal)', color: '#000', border: 'none',
            borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 800,
            cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
          }}
        >
          Start session →
        </button>
      </div>

      {/* Readiness plan — 2×2 grid */}
      <div>
        <div style={{ color: 'var(--lp-text3)', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 10 }}>
          Your readiness plan
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {plan.map((p, i) => (
            <div key={i} style={{
              background: 'var(--lp-bg3)', border: '1px solid var(--lp-bdr)',
              borderRadius: 10, padding: '16px 14px',
              opacity: p.unlocked ? 1 : .55,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ color: 'var(--lp-text)', fontSize: 13, fontWeight: 700 }}>{p.label}</div>
                <span style={{
                  background: p.color, color: p.unlocked ? '#000' : 'var(--lp-bg)',
                  fontSize: 9, fontWeight: 800, borderRadius: 4, padding: '2px 7px',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>{p.tag}</span>
              </div>
              {/* Progress bar */}
              <div style={{ background: 'var(--lp-bg2)', borderRadius: 3, height: 3, marginBottom: 10 }}>
                <div style={{
                  background: p.color, borderRadius: 3, height: '100%',
                  width: `${p.bar}%`, transition: 'width .6s',
                }} />
              </div>
              <div style={{ color: 'var(--lp-text2)', fontSize: 12, lineHeight: 1.55 }}>{p.desc}</div>
              <div style={{ color: 'var(--lp-text3)', fontSize: 10, marginTop: 8, fontFamily: 'var(--lp-ffm, monospace)' }}>
                {p.meta}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function InterviewCoach(props) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Tab strip */}
      <div style={tabBarStyle}>
        <span style={{
          fontSize: 9, fontWeight: 800, color: 'var(--lp-teal)',
          textTransform: 'uppercase', letterSpacing: '.12em',
          flexShrink: 0, marginRight: 6, whiteSpace: 'nowrap',
        }}>
          ✦ INTERVIEW COACH
        </span>
        <div style={{ width: 1, height: 16, background: 'rgba(0,212,255,.15)', flexShrink: 0, marginRight: 2 }} />
        {TABS.map(tab => (
          <button
            key={tab.id}
            style={tabBtnStyle(activeTab === tab.id)}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'dashboard' && (
          <InterviewDashboard
            memory={props.memory}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === 'study'    && <HiringManagerSim {...props} />}
        {activeTab === 'session'  && <HiringManagerSim {...props} />}
        {activeTab === 'weakness' && <WeaknessRadar {...props} embedded />}
        {activeTab === 'starbank' && <STARBuilder {...props} embedded />}
        {activeTab === 'aimemory' && <MemoryDashboard {...props} embedded />}
      </div>
    </div>
  );
}
