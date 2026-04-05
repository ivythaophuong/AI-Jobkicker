import React from 'react';
import { Card, Badge, Btn, EmptyState } from '../../components/CommonUI';
import { C } from '../../styles/theme';

export default function MemoryDashboard({ memory, form, updateMemory }) {
  if (!memory) return null;

  const stats = [
    { label: "Scans", value: memory.scanHistory?.length || 0, color: C.pink },
    { label: "Star Stories", value: memory.starBank?.length || 0, color: C.gold },
    { label: "Applications", value: memory.applications?.length || 0, color: C.green },
    { label: "Cover Letters", value: memory.coverLetters?.length || 0, color: C.orange },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div className="t-h1" style={{ color: C.text }}>AI Memory Dashboard</div><div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Persistent context from across 10 modules.</div></div>
       </div>

       <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
           {stats.map(s => (
               <Card key={s.label} style={{ textAlign: "center" }}>
                   <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
                   <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase" }}>{s.label}</div>
               </Card>
           ))}
       </div>

       {memory.scanHistory?.length > 0 && (
           <Card glow={C.pink}>
               <div style={{ color: C.pink, fontWeight: 800, fontSize: 12, marginBottom: 12 }}>🕒 Recent Scan History</div>
               {memory.scanHistory.map((s, i) => (
                   <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: C.surface, borderRadius: 8, marginBottom: 8, border: `1px solid ${C.border}` }}>
                       <div style={{ fontSize: 12, color: C.text }}>{s.fileName}</div>
                       <Badge label={`${s.credibilityScore}%`} color={s.credibilityScore >= 75 ? C.green : C.gold} />
                   </div>
               ))}
           </Card>
       )}
    </div>
  );
}
