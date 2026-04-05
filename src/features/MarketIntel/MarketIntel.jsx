import React from 'react';
import { Card, Badge } from '../../components/CommonUI';
import { C } from '../../styles/theme';

export default function MarketIntel({ form, memory }) {
  const regions = ["United States", "UK & Europe", "Singapore & SE Asia", "Australia & NZ", "India", "Middle East"];
  const currentRegion = form.market || "Global";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
       <div><div className="t-h1" style={{ color: C.text }}>Market Intelligence: {currentRegion}</div><div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Hiring norms, salary context, and interview styles.</div></div>
       
       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
           <Card glow={C.accent}><div style={{ color: C.accent, fontWeight: 800, fontSize: 12, marginBottom: 8 }}>📊 Market Demand</div><div style={{ color: C.text, fontSize: 13, lineHeight: 1.6 }}>High demand for {form.role} in {form.market}. Average 15% salary growth for {form.level} roles in this quarter.</div></Card>
           <Card glow={C.gold}><div style={{ color: C.gold, fontWeight: 800, fontSize: 12, marginBottom: 8 }}>💼 Hiring Norms</div><div style={{ color: C.text, fontSize: 13, lineHeight: 1.6 }}>3-5 interview rounds. Focus on behavioral alignment and system-design at this level.</div></Card>
       </div>
    </div>
  );
}
