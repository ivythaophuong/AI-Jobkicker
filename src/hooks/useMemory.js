import { useState, useEffect, useRef } from 'react';
import { sb } from '../lib/supabase';

// ── Production-Grade Relational Memory Hook ──────────────────────────────────
export function useMemory(user, isRestoring, setIsRestoring, setRestoreError) {
  const [memory, setMemory] = useState({});
  const syncLockedRef = useRef(true); // Atomic lock to prevent race conditions during initial load
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. COMPOSITE FETCH: Load from all relational tables in parallel
  useEffect(() => {
    async function loadAll() {
      if (!user || !isRestoring) return;
      
      try {
        const [
          dbMem, 
          scans, 
          apps, 
          stars, 
          covers, 
          jds, 
          sessions, 
          practice, 
          insights
        ] = await Promise.all([
          sb.select("user_memory", { user_id: `eq.${user.id}` }, user.token),
          sb.select("resume_scans", { user_id: `eq.${user.id}`, order: "created_at.desc", limit: 20 }, user.token),
          sb.select("applications", { user_id: `eq.${user.id}`, order: "created_at.desc", limit: 50 }, user.token),
          sb.select("star_stories", { user_id: `eq.${user.id}`, order: "created_at.desc", limit: 30 }, user.token),
          sb.select("cover_letters", { user_id: `eq.${user.id}`, order: "created_at.desc", limit: 20 }, user.token),
          sb.select("jd_analyses", { user_id: `eq.${user.id}`, order: "created_at.desc", limit: 20 }, user.token),
          sb.select("mock_sessions", { user_id: `eq.${user.id}`, order: "created_at.desc", limit: 20 }, user.token),
          sb.select("negotiation_practice", { user_id: `eq.${user.id}`, order: "created_at.desc", limit: 20 }, user.token),
          sb.select("insights", { user_id: `eq.${user.id}`, order: "created_at.desc", limit: 10 }, user.token)
        ]);

        // 2. CONSTRUCT COMPOSITE STATE (Backward Compatible & Normalized)
        const base = dbMem?.[0]?.data || {}; 

        // Senior Normalization Layer: Map snake_case (DB) to camelCase (Frontend)
        const normalize = (rows, mapper) => (rows || []).map(r => {
          const obj = { ...r, date: r.created_at };
          Object.keys(mapper).forEach(key => {
            if (r[key] !== undefined) obj[mapper[key]] = r[key];
          });
          return obj;
        });

        const compositeMap = {
          ...base,
          scanHistory: (scans && scans.length > 0) 
            ? normalize(scans, { credibility_score: 'credibilityScore', file_name: 'fileName', metrics_found: 'metricsFound' }) 
            : (base.scanHistory || []),
          
          applications: (apps && apps.length > 0) 
            ? normalize(apps, { updated_at: 'updatedAt' }) 
            : (base.applications || []),
          
          starBank: (stars && stars.length > 0) 
            ? normalize(stars, { one_liner: 'oneLiner' }) 
            : (base.starBank || []),
          
          coverLetters: (covers && covers.length > 0) 
            ? normalize(covers, { follow_up: 'followUpEmail' }) 
            : (base.coverLetters || []),
          
          jdAnalyses: (jds && jds.length > 0) 
            ? normalize(jds, { role_title: 'roleTitle', match_score: 'matchScore' }) 
            : (base.jdAnalyses || []),
          
          mockSessions: (sessions && sessions.length > 0) 
            ? normalize(sessions, { questions_count: 'questionsCount', avg_score: 'avgScore' }) 
            : (base.mockSessions || []),
            
          negotiationPractice: practice?.length ? practice.length : (base.negotiationPractice || 0),
          insights: insights?.length ? insights : (base.insights || []),
        };

        setMemory(compositeMap);
        syncLockedRef.current = false; // Release lock for UI edits
        setIsRestoring(false);
      } catch (e) {
        console.error("[useMemory] Refactor Boot Failed:", e.message);
        setRestoreError(true);
      }
    }
    loadAll();
  }, [user, isRestoring]);

  // 3. TARGETED UPDATE: Specific persistence logic
  const updateMemory = async (updater, relational = null) => {
    setMemory(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      
      // Perform sync outside of the state calculation and lock check
      if (user && !syncLockedRef.current) {
        setIsSyncing(true);
        
        // Use a self-invoking async function to run sync in background without blocking state updater
        (async () => {
          try {
            // RELATIONAL SYNC (Priority for scalability)
            if (relational && relational.table && relational.data) {
               await sb.insert(relational.table, { ...relational.data, user_id: user.id }, user.token);
            }
            
            // GLOBAL SYNC (Backup/Settings)
            await sb.upsert("user_memory", { user_id: user.id, data: next, updated_at: new Date().toISOString() }, user.token);
          } catch (e) {
            console.error("[Sync] Persistence Error:", e.message);
          } finally {
            setIsSyncing(false);
          }
        })();
      }
      return next;
    });
  };

  return { memory, updateMemory, isSyncing };
}
