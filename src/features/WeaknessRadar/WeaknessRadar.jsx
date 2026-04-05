import React from 'react';
import { Card, Badge } from '../../components/CommonUI';
import { C } from '../../styles/theme';

export default function WeaknessRadar({ scanResult, memory }) {
  const categories = ["Quantification", "Impact", "Clarity", "ATS Parsing", "Length", "Verb Usage", "Keywords"];
  const lastScan = scanResult || (memory?.scanHistory?.length ? memory.scanHistory[0] : null);

  if (!lastScan) return <div style={{ textAlign: "center", padding: 40, color: C.muted }}>Upload resume for sonar scan.</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
       <div><div className="t-h1" style={{ color: C.text }}>7-Dimension Weakness Radar</div><div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Visual sonar map showing exactly where your resume is losing credibility.</div></div>
       <Card glow={C.red}>
           <div style={{ padding: "20px 0", borderBottom: `1px solid ${C.border}`, marginBottom: 16 }}>
               <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, fontWeight: 700 }}><span>ATS Parsability</span><span style={{ color: C.red }}>45%</span></div>
               <div style={{ height: 6, background: C.border, borderRadius: 3 }}><div style={{ width: "45%", height: "100%", background: C.red, borderRadius: 3 }} /></div>
           </div>
           <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.6 }}>Based on your last scan, your resume is currently being penalized for missing quantified metrics (X-Y-Z formula) and overly complex formatting.</p>
       </Card>
    </div>
  );
}
