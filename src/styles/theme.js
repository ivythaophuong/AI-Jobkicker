// ── UI Design Tokens ───────────────────────────────────────────────────────
export const C = {
  bg: "#080C14",
  surface: "#111827",
  card: "#1F2937",
  border: "#374151",
  text: "#F3F4F6",
  muted: "#9CA3AF",
  accent: "#4F8EF7",
  accentGlow: "rgba(79,158,247,0.15)",
  gold: "#FFC107",
  red: "#EF4444",
  green: "#10B981",
  purple: "#8B5CF6",
  pink: "#EC4899",
  orange: "#F97316",
};

export const MODULES = [
  { id: "scan",     label: "Resume Scan",    icon: "📄", color: C.pink,   locked: false },
  { id: "radar",    label: "Weakness Radar", icon: "📡", color: C.red,    locked: false },
  { id: "score",    label: "Readiness",     icon: "🎯", color: C.accent, locked: false },
  { id: "jobs",     label: "Job Search",     icon: "🔍", color: C.green,  locked: false },
  { id: "jd",       label: "JD Analyzer",    icon: "🧠", color: C.pink,   locked: true },
  { id: "star",     label: "STAR Builder",   icon: "⭐", color: C.gold,   locked: true },
  { id: "simulate", label: "HM Simulator",   icon: "🚀", color: C.accent, locked: true },
  { id: "salary",   label: "Salary Coach",   icon: "🤝", color: C.purple, locked: true },
  { id: "cover",    label: "Cover Letter",   icon: "✉️", color: C.orange, locked: true },
  { id: "market",   label: "Market Intel",   icon: "🌐", color: C.muted,  locked: false },
  { id: "memory",   label: "Memory Hub",     icon: "🧠", color: C.accent, locked: false },
];
