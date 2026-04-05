import React, { useState, useEffect, useRef } from 'react';
import mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';

// ── Shared Libraries & Styles ────────────────────────────────────────────────
import { sb } from './lib/supabase';
import { C, MODULES } from './styles/theme';
import { Card, Badge, Btn, Spinner } from './components/CommonUI';

// ── Custom Hooks ─────────────────────────────────────────────────────────────
import { useMemory } from './hooks/useMemory';

// ── Feature Modules ──────────────────────────────────────────────────────────
import ResumeScan from './features/ResumeScan/ResumeScan';
import WeaknessRadar from './features/WeaknessRadar/WeaknessRadar';
import ReadinessScore from './features/ReadinessScore/ReadinessScore';
import JDAnalyzer from './features/JDAnalyzer/JDAnalyzer';
import STARBuilder from './features/STARBuilder/STARBuilder';
import HiringManagerSim from './features/HiringManagerSim/HiringManagerSim';
import SalaryCoach from './features/SalaryCoach/SalaryCoach';
import CoverLetterGen from './features/CoverLetterGen/CoverLetterGen';
import MarketIntel from './features/MarketIntel/MarketIntel';
import JobSearch from './features/JobSearch/JobSearch';
import MemoryDashboard from './features/MemoryDashboard/MemoryDashboard';

// pdf.js worker setup
if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

// ── Helper Utilities ────────────────────────────────────────────────────────
function getSession() {
  const raw = localStorage.getItem("supabase.auth.token");
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    const session = data.currentSession;
    if (!session) return null;
    return { id: session.user.id, email: session.user.email, name: session.user.user_metadata?.full_name || "User", token: session.access_token, refresh_token: session.refresh_token };
  } catch { return null; }
}

function saveSessionLocal(session) {
  localStorage.setItem("supabase.auth.token", JSON.stringify({ currentSession: { user: { id: session.id, email: session.email, user_metadata: { full_name: session.name } }, access_token: session.token, refresh_token: session.refresh_token } }));
}

function clearSessionLocal() {
  localStorage.removeItem("supabase.auth.token");
}

function showToast(msg, type = "info") {
  console.log(`[Toast ${type}] ${msg}`);
  // In production, would use a toast library
}

// ── Main App Shell ───────────────────────────────────────────────────────────
function App() {
  // Global Navigation & Logic
  const [setupDone, setSetupDone] = useState(true);
  const [form, setForm] = useState({ role: "", industry: "", level: "", market: "", urgency: "7 days" });
  const [resumeText, setResumeText] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [activeModule, setActiveModule] = useState("scan");

  // Auth State
  const [user, setUser] = useState(() => getSession());
  const [authModal, setAuthModal] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [restoreError, setRestoreError] = useState(false);
  const [proModal, setProModal] = useState(null);
  const [darkMode, setDarkMode] = useState(true);

  // ── REFACTORED MEMORY HOOK ────────────────────────────────────────────────
  const { memory, updateMemory, isSyncing } = useMemory(user, isRestoring, setIsRestoring, setRestoreError);

  // ── Global Handlers ───────────────────────────────────────────────────────
  const login = (session) => {
    saveSessionLocal(session);
    setUser(session);
    setIsRestoring(true); // Trigger composite fetch
    setAuthModal(null);
  };

  const logout = () => {
    if (user) sb.signOut(user.token);
    clearSessionLocal();
    setUser(null);
    setMemory(null);
    window.location.reload();
  };

  // ── Module Selection Logic ────────────────────────────────────────────────
  const renderActiveModule = () => {
    switch (activeModule) {
      case "scan":     return <ResumeScan resumeText={resumeText} setResumeText={setResumeText} scanResult={scanResult} setScanResult={setScanResult} form={form} memory={memory} updateMemory={updateMemory} />;
      case "radar":    return <WeaknessRadar scanResult={scanResult} memory={memory} />;
      case "score":    return <ReadinessScore scanResult={scanResult} memory={memory} />;
      case "jd":       return <JDAnalyzer resumeText={resumeText} form={form} memory={memory} updateMemory={updateMemory} />;
      case "star":     return <STARBuilder resumeText={resumeText} form={form} memory={memory} updateMemory={updateMemory} />;
      case "simulate": return <HiringManagerSim resumeText={resumeText} scanResult={scanResult} form={form} memory={memory} updateMemory={updateMemory} onProTrigger={setProModal} />;
      case "salary":   return <SalaryCoach resumeText={resumeText} form={form} memory={memory} updateMemory={updateMemory} onProTrigger={setProModal} />;
      case "cover":    return <CoverLetterGen resumeText={resumeText} form={form} memory={memory} updateMemory={updateMemory} />;
      case "market":   return <MarketIntel form={form} memory={memory} />;
      case "jobs":     return <JobSearch resumeText={resumeText} form={form} memory={memory} updateMemory={updateMemory} onProTrigger={setProModal} />;
      case "memory":   return <MemoryDashboard memory={memory} form={form} updateMemory={updateMemory} />;
      default:         return <ResumeScan resumeText={resumeText} setResumeText={setResumeText} scanResult={scanResult} setScanResult={setScanResult} form={form} memory={memory} updateMemory={updateMemory} />;
    }
  };

  // ── Final Main Shell Interface ───────────────────────────────────────────
  return (
    <div data-theme={darkMode ? "dark" : "light"} style={{ minHeight: "100vh", background: darkMode ? C.bg : "#F8FAFC", color: darkMode ? C.text : "#0F172A", fontFamily: "var(--font-body)" }}>
      {/* Header */}
      <header style={{ borderBottom: `1px solid ${C.border}`, background: C.surface, padding: "12px 24px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: C.text }}>CareerAiHub <span style={{ color: C.accent, fontSize: 10 }}>PRO</span></div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isSyncing && <Badge label="Saving..." color={C.accent} />}
            {user ? (
               <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                 <span style={{ fontSize: 12, color: C.muted }}>{user.name}</span>
                 <Btn onClick={logout} color={C.border} style={{ padding: "4px 10px", fontSize: 10 }}>Sign Out</Btn>
               </div>
            ) : (
               <Btn onClick={() => setAuthModal("login")} color={C.accent} dark style={{ padding: "6px 14px", fontSize: 11 }}>Sign In</Btn>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 16, marginBottom: 24 }}>
          {MODULES.map(m => (
             <button 
               key={m.id} 
               onClick={() => setActiveModule(m.id)}
               style={{ 
                 background: activeModule === m.id ? `${m.color}22` : "transparent",
                 border: `1px solid ${activeModule === m.id ? m.color : C.border}`,
                 color: activeModule === m.id ? m.color : C.muted,
                 borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap"
               }}
             >
               {m.icon} {m.label}
             </button>
          ))}
        </div>

        {/* Feature Component */}
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          {renderActiveModule()}
        </div>
      </main>
    </div>
  );
}

export default App;
