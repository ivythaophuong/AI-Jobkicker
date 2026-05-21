import React from 'react';
import { C } from '../../styles/theme';
import { Card, Badge, Spinner } from '../../components/CommonUI';
import { GlowBar } from '../../components/OriginalFeatures';
import { GetReadyTabStrip } from '../Landing/LandingPage';
import '../../styles/featurePage.css';

export default function WeaknessRadar({ scanResult, memory, setActiveModule, onStudyPlan, embedded }) {
  const clamp = v => Math.max(10, Math.min(99, Math.round(v)));
  const latestHistory = memory?.scanHistory?.[0];
  const effectiveResult = scanResult || latestHistory?.result;

  if (!effectiveResult) {
    return (
      <div className="fp-wrap" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {!embedded && <GetReadyTabStrip activeModuleId="radar" onNavigate={setActiveModule} onStudyPlan={onStudyPlan || (() => {})} />}
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 60, marginBottom: 20 }}>📡</div>
          <div style={{ color: C.text, fontWeight: 900, fontSize: 18, marginBottom: 8 }}>Radar is offline</div>
          <div style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>Scan your resume first to map your skills and detect weaknesses.</div>
          <button onClick={() => setActiveModule?.("scan")} style={{ background: C.red, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 800, cursor: "pointer" }}>Run Deep Scan</button>
        </div>
      </div>
    );
  }

  const base = effectiveResult.credibilityScore || 50;
  const cr = (effectiveResult.issues || []).filter(i => i.severity === "critical").length;
  const wr = (effectiveResult.issues || []).filter(i => i.severity === "warning").length;

  const wk = [
    { l: "Metric Depth", s: clamp(base - cr * 12) },
    { l: "Ownership Clarity", s: clamp(base - wr * 6 + 5) },
    { l: "Failure Stories", s: clamp(base * 0.5) },
    { l: "Leadership Signal", s: clamp(base * 0.78) },
    { l: "Technical Breadth", s: clamp(base + 12) },
    { l: "Communication", s: clamp(base * 0.82) },
    { l: "Industry Knowledge", s: clamp(base + 18) }
  ];

  const colored = wk.map(w => ({ ...w, color: w.s < 40 ? C.red : w.s < 70 ? C.gold : C.green }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {!embedded && <GetReadyTabStrip activeModuleId="radar" onNavigate={setActiveModule} onStudyPlan={onStudyPlan || (() => {})} />}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 24 }}>
      <div>
        <div style={{ color: C.text, fontWeight: 900, fontSize: 24 }}>Weakness Radar</div>
        <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Visual competency mapping derived from your resume structure.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {[
          { label: "Critical Gaps", val: colored.filter(w => w.s < 40).length, color: C.red },
          { label: "Needs Work", val: colored.filter(w => w.s >= 40 && w.s < 70).length, color: C.gold },
          { label: "Strong Areas", val: colored.filter(w => w.s >= 70).length, color: C.green }
        ].map(s => (
          <Card key={s.label} style={{ border: `1px solid ${s.color}33`, background: s.color + "05" }}>
            <div style={{ color: C.muted, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{s.label}</div>
            <div style={{ color: s.color, fontSize: 32, fontWeight: 900 }}>{s.val}</div>
          </Card>
        ))}
      </div>

      <Card>
        <div style={{ color: C.text, fontWeight: 900, fontSize: 15, marginBottom: 24 }}>Competency Breakdown</div>
        {colored.map((w, i) => (
          <div key={i} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{w.l}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, color: C.muted, fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>{w.s < 40 ? "Critical" : w.s < 70 ? "Needs Polish" : "Strong"}</span>
                <span style={{ color: w.color, fontSize: 14, fontWeight: 900, fontFamily: "var(--font-mono)" }}>{w.s}%</span>
              </div>
            </div>
            <GlowBar score={w.s} color={w.color} delay={i * 80} height={10} showLabel={false} />
          </div>
        ))}
      </Card>
      </div>
    </div>
  );
}
