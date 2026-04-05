import React, { useState } from 'react';
import { Card, Badge, Btn, Spinner, EmptyState } from '../../components/CommonUI';
import { callLLM, extractJSON, Markdown } from '../../lib/ai';
import { sb } from '../../lib/supabase';
import { C } from '../../styles/theme';

export default function STARBuilder({ resumeText, form, memory, updateMemory }) {
  const [S, setS] = useState(""); const [T, setT] = useState(""); const [A, setA] = useState(""); const [R, setR] = useState("");
  const [refined, setRefined] = useState(null); const [loading, setLoading] = useState(false);

  const refine = async () => {
    if (!S || !T || !A || !R) return;
    
    // Gating check
    if ((memory?.starBank?.length || 0) > 0 && window._setProModal) {
      window._setProModal("limit");
      return;
    }
    
    setLoading(true); setRefined(null);
    const ctx = resumeText?.content ? `Resume: ${resumeText.content.slice(0, 600)}` : `${form.level} ${form.role}`;
    try {
      const raw = await callLLM([{ role: "user", content: `Expert interview coach. Refine STAR story for ${form.level} ${form.role}, ${form.market}.\n${ctx}\nSituation:${S}\nTask:${T}\nAction:${A}\nResult:${R}\nReturn ONLY raw JSON:\n{"score":0-100,"refined":{"situation":"...","task":"...","action":"3-4 bullet points","result":"quantified result"},"strengths":"...","improvements":"...","bestUsedFor":["q1","q2","q3"],"oneLiner":"punchy 1-sentence version"}` }], 1500, "star");
      const p = extractJSON(raw);
      if (p.error) throw new Error(p.message);

      setRefined(p);
      const story = { id: Date.now(), oneLiner: p.oneLiner, score: p.score, situation: S, task: T, action: A, result: R, refined: p.refined };
      
      if (updateMemory) {
        updateMemory(m => ({ starBank: [story, ...(m.starBank || [])].slice(-20) }));
        
        // RELATIONAL INSERT
        const user = JSON.parse(localStorage.getItem("supabase.auth.token"))?.currentSession?.user;
        if (user) {
          sb.insert("star_stories", {
            user_id: user.id,
            one_liner: p.oneLiner,
            score: p.score,
            situation: S,
            task: T,
            action: A,
            result: R,
            refined: p.refined
          }, localStorage.getItem("supabase.auth.token")?.access_token);
        }
      }
    } catch (e) { setRefined({ error: e.message }); }
    setLoading(false);
  };

  const fc = [C.accent, C.gold, C.purple, C.green];
  const fields = [{ l: "Situation", h: "Context", v: S, set: setS, rows: 2 }, { l: "Task", h: "Responsibility", v: T, set: setT, rows: 2 }, { l: "Action", h: "Specific Actions", v: A, set: setA, rows: 4 }, { l: "Result", h: "Outcome", v: R, set: setR, rows: 2 }];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="t-h1" style={{ color: C.text }}>STAR Story Builder</div>
        {memory?.starBank?.length > 0 && <Badge label={`${memory.starBank.length} banked`} color={C.gold} />}
      </div>

      <Card>
          {fields.map((f, i) => (
            <div key={f.l} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: fc[i] }}>{f.l.toUpperCase()}</span>
                    <span style={{ color: C.muted, fontSize: 10 }}>({f.h})</span>
                </div>
                <textarea 
                    value={f.v} onChange={e => f.set(e.target.value)} rows={f.rows} 
                    style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12, padding: 10, fontFamily: "inherit", resize: "vertical", outline: "none" }}
                />
            </div>
          ))}
          <Btn onClick={refine} disabled={loading || !S || !T || !A || !R} color={C.gold} dark style={{ marginTop: 12, width: "100%" }}>
            {loading ? "Polishing Story..." : "⭐ Bank This Story"}
          </Btn>
      </Card>

      {refined && !refined.error && !loading && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card glow={C.gold} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: C.gold }}>{refined.score}/100</div>
                <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase" }}>Impact Score</div>
            </Card>
            <Card>
                <div style={{ color: C.text, fontSize: 13, fontStyle: "italic", lineHeight: 1.5 }}>"{refined.oneLiner}"</div>
            </Card>
          </div>
        </div>
      )}

      {memory?.starBank?.length === 0 && <EmptyState icon="⭐" title="No stories banked" desc="Refine your first STAR story to see it here." cta="Start building" onCta={() => {}} ctaColor={C.gold} />}
    </div>
  );
}
