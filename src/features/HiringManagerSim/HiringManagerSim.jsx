import React, { useState } from 'react';
import { C } from '../../styles/theme';
import { Card, Btn, Badge, Spinner } from '../../components/CommonUI';
import { callLLM, extractJSON } from '../../lib/ai.jsx';

const ARCHETYPES = [
  {
    id: 'metrics',
    label: 'Metrics-Obsessed Head of Growth',
    icon: '📊',
    desc: 'Expects hard numbers, SQL fluency, and conversion data behind every claim.',
    color: C.accent,
    question: 'Walk me through the exact approach you used to identify the drop-off point. What was your confidence interval, how did you validate the hypothesis, and what SQL did you run?',
    placeholder: 'Include specific metrics, percentages, how you validated results with data, and your SQL or analytics approach...',
    systemPrompt: `You are a Metrics-Obsessed Head of Growth interviewing a candidate. You are rigorous, data-driven, and deeply skeptical of vague claims. You care about hard numbers, SQL, A/B testing, statistical significance, and conversion metrics. When the candidate is vague, call it out. Demand specifics. Score harshly if there are no numbers or the reasoning is woolly. Return ONLY raw JSON: {"score":0-100,"verdict":"string","worked":"string","missed":"string","tip":"string","followUp":"string"}`
  },
  {
    id: 'founder',
    label: 'Visionary Founder',
    icon: '🚀',
    desc: 'Tests for culture fit, first-principles thinking, and big-picture alignment.',
    color: C.purple,
    question: "Forget the metrics for a moment — tell me why you actually cared about this problem. What would you have done differently with no constraints at all?",
    placeholder: 'Share your genuine motivation, what first-principles thinking drove your approach, and your vision if you had full autonomy...',
    systemPrompt: `You are a Visionary Founder interviewing a candidate. You care deeply about culture fit, passion, and big-picture thinking. You're skeptical of corporate-speak and love candidates who think from first principles. You want to know their genuine motivation and whether they see beyond immediate constraints. Score harshly if answers feel rehearsed, metric-heavy without soul, or lack any original thinking. Return ONLY raw JSON: {"score":0-100,"verdict":"string","worked":"string","missed":"string","tip":"string","followUp":"string"}`
  },
  {
    id: 'stresstester',
    label: 'Stress-Tester',
    icon: '🔥',
    desc: 'High-pressure scenarios, edge cases, and failure modes. Nothing passes unchallenged.',
    color: C.red,
    question: "Your redesign shipped. Two weeks later a major integration drops support — revenue is down 23%. You have 48 hours. Walk me through exactly what you do, minute by minute.",
    placeholder: 'Walk through your exact decision process under pressure — who you call first, what you cut, how you communicate upward and to customers...',
    systemPrompt: `You are a high-pressure Stress-Tester interviewer. Your job is to find the breaking point of every candidate. Challenge every assumption, poke at failure modes, and ask uncomfortable "what if" questions. Do not let anything slide — if the candidate glosses over a detail, push hard. Score based on how well they handle ambiguity, pressure, and failure scenarios. Return ONLY raw JSON: {"score":0-100,"verdict":"string","worked":"string","missed":"string","tip":"string","followUp":"string"}`
  }
];

export default function HiringManagerSim({ resumeText, scanResult, form, memory, updateMemory }) {
  const [archetype, setArchetype] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fb, setFb] = useState(null);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');

  const simulate = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    setFb(null);
    setError('');

    const resumeContext = resumeText?.content
      ? `\n\nCandidate's resume:\n${resumeText.content.slice(0, 3000)}`
      : '';
    const memoryContext = memory?.profile
      ? `\n\nCandidate profile from memory: ${JSON.stringify(memory.profile).slice(0, 800)}`
      : '';

    const messages = [
      {
        role: 'user',
        content: `${archetype.systemPrompt}${resumeContext}${memoryContext}\n\nQuestion asked: "${archetype.question}"\n\nCandidate's answer: "${answer}"\n\nEvaluate the answer strictly as this archetype would. Return raw JSON only.`
      }
    ];

    try {
      const raw = await callLLM(messages, 1024);
      const result = extractJSON(raw);
      if (result.error) throw new Error('Could not parse response');
      setFb(result);
      if (updateMemory) {
        updateMemory(
          m => ({ mockSessions: [{ score: result.score, mode: archetype.id, date: new Date().toISOString() }, ...(m.mockSessions || [])].slice(-20) }),
          { table: 'mock_sessions', data: { avg_score: result.score, questions_count: 1, mode: archetype.id } }
        );
      }
    } catch (e) {
      setError('Evaluation failed — please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setArchetype(null); setFb(null); setAnswer(''); setError(''); };

  // ── Archetype selector ────────────────────────────────────────────────────────
  if (!archetype) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ color: C.text, fontWeight: 900, fontSize: 24 }}>Hiring Manager Simulator</div>
        <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Choose the interviewer archetype to face. Each one probes differently.</div>
        {!resumeText && (
          <div style={{ color: C.gold, fontSize: 12, fontWeight: 700, marginTop: 10, padding: '10px 14px', background: C.gold + '11', borderRadius: 8, border: `1px solid ${C.gold}33` }}>
            ⚠️ Upload a resume for personalized, context-aware questions.
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ARCHETYPES.map(a => (
          <div
            key={a.id}
            onClick={() => setArchetype(a)}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '18px 20px', borderRadius: 12, cursor: 'pointer',
              border: `1px solid ${a.color}33`,
              background: a.color + '06',
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = a.color + '66'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = a.color + '33'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ fontSize: 28, flexShrink: 0 }}>{a.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: a.color, fontWeight: 800, fontSize: 15, marginBottom: 3 }}>{a.label}</div>
              <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.5 }}>{a.desc}</div>
            </div>
            <div style={{ color: C.muted, fontSize: 18, flexShrink: 0 }}>→</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Active session ────────────────────────────────────────────────────────────
  const scoreColor = fb ? (fb.score >= 75 ? C.green : fb.score >= 50 ? C.gold : C.red) : C.accent;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: archetype.color, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Interviewing as</div>
          <div style={{ color: C.text, fontWeight: 900, fontSize: 20 }}>{archetype.icon} {archetype.label}</div>
        </div>
        <button
          onClick={reset}
          style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: '7px 14px', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.muted; e.currentTarget.style.color = C.text; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
        >
          ← Switch archetype
        </button>
      </div>

      {/* Question */}
      <Card style={{ border: `1px solid ${archetype.color}44`, background: archetype.color + '07' }}>
        <div style={{ color: archetype.color, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Question</div>
        <div style={{ color: C.text, fontWeight: 700, fontSize: 15, lineHeight: 1.65 }}>"{archetype.question}"</div>
      </Card>

      {/* Answer */}
      <textarea
        value={answer}
        onChange={e => setAnswer(e.target.value)}
        placeholder={archetype.placeholder}
        style={{ width: '100%', minHeight: 130, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, padding: 16, fontSize: 13, outline: 'none', lineHeight: 1.7, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
      />

      {error && (
        <div style={{ background: C.red + '15', border: `1px solid ${C.red}44`, borderRadius: 8, padding: '10px 14px', color: C.red, fontSize: 12 }}>⚠ {error}</div>
      )}

      <Btn onClick={simulate} disabled={loading || !answer.trim()} color={archetype.color} dark style={{ width: '100%' }}>
        🧠 Get AI Feedback
      </Btn>

      {loading && <Card><Spinner label={`Evaluating as ${archetype.label}...`} /></Card>}

      {/* Feedback */}
      {fb && (
        <Card style={{ border: `1px solid ${scoreColor}44`, background: scoreColor + '06' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ color: scoreColor, fontWeight: 900, fontSize: 20 }}>{fb.verdict}</div>
            <div style={{ color: scoreColor, fontWeight: 900, fontSize: 28, fontFamily: 'var(--font-mono)' }}>{fb.score}%</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ color: C.green, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>✓ What Worked</div>
              <div style={{ color: C.text, fontSize: 13, lineHeight: 1.65 }}>{fb.worked}</div>
            </div>
            <div>
              <div style={{ color: C.red, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>✗ What Missed</div>
              <div style={{ color: C.text, fontSize: 13, lineHeight: 1.65 }}>{fb.missed}</div>
            </div>
            <div style={{ background: C.surface, padding: '12px 14px', borderRadius: 8, borderLeft: `3px solid ${archetype.color}` }}>
              <div style={{ color: archetype.color, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Sharpen This</div>
              <div style={{ color: C.text, fontSize: 13, lineHeight: 1.65, fontStyle: 'italic' }}>{fb.tip}</div>
            </div>
            {fb.followUp && (
              <div style={{ background: archetype.color + '08', border: `1px solid ${archetype.color}33`, borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ color: archetype.color, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Follow-up Question</div>
                <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>"{fb.followUp}"</div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
            <Btn onClick={() => { setAnswer(''); setFb(null); }} color={archetype.color} dark style={{ flex: 1 }}>Try Again →</Btn>
            <Btn onClick={reset} color={C.border} style={{ padding: '11px 18px' }}>New Archetype</Btn>
          </div>
        </Card>
      )}
    </div>
  );
}
