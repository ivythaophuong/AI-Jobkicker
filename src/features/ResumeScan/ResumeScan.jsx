import React, { useState, useRef } from 'react';
import { Card, Badge, Btn, Spinner, EmptyState } from '../../components/CommonUI';
import { sb } from '../../lib/supabase';
import { callLLM, extractJSON } from '../../lib/ai';
import { C } from '../../styles/theme';

export default function ResumeScan({ resumeText, setResumeText, scanResult, setScanResult, form, memory, updateMemory }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pastedText, setPastedText] = useState("");
  const fileInputRef = useRef(null);

  const runScan = async (text) => {
    if (!text || text.length < 100) { setError("Resume text is too short for a credible scan."); return; }
    
    // Gating check
    if ((memory?.scanHistory?.length || 0) > 0 && window._setProModal) {
      window._setProModal("limit");
      return;
    }

    setLoading(true); setError(""); setScanResult(null);
    try {
      const raw = await callLLM([{ role: "user", content: `Expert ATS/Recruiter analysis for ${form.role}, ${form.industry}, ${form.market}.\nResume:\n${text.slice(0,3000)}\nReturn ONLY raw JSON:\n{"credibilityScore":0-100,"summary":"...","metricsFound":["..."],"issues":[{"type":"formatting|content|impact","severity":"critical|warning|green","original":"...","fix":"..."}],"questions":["..."]}` }], 2000, "scan");
      const parsed = extractJSON(raw);
      if (parsed.error) throw new Error(parsed.msg);

      setScanResult(parsed);
      const scanItem = {
        date: new Date().toISOString(),
        fileName: resumeText?.fileName || "Pasted Resume",
        credibilityScore: parsed.credibilityScore,
        summary: parsed.summary,
        metricsFound: parsed.metricsFound,
        issues: parsed.issues,
        questions: parsed.questions
      };

      // REGIONAL SYNC: Save to specialized table + global memory
      if (updateMemory) {
        // We push to the legacy array for fallback, but also insert into the real table
        updateMemory(m => ({ scanHistory: [scanItem, ...(m.scanHistory || [])].slice(-20) }));
        
        // RELATIONAL INSERT (NEW!)
        const user = JSON.parse(localStorage.getItem("supabase.auth.token"))?.currentSession?.user;
        if (user) {
          sb.insert("resume_scans", { 
            user_id: user.id, 
            file_name: scanItem.fileName, 
            credibility_score: parsed.credibilityScore,
            summary: parsed.summary,
            metrics_found: parsed.metricsFound,
            issues: parsed.issues,
            questions: parsed.questions
          }, localStorage.getItem("supabase.auth.token")?.access_token);
        }
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="t-h1" style={{ color: C.text }}>AI Resume Scan & Credibility Audit</div>
      <Card>
          <div className="t-label" style={{ color: C.muted, marginBottom: 8 }}>Paste your resume text below for immediate analysis</div>
          <textarea 
            value={pastedText}
            onChange={e => setPastedText(e.target.value)}
            placeholder="Paste your full resume here..."
            style={{ width: "100%", minHeight: 200, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, padding: 12, fontFamily: "inherit", resize: "vertical", lineHeight: 1.7, outline: "none" }}
          />
          {error && <div style={{ color: C.red, background: `${C.red}11`, padding: 12, borderRadius: 8, marginTop: 12, fontSize: 13 }}>⚠️ {error}</div>}
          <Btn 
            onClick={() => {
                setResumeText({ content: pastedText, fileName: "Pasted Resume" });
                runScan(pastedText);
            }} 
            disabled={loading || pastedText.length < 100} 
            color={C.pink} dark style={{ marginTop: 16, width: "100%" }}
          >
            {loading ? "Scanning & Auditing..." : "⚡ Run Real-Time Deep Scan"}
          </Btn>
      </Card>

      {scanResult && !loading && (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
          <Card glow={scanResult.credibilityScore >= 75 ? C.green : scanResult.credibilityScore >= 50 ? C.gold : C.red} style={{ textAlign: "center", marginBottom: 16 }}>
             <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>ATS Credibility Score</div>
             <div style={{ fontSize: 48, fontWeight: 900, color: scanResult.credibilityScore >= 75 ? C.green : scanResult.credibilityScore >= 50 ? C.gold : C.red }}>{scanResult.credibilityScore}%</div>
             <div style={{ color: C.text, fontSize: 14, fontWeight: 600, marginTop: 8 }}>{scanResult.summary}</div>
          </Card>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
            <Card>
                <div style={{ color: C.accent, fontWeight: 800, fontSize: 12, marginBottom: 12 }}>📈 Key Indicators</div>
                {scanResult.metricsFound?.map((m, i) => <div key={i} style={{ color: C.text, fontSize: 12, marginBottom: 8 }}>• {m}</div>)}
            </Card>
            <Card>
                <div style={{ color: C.purple, fontWeight: 800, fontSize: 12, marginBottom: 12 }}>📋 Issue Audit</div>
                {scanResult.issues?.map((is, i) => (
                    <div key={i} style={{ padding: 10, background: C.surface, border: `1px solid ${is.severity === "critical" ? C.red : C.border}`, borderRadius: 8, marginBottom: 8 }}>
                       <Badge label={is.severity} color={is.severity === "critical" ? C.red : C.gold} />
                       <p style={{ color: C.text, fontSize: 12, margin: "6px 0" }}>{is.fix}</p>
                    </div>
                ))}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
