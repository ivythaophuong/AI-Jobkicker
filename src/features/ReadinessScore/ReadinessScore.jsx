import React from 'react';
import { Card, Badge, Btn } from '../../components/CommonUI';
import { C } from '../../styles/theme';

export default function ReadinessScore({ scanResult, memory }) {
  const lastScan = scanResult || (memory?.scanHistory?.length ? memory.scanHistory[0] : null);
  const score = lastScan?.credibilityScore || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
       <div><div className="t-h1" style={{ color: C.text }}>Overall Interview Readiness</div><div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Aggregated match score across 5 dimensions.</div></div>
       
       <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 16 }}>
           <Card glow={C.accent} style={{ textAlign: "center" }}>
               <div style={{ fontSize: 64, fontWeight: 900, color: C.accent }}>{score}%</div>
               <Badge label="Overall Score" color={C.accent} />
           </Card>
           <Card>
               <div style={{ color: C.text, fontWeight: 800, fontSize: 14, marginBottom: 12 }}>📈 Dimension Breakdown</div>
               {[["Market Context", 70, C.gold], ["Resume Credibility", score, C.accent], ["STAR Alignment", 50, C.purple]].map(([l, v, col]) => (
                   <div key={l} style={{ marginBottom: 10 }}>
                       <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11, fontWeight: 700 }}><span>{l}</span><span>{v}%</span></div>
                       <div style={{ height: 4, background: C.border, borderRadius: 2 }}><div style={{ width: `${v}%`, height: "100%", background: col, borderRadius: 2 }} /></div>
                   </div>
               ))}
           </Card>
       </div>
    </div>
  );
}
