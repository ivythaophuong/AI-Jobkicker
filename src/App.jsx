import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';

// pdf.js worker setup
if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

// ── Supabase Client ────────────────────────────────────────────────────────────
const SUPABASE_URL  = "https://ruibdsvrcctxgxctaxwe.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1aWJkc3ZyY2N0eGd4Y3RheHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0Nzg3MjksImV4cCI6MjA4OTA1NDcyOX0.TB2jdImKiHx6oP0aNNXObShT_eHk0wvtN_As5tkbcmE";

// Lightweight Supabase REST client — no npm needed
const sb = {
  _h: () => ({ "Content-Type": "application/json", "apikey": SUPABASE_ANON, "Authorization": `Bearer ${SUPABASE_ANON}` }),
  _au: () => ({ "Content-Type": "application/json", "apikey": SUPABASE_ANON }),

  // ── Auth ───────────────────────────────────────────────────────────────────
  async signUp(email, password, name) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST", headers: sb._au(),
      body: JSON.stringify({ email, password, data: { full_name: name } })
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error.message || d.msg || "Sign up failed");
    return d;
  },

  async signIn(email, password) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST", headers: sb._au(),
      body: JSON.stringify({ email, password })
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error.message || d.error_description || "Sign in failed");
    return d; // { access_token, user, ... }
  },

  async signOut(token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST", headers: { ...sb._au(), "Authorization": `Bearer ${token}` }
    });
  },

  async getUser(token) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { ...sb._au(), "Authorization": `Bearer ${token}` }
    });
    return r.json();
  },

  // ── Database helpers ───────────────────────────────────────────────────────
  async upsert(table, data, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...sb._h(), "Authorization": `Bearer ${token}`, "Prefer": "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(data)
    });
    const resText = await r.text();
    if (r.status === 204 || !resText) return null;
    let d;
    try { d = JSON.parse(resText); } catch { d = resText; }
    if (Array.isArray(d) ? false : d?.code) throw new Error(d.message || "DB write failed");
    return d;
  },

  async select(table, filters, token) {
    const params = new URLSearchParams(filters || {});
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
      headers: { ...sb._h(), "Authorization": `Bearer ${token}` }
    });
    return r.json();
  },

  async insert(table, data, token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...sb._h(), "Authorization": `Bearer ${token}`, "Prefer": "return=representation" },
      body: JSON.stringify(data)
    });
    const d = await r.json();
    if (Array.isArray(d) ? false : d?.code) throw new Error(d.message || "Insert failed");
    return d;
  },

  async update(table, data, filters, token) {
    const params = new URLSearchParams(filters || {});
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
      method: "PATCH",
      headers: { ...sb._h(), "Authorization": `Bearer ${token}`, "Prefer": "return=representation" },
      body: JSON.stringify(data)
    });
    return r.json();
  },

  async delete(table, filters, token) {
    const params = new URLSearchParams(filters || {});
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
      method: "DELETE",
      headers: { ...sb._h(), "Authorization": `Bearer ${token}` }
    });
  },
};

// ── Session persistence (token stored in localStorage) ───────────────────────
const TOKEN_KEY   = "djai_token";
const SESSION_KEY = "djai_session";

function saveToken(token)  { localStorage.setItem(TOKEN_KEY, token); }
function getToken()        { return localStorage.getItem(TOKEN_KEY); }
function clearToken()      { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(SESSION_KEY); }
function saveSessionLocal(u) { localStorage.setItem(SESSION_KEY, JSON.stringify(u)); }
function getSessionLocal()   { try { return JSON.parse(localStorage.getItem(SESSION_KEY)||"null"); } catch { return null; } }

const C = {
  bg:"#090C12", surface:"#0F1520", card:"#131B2A", border:"#1E2D45",
  accent:"#00D4FF", accentGlow:"#00D4FF33", gold:"#FFB800",
  green:"#00E88F", red:"#FF4757", purple:"#8B5CF6",
  text:"#E8F0FE", muted:"#6B7E9F", orange:"#FF9500", pink:"#FF6B9D",
};

const MODULES = [
  { id:"jobs",     icon:"🔎", label:"Job Search",      color:C.green    },
  { id:"scan",     icon:"⚡", label:"Resume Scan",     color:C.accent   },
  { id:"jd",       icon:"🔍", label:"JD Analyzer",     color:C.pink     },
  { id:"star",     icon:"⭐", label:"STAR Builder",     color:C.gold     },
  { id:"simulate", icon:"🧠", label:"HM Simulator",    color:C.purple   },
  { id:"salary",   icon:"💰", label:"Salary Coach",    color:C.green    },
  { id:"cover",    icon:"✉️", label:"Cover Letter",   color:C.orange   },
  { id:"radar",    icon:"📡", label:"Weakness Radar",  color:C.red      },
  { id:"score",    icon:"🏆", label:"Readiness Score", color:C.accent   },
  { id:"market",   icon:"🌏", label:"Market Intel",    color:C.muted    },
  { id:"memory",   icon:"🧬", label:"AI Memory",        color:C.purple   },
];


// ── Access Policy ─────────────────────────────────────────────────────────────
// FREE  = no login needed, full access
// PREVIEW = no login, but limited (1 free use then gated)
// AUTH  = must be logged in
const ACCESS = {
  jobs:     "FREE",      // Job search boards are public links — no AI cost, always free
  market:   "FREE",      // Static market intel — free to browse
  memory:   "AUTH",      // AI memory dashboard — shows personalized history
  score:    "AUTH",      // Mandatory login for LLM features
  radar:    "AUTH",      // Mandatory login for LLM features
  scan:     "AUTH",      // Mandatory login for LLM features
  jd:       "AUTH",      // JD analysis — AI-heavy, login required
  star:     "AUTH",      // STAR builder — personalised AI, login required
  simulate: "AUTH",      // HM Simulator — deep AI usage, login required
  salary:   "AUTH",      // Salary coach + roleplay — login required
  cover:    "AUTH",      // Cover letter generation — login required
};

const FREE_MODULES   = Object.entries(ACCESS).filter(([,v])=>v==="FREE").map(([k])=>k);
const PREVIEW_MODULES= Object.entries(ACCESS).filter(([,v])=>v==="PREVIEW").map(([k])=>k);
const AUTH_MODULES   = Object.entries(ACCESS).filter(([,v])=>v==="AUTH").map(([k])=>k);

// ══════════════════════════════════════════════════════════════════════════════
// UNIVERSAL LLM ROUTER
// ──────────────────────────────────────────────────────────────────────────────
// Switch any module to any LLM provider by changing MODEL_ROUTING below.
// Supported providers: "claude" | "openai" | "gemini"
//
// API KEY SETUP (only add keys for providers you use):
//   Claude : get from https://console.anthropic.com
//   OpenAI : get from https://platform.openai.com/api-keys
//   Gemini : get from https://aistudio.google.com/app/apikey
// ══════════════════════════════════════════════════════════════════════════════

const LLM_KEYS = {
  claude : "__CLAUDE_KEY_PLACEHOLDER__",   // Anthropic
  openai : "__OPENAI_KEY_PLACEHOLDER__",   // OpenAI
  gemini : "__GEMINI_KEY_PLACEHOLDER__",   // Google AI Studio
};
if (typeof window !== 'undefined') window._LLM_KEYS = LLM_KEYS;

// ── MODEL CATALOGUE ───────────────────────────────────────────────────────────
// Easy reference — change these strings to upgrade/downgrade any model
const MODELS = {
  // Claude (Anthropic) ─────────────────────────────────────────────
  claude_sonnet  : "claude-3-5-sonnet-20241022",   // Best quality for complex reasoning
  claude_haiku   : "claude-3-5-haiku-20241022",    // Great speed/value
  claude_opus    : "claude-3-opus-20240229",       // High intelligence fallback

  // OpenAI ─────────────────────────────────────────────────────────
  gpt4o          : "gpt-4o",                       // $2.50/$10 per 1M — near-Sonnet quality
  gpt4o_mini     : "gpt-4o-mini",                  // $0.15/$0.60 per 1M — cheapest reliable
  gpt4_turbo     : "gpt-4-turbo",                  // $10/$30 per 1M — legacy

  // Google Gemini ──────────────────────────────────────────────────
  gemini_pro     : "gemini-3.1-pro-preview",       // Current top-tier Pro preview
  gemini_flash   : "gemini-3-flash-preview",       // Use -preview for the 3-series Flash
  gemini_flash8b : "gemini-2.5-flash-lite",        // Use 2.5-flash-lite for stable budget needs
};

// ── PER-MODULE MODEL ROUTING ──────────────────────────────────────────────────
// Change the value of any module to switch its AI model.
// "tier" controls which model from MODELS to use.
// "provider" is auto-detected from model name — no need to change.
//
// COST GUIDE:
//   "claude_sonnet" → full quality, highest cost
//   "claude_haiku"  → 90% quality, 20x cheaper — best Claude value
//   "gpt4o_mini"    → 85% quality, 50x cheaper than Sonnet — best budget
//   "gemini_flash"  → 80% quality, 100x cheaper — absolute minimum cost
//
const MODEL_ROUTING = {
  // ── TIER 1: Sonnet — only your 2 most critical features ─────────────────
  scan     : MODELS.claude_sonnet,   // Resume scan — hook feature, must be best quality
  memory   : MODELS.claude_sonnet,   // Career plan — deep synthesis across all history

  // ── TIER 2: Haiku — 20x cheaper than Sonnet, handles all coaching well ──
  simulate : MODELS.claude_haiku,    // HM Simulator — was Sonnet, saves ~25% total cost
  jd       : MODELS.claude_haiku,    // JD analysis — structured JSON, Haiku excels
  star     : MODELS.claude_haiku,    // STAR builder — template-driven output
  salary   : MODELS.claude_haiku,    // Salary coach + roleplay — conversational
  radar    : MODELS.claude_haiku,    // Weakness radar — derived from scan result
  score    : MODELS.claude_haiku,    // Readiness score — formula-driven output

  // ── TIER 3: GPT-4o-mini — 50x cheaper, great for writing tasks ──────────
  cover    : MODELS.gpt4o_mini,      // Cover letter — GPT-4o-mini excels at creative writing
  rejection: MODELS.gpt4o_mini,      // Rejection coach — structured advice, no deep reasoning

  // ── TIER 4: Gemini Flash — 100x cheaper, trivial structured tasks only ──
  insight  : MODELS.gemini_flash,    // Insight banner — single sentence, ultra simple
  jobs     : MODELS.gemini_flash,    // Job search AI intel — market data lookup

  // ── Default fallback ─────────────────────────────────────────────────────
  default  : MODELS.claude_haiku,
};

// ── NETWORK UTILS ───────────────────────────────────────────────────────────
async function fetchWithTimeout(url, options = {}) {
  const { timeout = 45000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    if (!response.ok && response.status >= 500) {
      console.error(`[Network] Server error: ${response.status} at ${url}`);
    }
    return response;
  } catch (e) {
    clearTimeout(id);
    if (e.name === 'AbortError') throw new Error("Request timed out after 45s. The AI might be slow — please try again.");
    throw e;
  }
}

// ── PROVIDER DETECTION ───────────────────────────────────────────────────────
function detectProvider(model) {
  if (model.startsWith("claude"))  return "claude";
  if (model.startsWith("gpt") || model.startsWith("o1") || model.startsWith("o3")) return "openai";
  if (model.startsWith("gemini"))  return "gemini";
  return "claude"; // safe default
}

// ── CLAUDE CALLER ─────────────────────────────────────────────────────────────
async function callClaude(messages, maxTokens=2000, model=MODELS.claude_sonnet) {
  const key = LLM_KEYS.claude;
  const headers = {
    "Content-Type": "application/json",
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true",
    ...(key && !key.includes("YOUR_") ? { "x-api-key": key } : {}),
  };
  console.log(`[Claude] Fetching ${model}...`);
  const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
    method: "POST", headers,
    body: JSON.stringify({ model, max_tokens: maxTokens, messages }),
  });

  console.log(`[Claude] response status=${res.status}`);

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429) {
      let resetMsg = "";
      try {
        const parsed = JSON.parse(body);
        const inner = parsed?.error?.message ? JSON.parse(parsed.error.message) : null;
        const resetsAt = inner?.resetsAt || inner?.windows?.["5h"]?.resets_at;
        if (resetsAt) {
          const diffMs = new Date(resetsAt * 1000) - new Date();
          const diffMins = Math.ceil(diffMs / 60000);
          const diffHrs = Math.ceil(diffMs / 3600000);
          resetMsg = diffMins < 90 ? ` Resets in ~${diffMins} min.` : ` Resets in ~${diffHrs} hr.`;
        }
      } catch {}
      throw new Error("RATE_LIMIT:Usage limit reached." + resetMsg + " Please wait and try again.");
    }
    throw new Error("Claude API " + res.status + ": " + body);
  }
  const d = await res.json();
  return d.content?.map(b => b.text||"").join("") || "";
}

// ── OPENAI CALLER ─────────────────────────────────────────────────────────────
async function callOpenAI(messages, maxTokens=2000, model=MODELS.gpt4o_mini) {
  const key = LLM_KEYS.openai;
  if (!key || key.includes("YOUR_")) throw new Error("OpenAI API key not set in LLM_KEYS.openai");
  console.log(`[OpenAI] Fetching ${model}...`);
  const res = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({ model, max_tokens: maxTokens, messages,
      response_format: { type: "json_object" }, // forces JSON output — no parsing needed
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429) throw new Error("RATE_LIMIT:OpenAI rate limit reached. Please wait and try again.");
    throw new Error("OpenAI API " + res.status + ": " + body);
  }
  const d = await res.json();
  return d.choices?.[0]?.message?.content || "";
}

// ── GEMINI CALLER ─────────────────────────────────────────────────────────────
async function callGemini(messages, maxTokens=2000, model=MODELS.gemini_flash) {
  const key = LLM_KEYS.gemini;
  if (!key || key.includes("YOUR_")) throw new Error("Gemini API key not set in LLM_KEYS.gemini");
  // Convert OpenAI-style messages to Gemini format
  const contents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));
  console.log(`[Gemini] Fetching ${model}...`);
  const res = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    }
  );
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429) throw new Error("RATE_LIMIT:Gemini rate limit reached. Please wait and try again.");
    throw new Error("Gemini API " + res.status + ": " + body);
  }
  const d = await res.json();
  return d.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ── UNIVERSAL ROUTER ──────────────────────────────────────────────────────────
// This is the single function all modules call.
// Pass `moduleId` to get smart model routing, or override with `modelOverride`.
//
// Usage:
//   await callLLM(messages, 2000, "scan")           // uses MODEL_ROUTING.scan
//   await callLLM(messages, 1000, "cover")          // uses MODEL_ROUTING.cover
//   await callLLM(messages, 800, "default", MODELS.gemini_flash) // force override
//
async function callLLM(messages, maxTokens=2000, moduleId="default", modelOverride=null) {
  const model    = modelOverride || MODEL_ROUTING[moduleId] || MODEL_ROUTING.default;
  const provider = detectProvider(model);

  console.log(`[LLM] module=${moduleId} provider=${provider} model=${model}`);

  try {
    switch (provider) {
      case "openai":  return await callOpenAI(messages, maxTokens, model);
      case "gemini":  return await callGemini(messages, maxTokens, model);
      case "claude":
      default:        return await callClaude(messages, maxTokens, model);
    }
  } catch (e) {
    // Universal fallback: retry any failed call with Gemini 3 Flash Preview
    // (unless the original model was already Gemini Flash, in which case we throw)
    if (model !== MODELS.gemini_flash) {
      console.warn(`[LLM] ${model} failed, falling back to Gemini Flash... error:`, e.message);
      return await callGemini(messages, maxTokens, MODELS.gemini_flash);
    }
    throw e;
  }
}

// ── BACKWARD COMPAT — old callClaude() calls still work ──────────────────────
// All existing callClaude() calls are preserved and route through callLLM
// with the "default" model. Gradually migrate to callLLM(msgs, tokens, "moduleId").



function parseError(msg) {
  if (!msg) return { icon: '⚠️', title: 'Something went wrong', body: 'Please try again.', isRateLimit: false };
  if (msg.startsWith('RATE_LIMIT:')) {
    return { icon: '⏳', title: 'Usage limit reached', body: msg.replace('RATE_LIMIT:', ''), isRateLimit: true };
  }
  return { icon: '⚠️', title: 'Request failed', body: msg, isRateLimit: false };
}

function ErrCard({ msg }) {
  const e = parseError(msg);
  return (
    <Card glow={e.isRateLimit ? C.gold : C.red}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: e.body ? 6 : 0 }}>
        <span style={{ fontSize: 20 }}>{e.icon}</span>
        <div style={{ color: e.isRateLimit ? C.gold : C.red, fontWeight: 800, fontSize: 14 }}>{e.title}</div>
      </div>
      {e.body && <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginLeft: 30 }}>{e.body}</div>}
      {e.isRateLimit && (
        <div style={{ marginLeft: 30, marginTop: 8, color: C.muted, fontSize: 12 }}>
          💡 Tip: While waiting, you can still use the <strong style={{ color: C.gold }}>Job Search</strong>, <strong style={{ color: C.gold }}>Market Intel</strong>, and <strong style={{ color: C.gold }}>Sprint Builder</strong> tabs — they don't require API calls.
        </div>
      )}
    </Card>
  );
}

function extractJSON(raw) {
  if (!raw || !raw.trim()) return { error: true, msg: "AI returned an empty response." };
  try {
    // 1. Try finding JSON object/array with regex first (best for markdown/noisy output)
    const match = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      try { return JSON.parse(match[0]); } catch (e) { /* fall through to cleanup method */ }
    }
    // 2. Fallback: Cleanup common markdown/noise and parse
    const clean = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("[extractJSON] Parse error. raw:", raw);
    // Instead of throwing, we return a structured error that ResumeScan can handle
    return { error: true, msg: "AI response was not in a valid JSON format." };
  }
}


// ── AI Memory Engine (Supabase-backed) ────────────────────────────────────────
// Loads from Supabase on login; saves back on every update.
// Falls back to localStorage for guests (preview usage only).

async function loadMemoryFromDB(userId, token) {
  try {
    const rows = await sb.select("user_memory", { user_id: `eq.${userId}` }, token);
    if (Array.isArray(rows) && rows.length > 0) return rows[0].data || null;
    return null;
  } catch { return null; }
}

async function saveMemoryToDB(userId, token, mem) {
  try {
    await sb.upsert("user_memory", { user_id: userId, data: mem, updated_at: new Date().toISOString() }, token);
  } catch(e) { console.warn("Memory save failed:", e.message); }
}

// Legacy local fallback (for guests)
function loadMemory(uid) {
  try { return JSON.parse(localStorage.getItem(`djai_mem_${uid}`) || "null"); } catch { return null; }
}
function saveMemory(uid, mem) {
  try { localStorage.setItem(`djai_mem_${uid}`, JSON.stringify(mem)); } catch {}
}

function initMemory() {
  return {
    scanHistory: [],        // [{date, score, issues, fileName}]
    starBank: [],           // [{id, oneLiner, score, situation, task, action, result}]
    mockSessions: [],       // [{date, mode, questionsCount, avgScore}]
    applications: [],       // tracker entries
    rejections: [],         // [{company, stage, date, notes}]
    negotiationPractice: 0, // count
    coverLetters: [],       // [{date, company, tone}]
    jdAnalyses: [],         // [{date, company, matchScore, role}]
    insights: [],           // AI-generated insights array
    totalSessions: 0,
    lastSeen: null,
    profile: {},
  };
}

function buildMemoryContext(mem, form) {
  if (!mem) return "";
  const lines = [];
  if (mem.scanHistory?.length) {
    const latest = mem.scanHistory[mem.scanHistory.length - 1];
    const trend = mem.scanHistory.length > 1
      ? (latest.score - mem.scanHistory[0].score > 0 ? "improving" : "declining")
      : "first scan";
    lines.push(`Resume scan history: ${mem.scanHistory.length} scans, latest score ${latest.score}/100 (${trend})`);
    const pattern = mem.scanHistory.flatMap(s => s.issues || []).map(i => i.type);
    const topIssue = pattern.sort((a,b) => pattern.filter(x=>x===b).length - pattern.filter(x=>x===a).length)[0];
    if (topIssue) lines.push(`Recurring issue pattern: "${topIssue}" appears across multiple scans`);
  }
  if (mem.starBank?.length) lines.push(`STAR story bank: ${mem.starBank.length} stories banked, avg score ${Math.round(mem.starBank.reduce((s,x)=>s+x.score,0)/mem.starBank.length)}/100`);
  if (mem.mockSessions?.length) lines.push(`Mock interview history: ${mem.mockSessions.length} sessions completed`);
  if (mem.rejections?.length) lines.push(`Rejection history: ${mem.rejections.length} rejections logged (${mem.rejections.map(r=>r.stage).join(", ")})`);
  if (mem.negotiationPractice > 0) lines.push(`Negotiation practice: ${mem.negotiationPractice} roleplay sessions`);
  if (mem.jdAnalyses?.length) {
    const avgMatch = Math.round(mem.jdAnalyses.reduce((s,x)=>s+x.matchScore,0)/mem.jdAnalyses.length);
    lines.push(`JD analyses: ${mem.jdAnalyses.length} analyzed, avg match score ${avgMatch}%`);
  }
  lines.push(`Target: ${form.level} ${form.role} in ${form.industry}, ${form.market}`);
  return lines.length ? "\n\nUSER HISTORY CONTEXT:\n" + lines.join("\n") : "";
}

// ── Rejection Coach — surfaces after tracker entry marked Rejected ────────────
function RejectionCoach({ rejection, form, memory }) {
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);

  const getAdvice = async () => {
    setLoading(true);
    const memCtx = buildMemoryContext(memory, form);
    try {
      const raw = await callLLM([{ role: "user", content: `Expert career coach. A candidate was rejected.
Company: ${rejection.company} | Role: ${rejection.role} | Stage: ${rejection.stage}${rejection.notes ? " | Notes: " + rejection.notes : ""}
Target: ${form.level} ${form.role}, ${form.market}${memCtx}

Return ONLY raw JSON:
{"likelyCause":"most probable reason for rejection at this stage","immediateActions":["action1","action2","action3"],"mindsetReframe":"1-2 sentences reframing this positively","similarRoles":["3 alternative roles/companies to target now"],"skillGap":"specific skill to work on based on stage they reached","recoveryPlan":"concrete 7-day plan"}` }], 1500, "rejection");
      setAdvice(extractJSON(raw));
    } catch (e) { setAdvice({ error: e.message }); }
    setLoading(false);
  };

  if (!rejection) return null;
  return (
    <div style={{ marginTop: 10 }}>
      {!advice && !loading && (
        <button onClick={getAdvice} style={{ background: C.purple + "22", border: `1px solid ${C.purple}44`, color: C.purple, borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          🧠 Get AI Recovery Coaching
        </button>
      )}
      {loading && <Spinner label="Analyzing rejection pattern..." />}
      {advice && !advice.error && (
        <Card glow={C.purple} style={{ marginTop: 10 }}>
          <div style={{ color: C.purple, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>🧠 Rejection Recovery Coach</div>
          <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Likely Cause</div>
          <div style={{ color: C.text, fontSize: 13, marginBottom: 12, lineHeight: 1.7 }}>{advice.likelyCause}</div>
          <div style={{ color: C.gold, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Immediate Actions</div>
          {advice.immediateActions?.map((a, i) => <div key={i} style={{ color: C.text, fontSize: 12, padding: "5px 0", borderBottom: `1px solid ${C.border}22` }}>→ {a}</div>)}
          <div style={{ color: C.green, fontSize: 12, marginTop: 10, lineHeight: 1.7, fontStyle: "italic" }}>💚 {advice.mindsetReframe}</div>
          {advice.recoveryPlan && <div style={{ color: C.muted, fontSize: 12, marginTop: 8, lineHeight: 1.7 }}>📅 {advice.recoveryPlan}</div>}
        </Card>
      )}
    </div>
  );
}

// ── AI Insight Banner — surfaces cross-module patterns ────────────────────────
function InsightBanner({ memory, form }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!memory || dismissed) return;
    const totalActivity = (memory.scanHistory?.length || 0) + (memory.starBank?.length || 0) + (memory.mockSessions?.length || 0);
    if (totalActivity < 2) return;
    generateInsight();
  }, [memory?.totalSessions]);

  const generateInsight = async () => {
    setLoading(true);
    const memCtx = buildMemoryContext(memory, form);
    try {
      const raw = await callLLM([{ role: "user", content: `Career AI coach. Based on this user's activity, generate ONE sharp personalized insight.${memCtx}
Return ONLY raw JSON: {"icon":"emoji","headline":"short punchy headline","detail":"1-2 sentence specific insight","action":"one concrete next step","type":"warning|tip|milestone"}` }], 400, "insight");
      setInsight(extractJSON(raw));
    } catch {}
    setLoading(false);
  };

  if (dismissed || loading || !insight) return null;
  const bannerColor = insight.type === "warning" ? C.red : insight.type === "milestone" ? C.gold : C.accent;
  return (
    <div style={{ background: bannerColor + "11", border: `1px solid ${bannerColor}33`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 4 }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>{insight.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ color: bannerColor, fontWeight: 800, fontSize: 13, marginBottom: 2 }}>{insight.headline}</div>
        <div style={{ color: C.text, fontSize: 12, lineHeight: 1.6 }}>{insight.detail}</div>
        {insight.action && <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>→ {insight.action}</div>}
      </div>
      <button onClick={() => setDismissed(true)} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, fontFamily: "inherit", flexShrink: 0 }}>✕</button>
    </div>
  );
}

// ── Live Match Score Overlay (for JD Analyzer) ────────────────────────────────
function LiveMatchMeter({ score, prev }) {
  const [display, setDisplay] = useState(prev || 0);
  useEffect(() => { const t = setTimeout(() => setDisplay(score), 300); return () => clearTimeout(t); }, [score]);
  const color = display >= 75 ? C.green : display >= 50 ? C.gold : C.red;
  const delta = prev !== undefined ? score - prev : null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Match Score</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {delta !== null && delta !== 0 && (
              <span style={{ color: delta > 0 ? C.green : C.red, fontSize: 11, fontWeight: 700 }}>{delta > 0 ? "+" : ""}{delta}%</span>
            )}
            <span style={{ color, fontWeight: 900, fontSize: 18 }}>{display}%</span>
          </div>
        </div>
        <GlowBar score={display} color={color} />
      </div>
    </div>
  );
}

// ── File reading ─────────────────────────────────────────────────────────────
async function readResumeFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext==="pdf" || file.type==="application/pdf") {
    return new Promise((resolve,reject)=>{
      const r=new FileReader();
      r.onload=async e=>{
        try {
          const lib = window.pdfjsLib || pdfjs;
          if (!lib || !lib.getDocument) throw new Error("PDF parser (pdf.js) not ready. Please try again in 5 seconds.");
          const loadingTask = lib.getDocument({data:e.target.result});
          const pdf = await loadingTask.promise;
          let txt="";
          for(let i=1;i<=pdf.numPages;i++){
            const pg=await pdf.getPage(i);
            const ct=await pg.getTextContent();
            txt+=ct.items.map(x=>x.str).join(" ")+"\n";
          }
          if (!txt.trim()) throw new Error("PDF parsing returned no text. The file might be scanned or empty.");
          resolve({type:"text",content:txt.trim(),fileName:file.name});
        } catch (err) { 
          console.error("PDF parse error:", err);
          reject(new Error("PDF Error: " + err.message));
        }
      };
      r.onerror=()=>reject(new Error("File read error"));
      r.readAsArrayBuffer(file);
    });
  }
  if (ext==="docx" || file.type.includes("wordprocessingml")) {
    return new Promise((resolve,reject)=>{
      const r=new FileReader();
      r.onload=async e=>{
        try{
          const _m=window.mammoth||mammoth;
          if(!_m || !_m.extractRawText) throw new Error('DOCX parser (mammoth) unavailable');
          const res=await _m.extractRawText({arrayBuffer:e.target.result});
          if (!res.value.trim()) throw new Error("DOCX parsing returned no text.");
          resolve({type:"text",content:res.value,fileName:file.name});
        }catch(err){
          console.error("DOCX parse error:", err);
          reject(new Error("DOCX Error: " + err.message));
        }
      };
      r.onerror=()=>reject(new Error("File read error"));
      r.readAsArrayBuffer(file);
    });
  }
  return new Promise((resolve,reject)=>{
    const r=new FileReader();
    r.onload=e=>resolve({type:"text",content:e.target.result,fileName:file.name});
    r.onerror=reject; r.readAsText(file);
  });
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
function GlowBar({score,color,delay=0,height=8,showLabel=false}){
  const [w,setW]=useState(0);
  const [visible,setVisible]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{
    const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting){setVisible(true);obs.disconnect();}},{threshold:0.1});
    if(ref.current)obs.observe(ref.current);
    return()=>obs.disconnect();
  },[]);
  useEffect(()=>{
    if(!visible)return;
    const t=setTimeout(()=>setW(score),delay+100);
    return()=>clearTimeout(t);
  },[visible,score,delay]);
  return(
    <div ref={ref} style={{position:"relative"}}>
      <div style={{background:"#0A1020",borderRadius:4,height,overflow:"hidden"}}>
        <div style={{width:`${w}%`,height:"100%",background:`linear-gradient(90deg,${color}88,${color})`,borderRadius:4,transition:`width 1.1s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,boxShadow:`0 0 10px ${color}44`}}/>
      </div>
      {showLabel&&<div style={{position:"absolute",right:0,top:-18,fontFamily:"var(--font-mono)",fontSize:10,color,fontWeight:700}}>{w}%</div>}
    </div>
  );
}
function AnimatedRadarBar({score, color, delay=0}) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(score), 150 + delay);
    return () => clearTimeout(t);
  }, [score, delay]);
  return (
    <div className="radar-bar-bg">
      <div className="radar-bar-fill" style={{width:`${w}%`, background:`linear-gradient(90deg,${color}88,${color})`}}/>
    </div>
  );
}
function Badge({label,color,size="sm"}){
  const fz = size==="md"?12:10;
  const pad = size==="md"?"4px 10px":"2px 8px";
  return <span style={{background:color+"1E",color,border:`1px solid ${color}44`,borderRadius:20,padding:pad,fontSize:fz,fontWeight:700,letterSpacing:0.8,textTransform:"uppercase",display:"inline-block",lineHeight:1.4}}>{label}</span>;
}
function Card({children,style={},glow,hover=false,animate=false}){
  return <div
    className={hover?"card-hover":""}
    style={{
      background:C.card,
      border:`1px solid ${glow?glow+"55":C.border}`,
      borderRadius:12,padding:20,
      boxShadow:glow?`0 0 24px ${glow}18`:"none",
      animation:animate?"fadeInScale 0.25s ease":"none",
      ...style
    }}>
    {children}
  </div>;
}
function Spinner({label="Analyzing with AI...",color}){
  const c = color||C.accent;
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,color:C.muted,fontSize:13}}>
      <div style={{width:20,height:20,border:`2px solid ${C.border}`,borderTopColor:c,borderRadius:"50%",animation:"spin 0.7s linear infinite",flexShrink:0}}/>
      <span style={{animation:"pulse 2s ease infinite"}}>{label}</span>
    </div>
  );
}
function Ticker({text}){return <div style={{overflow:"hidden",whiteSpace:"nowrap"}}><span style={{display:"inline-block",animation:"ticker 28s linear infinite",color:C.muted,fontSize:11,letterSpacing:2,textTransform:"uppercase"}}>{text}</span></div>;}
function ModuleNav({active,setActive}){
  return (
    <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:6,scrollbarWidth:"none"}}>
      {MODULES.map(m=>{
        const isActive = active===m.id;
        return (
          <button key={m.id} onClick={()=>setActive(m.id)}
            className={`mod-tab${isActive?" active":""}`}
            style={{
              background: isActive ? m.color+"1A" : "transparent",
              borderColor: isActive ? m.color : C.border,
              color: isActive ? m.color : C.muted,
              "--tab-color": m.color,
            }}>
            {/* Active bottom accent line */}
            {isActive && <span style={{position:"absolute",bottom:-3,left:6,right:6,height:2,background:m.color,borderRadius:2}}/>}
            <span style={{fontSize:13}}>{m.icon}</span>
            <span>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
function Inp({label,val,set,placeholder,style={}}){return <div style={{marginBottom:12,...style}}><div className="t-label" style={{color:C.muted,marginBottom:6}}>{label}</div><input value={val} onChange={e=>set(e.target.value)} placeholder={placeholder} style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:13,padding:"10px 12px",fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}/></div>;}
function Btn({onClick,disabled,color=C.accent,dark=false,children,style={},ghost=false,size="md"}){
  const pad = size==="sm"?"8px 14px":size==="lg"?"14px 24px":"11px 20px";
  const fz  = size==="sm"?11:size==="lg"?14:13;
  if(ghost) return <button onClick={onClick} disabled={disabled} className="btn btn-ghost" style={{padding:pad,fontSize:fz,...style}}>{children}</button>;
  return <button onClick={onClick} disabled={disabled} className="btn btn-primary" style={{background:disabled?C.border:`linear-gradient(135deg,${color},${color}bb)`,color:disabled?C.muted:dark?"#000":"#fff",padding:pad,fontSize:fz,...style}}>{children}</button>;
}


// ── Toast Notification System ─────────────────────────────────────────────────
let _toastSetFn = null;
function showToast(message, type="success", duration=3000) {
  if (_toastSetFn) _toastSetFn(prev => {
    const id = Date.now();
    setTimeout(() => _toastSetFn(p => p.filter(t => t.id !== id)), duration);
    return [...prev, { id, message, type }];
  });
}

function ToastProvider() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => { _toastSetFn = setToasts; return () => { _toastSetFn = null; }; }, []);
  if (!toasts.length) return null;
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{t.type==="success"?"✓":t.type==="error"?"✕":t.type==="warn"?"⚠":"ℹ"}</span>
          <span style={{flex:1}}>{t.message}</span>
          <button onClick={()=>_toastSetFn(p=>p.filter(x=>x.id!==t.id))} style={{background:"none",border:"none",cursor:"pointer",color:"inherit",fontSize:14,opacity:0.7,padding:"0 0 0 4px",fontFamily:"inherit"}}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ── Animated Score Counter ─────────────────────────────────────────────────────
function AnimatedScore({ value, color, size="large", suffix="/100", prefix="" }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const target = Number(value) || 0;
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(ease * target));
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [value]);
  const fontSize = size === "large" ? 80 : size === "medium" ? 52 : 36;
  const unitSize = size === "large" ? 22 : size === "medium" ? 16 : 13;
  return (
    <div style={{ display:"inline-flex", alignItems:"baseline", gap:4 }}>
      {prefix && <span style={{ fontSize:unitSize, color, fontWeight:700, opacity:0.7 }}>{prefix}</span>}
      <span className="score-counter" style={{ fontSize, color, textShadow:`0 0 40px ${color}44` }}>
        {display}
      </span>
      {suffix && <span style={{ fontSize:unitSize, color, fontWeight:600, opacity:0.6 }}>{suffix}</span>}
    </div>
  );
}

// ── Skeleton Loader ───────────────────────────────────────────────────────────
function SkeletonLine({ width="100%", height=14, style={} }) {
  return <div className="skeleton" style={{ width, height, borderRadius:4, marginBottom:8, ...style }}/>;
}
function SkeletonCard({ rows=3 }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
      <SkeletonLine width="60%" height={16} />
      {Array.from({length:rows}).map((_,i) => <SkeletonLine key={i} width={i===rows-1?"75%":"100%"} />)}
    </div>
  );
}
function SkeletonIssue() {
  return (
    <div style={{ background:C.surface, marginBottom:10, border:`1px solid ${C.border}44`, borderRadius:8, padding:"12px 14px" }}>
      <div style={{ display:"flex", gap:8, marginBottom:8 }}>
        <SkeletonLine width={60} height={20} style={{ marginBottom:0, borderRadius:10 }}/>
        <SkeletonLine width={80} height={20} style={{ marginBottom:0, borderRadius:10 }}/>
      </div>
      <SkeletonLine width="90%" height={12} />
      <SkeletonLine width="70%" height={12} />
    </div>
  );
}



// ── Command Palette (⌘K) ──────────────────────────────────────────────────────

// ── Command Palette (⌘K) ─────────────────────────────────────────────────────
function CommandPalette({ modules, setActiveModule, setAuthModal, user, onClose }) {
  const [q, setQ] = useState("");
  const inputRef = useRef(null);

  const commands = [
    ...modules.map(m => ({ type:"module", icon:m.icon, label:m.label, id:m.id, desc:`Open ${m.label}` })),
    { type:"action", icon:"✨", label:"Sign Up Free",      id:"signup",   desc:"Create your free account" },
    { type:"action", icon:"🔑", label:"Sign In",           id:"signin",   desc:"Sign in to your account" },
    { type:"action", icon:"⚙️", label:"Edit Profile",      id:"edit",     desc:"Update role, market, level" },
    { type:"action", icon:"📋", label:"Add Application",   id:"addapp",   desc:"Track a new job application" },
  ].filter(c => {
    if (c.id === "signup" || c.id === "signin") return !user;
    return true;
  });

  const filtered = q.trim()
    ? commands.filter(c => c.label.toLowerCase().includes(q.toLowerCase()) || c.desc.toLowerCase().includes(q.toLowerCase()))
    : commands;

  const [sel, setSel] = useState(0);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setSel(0); }, [q]);

  const run = (cmd) => {
    if (cmd.type === "module") { setActiveModule(cmd.id); }
    else if (cmd.id === "signup") { setAuthModal("register"); }
    else if (cmd.id === "signin") { setAuthModal("login"); }
    else if (cmd.id === "edit")   { window._setSetupDone && window._setSetupDone(false); }
    else if (cmd.id === "addapp") { setActiveModule("jobs"); }
    onClose();
  };

  const handleKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel(s => Math.min(s+1, filtered.length-1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSel(s => Math.max(s-1, 0)); }
    if (e.key === "Enter")     { if (filtered[sel]) run(filtered[sel]); }
    if (e.key === "Escape")    { onClose(); }
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(9,12,18,0.88)",zIndex:3000,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:120,backdropFilter:"blur(12px)",animation:"fadeIn 0.15s ease"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:560,background:"#0F1520",border:"1px solid #1E2D45",borderRadius:16,overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,0.6)",animation:"fadeIn 0.2s ease"}}>
        {/* Search input */}
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",borderBottom:"1px solid #1E2D45"}}>
          <span style={{color:"#6B7E9F",fontSize:16}}>⌘</span>
          <input
            ref={inputRef}
            value={q}
            onChange={e=>setQ(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search modules, actions..."
            style={{flex:1,background:"transparent",border:"none",color:"#E8F0FE",fontSize:14,fontFamily:"var(--font-mono)",outline:"none"}}
          />
          <kbd style={{background:"#131B2A",border:"1px solid #1E2D45",borderRadius:5,padding:"2px 8px",fontSize:10,color:"#6B7E9F",fontFamily:"var(--font-mono)"}}>ESC</kbd>
        </div>
        {/* Results */}
        <div style={{maxHeight:380,overflowY:"auto",padding:"6px 0"}}>
          {filtered.length === 0 && (
            <div style={{padding:"24px",textAlign:"center",color:"#6B7E9F",fontSize:13}}>No results for "{q}"</div>
          )}
          {filtered.map((cmd, i) => (
            <div key={cmd.id} onClick={()=>run(cmd)}
              style={{display:"flex",alignItems:"center",gap:12,padding:"10px 18px",cursor:"pointer",background:i===sel?"#131B2A":"transparent",borderLeft:`2px solid ${i===sel?"#00D4FF":"transparent"}`,transition:"all 0.1s"}}
              onMouseEnter={()=>setSel(i)}>
              <span style={{fontSize:18,flexShrink:0,width:28,textAlign:"center"}}>{cmd.icon}</span>
              <div style={{flex:1}}>
                <div style={{color:i===sel?"#E8F0FE":"#94A3B8",fontSize:13,fontWeight:600}}>{cmd.label}</div>
                <div style={{color:"#6B7E9F",fontSize:11,marginTop:2}}>{cmd.desc}</div>
              </div>
              <span style={{fontSize:10,color:"#6B7E9F",fontFamily:"var(--font-mono)",background:"#131B2A",padding:"2px 7px",borderRadius:4,flexShrink:0}}>
                {cmd.type === "module" ? "module" : "action"}
              </span>
            </div>
          ))}
        </div>
        {/* Footer hint */}
        <div style={{borderTop:"1px solid #1E2D45",padding:"8px 18px",display:"flex",gap:16}}>
          {[["↑↓","Navigate"],["↵","Select"],["ESC","Close"]].map(([k,l])=>(
            <div key={k} style={{display:"flex",alignItems:"center",gap:5}}>
              <kbd style={{background:"#131B2A",border:"1px solid #1E2D45",borderRadius:4,padding:"1px 6px",fontSize:10,color:"#6B7E9F",fontFamily:"var(--font-mono)"}}>{k}</kbd>
              <span style={{fontSize:10,color:"#6B7E9F"}}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Empty State component ─────────────────────────────────────────────────────
function EmptyState({ icon, title, desc, cta, onCta, ctaColor }) {
  return (
    <div style={{ textAlign:"center", padding:"48px 24px", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
      <div style={{ fontSize:52, lineHeight:1 }}>{icon}</div>
      <div style={{ color:C.text, fontWeight:800, fontSize:16, fontFamily:"var(--font-display)" }}>{title}</div>
      <div style={{ color:C.muted, fontSize:13, lineHeight:1.7, maxWidth:320 }}>{desc}</div>
      {cta && (
        <button onClick={onCta} style={{
          background:`linear-gradient(135deg,${ctaColor||C.accent},${ctaColor||C.accent}99)`,
          color: "#000", border:"none", borderRadius:10, padding:"11px 24px",
          fontWeight:900, fontSize:13, cursor:"pointer", fontFamily:"inherit",
          marginTop:8, transition:"all 0.15s"
        }}
          onMouseEnter={e=>e.currentTarget.style.filter="brightness(1.1)"}
          onMouseLeave={e=>e.currentTarget.style.filter="none"}
          onMouseDown={e=>e.currentTarget.style.transform="scale(0.97)"}
          onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
        >
          {cta}
        </button>
      )}
    </div>
  );
}
// ── Scan prompt ───────────────────────────────────────────────────────────────
function buildScanPrompt(form){
  return `You are a ruthless hiring expert. Analyze this resume for ${form.level} ${form.role} in ${form.industry}, ${form.market}.
Return ONLY raw JSON (no markdown, start with {):
{"credibilityScore":0-100,"metricsFound":0,"summary":"2-3 sentence verdict","issues":[{"severity":"critical|warning|ok","type":"Vague Bullet|Missing Metric|Weak Ownership|Strong Claim","original":"short quote max 8 words","fix":"specific fix"}],"interrogationQuestions":[{"source":"which claim","question":"tough specific question"}]}
Generate 4-6 issues and 5-7 questions hyper-specific to this resume's actual companies, roles, and claims.`;
}

// ── Resume Scan ───────────────────────────────────────────────────────────────
function ResumeScan({resumeText,setResumeText,scanResult,setScanResult,form,memory,updateMemory,onFirstUse}){
  const [scanning,setScanning]=useState(false);
  const [progress,setProgress]=useState(0);
  const [step,setStep]=useState("");
  const [dragOver,setDragOver]=useState(false);
  const [fileErr,setFileErr]=useState("");
  const [paste,setPaste]=useState("");
  const fileRef=useRef();
  const steps=["Parsing structure...","Extracting claims...","Detecting vague bullets...","Identifying gaps...","Analyzing stories...","Generating questions...","Computing score..."];

  const handleFile=async(file)=>{
    setFileErr("");
    try{const r=await readResumeFile(file);if(r.type==="text"&&r.content.trim().length<30){setFileErr("File appears empty — please paste text below.");return;}setResumeText(r);setScanResult(null);setPaste("");}
    catch(e){setFileErr("Could not read file: "+e.message);}
  };

  const confirmPaste=()=>{
    if(paste.trim().length<50){setFileErr("Too short — paste your full resume.");return;}
    setFileErr(""); setResumeText({type:"text",content:paste.trim(),fileName:"Pasted Resume"}); setScanResult(null);
  };

  const runScan=async()=>{
    if(!resumeText)return;
    setScanning(true); setScanResult(null); setProgress(0); setFileErr("");
    if (onFirstUse) onFirstUse();
    
    let s=0;
    const iv = setInterval(() => {
      s++;
      if (s < steps.length) {
        setProgress(Math.round((s / steps.length) * 92));
        setStep(steps[s] || "Processing...");
      } else {
        // Slow crawl while waiting for LLM
        setProgress(prev => Math.min(prev + 0.5, 98));
      }
    }, 800);

    try{
      const content=resumeText.content||"";
      if(!content||content.trim().length<30)throw new Error("Resume text is empty. Please paste manually.");
      
      const provider = detectProvider(MODEL_ROUTING.scan);
      const key = LLM_KEYS[provider];
      if (!key || key.includes("YOUR_") || key.includes("PLACEHOLDER")) {
        throw new Error(`API key for ${provider} not configured. Please add it to your .env file.`);
      }

      console.log(`[Scan] Starting scan with content length: ${content.length}`);
      const raw=await callLLM([{role:"user",content:`RESUME:\n\n${content.slice(0,3000)}\n\n---\n\n${buildScanPrompt(form)}`}],2000,"scan");
      console.log(`[Scan] LLM responded, length: ${raw?.length}`);
      if (!raw) { console.error("[Scan] LLM returned nothing!"); throw new Error("AI returned an empty response."); }
      const parsed=extractJSON(raw);
      console.log("[Scan] Parsed result:", parsed);
      if (parsed.error) throw new Error(parsed.msg);
      clearInterval(iv); setProgress(100); setStep("Done.");
      console.log("[Scan] Updating memory...");
      if (updateMemory) updateMemory(m => ({
        scanHistory: [...(m.scanHistory||[]), {
          date: new Date().toISOString(), score: parsed.credibilityScore,
          issues: parsed.issues, fileName: resumeText.fileName
        }].slice(-10)
      }));
      console.log("[Scan] Scan complete. Showing results.");
      setTimeout(()=>{setScanning(false);setScanResult(parsed);},400);
    }catch(e){clearInterval(iv);setScanning(false);setScanResult({error:true,msg:e.message});}
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div><div className="t-h1" style={{color:C.text}}>Resume Deep Scan Engine</div><div style={{color:C.muted,fontSize:13,marginTop:4,fontFamily:"var(--font-body)"}}>Upload your resume. AI interrogates every bullet. No vagueness survives.</div></div>
        {resumeText&&<Btn onClick={runScan} disabled={scanning} color={C.accent} dark style={{width:"auto",padding:"10px 20px"}}>{scanning?"Scanning...":scanResult&&!scanResult.error?"Re-Scan":"⚡ Run Deep Scan"}</Btn>}
      </div>
      {resumeText&&(
        <Card style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}><div style={{fontSize:28}}>📄</div><div><div className="t-h3" style={{color:C.text}}>{resumeText.fileName}</div><div style={{color:C.green,fontSize:12,marginTop:2}}>✓ Loaded — click Run Deep Scan</div></div></div>
          <button onClick={()=>{setResumeText(null);setScanResult(null);setPaste("");setFileErr("");}} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,padding:"6px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Remove</button>
        </Card>
      )}
      {!resumeText&&(
        <>
          <div onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);if(e.dataTransfer.files[0])handleFile(e.dataTransfer.files[0]);}} onClick={()=>fileRef.current.click()} style={{border:`2px dashed ${dragOver?C.accent:C.border}`,borderRadius:14,padding:"48px 32px",textAlign:"center",background:dragOver?C.accentGlow:C.surface,cursor:"pointer",transition:"all 0.2s"}}>
            <div style={{fontSize:48,marginBottom:10}}>📂</div>
            <div style={{color:C.text,fontWeight:700,fontSize:15,marginBottom:6}}>Drop resume here or click to browse</div>
            <div style={{color:C.muted,fontSize:12,marginBottom:14}}>PDF · DOCX · DOC · TXT · RTF</div>
            <Badge label="Browse Files" color={C.accent}/>
            <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt,.rtf" onChange={e=>{if(e.target.files[0])handleFile(e.target.files[0]);e.target.value="";}} style={{display:"none"}}/>
          </div>
          {fileErr&&<div style={{background:C.red+"15",border:`1px solid ${C.red}44`,borderRadius:8,padding:"10px 14px",color:C.red,fontSize:13}}>⚠️ {fileErr}</div>}
          <div style={{display:"flex",alignItems:"center",gap:12}}><div style={{flex:1,height:1,background:C.border}}/><span style={{color:C.muted,fontSize:11,letterSpacing:2,whiteSpace:"nowrap"}}>OR PASTE TEXT</span><div style={{flex:1,height:1,background:C.border}}/></div>
          <div>
            <textarea value={paste} onChange={e=>{setPaste(e.target.value);setFileErr("");}} placeholder="Paste your full resume text here..." style={{width:"100%",minHeight:140,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:12,padding:14,fontFamily:"inherit",resize:"vertical",lineHeight:1.7,boxSizing:"border-box",display:"block",outline:"none"}}/>
            <Btn onClick={confirmPaste} disabled={paste.trim().length<50} color={C.accent} dark style={{marginTop:10}}>✓ Use This Resume Text</Btn>
          </div>
        </>
      )}
      {scanning&&(
        <Card>
          {/* Segmented step indicator */}
          {(()=>{
            const steps=[
              {label:"Parsing",threshold:0},
              {label:"Structure",threshold:25},
              {label:"Metrics",threshold:45},
              {label:"Issues",threshold:65},
              {label:"Questions",threshold:82},
              {label:"Scoring",threshold:95},
            ];
            const currentStep = steps.filter(s=>progress>=s.threshold).length - 1;
            return(
              <div style={{marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:C.accent,animation:"pulse 1s ease infinite"}}/>
                    <span style={{color:C.accent,fontSize:13,fontFamily:"var(--font-mono)"}}>{step}</span>
                  </div>
                  <span style={{color:C.muted,fontSize:11,fontFamily:"var(--font-mono)",fontWeight:700}}>{progress}%</span>
                </div>
                <div style={{display:"flex",gap:4,marginBottom:12}}>
                  {steps.map((s,i)=>(
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <div style={{
                        height:4, width:"100%", borderRadius:2,
                        background: i<=currentStep
                          ? i<currentStep ? C.accent : C.accent+"88"
                          : C.border,
                        transition:"background 0.4s ease",
                        boxShadow: i===currentStep ? `0 0 8px ${C.accent}66` : "none",
                      }}/>
                      <span style={{fontSize:9,color:i<=currentStep?C.accent:C.muted,fontFamily:"var(--font-mono)",whiteSpace:"nowrap"}}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          <GlowBar score={progress} color={C.accent} height={6}/>
          {progress>30&&(
            <div style={{marginTop:16}}>
              <div style={{color:C.muted,fontSize:10,marginBottom:10,textTransform:"uppercase",letterSpacing:1,fontFamily:"var(--font-mono)"}}>Detected issues...</div>
              <SkeletonIssue/><SkeletonIssue/>
              {progress>60&&<SkeletonIssue/>}
            </div>
          )}
        </Card>
      )}
      {scanResult?.error&&<ErrCard msg={scanResult.msg}/>}
      {scanResult&&!scanResult.error&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            {[
              {label:"Credibility Score",color:scanResult.credibilityScore>=70?C.green:scanResult.credibilityScore>=50?C.gold:C.red,
               content:<AnimatedScore value={scanResult.credibilityScore} color={scanResult.credibilityScore>=70?C.green:scanResult.credibilityScore>=50?C.gold:C.red} size="medium"/>},
              {label:"Metric Bullets",color:C.accent,
               content:<AnimatedScore value={scanResult.metricsFound} color={C.accent} size="medium" suffix=" found"/>},
              {label:"Issues Found",color:C.red,
               content:<AnimatedScore value={scanResult.issues?.length||0} color={C.red} size="medium" suffix={` issue${(scanResult.issues?.length||0)!==1?"s":""}`}/>}
            ].map(s=><Card key={s.label} glow={s.color} animate>
              <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:1.2,marginBottom:10}}>{s.label}</div>
              {s.content}
            </Card>)}
          </div>
          {memory?.scanHistory?.length > 1 && (
            <Card glow={C.gold}>
              <div style={{color:C.gold,fontWeight:700,fontSize:13,marginBottom:10}}>📈 Your Scan History ({memory.scanHistory.length} scans)</div>
              <div style={{display:"flex",gap:6,alignItems:"flex-end",height:48,marginBottom:8}}>
                {memory.scanHistory.slice(-8).map((s,i)=>{
                  const h=Math.max(8,Math.round((s.score/100)*48));
                  const c=s.score>=70?C.green:s.score>=50?C.gold:C.red;
                  return <div key={i} title={`${s.score}/100 — ${new Date(s.date).toLocaleDateString()}`} style={{flex:1,height:h,background:c,borderRadius:3,transition:"height 0.5s",cursor:"help"}}/>;
                })}
              </div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div style={{color:C.muted,fontSize:11}}>First: {memory.scanHistory[0].score}/100</div>
                {memory.scanHistory.length>1&&<div style={{color:memory.scanHistory[memory.scanHistory.length-1].score>memory.scanHistory[0].score?C.green:C.red,fontSize:11,fontWeight:700}}>
                  {memory.scanHistory[memory.scanHistory.length-1].score>memory.scanHistory[0].score?"📈 Improving":"📉 Needs work"} · {memory.scanHistory[memory.scanHistory.length-1].score-memory.scanHistory[0].score>0?"+":""}{memory.scanHistory[memory.scanHistory.length-1].score-memory.scanHistory[0].score} pts
                </div>}
                <div style={{color:C.muted,fontSize:11}}>Latest: {memory.scanHistory[memory.scanHistory.length-1].score}/100</div>
              </div>
            </Card>
          )}
          {scanResult.summary&&<Card glow={C.purple}><div style={{color:C.purple,fontWeight:700,marginBottom:8,fontSize:12,textTransform:"uppercase",letterSpacing:1}}>🧠 AI Verdict</div><div style={{color:C.text,fontSize:14,lineHeight:1.8}}>{scanResult.summary}</div></Card>}
          <Card><div style={{color:C.text,fontWeight:700,marginBottom:14,fontSize:14}}>📋 Issue Report</div>{scanResult.issues?.map((issue,i)=><div key={i} style={{background:C.surface,marginBottom:10,border:`1px solid ${issue.severity==="critical"?C.red+"55":issue.severity==="warning"?C.gold+"44":C.green+"44"}`,borderRadius:8,padding:"12px 14px"}}><div style={{display:"flex",gap:8,marginBottom:8}}><Badge label={issue.severity} color={issue.severity==="critical"?C.red:issue.severity==="warning"?C.gold:C.green}/><span style={{color:C.muted,fontSize:11}}>{issue.type}</span></div><div style={{color:C.accent,fontSize:12,fontFamily:"var(--font-mono)",marginBottom:8,background:"#0A1020",padding:"6px 10px",borderRadius:6}}>"{issue.original}"</div><div style={{color:C.gold,fontSize:12}}>💡 {issue.fix}</div></div>)}</Card>
          {/* Post-scan flow nudge */}
          <div style={{background:`linear-gradient(135deg,${C.purple}22,${C.accent}11)`,border:`1px solid ${C.accent}33`,borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
            <div>
              <div style={{color:C.text,fontWeight:800,fontSize:14,marginBottom:4}}>Next step: See your full weakness breakdown</div>
              <div style={{color:C.muted,fontSize:12}}>Weakness Radar maps exactly which skills are costing you interviews.</div>
            </div>
            <button onClick={()=>window._setActiveModule&&window._setActiveModule("radar")} style={{background:`linear-gradient(135deg,${C.accent},#0096CC)`,color:"#000",border:"none",borderRadius:8,padding:"10px 18px",fontWeight:900,fontSize:12,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
              📡 See Weakness Radar →
            </button>
          </div>

          <Card><div style={{color:C.text,fontWeight:700,marginBottom:6,fontSize:14}}>🔥 Personalized Interrogation Questions</div><div style={{color:C.muted,fontSize:12,marginBottom:14}}>Generated from YOUR resume — a real hiring manager will ask exactly these.</div>{scanResult.interrogationQuestions?.map((q,i)=><div key={i} style={{background:C.accentGlow,border:`1px solid ${C.accent}33`,borderRadius:8,padding:"12px 14px",marginBottom:10}}><div style={{color:C.accent,fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Q{i+1} · {q.source}</div><div style={{color:C.text,fontSize:13,lineHeight:1.7}}>{q.question}</div></div>)}</Card>
        </>
      )}
    </div>
  );
}

// ── JD Analyzer ───────────────────────────────────────────────────────────────
function JDAnalyzer({resumeText,form,memory,updateMemory}){
  const [jd,setJd]=useState(""); const [result,setResult]=useState(null); const [loading,setLoading]=useState(false); const [err,setErr]=useState("");
  const analyze=async()=>{
    if(jd.trim().length<50){setErr("Paste a full job description first.");return;}
    setLoading(true);setResult(null);setErr("");
    const ctx=resumeText?.content?`\nCANDIDATE RESUME:\n${resumeText.content.slice(0,1800)}`:`\nCandidate: ${form.level} ${form.role} in ${form.industry}`;
    try{
    const memCtx = memory ? buildMemoryContext(memory, form) : "";
    const raw=await callLLM([{role:"user",content:`Expert recruiter. Analyze JD vs candidate.${memCtx}\nJD:\n${jd.slice(0,2500)}${ctx}\nReturn ONLY raw JSON:\n{"matchScore":0-100,"roleTitle":"...","company":"...","keyRequirements":["..."],"candidateStrengths":["..."],"criticalGaps":["..."],"hiddenKeywords":["..."],"redFlags":["..."],"applicationAdvice":"...","interviewFocus":["..."]}`}],2000,"jd");
    const parsed=extractJSON(raw);
    if (parsed.error) throw new Error(parsed.msg);
    setResult(parsed);
    if(updateMemory) updateMemory(m=>({jdAnalyses:[{date:new Date().toISOString(),company:parsed.company,matchScore:parsed.matchScore,role:parsed.roleTitle},...(m.jdAnalyses||[])].slice(-20)}));}
    catch(e){setErr(e.message);}
    setLoading(false);
  };
  const mc=result?(result.matchScore>=75?C.green:result.matchScore>=50?C.gold:C.red):C.pink;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div><div className="t-h1" style={{color:C.text}}>Job Description Analyzer</div><div style={{color:C.muted,fontSize:13,marginTop:4,fontFamily:"var(--font-body)"}}>Paste any JD. Get match score, ATS keywords, red flags, and your exact positioning strategy.</div></div>
      <Card><div className="t-label" style={{color:C.muted,marginBottom:8}}>Paste Job Description</div><textarea value={jd} onChange={e=>{setJd(e.target.value);setErr("");}} placeholder="Paste the full job description here..." style={{width:"100%",minHeight:160,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:12,padding:12,fontFamily:"inherit",resize:"vertical",lineHeight:1.7,boxSizing:"border-box",display:"block",outline:"none"}}/>{err&&<ErrCard msg={err}/>}<Btn onClick={analyze} disabled={loading||jd.trim().length<50} color={C.pink} style={{marginTop:12}}>{loading?"Analyzing JD...":"🔍 Analyze This Job"}</Btn></Card>
      {loading&&<Card><Spinner label="Matching JD against your profile..."/></Card>}
      {result&&!loading&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            <Card glow={mc} style={{textAlign:"center"}} animate>
              <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Match Score</div>
              <AnimatedScore value={result.matchScore} color={mc} size="medium" suffix="%"/>
              <div style={{color:C.muted,fontSize:11,marginTop:8}}>{result.matchScore>=75?"Strong fit":result.matchScore>=50?"Possible":"Stretch role"}</div>
            </Card>
            <Card glow={C.accent} style={{gridColumn:"span 2"}}><div className="t-label" style={{color:C.muted,marginBottom:6}}>Role</div><div style={{color:C.text,fontWeight:800,fontSize:15}}>{result.roleTitle}</div><div style={{color:C.muted,fontSize:12,marginTop:2}}>{result.company}</div></Card>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Card glow={C.green}><div style={{color:C.green,fontWeight:700,fontSize:13,marginBottom:10}}>✅ Your Strengths</div>{result.candidateStrengths?.map((s,i)=><div key={i} style={{color:C.text,fontSize:12,marginBottom:6,paddingLeft:12,borderLeft:`2px solid ${C.green}44`}}>• {s}</div>)}</Card>
            <Card glow={C.red}><div style={{color:C.red,fontWeight:700,fontSize:13,marginBottom:10}}>⚠️ Critical Gaps</div>{result.criticalGaps?.map((g,i)=><div key={i} style={{color:C.text,fontSize:12,marginBottom:6,paddingLeft:12,borderLeft:`2px solid ${C.red}44`}}>• {g}</div>)}</Card>
          </div>
          <Card glow={C.gold}><div style={{color:C.gold,fontWeight:700,fontSize:13,marginBottom:10}}>🔑 ATS Keywords — Add These to Your Resume</div><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{result.hiddenKeywords?.map((kw,i)=><span key={i} style={{background:C.gold+"22",color:C.gold,border:`1px solid ${C.gold}44`,borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:700}}>{kw}</span>)}</div></Card>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Card><div style={{color:C.accent,fontWeight:700,fontSize:13,marginBottom:10}}>📋 Key Requirements</div>{result.keyRequirements?.map((r,i)=><div key={i} style={{color:C.text,fontSize:12,marginBottom:6}}>→ {r}</div>)}</Card>
            <Card><div style={{color:C.purple,fontWeight:700,fontSize:13,marginBottom:10}}>🎯 Interview Focus</div>{result.interviewFocus?.map((f,i)=><div key={i} style={{color:C.text,fontSize:12,marginBottom:6,background:C.purple+"11",borderRadius:6,padding:"6px 10px"}}>{f}</div>)}</Card>
          </div>
          {result.redFlags?.length>0&&<Card glow={C.red}><div style={{color:C.red,fontWeight:700,fontSize:13,marginBottom:10}}>🚨 Red Flags in This JD</div>{result.redFlags.map((f,i)=><div key={i} style={{color:C.text,fontSize:13,marginBottom:6,padding:"8px 12px",background:C.red+"11",borderRadius:6}}>⚠️ {f}</div>)}</Card>}
          <Card glow={C.accent}><div style={{color:C.accent,fontWeight:700,fontSize:13,marginBottom:8}}>💡 Application Strategy</div><div style={{color:C.text,fontSize:13,lineHeight:1.8}}>{result.applicationAdvice}</div></Card>
        </>
      )}
    </div>
  );
}

// ── STAR Builder ──────────────────────────────────────────────────────────────
function STARBuilder({resumeText,form,memory,updateMemory}){
  const [S,setS]=useState(""); const [T,setT]=useState(""); const [A,setA]=useState(""); const [R,setR]=useState("");
  const [refined,setRefined]=useState(null); const [loading,setLoading]=useState(false); const [bank,setBank]=useState([]);
  const refine=async()=>{
    if(!S||!T||!A||!R)return; setLoading(true); setRefined(null);
    const ctx=resumeText?.content?`Resume: ${resumeText.content.slice(0,600)}`:`${form.level} ${form.role}`;
    try{const raw=await callLLM([{role:"user",content:`Expert interview coach. Refine STAR story for ${form.level} ${form.role}, ${form.market}.\n${ctx}\nSituation:${S}\nTask:${T}\nAction:${A}\nResult:${R}\nReturn ONLY raw JSON:\n{"score":0-100,"refined":{"situation":"...","task":"...","action":"3-4 bullet points","result":"quantified result"},"strengths":"...","improvements":"...","bestUsedFor":["q1","q2","q3"],"oneLiner":"punchy 1-sentence version"}`}],1500,"star");
    const p=extractJSON(raw);setRefined(p);
    const story={id:Date.now(),oneLiner:p.oneLiner,score:p.score,situation:S,task:T,action:A,result:R,refined:p.refined};
    setBank(prev=>[story,...prev.slice(0,4)]);
    if(updateMemory) updateMemory(m=>({starBank:[story,...(m.starBank||[])].slice(-20)}));
    showToast(`⭐ Story banked — score ${p.score}/100`, "success");}
    catch(e){setRefined({error:e.message});}setLoading(false);
  };
  const fc=[C.accent,C.gold,C.purple,C.green];
  const fields=[{l:"Situation",h:"What was the context?",v:S,set:setS,rows:3},{l:"Task",h:"What was YOUR responsibility?",v:T,set:setT,rows:2},{l:"Action",h:"What specific actions did YOU take?",v:A,set:setA,rows:4},{l:"Result",h:"What was the measurable outcome?",v:R,set:setR,rows:2}];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div><div className="t-h1" style={{color:C.text}}>STAR Story Builder</div><div style={{color:C.muted,fontSize:13,marginTop:4,fontFamily:"var(--font-body)"}}>Build, score, and bank your best interview stories.</div></div>
        {(bank.length+(memory?.starBank?.length||0))>0&&<Badge label={`${bank.length+(memory?.starBank?.length||0)} total banked`} color={C.gold}/>}
      </div>
      <Card>{fields.map((f,i)=><div key={f.l} style={{marginBottom:14}}><div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}><span style={{background:fc[i]+"22",color:fc[i],borderRadius:4,padding:"2px 8px",fontSize:10,fontWeight:800,letterSpacing:1}}>{f.l.toUpperCase()}</span><span style={{color:C.muted,fontSize:11}}>{f.h}</span></div><textarea value={f.v} onChange={e=>f.set(e.target.value)} rows={f.rows} style={{width:"100%",background:C.surface,border:`1px solid ${fc[i]}44`,borderRadius:8,color:C.text,fontSize:13,padding:"10px 12px",fontFamily:"inherit",resize:"vertical",lineHeight:1.7,boxSizing:"border-box",display:"block",outline:"none"}}/></div>)}<Btn onClick={refine} disabled={loading||!S||!T||!A||!R} color={C.gold} dark>{loading?"Refining...":"⭐ Refine My Story"}</Btn></Card>
      {loading&&<Card><Spinner label="Polishing your story..."/></Card>}
      {refined&&!refined.error&&!loading&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Card glow={refined.score>=75?C.green:refined.score>=50?C.gold:C.red}><div className="t-label" style={{color:C.muted,marginBottom:4}}>Story Score</div><div style={{color:refined.score>=75?C.green:refined.score>=50?C.gold:C.red,fontSize:36,fontWeight:900}}>{refined.score}/100</div></Card>
            <Card glow={C.accent}><div className="t-label" style={{color:C.muted,marginBottom:4}}>One-Liner</div><div style={{color:C.text,fontSize:12,lineHeight:1.6,fontStyle:"italic"}}>"{refined.oneLiner}"</div></Card>
          </div>
          <Card glow={C.gold}><div style={{color:C.gold,fontWeight:700,fontSize:13,marginBottom:12}}>✨ Refined Story</div>{[["Situation",refined.refined?.situation,C.accent],["Task",refined.refined?.task,C.gold],["Action",refined.refined?.action,C.purple],["Result",refined.refined?.result,C.green]].map(([l,v,col])=><div key={l} style={{marginBottom:12,padding:"10px 14px",background:C.surface,borderRadius:8,borderLeft:`3px solid ${col}`}}><div style={{color:col,fontSize:10,fontWeight:800,letterSpacing:1,marginBottom:6}}>{l.toUpperCase()}</div><div style={{color:C.text,fontSize:13,lineHeight:1.7,whiteSpace:"pre-line"}}>{Array.isArray(v)?v.join("\n"):v}</div></div>)}</Card>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Card><div style={{color:C.green,fontWeight:700,fontSize:12,marginBottom:8}}>💪 Strengths</div><div style={{color:C.text,fontSize:12,lineHeight:1.7}}>{refined.strengths}</div></Card>
            <Card><div style={{color:C.red,fontWeight:700,fontSize:12,marginBottom:8}}>🔧 What Was Weak</div><div style={{color:C.text,fontSize:12,lineHeight:1.7}}>{refined.improvements}</div></Card>
          </div>
          <Card><div style={{color:C.purple,fontWeight:700,fontSize:13,marginBottom:10}}>🎯 Best Used When Asked:</div>{refined.bestUsedFor?.map((q,i)=><div key={i} style={{color:C.text,fontSize:13,padding:"8px 12px",background:C.purple+"11",borderRadius:6,marginBottom:6}}>"{q}"</div>)}</Card>
        </>
      )}
      {bank.length===0&&<EmptyState icon="⭐" title="Your story bank is empty" desc="Refine a STAR story above and it will be saved here for every future interview." cta="Build my first story ↑" onCta={()=>document.querySelector('[rows="3"]')?.focus()} ctaColor={C.gold}/>}
      {bank.length>0&&<Card><div style={{color:C.text,fontWeight:700,fontSize:13,marginBottom:12}}>📚 Story Bank ({bank.length})</div>{bank.map(s=><div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:C.surface,borderRadius:8,marginBottom:8}}><div style={{color:C.text,fontSize:12,flex:1}}>"{s.oneLiner}"</div><Badge label={`${s.score}/100`} color={s.score>=75?C.green:s.score>=50?C.gold:C.red}/></div>)}</Card>}
    </div>
  );
}

// ── HM Simulator ──────────────────────────────────────────────────────────────
function HiringManagerSim({resumeText,scanResult,form,memory,updateMemory,onProTrigger}){
  const [mode,setMode]=useState(null); const [qType,setQType]=useState("behavioral");
  const [questions,setQuestions]=useState([]); const [qi,setQi]=useState(0);
  const [answer,setAnswer]=useState(""); const [feedback,setFeedback]=useState(null);
  const [loadQ,setLoadQ]=useState(false); const [loadFB,setLoadFB]=useState(false);
  const modes=[{id:"startup",label:"Seed Startup",icon:"🚀",desc:"Fast-paced, scrappy",color:C.gold},{id:"seriesb",label:"Series B",icon:"📈",desc:"Metrics obsessed",color:C.accent},{id:"enterprise",label:"Enterprise",icon:"🏢",desc:"Stakeholder-centric",color:C.purple},{id:"technical",label:"Technical Lead",icon:"⚙️",desc:"Depth over breadth",color:C.red}];
  const mc={startup:C.gold,seriesb:C.accent,enterprise:C.purple,technical:C.red};
  const ctx=resumeText?.content?`\nRESUME:\n${resumeText.content.slice(0,2000)}`:scanResult?`\nScan: score ${scanResult.credibilityScore}/100`:`\nTarget: ${form.level} ${form.role}`;
  const loadQuestions=async(m,t)=>{
    setLoadQ(true);setQuestions([]);setQi(0);setAnswer("");setFeedback(null);
    const ml=modes.find(x=>x.id===m)?.label;
    try{const raw=await callLLM([{role:"user",content:`${ml} interviewer for ${form.level} ${form.role}, ${form.industry}, ${form.market}.${ctx}\nGenerate 5 hyper-specific ${t} questions from THIS candidate's background.\nReturn ONLY raw JSON array:\n[{"question":"...","why":"why this tests this candidate"}]`}],1000,"simulate");setQuestions(extractJSON(raw));}
    catch{setQuestions([{question:`Walk me through your most impactful project as a ${form.role}.`,why:"Core competency test"}]);}
    setLoadQ(false);
  };
  const pickMode=m=>{setMode(m);loadQuestions(m,qType);};
  const changeType=t=>{setQType(t);if(mode)loadQuestions(mode,t);};
  const getFeedback=async()=>{
    if(!answer.trim()||!questions[qi])return;setLoadFB(true);setFeedback(null);
    const ml=modes.find(x=>x.id===mode)?.label;
    try{const raw=await callLLM([{role:"user",content:`${ml} hiring manager, ${form.level} ${form.role}, ${form.market}.${ctx}\nQ:"${questions[qi].question}"\nA:"${answer}"\nEvaluate harshly. Call out resume inconsistencies.\nReturn ONLY raw JSON:\n{"score":0-100,"verdict":"Strong|Acceptable|Weak|Critical Gap","whatWorked":"...","whatMissed":"...","starGap":"...","resumeDisconnect":"mismatch or Consistent","rewriteTip":"...","followUp":"..."}`}],1000,"simulate");setFeedback(extractJSON(raw));}
    catch(e){setFeedback({score:0,verdict:"Error",whatWorked:"N/A",whatMissed:e.message,starGap:"N/A",resumeDisconnect:"N/A",rewriteTip:"Try again.",followUp:"N/A"});}
    setLoadFB(false);
  };
  const ac=mc[mode]||C.accent;
  const vc={Strong:C.green,Acceptable:C.gold,Weak:C.red,"Critical Gap":C.red};
  if(!mode)return(<div style={{display:"flex",flexDirection:"column",gap:16}}><div><div className="t-h1" style={{color:C.text}}>Hiring Manager Simulator</div><div style={{color:C.muted,fontSize:13,marginTop:4,fontFamily:"var(--font-body)"}}>{resumeText?"✅ Resume loaded — questions personalized to YOU.":"⚠️ Upload resume for personalized questions."}</div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{modes.map(m=><Card key={m.id} glow={m.color} style={{cursor:"pointer"}}><div onClick={()=>pickMode(m.id)}><div style={{fontSize:32,marginBottom:10}}>{m.icon}</div><div style={{color:m.color,fontWeight:800,fontSize:15,marginBottom:4}}>{m.label}</div><div style={{color:C.muted,fontSize:12,marginBottom:12}}>{m.desc}</div><Badge label="Select Mode" color={m.color}/></div></Card>)}</div></div>);
  const cq=questions[qi];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div className="t-h1" style={{color:C.text}}>{modes.find(m=>m.id===mode)?.icon} {modes.find(m=>m.id===mode)?.label}</div><div style={{color:C.muted,fontSize:12,marginTop:2}}>{resumeText?"🎯 Personalized":"📋 Generic mode"}</div></div><button onClick={()=>{setMode(null);setFeedback(null);setAnswer("");}} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,padding:"6px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>← Change</button></div>
      <div style={{display:"flex",gap:8}}>{["behavioral","technical","leadership"].map(t=><button key={t} onClick={()=>changeType(t)} style={{background:qType===t?ac+"22":"transparent",border:`1px solid ${qType===t?ac:C.border}`,color:qType===t?ac:C.muted,borderRadius:6,padding:"6px 14px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:700,textTransform:"capitalize"}}>{t}</button>)}</div>
      {loadQ?<Card><Spinner label="Generating personalized questions..."/></Card>:cq?(
        <>
          <Card glow={ac}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{color:C.muted,fontSize:11,textTransform:"uppercase",letterSpacing:1}}>Q {qi+1}/{questions.length}</span>{resumeText&&<Badge label="Personalized" color={ac}/>}</div><div style={{color:C.text,fontSize:15,fontWeight:600,lineHeight:1.7,marginBottom:8}}>{cq.question}</div>{cq.why&&<div style={{color:C.muted,fontSize:11,borderTop:`1px solid ${C.border}`,paddingTop:8}}>💡 Why: {cq.why}</div>}</Card>
          <textarea value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="STAR answer: Situation → Task → Action → Result. Be specific with numbers." style={{width:"100%",minHeight:120,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:13,padding:16,fontFamily:"inherit",resize:"vertical",lineHeight:1.7,boxSizing:"border-box",outline:"none"}}/>
          <div style={{display:"flex",gap:10}}><Btn onClick={getFeedback} disabled={loadFB||!answer.trim()} color={ac} dark style={{flex:1}}>{loadFB?"Analyzing...":"🧠 Get AI Feedback"}</Btn><button onClick={()=>{setQi(q=>(q+1)%questions.length);setAnswer("");setFeedback(null);}} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:8,padding:"11px 16px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Next →</button></div>
          {loadFB&&<Card><Spinner label="Evaluating against your resume..."/></Card>}
          {feedback&&!loadFB&&<Card glow={vc[feedback.verdict]||C.accent}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><span style={{color:vc[feedback.verdict]||C.accent,fontWeight:900,fontSize:20}}>{feedback.verdict}</span><div style={{width:58,height:58,borderRadius:"50%",background:`conic-gradient(${vc[feedback.verdict]||C.accent} ${feedback.score*3.6}deg,${C.border} 0)`,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:44,height:44,borderRadius:"50%",background:C.card,display:"flex",alignItems:"center",justifyContent:"center",color:C.text,fontWeight:900,fontSize:15}}>{feedback.score}</div></div></div>{[["✅ What Worked",feedback.whatWorked,C.green],["⚠️ What Missed",feedback.whatMissed,C.red],["🔍 STAR Gap",feedback.starGap,C.gold],["📄 Resume Disconnect",feedback.resumeDisconnect,C.purple],["✏️ Rewrite Tip",feedback.rewriteTip,C.accent],["🔥 Follow-Up",feedback.followUp,C.pink]].map(([l,v,col])=><div key={l} style={{marginBottom:10}}><div style={{color:col,fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{l}</div><div style={{color:C.text,fontSize:13,lineHeight:1.6,background:C.surface,borderRadius:8,padding:"8px 12px"}}>{v}</div></div>)}</Card>}
        </>
      ):<Card><div style={{color:C.muted}}>No questions generated. Try switching type.</div></Card>}
    </div>
  );
}

// ── Salary Coach ──────────────────────────────────────────────────────────────
function SalaryCoach({resumeText,form,memory,updateMemory,onProTrigger}){
  const [offer,setOffer]=useState(""); const [target,setTarget]=useState(""); const [stage,setStage]=useState("received_offer");
  const [result,setResult]=useState(null); const [loading,setLoading]=useState(false);
  const [roleplay,setRoleplay]=useState(false); const [chat,setChat]=useState([]); const [msg,setMsg]=useState(""); const [chatLoad,setChatLoad]=useState(false);
  const stages=[{id:"received_offer",label:"Got an Offer",icon:"📩"},{id:"pre_interview",label:"Before Interviews",icon:"🎯"},{id:"negotiating",label:"Mid-Negotiation",icon:"🤝"},{id:"counter_offer",label:"Counter Offer",icon:"⚡"}];
  const ctx=resumeText?.content?resumeText.content.slice(0,600):`${form.level} ${form.role}`;
  const analyze=async()=>{
    if(!offer.trim())return;setLoading(true);setResult(null);
    try{const raw=await callLLM([{role:"user",content:`Salary negotiation coach for ${form.market}.\nCandidate: ${form.level} ${form.role}, ${form.industry}\nOffer: ${offer}\nTarget: ${target||"not specified"}\nStage: ${stage}\nResume: ${ctx}\nReturn ONLY raw JSON:\n{"marketMin":"...","marketMid":"...","marketMax":"...","assessment":"...","negotiationRoom":"...","openingAsk":"...","tactics":["..."],"scripts":[{"label":"Opening","text":"..."},{"label":"Handling pushback","text":"..."},{"label":"Closing","text":"..."}],"leveragePoints":["..."],"redLines":["..."],"totalComp":"..."}`}],2000,"salary");const parsed=extractJSON(raw);
    setResult(parsed);
    if(updateMemory) updateMemory(m=>({jdAnalyses:[{date:new Date().toISOString(),company:parsed.company,matchScore:parsed.matchScore,role:parsed.roleTitle},...(m.jdAnalyses||[])].slice(-20)}));}
    catch(e){setResult({error:e.message});}setLoading(false);
  };
  const sendChat=async()=>{
    if(!msg.trim())return;const nc=[...chat,{role:"user",content:msg}];setChat(nc);setMsg("");setChatLoad(true);
    try{const raw=await callLLM([{role:"user",content:`You are a hiring manager roleplay partner for ${form.level} ${form.role} in ${form.market}. Push back on salary asks realistically. After each exchange add brief coaching tip in [brackets].\n\nConversation:\n${nc.map(m=>`${m.role}: ${m.content}`).join("\n")}\n\nRespond as hiring manager:`}],800,"salary");setChat(p=>[...p,{role:"assistant",content:raw}]);}
    catch(e){setChat(p=>[...p,{role:"assistant",content:"Error: "+e.message}]);}setChatLoad(false);
  };
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div className="t-h1" style={{color:C.text}}>Salary Negotiation Coach</div><div style={{color:C.muted,fontSize:13,marginTop:4,fontFamily:"var(--font-body)"}}>Know your value. Get word-for-word scripts. Roleplay the negotiation live.</div></div><button onClick={()=>setRoleplay(r=>!r)} style={{background:roleplay?C.green+"22":"transparent",border:`1px solid ${roleplay?C.green:C.border}`,color:roleplay?C.green:C.muted,borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{roleplay?"📊 View Analysis":"🎭 Roleplay"}</button></div>
      {!roleplay?(
        <>
          <Card>
            <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>{stages.map(s=><button key={s.id} onClick={()=>setStage(s.id)} style={{background:stage===s.id?C.green+"22":"transparent",border:`1px solid ${stage===s.id?C.green:C.border}`,color:stage===s.id?C.green:C.muted,borderRadius:6,padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{s.icon} {s.label}</button>)}</div>
            <Inp label="Current Offer / Situation" val={offer} set={setOffer} placeholder={`e.g. "Offered $95k for ${form.role} role"`}/>
            <Inp label="Your Target (optional)" val={target} set={setTarget} placeholder="e.g. $115k minimum"/>
            <Btn onClick={analyze} disabled={loading||!offer.trim()} color={C.green} dark>{loading?"Analyzing...":"💰 Get Negotiation Strategy"}</Btn>
          </Card>
          {loading&&<Card><Spinner label="Building your negotiation playbook..."/></Card>}
          {result&&!result.error&&!loading&&(
            <>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>{[["Market Min",result.marketMin,C.muted],["Market Median",result.marketMid,C.gold],["Market Max",result.marketMax,C.green]].map(([l,v,col])=><Card key={l} glow={col}><div className="t-label" style={{color:C.muted,marginBottom:4}}>{l}</div><div style={{color:col,fontSize:18,fontWeight:900}}>{v}</div></Card>)}</div>
              <Card glow={C.gold}><div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><div style={{color:C.gold,fontWeight:700,fontSize:13}}>📊 Assessment</div><Badge label={`Ask: ${result.openingAsk}`} color={C.green}/></div><div style={{color:C.text,fontSize:13,marginBottom:6}}>{result.assessment}</div><div style={{color:C.muted,fontSize:12}}>Room: <span style={{color:C.gold,fontWeight:700}}>{result.negotiationRoom}</span></div></Card>
              <Card><div style={{color:C.text,fontWeight:700,fontSize:13,marginBottom:12}}>🎯 Negotiation Tactics</div>{result.tactics?.map((t,i)=><div key={i} style={{color:C.text,fontSize:12,padding:"8px 12px",background:C.surface,borderRadius:6,marginBottom:6,borderLeft:`3px solid ${C.green}`}}>{t}</div>)}</Card>
              <Card glow={C.accent}><div style={{color:C.accent,fontWeight:700,fontSize:13,marginBottom:12}}>💬 Word-for-Word Scripts</div>{result.scripts?.map((s,i)=><div key={i} style={{marginBottom:12}}><div style={{color:C.gold,fontSize:11,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>{s.label}</div><div style={{color:C.text,fontSize:13,lineHeight:1.7,background:C.surface,borderRadius:8,padding:"10px 14px",borderLeft:`3px solid ${C.accent}`,fontStyle:"italic"}}>"{s.text}"</div></div>)}</Card>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Card glow={C.green}><div style={{color:C.green,fontWeight:700,fontSize:12,marginBottom:8}}>💪 Your Leverage</div>{result.leveragePoints?.map((p,i)=><div key={i} style={{color:C.text,fontSize:12,marginBottom:4}}>→ {p}</div>)}</Card><Card glow={C.red}><div style={{color:C.red,fontWeight:700,fontSize:12,marginBottom:8}}>🚫 Never Say This</div>{result.redLines?.map((r,i)=><div key={i} style={{color:C.text,fontSize:12,marginBottom:4}}>✗ {r}</div>)}</Card></div>
              <Card><div style={{color:C.purple,fontWeight:700,fontSize:12,marginBottom:8}}>📦 Total Comp Strategy</div><div style={{color:C.text,fontSize:13,lineHeight:1.7}}>{result.totalComp}</div></Card>
            </>
          )}
          {result?.error&&<ErrCard msg={result.error}/>}
        </>
      ):(
        <Card glow={C.green}><div style={{color:C.green,fontWeight:700,fontSize:13,marginBottom:4}}>🎭 Negotiation Roleplay</div><div style={{color:C.muted,fontSize:12,marginBottom:14}}>You're negotiating for {form.role} in {form.market}. I'm the hiring manager. Go.</div>
          <div style={{maxHeight:340,overflowY:"auto",marginBottom:12,display:"flex",flexDirection:"column",gap:8}}>
            {chat.length===0&&<div style={{color:C.muted,fontSize:12,textAlign:"center",padding:20}}>Start with your opening line...</div>}
            {chat.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}><div style={{maxWidth:"82%",background:m.role==="user"?C.green+"22":C.surface,border:`1px solid ${m.role==="user"?C.green+"44":C.border}`,borderRadius:10,padding:"10px 14px",fontSize:12,color:C.text,lineHeight:1.6}}>{m.content}</div></div>)}
            {chatLoad&&<Spinner label="Responding..."/>}
          </div>
          <div style={{display:"flex",gap:8}}><input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!chatLoad&&sendChat()} placeholder='e.g. "I was excited to receive the offer. I was hoping we could discuss the base..."' style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:12,padding:"10px 14px",fontFamily:"inherit",outline:"none"}}/><button onClick={sendChat} disabled={chatLoad||!msg.trim()} style={{background:C.green,color:"#000",border:"none",borderRadius:8,padding:"10px 16px",fontWeight:800,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Send</button></div>
        </Card>
      )}
    </div>
  );
}

// ── Cover Letter ──────────────────────────────────────────────────────────────
function CoverLetterGen({resumeText,form,memory,updateMemory}){
  const [jd,setJd]=useState(""); const [tone,setTone]=useState("professional");
  const [result,setResult]=useState(null); const [loading,setLoading]=useState(false); const [copied,setCopied]=useState(false);
  const tones=[{id:"professional",label:"Professional",icon:"👔"},{id:"confident",label:"Confident",icon:"🔥"},{id:"storytelling",label:"Storytelling",icon:"📖"},{id:"concise",label:"Ultra-Concise",icon:"⚡"}];
  const generate=async()=>{
    setLoading(true);setResult(null);
    const ctx=resumeText?.content?resumeText.content.slice(0,2000):`${form.level} ${form.role} professional`;
    try{const raw=await callLLM([{role:"user",content:`Expert cover letter writer. Write ${tone} cover letter.\nResume:\n${ctx}\nJob Description:\n${jd||`${form.level} ${form.role} in ${form.industry}, ${form.market}`}\nReturn ONLY raw JSON:\n{"subject":"email subject line","coverLetter":"full 3-4 paragraph letter, no placeholders, fully written","keySellingPoints":["..."],"customizationTips":["..."],"followUpScript":"exact follow-up email for day 5"}`}],2000,"cover");const parsed=extractJSON(raw);
    setResult(parsed);
    if(updateMemory) updateMemory(m=>({jdAnalyses:[{date:new Date().toISOString(),company:parsed.company,matchScore:parsed.matchScore,role:parsed.roleTitle},...(m.jdAnalyses||[])].slice(-20)}));}
    catch(e){setResult({error:e.message});}setLoading(false);
  };
  const copy=()=>{if(result?.coverLetter){navigator.clipboard.writeText(result.coverLetter);setCopied(true);showToast("✉️ Cover letter copied","success");setTimeout(()=>setCopied(false),2000);}};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div><div className="t-h1" style={{color:C.text}}>Cover Letter Generator</div><div style={{color:C.muted,fontSize:13,marginTop:4,fontFamily:"var(--font-body)"}}>AI writes a tailored letter from your real resume + JD. No generic templates.</div></div>
      {!resumeText?.content&&<Card glow={C.gold}><div style={{color:C.gold,fontSize:13}}>⚠️ Upload your resume first for a fully personalized letter.</div></Card>}
      <Card>
        <div className="t-label" style={{color:C.muted,marginBottom:8}}>Tone</div>
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>{tones.map(t=><button key={t.id} onClick={()=>setTone(t.id)} style={{background:tone===t.id?C.orange+"22":"transparent",border:`1px solid ${tone===t.id?C.orange:C.border}`,color:tone===t.id?C.orange:C.muted,borderRadius:6,padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t.icon} {t.label}</button>)}</div>
        <div className="t-label" style={{color:C.muted,marginBottom:8}}>Job Description (optional)</div>
        <textarea value={jd} onChange={e=>setJd(e.target.value)} placeholder="Paste job description for a fully tailored letter..." style={{width:"100%",minHeight:100,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:12,padding:12,fontFamily:"inherit",resize:"vertical",lineHeight:1.7,boxSizing:"border-box",display:"block",marginBottom:12,outline:"none"}}/>
        <Btn onClick={generate} disabled={loading} color={C.orange}>{loading?"Writing...":"✉️ Generate Cover Letter"}</Btn>
      </Card>
      {loading&&<Card><Spinner label="Crafting your personalized cover letter..."/></Card>}
      {result&&!result.error&&!loading&&(
        <>
          <Card glow={C.orange}><div style={{color:C.orange,fontWeight:700,fontSize:13,marginBottom:8}}>📧 Email Subject</div><div style={{color:C.text,fontSize:13,background:C.surface,padding:"8px 12px",borderRadius:6,fontFamily:"var(--font-mono)"}}>{result.subject}</div></Card>
          <Card glow={C.accent}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{color:C.accent,fontWeight:700,fontSize:13}}>✉️ Your Cover Letter</div><button onClick={copy} style={{background:copied?C.green+"22":"transparent",border:`1px solid ${copied?C.green:C.border}`,color:copied?C.green:C.muted,borderRadius:6,padding:"4px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{copied?"✓ Copied!":"Copy"}</button></div><div style={{color:C.text,fontSize:13,lineHeight:1.9,whiteSpace:"pre-line",background:C.surface,borderRadius:8,padding:16}}>{result.coverLetter}</div></Card>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Card><div style={{color:C.green,fontWeight:700,fontSize:12,marginBottom:8}}>💪 Key Selling Points</div>{result.keySellingPoints?.map((p,i)=><div key={i} style={{color:C.text,fontSize:12,marginBottom:4,paddingLeft:10,borderLeft:`2px solid ${C.green}`}}>• {p}</div>)}</Card><Card><div style={{color:C.gold,fontWeight:700,fontSize:12,marginBottom:8}}>🎨 Customize Further</div>{result.customizationTips?.map((t,i)=><div key={i} style={{color:C.text,fontSize:12,marginBottom:4}}>→ {t}</div>)}</Card></div>
          {result.followUpScript&&<Card glow={C.purple}><div style={{color:C.purple,fontWeight:700,fontSize:12,marginBottom:8}}>📬 Follow-Up Email (Day 5)</div><div style={{color:C.text,fontSize:12,lineHeight:1.7,fontStyle:"italic",background:C.surface,padding:"10px 14px",borderRadius:6}}>"{result.followUpScript}"</div></Card>}
        </>
      )}
      {result?.error&&<ErrCard msg={result.error}/>}
    </div>
  );
}

// ── Weakness Radar ────────────────────────────────────────────────────────────
function WeaknessRadar({scanResult,memory,onFirstUse}){
  const clamp=v=>Math.max(10,Math.min(99,Math.round(v)));
  const base=scanResult?.credibilityScore||50;
  const cr=(scanResult?.issues||[]).filter(i=>i.severity==="critical").length;
  const wr=(scanResult?.issues||[]).filter(i=>i.severity==="warning").length;
  const wk=scanResult?[{l:"Metric Depth",s:clamp(base-cr*12)},{l:"Ownership Clarity",s:clamp(base-wr*6+5)},{l:"Failure Stories",s:clamp(base*0.5)},{l:"Leadership Signal",s:clamp(base*0.78)},{l:"Technical Breadth",s:clamp(base+12)},{l:"Communication",s:clamp(base*0.82)},{l:"Industry Knowledge",s:clamp(base+18)}]:[{l:"Metric Depth",s:38},{l:"Ownership Clarity",s:62},{l:"Failure Stories",s:25},{l:"Leadership Signal",s:71},{l:"Technical Breadth",s:84},{l:"Communication",s:55},{l:"Industry Knowledge",s:90}];
  const colored=wk.map(w=>({...w,color:w.s<40?C.red:w.s<70?C.gold:C.green}));
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div><div className="t-h1" style={{color:C.text}}>Weakness Radar</div><div style={{color:C.muted,fontSize:13,marginTop:4,fontFamily:"var(--font-body)"}}>{scanResult?"✅ Derived from your resume scan.":"Scan your resume for personalized analysis."}</div></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>{[{label:"Critical Gaps",val:colored.filter(w=>w.s<40).length,color:C.red},{label:"Needs Work",val:colored.filter(w=>w.s>=40&&w.s<70).length,color:C.gold},{label:"Strong Areas",val:colored.filter(w=>w.s>=70).length,color:C.green}].map(s=><Card key={s.label} glow={s.color}><div className="t-label" style={{color:C.muted,marginBottom:6}}>{s.label}</div><div style={{color:s.color,fontSize:30,fontWeight:900}}>{s.val}</div></Card>)}</div>
      <Card animate>
        <div className="t-h3" style={{color:C.text,marginBottom:20}}>Competency Breakdown</div>
        {colored.map((w,i)=>(
          <div key={i} style={{marginBottom:18}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{color:C.text,fontSize:13,fontWeight:600}}>{w.l}</span>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:10,color:C.muted,fontFamily:"var(--font-mono)"}}>
                  {w.s<40?"Critical gap":w.s<70?"Needs work":"Strong"}
                </span>
                <span style={{color:w.color,fontSize:14,fontWeight:800,fontFamily:"var(--font-mono)",minWidth:36,textAlign:"right"}}>{w.s}%</span>
              </div>
            </div>
            <GlowBar score={w.s} color={w.color} delay={i*80} height={10} showLabel={false}/>
          </div>
        ))}
      </Card>
      {/* Post-radar flow nudge toward account */}
      {colored.filter(w=>w.s<60).length>0&&(
        <Card glow={C.gold} style={{textAlign:"center",padding:20}}>
          <div style={{color:C.gold,fontWeight:900,fontSize:14,marginBottom:6}}>
            {colored.filter(w=>w.s<60).length} gap{colored.filter(w=>w.s<60).length>1?"s":""} found. Ready to fix them?
          </div>
          <div style={{color:C.muted,fontSize:12,marginBottom:14,lineHeight:1.6}}>
            STAR Builder, JD Analyzer, and Cover Letter are free with an account.<br/>
            No card. 30 seconds to sign up.
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"center"}}>
            <button onClick={()=>window._setAuthModal&&window._setAuthModal("register")} style={{background:`linear-gradient(135deg,${C.gold},#CC8800)`,color:"#000",border:"none",borderRadius:8,padding:"10px 20px",fontWeight:900,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
              ✨ Fix These Gaps Free →
            </button>
            <button onClick={()=>window._setActiveModule&&window._setActiveModule("score")} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.text,borderRadius:8,padding:"10px 16px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
              See Readiness Score
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Readiness Score ───────────────────────────────────────────────────────────
function ReadinessScore({scanResult}){
  const base=scanResult?.credibilityScore||65;
  const overall=Math.min(99,Math.round(base*0.7+22));
  const scores=[{label:"Resume Defense",score:Math.round(base*0.8),prev:42},{label:"Skill Mastery",score:Math.min(95,Math.round(base*0.9)),prev:60},{label:"Industry Knowledge",score:Math.min(97,base+15),prev:70},{label:"Communication",score:Math.round(base*0.75),prev:55},{label:"Interview Performance",score:Math.round(base*0.65),prev:38}];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div><div className="t-h1" style={{color:C.text}}>Interview Readiness Score</div><div style={{color:C.muted,fontSize:13,marginTop:4,fontFamily:"var(--font-body)"}}>{scanResult?"✅ Based on your resume scan.":"Scan resume for a real score."}</div></div>
      <Card glow={C.accent} style={{textAlign:"center",padding:36}} animate>
        <div style={{color:C.muted,fontSize:11,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Overall Readiness</div>
        <AnimatedScore value={overall} color={C.accent} size="large"/>
        <div style={{color:overall>=75?C.green:overall>=55?C.gold:C.red,fontSize:13,marginTop:12,fontWeight:700,letterSpacing:0.5}}>{overall>=75?"🟢 Interview Ready":overall>=55?"🟡 Almost There":"🔴 Needs Work"}</div>
      </Card>
      <Card animate>
        <div className="t-h3" style={{color:C.text,marginBottom:20}}>Dimension Breakdown</div>
        {scores.map((s,i)=>(
          <div key={i} style={{marginBottom:18}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{color:C.text,fontSize:13,fontWeight:600}}>{s.label}</span>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{color:C.muted,fontSize:10,fontFamily:"var(--font-mono)"}}>was {s.prev}</span>
                <span style={{color:C.green,fontSize:11,fontWeight:700,fontFamily:"var(--font-mono)"}}>+{s.score-s.prev}</span>
                <span style={{color:s.score>=80?C.green:s.score>=60?C.gold:C.red,fontSize:13,fontWeight:800,fontFamily:"var(--font-mono)",minWidth:36,textAlign:"right"}}>{s.score}%</span>
              </div>
            </div>
            <GlowBar score={s.score} color={s.score>=80?C.green:s.score>=60?C.gold:C.red} delay={i*100} height={10}/>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Market Intel ──────────────────────────────────────────────────────────────
function MarketIntel({form}){
  const markets=[{region:"🇸🇬 Singapore",insight:"Structured interviews, strong cultural fit emphasis. CPF knowledge expected for finance roles.",tag:"SEA"},{region:"🇺🇸 US Tech",insight:"Leetcode-heavy for eng. STAR critical. Salary negotiation expected, not optional.",tag:"Tech"},{region:"🇪🇺 Europe",insight:"Work-life balance valued. Longer hiring cycles (4–8 weeks). CV format varies by country.",tag:"EU"},{region:"🌐 Remote-First",insight:"Async communication proof required. Written samples often requested. Overlap hours matter.",tag:"Remote"}];
  const [sel,setSel]=useState(()=>{const i=markets.findIndex(m=>m.region.toLowerCase().includes(form.market.toLowerCase().slice(0,4)));return i>=0?i:0;});
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div><div className="t-h1" style={{color:C.text}}>Market Intelligence</div><div style={{color:C.muted,fontSize:13,marginTop:4,fontFamily:"var(--font-body)"}}>Hiring norms differ radically by region.</div></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{markets.map((m,i)=><div key={i} onClick={()=>setSel(i)} style={{background:sel===i?C.accentGlow:C.card,border:`1px solid ${sel===i?C.accent:C.border}`,borderRadius:10,padding:"14px 16px",cursor:"pointer",transition:"all 0.2s"}}><div style={{color:C.text,fontWeight:700,fontSize:14,marginBottom:6}}>{m.region}</div><Badge label={m.tag} color={C.accent}/></div>)}</div>
      <Card glow={C.accent}><div style={{color:C.accent,fontWeight:800,fontSize:15,marginBottom:10}}>{markets[sel].region}</div><div style={{color:C.text,fontSize:14,lineHeight:1.8,marginBottom:16}}>{markets[sel].insight}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{[["Interview Rounds",["3–5","5–8","3–4","2–4"][sel]],["Decision Speed",["2–3 weeks","2–6 weeks","4–8 weeks","1–3 weeks"][sel]],["Negotiation",["Expected","Aggressive","Moderate","Flexible"][sel]],["Top Signal",["Culture fit","Metrics","Process","Async skills"][sel]]].map(([k,v])=><div key={k} style={{background:C.surface,borderRadius:8,padding:"10px 12px"}}><div style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{k}</div><div style={{color:C.text,fontSize:13,fontWeight:700}}>{v}</div></div>)}</div></Card>
    </div>
  );
}

// ── Job Search ────────────────────────────────────────────────────────────────
function buildJobURL(platform,title,location,extra=""){
  const t=encodeURIComponent(title),l=encodeURIComponent(location),e=encodeURIComponent(extra);
  const tRaw=title.toLowerCase().replace(/ /g,"-");
  switch(platform){
    case "linkedin":        return `https://www.linkedin.com/jobs/search/?keywords=${t}&location=${l}&f_TPR=r604800&sortBy=DD`;
    case "indeed":          return `https://www.indeed.com/jobs?q=${t}+${e}&l=${l}&fromage=7&sort=date`;
    case "glassdoor":       return `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${t}&locT=C&locId=0&jobType=all&fromAge=7`;
    case "jobstreet":       return `https://www.jobstreet.com.sg/en/job-search/${t.replace(/%20/g,"-")}-jobs/?sortmode=ListedDate`;
    case "mycareersfuture": return `https://www.mycareersfuture.gov.sg/search?search=${t}&sortBy=new_posting_date`;
    case "seek":            return `https://www.seek.com.au/${tRaw}-jobs?sortmode=ListedDate`;
    case "wellfound":       return `https://wellfound.com/jobs?q=${t}&l=${l}`;
    case "remoteok":        return `https://remoteok.com/remote-${tRaw}-jobs`;
    case "ycombinator":     return `https://www.workatastartup.com/jobs?q=${t}`;
    case "monster":         return `https://www.monster.com/jobs/search?q=${t}&where=${l}&sort=date_desc`;
    case "naukri":          return `https://www.naukri.com/${tRaw}-jobs?experience=0`;
    case "bayt":            return `https://www.bayt.com/en/international/jobs/${tRaw}-jobs/`;
    case "xing":            return `https://www.xing.com/jobs/search?q=${t}&l=${l}`;
    case "stepstone":       return `https://www.stepstone.de/jobs/${tRaw}`;
    case "eurojobs":        return `https://www.eurojobs.com/search-results?keywords=${t}&location=${l}`;
    case "jobs2careers":    return `https://www.jobs2careers.com/search.php?q=${t}&l=${l}`;
    case "techcareers":     return `https://www.techjobsfair.com/jobs?q=${t}`;
    case "dice":            return `https://www.dice.com/jobs?q=${t}&location=${l}&datePosted=1`;
    case "builtin":         return `https://builtin.com/jobs?search=${t}&location=${l}`;
    case "simplyhired":     return `https://www.simplyhired.com/search?q=${t}&l=${l}&sort=date`;
    case "weworkremotely":  return `https://weworkremotely.com/remote-jobs/search?term=${t}`;
    case "remoteco":        return `https://remote.co/remote-jobs/search/?search_keywords=${t}`;
    default:                return "#";
  }
}

const PLATFORMS={
  global:[
    {id:"linkedin",     name:"LinkedIn",      icon:"💼", color:"#0A66C2", desc:"Largest professional network · Updated daily"},
    {id:"indeed",       name:"Indeed",         icon:"🔵", color:"#003A9B", desc:"Highest volume of listings globally"},
    {id:"glassdoor",    name:"Glassdoor",      icon:"🟢", color:"#0CAA41", desc:"Jobs + salary benchmarks + culture"},
    {id:"wellfound",    name:"Wellfound",      icon:"🚀", color:"#FA4B24", desc:"VC-backed & Series A–C startups"},
    {id:"ycombinator",  name:"YC Job Board",   icon:"🧡", color:"#FF6600", desc:"Y Combinator portfolio companies"},
    {id:"builtin",      name:"Built In",       icon:"🏗️", color:"#5B5BD6", desc:"Tech & startup roles by city"},
    {id:"dice",         name:"Dice",           icon:"🎲", color:"#EB1C2D", desc:"Tech & engineering specialist"},
    {id:"simplyhired",  name:"SimplyHired",    icon:"🔷", color:"#0077B6", desc:"Aggregated listings, easy apply"},
  ],
  sea:[
    {id:"jobstreet",       name:"JobStreet",        icon:"🌏", color:"#E8192C", desc:"#1 job board in SEA"},
    {id:"mycareersfuture", name:"MyCareersFuture",  icon:"🇸🇬", color:"#EB2226", desc:"Singapore government jobs portal"},
  ],
  au:[
    {id:"seek",  name:"SEEK",   icon:"🔶", color:"#FF5630", desc:"#1 in Australia & New Zealand"},
    {id:"indeed",name:"Indeed", icon:"🔵", color:"#003A9B", desc:"Global listings in AU market"},
  ],
  in:[
    {id:"naukri", name:"Naukri", icon:"🇮🇳", color:"#FF7555", desc:"#1 job board in India"},
    {id:"indeed", name:"Indeed", icon:"🔵", color:"#003A9B", desc:"Global + India listings"},
  ],
  me:[
    {id:"bayt",  name:"Bayt",   icon:"🌍", color:"#E8892C", desc:"#1 in Middle East & North Africa"},
    {id:"indeed",name:"Indeed", icon:"🔵", color:"#003A9B", desc:"Global listings"},
  ],
  eu:[
    {id:"xing",       name:"XING",        icon:"🇩🇪", color:"#026466", desc:"#1 in Germany, Austria, Switzerland"},
    {id:"stepstone",  name:"StepStone",   icon:"🟡", color:"#FFCE00", desc:"Top EU job board · 30+ countries"},
    {id:"eurojobs",   name:"EuroJobs",    icon:"🇪🇺", color:"#003399", desc:"Pan-European listings"},
    {id:"linkedin",   name:"LinkedIn",    icon:"💼", color:"#0A66C2", desc:"Strong in UK, France, Netherlands"},
  ],
  remote:[
    {id:"remoteok",      name:"RemoteOK",        icon:"🌐", color:"#00BFFF", desc:"Remote-only · Updated hourly"},
    {id:"weworkremotely",name:"We Work Remotely", icon:"🏠", color:"#5865F2", desc:"Quality remote roles only"},
    {id:"remoteco",      name:"Remote.co",        icon:"🔗", color:"#4CAF50", desc:"Vetted remote companies"},
    {id:"wellfound",     name:"Wellfound",         icon:"🚀", color:"#FA4B24", desc:"Remote startup roles"},
  ],
};


function JobSearch({form,resumeText,memory,updateMemory,onProTrigger}){
  const [title,setTitle]=useState(form.role);
  const [location,setLocation]=useState(form.market==="Singapore"?"Singapore":form.market==="US"?"United States":form.market==="Europe"?"London, UK":form.market==="Remote"?"Remote":form.market==="SEA"?"Southeast Asia":form.market);
  const [keywords,setKeywords]=useState("");
  const [jobType,setJobType]=useState("all");
  const [expLevel,setExpLevel]=useState(form.level);
  const [alternatives,setAlternatives]=useState(null);
  const [loadingAlt,setLoadingAlt]=useState(false);
  const [searched,setSearched]=useState(false);
  const [activeTab,setActiveTab]=useState("search");
  const [tracker,setTracker]=useState(()=>memory?.applications||[]);
  const [showAddTrack,setShowAddTrack]=useState(false);
  const [trackForm,setTrackForm]=useState({company:"",role:"",status:"Applied",link:"",date:new Date().toISOString().split("T")[0],notes:""});
  const [salaryData,setSalaryData]=useState(null);
  const [lastRejection,setLastRejection]=useState(null);
  const [loadingSalary,setLoadingSalary]=useState(false);

  const loc=location.toLowerCase();
  const isRemote=loc.includes("remote");
  const isSEA=["singapore","malaysia","philippines","indonesia","vietnam","thailand","sea","southeast"].some(c=>loc.includes(c));
  const isAU=["australia","sydney","melbourne","brisbane","perth"].some(c=>loc.includes(c));
  const isIN=["india","bangalore","mumbai","delhi","hyderabad","pune"].some(c=>loc.includes(c));
  const isME=["dubai","uae","saudi","qatar","abu dhabi","bahrain","kuwait","middle east"].some(c=>loc.includes(c));
  const isEU=["germany","france","netherlands","spain","sweden","berlin","amsterdam","paris","europe","uk","london"].some(c=>loc.includes(c));

  const activePlatforms=[
    ...PLATFORMS.global,
    ...(isSEA?PLATFORMS.sea:[]),
    ...(isAU?PLATFORMS.au:[]),
    ...(isIN?PLATFORMS.in:[]),
    ...(isME?PLATFORMS.me:[]),
    ...(isEU?PLATFORMS.eu:[]),
    ...(isRemote?PLATFORMS.remote:[]),
  ].filter((p,i,arr)=>arr.findIndex(x=>x.id===p.id)===i);

  const statusColors={Applied:C.accent,Interviewing:C.gold,Offer:C.green,Rejected:C.red,Saved:C.purple,"Follow-up":C.orange};

  const getAlts=async(t,l)=>{
    setLoadingAlt(true);setAlternatives(null);setSalaryData(null);
    const ctx=resumeText?.content?`Resume summary: ${resumeText.content.slice(0,400)}`:`Profile: ${form.level} ${form.role}, ${form.industry}`;
    try{
      const raw=await callLLM([{role:"user",content:`You are a senior career strategist and recruiter. ${ctx}
Search: "${t}" in "${l}" | Level: ${expLevel} | Job type: ${jobType}

Generate comprehensive job search intelligence. Return ONLY raw JSON:
{
  "alternativeTitles": [
    {"title":"...","why":"why this expands reach","demandLevel":"High|Medium|Low","avgSalary":"salary range"},
    {"title":"...","why":"...","demandLevel":"...","avgSalary":"..."},
    {"title":"...","why":"...","demandLevel":"...","avgSalary":"..."},
    {"title":"...","why":"...","demandLevel":"...","avgSalary":"..."},
    {"title":"...","why":"...","demandLevel":"...","avgSalary":"..."}
  ],
  "alternativeLocations": [
    {"location":"...","why":"why this market is strong right now","hiringClimate":"Hot|Warm|Cool","costOfLiving":"High|Medium|Low"},
    {"location":"...","why":"...","hiringClimate":"...","costOfLiving":"..."},
    {"location":"...","why":"...","hiringClimate":"...","costOfLiving":"..."},
    {"location":"...","why":"...","hiringClimate":"...","costOfLiving":"..."}
  ],
  "salaryRange": {
    "min": "minimum salary for this role/location",
    "mid": "median salary",
    "max": "top 25% salary",
    "currency": "currency code",
    "notes": "important context about comp in this market"
  },
  "powerKeywords": ["kw1","kw2","kw3","kw4","kw5","kw6","kw7","kw8"],
  "companiesHiring": [
    {"company":"...","why":"why they're hiring now","stage":"Public|Series B|Startup|etc","linkedin":"linkedin company name for URL"},
    {"company":"...","why":"...","stage":"...","linkedin":"..."},
    {"company":"...","why":"...","stage":"...","linkedin":"..."},
    {"company":"...","why":"...","stage":"...","linkedin":"..."},
    {"company":"...","why":"...","stage":"...","linkedin":"..."}
  ],
  "searchStrategy": "3-4 sentence tactical advice specific to this role + market right now",
  "insiderTip": "one highly specific non-obvious tip most candidates miss",
  "hiringTrends": "2-3 sentences on current hiring trends for this role in this market",
  "redFlags": ["1-2 warning signs to watch for in job postings for this role"],
  "applicationVolume": "estimated number of applicants per posting in this market",
  "timeToHire": "typical time from apply to offer in this market"
}`}],2000,"jobs");
      setAlternatives(extractJSON(raw));
    }catch(e){setAlternatives({error:e.message});}
    setLoadingAlt(false);
  };

  const handleSearch=()=>{
    if(!title.trim()||!location.trim())return;
    setSearched(true);
    getAlts(title,location);
  };

  const addToTracker=()=>{
    if(!trackForm.company||!trackForm.role)return;
    const newEntry={id:Date.now(),...trackForm};
    setTracker(prev=>{const next=[newEntry,...prev];if(updateMemory)updateMemory(m=>({applications:next}));return next;});
    showToast(`📌 ${trackForm.company} added to tracker`, "success");
    setTrackForm({company:"",role:"",status:"Applied",link:"",date:new Date().toISOString().split("T")[0],notes:""});
    setShowAddTrack(false);
  };

  const updateStatus=(id,status)=>{
    setTracker(prev=>{
      const next=prev.map(j=>j.id===id?{...j,status}:j);
      if(updateMemory)updateMemory(m=>({applications:next}));
      // Trigger rejection coach if marked Rejected
      if(status==="Rejected"){const job=prev.find(j=>j.id===id);if(job){setLastRejection(job);showToast("AI Recovery Coach is ready below","info");}}
      // ── Smart Pro paywall: fire when user hits "Interviewing" ──────────
      // This is the highest-intent moment — they have an interview and need prep NOW
      if(status==="Interviewing" && onProTrigger){
        // Small delay so user sees the status change first
        setTimeout(()=>onProTrigger("interviewing"), 800);
      }
      // Fire when user receives an Offer — salary negotiation moment
      if(status==="Offer"){
        showToast("🎉 Offer received! Time to negotiate.", "success");
        // Load confetti from CDN
        if(!window._confettiLoaded){
          const s=document.createElement("script");
          s.src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js";
          s.onload=()=>{ window._confettiLoaded=true; if(window.confetti) window.confetti({particleCount:120,spread:80,origin:{y:0.6},colors:["#00E88F","#00D4FF","#FFB800","#FF6B9D","#8B5CF6"]}); };
          document.head.appendChild(s);
        } else if(window.confetti){
          window.confetti({particleCount:120,spread:80,origin:{y:0.6},colors:["#00E88F","#00D4FF","#FFB800","#FF6B9D","#8B5CF6"]});
        }
        if(onProTrigger) setTimeout(()=>onProTrigger("salary"), 2000);
      }
      return next;
    });
  };
  const deleteJob=(id)=>{
    const job = tracker.find(j=>j.id===id);
    setTracker(prev=>{const next=prev.filter(j=>j.id!==id);if(updateMemory)updateMemory(m=>({applications:next}));return next;});
    if(job) showToast(`Removed ${job.company}`,"warn");
  }; 

  const tabBtn=(id,label,count)=>(
    <button onClick={()=>setActiveTab(id)} style={{background:activeTab===id?C.green+"22":"transparent",border:`1px solid ${activeTab===id?C.green:C.border}`,color:activeTab===id?C.green:C.muted,borderRadius:6,padding:"6px 16px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
      {label}{count>0&&<span style={{background:C.green,color:"#000",borderRadius:10,padding:"1px 6px",fontSize:9,fontWeight:800}}>{count}</span>}
    </button>
  );

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div className="t-h1" style={{color:C.text}}>Job Search Engine</div>
          <div style={{color:C.muted,fontSize:13,marginTop:4,fontFamily:"var(--font-body)"}}>Find live jobs across 20+ platforms. AI suggests smarter searches, salary data, and which companies are hiring now.</div>
        </div>
      </div>

      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {tabBtn("search","🔎 Search",0)}
        {tabBtn("tracker","📊 Application Tracker",tracker.length)}
        {tabBtn("salary","💰 Salary Intel",0)}
      </div>

      {/* ── SEARCH TAB ── */}
      {activeTab==="search"&&(
        <>
          <Card glow={C.green}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div>
                <div className="t-label" style={{color:C.muted,marginBottom:6}}>Job Title</div>
                <input value={title} onChange={e=>{setTitle(e.target.value);setSearched(false);}} placeholder="e.g. Senior Product Manager" style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:13,padding:"10px 12px",fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}/>
              </div>
              <div>
                <div className="t-label" style={{color:C.muted,marginBottom:6}}>Location</div>
                <input value={location} onChange={e=>{setLocation(e.target.value);setSearched(false);}} placeholder="e.g. Singapore, Remote, New York" style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:13,padding:"10px 12px",fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}/>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
              {[
                {label:"Experience Level",key:"expLevel",val:expLevel,set:setExpLevel,opts:["Student","Entry","Mid","Senior","Manager","Executive","Any"]},
                {label:"Job Type",key:"jobType",val:jobType,set:setJobType,opts:["all","Full-time","Part-time","Contract","Internship","Freelance"]},
              ].map(f=>(
                <div key={f.key} style={{gridColumn:f.key==="expLevel"?"span 1":"span 1"}}>
                  <div className="t-label" style={{color:C.muted,marginBottom:6}}>{f.label}</div>
                  <select value={f.val} onChange={e=>f.set(e.target.value)} style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:12,padding:"10px 8px",fontFamily:"inherit",cursor:"pointer",outline:"none"}}>
                    {f.opts.map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <div className="t-label" style={{color:C.muted,marginBottom:6}}>Keywords <span style={{fontWeight:400,textTransform:"none",letterSpacing:0}}>(optional)</span></div>
                <input value={keywords} onChange={e=>setKeywords(e.target.value)} placeholder="e.g. Python, B2B, Series B..." style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:12,padding:"10px 8px",fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}/>
              </div>
            </div>
            <Btn onClick={handleSearch} disabled={!title.trim()||!location.trim()} color={C.green} dark>🔎 Find Jobs Now</Btn>
          </Card>

          {searched&&(
            <>
              {/* Live Job Boards */}
              <div>
                <div style={{color:C.text,fontWeight:700,fontSize:14,marginBottom:4}}>
                  🌐 Live Job Boards — <span style={{color:C.green}}>"{title}"</span> in <span style={{color:C.gold}}>"{location}"</span>
                </div>
                <div style={{color:C.muted,fontSize:12,marginBottom:12}}>All links open pre-filled, live searches. Results are real-time on each platform.</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {activePlatforms.map(p=>(
                    <div key={p.id} style={{background:C.card,border:`1px solid ${p.color}33`,borderRadius:10,padding:"14px 16px",transition:"border 0.2s"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                        <span style={{fontSize:22}}>{p.icon}</span>
                        <div>
                          <div style={{color:C.text,fontWeight:800,fontSize:14}}>{p.name}</div>
                          <div style={{color:C.muted,fontSize:10,marginTop:1}}>{p.desc}</div>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        <a href={buildJobURL(p.id,title,location,keywords)} target="_blank" rel="noopener noreferrer" style={{flex:1,background:`${p.color}22`,border:`1px solid ${p.color}55`,color:p.color,borderRadius:6,padding:"9px 0",fontSize:11,fontWeight:800,textAlign:"center",textDecoration:"none",letterSpacing:0.5,display:"block"}}>{"Search Now →"}</a>
                        <button onClick={()=>setTracker(prev=>[{id:Date.now(),company:p.name,role:title,status:"Saved",link:buildJobURL(p.id,title,location,keywords),date:new Date().toISOString().split("T")[0],notes:location},...prev])}
                          title="Add to tracker" style={{background:C.surface,border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,padding:"9px 10px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>📌</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* One-Click Combos */}
              <Card glow={C.green}>
                <div style={{color:C.green,fontWeight:700,fontSize:13,marginBottom:12}}>⚡ Quick Search Combos</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                  {[
                    {label:"LinkedIn · Past Week",     url:buildJobURL("linkedin",title,location)},
                    {label:"Indeed + Keywords",         url:buildJobURL("indeed",title,location,keywords)},
                    {label:"Glassdoor · With Salary",   url:buildJobURL("glassdoor",title,location)},
                    {label:"Startups · Wellfound",      url:buildJobURL("wellfound",title,location)},
                    {label:"YC Portfolio Jobs",         url:buildJobURL("ycombinator",title,location)},
                    isRemote
                      ?{label:"Remote Only · RemoteOK", url:buildJobURL("remoteok",title,location)}
                      :{label:"Tech Roles · Built In",  url:buildJobURL("builtin",title,location)},
                  ].map((combo,i)=>(
                    <a key={i} href={combo.url} target="_blank" rel="noopener noreferrer"
                      style={{background:C.green+"11",border:`1px solid ${C.green}33`,color:C.green,borderRadius:8,padding:"10px 8px",fontSize:11,fontWeight:700,textAlign:"center",textDecoration:"none",display:"block",lineHeight:1.5}}>
                      {combo.label} →
                    </a>
                  ))}
                </div>
              </Card>

              {loadingAlt&&<Card><Spinner label="AI analyzing market intelligence for your search..."/></Card>}

              {alternatives&&!alternatives.error&&!loadingAlt&&(
                <>
                  {/* Market Overview */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                    {[
                      {label:"Avg Applicants/Post",   val:alternatives.applicationVolume||"50-200",  color:C.red},
                      {label:"Time to Hire",          val:alternatives.timeToHire||"2-4 weeks",      color:C.gold},
                      {label:"Market Climate",        val:alternatives.alternativeLocations?.[0]?.hiringClimate||"Warm", color:C.green},
                    ].map(s=>(
                      <Card key={s.label} glow={s.color}>
                        <div className="t-label" style={{color:C.muted,marginBottom:6}}>{s.label}</div>
                        <div style={{color:s.color,fontSize:16,fontWeight:900}}>{s.val}</div>
                      </Card>
                    ))}
                  </div>

                  {/* Strategy + Tip */}
                  <Card glow={C.accent}>
                    <div style={{color:C.accent,fontWeight:700,fontSize:13,marginBottom:8}}>🧠 AI Search Strategy</div>
                    <div style={{color:C.text,fontSize:13,lineHeight:1.8,marginBottom:alternatives.insiderTip?12:0}}>{alternatives.searchStrategy}</div>
                    {alternatives.insiderTip&&(
                      <div style={{background:C.gold+"11",border:`1px solid ${C.gold}33`,borderRadius:8,padding:"10px 14px"}}>
                        <span style={{color:C.gold,fontWeight:800,fontSize:11}}>💡 INSIDER TIP: </span>
                        <span style={{color:C.text,fontSize:12}}>{alternatives.insiderTip}</span>
                      </div>
                    )}
                    {alternatives.hiringTrends&&(
                      <div style={{background:C.purple+"11",border:`1px solid ${C.purple}33`,borderRadius:8,padding:"10px 14px",marginTop:10}}>
                        <span style={{color:C.purple,fontWeight:800,fontSize:11}}>📈 MARKET TRENDS: </span>
                        <span style={{color:C.text,fontSize:12}}>{alternatives.hiringTrends}</span>
                      </div>
                    )}
                  </Card>

                  {/* Salary Range */}
                  {alternatives.salaryRange&&(
                    <Card glow={C.green}>
                      <div style={{color:C.green,fontWeight:700,fontSize:13,marginBottom:12}}>💰 Salary Intelligence — {title} in {location}</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
                        {[["Floor",alternatives.salaryRange.min,C.muted],["Median",alternatives.salaryRange.mid,C.gold],["Top 25%",alternatives.salaryRange.max,C.green]].map(([l,v,c])=>(
                          <div key={l} style={{background:C.surface,borderRadius:8,padding:"12px 14px",textAlign:"center"}}>
                            <div className="t-label" style={{color:C.muted,marginBottom:4}}>{l}</div>
                            <div style={{color:c,fontSize:16,fontWeight:900}}>{v}</div>
                          </div>
                        ))}
                      </div>
                      {alternatives.salaryRange.notes&&<div style={{color:C.muted,fontSize:12,lineHeight:1.6}}>{alternatives.salaryRange.notes}</div>}
                    </Card>
                  )}

                  {/* Alternative Titles */}
                  <Card>
                    <div style={{color:C.text,fontWeight:700,fontSize:13,marginBottom:12}}>🔄 Alternative Job Titles — Expand Your Search</div>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {alternatives.alternativeTitles?.map((alt,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.surface,borderRadius:8,padding:"12px 14px",gap:10}}>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                              <div style={{color:C.text,fontWeight:700,fontSize:13}}>{alt.title}</div>
                              <Badge label={alt.demandLevel||"Medium"} color={alt.demandLevel==="High"?C.green:alt.demandLevel==="Low"?C.red:C.gold}/>
                            </div>
                            <div style={{display:"flex",gap:12,alignItems:"center"}}>
                              <div style={{color:C.muted,fontSize:11}}>{alt.why}</div>
                              {alt.avgSalary&&<div style={{color:C.green,fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{alt.avgSalary}</div>}
                            </div>
                          </div>
                          <button onClick={()=>{setTitle(alt.title);setSearched(false);window.scrollTo(0,0);}}
                            style={{background:C.accent+"22",border:`1px solid ${C.accent}44`,color:C.accent,borderRadius:6,padding:"6px 12px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                            Search This →
                          </button>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Alternative Locations */}
                  <Card>
                    <div style={{color:C.text,fontWeight:700,fontSize:13,marginBottom:12}}>📍 Alternative Locations — Where You'll Have More Success</div>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {alternatives.alternativeLocations?.map((alt,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.surface,borderRadius:8,padding:"12px 14px",gap:10}}>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                              <div style={{color:C.text,fontWeight:700,fontSize:13}}>📍 {alt.location}</div>
                              <Badge label={alt.hiringClimate||"Warm"} color={alt.hiringClimate==="Hot"?C.green:alt.hiringClimate==="Cool"?C.red:C.gold}/>
                              {alt.costOfLiving&&<Badge label={`Cost: ${alt.costOfLiving}`} color={alt.costOfLiving==="Low"?C.green:alt.costOfLiving==="High"?C.red:C.gold}/>}
                            </div>
                            <div style={{color:C.muted,fontSize:11}}>{alt.why}</div>
                          </div>
                          <button onClick={()=>{setLocation(alt.location);setSearched(false);window.scrollTo(0,0);}}
                            style={{background:C.gold+"22",border:`1px solid ${C.gold}44`,color:C.gold,borderRadius:6,padding:"6px 12px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                            Search Here →
                          </button>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Power Keywords + Companies */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <Card>
                      <div style={{color:C.purple,fontWeight:700,fontSize:13,marginBottom:6}}>⚡ Power Keywords</div>
                      <div style={{color:C.muted,fontSize:11,marginBottom:10}}>Click to add to search</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {alternatives.powerKeywords?.map((kw,i)=>(
                          <button key={i} onClick={()=>setKeywords(prev=>prev?`${prev}, ${kw}`:kw)}
                            style={{background:C.purple+"22",border:`1px solid ${C.purple}44`,color:C.purple,borderRadius:6,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                            + {kw}
                          </button>
                        ))}
                      </div>
                    </Card>
                    <Card>
                      <div style={{color:C.gold,fontWeight:700,fontSize:13,marginBottom:10}}>🏢 Companies Actively Hiring</div>
                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                        {alternatives.companiesHiring?.map((c,i)=>(
                          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6}}>
                            <div style={{flex:1}}>
                              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                                <span style={{color:C.text,fontWeight:700,fontSize:12}}>{c.company}</span>
                                {c.stage&&<Badge label={c.stage} color={C.gold}/>}
                              </div>
                              <div style={{color:C.muted,fontSize:10}}>{c.why}</div>
                            </div>
                            <a href={`https://www.linkedin.com/company/${encodeURIComponent((c.linkedin||c.company).toLowerCase().replace(/ /g,"-"))}/jobs`} target="_blank" rel="noopener noreferrer" style={{background:C.accent+"22",border:`1px solid ${C.accent}44`,color:C.accent,borderRadius:6,padding:"4px 8px",fontSize:9,fontWeight:700,textDecoration:"none",whiteSpace:"nowrap"}}>{"→ Jobs"}</a>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* Red Flags */}
                  {alternatives.redFlags?.length>0&&(
                    <Card glow={C.red}>
                      <div style={{color:C.red,fontWeight:700,fontSize:13,marginBottom:8}}>🚨 Watch Out For</div>
                      {alternatives.redFlags.map((f,i)=><div key={i} style={{color:C.text,fontSize:12,padding:"6px 10px",background:C.red+"11",borderRadius:6,marginBottom:6}}>⚠️ {f}</div>)}
                    </Card>
                  )}
                </>
              )}
              {alternatives?.error&&<ErrCard msg={alternatives.error}/>}
            </>
          )}
        </>
      )}

      {/* ── APPLICATION TRACKER TAB ── */}
      {activeTab==="tracker"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div className="t-h3" style={{color:C.text}}>Application Tracker</div>
              <div style={{color:C.muted,fontSize:12,marginTop:2}}>Track every application. Never lose track of your pipeline.</div>
            </div>
            <Btn onClick={()=>setShowAddTrack(t=>!t)} color={C.green} dark style={{width:"auto",padding:"8px 16px",fontSize:12}}>+ Add Application</Btn>
          </div>

          {/* Pipeline summary */}
          {tracker.length>0&&(
            <div className="grid-3" style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(120px,1fr))",gap:10}}>
              {[["Active",tracker.filter(j=>!["Rejected","Offer"].includes(j.status)).length,C.accent],["Interviewing",tracker.filter(j=>j.status==="Interviewing").length,C.gold],["Offers",tracker.filter(j=>j.status==="Offer").length,C.green],
                ["Rejected",tracker.filter(j=>j.status==="Rejected").length,C.red],
                ["Response Rate",tracker.length>0?Math.round((tracker.filter(j=>j.status!=="Saved"&&j.status!=="Applied").length/tracker.length)*100)+"%":"—",C.purple],
                ["This Week",tracker.filter(j=>{try{return (new Date()-new Date(j.date))<7*86400000}catch{return false}}).length,C.orange]
              ].map(([l,v,c])=>(
                <Card key={l} glow={c} style={{padding:"12px 16px",textAlign:"center"}}>
                  <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{l}</div>
                  <div style={{color:c,fontSize:26,fontWeight:900}}>{v}</div>
                </Card>
              ))}
            </div>
          )}

          {/* Smart nudge: interviewing = time to practice */}
          {tracker.filter(j=>j.status==="Interviewing").length > 0 && onProTrigger && (
            <div onClick={()=>onProTrigger("interviewing")} style={{background:C.purple+"15",border:`1px solid ${C.purple}44`,borderRadius:10,padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"all 0.2s"}}>
              <span style={{fontSize:20}}>🧠</span>
              <div style={{flex:1}}>
                <div style={{color:C.purple,fontWeight:800,fontSize:13}}>You have {tracker.filter(j=>j.status==="Interviewing").length} interview{tracker.filter(j=>j.status==="Interviewing").length>1?"s":""} coming up</div>
                <div style={{color:C.muted,fontSize:12,marginTop:2}}>Practice with the AI hiring manager simulator before you walk in →</div>
              </div>
              <div style={{color:C.purple,fontSize:16}}>›</div>
            </div>
          )}

          {/* Smart nudge: offer received = negotiate now */}
          {tracker.filter(j=>j.status==="Offer").length > 0 && onProTrigger && (
            <div onClick={()=>onProTrigger("salary")} style={{background:C.green+"15",border:`1px solid ${C.green}44`,borderRadius:10,padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"all 0.2s"}}>
              <span style={{fontSize:20}}>💰</span>
              <div style={{flex:1}}>
                <div style={{color:C.green,fontWeight:800,fontSize:13}}>You have an offer — don't negotiate without practice</div>
                <div style={{color:C.muted,fontSize:12,marginTop:2}}>Get exact scripts + AI roleplay before the salary call →</div>
              </div>
              <div style={{color:C.green,fontSize:16}}>›</div>
            </div>
          )}

          {/* Add form */}
          {showAddTrack&&(
            <Card glow={C.green}>
              <div style={{color:C.text,fontWeight:700,fontSize:13,marginBottom:12}}>📝 Add Application</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                {[{label:"Company",key:"company",placeholder:"e.g. Stripe"},{label:"Role",key:"role",placeholder:"e.g. Senior PM"}].map(f=>(
                  <div key={f.key}>
                    <div className="t-label" style={{color:C.muted,marginBottom:4}}>{f.label}</div>
                    <input value={trackForm[f.key]} onChange={e=>setTrackForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder} style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:12,padding:"8px 10px",fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}/>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
                <div>
                  <div className="t-label" style={{color:C.muted,marginBottom:4}}>Status</div>
                  <select value={trackForm.status} onChange={e=>setTrackForm(p=>({...p,status:e.target.value}))} style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:12,padding:"8px 10px",fontFamily:"inherit",cursor:"pointer",outline:"none"}}>
                    {Object.keys(statusColors).map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <div className="t-label" style={{color:C.muted,marginBottom:4}}>Date Applied</div>
                  <input type="date" value={trackForm.date} onChange={e=>setTrackForm(p=>({...p,date:e.target.value}))} style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:12,padding:"8px 10px",fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}/>
                </div>
                <div>
                  <div className="t-label" style={{color:C.muted,marginBottom:4}}>Job Link</div>
                  <input value={trackForm.link} onChange={e=>setTrackForm(p=>({...p,link:e.target.value}))} placeholder="https://..." style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:12,padding:"8px 10px",fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}/>
                </div>
              </div>
              <div style={{marginBottom:10}}>
                <div className="t-label" style={{color:C.muted,marginBottom:4}}>Notes</div>
                <input value={trackForm.notes} onChange={e=>setTrackForm(p=>({...p,notes:e.target.value}))} placeholder="Referral contact, interview stage, next steps..." style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:12,padding:"8px 10px",fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}/>
              </div>
              <div style={{display:"flex",gap:8}}>
                <Btn onClick={addToTracker} disabled={!trackForm.company||!trackForm.role} color={C.green} dark style={{flex:1}}>✓ Save Application</Btn>
                <button onClick={()=>setShowAddTrack(false)} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:8,padding:"11px 16px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
              </div>
            </Card>
          )}

          {/* Application list */}
          {tracker.length===0?(
            <Card>
              <EmptyState icon="📋" title="No applications tracked yet" desc="Add your first job application — or pin one from the job boards tab. Every status change is saved to your cloud account." cta="+ Add my first application" onCta={()=>setShowAddTrack(true)} ctaColor={C.green}/>
            </Card>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {tracker.map(j=>(
                <Card key={j.id} style={{padding:"14px 16px"}}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                        <div style={{color:C.text,fontWeight:800,fontSize:14}}>{j.company}</div>
                        <div style={{color:C.muted,fontSize:12}}>· {j.role}</div>
                      </div>
                      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                        <Badge label={j.status} color={statusColors[j.status]||C.muted}/>
                        <span style={{color:C.muted,fontSize:11}}>Applied {j.date}</span>
                        {j.notes&&<span style={{color:C.muted,fontSize:11}}>· {j.notes}</span>}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                      <select value={j.status} onChange={e=>updateStatus(j.id,e.target.value)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:11,padding:"5px 8px",fontFamily:"inherit",cursor:"pointer",outline:"none"}}>
                        {Object.keys(statusColors).map(s=><option key={s}>{s}</option>)}
                      </select>
                      {j.link&&j.link!=="/"&&<a href={j.link} target="_blank" rel="noopener noreferrer" style={{background:C.accent+"22",border:`1px solid ${C.accent}44`,color:C.accent,borderRadius:6,padding:"5px 10px",fontSize:10,fontWeight:700,textDecoration:"none"}}>Open</a>}
                      <button onClick={()=>deleteJob(j.id)} style={{background:"transparent",border:`1px solid ${C.red}33`,color:C.red,borderRadius:6,padding:"5px 8px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
                    </div>
                  </div>
                  {j.status==="Rejected"&&<RejectionCoach rejection={j} form={form} memory={memory}/>}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SALARY INTEL TAB ── */}
      {activeTab==="salary"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div>
            <div className="t-h3" style={{color:C.text}}>Salary Intelligence</div>
            <div style={{color:C.muted,fontSize:12,marginTop:2}}>Get AI-powered salary benchmarks for any role + location combo.</div>
          </div>
          <Card glow={C.green}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div>
                <div className="t-label" style={{color:C.muted,marginBottom:6}}>Role</div>
                <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Senior Product Manager" style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:13,padding:"10px 12px",fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}/>
              </div>
              <div>
                <div className="t-label" style={{color:C.muted,marginBottom:6}}>Location</div>
                <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="e.g. Singapore, New York, London" style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:13,padding:"10px 12px",fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}/>
              </div>
            </div>
            <Btn onClick={async()=>{
              setLoadingSalary(true);setSalaryData(null);
              try{
                const raw=await callLLM([{role:"user",content:`Salary expert. Provide detailed compensation data.\nRole: ${title} | Location: ${location} | Level: ${expLevel} | Industry: ${form.industry}\nReturn ONLY raw JSON:\n{"base":{"entry":"...","mid":"...","senior":"...","lead":"..."},"totalComp":{"base":"...","bonus":"...","equity":"...","total":"..."},"byCompanyType":{"startup":"...","scaleup":"...","bigtech":"...","corporate":"..."},"benefits":["top 4 benefits common in this market"],"negotiationRange":"how much room to negotiate %","demandTrend":"Rising|Stable|Declining","topPayingCompanies":["company1","company2","company3","company4","company5"],"currency":"...","context":"3 sentences on comp landscape for this role/location"}`}],1500,"jobs");
                setSalaryData(extractJSON(raw));
              }catch(e){setSalaryData({error:e.message});}
              setLoadingSalary(false);
            }} disabled={loadingSalary||!title.trim()||!location.trim()} color={C.green} dark>
              {loadingSalary?"Researching...":"💰 Get Salary Data"}
            </Btn>
          </Card>
          {loadingSalary&&<Card><Spinner label="Pulling salary intelligence..."/></Card>}
          {salaryData&&!salaryData.error&&!loadingSalary&&(
            <>
              <Card glow={C.green}>
                <div style={{color:C.green,fontWeight:700,fontSize:13,marginBottom:12}}>💰 {title} Salaries in {location}</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:10}}>
                  {[["Entry",salaryData.base?.entry,C.muted],["Mid",salaryData.base?.mid,C.accent],["Senior",salaryData.base?.senior,C.gold],["Lead/Principal",salaryData.base?.lead,C.green]].map(([l,v,c])=>(
                    <div key={l} style={{background:C.surface,borderRadius:8,padding:"10px",textAlign:"center"}}>
                      <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{l}</div>
                      <div style={{color:c,fontSize:13,fontWeight:800}}>{v||"N/A"}</div>
                    </div>
                  ))}
                </div>
                {salaryData.context&&<div style={{color:C.muted,fontSize:12,lineHeight:1.7}}>{salaryData.context}</div>}
              </Card>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <Card>
                  <div style={{color:C.accent,fontWeight:700,fontSize:13,marginBottom:10}}>📦 Total Compensation (Senior)</div>
                  {[["Base",salaryData.totalComp?.base],["Bonus",salaryData.totalComp?.bonus],["Equity",salaryData.totalComp?.equity],["Total",salaryData.totalComp?.total]].map(([l,v])=>(
                    <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}22`}}>
                      <span style={{color:C.muted,fontSize:12}}>{l}</span>
                      <span style={{color:l==="Total"?C.green:C.text,fontWeight:l==="Total"?800:400,fontSize:12}}>{v||"—"}</span>
                    </div>
                  ))}
                </Card>
                <Card>
                  <div style={{color:C.gold,fontWeight:700,fontSize:13,marginBottom:10}}>🏢 By Company Type</div>
                  {[["Startup",salaryData.byCompanyType?.startup],["Scale-up",salaryData.byCompanyType?.scaleup],["Big Tech",salaryData.byCompanyType?.bigtech],["Corporate",salaryData.byCompanyType?.corporate]].map(([l,v])=>(
                    <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}22`}}>
                      <span style={{color:C.muted,fontSize:12}}>{l}</span>
                      <span style={{color:C.text,fontSize:12}}>{v||"—"}</span>
                    </div>
                  ))}
                </Card>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <Card glow={salaryData.demandTrend==="Rising"?C.green:salaryData.demandTrend==="Declining"?C.red:C.gold}>
                  <div className="t-label" style={{color:C.muted,marginBottom:6}}>Demand Trend</div>
                  <div style={{color:salaryData.demandTrend==="Rising"?C.green:salaryData.demandTrend==="Declining"?C.red:C.gold,fontSize:20,fontWeight:900}}>{salaryData.demandTrend==="Rising"?"📈":salaryData.demandTrend==="Declining"?"📉":"📊"} {salaryData.demandTrend}</div>
                  <div style={{color:C.muted,fontSize:11,marginTop:6}}>Negotiate room: <strong style={{color:C.gold}}>{salaryData.negotiationRange}</strong></div>
                </Card>
                <Card>
                  <div style={{color:C.purple,fontWeight:700,fontSize:13,marginBottom:8}}>🏆 Top Paying Companies</div>
                  {salaryData.topPayingCompanies?.map((c,i)=><div key={i} style={{color:C.text,fontSize:12,padding:"4px 0",borderBottom:`1px solid ${C.border}22`}}>{i+1}. {c}</div>)}
                </Card>
              </div>
            </>
          )}
          {salaryData?.error && <ErrCard msg={salaryData.error} />}
        </div>
      )}

      {/* ── LANDING INFO SECTIONS (below search) ── */}
      {!searched && activeTab === "search" && (
        <div style={{ marginTop: 32 }}>
          <LandingSections
            setAuthModal={(mode) => window._setAuthModal?.(mode)}
            setShowPricing={(sh) => window._setShowPricing?.(sh)}
            setSetupDone={(sd) => window._setSetupDone?.(sd)}
            setActiveModule={(am) => window._setActiveModule?.(am)}
            form={form}
            C={C}
          />
        </div>
      )}
    </div>
  );
}




// ── Memory Dashboard ──────────────────────────────────────────────────────────
function MemoryDashboard({ memory, form, updateMemory }) {
  const [aiSummary, setAiSummary]   = useState(null);
  const [loadingSummary, setLoading] = useState(false);
  const [cleared, setCleared]        = useState(false);

  if (!memory) return (
    <Card style={{textAlign:"center",padding:40}}>
      <div style={{fontSize:36,marginBottom:12}}>🧬</div>
      <div style={{color:C.text,fontWeight:700,fontSize:16,marginBottom:8}}>AI Memory Dashboard</div>
      <div style={{color:C.muted,fontSize:13}}>Sign in to unlock personalized AI memory across all sessions.</div>
    </Card>
  );

  const totalActivity = (memory.scanHistory?.length||0)+(memory.starBank?.length||0)+(memory.mockSessions?.length||0)+(memory.applications?.length||0);

  const getPersonalizedPlan = async () => {
    setLoading(true);
    const memCtx = buildMemoryContext(memory, form);
    try {
      const raw = await callLLM([{role:"user", content:`Elite career coach. Based on comprehensive user history, generate a personalized career acceleration plan.${memCtx}

Return ONLY raw JSON:
{"overallProgress":"0-100 score based on activity","status":"Ready|Almost|Needs Work","topStrength":"best thing about their journey","biggestRisk":"most critical risk to landing the job","weeklyPlan":[{"day":"Mon","action":"..."},{"day":"Tue","action":"..."},{"day":"Wed","action":"..."},{"day":"Thu","action":"..."},{"day":"Fri","action":"..."}],"uniqueInsights":["insight1 specific to their data","insight2","insight3"],"predictedTimeline":"estimated weeks to get offer based on their activity pace","nextMilestone":"the single most important thing to do next"}`}], 1500,"memory");
      setAiSummary(extractJSON(raw));
    } catch(e) { setAiSummary({error:e.message}); }
    setLoading(false);
  };

  const clearMemory = () => {
    updateMemory(() => initMemory());
    setAiSummary(null);
    setCleared(true);
  };

  const statCards = [
    { icon:"⚡", label:"Resume Scans",        val: memory.scanHistory?.length || 0,      color: C.accent },
    { icon:"⭐", label:"STAR Stories Banked",  val: memory.starBank?.length || 0,         color: C.gold   },
    { icon:"🧠", label:"Mock Sessions",        val: memory.mockSessions?.length || 0,     color: C.purple },
    { icon:"📊", label:"Jobs Tracked",         val: memory.applications?.length || 0,     color: C.green  },
    { icon:"🔍", label:"JD Analyses",          val: memory.jdAnalyses?.length || 0,       color: C.pink   },
    { icon:"💰", label:"Negotiation Practice", val: memory.negotiationPractice || 0,      color: C.orange },
    { icon:"✉️", label:"Cover Letters",       val: memory.coverLetters?.length || 0,     color: "#FF9500" },
    { icon:"📅", label:"Days Active",          val: memory.lastSeen ? Math.max(1, Math.ceil((Date.now()-new Date(memory.joinedAt||memory.lastSeen))/86400000)) : 1, color: C.muted },
  ];

  const latestScore = memory.scanHistory?.length ? memory.scanHistory[memory.scanHistory.length-1].score : null;
  const firstScore  = memory.scanHistory?.length > 1 ? memory.scanHistory[0].score : null;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div className="t-h1" style={{color:C.text}}>🧬 AI Memory Dashboard</div>
          <div style={{color:C.muted,fontSize:13,marginTop:4,fontFamily:"var(--font-body)"}}>Your personalized career intelligence — built from {totalActivity} activity events across all sessions.</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={getPersonalizedPlan} disabled={loadingSummary||totalActivity<2} color={C.purple} style={{width:"auto",padding:"8px 16px",fontSize:12}}>
            {loadingSummary?"Analyzing...":"🧠 Get AI Career Plan"}
          </Btn>
        </div>
      </div>

      {cleared && <Card glow={C.gold}><div style={{color:C.gold,fontSize:13}}>✓ Memory cleared. Fresh start!</div></Card>}

      {/* Activity Stats Grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {statCards.map(s=>(
          <Card key={s.label} glow={s.color} style={{padding:"14px 16px",textAlign:"center"}}>
            <div style={{fontSize:20,marginBottom:6}}>{s.icon}</div>
            <div style={{color:s.color,fontSize:22,fontWeight:900}}>{s.val}</div>
            <div style={{color:C.muted,fontSize:10,marginTop:3,textTransform:"uppercase",letterSpacing:0.5}}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Resume Score Trend */}
      {memory.scanHistory?.length > 0 && (
        <Card glow={C.accent}>
          <div style={{color:C.accent,fontWeight:700,fontSize:13,marginBottom:12}}>📈 Resume Score Progression</div>
          <div style={{display:"flex",gap:4,alignItems:"flex-end",height:60,marginBottom:10}}>
            {memory.scanHistory.map((s,i)=>{
              const h=Math.max(6,Math.round((s.score/100)*60));
              const c=s.score>=70?C.green:s.score>=50?C.gold:C.red;
              return (
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                  <div style={{color:C.muted,fontSize:8}}>{s.score}</div>
                  <div style={{width:"100%",height:h,background:c,borderRadius:3,transition:"height 0.8s"}}/>
                  <div style={{color:C.muted,fontSize:8}}>{new Date(s.date).toLocaleDateString("en",{month:"short",day:"numeric"})}</div>
                </div>
              );
            })}
          </div>
          {firstScore && latestScore && (
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{color:C.muted,fontSize:12}}>Started: <strong style={{color:C.text}}>{firstScore}/100</strong></div>
              <div style={{color:latestScore>firstScore?C.green:C.red,fontWeight:800,fontSize:13}}>
                {latestScore>firstScore?"📈 +"+(latestScore-firstScore)+" pts improvement":"📉 "+(latestScore-firstScore)+" pts"}
              </div>
              <div style={{color:C.muted,fontSize:12}}>Latest: <strong style={{color:C.text}}>{latestScore}/100</strong></div>
            </div>
          )}
        </Card>
      )}

      {/* Application Pipeline Funnel */}
      {memory.applications?.length > 0 && (
        <Card glow={C.green}>
          <div style={{color:C.green,fontWeight:700,fontSize:13,marginBottom:12}}>📊 Application Pipeline Funnel</div>
          {[
            ["Saved",       memory.applications.filter(a=>a.status==="Saved").length,       C.muted],
            ["Applied",     memory.applications.filter(a=>a.status==="Applied").length,     C.accent],
            ["Follow-up",   memory.applications.filter(a=>a.status==="Follow-up").length,   C.orange],
            ["Interviewing",memory.applications.filter(a=>a.status==="Interviewing").length,C.gold],
            ["Offer",       memory.applications.filter(a=>a.status==="Offer").length,       C.green],
            ["Rejected",    memory.applications.filter(a=>a.status==="Rejected").length,    C.red],
          ].map(([l,v,c])=>{
            const pct = memory.applications.length ? Math.round((v/memory.applications.length)*100) : 0;
            return (
              <div key={l} style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{color:C.text,fontSize:12}}>{l}</span>
                  <span style={{color:c,fontWeight:700,fontSize:12}}>{v} <span style={{color:C.muted,fontWeight:400}}>({pct}%)</span></span>
                </div>
                <div style={{background:C.surface,borderRadius:4,height:6,overflow:"hidden"}}>
                  <div style={{width:`${pct}%`,height:"100%",background:c,borderRadius:4,transition:"width 1s"}}/>
                </div>
              </div>
            );
          })}
          {memory.applications.filter(a=>a.status==="Offer").length > 0 && (
            <div style={{color:C.gold,fontWeight:800,fontSize:12,marginTop:10}}>
              🏆 Offer rate: {Math.round((memory.applications.filter(a=>a.status==="Offer").length/memory.applications.length)*100)}%
            </div>
          )}
        </Card>
      )}

      {/* JD Match Trend */}
      {memory.jdAnalyses?.length > 1 && (
        <Card>
          <div style={{color:C.pink,fontWeight:700,fontSize:13,marginBottom:10}}>🔍 JD Match Score Trend</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {memory.jdAnalyses.slice(-8).map((j,i)=>{
              const c=j.matchScore>=75?C.green:j.matchScore>=50?C.gold:C.red;
              return (
                <div key={i} style={{background:C.surface,borderRadius:8,padding:"8px 12px",textAlign:"center",minWidth:80}}>
                  <div style={{color:c,fontWeight:900,fontSize:16}}>{j.matchScore}%</div>
                  <div style={{color:C.muted,fontSize:10,marginTop:2}}>{j.company||"Unknown"}</div>
                  <div style={{color:C.muted,fontSize:9}}>{new Date(j.date).toLocaleDateString("en",{month:"short",day:"numeric"})}</div>
                </div>
              );
            })}
          </div>
          <div style={{color:C.muted,fontSize:12,marginTop:8}}>
            Avg match score: <strong style={{color:C.text}}>{Math.round(memory.jdAnalyses.reduce((s,j)=>s+j.matchScore,0)/memory.jdAnalyses.length)}%</strong>
          </div>
        </Card>
      )}

      {/* AI-Generated Career Plan */}
      {loadingSummary && <Card><Spinner label="AI analyzing your entire career journey..."/></Card>}
      {aiSummary && !aiSummary.error && (
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Card glow={C.purple}>
              <div className="t-label" style={{color:C.muted,marginBottom:6}}>Overall Progress</div>
              <div style={{color:C.purple,fontSize:40,fontWeight:900}}>{aiSummary.overallProgress}%</div>
              <div style={{color:aiSummary.status==="Ready"?C.green:aiSummary.status==="Almost"?C.gold:C.red,fontWeight:700,fontSize:12,marginTop:4}}>
                {aiSummary.status==="Ready"?"🟢 Interview Ready":aiSummary.status==="Almost"?"🟡 Almost There":"🔴 Needs Work"}
              </div>
            </Card>
            <Card glow={C.gold}>
              <div style={{color:C.gold,fontWeight:700,fontSize:13,marginBottom:6}}>⏱ Predicted Timeline</div>
              <div style={{color:C.text,fontSize:15,fontWeight:800}}>{aiSummary.predictedTimeline}</div>
              <div style={{color:C.muted,fontSize:12,marginTop:6}}>🎯 Next: {aiSummary.nextMilestone}</div>
            </Card>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Card glow={C.green}><div style={{color:C.green,fontWeight:700,fontSize:12,marginBottom:8}}>💪 Top Strength</div><div style={{color:C.text,fontSize:13,lineHeight:1.7}}>{aiSummary.topStrength}</div></Card>
            <Card glow={C.red}><div style={{color:C.red,fontWeight:700,fontSize:12,marginBottom:8}}>⚡ Biggest Risk</div><div style={{color:C.text,fontSize:13,lineHeight:1.7}}>{aiSummary.biggestRisk}</div></Card>
          </div>
          <Card glow={C.accent}>
            <div style={{color:C.accent,fontWeight:700,fontSize:13,marginBottom:12}}>📅 Your Personalized Weekly Plan</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
              {aiSummary.weeklyPlan?.map((d,i)=>(
                <div key={i} style={{background:C.surface,borderRadius:8,padding:"10px 8px",textAlign:"center"}}>
                  <div style={{color:C.accent,fontWeight:800,fontSize:11,marginBottom:6}}>{d.day}</div>
                  <div style={{color:C.text,fontSize:10,lineHeight:1.5}}>{d.action}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <div style={{color:C.purple,fontWeight:700,fontSize:13,marginBottom:10}}>🧬 AI Insights From Your History</div>
            {aiSummary.uniqueInsights?.map((ins,i)=>(
              <div key={i} style={{color:C.text,fontSize:13,padding:"8px 12px",background:C.purple+"11",borderRadius:6,marginBottom:6,borderLeft:`3px solid ${C.purple}`}}>{ins}</div>
            ))}
          </Card>
        </>
      )}
      {aiSummary?.error && <ErrCard msg={aiSummary.error}/>}

      {/* Danger zone */}
      <Card style={{borderColor:C.red+"33"}}>
        <div style={{color:C.muted,fontSize:12,marginBottom:8}}>⚠️ Data Management</div>
        <div style={{color:C.muted,fontSize:11,marginBottom:10}}>Memory is stored locally in your browser. Clearing removes all history.</div>
        <button onClick={clearMemory} style={{background:"transparent",border:`1px solid ${C.red}44`,color:C.red,borderRadius:6,padding:"6px 16px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
          🗑 Clear All Memory
        </button>
      </Card>
    </div>
  );
}

// ── Auth Store (Supabase) ────────────────────────────────────────────────────
// All auth is now handled by Supabase Auth.
// Token stored in localStorage; session object cached for fast reads.

function getSession() { return getSessionLocal(); }
function clearSession() { clearToken(); }

// ── AuthModal (Supabase) ─────────────────────────────────────────────────────
function AuthModal({ onSuccess, onClose, initialMode = "login" }) {
  const [mode, setMode]       = useState(initialMode);
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [pw, setPw]           = useState("");
  const [pw2, setPw2]         = useState("");
  const [err, setErr]         = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [verifyMsg, setVerifyMsg] = useState("");

  const validate = () => {
    if (mode === "register" && !name.trim()) return "Full name is required.";
    if (!email.includes("@")) return "Enter a valid email.";
    if (pw.length < 6) return "Password must be at least 6 characters.";
    if (mode === "register" && pw !== pw2) return "Passwords do not match.";
    return null;
  };

  const submit = async () => {
    const e = validate(); if (e) { setErr(e); return; }
    setLoading(true); setErr("");
    try {
      if (mode === "login") {
        // ── Sign In via Supabase ───────────────────────────────────────────
        const data = await sb.signIn(email.trim().toLowerCase(), pw);
        const session = {
          email: data?.user?.email || email.trim().toLowerCase(),
          name: data?.user?.user_metadata?.full_name || data?.user?.email?.split("@")[0] || name || "User",
          joinedAt: data?.user?.created_at || new Date().toISOString(),
          avatar: (data?.user?.user_metadata?.full_name || data?.user?.email || email)[0].toUpperCase(),
          id: data?.user?.id,
          token: data?.access_token,
          isPro: false,
        };
        // Fetch real Pro status if profile exists
        try {
          const profiles = await sb.select("profiles", { id: `eq.${data.user.id}` }, data.access_token);
          if (profiles && profiles[0]) {
            session.isPro = !!profiles[0].is_pro;
          }
        } catch (e) { console.warn("Failed to fetch profile:", e.message); }
        saveToken(data.access_token);
        saveSessionLocal(session);
        onSuccess(session);
      } else {
        // ── Sign Up via Supabase ───────────────────────────────────────────
        const signupData = await sb.signUp(email.trim().toLowerCase(), pw, name.trim());
        let sessionData = signupData.session;
        if (!sessionData && signupData.user) {
          // Attempt immediate sign-in if signUp didn't provide a session
          try {
            sessionData = await sb.signIn(email.trim().toLowerCase(), pw);
          } catch (e) { /* signIn fails if confirmation is required; that's fine, we'll show verifyMsg */ }
        }

        if (!sessionData && signupData.user) {
          // Email confirmation required
          setVerifyMsg("✅ Account created! Check your email and click the confirmation link, then sign in.");
          setLoading(false); return;
        }

        if (sessionData) {
          // Auto-confirmed or immediate signIn worked
          const session = {
            email: signupData?.user?.email || email.trim().toLowerCase(),
            name: name.trim(),
            joinedAt: signupData?.user?.created_at || new Date().toISOString(),
            avatar: name.trim()[0].toUpperCase(),
            id: signupData?.user?.id,
            token: sessionData?.access_token,
            isPro: false,
          };
          saveToken(sessionData.access_token);
          saveSessionLocal(session);
          // Save profile to DB
          try {
            await sb.insert("profiles", {
              id: signupData.user.id,
              email: signupData.user.email,
              full_name: name.trim(),
              joined_at: signupData.user.created_at,
              is_pro: false,
            }, sessionData.access_token);
          } catch {}
          onSuccess(session);
        }
      }
    } catch(e) {
      setErr(e.message || "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const inputStyle = { width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:13, padding:"11px 14px", fontFamily:"inherit", boxSizing:"border-box", outline:"none", transition:"border 0.2s" };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(9,12,18,0.92)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:24, backdropFilter:"blur(8px)", animation:"fadeIn 0.2s ease" }}>
      <div style={{ width:"100%", maxWidth:420, animation:"fadeIn 0.3s ease" }}>
        <Card glow={C.accent} style={{ position:"relative" }}>
          {onClose && (
            <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background:"transparent", border:`1px solid ${C.border}`, color:C.muted, borderRadius:6, padding:"4px 10px", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>✕ Close</button>
          )}

          <div style={{ textAlign:"center", marginBottom:24 }}>
            <div style={{ fontSize:32, marginBottom:8 }}>🎯</div>
            <div style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:20, color:C.text }}>
              CareerAi<span style={{ color:C.accent }}>Hub</span>
            </div>
            <div style={{ color:C.muted, fontSize:12, marginTop:4 }}>
              {mode === "login" ? "Welcome back" : "Create your free account"}
            </div>
          </div>

          {verifyMsg ? (
            <div style={{ background:C.green+"15", border:`1px solid ${C.green}44`, borderRadius:10, padding:"16px 18px", color:C.green, fontSize:13, lineHeight:1.7, textAlign:"center" }}>
              {verifyMsg}
              <div style={{ marginTop:12 }}>
                <button onClick={()=>{ setVerifyMsg(""); setMode("login"); setErr(""); }} style={{ background:"transparent", border:`1px solid ${C.green}44`, color:C.green, borderRadius:6, padding:"6px 16px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                  Go to Sign In →
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display:"flex", background:C.surface, borderRadius:8, padding:4, marginBottom:20, gap:4 }}>
                {[["login","Sign In"],["register","Create Account"]].map(([m,label]) => (
                  <button key={m} onClick={() => { setMode(m); setErr(""); }} style={{ flex:1, background:mode===m?C.card:"transparent", border:`1px solid ${mode===m?C.border:"transparent"}`, color:mode===m?C.text:C.muted, borderRadius:6, padding:"8px 0", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s" }}>
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {mode === "register" && (
                  <div>
                    <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>Full Name</div>
                    <input value={name} onChange={e=>{ setName(e.target.value); setErr(""); }} placeholder="Your full name" style={inputStyle} />
                  </div>
                )}
                <div>
                  <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>Email</div>
                  <input type="email" value={email} onChange={e=>{ setEmail(e.target.value); setErr(""); }} placeholder="you@email.com" style={inputStyle} onKeyDown={e=>e.key==="Enter"&&submit()} />
                </div>
                <div>
                  <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>Password</div>
                  <div style={{ position:"relative" }}>
                    <input type={showPw?"text":"password"} value={pw} onChange={e=>{ setPw(e.target.value); setErr(""); }} placeholder={mode==="register"?"Min. 6 characters":"Your password"} style={{ ...inputStyle, paddingRight:44 }} onKeyDown={e=>e.key==="Enter"&&submit()} />
                    <button onClick={()=>setShowPw(s=>!s)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"transparent", border:"none", color:C.muted, cursor:"pointer", fontSize:14, fontFamily:"inherit" }}>
                      {showPw ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>
                {mode === "register" && (
                  <div>
                    <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>Confirm Password</div>
                    <input type={showPw?"text":"password"} value={pw2} onChange={e=>{ setPw2(e.target.value); setErr(""); }} placeholder="Repeat password" style={inputStyle} onKeyDown={e=>e.key==="Enter"&&submit()} />
                  </div>
                )}

                {err && (
                  <div style={{ background:C.red+"15", border:`1px solid ${C.red}44`, borderRadius:8, padding:"9px 14px", color:C.red, fontSize:12 }}>⚠️ {err}</div>
                )}

                <button onClick={submit} disabled={loading} style={{ width:"100%", background:loading?C.border:`linear-gradient(135deg,${C.accent},#0096CC)`, color:loading?C.muted:"#000", border:"none", borderRadius:8, padding:"12px", fontWeight:900, fontSize:14, cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", marginTop:4, transition:"all 0.2s" }}>
                  {loading ? "Connecting to server..." : mode === "login" ? "Sign In →" : "Create Account →"}
                </button>

                {mode === "login" && (
                  <div style={{ textAlign:"center" }}>
                    <button onClick={()=>{ setMode("register"); setErr(""); }} style={{ background:"transparent", border:"none", color:C.muted, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
                      No account? <span style={{ color:C.accent, fontWeight:700 }}>Create one free →</span>
                    </button>
                  </div>
                )}
              </div>

              {mode === "register" && (
                <div style={{ marginTop:16, padding:"12px 14px", background:C.accent+"0D", border:`1px solid ${C.accent}22`, borderRadius:8 }}>
                  <div style={{ color:C.accent, fontWeight:700, fontSize:11, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>What you unlock for free</div>
                  {["Unlimited Resume Scans","JD Analyzer & ATS Keyword Finder","HM Interview Simulator","STAR Story Builder","Salary Coach + Negotiation Roleplay","Cover Letter Generator","Application Tracker (saved across sessions)"].map((f,i) => (
                    <div key={i} style={{ color:C.text, fontSize:12, marginBottom:4 }}>✓ {f}</div>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

// ── AuthGate — shown when a locked module is accessed without login ─────────
function AuthGate({ moduleName, moduleIcon, onLogin, onRegister }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, alignItems:"center", paddingTop:40 }}>
      <div style={{ textAlign:"center", maxWidth:440 }}>
        <div style={{ fontSize:48, marginBottom:12 }}>{moduleIcon}</div>
        <div style={{ color:C.text, fontWeight:800, fontSize:20, marginBottom:8 }}>{moduleName}</div>
        <div style={{ color:C.muted, fontSize:14, lineHeight:1.7, marginBottom:24 }}>
          This module uses your resume + career history to generate coaching<br/>
          that gets more personalised every session. Free — no card needed.
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button onClick={onRegister} style={{ background:`linear-gradient(135deg,${C.accent},#0096CC)`, color:"#000", border:"none", borderRadius:8, padding:"12px 24px", fontWeight:900, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>
            ✨ Create Free Account
          </button>
          <button onClick={onLogin} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.text, borderRadius:8, padding:"12px 20px", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
            Sign In
          </button>
        </div>
      </div>

      {/* Access policy explainer */}
      <div style={{ width:"100%", maxWidth:500 }}>
        <Card>
          <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>What's free vs what requires login</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {[
              { icon:"🔎", label:"Job Search (all boards)", access:"Always Free", color:C.green },
              { icon:"🌏", label:"Market Intel", access:"Always Free", color:C.green },
              { icon:"⚡", label:"Resume Scan", access:"1 free scan", color:C.gold },
              { icon:"📡", label:"Weakness Radar", access:"1 free view", color:C.gold },
              { icon:"🏆", label:"Readiness Score", access:"1 free score", color:C.gold },
              { icon:"🔍", label:"JD Analyzer", access:"Login required", color:C.red },
              { icon:"⭐", label:"STAR Builder", access:"Login required", color:C.red },
              { icon:"🧠", label:"HM Simulator", access:"Login required", color:C.red },
              { icon:"💰", label:"Salary Coach", access:"Login required", color:C.red },
              { icon:"✉️", label:"Cover Letter", access:"Login required", color:C.red },
            ].map((r,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${C.border}22` }}>
                <div style={{ color:C.text, fontSize:12 }}>{r.icon} {r.label}</div>
                <Badge label={r.access} color={r.color} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}


// ── Pricing Modal — full value breakdown with user surplus ────────────────────
function PricingModal({ onClose, onSignup }) {
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(9,12,18,0.92)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px 16px",backdropFilter:"blur(12px)",animation:"fadeIn 0.2s ease",overflowY:"auto"}}>
      <div style={{width:"100%",maxWidth:640,background:"#0F1520",border:"1px solid #1E2D45",borderRadius:18,overflow:"hidden",boxShadow:"0 40px 100px rgba(0,0,0,0.6)",animation:"fadeIn 0.25s ease",maxHeight:"90vh",overflowY:"auto"}}>

        {/* Header */}
        <div style={{padding:"22px 28px 0",display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
          <div>
            <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:20,color:"#E8F0FE",letterSpacing:"-0.3px",marginBottom:4}}>Simple, honest pricing</div>
            <div style={{fontSize:12,color:"#6B7E9F",lineHeight:1.5}}>Pay only for what you use. Free forever for core features.</div>
          </div>
          <button onClick={onClose} style={{background:"transparent",border:"1px solid #1E2D45",color:"#6B7E9F",borderRadius:7,padding:"5px 11px",fontSize:13,cursor:"pointer",fontFamily:"inherit",flexShrink:0,marginLeft:16}}>✕</button>
        </div>

        {/* Value comparison banner */}
        <div style={{margin:"20px 28px 0",background:"rgba(0,212,255,0.05)",border:"1px solid rgba(0,212,255,0.15)",borderRadius:12,padding:"14px 18px"}}>
          <div style={{fontSize:11,color:"#00D4FF",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:8}}>What Pro replaces</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[
              {item:"Career coach (1 session)",market:"$200–300",ours:"included"},
              {item:"Mock interview (Interviewing.io)",market:"$300/session",ours:"unlimited"},
              {item:"Resume review service",market:"$50–150",ours:"unlimited"},
            ].map((r,i)=>(
              <div key={i} style={{background:"#131B2A",borderRadius:9,padding:"10px 12px"}}>
                <div style={{fontSize:10,color:"#6B7E9F",marginBottom:6,lineHeight:1.4}}>{r.item}</div>
                <div style={{fontSize:11,color:"#FF4757",textDecoration:"line-through",marginBottom:2}}>{r.market}</div>
                <div style={{fontSize:11,color:"#00E88F",fontWeight:700}}>{r.ours} in Pro</div>
              </div>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,padding:"20px 28px"}}>

          {/* Free */}
          <div style={{background:"#131B2A",border:"1px solid #1E2D45",borderRadius:14,padding:"20px 16px"}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6B7E9F",marginBottom:10}}>Free</div>
            <div style={{fontFamily:"var(--font-display)",fontSize:30,fontWeight:900,color:"#E8F0FE",lineHeight:1,marginBottom:3}}>$0</div>
            <div style={{fontSize:11,color:"#6B7E9F",marginBottom:16}}>forever</div>
            <div style={{height:1,background:"#1E2D45",marginBottom:14}}/>
            {[
              ["Job Search","20+ boards"],
              ["Resume Scan","1 free"],
              ["Weakness Radar","1 view"],
              ["Market Intel","all regions"],
              ["Readiness Score","1 view"],
            ].map(([f,d])=>(
              <div key={f} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9,paddingBottom:9,borderBottom:"1px solid #1E2D4522"}}>
                <span style={{fontSize:11,color:"#94A3B8"}}>{f}</span>
                <span style={{fontSize:10,color:"#00E88F",fontWeight:600}}>{d}</span>
              </div>
            ))}
            <button onClick={onSignup} style={{width:"100%",background:"transparent",border:"1px solid #1E2D45",color:"#94A3B8",borderRadius:8,padding:"10px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",marginTop:4,transition:"all 0.15s"}}>
              Start free
            </button>
          </div>

          {/* Pro — featured */}
          <div style={{background:"linear-gradient(135deg,rgba(0,212,255,0.06),rgba(0,150,204,0.03))",border:"1px solid rgba(0,212,255,0.35)",borderRadius:14,padding:"20px 16px",position:"relative"}}>
            <div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",background:"linear-gradient(135deg,#00D4FF,#0096CC)",color:"#000",borderRadius:100,padding:"2px 12px",fontSize:9,fontWeight:700,letterSpacing:"0.06em",whiteSpace:"nowrap"}}>Most popular</div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#00D4FF",marginBottom:10}}>Pro</div>
            <div style={{fontFamily:"var(--font-display)",fontSize:30,fontWeight:900,color:"#00D4FF",lineHeight:1,marginBottom:3}}>$19</div>
            <div style={{fontSize:11,color:"#6B7E9F",marginBottom:16}}>per month · cancel anytime</div>
            <div style={{height:1,background:"rgba(0,212,255,0.2)",marginBottom:14}}/>
            {[
              ["Everything in Free","✓"],
              ["Unlimited scans","∞"],
              ["HM Simulator","4 personas"],
              ["Salary Coach","+ roleplay"],
              ["JD Analyzer","unlimited"],
              ["Cover Letter","unlimited"],
              ["AI Memory","full history"],
              ["Rejection Coach","auto-triggered"],
              ["STAR Builder","persistent bank"],
            ].map(([f,d])=>(
              <div key={f} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9,paddingBottom:9,borderBottom:"1px solid rgba(0,212,255,0.08)"}}>
                <span style={{fontSize:11,color:"#94A3B8"}}>{f}</span>
                <span style={{fontSize:10,color:"#00D4FF",fontWeight:600}}>{d}</span>
              </div>
            ))}
            <button onClick={onSignup} style={{width:"100%",background:"linear-gradient(135deg,#00D4FF,#0096CC)",color:"#000",border:"none",borderRadius:8,padding:"11px",fontWeight:900,fontSize:12,cursor:"pointer",fontFamily:"inherit",marginTop:4,boxShadow:"0 0 24px rgba(0,212,255,0.35)",transition:"all 0.15s"}}>
              Get Pro — $19/month
            </button>
          </div>

          {/* Interview Pack */}
          <div style={{background:"#131B2A",border:"1px solid rgba(255,184,0,0.25)",borderRadius:14,padding:"20px 16px"}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#FFB800",marginBottom:10}}>Interview Pack</div>
            <div style={{fontFamily:"var(--font-display)",fontSize:30,fontWeight:900,color:"#FFB800",lineHeight:1,marginBottom:3}}>$29</div>
            <div style={{fontSize:11,color:"#6B7E9F",marginBottom:16}}>one-time · no subscription</div>
            <div style={{height:1,background:"rgba(255,184,0,0.2)",marginBottom:14}}/>
            {[
              ["Deep resume scan","1 session"],
              ["10 custom questions","from resume"],
              ["3 STAR stories","AI refined"],
              ["Cover letter","tailored"],
              ["JD match report","1 role"],
            ].map(([f,d])=>(
              <div key={f} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9,paddingBottom:9,borderBottom:"1px solid rgba(255,184,0,0.08)"}}>
                <span style={{fontSize:11,color:"#94A3B8"}}>{f}</span>
                <span style={{fontSize:10,color:"#FFB800",fontWeight:600}}>{d}</span>
              </div>
            ))}
            <button onClick={onSignup} style={{width:"100%",background:"rgba(255,184,0,0.1)",color:"#FFB800",border:"1px solid rgba(255,184,0,0.3)",borderRadius:8,padding:"10px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",marginTop:4,transition:"all 0.15s"}}>
              Buy pack — $29
            </button>
          </div>

        </div>

        {/* User surplus callout */}
        <div style={{margin:"0 28px 24px",background:"rgba(0,232,143,0.05)",border:"1px solid rgba(0,232,143,0.15)",borderRadius:12,padding:"14px 18px"}}>
          <div style={{fontSize:11,color:"#00E88F",fontWeight:700,marginBottom:6}}>Your value surplus on Pro</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[
              {label:"Value you get (market equivalent)",val:"$650+/month",color:"#00E88F"},
              {label:"What you pay",val:"$19/month",color:"#E8F0FE"},
              {label:"Your surplus",val:"$631+/month",color:"#00D4FF"},
              {label:"ROI on single salary negotiation",val:"52×",color:"#FFB800"},
            ].map((s,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid rgba(0,232,143,0.08)"}}>
                <span style={{fontSize:10,color:"#6B7E9F"}}>{s.label}</span>
                <span style={{fontSize:12,color:s.color,fontWeight:700,fontFamily:"var(--font-display)"}}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer trust line */}
        <div style={{borderTop:"1px solid #1E2D45",padding:"14px 28px",display:"flex",justifyContent:"center",gap:24,flexWrap:"wrap"}}>
          {["No credit card to start","Cancel Pro anytime","Data saved to cloud","NPS 58 satisfaction"].map((t,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#6B7E9F"}}>
              <span style={{color:"#00E88F",fontWeight:700}}>✓</span>{t}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}


// ── Pro Upgrade Modal ────────────────────────────────────────────────────────
// Triggered at key conversion moments — NOT a generic paywall.
// Each reason has tailored copy targeting the specific anxiety/need.
function ProUpgradeModal({ reason, onClose, onSignup }) {
  const configs = {
    interviewing: {
      icon: "🧠",
      urgency: "You have an interview coming up.",
      headline: "Practice before you walk in.",
      subhead: "Candidates who do 3+ mock interviews are 2.4x more likely to get the offer.",
      cta: "Unlock HM Simulator — $19/month",
      features: [
        "🧠 HM Simulator — AI hiring manager grills you on YOUR resume",
        "⭐ Unlimited STAR story refinement + story bank",
        "💰 Salary negotiation scripts + live AI roleplay",
        "✉️ Unlimited cover letters + follow-up emails",
        "🔍 Unlimited JD match analyses",
        "🧬 AI Memory — personalised coaching that improves every session",
      ],
      comparison: ["One career coaching session", "$200–300", "CareerAiHub Pro / month", "$19"],
      color: C.purple,
    },
    hm: {
      icon: "🧠",
      urgency: "The HM Simulator is a Pro feature.",
      headline: "This is where interviews are won.",
      subhead: "4 AI personas. Questions generated from YOUR resume. Real-time scoring. $300/session on Interviewing.io. $19/month here.",
      cta: "Unlock HM Simulator — $19/month",
      features: [
        "🧠 HM Simulator — 4 interviewer personas, unlimited sessions",
        "💰 Salary Coach — benchmarks + word-for-word negotiation scripts",
        "⭐ Unlimited STAR story builder + persistent story bank",
        "✉️ Unlimited cover letters in 4 tones",
        "🔍 Unlimited JD analyses + ATS keyword extraction",
        "🧬 AI Career Plan — personalised weekly plan from your full history",
      ],
      comparison: ["Interviewing.io per session", "$300", "CareerAiHub Pro / month", "$19"],
      color: C.purple,
    },
    salary: {
      icon: "💰",
      urgency: "You're about to negotiate your salary.",
      headline: "Don't leave $10,000 on the table.",
      subhead: "The average professional leaves $5,000–15,000 unclaimed per offer. Pro users get exact scripts and live AI roleplay to practice before the real call.",
      cta: "Unlock Salary Coach — $19/month",
      features: [
        "💰 Salary benchmarks by role, level, and market",
        "📝 Word-for-word negotiation scripts — opening, pushback, closing",
        "🤖 Live AI roleplay as the hiring manager — practice until confident",
        "📊 Offer comparison calculator — true 3-year value analysis",
        "🧠 HM Simulator — walk into the interview ready",
        "🧬 Memory — every session makes the AI smarter about your situation",
      ],
      comparison: ["Career coach for negotiation prep", "$150–300", "CareerAiHub Pro / month", "$19"],
      color: C.green,
    },
    limit: {
      icon: "⚡",
      urgency: "You've used your free previews.",
      headline: "You're clearly serious about this.",
      subhead: "You've already scanned your resume, checked your gaps, and seen your readiness score. The next step is fixing them — and that's where Pro comes in.",
      cta: "Create Free Account to Continue",
      features: [
        "⚡ Unlimited resume scans — re-scan after every edit",
        "🔍 JD Analyzer — match any job description in seconds",
        "⭐ STAR Builder — refine and bank your best interview stories",
        "✉️ Cover Letter — personalised to every role",
        "🧠 HM Simulator — mock interviews from your actual resume",
        "☁️ Everything saved to cloud — never lose your progress",
      ],
      comparison: ["Resume.io + Interviewing.io + LinkedIn Premium", "$70+/mo", "CareerAiHub (free account)", "$0"],
      color: C.accent,
    },
  };

  const cfg = configs[reason] || configs.limit;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(9,12,18,0.94)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:20,backdropFilter:"blur(8px)",animation:"fadeIn 0.2s ease"}}>
      <div style={{width:"100%",maxWidth:480,animation:"fadeIn 0.3s ease",maxHeight:"90vh",overflowY:"auto"}}>
        <Card glow={cfg.color} style={{position:"relative"}}>

          {/* Close */}
          <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,padding:"3px 9px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>✕</button>

          {/* Urgency badge */}
          <div style={{background:cfg.color+"22",border:`1px solid ${cfg.color}44`,borderRadius:6,padding:"5px 12px",fontSize:11,fontWeight:700,color:cfg.color,display:"inline-block",marginBottom:14,letterSpacing:0.5}}>
            {cfg.urgency}
          </div>

          {/* Headline */}
          <div style={{fontSize:22,marginBottom:6}}>{cfg.icon}</div>
          <div style={{color:C.text,fontWeight:900,fontSize:20,marginBottom:8,lineHeight:1.2,fontFamily:"var(--font-display)"}}>{cfg.headline}</div>
          <div style={{color:C.muted,fontSize:13,lineHeight:1.7,marginBottom:20}}>{cfg.subhead}</div>

          {/* Feature list */}
          <div style={{marginBottom:20}}>
            {cfg.features.map((f,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:`1px solid ${C.border}22`}}>
                <div style={{width:18,height:18,borderRadius:"50%",background:cfg.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:cfg.color,fontWeight:900,flexShrink:0}}>✓</div>
                <div style={{color:C.text,fontSize:12,lineHeight:1.5}}>{f}</div>
              </div>
            ))}
          </div>

          {/* Price comparison */}
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 16px",marginBottom:20,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={{textAlign:"center",padding:"8px 0",borderRight:`1px solid ${C.border}`}}>
              <div style={{color:C.muted,fontSize:11,marginBottom:4}}>{cfg.comparison[0]}</div>
              <div style={{color:C.red,fontWeight:900,fontSize:18,textDecoration:"line-through"}}>{cfg.comparison[1]}</div>
            </div>
            <div style={{textAlign:"center",padding:"8px 0"}}>
              <div style={{color:C.muted,fontSize:11,marginBottom:4}}>{cfg.comparison[2]}</div>
              <div style={{color:cfg.color,fontWeight:900,fontSize:18}}>{cfg.comparison[3]}</div>
            </div>
          </div>

          {/* CTA buttons */}
          <button onClick={onSignup} style={{width:"100%",background:`linear-gradient(135deg,${cfg.color},${cfg.color}99)`,color:reason==="interviewing"||reason==="hm"?"#fff":"#000",border:"none",borderRadius:8,padding:"13px",fontWeight:900,fontSize:14,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>
            {cfg.cta} →
          </button>
          <button onClick={onClose} style={{width:"100%",background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:8,padding:"10px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
            Maybe later
          </button>

          {/* Trust line */}
          <div style={{textAlign:"center",marginTop:12,color:C.muted,fontSize:11}}>
            No credit card required to start · Cancel anytime · Data saved to cloud
          </div>

        </Card>
      </div>
    </div>
  );
}

// ── PreviewGate — shown after 1 free use of PREVIEW modules ──────────────────
function PreviewGate({ moduleName, moduleIcon, onLogin, onRegister }) {
  return (
    <Card glow={C.gold} style={{ padding:"24px 28px" }}>
      {/* Top row */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <div style={{ fontSize:28 }}>{moduleIcon}</div>
        <div>
          <div style={{ color:C.gold, fontWeight:900, fontSize:15, marginBottom:2 }}>
            You've seen what AI finds in your resume.
          </div>
          <div style={{ color:C.muted, fontSize:12 }}>
            Create a free account to fix it — and unlock 7 more tools.
          </div>
        </div>
      </div>

      {/* What's unlocked for free */}
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 14px", marginBottom:16 }}>
        <div style={{ color:C.accent, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Free account unlocks — no card needed</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 16px" }}>
          {["🔍 JD Analyzer","⭐ STAR Builder","✉️ Cover Letter","📡 Weakness Radar (unlimited)","🏆 Readiness Score (unlimited)","⚡ Resume Scan (unlimited)"].map((f,i)=>(
            <div key={i} style={{ color:C.text, fontSize:12, padding:"3px 0" }}>✓ {f}</div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={onRegister} style={{ flex:2, background:`linear-gradient(135deg,${C.accent},#0096CC)`, color:"#000", border:"none", borderRadius:8, padding:"12px", fontWeight:900, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
          ✨ Create Free Account →
        </button>
        <button onClick={onLogin} style={{ flex:1, background:"transparent", border:`1px solid ${C.border}`, color:C.text, borderRadius:8, padding:"12px", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
          Sign In
        </button>
      </div>
      <div style={{ textAlign:"center", marginTop:10, color:C.muted, fontSize:11 }}>
        No credit card · 30 seconds to sign up · Data saved to cloud
      </div>
    </Card>
  );
}

// ── User Menu Dropdown ────────────────────────────────────────────────────────
function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const days = user.joinedAt ? Math.max(0, Math.floor((Date.now() - new Date(user.joinedAt)) / 86400000)) : 0;
  return (
    <div style={{ position:"relative" }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:8, background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 12px", cursor:"pointer", fontFamily:"inherit", color:C.text, fontSize:12, fontWeight:700 }}>
        <div style={{ width:26, height:26, borderRadius:"50%", background:`linear-gradient(135deg,${C.accent},${C.purple})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:900, color:"#000", flexShrink:0 }}>
          {user.avatar}
        </div>
        <span style={{ maxWidth:100, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.name.split(" ")[0]}</span>
        <span style={{ color:C.muted, fontSize:10 }}>{open?"▲":"▼"}</span>
      </button>
      {open && (
        <div style={{ position:"absolute", right:0, top:"calc(100% + 8px)", width:220, background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:12, zIndex:200, boxShadow:"0 16px 40px rgba(0,0,0,0.5)", animation:"fadeIn 0.15s ease" }}>
          <div style={{ borderBottom:`1px solid ${C.border}`, paddingBottom:10, marginBottom:10 }}>
            <div style={{ color:C.text, fontWeight:800, fontSize:13 }}>{user.name}</div>
            <div style={{ color:C.muted, fontSize:11, marginTop:2 }}>{user.email}</div>
            <div style={{ color:C.muted, fontSize:10, marginTop:4 }}>Member for {days === 0 ? "today" : `${days} day${days!==1?"s":""}`}</div>
            <div style={{ color:C.green, fontSize:10, marginTop:2 }}>☁️ Data saved to cloud</div>
          </div>
          <div style={{ marginBottom:8 }}>
            <div style={{ color:user.isPro?C.green:C.gold, fontSize:11, fontWeight:700, marginBottom:6 }}>
              {user.isPro ? "✅ Pro Plan — Unlimited Access" : "⚡ Free Plan — 1 use per feature"}
            </div>
            {!user.isPro && (
              <div style={{ color:C.muted, fontSize:10, marginBottom:8 }}>
                Upgrade to Pro for unlimited AI scans, mock interviews, and career coaching.
              </div>
            )}
            {["Resume Scan","JD Analyzer","STAR Builder","HM Simulator","Salary Coach","Cover Letter"].map(f=>(
              <div key={f} style={{ color:C.muted, fontSize:11, marginBottom:2 }}>· {f}</div>
            ))}
          </div>
          <button onClick={()=>{ setOpen(false); onLogout(); }} style={{ width:"100%", background:"transparent", border:`1px solid ${C.red}44`, color:C.red, borderRadius:6, padding:"8px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
function App(){
  const [activeModule,setActiveModule]   = useState("jobs");
  const [setupDone,setSetupDone]         = useState(true);
  const [form,setForm]                   = useState({role:"Senior Product Manager",industry:"Fintech",level:"Senior",market:"Singapore",urgency:"7 days"});
  const [resumeText,setResumeText]       = useState(null);
  const [scanResult,setScanResult]       = useState(null);

  // ── Auth state ──────────────────────────────────────────────────────────────
  const [user,setUser]                   = useState(()=>getSession());
  const [authModal,setAuthModal]         = useState(null);
  const [authLoading,setAuthLoading]     = useState(true); // loading while we verify token
  const [proModal,setProModal]           = useState(null); // null | "interviewing" | "limit" | "hm" | "salary"
  const [showPricing,setShowPricing]     = useState(false); // full pricing modal
  const [cmdOpen,setCmdOpen]             = useState(false); // command palette
  const [darkMode,setDarkMode]           = useState(true);  // theme toggle
  const [previewUsed,setPreviewUsed]     = useState(()=>{
    try { return JSON.parse(localStorage.getItem("djai_preview")||"{}"); } catch { return {}; }
  });

  // ── Memory state ───────────────────────────────────────────────────────────
  const [memory, setMemory] = useState(() => user ? (loadMemory(user.email) || initMemory()) : null);

  // ── Restore session from stored token on mount ─────────────────────────────
  useEffect(() => {
    const restore = async () => {
      const token = getToken();
      const cached = getSessionLocal();
      if (token && cached) {
        // Verify token is still valid with Supabase
        try {
          const userData = await sb.getUser(token);
          if (userData?.id) {
            const session = { ...cached, id: userData.id, token };
            // Sync real Pro status from DB
            try {
              const profiles = await sb.select("profiles", { id: `eq.${userData.id}` }, token);
              if (profiles && profiles[0]) {
                session.isPro = !!profiles[0].is_pro;
              }
            } catch (e) { console.warn("Restore profile sync failed:", e.message); }
            setUser(session);
            saveSessionLocal(session);
            // Load memory from DB
            const mem = await loadMemoryFromDB(userData.id, token);
            setMemory(mem || loadMemory(cached.email) || initMemory());
          } else {
            clearToken();
            setUser(null);
          }
        } catch {
          // Token likely expired — clear it
          clearToken();
          setUser(null);
        }
      }
      setAuthLoading(false);
    };
    restore();
  }, []);

  const updateMemory = (updater) => {
    setMemory(prev => {
      const current = prev || initMemory();
      const next = { ...current, ...updater(current), lastSeen: new Date().toISOString(), totalSessions: (current.totalSessions || 0) + 1 };
      return next;
    });
  };

  // ── Sync memory to storage on change ───────────────────────────────────────
  useEffect(() => {
    if (!memory) return;
    if (user?.id && user?.token) {
      saveMemoryToDB(user.id, user.token, memory);
    } else if (user?.email) {
      saveMemory(user.email, memory);
    }
  }, [memory, user?.id, user?.token, user?.email]);

  const login = async (session) => {
    setUser(session);
    setAuthModal(null);
    setSetupDone(true); // Redirect to main app if coming from onboarding/signup
    // Ensure they land on a meaningful main page (Jobs module)
    if (activeModule === "search") setActiveModule("jobs");
    // Load memory from Supabase DB first, fallback to localStorage
    let mem = null;
    if (session.id && session.token) {
      mem = await loadMemoryFromDB(session.id, session.token);
    }
    if (!mem) mem = loadMemory(session.email);
    if (!mem) mem = initMemory();
    setMemory(mem);
  };

  const logout = async () => {
    try { if (user?.token) await sb.signOut(user.token); } catch {}
    clearSession();
    setUser(null);
    setMemory(null);
  };
  const markPreview = (moduleId) => {
    const next = { ...previewUsed, [moduleId]: (previewUsed[moduleId]||0) + 1 };
    setPreviewUsed(next);
    localStorage.setItem("djai_preview", JSON.stringify(next));
  };

  // ── Usage Tracking ─────────────────────────────────────────────────────────
  const isModuleUsed = (moduleId, mem) => {
    if (!mem) return false;
    switch (moduleId) {
      case "scan":
      case "radar":
      case "score":
        return (mem.scanHistory?.length || 0) > 0;
      case "jd":
        return (mem.jdAnalyses?.length || 0) > 0;
      case "star":
        return (mem.starBank?.length || 0) > 0;
      case "simulate":
        return (mem.mockSessions?.length || 0) > 0;
      case "salary":
        return (mem.negotiationPractice || 0) > 0;
      case "cover":
        return (mem.coverLetters?.length || 0) > 0;
      default:
        return false;
    }
  };

  // ── Determine what a guest can see for each module ──────────────────────────
  // Returns: "allowed" | "preview_gate" | "auth_gate"
  const getAccess = (moduleId) => {
    const policy = ACCESS[moduleId] || "FREE";
    if (policy === "FREE") return "allowed";

    // Mandatory login for all LLM features
    if (!user) return "auth_gate";

    // Pro users get full access
    if (user.isPro) return "allowed";

    // Free users (logged in) can use each feature once
    if (isModuleUsed(moduleId, memory)) {
      return "preview_gate"; // Triggers Pro upgrade prompt
    }

    return "allowed";
  };

  const css=`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800;900&family=JetBrains+Mono:wght@400;700&family=Instrument+Serif:ital@0;1&display=swap');

    /* ── Design tokens ─────────────────────────────────── */
    :root {
      --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px;
      --space-5:20px; --space-6:24px; --space-8:32px; --space-10:40px; --space-12:48px;
      --radius-sm:6px; --radius-md:10px; --radius-lg:14px; --radius-xl:20px; --radius-full:9999px;
      --font-display:'Outfit',sans-serif;
      --font-serif:'Instrument Serif',serif;
      --font-body:'Inter',sans-serif;
      --font-mono:'JetBrains Mono',monospace;
      --transition-fast:all 0.12s ease;
      --transition-base:all 0.2s ease;
      --transition-slow:all 0.35s ease;
    }

    /* ── Reset ─────────────────────────────────────────── */
    *{box-sizing:border-box}
    ::-webkit-scrollbar{width:4px;height:4px}
    ::-webkit-scrollbar-track{background:${C.bg}}
    ::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px}

    /* ── Typography scale ──────────────────────────────── */
    .t-display{font-family:var(--font-display);font-size:36px;font-weight:900;letter-spacing:-1px;line-height:1.1}
    .t-h1{font-family:var(--font-display);font-size:24px;font-weight:900;line-height:1.25;letter-spacing:-0.5px}
    .t-h2{font-family:var(--font-display);font-size:18px;font-weight:800;line-height:1.3;letter-spacing:-0.2px}
    .t-h3{font-family:var(--font-body);font-size:15px;font-weight:700;line-height:1.4}
    .t-body{font-family:var(--font-body);font-size:13px;font-weight:400;line-height:1.7}
    .t-small{font-family:var(--font-body);font-size:12px;font-weight:400;line-height:1.5}
    .t-caption{font-family:var(--font-body);font-size:11px;font-weight:400;line-height:1.4;letter-spacing:0.02em}
    .t-label{font-family:var(--font-body);font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase}
    .t-serif{font-family:var(--font-serif);font-weight:400;font-style:italic}
    .t-score{font-family:var(--font-display);font-size:80px;font-weight:900;line-height:1;letter-spacing:-3px}
    .t-score-sm{font-family:var(--font-display);font-size:52px;font-weight:900;line-height:1;letter-spacing:-2px}
    .t-mono{font-family:var(--font-mono);font-size:12px}

    /* ── Button system ─────────────────────────────────── */
    .btn{
      display:inline-flex;align-items:center;justify-content:center;gap:6px;
      border:none;border-radius:var(--radius-md);padding:11px 20px;
      font-weight:800;font-size:13px;cursor:pointer;
      font-family:var(--font-mono);width:100%;
      transition:var(--transition-fast);
      position:relative;overflow:hidden;
      -webkit-user-select:none;user-select:none;
    }
    .btn:disabled{opacity:0.45;cursor:not-allowed;transform:none!important;filter:none!important}
    .btn-primary{color:#000}
    .btn-primary:not(:disabled):hover{filter:brightness(1.12);transform:translateY(-1px)}
    .btn-primary:not(:disabled):active{transform:scale(0.97) translateY(0);filter:brightness(0.95)}
    .btn-ghost{background:transparent!important;color:${C.muted};border:1px solid ${C.border}!important}
    .btn-ghost:not(:disabled):hover{background:${C.surface}!important;border-color:${C.accent}66!important;color:${C.text}!important}
    .btn-ghost:not(:disabled):active{transform:scale(0.97)}
    .btn-danger{background:${C.red}22!important;color:${C.red}!important;border:1px solid ${C.red}44!important}
    .btn-danger:not(:disabled):hover{background:${C.red}33!important}
    .btn-icon{width:auto;padding:7px 14px;font-size:12px;font-weight:700}

    /* ── Input focus states ────────────────────────────── */
    input:focus,textarea:focus,select:focus{
      border-color:${C.accent}88!important;
      box-shadow:0 0 0 3px ${C.accent}15!important;
      outline:none;
    }
    input::placeholder,textarea::placeholder{color:${C.muted}88}

    /* ── Card hover ────────────────────────────────────── */
    .card-hover{transition:var(--transition-base);cursor:pointer}
    .card-hover:hover{border-color:${C.accent}55!important;transform:translateY(-1px)}
    .card-hover:active{transform:translateY(0) scale(0.99)}

    /* ── Module nav ────────────────────────────────────── */
    .mod-tab{
      border:1px solid ${C.border};background:transparent;color:${C.muted};
      border-radius:var(--radius-md);padding:8px 14px;font-size:11px;font-weight:700;
      cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:5px;
      transition:var(--transition-base);font-family:var(--font-mono);
      position:relative;
    }
    .mod-tab:hover{border-color:${C.accent}55;color:${C.text};background:${C.surface}}
    .mod-tab.active{font-size:12px;font-weight:800}
    .mod-tab.active::after{
      content:'';position:absolute;bottom:-2px;left:8px;right:8px;height:2px;
      border-radius:2px;
    }

    /* ── Skeleton loader ───────────────────────────────── */
    .skeleton{background:${C.surface};border-radius:6px;overflow:hidden;position:relative}
    .skeleton::after{
      content:'';position:absolute;inset:0;
      background:linear-gradient(90deg,transparent 0%,${C.border}55 50%,transparent 100%);
      animation:shimmer 1.6s ease-in-out infinite;
    }
    @keyframes shimmer{from{transform:translateX(-100%)}to{transform:translateX(100%)}}

    /* ── Toast ─────────────────────────────────────────── */
    .toast-wrap{position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none}
    .toast{
      display:flex;align-items:center;gap:10px;
      padding:12px 16px;border-radius:var(--radius-md);
      font-family:var(--font-mono);font-size:13px;font-weight:700;
      pointer-events:all;min-width:220px;max-width:340px;
      animation:toastIn 0.3s cubic-bezier(0.16,1,0.3,1);
      box-shadow:0 8px 32px rgba(0,0,0,0.4);
      border:1px solid transparent;
    }
    .toast-success{background:${C.green}22;border-color:${C.green}55;color:${C.green}}
    .toast-error{background:${C.red}22;border-color:${C.red}55;color:${C.red}}
    .toast-info{background:${C.accent}22;border-color:${C.accent}55;color:${C.accent}}
    .toast-warn{background:${C.gold}22;border-color:${C.gold}55;color:${C.gold}}
    @keyframes toastIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
    @keyframes toastOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(40px)}}

    /* ── Animated score counter ────────────────────────── */
    .score-counter{font-family:var(--font-display);font-weight:900;line-height:1;letter-spacing:-2px}

    /* ── Animations ────────────────────────────────────── */
    @keyframes ticker{from{transform:translateX(100%)}to{transform:translateX(-100%)}}
    @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeInScale{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
    @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes moduleEnter{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}

    /* ── Command palette ──────────────────────────────── */
    .cmd-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9000;display:flex;align-items:flex-start;justify-content:center;padding-top:120px;backdrop-filter:blur(8px);animation:fadeIn 0.15s ease}
    .cmd-box{background:#0F1520;border:1px solid #1E2D45;border-radius:16px;width:100%;max-width:560px;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,0.8);animation:fadeInScale 0.2s ease}
    .cmd-input-wrap{display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid #1E2D45}
    .cmd-icon{color:#6B7E9F;font-size:16px;flex-shrink:0}
    .cmd-input{flex:1;background:transparent;border:none;outline:none;color:#E8F0FE;font-family:var(--font-mono);font-size:15px}
    .cmd-input::placeholder{color:#6B7E9F}
    .cmd-hint{font-size:10px;color:#6B7E9F;font-family:var(--font-mono);background:#131B2A;padding:2px 7px;border-radius:4px;flex-shrink:0}
    .cmd-results{max-height:320px;overflow-y:auto;padding:8px}
    .cmd-section{font-size:10px;color:#6B7E9F;letter-spacing:.1em;text-transform:uppercase;padding:8px 12px 4px;font-family:var(--font-mono)}
    .cmd-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:8px;cursor:pointer;transition:background 0.1s}
    .cmd-item:hover,.cmd-item.selected{background:#131B2A}
    .cmd-item-icon{font-size:16px;width:24px;text-align:center;flex-shrink:0}
    .cmd-item-label{font-size:13px;color:#E8F0FE;flex:1;font-family:var(--font-body);}
    .cmd-item-hint{font-size:10px;color:#6B7E9F;font-family:var(--font-mono)}
    .cmd-footer{padding:10px 20px;border-top:1px solid #1E2D45;display:flex;gap:16px;font-size:10px;color:#6B7E9F;font-family:var(--font-mono)}
    .cmd-key{background:#131B2A;border:1px solid #1E2D45;border-radius:3px;padding:1px 5px}

    /* ── Animated radar bar ────────────────────────────── */
    .radar-bar-bg{background:#0A1020;border-radius:6px;height:10px;overflow:hidden;position:relative}
    .radar-bar-fill{height:100%;border-radius:6px;transition:width 1.4s cubic-bezier(0.16,1,0.3,1);width:0%;position:relative}
    .radar-bar-fill::after{content:'';position:absolute;top:0;right:0;bottom:0;width:40%;background:rgba(255,255,255,0.25);border-radius:0 6px 6px 0}

    /* ── Light mode ────────────────────────────────────── */
    body.light-mode{
      --bg-override:#F0F4F8;
      --surface-override:#FFFFFF;
      --card-override:#FFFFFF;
      --border-override:#E2E8F0;
      --text-override:#0F172A;
      --muted-override:#64748B;
    }

    /* ── Header brand upgrade ──────────────────────────── */
    .brand-name{font-family:var(--font-display);font-size:20px;font-weight:400;letter-spacing:-0.3px}
    .brand-dot{width:8px;height:8px;border-radius:50%;animation:pulse 2s ease infinite;flex-shrink:0;margin-top:2px}

    /* ── Module nav scrollbar hide ─────────────────────── */
    .nav-scroll{display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;scrollbar-width:none;-ms-overflow-style:none}
    .nav-scroll::-webkit-scrollbar{display:none}

    /* ── Insight banner ────────────────────────────────── */
    .insight-bar{border-radius:10px;padding:11px 16px;margin-bottom:16px;display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,rgba(0,212,255,0.06),rgba(139,92,246,0.06));border:1px solid rgba(0,212,255,0.15)}

    /* ── Progress steps ────────────────────────────────── */
    .step-row{display:flex;align-items:center;gap:0;margin-bottom:28px}
    .step-item{display:flex;align-items:center;gap:8px}
    .step-circle{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;transition:var(--transition-base)}
    .step-line{height:1px;flex:1;min-width:32px;background:#1E2D45;margin:0 8px}

    /* ── Responsive ────────────────────────────────────── */
    @media(max-width:600px){
      .grid-3{grid-template-columns:1fr!important}
      .grid-2{grid-template-columns:1fr!important}
      .hide-mobile{display:none!important}
      .mod-tab{padding:7px 10px;font-size:10px}
    }
    @media(max-width:800px){
      .grid-4{grid-template-columns:repeat(2,1fr)!important}
    }

    /* ── Light mode overrides ─────────────────────────── */
    [data-theme="light"] .mod-tab { border-color:#E2E8F0!important }
    [data-theme="light"] .mod-tab:hover { background:#F1F5F9!important }
    [data-theme="light"] input,[data-theme="light"] textarea,[data-theme="light"] select {
      background:#F8FAFC!important; border-color:#E2E8F0!important; color:#0F172A!important;
    }

    /* ── Kbd keys ─────────────────────────────────────── */
    kbd{
      background:#131B2A;border:1px solid #1E2D45;border-radius:4px;
      padding:1px 6px;font-size:10px;color:#6B7E9F;
      font-family:var(--font-mono);line-height:1.4;
    }

    /* ── Focus rings for accessibility ───────────────── */
    button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{
      outline:2px solid ${C.accent};outline-offset:2px;
    }

    /* ── Selection color ──────────────────────────────── */
    ::selection{background:${C.accent}33;color:${C.text}}

    textarea,input,select,button{outline:none}
  `;

  useEffect(()=>{
    if(!document.getElementById("pdfjs-script")){const s=document.createElement("script");s.id="pdfjs-script";s.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";document.head.appendChild(s);}
  },[]);

  // ── Module rendering with access control ────────────────────────────────────
  const moduleMap = useMemo(()=>MODULES.reduce((acc,m)=>({...acc,[m.id]:m}),{}), []);
  
  // Expose navigation + modal triggers globally for child component CTAs
  useEffect(() => {
    window._setAuthModal = setAuthModal;
    window._setShowPricing = setShowPricing;
    window._setSetupDone = setSetupDone;
    window._setActiveModule = setActiveModule;
    window._setProModal = setProModal;
    return () => {
      delete window._setAuthModal; delete window._setShowPricing;
      delete window._setSetupDone; delete window._setActiveModule;
      delete window._setProModal;
    };
  }, []);

  // ⌘K / Ctrl+K keyboard shortcut for command palette
  useEffect(()=>{
    const handler = (e) => {
      if ((e.metaKey||e.ctrlKey) && e.key==="k") { e.preventDefault(); setCmdOpen(o=>!o); }
      if (e.key==="Escape") setCmdOpen(false);
      // Number keys 1-9 switch modules (only when not in input)
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = document.activeElement?.tagName;
        if (tag!=="INPUT" && tag!=="TEXTAREA" && tag!=="SELECT") {
          const idx = parseInt(e.key) - 1;
          if (!isNaN(idx) && idx>=0 && idx<MODULES.length) {
            setActiveModule(MODULES[idx].id);
          }
        }
      }
    };
    window.addEventListener("keydown", handler);
    return ()=> window.removeEventListener("keydown", handler);
  },[]);

  // Theme side-effect: toggle data-theme attribute
  useEffect(()=>{
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // ── Setup / Onboarding screen ───────────────────────────────────────────────
  if(!setupDone) return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"var(--font-body)",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 16px",position:"relative",overflow:"hidden"}}>
      <style>{css}</style>
      <style>{`
        .setup-input{width:100%;background:${C.surface};border:1px solid ${C.border};border-radius:8px;color:${C.text};font-size:13px;padding:11px 14px;font-family:inherit;box-sizing:border-box;transition:all 0.2s;outline:none}
        .setup-input:focus{border-color:${C.accent}88!important;box-shadow:0 0 0 3px ${C.accent}15!important}
        .setup-input::placeholder{color:${C.muted}55}
        .setup-select{width:100%;background:${C.surface};border:1px solid ${C.border};border-radius:8px;color:${C.text};font-size:12px;padding:10px 12px;font-family:inherit;cursor:pointer;outline:none;transition:all 0.2s}
        .setup-select:focus{border-color:${C.accent}88!important;box-shadow:0 0 0 3px ${C.accent}15!important}
        .setup-label{font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${C.muted};margin-bottom:6px;display:block}
        .setup-orb{position:absolute;border-radius:50%;filter:blur(100px);pointer-events:none;animation:orbFloat 14s ease-in-out infinite}
        @keyframes orbFloat{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(20px,-14px) scale(1.04)}66%{transform:translate(-14px,18px) scale(.96)}}
        .mod-chip{display:inline-flex;align-items:center;gap:5px;background:${C.surface};border:1px solid ${C.border};border-radius:20px;padding:5px 12px;font-size:11px;transition:border-color 0.2s,background 0.2s;cursor:default}
        .mod-chip:hover{border-color:${C.border}cc;background:${C.card}}
        .feat-card{background:${C.surface};border:1px solid ${C.border};border-radius:12px;padding:16px;transition:border-color 0.2s,transform 0.2s}
        .feat-card:hover{border-color:${C.accent}44;transform:translateY(-2px)}
        .proof-pill{display:inline-flex;align-items:center;gap:6px;background:${C.surface};border:1px solid ${C.border};border-radius:20px;padding:5px 14px;font-size:11px;color:${C.muted}}
        .step-num{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0}
        .divider-line{height:1px;background:${C.border};margin:32px 0}
        .section-label{font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${C.muted};margin-bottom:16px;text-align:center}
      `}</style>
      <ToastProvider/>
      {authModal && <AuthModal initialMode={authModal} onSuccess={login} onClose={()=>setAuthModal(null)}/>}
      {proModal && <ProUpgradeModal reason={proModal} onClose={()=>setProModal(null)} onSignup={()=>{setProModal(null);setAuthModal("register");}}/>}
      {cmdOpen && <CommandPalette modules={MODULES} setActiveModule={(id)=>{setActiveModule(id);setSetupDone(true);}} setAuthModal={setAuthModal} user={user} onClose={()=>setCmdOpen(false)}/>}
      {showPricing && <PricingModal onClose={()=>setShowPricing(false)} onSignup={()=>{setShowPricing(false);setAuthModal("register");}}/>}

      {/* Background orbs */}
      <div className="setup-orb" style={{width:700,height:700,background:C.accent,opacity:0.05,top:-250,left:-200,zIndex:0}}/>
      <div className="setup-orb" style={{width:500,height:500,background:C.purple,opacity:0.04,bottom:-150,right:-150,animationDelay:"-6s",zIndex:0}}/>
      <div className="setup-orb" style={{width:300,height:300,background:C.green,opacity:0.03,top:"40%",right:"20%",animationDelay:"-10s",zIndex:0}}/>

      {/* ── Full page wrapper — scrollable ── */}
      <div style={{width:"100%",maxWidth:600,position:"relative",zIndex:1,animation:"fadeIn 0.5s ease"}}>

        {/* ═══ SECTION 1: Logo + Auth ═══ */}
        <div style={{textAlign:"center",marginBottom:28}}>

          {/* Logo — gradient text, highly visible */}
          <div style={{display:"inline-flex",alignItems:"center",gap:8,marginBottom:12}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:C.accent,boxShadow:`0 0 10px ${C.accent}`,animation:"pulse 2s ease infinite",flexShrink:0}}/>
            <span style={{
              fontFamily:"var(--font-display)",fontWeight:900,fontSize:22,letterSpacing:"-0.5px",
              background:`linear-gradient(135deg, ${C.accent} 0%, #7B61FF 50%, ${C.pink} 100%)`,
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
              backgroundClip:"text",
            }}>CareerAiHub</span>
          </div>

          {/* Tagline */}
          <div style={{color:C.muted,fontSize:12,letterSpacing:"0.05em",marginBottom:20}}>Career Acceleration Operating System</div>

          {/* Auth buttons */}
          {!user ? (
            <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:10}}>
              <button onClick={()=>setAuthModal("register")} style={{background:`linear-gradient(135deg,${C.accent},#0096CC)`,color:"#000",border:"none",borderRadius:8,padding:"10px 22px",fontWeight:900,fontSize:13,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s",boxShadow:`0 0 20px ${C.accent}44`}}>
                ✨ Create Free Account
              </button>
              <button onClick={()=>setAuthModal("login")} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.text,borderRadius:8,padding:"10px 18px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>
                Sign In
              </button>
            </div>
          ) : (
            <div style={{display:"inline-flex",alignItems:"center",gap:8,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 14px",marginBottom:10}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},${C.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:"#000"}}>{user.avatar}</div>
              <span style={{color:C.green,fontSize:12,fontWeight:700}}>✓ Signed in as {user.name.split(" ")[0]}</span>
              <button onClick={logout} style={{background:"transparent",border:"none",color:C.muted,fontSize:11,cursor:"pointer",fontFamily:"inherit",marginLeft:4}}>Sign out</button>
            </div>
          )}
          {!user && <div style={{color:C.muted,fontSize:11}}>Or continue as guest — Job Search &amp; Market Intel are always free</div>}
        </div>

        {/* ═══ SECTION 2: The Form Card ═══ */}
        <div style={{background:C.card,border:`1px solid ${C.accent}44`,borderRadius:14,padding:28,boxShadow:`0 0 40px ${C.accent}0D`,marginBottom:28}}>
          <div style={{marginBottom:20}}>
            <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:16,color:C.text,marginBottom:4,letterSpacing:"-0.2px"}}>Build your personalized system</div>
            <div style={{fontSize:12,color:C.muted}}>Takes 30 seconds. Powers every AI feature.</div>
          </div>

          <div style={{marginBottom:14}}>
            <label className="setup-label">Target Role</label>
            <input className="setup-input" value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))} placeholder="e.g. Senior Product Manager, Software Engineer"/>
          </div>

          <div style={{marginBottom:14}}>
            <label className="setup-label">Industry</label>
            <input className="setup-input" value={form.industry} onChange={e=>setForm(p=>({...p,industry:e.target.value}))} placeholder="e.g. Fintech, SaaS, Healthcare"/>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:22}}>
            {[
              {label:"Level",   key:"level",   opts:["Student","Entry","Mid","Senior","Manager","Executive"]},
              {label:"Market",  key:"market",  opts:["Singapore","US","Europe","Remote","SEA","India","Middle East","Other"]},
              {label:"Urgency", key:"urgency", opts:["3 days","7 days","30 days","90 days"]},
            ].map(f=>(
              <div key={f.key}>
                <label className="setup-label">{f.label}</label>
                <select className="setup-select" value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}>
                  {f.opts.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>

          <button onClick={()=>{setSetupDone(true);setActiveModule("jobs");}} disabled={!form.role.trim()} style={{width:"100%",background:form.role.trim()?C.accent:"transparent",color:form.role.trim()?"#000":C.muted,border:form.role.trim()?"none":`1px solid ${C.border}`,borderRadius:8,padding:"12px 20px",fontWeight:900,fontSize:14,cursor:form.role.trim()?"pointer":"not-allowed",fontFamily:"inherit",transition:"all 0.15s",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:form.role.trim()?`0 0 28px ${C.accent}44`:"none",letterSpacing:"-0.2px"}}>
            {"⚡ Scan my resume to begin →"}
          </button>
        </div>

        {/* ═══ SECTION 3: High-value insight stats ═══ */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:32}}>
          {[
            {stat:"75%",  label:"of resumes rejected by ATS before a human reads them",  color:C.red},
            {stat:"$18K", label:"average salary left on the table without negotiation prep", color:C.gold},
            {stat:"5 mo", label:"average job search when going in blind with no system",   color:C.muted},
            {stat:"3.2×", label:"higher return rate when AI memory tracks your progress",  color:C.green},
          ].map((p,i)=>(
            <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 12px",textAlign:"center"}}>
              <div style={{fontFamily:"var(--font-display)",fontWeight:900,fontSize:24,color:p.color,lineHeight:1,marginBottom:6}}>{p.stat}</div>
              <div style={{color:C.muted,fontSize:10,lineHeight:1.45}}>{p.label}</div>
            </div>
          ))}
        </div>

        {/* ═══ SECTION 4: What's Free ═══ */}
        <div className="divider-line"/>
        <div className="section-label">What you get for free — no account needed</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:32}}>
          {[
            {title:"Job Search",desc:"Search 20+ boards — LinkedIn, Glassdoor, Indeed, Jobstreet and more in one place",color:C.green,tag:"Always Free"},
            {title:"Resume Scan",desc:"AI credibility score, ATS prediction, specific issues quoted from YOUR resume",color:C.accent,tag:"1 Free Scan"},
            {title:"Weakness Radar",desc:"7-dimension gap map showing exactly which skills are costing you interviews",color:C.red,tag:"1 Free View"},
            {title:"Market Intel",desc:"Hiring norms, salary context, and interview styles across 6 global regions",color:C.muted,tag:"Always Free"},
          ].map((f,i)=>(
            <div key={i} className="feat-card">
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:f.color,boxShadow:`0 0 6px ${f.color}88`,flexShrink:0}}/>
                  <div style={{color:C.text,fontWeight:700,fontSize:13}}>{f.title}</div>
                </div>
                <span style={{background:f.color+"22",color:f.color,border:`1px solid ${f.color}44`,borderRadius:20,padding:"2px 8px",fontSize:9,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>{f.tag}</span>
              </div>
              <div style={{color:C.muted,fontSize:11,lineHeight:1.55}}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* ═══ SECTION 5: Platform modules — account unlocks ═══ */}
        <div className="divider-line"/>
        <div className="section-label">Unlock with a free account — still no credit card</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:32}}>
          {[
            {title:"JD Analyzer",desc:"Match score + ATS keywords for any job posting",color:C.pink},
            {title:"STAR Builder",desc:"Refine interview stories, build a persistent bank",color:C.gold},
            {title:"Cover Letter",desc:"Personalised in 4 tones, includes follow-up email",color:C.orange},
            {title:"Readiness Score",desc:"Overall interview readiness % across 5 dimensions",color:C.accent},
            {title:"App Tracker",desc:"Track every application, status, and pipeline",color:C.green},
            {title:"AI Insights",desc:"Cross-module tips personalised to your activity",color:C.purple},
          ].map((m,i)=>(
            <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 12px",transition:"border-color 0.2s,transform 0.2s"}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:m.color,marginBottom:10,boxShadow:`0 0 6px ${m.color}88`}}/>
              <div style={{color:m.color,fontWeight:700,fontSize:12,marginBottom:3}}>{m.title}</div>
              <div style={{color:C.muted,fontSize:10,lineHeight:1.5}}>{m.desc}</div>
            </div>
          ))}
        </div>

        {/* ═══ SECTION 6: Pro teaser — full pricing in modal ═══ */}
        <div className="divider-line"/>
        <div style={{background:`linear-gradient(135deg,${C.accent}06,${C.purple}04)`,border:`1px solid ${C.accent}1A`,borderRadius:14,padding:"20px 24px",marginBottom:32,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
          <div>
            <div style={{color:C.text,fontWeight:800,fontSize:14,marginBottom:4,letterSpacing:"-0.2px"}}>Unlock the full platform</div>
            <div style={{color:C.muted,fontSize:12,lineHeight:1.6,maxWidth:340}}>HM Simulator, Salary Coach, AI Memory, Rejection Coach and more. One coaching session costs $200. Pro is everything, unlimited.</div>
          </div>
          <div style={{display:"flex",gap:8,flexShrink:0}}>
            <button onClick={()=>setShowPricing(true)} style={{background:"transparent",border:`1px solid ${C.accent}66`,color:C.accent,borderRadius:8,padding:"9px 18px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>
              View pricing →
            </button>
            <button onClick={()=>setAuthModal("register")} style={{background:`linear-gradient(135deg,${C.accent},#0096CC)`,color:"#000",border:"none",borderRadius:8,padding:"9px 18px",fontWeight:900,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
              Start free
            </button>
          </div>
        </div>

        {/* ═══ SECTION 7: How it works ═══ */}
        <div className="divider-line"/>
        <div className="section-label">How it works — 5 steps to your next offer</div>
        <div style={{display:"flex",flexDirection:"column",gap:0,marginBottom:32}}>
          {[
            {n:1,color:C.accent,  title:"Tell us about you",     desc:"Set your role, market, and level. Every module personalises instantly."},
            {n:2,color:C.green,   title:"Scan your resume",      desc:"AI reads it like a hiring manager. Get a credibility score in 20 seconds."},
            {n:3,color:C.gold,    title:"See your gaps",         desc:"Weakness Radar shows which skills are costing you interviews right now."},
            {n:4,color:C.purple,  title:"Prepare to win",        desc:"Mock interviews, STAR stories, and cover letters built from your data."},
            {n:5,color:C.pink,    title:"Negotiate and close",   desc:"Salary benchmarks, scripts, and live AI roleplay before the real call."},
          ].map((s,i)=>(
            <div key={i} style={{display:"flex",gap:14,alignItems:"flex-start",padding:"14px 0",borderBottom:i<4?`1px solid ${C.border}44`:"none"}}>
              <div className="step-num" style={{background:s.color+"22",color:s.color,border:`1px solid ${s.color}44`}}>{s.n}</div>
              <div style={{flex:1}}>
                <div style={{color:C.text,fontWeight:700,fontSize:13,marginBottom:2}}>{s.title}</div>
                <div style={{color:C.muted,fontSize:11,lineHeight:1.5}}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ SECTION 8: Company culture reviews ═══ */}
        <div className="divider-line"/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div className="section-label" style={{marginBottom:0}}>Company culture intel</div>
          <div style={{fontSize:10,color:C.muted}}>Powered by CareerAiHub community</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:32}}>
          {[
            {
              company:"Grab",
              role:"Product Manager",
              location:"Singapore",
              rating:4,
              tags:["Fast-paced","Strong eng culture","Equity upside"],
              interview:"3 rounds — case study + PM metrics deep-dive + leadership panel. Expect SQL proficiency questions even for PM roles.",
              culture:"High ownership, cross-functional pods. OKRs are taken seriously. Burnout risk at senior levels.",
              verdict:"Recommend",
              verdictColor:C.green,
            },
            {
              company:"Shopee",
              role:"Senior Data Analyst",
              location:"Singapore · Remote",
              rating:3,
              tags:["High volume","Data-driven","Long hours"],
              interview:"4 rounds — take-home case, SQL test, stakeholder round, bar-raiser. Turnaround 10 days.",
              culture:"Metrics obsessed. Good for early career growth. Work-life balance varies heavily by team.",
              verdict:"Neutral",
              verdictColor:C.gold,
            },
            {
              company:"Stripe",
              role:"Software Engineer",
              location:"US · Remote",
              rating:5,
              tags:["Top compensation","Rigorous bar","Strong docs culture"],
              interview:"5 rounds — Stripe-specific system design, distributed systems, and a writing exercise. Prepare for depth.",
              culture:"Writing-heavy async culture. Extremely high calibre peers. Comp is top 5% in market.",
              verdict:"Highly recommend",
              verdictColor:C.accent,
            },
          ].map((r,i)=>(
            <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 18px",transition:"border-color 0.2s"}}>
              {/* Header row */}
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                    <div style={{color:C.text,fontWeight:800,fontSize:14}}>{r.company}</div>
                    <div style={{color:C.muted,fontSize:11}}>· {r.role}</div>
                  </div>
                  <div style={{fontSize:10,color:C.muted}}>{r.location}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
                  <div style={{display:"flex",gap:2}}>
                    {[1,2,3,4,5].map(s=><div key={s} style={{width:8,height:8,borderRadius:2,background:s<=r.rating?C.gold:C.border}}/>)}
                  </div>
                  <span style={{background:`${r.verdictColor}15`,color:r.verdictColor,border:`1px solid ${r.verdictColor}33`,borderRadius:20,padding:"2px 9px",fontSize:9,fontWeight:700,letterSpacing:"0.05em"}}>{r.verdict}</span>
                </div>
              </div>
              {/* Tags */}
              <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap"}}>
                {r.tags.map((t,j)=>(
                  <span key={j} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:"2px 9px",fontSize:9,color:C.muted,fontWeight:600}}>{t}</span>
                ))}
              </div>
              {/* Interview process */}
              <div style={{marginBottom:7}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:C.accent,marginBottom:3}}>Interview process</div>
                <div style={{color:C.muted,fontSize:11,lineHeight:1.55}}>{r.interview}</div>
              </div>
              {/* Culture */}
              <div>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:C.purple,marginBottom:3}}>Work culture</div>
                <div style={{color:C.muted,fontSize:11,lineHeight:1.55}}>{r.culture}</div>
              </div>
            </div>
          ))}
          {/* Add review CTA */}
          <button onClick={()=>setAuthModal("register")} style={{background:"transparent",border:`1px dashed ${C.border}`,color:C.muted,borderRadius:12,padding:"14px",fontSize:12,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s",width:"100%",textAlign:"center"}}>
            + Share your interview experience → helps the community
          </button>
        </div>

        {/* ═══ SECTION 9: Final CTA repeat ═══ */}
        <div style={{textAlign:"center",padding:"24px 0 8px"}}>
          <div style={{color:C.muted,fontSize:12,marginBottom:14}}>Ready to build your career OS?</div>
          <button onClick={()=>{setSetupDone(true);setActiveModule("scan");}} disabled={!form.role.trim()} style={{background:form.role.trim()?C.accent:"transparent",color:form.role.trim()?"#000":C.muted,border:form.role.trim()?"none":`1px solid ${C.border}`,borderRadius:8,padding:"12px 32px",fontWeight:900,fontSize:14,cursor:form.role.trim()?"pointer":"not-allowed",fontFamily:"inherit",boxShadow:form.role.trim()?`0 0 28px ${C.accent}44`:"none",transition:"all 0.15s"}}>
            {"⚡ Start Free — No Card Needed"}
          </button>
          <div style={{color:C.muted,fontSize:10,marginTop:12,lineHeight:1.6}}>
            Fill in your role above · Free forever for core features · Pro from $19/month
          </div>
        </div>

      </div>
    </div>
  );


  const renderModule = (moduleId) => {
    const access = getAccess(moduleId);
    const mod = moduleMap[moduleId];

    if (access === "auth_gate") {
      return <AuthGate moduleName={mod.label} moduleIcon={mod.icon}
        onLogin={()=>setAuthModal("login")} onRegister={()=>setAuthModal("register")} />;
    }
    if (access === "preview_gate") {
      return <PreviewGate moduleName={mod.label} moduleIcon={mod.icon}
        onLogin={()=>setAuthModal("login")} onRegister={()=>setAuthModal("register")} />;
    }

    // Wrap PREVIEW modules to mark usage after first render
    const onFirstUse = () => {
      if (!user && ACCESS[moduleId] === "PREVIEW" && !previewUsed[moduleId]) markPreview(moduleId);
    };

    const sections = {
      jobs:     <JobSearch form={form} resumeText={resumeText} memory={memory} updateMemory={updateMemory} onProTrigger={(reason)=>setProModal(reason)}/>,
      scan:     <ResumeScan resumeText={resumeText} setResumeText={setResumeText} scanResult={scanResult} setScanResult={setScanResult} form={form} onFirstUse={onFirstUse} memory={memory} updateMemory={updateMemory}/>,
      jd:       <JDAnalyzer resumeText={resumeText} form={form} memory={memory} updateMemory={updateMemory}/>,
      star:     <STARBuilder resumeText={resumeText} form={form} memory={memory} updateMemory={updateMemory}/>,
      simulate: <HiringManagerSim resumeText={resumeText} scanResult={scanResult} form={form} memory={memory} updateMemory={updateMemory} onProTrigger={(reason)=>setProModal(reason)}/>,
      salary:   <SalaryCoach resumeText={resumeText} form={form} memory={memory} updateMemory={updateMemory} onProTrigger={(reason)=>setProModal(reason)}/>,
      cover:    <CoverLetterGen resumeText={resumeText} form={form} memory={memory} updateMemory={updateMemory}/>,
      radar:    <WeaknessRadar scanResult={scanResult} onFirstUse={onFirstUse} memory={memory}/>,
      score:    <ReadinessScore scanResult={scanResult} onFirstUse={onFirstUse} memory={memory}/>,
      market:   <MarketIntel form={form} memory={memory}/>,
      memory:   <MemoryDashboard memory={memory} form={form} updateMemory={updateMemory}/>,
    };
    return sections[moduleId] || null;
  };

  // ── Module nav — show lock icons for gated modules ──────────────────────────
  const ModuleNavWithLocks = () => (
    <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:6,scrollbarWidth:"none",WebkitOverflowScrolling:"touch"}}>
      {MODULES.map(m=>{
        const access = getAccess(m.id);
        const locked = access !== "allowed";
        const preview = !user && ACCESS[m.id]==="PREVIEW";
        const isActive = activeModule===m.id;
        return (
          <button key={m.id} onClick={()=>setActiveModule(m.id)}
            className={`mod-tab${isActive?" active":""}`}
            style={{
              background: isActive ? m.color+"1A" : "transparent",
              borderColor: isActive ? m.color : C.border,
              color: isActive ? m.color : locked ? C.muted+"88" : C.muted,
              opacity: locked && !preview ? 0.65 : 1,
            }}>
            {isActive && <span style={{position:"absolute",bottom:-3,left:6,right:6,height:2,background:m.color,borderRadius:2}}/>}
            <span style={{fontSize:13}}>{m.icon}</span>
            <span>{m.label}</span>
            {locked && !preview && <span style={{fontSize:8,opacity:0.7}}>🔒</span>}
            {preview && <span style={{background:C.gold+"33",color:C.gold,fontSize:8,fontWeight:800,padding:"1px 5px",borderRadius:10,marginLeft:1}}>FREE</span>}
          </button>
        );
      })}
    </div>
  );

  return(
    <div data-theme={darkMode?"dark":"light"} style={{minHeight:"100vh",background:darkMode?C.bg:"#F8FAFC",fontFamily:"var(--font-body)",color:darkMode?C.text:"#0F172A"}}>
      <style>{css}</style>

      {/* Auth Modal overlay */}
      {authModal && <AuthModal initialMode={authModal} onSuccess={login} onClose={()=>setAuthModal(null)}/>}
      {proModal && <ProUpgradeModal reason={proModal} onClose={()=>setProModal(null)} onSignup={()=>{setProModal(null);setAuthModal("register");}}/>}

      {/* Header */}
      <div style={{borderBottom:`1px solid ${C.border}`,background:darkMode?C.surface:"#FFFFFF",padding:"0 24px",position:"sticky",top:0,zIndex:100,backdropFilter:"blur(12px)"}}>
        <div style={{maxWidth:960,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",minHeight:56,padding:"8px 0",flexWrap:"wrap",gap:12}}>
            {/* Logo */}
            <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",flexShrink:0}} onClick={()=>setSetupDone(false)}>
              <div style={{width:8,height:8,borderRadius:"50%",background:C.accent,boxShadow:`0 0 8px ${C.accent}`,animation:"pulse 2s ease infinite",flexShrink:0}}/>
              <span style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:16,letterSpacing:"-0.3px",color:darkMode?C.text:"#0F172A"}}>CareerAiHub</span>
            </div>

            {/* Right side — badges + auth */}
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",justifyContent:"flex-end",flex:1}}>
              <div style={{display:"flex",gap:4}} className="hide-on-mobile">
                <Badge label={form.role} color={C.accent}/>
                <Badge label={form.market} color={C.gold}/>
              </div>
              {resumeText&&<Badge label="Resume ✓" color={C.green}/>}
              {scanResult&&!scanResult.error&&<Badge label={`Score: ${scanResult.credibilityScore}`} color={C.purple}/>}
              <button onClick={()=>setSetupDone(false)} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,padding:"4px 10px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Edit</button>
              {/* Theme toggle */}
              <button onClick={()=>setDarkMode(d=>!d)} title="Toggle light/dark mode" style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,padding:"4px 8px",fontSize:13,cursor:"pointer",fontFamily:"inherit",lineHeight:1}} aria-label="Toggle theme">
                {darkMode?"☀️":"🌙"}
              </button>
              {/* Command palette trigger */}
              <button onClick={()=>setCmdOpen(true)} title="Command palette (⌘K)" style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,padding:"4px 10px",fontSize:11,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}>
                <span>⌘K</span>
              </button>

              {/* Auth section */}
              {user ? (
                <UserMenu user={user} onLogout={logout}/>
              ) : (
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>setAuthModal("login")} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.text,borderRadius:6,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                    Sign In
                  </button>
                  <button onClick={()=>setAuthModal("register")} style={{background:`linear-gradient(135deg,${C.accent},#0096CC)`,color:"#000",border:"none",borderRadius:6,padding:"5px 12px",fontSize:11,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>
                    ✨ Sign Up Free
                  </button>
                </div>
              )}
            </div>
          </div>
          <div style={{paddingBottom:12}}><ModuleNavWithLocks/></div>
        </div>
      </div>

      {/* Ticker */}
      <div style={{background:C.accentGlow,borderBottom:`1px solid ${C.accent}22`,padding:"6px 0"}}>
        {(()=>{
          const tickerStatus = user
            ? "SIGNED IN AS " + user.name.toUpperCase() + " · FULL ACCESS"
            : resumeText
              ? "RESUME LOADED · SIGN IN FOR FULL PERSONALIZATION"
              : "JOB SEARCH & MARKET INTEL FREE · SIGN UP TO UNLOCK AI FEATURES";
          return <Ticker text={"CAREER OS — " + form.role.toUpperCase() + " — " + form.market.toUpperCase() + " — " + tickerStatus + " — 10 MODULES ACTIVE"}/>;
        })()}
      </div>

      {/* Main content */}
      <div style={{maxWidth:960,margin:"0 auto",padding:24}}>
        {memory && user && <InsightBanner memory={memory} form={form}/>}
        <div key={activeModule} style={{animation:"moduleEnter 0.22s ease"}}>
          {renderModule(activeModule)}
        </div>
        {/* Keyboard shortcut hint */}
        <div style={{marginTop:48,paddingTop:16,borderTop:`1px solid ${C.border}44`,display:"flex",alignItems:"center",justifyContent:"center",gap:16,flexWrap:"wrap"}}>
          {[["⌘K","Open command palette"],["1–9","Switch modules"],["↑↓","Navigate results"]].map(([k,l])=>(
            <div key={k} style={{display:"flex",alignItems:"center",gap:6}}>
              <kbd>{k}</kbd>
              <span style={{fontSize:11,color:C.muted}}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default App;

function LandingSections({ setAuthModal, setShowPricing, setSetupDone, setActiveModule, form, C }) {
  return (
    <>
        {/* ═══ SECTION 3: High-value insight stats ═══ */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:32}} className="grid-3">
          {[
            {stat:"75%",  label:"of resumes rejected by ATS before a human reads them",  color:C.red},
            {stat:"$18K", label:"average salary left on the table without negotiation prep", color:C.gold},
            {stat:"5 mo", label:"average job search when going in blind with no system",   color:C.muted},
            {stat:"3.2×", label:"higher return rate when AI memory tracks your progress",  color:C.green},
          ].map((p,i)=>(
            <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 12px",textAlign:"center"}}>
              <div style={{fontFamily:"var(--font-display)",fontWeight:900,fontSize:24,color:p.color,lineHeight:1,marginBottom:6}}>{p.stat}</div>
              <div style={{color:C.muted,fontSize:10,lineHeight:1.45}}>{p.label}</div>
            </div>
          ))}
        </div>

        {/* ═══ SECTION 4: What's Free ═══ */}
        <div className="divider-line"/>
        <div className="section-label">What you get for free — no account needed</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:32}} className="grid-2">
          {[
            {title:"Job Search",desc:"Search 20+ boards — LinkedIn, Glassdoor, Indeed, Jobstreet and more in one place",color:C.green,tag:"Always Free"},
            {title:"Resume Scan",desc:"AI credibility score, ATS prediction, specific issues quoted from YOUR resume",color:C.accent,tag:"1 Free Scan"},
            {title:"Weakness Radar",desc:"7-dimension gap map showing exactly which skills are costing you interviews right now",color:C.red,tag:"1 Free View"},
            {title:"Market Intel",desc:"Hiring norms, salary context, and interview styles across 6 global regions",color:C.muted,tag:"Always Free"},
          ].map((f,i)=>(
            <div key={i} className="feat-card">
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:f.color,boxShadow:`0 0 6px ${f.color}88`,flexShrink:0}}/>
                  <div style={{color:C.text,fontWeight:700,fontSize:13}}>{f.title}</div>
                </div>
                <span style={{background:f.color+"22",color:f.color,border:`1px solid ${f.color}44`,borderRadius:20,padding:"2px 8px",fontSize:9,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>{f.tag}</span>
              </div>
              <div style={{color:C.muted,fontSize:11,lineHeight:1.55}}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* ═══ SECTION 5: Platform modules — account unlocks ═══ */}
        <div className="divider-line"/>
        <div className="section-label">Unlock with a free account — still no credit card</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:32}} className="grid-3">
          {[
            {title:"JD Analyzer",desc:"Match score + ATS keywords for any job posting",color:C.pink},
            {title:"STAR Builder",desc:"Refine interview stories, build a persistent bank",color:C.gold},
            {title:"Pay Coach",desc:"Personalised negotiation scripts in 4 tones",color:C.orange},
            {title:"Readiness",desc:"Overall interview readiness % across 5 dimensions",color:C.accent},
            {title:"App Tracker",desc:"Track every application, status, and pipeline",color:C.green},
            {title:"AI Insights",desc:"Cross-module tips personalised to your activity",color:C.purple},
          ].map((m,i)=>(
            <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 12px",transition:"border-color 0.2s,transform 0.2s"}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:m.color,marginBottom:10,boxShadow:`0 0 6px ${m.color}88`}}/>
              <div style={{color:m.color,fontWeight:700,fontSize:12,marginBottom:3}}>{m.title}</div>
              <div style={{color:C.muted,fontSize:10,lineHeight:1.5}}>{m.desc}</div>
            </div>
          ))}
        </div>

        {/* ═══ SECTION 6: Pro teaser — full pricing in modal ═══ */}
        <div className="divider-line"/>
        <div style={{background:`linear-gradient(135deg,${C.accent}06,${C.purple}04)`,border:`1px solid ${C.accent}1A`,borderRadius:14,padding:"20px 24px",marginBottom:32,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
          <div>
            <div style={{color:C.text,fontWeight:800,fontSize:14,marginBottom:4,letterSpacing:"-0.2px"}}>Unlock the full platform</div>
            <div style={{color:C.muted,fontSize:12,lineHeight:1.6,maxWidth:340}}>HM Simulator, Salary Coach, AI Memory, Rejection Coach and more. One coaching session costs $200. Pro is everything, unlimited.</div>
          </div>
          <div style={{display:"flex",gap:8,flexShrink:0}}>
            <button onClick={()=>setShowPricing(true)} style={{background:"transparent",border:`1px solid ${C.accent}66`,color:C.accent,borderRadius:8,padding:"9px 18px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>
              View pricing →
            </button>
            <button onClick={()=>setAuthModal("register")} style={{background:`linear-gradient(135deg,${C.accent},#0096CC)`,color:"#000",border:"none",borderRadius:8,padding:"9px 18px",fontWeight:900,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
              Start free
            </button>
          </div>
        </div>

        {/* ═══ SECTION 7: How it works ═══ */}
        <div className="divider-line"/>
        <div className="section-label">How it works — 5 steps to your next offer</div>
        <div style={{display:"flex",flexDirection:"column",gap:0,marginBottom:32}}>
          {[
            {n:1,color:C.accent,  title:"Tell us about you",     desc:"Set your role, market, and level. Every module personalises instantly."},
            {n:2,color:C.green,   title:"Scan your resume",      desc:"AI reads it like a hiring manager. Get a credibility score in 20 seconds."},
            {n:3,color:C.gold,    title:"See your gaps",         desc:"Weakness Radar shows which skills are costing you interviews right now."},
            {n:4,color:C.purple,  title:"Prepare to win",        desc:"Mock interviews, STAR stories, and cover letters built from your data."},
            {n:5,color:C.pink,    title:"Negotiate and close",   desc:"Salary benchmarks, scripts, and live AI roleplay before the real call."},
          ].map((s,i)=>(
            <div key={i} style={{display:"flex",gap:14,alignItems:"flex-start",padding:"14px 0",borderBottom:i<4?`1px solid ${C.border}44`:"none"}}>
              <div className="step-num" style={{background:s.color+"22",color:s.color,border:`1px solid ${s.color}44`}}>{s.n}</div>
              <div style={{flex:1}}>
                <div style={{color:C.text,fontWeight:700,fontSize:13,marginBottom:2}}>{s.title}</div>
                <div style={{color:C.muted,fontSize:11,lineHeight:1.5}}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ SECTION 8: Company culture reviews ═══ */}
        <div className="divider-line"/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div className="section-label" style={{marginBottom:0}}>Company culture intel</div>
          <div style={{fontSize:10,color:C.muted}}>Powered by CareerAiHub community</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:32}}>
          {[
            {
              company:"Grab",
              role:"Product Manager",
              location:"Singapore",
              rating:4,
              tags:["Fast-paced","Strong eng culture","Equity upside"],
              interview:"3 rounds — case study + PM metrics deep-dive + leadership panel. Expect SQL proficiency questions even for PM roles.",
              culture:"High ownership, cross-functional pods. OKRs are taken seriously. Burnout risk at senior levels.",
              verdict:"Recommend",
              verdictColor:C.green,
            },
            {
              company:"Shopee",
              role:"Senior Data Analyst",
              location:"Singapore · Remote",
              rating:3,
              tags:["High volume","Data-driven","Long hours"],
              interview:"4 rounds — take-home case, SQL test, stakeholder round, bar-raiser. Turnaround 10 days.",
              culture:"Metrics obsessed. Good for early career growth. Work-life balance varies heavily by team.",
              verdict:"Neutral",
              verdictColor:C.gold,
            },
            {
              company:"Stripe",
              role:"Software Engineer",
              location:"US · Remote",
              rating:5,
              tags:["Top compensation","Rigorous bar","Strong docs culture"],
              interview:"5 rounds — Stripe-specific system design, distributed systems, and a writing exercise. Prepare for depth.",
              culture:"Writing-heavy async culture. Extremely high calibre peers. Comp is top 5% in market.",
              verdict:"Highly recommend",
              verdictColor:C.accent,
            },
          ].map((r,i)=>(
            <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 18px",transition:"border-color 0.2s"}}>
              {/* Header row */}
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                    <div style={{color:C.text,fontWeight:800,fontSize:14}}>{r.company}</div>
                    <div style={{color:C.muted,fontSize:11}}>· {r.role}</div>
                  </div>
                  <div style={{fontSize:10,color:C.muted}}>{r.location}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
                  <div style={{display:"flex",gap:2}}>
                    {[1,2,3,4,5].map(s=><div key={s} style={{width:8,height:8,borderRadius:2,background:s<=r.rating?C.gold:C.border}}/>)}
                  </div>
                  <span style={{background:`${r.verdictColor}15`,color:r.verdictColor,border:`1px solid ${r.verdictColor}33`,borderRadius:20,padding:"2px 9px",fontSize:9,fontWeight:700,letterSpacing:"0.05em"}}>{r.verdict}</span>
                </div>
              </div>
              {/* Tags */}
              <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap"}}>
                {r.tags.map((t,j)=>(
                  <span key={j} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:"2px 9px",fontSize:9,color:C.muted,fontWeight:600}}>{t}</span>
                ))}
              </div>
              {/* Interview process */}
              <div style={{marginBottom:7}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:C.accent,marginBottom:3}}>Interview process</div>
                <div style={{color:C.muted,fontSize:11,lineHeight:1.55}}>{r.interview}</div>
              </div>
              {/* Culture */}
              <div>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:C.purple,marginBottom:3}}>Work culture</div>
                <div style={{color:C.muted,fontSize:11,lineHeight:1.55}}>{r.culture}</div>
              </div>
            </div>
          ))}
          {/* Add review CTA */}
          <button onClick={()=>setAuthModal("register")} style={{background:"transparent",border:`1px dashed ${C.border}`,color:C.muted,borderRadius:12,padding:"14px",fontSize:12,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s",width:"100%",textAlign:"center"}}>
            + Share your interview experience → helps the community
          </button>
        </div>

        {/* ═══ SECTION 9: Final CTA repeat ═══ */}
        <div style={{textAlign:"center",padding:"24px 0 8px"}}>
          <div style={{color:C.muted,fontSize:12,marginBottom:14}}>Ready to build your career OS?</div>
          <button onClick={()=>{setSetupDone(true);setActiveModule("jobs");}} disabled={!form.role.trim()} style={{background:form.role.trim()?C.accent:"transparent",color:form.role.trim()?"#000":C.muted,border:form.role.trim()?"none":`1px solid ${C.border}`,borderRadius:8,padding:"12px 32px",fontWeight:900,fontSize:14,cursor:form.role.trim()?"pointer":"not-allowed",fontFamily:"inherit",boxShadow:form.role.trim()?`0 0 28px ${C.accent}44`:"none",transition:"all 0.15s"}}>
            {"⚡ Start Free — No Card Needed"}
          </button>
          <div style={{color:C.muted,fontSize:10,marginTop:12,lineHeight:1.6}}>
            Fill in your role above · Free forever for core features · Pro from $19/month
          </div>
        </div>
    </>
  );
}
