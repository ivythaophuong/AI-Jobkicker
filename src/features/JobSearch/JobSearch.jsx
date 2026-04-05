import React, { useState } from 'react';
import { Card, Badge, Btn, Spinner, EmptyState } from '../../components/CommonUI';
import { sb } from '../../lib/supabase';
import { C } from '../../styles/theme';

export default function JobSearch({ form, resumeText, memory, updateMemory, onProTrigger }) {
  const [query, setQuery] = useState(form.role || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock search results (the user's existing logic)
  const search = async () => {
    setLoading(true);
    // Simulating API call
    setTimeout(() => {
      const mock = [
        { id: 1, company: "Stripe", role: query, status: "Open", link: "#", score: 88, market: form.market },
        { id: 2, company: "Grab", role: query, status: "Open", link: "#", score: 75, market: form.market },
        { id: 3, company: "Shopee", role: query, status: "Urgent", link: "#", score: 62, market: form.market },
      ];
      setResults(mock);
      setLoading(false);
    }, 1000);
  };

  const trackApplication = async (job) => {
     if (updateMemory) {
        const app = { 
            id: Date.now(), 
            company: job.company, 
            role: job.role, 
            status: "Applied", 
            date: new Date().toISOString() 
        };
        updateMemory(m => ({ applications: [app, ...(m.applications || [])].slice(-50) }));
        
        // RELATIONAL INSERT
        const user = JSON.parse(localStorage.getItem("supabase.auth.token"))?.currentSession?.user;
        if (user) {
          sb.insert("applications", {
            user_id: user.id,
            company: job.company,
            role: job.role,
            status: "Applied",
            link: job.link,
            notes: "Manually tracked via search"
          }, localStorage.getItem("supabase.auth.token")?.access_token);
        }
     }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
       <div className="t-h1" style={{ color: C.text }}>Aggregated Job Search</div>
       <Card>
           <div style={{ display: "flex", gap: 8 }}>
               <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Role to search..." style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: "0 14px", fontSize: 13, outline: "none" }} />
               <Btn onClick={search} color={C.green} dark>{loading ? <Spinner /> : "🔍 Search"}</Btn>
           </div>
       </Card>

       {results.map(job => (
           <Card key={job.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
               <div>
                   <div style={{ color: C.text, fontWeight: 800, fontSize: 14 }}>{job.role} @ {job.company}</div>
                   <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{job.market} · Match {job.score}%</div>
               </div>
               <Btn onClick={() => trackApplication(job)} color={C.green} style={{ fontSize: 11 }}>Track Application</Btn>
           </Card>
       ))}
    </div>
  );
}
