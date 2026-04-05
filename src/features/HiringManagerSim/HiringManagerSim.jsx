import React, { useState } from 'react';
import { Card, Badge, Btn, Spinner } from '../../components/CommonUI';
import { callLLM, extractJSON } from '../../lib/ai';
import { sb } from '../../lib/supabase';
import { C } from '../../styles/theme';

export default function HiringManagerSim({ resumeText, scanResult, form, memory, updateMemory, onProTrigger }) {
  const [mode, setMode] = useState(null);
  const [qType, setQType] = useState("behavioral");
  const [questions, setQuestions] = useState([]); 
  const [qi, setQi] = useState(0);
  const [answer, setAnswer] = useState(""); 
  const [feedback, setFeedback] = useState(null);
  const [loadQ, setLoadQ] = useState(false); 
  const [loadFB, setLoadFB] = useState(false);

  const modes = [
    { id: "startup", label: "Seed Startup", icon: "🚀", desc: "Fast-paced, scrappy", color: C.gold },
    { id: "seriesb", label: "Series B", icon: "📈", desc: "Metrics obsessed", color: C.accent },
    { id: "enterprise", label: "Enterprise", icon: "🏢", desc: "Stakeholder-centric", color: C.purple },
    { id: "technical", label: "Technical Lead", icon: "⚙️", desc: "Depth over breadth", color: C.red }
  ];

  const ctx = resumeText?.content ? `\nRESUME:\n${resumeText.content.slice(0, 2000)}` : scanResult ? `\nScan: score ${scanResult.credibilityScore}/100` : `\nTarget: ${form.level} ${form.role}`;

  const loadQuestions = async (m, t) => {
    setLoadQ(true); setQuestions([]); setQi(0); setAnswer(""); setFeedback(null);
    const ml = modes.find(x => x.id === m)?.label;
    try {
      const raw = await callLLM([{ role: "user", content: `${ml} interviewer for ${form.level} ${form.role}, ${form.industry}, ${form.market}.${ctx}\nGenerate 5 hyper-specific ${t} questions from THIS candidate's background.\nReturn ONLY raw JSON array:\n[{"question":"...","why":"why this tests this candidate"}]` }], 1000, "simulate");
      setQuestions(extractJSON(raw));
    } catch {
      setQuestions([{ question: `Walk me through your most impactful project as a ${form.role}.`, why: "Core competency test" }]);
    }
    setLoadQ(false);
  };

  const getFeedback = async () => {
    if (!answer.trim() || !questions[qi]) return;
    
    // Gating check
    if ((memory?.mockSessions?.length || 0) > 0 && window._setProModal) {
      window._setProModal("limit");
      return;
    }
    
    setLoadFB(true); setFeedback(null);
    const ml = modes.find(x => x.id === mode)?.label;
    try {
      const raw = await callLLM([{ role: "user", content: `${ml} hiring manager, ${form.level} ${form.role}, ${form.market}.${ctx}\nQ:"${questions[qi].question}"\nA:"${answer}"\nEvaluate harshly. Call out resume inconsistencies.\nReturn ONLY raw JSON:\n{"score":0-100,"verdict":"Strong|Acceptable|Weak|Critical Gap","whatWorked":"...","whatMissed":"...","starGap":"...","resumeDisconnect":"mismatch or Consistent","rewriteTip":"...","followUp":"..."}` }], 1000, "simulate");
      const p = extractJSON(raw);
      setFeedback(p);

      if (updateMemory && !p.error) {
          const session = {
              date: new Date().toISOString(),
              mode: modes.find(x => x.id === mode)?.label,
              questionsCount: questions.length,
              avgScore: p.score
          };
          updateMemory(m => ({ mockSessions: [session, ...(m.mockSessions || [])].slice(-20) }));
          
          // RELATIONAL INSERT
          const user = JSON.parse(localStorage.getItem("supabase.auth.token"))?.currentSession?.user;
          if (user) {
            sb.insert("mock_sessions", {
              user_id: user.id,
              mode: session.mode,
              questions_count: session.questionsCount,
              avg_score: session.avgScore
            }, localStorage.getItem("supabase.auth.token")?.access_token);
          }
      }
    } catch (e) { setFeedback({ error: e.message }); }
    setLoadFB(false);
  };

  const ac = (mode && modes.find(m => m.id === mode)?.color) || C.accent;
  const vc = { Strong: C.green, Acceptable: C.gold, Weak: C.red, "Critical Gap": C.red };

  if (!mode) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div><div className="t-h1" style={{ color: C.text }}>HM Simulator</div><div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Pick a persona and start roleplaying.</div></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {modes.map(m => (
                <Card key={m.id} glow={m.color} style={{ cursor: "pointer" }} onClick={() => { setMode(m.id); loadQuestions(m.id, qType); }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>{m.icon}</div>
                    <div style={{ color: m.color, fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{m.label}</div>
                    <div style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>{m.desc}</div>
                    <Badge label="Select Mode" color={m.color} />
                </Card>
            ))}
        </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
       <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Btn onClick={() => setMode(null)} color={C.border} style={{ fontSize: 11 }}>← Exit Sim</Btn>
            <div style={{ textAlign: "right" }}><div style={{ color: ac, fontWeight: 800, fontSize: 14 }}>{modes.find(m => m.id === mode)?.label} Mode</div></div>
       </div>

       {loadQ ? <Spinner label="Generating questions..." /> : questions[qi] && (
           <div style={{ animation: "fadeIn 0.3s ease" }}>
               <Card glow={ac} style={{ marginBottom: 16 }}>
                   <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", marginBottom: 8 }}>Question {qi + 1}</div>
                   <div style={{ color: C.text, fontSize: 15, fontWeight: 600, lineHeight: 1.6 }}>{questions[qi].question}</div>
               </Card>
               <textarea 
                   value={answer} onChange={e => setAnswer(e.target.value)} 
                   placeholder="Type your answer here..." 
                   style={{ width: "100%", minHeight: 120, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, padding: 16, fontFamily: "inherit", resize: "vertical", outline: "none" }}
               />
               <Btn onClick={getFeedback} disabled={loadFB || !answer.trim()} color={ac} dark style={{ marginTop: 12, width: "100%" }}>
                   {loadFB ? "Hiring Manager is Thinking..." : "🗣️ Submit Answer"}
               </Btn>
           </div>
       )}

       {feedback && !loadFB && (
           <Card glow={vc[feedback.verdict] || C.accent} style={{ marginTop: 16 }}>
               <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                   <div style={{ color: vc[feedback.verdict] || C.text, fontWeight: 900, fontSize: 20 }}>{feedback.verdict}</div>
                   <div style={{ fontSize: 24, fontWeight: 900, color: C.text }}>{feedback.score}%</div>
               </div>
               <div style={{ color: C.text, fontSize: 13, lineHeight: 1.6 }}>{feedback.whatWorked}</div>
               <Btn onClick={() => { setQi(q => (q + 1) % questions.length); setAnswer(""); setFeedback(null); }} color={ac} style={{ marginTop: 16 }}>Next Question →</Btn>
           </Card>
       )}
    </div>
  );
}
