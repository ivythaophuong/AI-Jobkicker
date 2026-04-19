import React from 'react';

const blue = '#0984e3';

const ModernTemplate = ({ data, visibleSections = {} }) => {
  const { personalInfo, summary, experience, education, skills, projects, certifications } = data;
  const show = visibleSections;

  const sectionHeading = {
    fontSize: 13, fontWeight: 800, color: blue,
    borderBottom: '1px solid #dfe6e9', paddingBottom: 5, marginBottom: 12, textTransform: 'uppercase',
  };

  return (
    <div className="resume-preview modern-template" style={{
      background: '#FFFFFF', color: '#2d3436', width: '100%', maxWidth: '210mm', minHeight: '297mm',
      margin: '0 auto', padding: '15mm', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif"
    }}>

      {/* Header */}
      <header style={{ borderBottom: `3px solid ${blue}`, paddingBottom: 15, marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#2d3436', marginBottom: 5 }}>{personalInfo?.fullName || 'YOUR NAME'}</h1>
        <div style={{ fontSize: 10, color: '#636e72', display: 'flex', flexWrap: 'wrap', gap: 12, fontWeight: 600 }}>
          {personalInfo?.email && <span>✉ {personalInfo.email}</span>}
          {personalInfo?.phone && <span>✆ {personalInfo.phone}</span>}
          {personalInfo?.location && <span>⌖ {personalInfo.location}</span>}
          {personalInfo?.linkedin && <span>in {personalInfo.linkedin}</span>}
          {personalInfo?.website && <span>↗ {personalInfo.website}</span>}
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Summary */}
        {show.summary && summary && (
          <section>
            <h2 style={sectionHeading}>Executive Summary</h2>
            <p style={{ fontSize: 11, lineHeight: 1.6, color: '#2d3436', margin: 0 }}>{summary}</p>
          </section>
        )}

        {/* Experience */}
        {show.experience && experience?.length > 0 && (
          <section>
            <h2 style={sectionHeading}>Experience</h2>
            {experience.map((job, idx) => (
              <div key={idx} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 800 }}>{job.position}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: blue, background: '#f1f2f6', padding: '2px 8px', borderRadius: 4 }}>
                    {job.startDate}{job.endDate ? ` — ${job.endDate}` : ''}
                  </span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#636e72', marginBottom: 6 }}>{job.company}</div>
                <ul style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {job.description?.map((bullet, bIdx) => (
                    <li key={bIdx} style={{ fontSize: 10.5, lineHeight: 1.5 }}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {/* Projects */}
        {show.projects && projects?.length > 0 && (
          <section>
            <h2 style={sectionHeading}>Projects</h2>
            {projects.map((proj, idx) => (
              <div key={idx} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 800 }}>{proj.name}</span>
                  {proj.link && <span style={{ fontSize: 10, color: blue }}>{proj.link}</span>}
                </div>
                {proj.techStack?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
                    {proj.techStack.map((t, i) => (
                      <span key={i} style={{ fontSize: 9, background: '#f1f2f6', padding: '2px 7px', borderRadius: 4, fontWeight: 700, color: '#2d3436' }}>{t}</span>
                    ))}
                  </div>
                )}
                <ul style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {proj.description?.map((bullet, bIdx) => (
                    <li key={bIdx} style={{ fontSize: 10.5, lineHeight: 1.5 }}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {/* Education + Skills grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 28 }}>
          {show.education && education?.length > 0 && (
            <section>
              <h2 style={sectionHeading}>Education</h2>
              {education.map((edu, idx) => (
                <div key={idx} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800 }}>{edu.school}</div>
                  <div style={{ fontSize: 10, color: '#636e72' }}>
                    {edu.degree}{edu.year ? ` — ${edu.year}` : ''}{edu.gpa ? ` | GPA: ${edu.gpa}` : ''}
                  </div>
                </div>
              ))}
            </section>
          )}

          {show.skills && (skills || []).length > 0 && (
            <section>
              <h2 style={sectionHeading}>Skills</h2>
              {(skills || []).map((cat, catIdx) => (
                <div key={catIdx} style={{ marginBottom: 8 }}>
                  {cat.category && <div style={{ fontSize: 10, fontWeight: 800, marginBottom: 4, color: '#2d3436' }}>{cat.category}</div>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {cat.items?.map((s, i) => (
                      <span key={i} style={{ fontSize: 9, background: '#f1f2f6', padding: '3px 8px', borderRadius: 4, fontWeight: 700, color: '#2d3436', border: '1px solid #dfe6e9' }}>{s}</span>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>

        {/* Certifications */}
        {show.certifications && certifications?.length > 0 && (
          <section>
            <h2 style={sectionHeading}>Certifications</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {certifications.map((cert, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span><strong>{cert.name}</strong>{cert.issuer ? ` — ${cert.issuer}` : ''}</span>
                  <span style={{ color: '#636e72' }}>{cert.date}</span>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .modern-template, .modern-template * { visibility: visible !important; }
          .modern-template { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; padding: 15mm !important; }
        }
      `}</style>
    </div>
  );
};

export default ModernTemplate;
