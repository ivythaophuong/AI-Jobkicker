import React from 'react';

const StandardTemplate = ({ data, visibleSections = {} }) => {
  const { personalInfo, summary, experience, education, skills, projects, certifications } = data;
  const show = visibleSections;

  const sectionHeading = {
    fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase',
    borderBottom: '1px solid #000', marginBottom: 6,
  };

  const flatSkills = (skills || []).flatMap(cat =>
    cat.items?.length ? [`${cat.category}: ${cat.items.join(', ')}`] : []
  );

  return (
    <div className="resume-preview standard-template" style={{
      background: '#FFFFFF', color: '#000', width: '100%', maxWidth: '210mm', minHeight: '297mm',
      margin: '0 auto', padding: '12mm 15mm', boxSizing: 'border-box', fontFamily: "'Times New Roman', Times, serif"
    }}>

      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>{personalInfo?.fullName || 'YOUR NAME'}</h1>
        <div style={{ fontSize: 10, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8 }}>
          {personalInfo?.email && <span>{personalInfo.email}</span>}
          {personalInfo?.phone && <span>| {personalInfo.phone}</span>}
          {personalInfo?.location && <span>| {personalInfo.location}</span>}
          {personalInfo?.linkedin && <span>| {personalInfo.linkedin}</span>}
          {personalInfo?.website && <span>| {personalInfo.website}</span>}
        </div>
      </header>

      {/* Summary */}
      {show.summary && summary && (
        <section style={{ marginBottom: 15 }}>
          <h2 style={sectionHeading}>Professional Summary</h2>
          <p style={{ fontSize: 10, lineHeight: 1.4, margin: 0 }}>{summary}</p>
        </section>
      )}

      {/* Education */}
      {show.education && education?.length > 0 && (
        <section style={{ marginBottom: 15 }}>
          <h2 style={sectionHeading}>Education</h2>
          {education.map((edu, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <div><span style={{ fontWeight: 'bold' }}>{edu.school}</span>, {edu.degree}{edu.gpa ? ` (GPA: ${edu.gpa})` : ''}</div>
              <div style={{ fontWeight: 'bold' }}>{edu.year}</div>
            </div>
          ))}
        </section>
      )}

      {/* Experience */}
      {show.experience && experience?.length > 0 && (
        <section style={{ marginBottom: 15 }}>
          <h2 style={sectionHeading}>Experience</h2>
          {experience.map((job, idx) => (
            <div key={idx} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 'bold' }}>
                <span>{job.company}</span>
                <span>{job.startDate}{job.endDate ? ` — ${job.endDate}` : ''}</span>
              </div>
              <div style={{ fontSize: 11, fontStyle: 'italic', marginBottom: 4 }}>{job.position}</div>
              <ul style={{ paddingLeft: 16, margin: 0 }}>
                {job.description?.map((bullet, bIdx) => (
                  <li key={bIdx} style={{ fontSize: 10, lineHeight: 1.4, marginBottom: 2 }}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {show.projects && projects?.length > 0 && (
        <section style={{ marginBottom: 15 }}>
          <h2 style={sectionHeading}>Projects</h2>
          {projects.map((proj, idx) => (
            <div key={idx} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 'bold' }}>
                <span>{proj.name}{proj.techStack?.length > 0 ? ` | ${proj.techStack.join(', ')}` : ''}</span>
                {proj.link && <span style={{ fontWeight: 'normal', fontStyle: 'italic' }}>{proj.link}</span>}
              </div>
              <ul style={{ paddingLeft: 16, margin: 0 }}>
                {proj.description?.map((bullet, bIdx) => (
                  <li key={bIdx} style={{ fontSize: 10, lineHeight: 1.4, marginBottom: 2 }}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {show.skills && flatSkills.length > 0 && (
        <section style={{ marginBottom: 15 }}>
          <h2 style={sectionHeading}>Technical Skills</h2>
          {flatSkills.map((line, i) => (
            <div key={i} style={{ fontSize: 11, marginBottom: 2 }}>{line}</div>
          ))}
        </section>
      )}

      {/* Certifications */}
      {show.certifications && certifications?.length > 0 && (
        <section>
          <h2 style={sectionHeading}>Certifications</h2>
          {certifications.map((cert, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
              <span><strong>{cert.name}</strong>{cert.issuer ? ` — ${cert.issuer}` : ''}</span>
              <span>{cert.date}</span>
            </div>
          ))}
        </section>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .standard-template, .standard-template * { visibility: visible !important; }
          .standard-template { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; padding: 15mm !important; }
        }
      `}</style>
    </div>
  );
};

export default StandardTemplate;
