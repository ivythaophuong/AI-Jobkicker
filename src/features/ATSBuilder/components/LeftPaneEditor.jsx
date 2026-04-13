import React from 'react';
import { Sparkles, Trash2, Plus } from 'lucide-react';
import { C } from '../../../styles/theme';
import { Card } from '../../../components/CommonUI';

const LeftPaneEditor = ({ data, setData, onSuggest }) => {
  const updatePersonalInfo = (field, val) => {
    setData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, [field]: val } }));
  };

  const updateExperience = (idx, field, val) => {
    const newExp = [...data.experience];
    newExp[idx] = { ...newExp[idx], [field]: val };
    setData(prev => ({ ...prev, experience: newExp }));
  };

  const addExperience = () => {
    setData(prev => ({ ...prev, experience: [...prev.experience, { company: '', position: '', startDate: '', endDate: '', description: [''] }] }));
  };

  const removeExperience = (idx) => {
    setData(prev => ({ ...prev, experience: prev.experience.filter((_, i) => i !== idx) }));
  };

  const updateBullet = (expIdx, bIdx, val) => {
    const newExp = [...data.experience];
    newExp[expIdx].description[bIdx] = val;
    setData(prev => ({ ...prev, experience: newExp }));
  };

  const addBullet = (expIdx) => {
    const newExp = [...data.experience];
    newExp[expIdx].description.push('');
    setData(prev => ({ ...prev, experience: newExp }));
  };

  const inputStyle = {
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: "10px 14px",
    color: C.text,
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.2s ease"
  };

  return (
    <div style={{ padding: 24, paddingBottom: 100, maxWidth: 640, margin: "0 auto", animation: "fadeIn 0.4s ease" }}>
      <div className="section-label" style={{ textAlign: "left", marginBottom: 24 }}>1. Profile Structure</div>

      {/* Personal Info */}
      <Card style={{ marginBottom: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ gridColumn: "span 2" }}>
            <label className="t-label" style={{ marginBottom: 8, display: "block" }}>Full Name</label>
            <input style={inputStyle} value={data.personalInfo.fullName} onChange={e => updatePersonalInfo('fullName', e.target.value)} />
          </div>
          <div>
            <label className="t-label" style={{ marginBottom: 8, display: "block" }}>Email</label>
            <input style={inputStyle} value={data.personalInfo.email} onChange={e => updatePersonalInfo('email', e.target.value)} />
          </div>
          <div>
            <label className="t-label" style={{ marginBottom: 8, display: "block" }}>Phone</label>
            <input style={inputStyle} value={data.personalInfo.phone} onChange={e => updatePersonalInfo('phone', e.target.value)} />
          </div>
        </div>
      </Card>

      <div className="section-label" style={{ textAlign: "left", marginBottom: 24 }}>2. Work History</div>

      {/* Experience */}
      {data.experience.map((job, idx) => (
        <Card key={idx} style={{ marginBottom: 20, position: "relative" }}>
          <button onClick={() => removeExperience(idx)} style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", color: C.red, cursor: "pointer", padding: 4 }}>
            <Trash2 size={16} />
          </button>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <label className="t-label" style={{ marginBottom: 8, display: "block" }}>Company</label>
              <input style={inputStyle} value={job.company} onChange={e => updateExperience(idx, 'company', e.target.value)} />
            </div>
            <div>
              <label className="t-label" style={{ marginBottom: 8, display: "block" }}>Position</label>
              <input style={inputStyle} value={job.position} onChange={e => updateExperience(idx, 'position', e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="t-label" style={{ marginBottom: 8, display: "block" }}>Impact & Results</label>
            {job.description.map((bullet, bIdx) => (
              <div key={bIdx} style={{ position: "relative", marginBottom: 10 }}>
                <textarea 
                  style={{ ...inputStyle, minHeight: 60, paddingRight: 40, resize: "vertical" }} 
                  value={bullet} 
                  onChange={e => updateBullet(idx, bIdx, e.target.value)}
                  placeholder="e.g. Optimized SQL queries, improving load times by 40%..."
                />
                <button 
                  onClick={() => onSuggest(idx, bIdx)}
                  style={{ position: "absolute", top: 10, right: 10, background: `${C.accent}15`, border: `1px solid ${C.accent}33`, borderRadius: 6, padding: 6, color: C.accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  title="Enhance with AI"
                >
                  <Sparkles size={14} />
                </button>
              </div>
            ))}
            <button onClick={() => addBullet(idx)} style={{ background: "transparent", border: "none", color: C.accent, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <Plus size={12} /> Add Result
            </button>
          </div>
        </Card>
      ))}

      <button onClick={addExperience} style={{ width: "100%", padding: 16, border: `2px dashed ${C.border}`, borderRadius: 12, background: "transparent", color: C.muted, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <Plus size={16} /> Add Experience Block
      </button>
    </div>
  );
};

export default LeftPaneEditor;
