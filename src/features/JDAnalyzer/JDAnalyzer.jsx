import React, { useState } from 'react';
import { Card, Badge, Btn, Spinner } from '../../components/CommonUI';
import { callLLM, extractJSON } from '../../lib/ai';
import { sb } from '../../lib/supabase';
import { C } from '../../styles/theme';

export default function JDAnalyzer({ resumeText, form, memory, updateMemory }) {
  const [jd, setJd] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const analyze = async () => {
    if (jd.trim().length < 50) { setErr("Paste a full job description first."); return; }
    
    // Gating check
    if ((memory?.jdAnalyses?.length || 0) > 0 && window._setProModal) {
      window._setProModal("limit");
      return;
    }
    
    setLoading(true); setResult(null); setErr("");
    const ctx = resumeText?.content ? `\nCANDIDATE RESUME:\n${resumeText.content.slice(0, 1800)}` : `\nCandidate: ${form.level} ${form.role} in ${form.industry}`;
    try {
      const raw = await callLLM([{ role: "user", content: `Expert recruiter. Analyze JD vs candidate.\nJD:\n${jd.slice(0, 2500)}${ctx}\nReturn ONLY raw JSON:\n{"matchScore":0-100,"roleTitle":"...","company":"...","keyRequirements":["..."],"candidateStrengths":["..."],"criticalGaps":["..."],"hiddenKeywords":["..."],"redFlags":["..."],"applicationAdvice":"...","interviewFocus":["..."]}` }], 2000, "jd");
      const parsed = extractJSON(raw);
      if (parsed.error) throw new Error(parsed.msg);
      
      setResult(parsed);
      const jdItem = { date: new Date().toISOString(), company: parsed.company, matchScore: parsed.matchScore, role: parsed.roleTitle };
      
      if (updateMemory) {
        updateMemory(m => ({ jdAnalyses: [jdItem, ...(m.jdAnalyses || [])].slice(-20) }));
        
        // RELATIONAL INSERT
        const user = JSON.parse(localStorage.getItem("supabase.auth.token"))?.currentSession?.user;
        if (user) {
          sb.insert("jd_analyses", {
            user_id: user.id,
            company: parsed.company,
            role_title: parsed.roleTitle,
            match_score: parsed.matchScore,
            keywords: parsed.hiddenKeywords,
            gaps: parsed.criticalGaps,
            advice: parsed.applicationAdvice
          }, localStorage.getItem("supabase.auth.token")?.access_token);
        }
      }
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  const mc = result ? (result.matchScore >= 75 ? C.green : result.matchScore >= 50 ? C.gold : C.red) : C.pink;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div className="t-h1" style={{ color: C.text }}>Job Description Analyzer</div>
        <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Compare YOUR profile against any specific JD.</div>
      </div>
      
      <Card>
          <textarea 
            value={jd} 
            onChange={e => { setJd(e.target.value); setErr(""); }} 
            placeholder="Paste the full job description here..." 
            style={{ width: "100%", minHeight: 160, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, padding: 12, fontFamily: "inherit", resize: "vertical", outline: "none" }}
          />
          {err && <div style={{ color: C.red, fontSize: 12, marginTop: 8 }}>⚠️ {err}</div>}
          <Btn onClick={analyze} disabled={loading || jd.trim().length < 50} color={C.pink} dark style={{ marginTop: 12, width: "100%" }}>
            {loading ? <Spinner label="Analyzing..." /> : "🔍 Analyze Match Strategy"}
          </Btn>
      </Card>

      {result && !loading && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card glow={mc} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 40, fontWeight: 900, color: mc }}>{result.matchScore}%</div>
                <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Match Confidence</div>
            </Card>
            <Card>
                <div style={{ color: C.text, fontWeight: 800, fontSize: 16 }}>{result.roleTitle}</div>
                <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{result.company}</div>
            </Card>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
            <Card glow={C.green}>
                <div style={{ color: C.green, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>✅ Strengths</div>
                {result.candidateStrengths?.map((s, i) => <div key={i} style={{ color: C.text, fontSize: 12, marginBottom: 4 }}>• {s}</div>)}
            </Card>
            <Card glow={C.red}>
                <div style={{ color: C.red, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>⚠️ Critical Gaps</div>
                {result.criticalGaps?.map((g, i) => <div key={i} style={{ color: C.text, fontSize: 12, marginBottom: 4 }}>• {g}</div>)}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
