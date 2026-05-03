import React, { useState } from 'react';
import { C } from '../../styles/theme';
import { Card, Btn, Spinner } from '../../components/CommonUI';
import { callLLM, extractJSON } from '../../lib/ai.jsx';
import '../../styles/featurePage.css';

export default function CoverLetterGen({ resumeText, form, memory, updateMemory, user, showToast }) {
  const [jd, setJd] = useState("");
  const [tone, setTone] = useState("professional");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const tones = [
    { id: "professional", label: "Professional", icon: "👔" },
    { id: "confident",    label: "Confident",    icon: "🔥" },
    { id: "storytelling", label: "Storytelling", icon: "📖" },
    { id: "concise",      label: "Ultra-Concise", icon: "⚡" },
  ];

  const generate = async () => {
    setLoading(true); setResult(null);
    try {
      const resumeCtx = resumeText
        ? (typeof resumeText === 'string' ? resumeText : resumeText.content || '')
        : '';
      const raw = await callLLM([{ role: 'user', content: `You are an elite cover letter writer. Write a highly personalized, compelling cover letter.

Candidate: ${user?.name || 'the candidate'}
Target Role: ${form.role || 'Not specified'}
Industry: ${form.industry || 'Not specified'}
Market: ${form.market || 'Not specified'}
Tone: ${tone} (professional=formal & polished, confident=assertive & bold, storytelling=narrative-driven, concise=tight & punchy under 200 words)

Resume:
${resumeCtx || 'Not provided — write a strong general letter based on the role.'}

Job Description:
${jd || 'Not provided — write a targeted letter based on the role.'}

Return ONLY raw JSON (no markdown, start with {):
{"subject":"compelling email subject line","coverLetter":"full cover letter with proper paragraphs and line breaks — personalized to the actual resume and JD content, NOT generic","sellingPoints":["specific strength from resume 1","specific strength 2","specific strength 3"]}

Write a real letter — no [brackets] or placeholders. Match the tone exactly.` }], 2000);
      const parsed = extractJSON(raw);
      if (parsed.error) throw new Error(parsed.msg);
      setResult(parsed);
      if (updateMemory) updateMemory(m => ({
        coverLetters: [{ date: new Date().toISOString(), role: form.role, tone }, ...(m.coverLetters || [])].slice(-20)
      }));
    } catch (e) {
      showToast("Generation failed: " + e.message, "error");
    }
    setLoading(false);
  };

  const copyText = () => {
    if (!result?.coverLetter) return;
    navigator.clipboard.writeText(result.coverLetter).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fp-wrap" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ color: C.text, fontWeight: 900, fontSize: 24 }}>Cover Letter Generator</div>
        <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>AI writes a tailored letter from your real resume + JD. No generic templates.</div>
        {!resumeText && <div style={{ color: C.gold, fontSize: 12, fontWeight: 700, marginTop: 8, padding: "8px 12px", background: C.gold + "11", borderRadius: 8, border: `1px solid ${C.gold}33` }}>⚠️ Upload your resume first for a fully personalized letter.</div>}
      </div>

      <Card>
        <div style={{ color: C.muted, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Select Tone</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {tones.map(t => (
            <button key={t.id} onClick={() => setTone(t.id)} style={{ background: tone === t.id ? C.orange + "22" : "transparent", border: `1px solid ${tone === t.id ? C.orange : C.border}`, color: tone === t.id ? C.orange : C.muted, borderRadius: 8, padding: "8px 14px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: C.muted, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Job Description <span style={{ color: C.muted, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(paste for best results)</span></div>
          <textarea
            value={jd} onChange={e => setJd(e.target.value)}
            placeholder="Paste job description for a fully tailored letter..."
            style={{ width: "100%", minHeight: 100, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, padding: 14, fontSize: 13, outline: "none", lineHeight: 1.7 }}
          />
        </div>
        <Btn onClick={generate} disabled={loading} color={C.orange} dark style={{ width: "100%", padding: 16 }}>
          {loading ? "Writing your letter..." : "✉️ Generate Cover Letter"}
        </Btn>
      </Card>

      {loading && <Card><Spinner label="Crafting your personalized letter..." /></Card>}

      {result && (
        <>
          <Card style={{ border: `1px solid ${C.orange}44`, background: C.orange + "05" }}>
            <div style={{ color: C.orange, fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Email Subject</div>
            <div style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>{result.subject}</div>
          </Card>

          <Card style={{ border: `1px solid ${C.accent}44` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ color: C.accent, fontWeight: 900, fontSize: 14 }}>✉️ Your Cover Letter</div>
              <button
                onClick={copyText}
                style={{ background: copied ? C.green + "22" : "transparent", border: `1px solid ${copied ? C.green : C.border}`, color: copied ? C.green : C.muted, borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all .2s" }}
              >
                {copied ? "✓ Copied!" : "Copy Text"}
              </button>
            </div>
            <div style={{ color: C.text, fontSize: 13, lineHeight: 2.0, background: C.surface, padding: 24, borderRadius: 10, whiteSpace: "pre-line", borderLeft: `4px solid ${C.orange}` }}>
              {result.coverLetter}
            </div>
          </Card>

          <Card>
            <div style={{ color: C.green, fontWeight: 900, fontSize: 12, marginBottom: 10 }}>💪 Key Selling Points Included</div>
            {result.sellingPoints?.map((p, i) => (
              <div key={i} style={{ color: C.text, fontSize: 12, marginBottom: 6, paddingLeft: 12, borderLeft: `2px solid ${C.green}` }}>{p}</div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}
