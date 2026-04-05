import React from 'react';
import { C } from '../styles/theme';

export const Card = ({ children, glow, style, animate, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      background: C.surface,
      border: `1px solid ${glow || C.border}`,
      borderRadius: 12,
      padding: 16,
      boxShadow: glow ? `0 0 20px ${glow}22` : "none",
      transition: "all 0.2s ease",
      animation: animate ? "fadeIn 0.4s ease" : "none",
      ...style
    }}
  >
    {children}
  </div>
);

export const Badge = ({ label, color }) => (
  <span style={{
    background: `${color}15`,
    color: color,
    border: `1px solid ${color}33`,
    borderRadius: 20,
    padding: "2px 10px",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.05em",
    textTransform: "uppercase"
  }}>
    {label}
  </span>
);

export const Btn = ({ children, onClick, disabled, color, dark, style }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    style={{
      background: disabled ? C.border : (dark ? color : `${color}22`),
      color: disabled ? C.muted : (dark ? "#000" : color),
      border: disabled ? "none" : `1px solid ${color}44`,
      borderRadius: 8,
      padding: "10px 20px",
      fontSize: 13,
      fontWeight: 800,
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "inherit",
      transition: "all 0.15s",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      ...style
    }}
  >
    {children}
  </button>
);

export const Spinner = ({ label }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 20 }}>
    <div className="spinner" />
    {label && <div style={{ color: C.muted, fontSize: 11, letterSpacing: 1 }}>{label.toUpperCase()}</div>}
  </div>
);

export const EmptyState = ({ icon, title, desc, cta, onCta, ctaColor }) => (
  <div style={{ textAlign: "center", padding: "40px 20px", border: `1px dashed ${C.border}`, borderRadius: 16 }}>
    <div style={{ fontSize: 40, marginBottom: 16 }}>{icon}</div>
    <div style={{ color: C.text, fontWeight: 800, fontSize: 16, marginBottom: 8 }}>{title}</div>
    <div style={{ color: C.muted, fontSize: 13, marginBottom: 20, maxWidth: 300, margin: "0 auto 20px" }}>{desc}</div>
    {cta && <Btn onClick={onCta} color={ctaColor} style={{ margin: "0 auto" }}>{cta}</Btn>}
  </div>
);
