import React, { useState, useEffect, useRef } from 'react';
import { sb } from '../lib/supabase';
import { C, MODULES } from '../styles/theme';
import { Badge, Btn, Card, Spinner } from './CommonUI';

// ── Animated Score Counter ─────────────────────────────────────────────────────
export function AnimatedScore({ value, color, size = "large", suffix = "/100", prefix = "" }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const target = Number(value) || 0;
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
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
    <div style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
      {prefix && <span style={{ fontSize: unitSize, color, fontWeight: 700, opacity: 0.7 }}>{prefix}</span>}
      <span style={{ fontSize, color, fontWeight: 900, fontFamily: "var(--font-display)", textShadow: `0 0 40px ${color}44`, letterSpacing: "-2px" }}>
        {display}
      </span>
      {suffix && <span style={{ fontSize: unitSize, color, fontWeight: 600, opacity: 0.6 }}>{suffix}</span>}
    </div>
  );
}

// ── GlowBar (Radar component) ──────────────────────────────────────────────────
export function GlowBar({ score, color, delay = 0, height = 8, showLabel = true }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(score), 100 + delay);
    return () => clearTimeout(t);
  }, [score, delay]);
  return (
    <div style={{ position: "relative" }}>
      <div style={{ background: "#0A1020", borderRadius: 4, height, overflow: "hidden" }}>
        <div style={{ width: `${w}%`, height: "100%", background: `linear-gradient(90deg,${color}88,${color})`, borderRadius: 4, transition: `width 1.1s cubic-bezier(0.16,1,0.3,1) ${delay}ms`, boxShadow: `0 0 10px ${color}44` }} />
      </div>
      {showLabel && <div style={{ position: "absolute", right: 0, top: -18, fontFamily: "var(--font-mono)", fontSize: 10, color, fontWeight: 700 }}>{w}%</div>}
    </div>
  );
}

// ── Command Palette (⌘K) ─────────────────────────────────────────────────────
export function CommandPalette({ modules, setActiveModule, setAuthModal, user, onClose }) {
  const [q, setQ] = useState("");
  const inputRef = useRef(null);
  const commands = [
    ...modules.map(m => ({ type: "module", icon: m.icon, label: m.label, id: m.id, desc: `Open ${m.label}` })),
    { type: "action", icon: "✨", label: "Sign Up Free", id: "signup", desc: "Create your free account" },
    { type: "action", icon: "🔑", label: "Sign In", id: "signin", desc: "Sign in to your account" },
  ].filter(c => {
    if (c.id === "signup" || c.id === "signin") return !user;
    return true;
  });
  const filtered = q.trim() ? commands.filter(c => c.label.toLowerCase().includes(q.toLowerCase())) : commands;
  const [sel, setSel] = useState(0);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const run = (cmd) => {
    if (cmd.type === "module") setActiveModule(cmd.id);
    else if (cmd.id === "signup") setAuthModal("register");
    else if (cmd.id === "signin") setAuthModal("login");
    onClose();
  };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(9,12,18,0.92)", zIndex: 9000, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 120, backdropFilter: "blur(12px)", animation: "fadeIn 0.15s ease" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 560, background: "#0F1520", border: "1px solid #1E2D45", borderRadius: 16, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid #1E2D45" }}>
          <span style={{ color: "#6B7E9F", fontSize: 16 }}>⌘</span>
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Search modules, actions..." style={{ flex: 1, background: "transparent", border: "none", color: "#E8F0FE", fontSize: 15, fontFamily: "var(--font-mono)", outline: "none" }} />
        </div>
        <div style={{ maxHeight: 380, overflowY: "auto", padding: "8px" }}>
          {filtered.map((cmd, i) => (
            <div key={cmd.id} onClick={() => run(cmd)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", borderRadius: 8, cursor: "pointer", background: i === sel ? "#131B2A" : "transparent" }} onMouseEnter={() => setSel(i)}>
              <span style={{ fontSize: 18 }}>{cmd.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#E8F0FE", fontSize: 13, fontWeight: 600 }}>{cmd.label}</div>
                <div style={{ color: "#6B7E9F", fontSize: 11 }}>{cmd.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Auth Modal (Standardized Original UI) ────────────────────────────────────
export function AuthModal({ initialMode, onSuccess, onClose, onViewLegal }) {
  const [mode, setMode] = useState(initialMode || "login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [accountType, setAccountType] = useState("candidate");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr(""); setLoading(true);
    try {
      if (mode === "register") {
        const { data, error } = await sb.signUp(email, pass, name, { role: accountType, company: accountType === 'recruiter' ? company : null });
        if (error) throw error;
        if (!data?.user) throw new Error("Registration started. Please check your email for confirmation.");
        onSuccess(data.session || { user: data.user });
      } else {
        const { data, error } = await sb.signIn(email, pass);
        if (error) throw error;
        if (!data?.user) throw new Error("Could not retrieve user data.");
        // Ensure onSuccess gets the session which contains the user
        onSuccess(data.session || { user: data.user, access_token: data.access_token });
      }
    } catch (err) { setErr(err.message); } finally { setLoading(false); }
  };

  const modeConfig = {
    login: { 
      title: "Welcome Back", 
      sub: "Sign in to access your AI memory", 
      btn: "Sign In", 
      toggle: "Don't have an account? Sign up", 
      mode: "register" 
    },
    register: { 
      title: "Start Your Journey", 
      sub: "Create your career operating system", 
      btn: "Create Account", 
      toggle: "Already have an account? Sign in", 
      mode: "login" 
    }
  };

  const config = modeConfig[mode];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)", animation: "fadeIn 0.2s ease-out" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "40px 32px", width: "100%", maxWidth: 400, boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 40px ${C.accent}15`, position: "relative" }}>
        
        {/* Close Button */}
        <button onClick={onClose} style={{ position: "absolute", right: 20, top: 20, background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 20 }}>×</button>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: C.text, marginBottom: 4, fontFamily: "var(--font-display)", letterSpacing: "-0.5px" }}>{config.title}</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{config.sub}</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "register" && (
            <>
              {/* Account type toggle */}
              <div style={{ display: "flex", gap: 8, background: C.surface, borderRadius: 10, padding: 4, border: `1px solid ${C.border}` }}>
                {[["candidate", "🎯 Job Seeker"], ["recruiter", "🏢 Employer"]].map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setAccountType(val)}
                    style={{ flex: 1, padding: "8px 12px", borderRadius: 7, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all .18s",
                      background: accountType === val ? (val === "recruiter" ? "linear-gradient(135deg,#B026FF,#FF46E5)" : C.accent) : "transparent",
                      color: accountType === val ? "#fff" : C.muted }}>
                    {label}
                  </button>
                ))}
              </div>

              <div>
                <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, fontWeight: 700 }}>Full Name</div>
                <input
                  placeholder="Your full name"
                  value={name} onChange={e => { setName(e.target.value); setErr(""); }} required
                  style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, padding: "12px 14px", fontSize: 14, outline: "none", transition: "border-color 0.2s" }}
                />
              </div>

              {accountType === "recruiter" && (
                <div>
                  <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, fontWeight: 700 }}>Company Name</div>
                  <input
                    placeholder="e.g. Acme Corp"
                    value={company} onChange={e => { setCompany(e.target.value); setErr(""); }} required
                    style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, padding: "12px 14px", fontSize: 14, outline: "none", transition: "border-color 0.2s" }}
                  />
                </div>
              )}
            </>
          )}
          
          <div>
            <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, fontWeight: 700 }}>Email Address</div>
            <input 
              type="email" placeholder="you@email.com" 
              value={email} onChange={e => { setEmail(e.target.value); setErr(""); }} required 
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, padding: "12px 14px", fontSize: 14, outline: "none", transition: "border-color 0.2s" }} 
            />
          </div>

          <div>
            <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, fontWeight: 700 }}>Password</div>
            <div style={{ position: "relative" }}>
              <input 
                type={showPass ? "text" : "password"} placeholder="••••••••" 
                value={pass} onChange={e => { setPass(e.target.value); setErr(""); }} required 
                style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, padding: "12px 14px", paddingRight: 40, fontSize: 14, outline: "none", transition: "border-color 0.2s" }} 
              />
              <button 
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 14 }}
              >
                {showPass ? "🙈" : "👁"}
              </button>
            </div>
          </div>
          
          {err && <div style={{ color: C.red, fontSize: 12, textAlign: "center", background: C.red + "15", padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.red}33` }}>⚠️ {err}</div>}
          
          <button type="submit" disabled={loading} style={{ width: "100%", background: loading ? C.border : `linear-gradient(135deg,${C.accent},#0096CC)`, color: "#000", border: "none", borderRadius: 10, padding: "14px", fontWeight: 900, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", marginTop: 8, transition: "all 0.2s" }}>
            {loading ? "Connecting..." : config.btn + " →"}
          </button>

          {mode === "register" && (
            <div style={{ fontSize: 11, color: C.muted, textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>
              By creating an account, you agree to our <br/>
              <span onClick={() => onViewLegal("terms")} style={{ color: C.accent, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>Terms of Service</span> and <span onClick={() => onViewLegal("privacy")} style={{ color: C.accent, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>Privacy Policy</span>.
            </div>
          )}
        </form>

        <div style={{ textAlign: "center", marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "login" && (
            <button onClick={() => setErr("Reset link sent! (Simulated)")} style={{ background: "transparent", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
              Forgot your password?
            </button>
          )}
          <button onClick={() => { setMode(config.mode); setErr(""); }} style={{ background: "transparent", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
            {config.toggle.split("?")[0]}? <span style={{ color: C.accent, fontWeight: 700 }}>{config.toggle.split("?")[1]} →</span>
          </button>
        </div>

      </div>
    </div>
  );
}
