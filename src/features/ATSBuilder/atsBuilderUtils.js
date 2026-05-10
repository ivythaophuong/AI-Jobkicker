// Pure utility functions extracted for testability

export const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export const CATEGORIES = {
  keywords:         'Keywords',
  impact_metrics:   'Impact & Metrics',
  formatting:       'Formatting',
  missing_sections: 'Missing Sections',
  summary_headline: 'Summary/Headline',
};

export function genId() {
  return `g-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function computeLineDiff(oldText, newText) {
  const oldLineSet = new Set(oldText.split('\n').filter(l => l.trim().length > 4));
  const newLines = newText.split('\n').filter(l => l.trim().length > 4);
  const result = [];
  for (const l of oldText.split('\n').filter(l => l.trim().length > 4)) {
    if (!newLines.includes(l)) result.push({ type: 'removed', text: l.trim() });
  }
  for (const l of newLines) {
    if (!oldLineSet.has(l)) result.push({ type: 'added', text: l.trim() });
  }
  return result.slice(0, 50);
}

export function sortGapsBySeverity(gaps) {
  return [...gaps].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4)
  );
}

export function buildRebuildPrompt(resumeText, doneCards) {
  const edits = doneCards.map((c, i) => {
    let s = `${i + 1}. Section: ${c.section}\n   Gap: ${c.title}\n   Fix: ${c.aiSuggestion}`;
    if (c.userNotes?.trim()) s += `\n   User intent: ${c.userNotes}`;
    return s;
  }).join('\n\n');
  return `You are an expert resume writer and ATS specialist. Rewrite the resume below applying ONLY the listed edits. Do not change anything not mentioned. Preserve all existing structure and sections.

ORIGINAL RESUME:
${resumeText}

EDITS TO APPLY:
${edits}

Return ONLY the improved resume as clean plain text. Keep the same format as the original.`;
}

// Pure card-movement reducer — no React state, used for testing
export function moveCardPure(state, card, from, to) {
  const { gapCards, editCards, doneCards } = state;
  const remove = (arr) => arr.filter(c => c.id !== card.id);
  const newGaps = from === 'gaps' ? remove(gapCards) : gapCards;
  const newEdit = from === 'edit' ? remove(editCards) : editCards;
  const newDone = from === 'done' ? remove(doneCards) : doneCards;
  return {
    gapCards:  to === 'gaps' ? [...newGaps, card] : newGaps,
    editCards: to === 'edit' ? [...newEdit, card] : newEdit,
    doneCards: to === 'done' ? [...newDone, card] : newDone,
  };
}
