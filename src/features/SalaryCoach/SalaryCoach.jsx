import React, { useState } from 'react';
import { Card, Badge, Btn, Spinner } from '../../components/CommonUI';
import { callLLM, extractJSON } from '../../lib/ai';
import { sb } from '../../lib/supabase';
import { C } from '../../styles/theme';

export default function SalaryCoach({ resumeText, form, memory, updateMemory, onProTrigger }) {
  const [offer, setOffer] = useState(""); 
  const [target, setTarget] = useState(""); 
  const [stage, setStage] = useState("received_offer");
  const [result, setResult] = useState(null); 
  const [loading, setLoading] = useState(false);

  const stages = [
    { id: "received_offer", label: "Got an Offer", icon: "📩" },
    { id: "pre_interview", label: "Before Interviews", icon: "🎯" },
    { id: "negotiating", label: "Mid-Negotiation", icon: "🤝" },
    { id: "counter_offer", label: "Counter Offer", icon: "⚡" }
  ];

  const ctx = resumeText?.content ? resumeText.content.slice(0, 600) : `${form.level} ${form.role}`;

  const analyze = async () => {
    if (!offer.trim()) return;
    
    // Gating check
    if ((memory?.negotiationPractice || 0) > 0 && window._setProModal) {
      window._setProModal("limit");
      return;
    }
    
    setLoading(true); setResult(null);
    try {
      const raw = await callLLM([{ role: "user", content: `Salary negotiation coach for ${form.market}.\nCandidate: ${form.level} ${form.role}, ${form.industry}\nOffer: ${offer}\nTarget: ${target || "not specified"}\nStage: ${stage}\nResume: ${ctx}\nReturn ONLY raw JSON:\n{"marketMin":"...","marketMid":"...","marketMax":"...","assessment":"...","negotiationRoom":"...","openingAsk":"...","tactics":["..."],"scripts":[{"label":"Opening","text":"..."},{"label":"Handling pushback","text":"..."},{"label":"Closing","text":"..."}],"leveragePoints":["..."],"redLines":["..."],"totalComp":"..."}` }], 2000, "salary");
      const parsed = extractJSON(raw);
      setResult(parsed);

      if (updateMemory && !parsed.error) {
          updateMemory(m => ({ negotiationPractice: (m.negotiationPractice || 0) + 1 }));
          
          // RELATIONAL INSERT
          const user = JSON.parse(localStorage.getItem("supabase.auth.token"))?.currentSession?.user;
          if (user) {
            sb.insert("negotiation_practice", {
              user_id: user.id,
              offer: offer,
              target: target,
              stage: stage
            }, localStorage.getItem("supabase.auth.token")?.access_token);
          }
      }
    } catch (e) { setResult({ error: e.message }); }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
       <div><div className="t-h1" style={{ color: C.text }}>Salary Negotiation Coach</div><div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Benchmark your offer and get line-by-line negotiation scripts.</div></div>
       
       <Card>
           <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>{stages.map(s => <button key={s.id} onClick={() => setStage(s.id)} style={{ background: stage === s.id ? C.purple + "22" : "transparent", border: `1px solid ${stage === s.id ? C.purple : C.border}`, color: stage === s.id ? C.purple : C.muted, borderRadius: 6, padding: "8px 12px", fontSize: 12, cursor: "pointer", flex: 1, fontFamily: "inherit" }}>{s.icon} {s.label}</button>)}</div>
           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
               <div><div className="t-label" style={{ color: C.muted, marginBottom: 6 }}>Current Offer (Annual)</div><input value={offer} onChange={e => setOffer(e.target.value)} placeholder="e.g. $120,000" style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: 10, fontSize: 13, outline: "none" }} /></div>
               <div><div className="t-label" style={{ color: C.muted, marginBottom: 6 }}>Your Target</div><input value={target} onChange={e => setTarget(e.target.value)} placeholder="e.g. $145,000" style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: 10, fontSize: 13, outline: "none" }} /></div>
           </div>
           <Btn onClick={analyze} disabled={loading || !offer.trim()} color={C.purple} dark style={{ width: "100%" }}>{loading ? <Spinner label="Calculating leverage..." /> : "📈 Benchmark Offer"}</Btn>
       </Card>

       {result && !loading && (
           <div style={{ animation: "fadeIn 0.3s ease" }}>
               <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
                   <Card glow={C.purple}><div style={{ color: C.purple, fontWeight: 800, fontSize: 12, marginBottom: 8 }}>📊 Marketplace Assessment</div><div style={{ color: C.text, fontSize: 13, lineHeight: 1.6 }}>{result.assessment}</div><Btn onClick={() => {}} color={C.purple} style={{ marginTop: 12, fontSize: 11 }}>View Full Market Report</Btn></Card>
                   <Card style={{ textAlign: "center" }}><div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Negotiation Room</div><div style={{ fontSize: 28, fontWeight: 900, color: C.gold }}>{result.negotiationRoom}</div><div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Potential Upside</div></Card>
               </div>
           </div>
       )}
    </div>
  );
}
