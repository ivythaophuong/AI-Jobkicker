import React, { useState } from 'react';
import { Eye, FileText, CheckCircle2 } from 'lucide-react';
import { C } from '../../../styles/theme';
import StandardTemplate from '../templates/StandardTemplate';
import MinimalistTemplate from '../templates/MinimalistTemplate';
import ModernTemplate from '../templates/ModernTemplate';
import HarshibarTemplate from '../templates/HarshibarTemplate';

const RightPanePreview = ({ data, templateId = 'standard', originalFileUrl }) => {
  const [viewMode, setViewMode] = useState('preview'); // 'preview' or 'original'

  if (!data) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.muted, fontStyle: "italic", fontSize: 13 }}>
      Your PDF preview will appear here...
    </div>
  );

  const renderTemplate = () => {
    switch (templateId) {
      case 'harshibar': return <HarshibarTemplate data={data} />;
      case 'minimalist': return <MinimalistTemplate data={data} />;
      case 'modern': return <ModernTemplate data={data} />;
      case 'standard':
      default: return <StandardTemplate data={data} />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* View Toggle Bar */}
      <div style={{ display: "flex", background: C.bg, padding: 4, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 20, alignSelf: "center", width: "fit-content" }}>
        <button 
          onClick={() => setViewMode('preview')}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 800, background: viewMode === 'preview' ? C.accent : "transparent", color: viewMode === 'preview' ? "#000" : C.muted, transition: "all 0.2s" }}
        >
          <CheckCircle2 size={14} /> Optimized
        </button>
        <button 
          onClick={() => setViewMode('original')}
          disabled={!originalFileUrl}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 20px", borderRadius: 8, border: "none", cursor: originalFileUrl ? "pointer" : "not-allowed", fontSize: 11, fontWeight: 800, background: viewMode === 'original' ? C.accent : "transparent", color: viewMode === 'original' ? "#000" : C.muted, opacity: originalFileUrl ? 1 : 0.5, transition: "all 0.2s" }}
        >
          <FileText size={14} /> Original
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
        {viewMode === 'original' && originalFileUrl ? (
          <iframe 
            src={originalFileUrl} 
            style={{ width: "100%", height: "100%", border: "none", borderRadius: 12, background: C.surface }} 
            title="Original Resume"
          />
        ) : (
          renderTemplate()
        )}
      </div>
    </div>
  );
};

export default RightPanePreview;
