import { useState, useEffect, useRef } from 'react';
import { sb } from '../lib/supabase';

// ── Production-Grade Relational Memory Hook ──────────────────────────────────
export function useMemory(user, isRestoring, setIsRestoring, setRestoreError) {
  const [memory, setMemory] = useState(null);
  const syncLockedRef = useRef(true); // Atomic lock to prevent race conditions
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

        // 2. CONSTRUCT COMPOSITE STATE (Backward Compatible)
        const base = dbMem?.[0]?.data || {}; 
        
        const compositeMap = {
          ...base,
          scanHistory: scans?.length ? scans : (base.scanHistory || []),
          applications: apps?.length ? apps : (base.applications || []),
          starBank: stars?.length ? stars : (base.starBank || []),
          coverLetters: covers?.length ? covers : (base.coverLetters || []),
          jdAnalyses: jds?.length ? jds : (base.jdAnalyses || []),
          mockSessions: sessions?.length ? sessions : (base.mockSessions || []),
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
  const updateMemory = async (updater) => {
    setMemory(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      
      // Atomic Background Sync
      if (user && !syncLockedRef.current) {
        setIsSyncing(true);
        // We only upsert the 'Base' settings to user_memory
        // Relational items like 'applications' should be saved via their own useCase hooks
        // but for now we keep the global sync for settings parity.
        sb.upsert("user_memory", { user_id: user.id, data: next, updated_at: new Date().toISOString() }, user.token)
          .finally(() => setIsSyncing(false));
      }
      return next;
    });
  };

  return { memory, updateMemory, isSyncing };
}
