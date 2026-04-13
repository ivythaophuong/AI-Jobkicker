import React from 'react';

const MinimalistTemplate = ({ data }) => {
  const { personalInfo, summary, experience, education, skills } = data;

  return (
    <div className="resume-preview minimalist-template" style={{ 
      background: "#FFFFFF", color: "#111", width: "100%", maxWidth: "210mm", minHeight: "297mm", 
      margin: "0 auto", padding: "10mm 12mm", boxSizing: "border-box", fontFamily: "'Inter', sans-serif"
    }}>
      {/* Header - Left Aligned */}
      <header style={{ marginBottom: 15 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 2, letterSpacing: "-0.5px" }}>{personalInfo?.fullName || 'YOUR NAME'}</h1>
        <div style={{ fontSize: 9, color: "#444", display: "flex", gap: 8, fontWeight: 500 }}>
          {personalInfo?.email && <span>{personalInfo.email}</span>}
          {personalInfo?.phone && <span>• {personalInfo.phone}</span>}
          {personalInfo?.location && <span>• {personalInfo.location}</span>}
          {personalInfo?.linkedin && <span>• {personalInfo.linkedin}</span>}
        </div>
      </header>

      {/* Professional Summary */}
      {summary && (
        <section style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 10, lineHeight: 1.5, color: "#333" }}>{summary}</p>
        </section>
      )}

      {/* Experience */}
      <section style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", borderBottom: "1.5px solid #111", marginBottom: 8, letterSpacing: "1px" }}>Experience</h2>
        {experience?.map((job, idx) => (
          <div key={idx} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 11, fontWeight: 800 }}>{job.company}</span>
              <span style={{ fontSize: 9, fontWeight: 600 }}>{job.startDate} — {job.endDate}</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#444", marginBottom: 3 }}>{job.position}</div>
            <ul style={{ paddingLeft: 12, margin: 0 }}>
              {job.description?.map((bullet, bIdx) => (
                <li key={bIdx} style={{ fontSize: 9.5, lineHeight: 1.4, marginBottom: 1, color: "#333" }}>{bullet}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Education */}
      <section style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", borderBottom: "1.5px solid #111", marginBottom: 8, letterSpacing: "1px" }}>Education</h2>
        {education?.map((edu, idx) => (
          <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontSize: 10 }}><span style={{ fontWeight: 800 }}>{edu.school}</span> | {edu.degree}</div>
            <div style={{ fontSize: 9, fontWeight: 600 }}>{edu.year}</div>
          </div>
        ))}
      </section>

      {/* Skills */}
      <section>
        <h2 style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", borderBottom: "1.5px solid #111", marginBottom: 8, letterSpacing: "1px" }}>Skills</h2>
        <div style={{ fontSize: 9.5, lineHeight: 1.5 }}>
          {skills?.join(" • ")}
        </div>
      </section>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .minimalist-template, .minimalist-template * { visibility: visible !important; }
          .minimalist-template { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; height: 100% !important; padding: 12mm !important; }
        }
      `}</style>
    </div>
  );
};

export default MinimalistTemplate;
