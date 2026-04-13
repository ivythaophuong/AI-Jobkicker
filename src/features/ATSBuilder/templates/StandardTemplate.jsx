import React from 'react';

const StandardTemplate = ({ data }) => {
  const { personalInfo, summary, experience, education, skills } = data;

  return (
    <div className="resume-preview standard-template" style={{ 
      background: "#FFFFFF", color: "#000", width: "100%", maxWidth: "210mm", minHeight: "297mm", 
      margin: "0 auto", padding: "12mm 15mm", boxSizing: "border-box", fontFamily: "'Times New Roman', Times, serif"
    }}>
      {/* Header - Centered */}
      <header style={{ textAlign: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 4 }}>{personalInfo?.fullName || 'YOUR NAME'}</h1>
        <div style={{ fontSize: 10, display: "flex", justifyContent: "center", gap: 10 }}>
          {personalInfo?.email && <span>{personalInfo.email}</span>}
          {personalInfo?.phone && <span>| {personalInfo.phone}</span>}
          {personalInfo?.linkedin && <span>| {personalInfo.linkedin}</span>}
          {personalInfo?.location && <span>| {personalInfo.location}</span>}
        </div>
      </header>

      {/* Sections mapping closely to "Jake's Resume" */}
      
      {/* Education */}
      <section style={{ marginBottom: 15 }}>
        <h2 style={{ fontSize: 12, fontWeight: "bold", textTransform: "uppercase", borderBottom: "1px solid #000", marginBottom: 6 }}>Education</h2>
        {education?.map((edu, idx) => (
          <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
            <div><span style={{ fontWeight: "bold" }}>{edu.school}</span>, {edu.degree}</div>
            <div style={{ fontWeight: "bold" }}>{edu.year}</div>
          </div>
        ))}
      </section>

      {/* Experience */}
      <section style={{ marginBottom: 15 }}>
        <h2 style={{ fontSize: 12, fontWeight: "bold", textTransform: "uppercase", borderBottom: "1px solid #000", marginBottom: 8 }}>Experience</h2>
        {experience?.map((job, idx) => (
          <div key={idx} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: "bold" }}>
              <span>{job.company}</span>
              <span>{job.startDate} — {job.endDate}</span>
            </div>
            <div style={{ fontSize: 11, fontStyle: "italic", marginBottom: 4 }}>{job.position}</div>
            <ul style={{ paddingLeft: 16, margin: 0 }}>
              {job.description?.map((bullet, bIdx) => (
                <li key={bIdx} style={{ fontSize: 10, lineHeight: 1.4, marginBottom: 2 }}>{bullet}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Skills */}
      <section style={{ marginBottom: 15 }}>
        <h2 style={{ fontSize: 12, fontWeight: "bold", textTransform: "uppercase", borderBottom: "1px solid #000", marginBottom: 6 }}>Technical Skills</h2>
        <div style={{ fontSize: 11 }}>
          <span style={{ fontWeight: "bold" }}>Skills: </span>
          {skills?.join(", ")}
        </div>
      </section>

      {/* Summary (Optional in this layout) */}
      {summary && (
        <section>
          <h2 style={{ fontSize: 12, fontWeight: "bold", textTransform: "uppercase", borderBottom: "1px solid #000", marginBottom: 6 }}>Professional Summary</h2>
          <p style={{ fontSize: 10, lineHeight: 1.4 }}>{summary}</p>
        </section>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .standard-template, .standard-template * { visibility: visible !important; }
          .standard-template { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; height: 100% !important; padding: 15mm !important; }
        }
      `}</style>
    </div>
  );
};

export default StandardTemplate;
