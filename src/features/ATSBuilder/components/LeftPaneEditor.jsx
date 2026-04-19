import React, { useState, useMemo } from 'react';
import { Trash2, Plus, X, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { C } from '../../../styles/theme';
import { Card, Spinner } from '../../../components/CommonUI';

// ── Shared styles ────────────────────────────────────────────────────────────
const inp = {
  background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
  padding: '10px 14px', color: C.text, fontSize: 13, fontFamily: 'inherit',
  outline: 'none', width: '100%', boxSizing: 'border-box',
};
const lbl = { color: C.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block' };
const dashed = { width: '100%', padding: 12, border: `2px dashed ${C.border}`, borderRadius: 10, background: 'transparent', color: C.muted, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 };

const SEVERITY_COLOR = { critical: '#FF4444', warning: '#F4A938', ok: '#00C896' };
const SEVERITY_BG    = { critical: '#FF444412', warning: '#F4A93812', ok: '#00C89612' };

const ACTION_VERBS = new Set(['built','led','developed','designed','implemented','created','managed','optimized','reduced','improved','increased','launched','delivered','architected','scaled','automated','migrated','deployed','analyzed','drove','spearheaded','established','negotiated','collaborated','coordinated','mentored','resolved','streamlined']);

function getBulletHints(bullet) {
  if (!bullet || bullet.length < 15) return [];
  const hints = [];
  const firstWord = bullet.trim().toLowerCase().split(/\s+/)[0];
  if (!ACTION_VERBS.has(firstWord)) hints.push('Start with an action verb — Built, Led, Reduced...');
  if (!/\d/.test(bullet)) hints.push('Add a metric — %, $, number of users, ms...');
  return hints;
}

function matchIssue(bullet, scanIssues) {
  if (!bullet || !scanIssues?.length) return null;
  const bl = bullet.toLowerCase();
  let best = null, bestScore = 0;
  for (const issue of scanIssues) {
    if (!issue.original) continue;
    const words = issue.original.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const matches = words.filter(w => bl.includes(w)).length;
    const score = matches / Math.max(words.length, 1);
    if (score > 0.2 && score > bestScore) { best = issue; bestScore = score; }
  }
  return best;
}

// ── Section header with collapse toggle + issue badge ────────────────────────
function SectionHeader({ title, expanded, onToggle, issueCount, isVisible }) {
  if (!isVisible) return null;
  return (
    <button
      onClick={onToggle}
      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', cursor: 'pointer', padding: '10px 0', marginBottom: expanded ? 14 : 0 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {expanded ? <ChevronDown size={15} color={C.muted} /> : <ChevronRight size={15} color={C.muted} />}
        <span style={{ color: C.text, fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</span>
        {issueCount > 0 && (
          <span style={{ background: `${C.gold}20`, border: `1px solid ${C.gold}44`, color: C.gold, borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 800 }}>
            {issueCount} {issueCount === 1 ? 'issue' : 'issues'}
          </span>
        )}
      </div>
      <div style={{ height: 1, flex: 1, background: C.border, marginLeft: 12, opacity: 0.4 }} />
    </button>
  );
}

// ── Inline AI suggestion panel ───────────────────────────────────────────────
function SuggestionPanel({ suggKey, suggestion, bullet, onAccept, onSkip, onEdit, onUpdateEditText, onRegenerate }) {
  if (!suggestion) return null;
  const { text, editText, issue, status, isEditing } = suggestion;
  const color = SEVERITY_COLOR[issue?.severity] || C.gold;
  const bg = SEVERITY_BG[issue?.severity] || `${C.gold}12`;

  return (
    <div style={{ marginTop: 6, marginBottom: 10, background: bg, border: `1px solid ${color}33`, borderRadius: 10, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ background: `${color}22`, color, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', padding: '2px 7px', borderRadius: 4 }}>{issue?.severity || 'suggestion'}</span>
        <span style={{ color: C.muted, fontSize: 11, lineHeight: 1.4 }}>{issue?.fix || 'Improve impact with metrics and stronger action verbs'}</span>
      </div>

      {status === 'loading' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.muted, fontSize: 12, padding: '8px 0' }}>
          <Spinner size={13} /> Generating AI rewrite...
        </div>
      )}

      {status === 'ready' && (
        <>
          {isEditing ? (
            <textarea
              value={editText}
              onChange={e => onUpdateEditText(suggKey, e.target.value)}
              style={{ ...inp, minHeight: 72, resize: 'vertical', fontSize: 12, marginBottom: 10, borderColor: `${color}55` }}
              autoFocus
            />
          ) : (
            <div style={{ color: C.text, fontSize: 12, lineHeight: 1.6, background: C.surface, padding: '10px 12px', borderRadius: 8, marginBottom: 10, fontStyle: 'italic' }}>
              {text}
            </div>
          )}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={() => onAccept(suggKey, isEditing ? editText : text)}
              style={{ background: color, color: '#000', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
              ✓ Accept
            </button>
            <button
              onClick={() => onEdit(suggKey, !isEditing)}
              style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: '6px 12px', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
              {isEditing ? 'Preview' : '✎ Edit'}
            </button>
            <button
              onClick={() => onRegenerate(suggKey, bullet)}
              style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6, padding: '6px 10px', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <RefreshCw size={10} /> Regenerate
            </button>
            <button
              onClick={() => onSkip(suggKey)}
              style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 11, cursor: 'pointer', padding: '6px 4px' }}>
              Skip
            </button>
          </div>
        </>
      )}

      {status === 'accepted' && (
        <div style={{ color: '#00C896', fontSize: 11, fontWeight: 700 }}>✓ Applied</div>
      )}

      {status === 'skipped' && (
        <button onClick={() => onEdit(suggKey, false) /* re-show */} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 11, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
          Skipped — undo
        </button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const LeftPaneEditor = ({ data, setData, visibleSections, scanIssues = [], suggestions = {}, onAccept, onSkip, onEdit, onUpdateEditText, onRegenerate }) => {

  // Count issues per section for badge display
  const expIssueCount = useMemo(() =>
    (data.experience || []).reduce((n, job) =>
      n + (job.description || []).filter(b => matchIssue(b, scanIssues)).length, 0),
    [data.experience, scanIssues]);

  // Default: expand sections with issues, collapse clean ones
  const [expanded, setExpanded] = useState(() => ({
    summary: true,
    experience: true,
    education: expIssueCount === 0,  // collapsed if no issues
    skills: false,
    projects: false,
    certifications: false,
  }));

  const toggle = (s) => setExpanded(p => ({ ...p, [s]: !p[s] }));

  // ── Data mutators ──────────────────────────────────────────────────────────
  const setPersonal = (f, v) => setData(p => ({ ...p, personalInfo: { ...p.personalInfo, [f]: v } }));
  const setExp = (i, f, v) => setData(p => { const e=[...p.experience]; e[i]={...e[i],[f]:v}; return {...p,experience:e}; });
  const addExp = () => setData(p => ({ ...p, experience: [...p.experience, { company:'',position:'',startDate:'',endDate:'',description:[''] }] }));
  const removeExp = (i) => setData(p => ({ ...p, experience: p.experience.filter((_,j)=>j!==i) }));
  const setBullet = (ei,bi,v) => setData(p => { const e=[...p.experience]; e[ei].description[bi]=v; return {...p,experience:e}; });
  const addBullet = (ei) => setData(p => { const e=[...p.experience]; e[ei].description.push(''); return {...p,experience:e}; });
  const removeBullet = (ei,bi) => setData(p => { const e=[...p.experience]; e[ei].description=e[ei].description.filter((_,j)=>j!==bi); return {...p,experience:e}; });

  const setEdu = (i,f,v) => setData(p => { const e=[...p.education]; e[i]={...e[i],[f]:v}; return {...p,education:e}; });
  const addEdu = () => setData(p => ({ ...p, education: [...(p.education||[]), { school:'',degree:'',year:'',gpa:'' }] }));
  const removeEdu = (i) => setData(p => ({ ...p, education: p.education.filter((_,j)=>j!==i) }));

  const [skillInputs, setSkillInputs] = useState({});
  const addSkillTag = (ci,v) => { if(!v.trim()) return; setData(p => { const s=[...p.skills]; s[ci]={...s[ci],items:[...(s[ci].items||[]),v.trim()]}; return {...p,skills:s}; }); setSkillInputs(p=>({...p,[ci]:''})); };
  const removeSkillTag = (ci,ii) => setData(p => { const s=[...p.skills]; s[ci].items=s[ci].items.filter((_,j)=>j!==ii); return {...p,skills:s}; });
  const addSkillCat = () => setData(p => ({ ...p, skills: [...(p.skills||[]), { category:'New Category',items:[] }] }));
  const removeSkillCat = (i) => setData(p => ({ ...p, skills: p.skills.filter((_,j)=>j!==i) }));
  const setSkillCat = (i,v) => setData(p => { const s=[...p.skills]; s[i]={...s[i],category:v}; return {...p,skills:s}; });

  const [techInputs, setTechInputs] = useState({});
  const setProj = (i,f,v) => setData(p => { const pr=[...(p.projects||[])]; pr[i]={...pr[i],[f]:v}; return {...p,projects:pr}; });
  const addProj = () => setData(p => ({ ...p, projects:[...(p.projects||[]),{name:'',techStack:[],description:[''],link:''}] }));
  const removeProj = (i) => setData(p => ({ ...p, projects:p.projects.filter((_,j)=>j!==i) }));
  const addProjBullet = (i) => setData(p => { const pr=[...p.projects]; pr[i].description.push(''); return {...p,projects:pr}; });
  const setProjBullet = (pi,bi,v) => setData(p => { const pr=[...p.projects]; pr[pi].description[bi]=v; return {...p,projects:pr}; });
  const addTechTag = (pi,v) => { if(!v.trim()) return; setData(p => { const pr=[...p.projects]; pr[pi].techStack=[...(pr[pi].techStack||[]),v.trim()]; return {...p,projects:pr}; }); setTechInputs(p=>({...p,[pi]:''})); };
  const removeTechTag = (pi,ti) => setData(p => { const pr=[...p.projects]; pr[pi].techStack=pr[pi].techStack.filter((_,j)=>j!==ti); return {...p,projects:pr}; });

  const setCert = (i,f,v) => setData(p => { const c=[...(p.certifications||[])]; c[i]={...c[i],[f]:v}; return {...p,certifications:c}; });
  const addCert = () => setData(p => ({ ...p, certifications:[...(p.certifications||[]),{name:'',issuer:'',date:''}] }));
  const removeCert = (i) => setData(p => ({ ...p, certifications:p.certifications.filter((_,j)=>j!==i) }));

  const show = visibleSections || {};

  return (
    <div style={{ padding: 24, paddingBottom: 120, maxWidth: 660, margin: '0 auto' }}>

      {/* ── Contact (always visible, always expanded) ────────────────────── */}
      <SectionHeader title="Contact" expanded={expanded.summary} onToggle={() => toggle('summary')} issueCount={0} isVisible={true} />
      {expanded.summary && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={lbl}>Full Name</label>
              <input style={inp} value={data.personalInfo?.fullName||''} onChange={e=>setPersonal('fullName',e.target.value)} placeholder="Jane Smith" />
            </div>
            <div><label style={lbl}>Email</label><input style={inp} value={data.personalInfo?.email||''} onChange={e=>setPersonal('email',e.target.value)} /></div>
            <div><label style={lbl}>Phone</label><input style={inp} value={data.personalInfo?.phone||''} onChange={e=>setPersonal('phone',e.target.value)} /></div>
            <div><label style={lbl}>Location</label><input style={inp} value={data.personalInfo?.location||''} onChange={e=>setPersonal('location',e.target.value)} /></div>
            <div><label style={lbl}>LinkedIn</label><input style={inp} value={data.personalInfo?.linkedin||''} onChange={e=>setPersonal('linkedin',e.target.value)} /></div>
            <div style={{ gridColumn:'span 2' }}><label style={lbl}>Website</label><input style={inp} value={data.personalInfo?.website||''} onChange={e=>setPersonal('website',e.target.value)} /></div>
          </div>
        </Card>
      )}

      {/* ── Summary ─────────────────────────────────────────────────────────── */}
      {show.summary && (
        <>
          <SectionHeader title="Summary" expanded={expanded.summary_section} onToggle={() => toggle('summary_section')} issueCount={0} isVisible={true} />
          {expanded.summary_section !== false && (
            <Card style={{ marginBottom: 20 }}>
              <textarea style={{ ...inp, minHeight: 90, resize: 'vertical', lineHeight: 1.6 }}
                value={data.summary||''} onChange={e=>setData(p=>({...p,summary:e.target.value}))}
                placeholder="Senior engineer with 8+ years of experience..." />
            </Card>
          )}
        </>
      )}

      {/* ── Experience ──────────────────────────────────────────────────────── */}
      {show.experience && (
        <>
          <SectionHeader title="Experience" expanded={expanded.experience} onToggle={() => toggle('experience')} issueCount={expIssueCount} isVisible={true} />
          {expanded.experience && (
            <>
              {(data.experience||[]).map((job, expIdx) => {
                const jobIssueCount = (job.description||[]).filter(b => matchIssue(b, scanIssues)).length;
                return (
                  <Card key={expIdx} style={{ marginBottom: 14, position: 'relative', border: jobIssueCount > 0 ? `1px solid ${C.gold}33` : `1px solid ${C.border}` }}>
                    <button onClick={() => removeExp(expIdx)} style={{ position:'absolute', top:14, right:14, background:'transparent', border:'none', color:C.red, cursor:'pointer' }}><Trash2 size={14} /></button>
                    {jobIssueCount > 0 && (
                      <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, marginBottom: 12 }}>⚡ {jobIssueCount} AI {jobIssueCount===1?'fix':'fixes'} available below</div>
                    )}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                      <div><label style={lbl}>Company</label><input style={inp} value={job.company||''} onChange={e=>setExp(expIdx,'company',e.target.value)} /></div>
                      <div><label style={lbl}>Position</label><input style={inp} value={job.position||''} onChange={e=>setExp(expIdx,'position',e.target.value)} /></div>
                      <div><label style={lbl}>Start Date</label><input style={inp} value={job.startDate||''} onChange={e=>setExp(expIdx,'startDate',e.target.value)} placeholder="Jan 2022" /></div>
                      <div><label style={lbl}>End Date</label><input style={inp} value={job.endDate||''} onChange={e=>setExp(expIdx,'endDate',e.target.value)} placeholder="Present" /></div>
                    </div>
                    <label style={lbl}>Bullets</label>
                    {(job.description||[]).map((bullet, bIdx) => {
                      const issue = matchIssue(bullet, scanIssues);
                      const suggKey = `exp-${expIdx}-${bIdx}`;
                      const suggestion = suggestions[suggKey];
                      const issueColor = issue ? SEVERITY_COLOR[issue.severity] : null;
                      const hints = getBulletHints(bullet);
                      return (
                        <div key={bIdx} style={{ marginBottom: 6 }}>
                          <div style={{ position: 'relative' }}>
                            {issueColor && suggestion?.status !== 'accepted' && (
                              <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:issueColor, borderRadius:'3px 0 0 3px', zIndex:1 }} />
                            )}
                            {suggestion?.status === 'accepted' && (
                              <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:'#00C896', borderRadius:'3px 0 0 3px', zIndex:1 }} />
                            )}
                            <textarea
                              style={{ ...inp, minHeight: 52, paddingRight: 36, paddingLeft: issueColor ? 14 : inp.padding, resize:'vertical', borderColor: issueColor && suggestion?.status !== 'accepted' ? `${issueColor}55` : suggestion?.status === 'accepted' ? '#00C89655' : C.border }}
                              value={bullet}
                              onChange={e => setBullet(expIdx, bIdx, e.target.value)}
                              placeholder="Reduced latency by 40% by..."
                            />
                            <button onClick={() => removeBullet(expIdx, bIdx)} style={{ position:'absolute', top:8, right:8, background:`${C.red}15`, border:`1px solid ${C.red}33`, borderRadius:5, padding:4, color:C.red, cursor:'pointer' }}>
                              <X size={11} />
                            </button>
                          </div>

                          {/* Client-side hints (no AI cost) */}
                          {hints.length > 0 && !issue && bullet.length > 10 && (
                            <div style={{ display:'flex', gap:6, marginTop:3, flexWrap:'wrap' }}>
                              {hints.map((h,i) => (
                                <span key={i} style={{ fontSize:10, color:C.muted, background:`${C.muted}12`, padding:'2px 7px', borderRadius:4 }}>💡 {h}</span>
                              ))}
                            </div>
                          )}

                          {/* AI suggestion panel */}
                          {suggestion && suggestion.status !== 'skipped' && (
                            <SuggestionPanel
                              suggKey={suggKey}
                              suggestion={suggestion}
                              bullet={bullet}
                              onAccept={onAccept}
                              onSkip={onSkip}
                              onEdit={onEdit}
                              onUpdateEditText={onUpdateEditText}
                              onRegenerate={onRegenerate}
                            />
                          )}
                          {suggestion?.status === 'skipped' && (
                            <button onClick={() => onEdit(suggKey, false)}
                              style={{ fontSize:10, color:C.muted, background:'none', border:'none', cursor:'pointer', textDecoration:'underline', padding:'2px 0', display:'block' }}>
                              Show AI fix
                            </button>
                          )}
                        </div>
                      );
                    })}
                    <button onClick={() => addBullet(expIdx)} style={{ background:'transparent', border:'none', color:C.accent, fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:5, marginTop:6 }}>
                      <Plus size={12} /> Add Bullet
                    </button>
                  </Card>
                );
              })}
              <button onClick={addExp} style={{ ...dashed, marginBottom: 20 }}><Plus size={14} /> Add Experience</button>
            </>
          )}
        </>
      )}

      {/* ── Education ───────────────────────────────────────────────────────── */}
      {show.education && (
        <>
          <SectionHeader title="Education" expanded={expanded.education} onToggle={() => toggle('education')} issueCount={0} isVisible={true} />
          {expanded.education && (
            <>
              {(data.education||[]).map((edu,i) => (
                <Card key={i} style={{ marginBottom:12, position:'relative' }}>
                  <button onClick={()=>removeEdu(i)} style={{ position:'absolute', top:14, right:14, background:'transparent', border:'none', color:C.red, cursor:'pointer' }}><Trash2 size={14} /></button>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div style={{ gridColumn:'span 2' }}><label style={lbl}>School</label><input style={inp} value={edu.school||''} onChange={e=>setEdu(i,'school',e.target.value)} /></div>
                    <div style={{ gridColumn:'span 2' }}><label style={lbl}>Degree</label><input style={inp} value={edu.degree||''} onChange={e=>setEdu(i,'degree',e.target.value)} /></div>
                    <div><label style={lbl}>Year</label><input style={inp} value={edu.year||''} onChange={e=>setEdu(i,'year',e.target.value)} /></div>
                    <div><label style={lbl}>GPA (optional)</label><input style={inp} value={edu.gpa||''} onChange={e=>setEdu(i,'gpa',e.target.value)} /></div>
                  </div>
                </Card>
              ))}
              <button onClick={addEdu} style={{ ...dashed, marginBottom:20 }}><Plus size={14} /> Add Education</button>
            </>
          )}
        </>
      )}

      {/* ── Skills ──────────────────────────────────────────────────────────── */}
      {show.skills && (
        <>
          <SectionHeader title="Skills" expanded={expanded.skills} onToggle={() => toggle('skills')} issueCount={0} isVisible={true} />
          {expanded.skills && (
            <>
              {(data.skills||[]).map((cat,ci) => (
                <Card key={ci} style={{ marginBottom:12, position:'relative' }}>
                  <button onClick={()=>removeSkillCat(ci)} style={{ position:'absolute', top:14, right:14, background:'transparent', border:'none', color:C.red, cursor:'pointer' }}><Trash2 size={14} /></button>
                  <div style={{ marginBottom:10 }}>
                    <label style={lbl}>Category</label>
                    <input style={{ ...inp, maxWidth:200 }} value={cat.category||''} onChange={e=>setSkillCat(ci,e.target.value)} />
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                    {(cat.items||[]).map((item,ii) => (
                      <span key={ii} style={{ display:'flex', alignItems:'center', gap:5, background:`${C.accent}15`, border:`1px solid ${C.accent}33`, borderRadius:20, padding:'4px 10px', fontSize:11, color:C.accent, fontWeight:700 }}>
                        {item}
                        <button onClick={()=>removeSkillTag(ci,ii)} style={{ background:'none', border:'none', color:C.accent, cursor:'pointer', padding:0 }}><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                  <input style={{ ...inp, maxWidth:260 }} value={skillInputs[ci]||''}
                    onChange={e=>setSkillInputs(p=>({...p,[ci]:e.target.value}))}
                    onKeyDown={e=>{ if(e.key==='Enter'){e.preventDefault(); addSkillTag(ci,skillInputs[ci]||'');} }}
                    placeholder="Type a skill and press Enter" />
                </Card>
              ))}
              <button onClick={addSkillCat} style={{ ...dashed, marginBottom:20 }}><Plus size={14} /> Add Skill Category</button>
            </>
          )}
        </>
      )}

      {/* ── Projects ────────────────────────────────────────────────────────── */}
      {show.projects && (
        <>
          <SectionHeader title="Projects" expanded={expanded.projects} onToggle={() => toggle('projects')} issueCount={0} isVisible={true} />
          {expanded.projects && (
            <>
              {(data.projects||[]).map((proj,pi) => (
                <Card key={pi} style={{ marginBottom:12, position:'relative' }}>
                  <button onClick={()=>removeProj(pi)} style={{ position:'absolute', top:14, right:14, background:'transparent', border:'none', color:C.red, cursor:'pointer' }}><Trash2 size={14} /></button>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                    <div><label style={lbl}>Name</label><input style={inp} value={proj.name||''} onChange={e=>setProj(pi,'name',e.target.value)} /></div>
                    <div><label style={lbl}>Link</label><input style={inp} value={proj.link||''} onChange={e=>setProj(pi,'link',e.target.value)} /></div>
                  </div>
                  <div style={{ marginBottom:12 }}>
                    <label style={lbl}>Tech Stack</label>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
                      {(proj.techStack||[]).map((t,ti) => (
                        <span key={ti} style={{ display:'flex', alignItems:'center', gap:5, background:`${C.purple}15`, border:`1px solid ${C.purple}33`, borderRadius:20, padding:'4px 10px', fontSize:11, color:C.purple, fontWeight:700 }}>
                          {t}<button onClick={()=>removeTechTag(pi,ti)} style={{ background:'none', border:'none', color:C.purple, cursor:'pointer', padding:0 }}><X size={10} /></button>
                        </span>
                      ))}
                    </div>
                    <input style={{ ...inp, maxWidth:260 }} value={techInputs[pi]||''}
                      onChange={e=>setTechInputs(p=>({...p,[pi]:e.target.value}))}
                      onKeyDown={e=>{ if(e.key==='Enter'){e.preventDefault(); addTechTag(pi,techInputs[pi]||'');} }}
                      placeholder="Type tech and press Enter" />
                  </div>
                  <label style={lbl}>Bullets</label>
                  {(proj.description||[]).map((b,bi) => (
                    <textarea key={bi} style={{ ...inp, minHeight:50, resize:'vertical', marginBottom:8 }}
                      value={b} onChange={e=>setProjBullet(pi,bi,e.target.value)} placeholder="Built a real-time dashboard that..." />
                  ))}
                  <button onClick={()=>addProjBullet(pi)} style={{ background:'transparent', border:'none', color:C.accent, fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                    <Plus size={12} /> Add Bullet
                  </button>
                </Card>
              ))}
              <button onClick={addProj} style={{ ...dashed, marginBottom:20 }}><Plus size={14} /> Add Project</button>
            </>
          )}
        </>
      )}

      {/* ── Certifications ──────────────────────────────────────────────────── */}
      {show.certifications && (
        <>
          <SectionHeader title="Certifications" expanded={expanded.certifications} onToggle={() => toggle('certifications')} issueCount={0} isVisible={true} />
          {expanded.certifications && (
            <>
              {(data.certifications||[]).map((cert,i) => (
                <Card key={i} style={{ marginBottom:12, position:'relative' }}>
                  <button onClick={()=>removeCert(i)} style={{ position:'absolute', top:14, right:14, background:'transparent', border:'none', color:C.red, cursor:'pointer' }}><Trash2 size={14} /></button>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div style={{ gridColumn:'span 2' }}><label style={lbl}>Name</label><input style={inp} value={cert.name||''} onChange={e=>setCert(i,'name',e.target.value)} /></div>
                    <div><label style={lbl}>Issuer</label><input style={inp} value={cert.issuer||''} onChange={e=>setCert(i,'issuer',e.target.value)} /></div>
                    <div><label style={lbl}>Date</label><input style={inp} value={cert.date||''} onChange={e=>setCert(i,'date',e.target.value)} /></div>
                  </div>
                </Card>
              ))}
              <button onClick={addCert} style={{ ...dashed, marginBottom:20 }}><Plus size={14} /> Add Certification</button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default LeftPaneEditor;
