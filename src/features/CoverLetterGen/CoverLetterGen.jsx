import React, { useState } from 'react';
import { Card, Badge, Btn, Spinner } from '../../components/CommonUI';
import { callLLM, extractJSON, Markdown } from '../../lib/ai';
import { sb } from '../../lib/supabase';
import { C } from '../../styles/theme';

export default function CoverLetterGen({ resumeText, form, memory, updateMemory }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [tone, setTone] = useState("Professional");
  const [company, setCompany] = useState("");

  const tones = ["Professional", "Confident", "Enthusiastic", "Scrappy Startup"];

  const generate = async () => {
    if (!company.trim()) return;
    
    // Gating check
    if ((memory?.coverLetters?.length || 0) > 0 && window._setProModal) {
      window._setProModal("limit");
      return;
    }
    
    setLoading(true); setResult(null);
    const ctx = resumeText?.content ? `Resume: ${resumeText.content.slice(0, 1500)}` : `${form.level} ${form.role}`;
    try {
      const raw = await callLLM([{ role: "user", content: `Expert copywriter. Write a 3-paragraph cover letter for ${form.role} at ${company}.\nTone: ${tone}\nContext: ${ctx}\nReturn ONLY raw JSON:\n{"subject":"...","content":"...","followUpEmail":"..."}` }], 2000, "cover");
      const parsed = extractJSON(raw);
      setResult(parsed);

      if (updateMemory && !parsed.error) {
          const letter = { date: new Date().toISOString(), company, tone, subject: parsed.subject };
          updateMemory(m => ({ coverLetters: [letter, ...(m.coverLetters || [])].slice(-20) }));
          
          // RELATIONAL INSERT
          const user = JSON.parse(localStorage.getItem("supabase.auth.token"))?.currentSession?.user;
          if (user) {
            sb.insert("cover_letters", {
              user_id: user.id,
              tone,
              company,
              content: parsed.content,
              subject: parsed.subject,
              follow_up: parsed.followUpEmail
            }, localStorage.getItem("supabase.auth.token")?.access_token);
          }
      }
    } catch (e) { setResult({ error: e.message }); }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
       <div><div className="t-h1" style={{ color: C.text }}>AI Cover Letter Generator</div><div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>High-impact, tailored letters in 4 distinct tones.</div></div>
       
       <Card>
           <div style={{ marginBottom: 12 }}><div className="t-label" style={{ color: C.muted, marginBottom: 6 }}>Company Name</div><input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Google, Grab, Stripe" style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: 10, fontSize: 14, outline: "none" }} /></div>
           <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 6 }}>{tones.map(t => <button key={t} onClick={() => setTone(t)} style={{ whiteSpace: "nowrap", background: tone === t ? C.orange + "22" : "transparent", border: `1px solid ${tone === t ? C.orange : C.border}`, color: tone === t ? C.orange : C.muted, borderRadius: 6, padding: "6px 12px", fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>{t}</button>)}</div>
           <Btn onClick={generate} disabled={loading || !company.trim()} color={C.orange} dark style={{ width: "100%" }}>{loading ? <Spinner label="Writing letter..." /> : "✍️ Generate Letter"}</Btn>
       </Card>

       {result && !loading && (
           <Card glow={C.orange} style={{ animation: "fadeIn 0.3s ease" }}>
               <div style={{ color: C.orange, fontSize: 10, fontWeight: 800, textTransform: "uppercase", marginBottom: 12 }}>Draft Preview</div>
               <div style={{ background: C.surface, borderRadius: 8, padding: 16, border: `1px solid ${C.border}` }}>
                   <div style={{ color: C.muted, fontSize: 11, marginBottom: 12 }}>Subject: {result.subject}</div>
                   <div style={{ color: C.text, fontSize: 13, lineHeight: 1.8, whiteSpace: "pre-line" }}>{result.content}</div>
               </div>
           </Card>
       )}
    </div>
  );
}
