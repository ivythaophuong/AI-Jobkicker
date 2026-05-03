import React, { useState, useRef, useCallback, useEffect } from 'react';
import mammoth from 'mammoth';
import { callLLM, extractJSON } from '../../lib/ai.jsx';
import { OrbitSpinner } from '../../components/OrbitMark';
import {
  FREE_DONE_LIMIT, SEVERITY_ORDER, CATEGORIES,
  genId, arrayBufferToBase64, computeLineDiff, sortGapsBySeverity, buildRebuildPrompt,
} from './atsBuilderUtils.js';
import './atsBuilder.css';

// ── Constants ──────────────────────────────────────────────────────────────────
const PARAM_LABELS = {
  keywords:        'Keywords',
  impactMetrics:   'Impact & Metrics',
  formatting:      'Formatting',
  missingSections: 'Sections',
  summaryHeadline: 'Summary/Headline',
};

const SCAN_STEPS = [
  'Reading resume structure…',
  'Analysing ATS compatibility…',
  'Identifying keyword gaps…',
  'Checking impact & metrics…',
  'Scoring formatting & sections…',
  'Building improvement cards…',
];

// ── AI prompts ─────────────────────────────────────────────────────────────────
const TEXT_EXTRACT_PROMPT = 'Extract all text from this resume. Return ONLY the plain text — no JSON, no commentary, no formatting markers. Preserve section headings and bullet points on separate lines.';

const SCAN_PROMPT = `You are an expert ATS resume analyst. Analyse the resume below.
Return ONLY raw JSON (no markdown, no code blocks, start immediately with {):
{"atsScore":0,"parameters":{"keywords":0,"impactMetrics":0,"formatting":0,"missingSections":0,"summaryHeadline":0},"gaps":[{"id":"g1","severity":"critical","category":"keywords","title":"Short gap title","description":"2-3 sentences — what is wrong and why it hurts ATS","section":"Resume section this applies to","aiSuggestion":"Specific actionable fix with example text"}]}
Rules: atsScore 0-100; parameter values 0-100; severity one of critical|high|medium|low; category one of keywords|impact_metrics|formatting|missing_sections|summary_headline; generate 6-10 gaps sorted critical first; be hyper-specific to this exact resume.

RESUME:
`;


function buildAnalysisPrompt(originalText, newText) {
  return `Compare these two resumes. Return ONLY raw JSON (start with {):
{"atsScore":0,"parameters":{"keywords":0,"impactMetrics":0,"formatting":0,"missingSections":0,"summaryHeadline":0},"addedKeywords":[],"changesSummary":[]}
ORIGINAL (first 2000 chars): ${originalText.slice(0, 2000)}
IMPROVED (first 2000 chars): ${newText.slice(0, 2000)}`;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function base64ToBlobUrl(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}

function stepTimer(setScanStep) {
  let idx = 0;
  const t = setInterval(() => {
    idx = Math.min(idx + 1, SCAN_STEPS.length - 1);
    setScanStep(SCAN_STEPS[idx]);
  }, 1400);
  return t;
}

// ── Upload Phase ───────────────────────────────────────────────────────────────
function UploadPhase({ onFile, hasScanResume, onUseScanResume, error, onClearError }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div className="atb-upload-wrap">
      {error && (
        <div className="atb-error" style={{ marginBottom: 16, borderRadius: 8, border: '1px solid rgba(255,95,110,.25)' }}>
          ⚠ {error}
          <button onClick={onClearError} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ff5f6e', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
      )}
      <div className="atb-ey">ATS Builder</div>
      <h1 className="atb-upload-h">Build a resume that beats ATS.</h1>
      <p className="atb-upload-p">Upload your resume. AI scans for gaps — you pick what to fix, it rebuilds and shows exactly what changed.</p>

      <div
        className={`atb-upload-zone${dragOver ? ' drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className="atb-upload-icon">📄</div>
        <div className="atb-upload-title">Drop your resume here</div>
        <div className="atb-upload-sub">PDF or DOCX · Click to browse</div>
        <button
          className="atb-upload-btn"
          onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
        >
          Browse files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          style={{ display: 'none' }}
          onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); }}
        />
      </div>

      {hasScanResume && (
        <div className="atb-from-scan">
          <div className="atb-from-scan-label">Already scanned a resume?</div>
          <button className="atb-from-scan-btn" onClick={onUseScanResume}>
            ↗ Use resume from last scan
          </button>
        </div>
      )}
    </div>
  );
}

// ── Loading Phase (scan + build) ───────────────────────────────────────────────
const LOAD_VARIANTS = {
  teal:   { bar: '#00D4FF' },
  violet: { bar: '#B026FF' },
};

function LoadingPhase({ label, step, variant = 'teal' }) {
  const v = LOAD_VARIANTS[variant] || LOAD_VARIANTS.teal;
  return (
    <div className="atb-loading">
      <OrbitSpinner size={72} />
      <div className="atb-scan-label">{label}</div>
      <div className="atb-scan-step">{step}</div>
      <div className="atb-scan-bar-wrap">
        <div className="atb-scan-bar" style={{ background: v.bar }} />
      </div>
    </div>
  );
}

// ── Gap Card (Gaps Identified column) ─────────────────────────────────────────
function GapCard({ card, onDragStart, onMove }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`atb-card${open ? ' atb-card-open' : ''}`}
      data-sev={card.severity}
      draggable
      onDragStart={() => onDragStart(card, 'gaps')}
      onClick={() => setOpen(o => !o)}
    >
      <div className="atb-card-top">
        <span className={`atb-sev atb-sev-${card.severity}`}>{card.severity}</span>
        <span className="atb-cat">{CATEGORIES[card.category] || card.category}</span>
        <span className="atb-card-chevron">{open ? '▲' : '▼'}</span>
      </div>
      <div className="atb-card-title">{card.title}</div>
      {open && (
        <>
          <div className="atb-card-desc">{card.description}</div>
          <div className="atb-card-section">📍 {card.section}</div>
          <div className="atb-card-actions" onClick={e => e.stopPropagation()}>
            <button className="atb-cbtn primary" onClick={() => onMove(card, 'gaps', 'edit')}>
              Edit this →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Auto-grow textarea — expands to content, never scrolls
function AutoTextarea({ className, value, onChange, placeholder }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [value]);
  return (
    <textarea
      ref={ref}
      className={className}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={1}
    />
  );
}

// ── Edit Card (Edit Queue column) ─────────────────────────────────────────────
function EditCard({ card, onDragStart, onMove, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [genLoading, setGenLoading] = useState(false);

  const generateSuggestion = async () => {
    if (genLoading) return;
    setGenLoading(true);
    try {
      const prompt = `You are an expert resume writer. Provide a specific, actionable ATS improvement for this gap.
Gap: ${card.title}
Section: ${card.section}
Description: ${card.description}
${card.userNotes ? `User intent: ${card.userNotes}` : ''}
Return ONLY the suggestion — 2-3 sentences of concrete improved content with an example.`;
      const text = await callLLM([{ role: 'user', content: prompt }], 600);
      onUpdate(card.id, { aiSuggestion: text.trim() });
    } catch { /* ignore */ }
    finally { setGenLoading(false); }
  };

  return (
    <div
      className={`atb-card${open ? ' atb-card-open' : ''}`}
      data-sev={card.severity}
      draggable
      onDragStart={() => onDragStart(card, 'edit')}
      onClick={() => setOpen(o => !o)}
    >
      <div className="atb-card-top">
        <span className={`atb-sev atb-sev-${card.severity}`}>{card.severity}</span>
        <span className="atb-cat">{CATEGORIES[card.category] || card.category}</span>
        <span className="atb-card-chevron">{open ? '▲' : '▼'}</span>
      </div>
      <div className="atb-card-title">{card.title}</div>
      {open && (
        <div onClick={e => e.stopPropagation()}>
          <div className="atb-card-section">📍 {card.section}</div>
          <div className="atb-ai-block">
            <div className="atb-ai-lbl">
              ✦ AI Suggestion
              {genLoading && <span style={{ opacity: .6, fontWeight: 400 }}>generating…</span>}
            </div>
            <AutoTextarea
              className="atb-ai-textarea"
              value={card.aiSuggestion}
              onChange={e => onUpdate(card.id, { aiSuggestion: e.target.value })}
              placeholder="AI suggested fix will appear here…"
            />
            {!card.aiSuggestion?.trim() && (
              <button
                className="atb-cbtn"
                style={{ marginTop: 6, fontSize: 10 }}
                onClick={generateSuggestion}
                disabled={genLoading}
              >
                {genLoading ? 'Generating…' : '✦ Generate suggestion'}
              </button>
            )}
          </div>
          <div className="atb-notes-block">
            <label className="atb-notes-lbl">Your notes</label>
            <AutoTextarea
              className="atb-notes-ta"
              value={card.userNotes}
              onChange={e => onUpdate(card.id, { userNotes: e.target.value })}
              placeholder="e.g. Add the Q2 project where I cut deployment time by 40%"
            />
          </div>
          <div className="atb-card-actions">
            <button className="atb-cbtn" onClick={() => onMove(card, 'edit', 'gaps')}>← Back</button>
            <button className="atb-cbtn primary" onClick={() => onMove(card, 'edit', 'done')}>→ Mark done</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Done Card (Done column) ────────────────────────────────────────────────────
function DoneCard({ card, onDragStart, onMove }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`atb-card atb-card-done${open ? ' atb-card-open' : ''}`}
      data-sev={card.severity}
      draggable
      onDragStart={() => onDragStart(card, 'done')}
      onClick={() => setOpen(o => !o)}
    >
      <div className="atb-card-top">
        <span className={`atb-sev atb-sev-${card.severity}`}>{card.severity}</span>
        <span className="atb-cat">{CATEGORIES[card.category] || card.category}</span>
        <span className="atb-done-check">✓</span>
        <span className="atb-card-chevron">{open ? '▲' : '▼'}</span>
      </div>
      <div className="atb-card-title">{card.title}</div>
      {open && (
        <div onClick={e => e.stopPropagation()}>
          <div className="atb-card-section">📍 {card.section}</div>
          {card.userNotes?.trim() && (
            <div className="atb-card-desc" style={{ marginTop: 6, borderLeft: '2px solid rgba(0,212,255,.35)', paddingLeft: 8 }}>
              {card.userNotes}
            </div>
          )}
          <div className="atb-card-actions">
            <button className="atb-cbtn" onClick={() => onMove(card, 'done', 'edit')}>← Back to edit</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Kanban Column ─────────────────────────────────────────────────────────────
function KanbanColumn({ label, color, count, onDrop, children, headerRight }) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      className={`atb-col${dragOver ? ' drag-over' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); onDrop(); }}
    >
      <div className="atb-col-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span className="atb-col-name" style={{ color }}>{label}</span>
          <span className="atb-col-count" style={{ background: `${color}18`, color, border: `1px solid ${color}38` }}>{count}</span>
        </div>
        {headerRight}
      </div>
      <div className="atb-col-body">
        {React.Children.count(children) === 0
          ? <div className="atb-col-empty">Drop cards here</div>
          : children
        }
      </div>
    </div>
  );
}

// ── Add Gap Modal ─────────────────────────────────────────────────────────────
function AddGapModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    title: '', section: '', category: 'keywords', severity: 'medium', userNotes: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="atb-overlay" onClick={onClose}>
      <div className="atb-addgap-modal" onClick={e => e.stopPropagation()}>
        <div className="atb-addgap-title">Add a custom gap</div>

        <div className="atb-field">
          <label className="atb-field-lbl">Gap title</label>
          <input
            className="atb-field-inp"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g. Add leadership quantification to Experience section"
          />
        </div>

        <div className="atb-field">
          <label className="atb-field-lbl">Resume section</label>
          <input
            className="atb-field-inp"
            value={form.section}
            onChange={e => set('section', e.target.value)}
            placeholder="e.g. Work Experience, Skills, Summary"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="atb-field">
            <label className="atb-field-lbl">Category</label>
            <select className="atb-field-inp" value={form.category} onChange={e => set('category', e.target.value)}>
              {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="atb-field">
            <label className="atb-field-lbl">Severity</label>
            <select className="atb-field-inp" value={form.severity} onChange={e => set('severity', e.target.value)}>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="atb-field">
          <label className="atb-field-lbl">Your intent (what to add / remove / rephrase)</label>
          <textarea
            className="atb-field-inp"
            style={{ minHeight: 58, resize: 'vertical' }}
            value={form.userNotes}
            onChange={e => set('userNotes', e.target.value)}
            placeholder="e.g. Remove the generic objective statement, replace with a targeted PM summary"
          />
        </div>

        <div className="atb-modal-btns">
          <button className="atb-cbtn" onClick={onClose}>Cancel</button>
          <button
            className="atb-cbtn primary"
            disabled={!form.title.trim()}
            onClick={() => {
              onAdd({ ...form, id: genId(), description: form.userNotes || form.title, aiSuggestion: '' });
              onClose();
            }}
          >
            Add gap
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Upgrade Modal ─────────────────────────────────────────────────────────────
function UpgradeModal({ onClose, onUpgrade }) {
  return (
    <div className="atb-overlay" onClick={onClose}>
      <div className="atb-modal" onClick={e => e.stopPropagation()}>
        <div className="atb-modal-icon">⚡</div>
        <div className="atb-modal-title">Unlock more edits</div>
        <div className="atb-modal-desc">
          Free tier allows up to {FREE_DONE_LIMIT} edits per build.
          Upgrade to Premium to apply unlimited gaps and rebuild as many times as you need.
        </div>
        <div className="atb-modal-btns">
          <button className="atb-cbtn" onClick={onClose}>Maybe later</button>
          <button className="atb-upload-btn" onClick={onUpgrade}>Upgrade to Premium →</button>
        </div>
      </div>
    </div>
  );
}

// ── Results View ───────────────────────────────────────────────────────────────
function ResultsView({ oldText, newText, oldScore, newScore, oldParams, newParams, addedKeywords, pdfUrl, onEditMore, onRebuildFromThis }) {
  const diff      = computeLineDiff(oldText || '', newText || '');
  const removed   = diff.filter(d => d.type === 'removed');
  const added     = diff.filter(d => d.type === 'added');
  const scoreGain = newScore - oldScore;
  const scoreColor = newScore >= 70 ? '#00e5a0' : newScore >= 50 ? '#f5a623' : '#ff4d5e';

  const downloadDoc = () => {
    const html = `<html><head><style>body{font-family:Georgia,serif;font-size:12pt;line-height:1.7;max-width:740px;margin:36px auto;color:#1a1a2e}</style></head><body><pre style="white-space:pre-wrap;font-family:inherit">${(newText || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body></html>`;
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'resume-optimized.doc'; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><head><title>Optimised Resume</title><style>body{font-family:Georgia,serif;font-size:12pt;line-height:1.7;max-width:740px;margin:36px auto;color:#1a1a2e}pre{white-space:pre-wrap;font-family:inherit}</style></head><body><pre>${(newText || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body></html>`);
    win.document.close(); win.print();
  };

  return (
    <div className="atb-results-wrap">

      {/* ── Top bar ── */}
      <div className="atb-res-bar">
        <div className="atb-res-bar-left">
          <span className="atb-res-eyebrow">ATS Builder</span>
          <span className="atb-res-divider">·</span>
          <span className="atb-res-headline">Resume optimised</span>
        </div>
        <div className="atb-res-score-hero">
          <span className="atb-rsh-old">{oldScore}</span>
          <span className="atb-rsh-track">
            <span className="atb-rsh-fill" style={{ width: `${oldScore}%` }} />
            <span className="atb-rsh-gain" style={{ width: `${Math.max(0, scoreGain)}%`, left: `${oldScore}%`, background: scoreColor }} />
          </span>
          <span className="atb-rsh-new" style={{ color: scoreColor }}>{newScore}</span>
          <span className="atb-rsh-delta" style={{ background: scoreGain >= 0 ? 'rgba(0,229,160,.14)' : 'rgba(255,77,94,.14)', color: scoreGain >= 0 ? '#00e5a0' : '#ff4d5e' }}>
            {scoreGain >= 0 ? '+' : ''}{scoreGain}
          </span>
        </div>
        <div className="atb-res-actions">
          <button className="atb-dl-btn" onClick={downloadDoc}>↓ DOCX</button>
          <button className="atb-dl-btn" onClick={downloadPdf}>↓ PDF</button>
          <button className="atb-back-btn" onClick={onEditMore}>↺ Edit more</button>
          <button className="atb-rebuild-btn" onClick={onRebuildFromThis}>Rebuild from this ↗</button>
        </div>
      </div>

      {/* ── Document panels ── */}
      <div className="atb-doc-row">

        {/* Before */}
        <div className="atb-doc-panel">
          <div className="atb-doc-toolbar atb-doc-toolbar-before">
            <span className="atb-panel-badge before">BEFORE</span>
            <span className="atb-doc-tb-label">Original resume</span>
            <span className="atb-doc-tb-score">Score <strong>{oldScore}</strong></span>
          </div>
          <div className="atb-doc-viewer">
            {pdfUrl
              ? <iframe src={pdfUrl} title="Original resume" className="atb-doc-iframe" />
              : <div className="atb-doc-page atb-doc-page-muted">{oldText}</div>
            }
          </div>
        </div>

        <div className="atb-doc-split" />

        {/* After */}
        <div className="atb-doc-panel">
          <div className="atb-doc-toolbar atb-doc-toolbar-after">
            <span className="atb-panel-badge after">AFTER</span>
            <span className="atb-doc-tb-label">Optimised resume</span>
            <span className="atb-doc-tb-score" style={{ color: scoreColor }}>
              Score <strong>{newScore}</strong>
              {scoreGain > 0 && <span className="atb-doc-tb-gain">+{scoreGain}</span>}
            </span>
          </div>
          <div className="atb-doc-viewer">
            <div className="atb-doc-page">{newText}</div>
          </div>
        </div>

      </div>

      {/* ── Metrics row ── */}
      <div className="atb-metrics-row">
        {Object.entries(PARAM_LABELS).map(([k, label]) => {
          const ov = oldParams?.[k] ?? 0;
          const nv = newParams?.[k] ?? 0;
          const gain = nv - ov;
          return (
            <div key={k} className="atb-metric-chip">
              <div className="atb-metric-label">{label}</div>
              <div className="atb-metric-track">
                <div className="atb-metric-old" style={{ width: `${ov}%` }} />
                <div className="atb-metric-gain" style={{ width: `${Math.max(0, gain)}%`, left: `${ov}%` }} />
              </div>
              <div className="atb-metric-nums">
                <span className="atb-metric-ov">{ov}</span>
                <span className="atb-metric-arr">→</span>
                <span className="atb-metric-nv" style={{ color: nv > ov ? '#00e5a0' : nv < ov ? '#ff4d5e' : 'var(--atb-text3)' }}>{nv}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Diff + keywords ── */}
      <div className="atb-diff-section">

        {addedKeywords?.length > 0 && (
          <div className="atb-kw-wrap">
            <div className="atb-diff-section-title">Keywords Added</div>
            <div className="atb-kw-tags">
              {addedKeywords.map((kw, i) => <span key={i} className="atb-kw-tag">+ {kw}</span>)}
            </div>
          </div>
        )}

        {(removed.length > 0 || added.length > 0) && (
          <div>
            <div className="atb-diff-header">
              <span className="atb-diff-section-title" style={{ margin: 0 }}>Line changes</span>
              <span className="atb-diff-counts">
                <span className="atb-diff-count rem">−{removed.length}</span>
                <span className="atb-diff-count add">+{added.length}</span>
              </span>
            </div>
            <div className="atb-diff-columns">
              <div className="atb-diff-col">
                <div className="atb-diff-col-hd rem">Removed</div>
                <div className="atb-diff-col-body">
                  {removed.length === 0
                    ? <div className="atb-diff-empty">Nothing removed</div>
                    : removed.map((row, i) => (
                        <div key={i} className="atb-diff-line rem">
                          <span className="atb-diff-idx">{i + 1}</span>
                          <span className="atb-diff-line-text">{row.text}</span>
                        </div>
                      ))
                  }
                </div>
              </div>
              <div className="atb-diff-col">
                <div className="atb-diff-col-hd add">Added</div>
                <div className="atb-diff-col-body">
                  {added.length === 0
                    ? <div className="atb-diff-empty">Nothing added</div>
                    : added.map((row, i) => (
                        <div key={i} className="atb-diff-line add">
                          <span className="atb-diff-idx">{i + 1}</span>
                          <span className="atb-diff-line-text">{row.text}</span>
                        </div>
                      ))
                  }
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

// ── Main ATSBuilder ────────────────────────────────────────────────────────────
const ATSBuilder = ({ user, memory, updateMemory, onProTrigger }) => {
  const hasSavedResume = !!memory?.scanPdfBase64;
  const [phase, setPhase] = useState(hasSavedResume ? 'scanning' : 'upload'); // upload | scanning | kanban | building | results
  const [scanStep, setScanStep] = useState(SCAN_STEPS[0]);
  const [error, setError] = useState(null);

  // Resume data
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfBase64, setPdfBase64] = useState(null);
  const [resumeText, setResumeTextState] = useState('');

  // Scan scores
  const [atsScore, setAtsScore] = useState(null);
  const [parameters, setParameters] = useState(null);

  // Kanban columns
  const [gapCards, setGapCards] = useState([]);
  const [editCards, setEditCards] = useState([]);
  const [doneCards, setDoneCards] = useState([]);

  // Drag
  const dragRef = useRef(null); // { card, fromCol }

  // Modals
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAddGap, setShowAddGap] = useState(false);

  // Build result
  const [buildResult, setBuildResult] = useState(null);

  const isFree = !user;
  const doneCardsRef = useRef(doneCards);
  useEffect(() => { doneCardsRef.current = doneCards; }, [doneCards]);

  // Auto-scan on mount if a saved resume exists in memory
  useEffect(() => {
    if (hasSavedResume) {
      const b64 = memory.scanPdfBase64;
      setPdfBase64(b64);
      setPdfUrl(base64ToBlobUrl(b64));
      runScanPdf(b64);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── File upload ──────────────────────────────────────────────────────────────
  const handleFile = async (file) => {
    setError(null);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      const ab = await file.arrayBuffer();
      const b64 = arrayBufferToBase64(ab);
      setPdfBase64(b64);
      await runScanPdf(b64);
    } else {
      setPdfUrl(null);
      setPdfBase64(null);
      const ab = await file.arrayBuffer();
      const { value: rawText } = await mammoth.extractRawText({ arrayBuffer: ab });
      await runScanText(rawText);
    }
  };

  const handleUseScanResume = () => {
    const b64 = memory?.scanPdfBase64;
    if (!b64) return;
    setError(null);
    setPdfBase64(b64);
    setPdfUrl(base64ToBlobUrl(b64));
    runScanPdf(b64);
  };

  // ── Scan ─────────────────────────────────────────────────────────────────────
  const runScanPdf = async (b64) => {
    setPhase('scanning');
    setScanStep(SCAN_STEPS[0]);
    const t = stepTimer(setScanStep);
    try {
      // Step 1: extract plain text from PDF (keeps scan JSON small and valid)
      const extractedText = await callLLM(
        [{ role: 'user', content: TEXT_EXTRACT_PROMPT }],
        2000,
        b64
      );
      setResumeTextState(extractedText.trim());

      // Step 2: scan for ATS gaps using the extracted text
      const raw = await callLLM(
        [{ role: 'user', content: SCAN_PROMPT + extractedText.trim() }],
        8000
      );
      processScanResult(raw);
    } catch (err) {
      setError(err.message || 'Scan failed. Please try again.');
      setPhase('upload');
    } finally { clearInterval(t); }
  };

  const runScanText = async (text) => {
    setPhase('scanning');
    setScanStep(SCAN_STEPS[0]);
    setResumeTextState(text);
    const t = stepTimer(setScanStep);
    try {
      const raw = await callLLM(
        [{ role: 'user', content: SCAN_PROMPT + text }],
        8000
      );
      processScanResult(raw);
    } catch (err) {
      setError(err.message || 'Scan failed. Please try again.');
      setPhase('upload');
    } finally { clearInterval(t); }
  };

  const processScanResult = (raw) => {
    const parsed = extractJSON(raw);
    if (parsed.error) {
      setError('Could not parse scan results. Please try again.');
      setPhase('upload');
      return;
    }
    setAtsScore(parsed.atsScore ?? 0);
    setParameters(parsed.parameters ?? {});
    const sorted = sortGapsBySeverity(parsed.gaps || [])
      .map(g => ({ ...g, id: g.id || genId(), userNotes: '', aiSuggestion: g.aiSuggestion || '' }));
    setGapCards(sorted);
    setEditCards([]);
    setDoneCards([]);
    setBuildResult(null);
    setPhase('kanban');
  };

  // ── Card movement ─────────────────────────────────────────────────────────────
  const moveCard = useCallback((card, from, to) => {
    if (to === 'done' && isFree && doneCardsRef.current.length >= FREE_DONE_LIMIT) {
      setShowUpgrade(true);
      return;
    }
    const remove = (arr) => arr.filter(c => c.id !== card.id);
    if (from === 'gaps')  setGapCards(remove);
    if (from === 'edit')  setEditCards(remove);
    if (from === 'done')  setDoneCards(remove);
    if (to === 'gaps')    setGapCards(p => [...p, card]);
    if (to === 'edit')    setEditCards(p => [...p, card]);
    if (to === 'done')    setDoneCards(p => [...p, card]);
  }, [isFree]);

  const updateCard = useCallback((id, updates) => {
    const upd = arr => arr.map(c => c.id === id ? { ...c, ...updates } : c);
    setGapCards(upd);
    setEditCards(upd);
    setDoneCards(upd);
  }, []);

  const handleDragStart = useCallback((card, fromCol) => {
    dragRef.current = { card, fromCol };
  }, []);

  const handleDrop = useCallback((toCol) => {
    if (!dragRef.current) return;
    moveCard(dragRef.current.card, dragRef.current.fromCol, toCol);
    dragRef.current = null;
  }, [moveCard]);

  // ── Build ─────────────────────────────────────────────────────────────────────
  const handleBuild = async () => {
    if (doneCards.length === 0) return;
    setPhase('building');
    setError(null);
    try {
      const newText = await callLLM(
        [{ role: 'user', content: buildRebuildPrompt(resumeText, doneCards) }],
        4096
      );
      const analysisRaw = await callLLM(
        [{ role: 'user', content: buildAnalysisPrompt(resumeText, newText) }],
        1024
      );
      const analysis = extractJSON(analysisRaw);
      setBuildResult({
        newText:       newText.trim(),
        newScore:      analysis.atsScore || Math.min(100, (atsScore || 0) + doneCards.length * 5),
        newParams:     analysis.parameters || parameters,
        addedKeywords: analysis.addedKeywords || [],
      });
      setPhase('results');
    } catch (err) {
      setError(err.message || 'Build failed. Please try again.');
      setPhase('kanban');
    }
  };

  // ── Post-build ────────────────────────────────────────────────────────────────
  const handleEditMore = () => setPhase('kanban');

  const handleRebuildFromThis = async () => {
    if (!buildResult?.newText) return;
    const newBase = buildResult.newText;
    setResumeTextState(newBase);
    setPdfUrl(null);
    setPdfBase64(null);
    await runScanText(newBase);
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="atb">
      {phase === 'upload' && (
        <UploadPhase
          onFile={handleFile}
          hasScanResume={!!memory?.scanPdfBase64}
          onUseScanResume={handleUseScanResume}
          error={error}
          onClearError={() => setError(null)}
        />
      )}

      {phase === 'scanning' && (
        <LoadingPhase label="Scanning your resume…" step={scanStep} variant="teal" />
      )}

      {phase === 'building' && (
        <LoadingPhase
          label="Building your ATS-optimised resume…"
          step="AI is rewriting your content with the requested edits"
          variant="violet"
        />
      )}

      {phase === 'kanban' && (
        <>
          {error && (
            <div className="atb-error">
              ⚠ {error}
              <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ff5f6e', cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>
          )}
          <div className="atb-workspace">
            {/* Left: PDF / text preview */}
            <div className="atb-pdf-pane">
              <div className="atb-pane-head">
                <span className="atb-pane-label">Your resume</span>
                <button className="atb-cbtn" onClick={() => { setPhase('upload'); setError(null); }}>
                  ← Upload new
                </button>
              </div>
              <div className="atb-pdf-embed-wrap">
                {pdfUrl
                  ? <iframe src={pdfUrl} title="Resume preview" className="atb-pdf-embed" />
                  : <div className="atb-text-preview">{resumeText}</div>
                }
              </div>
            </div>

            {/* Right: Kanban */}
            <div className="atb-kanban-pane">
              <div className="atb-kanban-header">
                <div>
                  <div className="atb-kanban-title">Gap Editor</div>
                  <div className="atb-kanban-meta">
                    {gapCards.length + editCards.length + doneCards.length} gaps · drag cards between columns
                  </div>
                </div>
                <button
                  className="atb-build-btn"
                  disabled={doneCards.length === 0}
                  onClick={handleBuild}
                >
                  ✦ Build ATS ({doneCards.length} {doneCards.length === 1 ? 'edit' : 'edits'} ready)
                </button>
              </div>

              <div className="atb-columns">
                {/* Gaps Identified */}
                <KanbanColumn
                  label="Gaps Identified"
                  color="var(--lp-amber)"
                  count={gapCards.length}
                  onDrop={() => handleDrop('gaps')}
                  headerRight={
                    <button className="atb-add-gap-btn" onClick={() => setShowAddGap(true)}>+ Add</button>
                  }
                >
                  {gapCards.map(card => (
                    <GapCard key={card.id} card={card} onDragStart={handleDragStart} onMove={moveCard} />
                  ))}
                </KanbanColumn>

                {/* Edit Queue */}
                <KanbanColumn
                  label="Edit Queue"
                  color="var(--lp-violet)"
                  count={editCards.length}
                  onDrop={() => handleDrop('edit')}
                >
                  {editCards.map(card => (
                    <EditCard key={card.id} card={card} onDragStart={handleDragStart} onMove={moveCard} onUpdate={updateCard} />
                  ))}
                </KanbanColumn>

                {/* Done */}
                <KanbanColumn
                  label={isFree ? `Done (${doneCards.length}/${FREE_DONE_LIMIT})` : 'Done'}
                  color="var(--lp-teal)"
                  count={doneCards.length}
                  onDrop={() => handleDrop('done')}
                >
                  {doneCards.map(card => (
                    <DoneCard key={card.id} card={card} onDragStart={handleDragStart} onMove={moveCard} />
                  ))}
                </KanbanColumn>
              </div>
            </div>
          </div>
        </>
      )}

      {phase === 'results' && buildResult && (
        <ResultsView
          oldText={resumeText}
          newText={buildResult.newText}
          oldScore={atsScore}
          newScore={buildResult.newScore}
          oldParams={parameters}
          newParams={buildResult.newParams}
          addedKeywords={buildResult.addedKeywords}
          pdfUrl={pdfUrl}
          onEditMore={handleEditMore}
          onRebuildFromThis={handleRebuildFromThis}
        />
      )}

      {showUpgrade && (
        <UpgradeModal
          onClose={() => setShowUpgrade(false)}
          onUpgrade={() => { setShowUpgrade(false); onProTrigger?.(); }}
        />
      )}

      {showAddGap && (
        <AddGapModal
          onClose={() => setShowAddGap(false)}
          onAdd={card => setGapCards(p => [card, ...p])}
        />
      )}
    </div>
  );
};

export default ATSBuilder;
