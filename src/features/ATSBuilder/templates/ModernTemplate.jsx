import React from 'react';

const ModernTemplate = ({ data }) => {
  const { personalInfo, summary, experience, education, skills } = data;

  return (
    <div className="resume-preview modern-template" style={{ 
      background: "#FFFFFF", color: "#2d3436", width: "100%", maxWidth: "210mm", minHeight: "297mm", 
      margin: "0 auto", padding: "15mm", boxSizing: "border-box", fontFamily: "'Inter', sans-serif"
    }}>
      {/* Header - Modern Bar */}
      <header style={{ borderBottom: "3px solid #0984e3", paddingBottom: 15, marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#2d3436", marginBottom: 5 }}>{personalInfo?.fullName || 'YOUR NAME'}</h1>
        <div style={{ fontSize: 10, color: "#636e72", display: "flex", flexWrap: "wrap", gap: 12, fontWeight: 600 }}>
          {personalInfo?.email && <span style={{ display: "flex", alignItems: "center", gap: 4 }}>✉️ {personalInfo.email}</span>}
          {personalInfo?.phone && <span style={{ display: "flex", alignItems: "center", gap: 4 }}>📞 {personalInfo.phone}</span>}
          {personalInfo?.location && <span style={{ display: "flex", alignItems: "center", gap: 4 }}>📍 {personalInfo.location}</span>}
          {personalInfo?.linkedin && <span style={{ display: "flex", alignItems: "center", gap: 4 }}>🔗 {personalInfo.linkedin}</span>}
        </div>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Summary */}
        {summary && (
          <section>
            <h2 style={{ fontSize: 13, fontWeight: 800, color: "#0984e3", borderBottom: "1px solid #dfe6e9", paddingBottom: 5, marginBottom: 10, textTransform: "uppercase" }}>Executive Summary</h2>
            <p style={{ fontSize: 11, lineHeight: 1.6, color: "#2d3436" }}>{summary}</p>
          </section>
        )}

        {/* Experience */}
        <section>
          <h2 style={{ fontSize: 13, fontWeight: 800, color: "#0984e3", borderBottom: "1px solid #dfe6e9", paddingBottom: 5, marginBottom: 15, textTransform: "uppercase" }}>Core Experience</h2>
          {experience?.map((job, idx) => (
            <div key={idx} style={{ marginBottom: 15 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#2d3436" }}>{job.position}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#0984e3", background: "#f1f2f6", padding: "2px 8px", borderRadius: 4 }}>{job.startDate} — {job.endDate}</span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#636e72", marginBottom: 8 }}>{job.company}</div>
              <ul style={{ paddingLeft: 18, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                {job.description?.map((bullet, bIdx) => (
                  <li key={bIdx} style={{ fontSize: 10.5, lineHeight: 1.5, color: "#2d3436" }}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* Education & Skills Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 30 }}>
            <section>
                <h2 style={{ fontSize: 13, fontWeight: 800, color: "#0984e3", borderBottom: "1px solid #dfe6e9", paddingBottom: 5, marginBottom: 10, textTransform: "uppercase" }}>Education</h2>
                {education?.map((edu, idx) => (
                    <div key={idx} style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 800 }}>{edu.school}</div>
                        <div style={{ fontSize: 10, color: "#636e72" }}>{edu.degree} — {edu.year}</div>
                    </div>
                ))}
            </section>
            <section>
                <h2 style={{ fontSize: 13, fontWeight: 800, color: "#0984e3", borderBottom: "1px solid #dfe6e9", paddingBottom: 5, marginBottom: 10, textTransform: "uppercase" }}>Technical Proficiency</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {skills?.map((s, idx) => (
                        <span key={idx} style={{ fontSize: 9, background: "#f1f2f6", padding: "3px 8px", borderRadius: 4, fontWeight: 700, color: "#2d3436", border: "1px solid #dfe6e9" }}>{s}</span>
                    ))}
                </div>
            </section>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .modern-template, .modern-template * { visibility: visible !important; }
          .modern-template { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; height: 100% !important; padding: 15mm !important; }
        }
      `}</style>
    </div>
  );
};

export default ModernTemplate;
