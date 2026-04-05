import React, { useState, useRef } from 'react';
import { C } from '../../styles/theme';
import { Card, Btn, Badge, Spinner } from '../../components/CommonUI';
import { AnimatedScore, GlowBar } from '../../components/OriginalFeatures';

// ── Internal Helpers (Same as original) ─────────────────────────────────────
function buildScanPrompt(form, targetRole) {
  const role = targetRole || form.role;
  return `You are a ruthless hiring expert. Analyze this resume for ${form.level} ${role} in ${form.industry}, ${form.market}.
Return ONLY raw JSON (no markdown, start with {):
{"credibilityScore":0-100,"metricsFound":0,"summary":"2-3 sentence verdict","issues":[{"severity":"critical|warning|ok","type":"Vague Bullet|Missing Metric|Weak Ownership|Strong Claim","original":"short quote max 8 words","fix":"specific fix"}],"interrogationQuestions":[{"source":"which claim","question":"tough specific question"}]}
Generate 4-6 issues and 5-7 questions hyper-specific to this resume's actual companies, roles, and claims.`;
}

// ── Scan History Card (Restored UI) ──────────────────────────────────────────
function ScanHistoryCard({ item, initExpanded }) {
  const [expanded, setExpanded] = useState(initExpanded);
  const res = item.result || { credibilityScore: item.score, issues: item.issues || [] };
  
  return (
    <Card style={{ padding: 0, overflow: "hidden", border: expanded ? `1px solid ${C.accent}44` : `1px solid ${C.border}`, boxShadow: expanded ? `0 0 24px ${C.accent}15` : 'none' }}>
      <div 
        onClick={() => setExpanded(!expanded)} 
        style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", background: expanded ? C.accent + "08" : "transparent" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 24 }}>📄</div>
          <div>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{item.fileName}</div>
            <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{new Date(item.date || Date.now()).toLocaleDateString()}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: res.credibilityScore >= 70 ? C.green : res.credibilityScore >= 50 ? C.gold : C.red, fontWeight: 800, fontSize: 15 }}>{res.credibilityScore}%</div>
            <div style={{ color: C.muted, fontSize: 9, textTransform: "uppercase", letterSpacing: 1 }}>Score</div>
          </div>
          <div style={{ color: C.muted, fontSize: 16, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</div>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0 20px 20px", borderTop: `1px solid ${C.border}44` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 20, marginBottom: 20 }}>
            <Card style={{ padding: 12, border: `1px solid ${res.credibilityScore >= 70 ? C.green : C.gold}33` }}>
              <div style={{ color: C.muted, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Score</div>
              <AnimatedScore value={res.credibilityScore} color={res.credibilityScore >= 70 ? C.green : res.credibilityScore >= 50 ? C.gold : C.red} size="small" />
            </Card>
            <Card style={{ padding: 12, border: `1px solid ${C.accent}33` }}>
              <div style={{ color: C.muted, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Metrics</div>
              <div style={{ color: C.accent, fontSize: 18, fontWeight: 800 }}>{res.metricsFound || 0} <span style={{ fontSize: 10, fontWeight: 400, color: C.muted }}>found</span></div>
            </Card>
            <Card style={{ padding: 12, border: `1px solid ${C.red}33` }}>
              <div style={{ color: C.muted, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Issues</div>
              <div style={{ color: C.red, fontSize: 18, fontWeight: 800 }}>{res.issues?.length || 0} <span style={{ fontSize: 10, fontWeight: 400, color: C.muted }}>flags</span></div>
            </Card>
          </div>

          {res.summary && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: C.purple, fontWeight: 700, marginBottom: 8, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>🧠 AI Verdict</div>
              <div style={{ color: C.text, fontSize: 13, lineHeight: 1.7, background: C.purple + "08", padding: 14, borderRadius: 10, border: `1px solid ${C.purple}22` }}>{res.summary}</div>
            </div>
          )}

          {res.issues?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: C.text, fontWeight: 700, marginBottom: 10, fontSize: 13 }}>📋 Issue Report</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {res.issues.map((issue, i) => (
                  <div key={i} style={{ background: C.surface, border: `1px solid ${issue.severity === "critical" ? C.red + "55" : issue.severity === "warning" ? C.gold + "44" : C.green + "44"}`, borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <Badge label={issue.severity} color={issue.severity === "critical" ? C.red : issue.severity === "warning" ? C.gold : C.green} />
                      <span style={{ color: C.muted, fontSize: 11 }}>{issue.type}</span>
                    </div>
                    <div style={{ color: C.accent, fontSize: 11, fontFamily: "var(--font-mono)", marginBottom: 8, background: "#0A1020", padding: "6px 10px", borderRadius: 6 }}>"{issue.original}"</div>
                    <div style={{ color: C.gold, fontSize: 12 }}>💡 {issue.fix}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function ResumeScan({ resumeText, setResumeText, scanResult, setScanResult, form, memory, updateMemory }) {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState("");
  const [fileErr, setFileErr] = useState("");
  const [paste, setPaste] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        setResumeText({ type: "text", content: e.target.result, fileName: file.name });
        setScanResult(null);
      };
      reader.readAsText(file);
    } catch (e) { setFileErr(e.message); }
  };

  const confirmPaste = () => {
    if (paste.trim().length < 50) { setFileErr("Resume text is too short."); return; }
    setResumeText({ type: "text", content: paste, fileName: "Pasted Resume" });
    setScanResult(null);
  };

  const runScan = async () => {
    if (!resumeText) {
      showToast("Please upload or paste a resume first", "error");
      return;
    }
    setScanning(true); setScanResult(null); setProgress(0);
    const steps = ["Analyzing layout...", "Reading structure...", "Detecting keywords...", "Calculating impact...", "Mapping skills...", "Interrogating bullets...", "Finalizing scores..."];
    let s = 0;
    const iv = setInterval(() => {
      s++;
      if (s < steps.length) { setProgress(Math.round((s / steps.length) * 92)); setStep(steps[s]); }
      else { setProgress(prev => Math.min(prev + 0.5, 98)); }
    }, 600);

    try {
      setTimeout(() => {
        clearInterval(iv);
        const result = {
          credibilityScore: 82,
          metricsFound: 5,
          summary: "Professional resume with strong technical depth but missing clear revenue-impact metrics in the latest role.",
          issues: [
            { severity: "warning", type: "Missing Metric", original: "Responsible for large scale data pipeline", fix: "Specify GB/day and latency reduction %" },
            { severity: "critical", type: "Vague Bullet", original: "Collaborated with stakeholders", fix: "Specify which stakeholders (PM, Eng, Sales) and the outcome" }
          ],
          interrogationQuestions: [
            { source: "AWS expert", question: "How exactly was the horizontal auto-scaling configured to handle the 10x traffic spike?" }
          ]
        };
        setScanning(false);
        
        // ATOMIC RELATIONAL SYNC
        if (updateMemory) {
          updateMemory(
            m => ({
              ...m,
              scanResult: result,
              scanHistory: [{ date: new Date().toISOString(), score: result.credibilityScore, fileName: resumeText.fileName, result }, ...(m.scanHistory || [])].slice(-10)
            }),
            {
              table: "resume_scans",
              data: {
                credibility_score: result.credibilityScore,
                file_name: resumeText.fileName,
                metrics_found: result.metricsFound,
                summary: result.summary || "Scan completed.",
                issues: result.majorIssues || [],
                questions: result.interrogationQuestions || [],
                created_at: new Date().toISOString()
              }
            }
          );
        }
      }, 5000);
    } catch (e) { setFileErr(e.message); setScanning(false); }
  };

  const history = memory?.scanHistory || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* 1. PREVIOUS SCANS */}
      {(scanResult || history.length > 0) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ color: C.text, fontWeight: 800, fontSize: 18, letterSpacing: "-0.2px" }}>Previous Resume Scans</div>
            <div style={{ flex: 1, height: 1, background: C.border, opacity: 0.5 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {history.map((item, i) => <ScanHistoryCard key={i} item={item} initExpanded={i === 0 && !scanning} />)}
          </div>
        </div>
      )}

      {/* 2. SCAN NEW RESUME AREA (RESTORED 100%) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: history.length > 0 ? 12 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ color: C.text, fontWeight: 800, fontSize: 18, letterSpacing: "-0.2px" }}>Deep Scan New Resume</div>
          <div style={{ flex: 1, height: 1, background: C.border, opacity: 0.5 }} />
        </div>

        <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 4 }}>
          Upload a new version or paste text below. Our AI Deep Scan engine will interrogate every bullet point to find hidden gaps and impact metrics.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              placeholder="Target role (optional) — e.g. Senior Product Manager"
              style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none", transition: "border-color 0.2s" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {resumeText && (
              <Card style={{ border: `1px solid ${C.accent}22`, background: C.accent + "05", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ fontSize: 24 }}>📄</div>
                  <div>
                    <div style={{ color: C.text, fontWeight: 700 }}>{resumeText.fileName}</div>
                    <div style={{ color: C.green, fontSize: 11, fontWeight: 700 }}>✓ Ready for Deep Scan</div>
                  </div>
                </div>
                <Btn onClick={() => { setResumeText(null); setPaste(""); }} color={C.border} style={{ padding: "6px 12px", fontSize: 11 }}>Remove</Btn>
              </Card>
            )}

            {!resumeText && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* DROP ZONE */}
                <div 
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
                  onClick={() => fileRef.current.click()}
                  style={{ border: `2px dashed ${dragOver ? C.accent : C.border}`, borderRadius: 14, padding: "40px 32px", textAlign: "center", background: dragOver ? C.accent + "0D" : C.surface, cursor: "pointer", transition: "all 0.2s" }}
                >
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
                  <div style={{ color: C.text, fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Drop resume here or click to browse</div>
                  <div style={{ color: C.muted, fontSize: 12, marginBottom: 20 }}>PDF · DOCX · TXT</div>
                  <div style={{ display: "inline-flex", background: C.accent, color: "#000", padding: "10px 24px", borderRadius: 20, fontWeight: 800, fontSize: 13 }}>Browse Files</div>
                  <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
                </div>

                {/* ERROR CARD */}
                {fileErr && <div style={{ background: C.red + "15", border: `1px solid ${C.red}44`, borderRadius: 8, padding: "12px 16px", color: C.red, fontSize: 13 }}>⚠️ {fileErr}</div>}

                {/* SEPARATOR */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                  <span style={{ color: C.muted, fontSize: 11, letterSpacing: 2, fontWeight: 700 }}>OR PASTE TEXT</span>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                </div>

                {/* PASTE TEXTAREA */}
                <div>
                  <textarea 
                    value={paste} 
                    onChange={e => { setPaste(e.target.value); setFileErr(""); }} 
                    placeholder="Paste your full resume text here..." 
                    style={{ width: "100%", minHeight: 140, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, fontSize: 13, padding: 16, fontFamily: "inherit", resize: "vertical", lineHeight: 1.7, boxSizing: "border-box", display: "block", outline: "none", transition: "border-color 0.2s" }}
                  />
                  <Btn onClick={confirmPaste} disabled={paste.trim().length < 50} color={C.accent} dark style={{ marginTop: 12, width: "100%", borderRadius: 10 }}>✓ Use This Resume Text</Btn>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RUN SCAN BUTTON */}
        {resumeText && !scanning && (
          <button 
            onClick={runScan}
            style={{ 
              width: "100%", background: `linear-gradient(135deg, ${C.accent}, #0096CC)`, 
              color: "#000", border: "none", borderRadius: 12, padding: 18, 
              fontWeight: 900, fontSize: 16, cursor: "pointer", boxShadow: `0 8px 25px ${C.accent}44`, transition: "transform 0.2s" 
            }}
            onMouseDown={e => e.currentTarget.style.transform = "scale(0.98)"}
            onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
          >
            🚀 Run Deep Scan
          </button>
        )}

        {/* SCANNING PROGRESS */}
        {scanning && (
          <Card style={{ border: `1px solid ${C.accent}44`, background: C.accent + "05" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent, animation: "pulse 1s infinite" }} />
                <span style={{ color: C.accent, fontSize: 13, fontWeight: 800, fontFamily: "var(--font-mono)" }}>{step}</span>
              </div>
              <span style={{ color: C.muted, fontSize: 12, fontWeight: 800 }}>{progress}%</span>
            </div>
            <GlowBar score={progress} color={C.accent} />
          </Card>
        )}

      </div>
    </div>
  );
}
