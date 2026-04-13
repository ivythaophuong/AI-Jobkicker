import React, { useState, useEffect } from 'react';
import { Upload, FileText, Download, Eye, Edit3, Sparkles } from 'lucide-react';
import { C } from '../../styles/theme';
import { Card, Btn, Spinner } from '../../components/CommonUI';
import LeftPaneEditor from './components/LeftPaneEditor';
import RightPanePreview from './components/RightPanePreview';
import TemplateSelector from './components/TemplateSelector';
import { extractTextFromDocx, extractTextFromPdf, mapTextToResumeSchema } from '../../lib/resumeParser';

const ATSBuilder = ({ user, memory, updateMemory }) => {
  const [data, setData] = useState(memory.resumeData || {
    personalInfo: { fullName: '', email: '', phone: '', location: '', linkedin: '', website: '' },
    summary: '',
    experience: [],
    education: [],
    skills: []
  });
  
  const [activeView, setActiveView] = useState('edit'); 
  const [activeTemplateId, setActiveTemplateId] = useState(memory.activeTemplateId || 'harshibar');
  const [originalFileUrl, setOriginalFileUrl] = useState(memory.originalFileUrl || null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isParsing, setIsParsing] = useState(false);
  const [suggestion, setSuggestion] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    updateMemory(m => ({ ...m, resumeData: data, activeTemplateId, originalFileUrl }));
  }, [data, activeTemplateId, originalFileUrl]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Store original file URL for reference view
    const fileUrl = URL.createObjectURL(file);
    setOriginalFileUrl(fileUrl);

    setIsParsing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      let rawText = '';
      if (file.name.endsWith('.docx')) rawText = await extractTextFromDocx(arrayBuffer);
      else if (file.name.endsWith('.pdf')) rawText = await extractTextFromPdf(arrayBuffer);
      else { alert('Please upload a .docx or .pdf file'); return; }

      const structuredData = await mapTextToResumeSchema(rawText);
      setData(structuredData);
    } catch (err) {
      alert('Failed to parse file. Please try again.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSuggest = (expIdx, bIdx) => {
    const originalText = data.experience[expIdx].description[bIdx];
    setSuggestion({ expIdx, bIdx, text: `✨ AI Suggestion: Enhanced "${originalText}" with specific metrics and key-result mapping.` });
  };

  const applySuggestion = () => {
    const { expIdx, bIdx, text } = suggestion;
    const newExp = [...data.experience];
    newExp[expIdx].description[bIdx] = text;
    setData(prev => ({ ...prev, experience: newExp }));
    setSuggestion(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", background: C.bg, overflow: "hidden" }}>
      
      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <TemplateSelector 
          activeId={activeTemplateId} 
          data={data}
          onSelect={(id) => { setActiveTemplateId(id); setShowTemplateSelector(false); }}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}

      {/* Action Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", borderBottom: `1px solid ${C.border}`, background: C.surface }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: C.accent, color: "#000", padding: "8px 16px", borderRadius: 8, fontWeight: 800, fontSize: 13 }}>
            <Upload size={14} />
            <span>Import Profile</span>
            <input type="file" className="hidden" style={{ display: "none" }} accept=".pdf,.docx" onChange={handleFileUpload} />
          </label>
          <button 
            onClick={() => setShowTemplateSelector(true)}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: `1px solid ${C.border}`, color: C.text, padding: "8px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            <Sparkles size={14} color={C.accent} />
            <span>Choose Template</span>
          </button>
          {isParsing && <div style={{ color: C.accent, fontSize: 11, fontWeight: 700, animation: "pulse 2s infinite" }}>⚡ ANALYZING...</div>}
        </div>
        
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={() => window.print()} color={C.text}>
            <Download size={14} />
            <span className="hide-mobile">Export PDF</span>
          </Btn>
        </div>
      </div>

      {/* Workspace Area */}
      <div style={{ display: "flex", flex: 1, flexDirection: isMobile ? "column" : "row", overflow: "hidden", position: "relative" }}>
        
        {/* Mobile Navbar */}
        {isMobile && (
          <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", display: "flex", background: C.surface, border: `1px solid ${C.border}`, padding: 4, borderRadius: 50, zIndex: 1000, boxShadow: `0 10px 30px rgba(0,0,0,0.5)` }}>
            <button onClick={() => setActiveView('edit')} style={{ background: activeView === 'edit' ? C.accent : "transparent", color: activeView === 'edit' ? "#000" : C.muted, border: "none", padding: "8px 24px", borderRadius: 24, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Edit</button>
            <button onClick={() => setActiveView('preview')} style={{ background: activeView === 'preview' ? C.accent : "transparent", color: activeView === 'preview' ? "#000" : C.muted, border: "none", padding: "8px 24px", borderRadius: 24, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Preview</button>
          </div>
        )}

        {/* Editor Pane */}
        {(activeView === 'edit' || !isMobile) && (
          <div style={{ flex: 1, overflowY: "auto", borderRight: isMobile ? "none" : `1px solid ${C.border}`, background: C.bg }}>
            <LeftPaneEditor data={data} setData={setData} onSuggest={handleSuggest} />
          </div>
        )}

        {/* Preview Pane */}
        {(activeView === 'preview' || !isMobile) && (
          <div style={{ flex: 1, overflowY: "auto", background: C.surface + "88", padding: 24 }}>
            <div style={{ maxWidth: 850, margin: "0 auto", transform: isMobile ? "scale(0.8)" : "none", transformOrigin: "top" }}>
              <RightPanePreview data={data} templateId={activeTemplateId} originalFileUrl={originalFileUrl} />
            </div>
          </div>
        )}
      </div>

      {/* AI Suggestion Modal */}
      {suggestion && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <Card style={{ maxWidth: 500, width: "100%" }} glow={C.accent}>
             <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.accent, marginBottom: 16 }}>
               <Sparkles size={18} />
               <div style={{ fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>AI Enhancement</div>
             </div>
             <p style={{ color: C.text, fontSize: 14, lineHeight: 1.6, marginBottom: 24, fontStyle: "italic", background: C.bg, padding: 16, borderRadius: 12 }}>{suggestion.text}</p>
             <div style={{ display: "flex", gap: 12 }}>
               <Btn onClick={applySuggestion} color={C.accent} dark style={{ flex: 1 }}>Accept & Replace</Btn>
               <Btn onClick={() => setSuggestion(null)} color={C.muted} style={{ flex: 1 }}>Dismiss</Btn>
             </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ATSBuilder;
