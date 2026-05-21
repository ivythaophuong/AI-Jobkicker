import React from 'react';
import { C } from '../../styles/theme';

const s = {
  wrap:   { padding: '26px 28px' },
  header: { marginBottom: 22 },
  title:  { fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, color: 'var(--lp-text)', letterSpacing: '-.02em' },
  sub:    { fontSize: 12.5, color: 'var(--lp-text2)', marginTop: 3 },
  grid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 },
  card:   { background: 'var(--lp-bg2)', border: '1px solid var(--lp-bdr)', borderRadius: 12, padding: '18px 20px' },
  secLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--lp-text3)', marginBottom: 12, fontFamily: 'var(--lp-mono, monospace)' },
  credRow: { display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--lp-bdr)' },
  credName: { fontSize: 13, fontWeight: 600, color: 'var(--lp-text)', marginBottom: 2 },
  credIssuer: { fontSize: 11, color: 'var(--lp-text2)' },
  verifyBtn: { marginLeft: 'auto', flexShrink: 0, background: C.accent, color: '#000', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  verifiedBadge: { marginLeft: 'auto', flexShrink: 0, background: 'rgba(0,229,144,.1)', color: C.green, border: `1px solid rgba(0,229,144,.2)`, borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700 },
  devBanner: { background: 'rgba(255,184,77,.06)', border: '1px solid rgba(255,184,77,.18)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 12.5, color: 'var(--lp-text2)' },
};

const CREDS = [
  { icon: '🎓', name: 'University Degree', issuer: 'Upload official transcript or use direct-verify', status: 'unverified' },
  { icon: '🏢', name: 'Current Employment', issuer: 'Connect via LinkedIn or upload employment letter', status: 'unverified' },
  { icon: '📜', name: 'Google Analytics Certified', issuer: 'Google · Credly badge', status: 'verified' },
  { icon: '📜', name: 'AWS Cloud Practitioner', issuer: 'Amazon · Upload certificate', status: 'unverified' },
];

export default function VerifyCreds({ memory, setActiveModule }) {
  const trustScore = 12; // placeholder until trust score is computed from memory

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.title}>Verify Credentials</div>
        <div style={s.sub}>Blockchain-anchored verification · Trust score powers TrustMatch recruiter visibility</div>
      </div>

      <div style={s.devBanner}>
        <strong style={{ color: 'var(--lp-amber, #FFB84D)' }}>⚠ In Development</strong> — Blockchain anchoring and university direct-verify are being built. You can upload certificates now and they'll be auto-verified on launch.
      </div>

      <div style={s.grid}>
        {/* Trust score panel */}
        <div style={s.card}>
          <div style={s.secLabel}>Your trust score</div>
          <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 900, color: C.red, lineHeight: 1 }}>{trustScore}</div>
            <div style={{ fontSize: 12, color: 'var(--lp-text2)', marginTop: 4 }}>/ 100</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {[
              { label: 'Education', val: 0, color: C.red },
              { label: 'Work experience', val: 0, color: C.red },
              { label: 'Certifications', val: 12, color: C.gold },
              { label: 'Skills assessments', val: 0, color: 'var(--lp-text3)' },
            ].map((row) => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--lp-text2)', width: 130, flexShrink: 0 }}>{row.label}</span>
                <div style={{ flex: 1, height: 5, background: 'var(--lp-bg3, #141829)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${row.val}%`, background: row.color, borderRadius: 3 }} />
                </div>
                <span style={{ fontFamily: 'var(--lp-mono, monospace)', fontSize: 11, color: row.color, width: 24, textAlign: 'right' }}>{row.val}</span>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(0,212,255,.05)', border: '1px solid rgba(0,212,255,.12)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--lp-text2)', lineHeight: 1.6 }}>
            Verify your degree + 1 cert to reach <strong style={{ color: C.accent }}>65+</strong> — unlocks TrustMatch recruiter visibility and <strong style={{ color: C.accent }}>2–3× more recruiter responses</strong>.
          </div>
        </div>

        {/* Credentials list */}
        <div style={s.card}>
          <div style={s.secLabel}>Credentials ({CREDS.length})</div>
          {CREDS.map((cred) => (
            <div key={cred.name} style={{ ...s.credRow, borderBottom: CREDS.indexOf(cred) === CREDS.length - 1 ? 'none' : '1px solid var(--lp-bdr)' }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{cred.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={s.credName}>{cred.name}</div>
                <div style={s.credIssuer}>{cred.issuer}</div>
              </div>
              {cred.status === 'verified'
                ? <span style={s.verifiedBadge}>✓ Verified</span>
                : <button style={s.verifyBtn}>Verify →</button>
              }
            </div>
          ))}
        </div>
      </div>

      {/* Unlock CTA */}
      <div style={{ background: 'linear-gradient(90deg,rgba(0,212,255,.06),rgba(167,139,250,.06))', border: '1px solid rgba(0,212,255,.13)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 18 }}>🛡️</span>
        <div style={{ flex: 1, fontSize: 12, color: 'var(--lp-text2)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--lp-text)' }}>Trust score 65+ unlocks TrustMatch</strong> — verified candidates get 2–3× more recruiter responses and appear first in search results.
        </div>
        <button
          onClick={() => setActiveModule?.('trustmatch')}
          style={{ background: C.accent, color: '#000', border: 'none', borderRadius: 7, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
        >
          See TrustMatch →
        </button>
      </div>
    </div>
  );
}
