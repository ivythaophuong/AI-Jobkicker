import React from 'react';

const HarshibarTemplate = ({ data }) => {
  const { personalInfo, summary, experience, education, skills } = data;

  // Colors based on LaTeX definitions
  const colors = {
    lightGrey: "#D4D4D4", // gray:0.83
    darkGrey: "#4D4D4D",  // gray:0.3
    textGrey: "#141414"   // gray:0.08
  };

  return (
    <div className="resume-preview harshibar-template" style={{ 
      background: "#FFFFFF", color: colors.textGrey, width: "100%", maxWidth: "210mm", minHeight: "297mm", 
      margin: "0 auto", padding: "12mm 15mm", boxSizing: "border-box", fontFamily: "'Inter', sans-serif"
    }}>
      {/* Header - Harshibar Centered Style */}
      <header style={{ textAlign: "center", marginBottom: 15 }}>
        <h1 style={{ fontSize: 26, fontWeight: "900", marginBottom: 6, letterSpacing: "-0.5px" }}>
          {personalInfo?.fullName || 'YOUR NAME'}
        </h1>
        <div style={{ fontSize: 9.5, color: colors.textGrey, display: "flex", justifyContent: "center", gap: 8, fontWeight: 500 }}>
          {personalInfo?.phone && <span>{personalInfo.phone}</span>}
          <span> | </span>
          {personalInfo?.email && <span>{personalInfo.email}</span>}
          {personalInfo?.linkedin && <span> | {personalInfo.linkedin}</span>}
          {personalInfo?.location && <span> | {personalInfo.location}</span>}
        </div>
      </header>

      {/* Experience Section */}
      <section style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 13, fontWeight: "bold", textTransform: "uppercase", borderBottom: `2pt solid ${colors.lightGrey}`, paddingBottom: 2, marginBottom: 10 }}>
          Experience
        </h2>
        {experience?.map((job, idx) => (
          <div key={idx} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
              <span style={{ fontSize: 11, fontWeight: "bold" }}>{job.company}</span>
              <span style={{ fontSize: 10, color: colors.darkGrey }}>{job.startDate} — {job.endDate}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontStyle: "italic" }}>{job.position}</span>
              <span style={{ fontSize: 9.5, color: colors.darkGrey }}>{personalInfo?.location || ''}</span>
            </div>
            <ul style={{ paddingLeft: 18, margin: 0, listStyleType: "disc" }}>
              {job.description?.map((bullet, bIdx) => (
                <li key={bIdx} style={{ fontSize: 10, lineHeight: 1.4, marginBottom: 3 }}>{bullet}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Education Section */}
      <section style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 13, fontWeight: "bold", textTransform: "uppercase", borderBottom: `2pt solid ${colors.lightGrey}`, paddingBottom: 2, marginBottom: 10 }}>
          Education
        </h2>
        {education?.map((edu, idx) => (
          <div key={idx} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 11, fontWeight: "bold" }}>{edu.school}</span>
              <span style={{ fontSize: 10, color: colors.darkGrey }}>{edu.year}</span>
            </div>
            <div style={{ fontSize: 10, fontStyle: "italic" }}>{edu.degree}</div>
          </div>
        ))}
      </section>

      {/* Skills Section */}
      <section>
        <h2 style={{ fontSize: 13, fontWeight: "bold", textTransform: "uppercase", borderBottom: `2pt solid ${colors.lightGrey}`, paddingBottom: 2, marginBottom: 10 }}>
          Skills
        </h2>
        <div style={{ fontSize: 10, lineHeight: 1.5 }}>
          {skills?.join(" | ")}
        </div>
      </section>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .harshibar-template, .harshibar-template * { visibility: visible !important; }
          .harshibar-template { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; height: 100% !important; padding: 15mm !important; }
        }
      `}</style>
    </div>
  );
};

export default HarshibarTemplate;
