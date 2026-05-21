import React from 'react';
import { C } from '../../styles/theme';
import { Card, Badge, Spinner } from '../../components/CommonUI';
import { AnimatedScore } from '../../components/OriginalFeatures';
import { GetReadyTabStrip } from '../Landing/LandingPage';
import '../../styles/featurePage.css';

export default function ReadinessScore({ scanResult, memory, setActiveModule, onStudyPlan, embedded }) {
  const latestHistory = memory?.scanHistory?.[0];
  const effectiveResult = scanResult || latestHistory?.result;

  if (!effectiveResult) {
    return (
      <div className="fp-wrap" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {!embedded && <GetReadyTabStrip activeModuleId="score" onNavigate={setActiveModule} onStudyPlan={onStudyPlan || (() => {})} />}
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 60, marginBottom: 20 }}>📊</div>
          <div style={{ color: C.text, fontWeight: 900, fontSize: 18, marginBottom: 8 }}>Readiness Calculation Offline</div>
          <div style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>Scan your resume to calculate your market readiness score.</div>
          <button onClick={() => setActiveModule?.("scan")} style={{ background: C.accent, color: "#000", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 800, cursor: "pointer" }}>Run Deep Scan Now</button>
        </div>
      </div>
    );
  }

  const score = effectiveResult.credibilityScore || 50;
  const status = score >= 85 ? "Market Ready" : score >= 65 ? "Needs Polish" : "High Risk";
  const color = score >= 85 ? C.green : score >= 65 ? C.gold : C.red;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {!embedded && <GetReadyTabStrip activeModuleId="score" onNavigate={setActiveModule} onStudyPlan={onStudyPlan || (() => {})} />}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 24 }}>
      <div>
        <div style={{ color: C.text, fontWeight: 900, fontSize: 24 }}>Market Readiness Score</div>
        <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Aggregated probability of clearing initial ATS and recruiter filters.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>
        <Card style={{ textAlign: "center", padding: 40, border: `1px solid ${color}44`, background: color + "05" }}>
          <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Overall Probability</div>
          <AnimatedScore value={score} color={color} size="large" suffix="%" />
          <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
            <Badge label={status} color={color} size="md" />
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card style={{ border: `1px solid ${C.accent}33`, background: C.accent + "05" }}>
             <div style={{ color: C.muted, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>ATS Strength</div>
             <div style={{ color: C.accent, fontWeight: 900, fontSize: 20 }}>Excellent</div>
          </Card>
          <Card style={{ border: `1px solid ${C.gold}33`, background: C.gold + "05" }}>
             <div style={{ color: C.muted, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Skill Gaps</div>
             <div style={{ color: C.gold, fontWeight: 900, fontSize: 20 }}>3 Found</div>
          </Card>
          <Card style={{ border: `1px solid ${C.purple}33`, background: C.purple + "05" }}>
             <div style={{ color: C.muted, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Portfolio Signal</div>
             <div style={{ color: C.purple, fontWeight: 900, fontSize: 20 }}>Strong</div>
          </Card>
        </div>
      </div>

      <Card>
        <div style={{ color: C.text, fontWeight: 900, fontSize: 15, marginBottom: 16 }}>Roadmap to 99% Readiness</div>
        {[
          { l: "Optimize Quantified Metrics", d: "Add at least 3 more revenue or latency impact numbers.", done: false, color: C.accent },
          { l: "Fix Resume Layout Flaws", d: "Clean up the interrogation questions in Scan History.", done: true, color: C.green },
          { l: "Complete 2 Interview Simulations", d: "Practice with the Startup persona to fix communication gaps.", done: false, color: C.gold }
        ].map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 14, marginBottom: 16, background: C.surface, borderRadius: 10, padding: 16, border: `1px solid ${step.color}33` }}>
            <div style={{ color: step.color, fontSize: 20 }}>{step.done ? "✓" : "○"}</div>
            <div>
              <div style={{ color: C.text, fontWeight: 800, fontSize: 14 }}>{step.l}</div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{step.d}</div>
            </div>
          </div>
        ))}
      </Card>
      </div>
    </div>
  );
}
