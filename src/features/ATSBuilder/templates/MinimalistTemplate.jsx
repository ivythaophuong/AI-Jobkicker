import React from 'react';

const MinimalistTemplate = ({ data, visibleSections = {} }) => {
  const { personalInfo, summary, experience, education, skills, projects, certifications } = data;
  const show = visibleSections;

  const sectionHeading = {
    fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
    borderBottom: '1.5px solid #111', marginBottom: 8, letterSpacing: '1px',
  };

  const flatSkills = (skills || []).flatMap(cat =>
    cat.items?.length ? [`${cat.category}: ${cat.items.join(' · ')}`] : []
  );

  return (
    <div className="resume-preview minimalist-template" style={{
      background: '#FFFFFF', color: '#111', width: '100%', maxWidth: '210mm', minHeight: '297mm',
      margin: '0 auto', padding: '10mm 12mm', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif"
    }}>

      {/* Header */}
      <header style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 3, letterSpacing: '-0.5px' }}>{personalInfo?.fullName || 'YOUR NAME'}</h1>
        <div style={{ fontSize: 9, color: '#444', display: 'flex', flexWrap: 'wrap', gap: 8, fontWeight: 500 }}>
          {personalInfo?.email && <span>{personalInfo.email}</span>}
          {personalInfo?.phone && <span>• {personalInfo.phone}</span>}
          {personalInfo?.location && <span>• {personalInfo.location}</span>}
          {personalInfo?.linkedin && <span>• {personalInfo.linkedin}</span>}
          {personalInfo?.website && <span>• {personalInfo.website}</span>}
        </div>
      </header>

      {/* Summary */}
      {show.summary && summary && (
        <section style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 10, lineHeight: 1.5, color: '#333', margin: 0 }}>{summary}</p>
        </section>
      )}

      {/* Experience */}
      {show.experience && experience?.length > 0 && (
        <section style={{ marginBottom: 12 }}>
          <h2 style={sectionHeading}>Experience</h2>
          {experience.map((job, idx) => (
            <div key={idx} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 11, fontWeight: 800 }}>{job.company}</span>
                <span style={{ fontSize: 9, fontWeight: 600 }}>{job.startDate}{job.endDate ? ` — ${job.endDate}` : ''}</span>
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#444', marginBottom: 3 }}>{job.position}</div>
              <ul style={{ paddingLeft: 12, margin: 0 }}>
                {job.description?.map((bullet, bIdx) => (
                  <li key={bIdx} style={{ fontSize: 9.5, lineHeight: 1.4, marginBottom: 1, color: '#333' }}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {show.projects && projects?.length > 0 && (
        <section style={{ marginBottom: 12 }}>
          <h2 style={sectionHeading}>Projects</h2>
          {projects.map((proj, idx) => (
            <div key={idx} style={{ marginBottom: 7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 10, fontWeight: 800 }}>{proj.name}</span>
                {proj.link && <span style={{ fontSize: 9, color: '#444' }}>{proj.link}</span>}
              </div>
              {proj.techStack?.length > 0 && (
                <div style={{ fontSize: 9, color: '#555', marginBottom: 2 }}>{proj.techStack.join(' · ')}</div>
              )}
              <ul style={{ paddingLeft: 12, margin: 0 }}>
                {proj.description?.map((bullet, bIdx) => (
                  <li key={bIdx} style={{ fontSize: 9.5, lineHeight: 1.4, marginBottom: 1, color: '#333' }}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {show.education && education?.length > 0 && (
        <section style={{ marginBottom: 12 }}>
          <h2 style={sectionHeading}>Education</h2>
          {education.map((edu, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontSize: 10 }}>
                <span style={{ fontWeight: 800 }}>{edu.school}</span> | {edu.degree}
                {edu.gpa ? ` | GPA: ${edu.gpa}` : ''}
              </div>
              <div style={{ fontSize: 9, fontWeight: 600 }}>{edu.year}</div>
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {show.skills && flatSkills.length > 0 && (
        <section style={{ marginBottom: 12 }}>
          <h2 style={sectionHeading}>Skills</h2>
          {flatSkills.map((line, i) => (
            <div key={i} style={{ fontSize: 9.5, lineHeight: 1.6 }}>{line}</div>
          ))}
        </section>
      )}

      {/* Certifications */}
      {show.certifications && certifications?.length > 0 && (
        <section>
          <h2 style={sectionHeading}>Certifications</h2>
          {certifications.map((cert, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, marginBottom: 3 }}>
              <span><strong>{cert.name}</strong>{cert.issuer ? ` — ${cert.issuer}` : ''}</span>
              <span style={{ color: '#555' }}>{cert.date}</span>
            </div>
          ))}
        </section>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .minimalist-template, .minimalist-template * { visibility: visible !important; }
          .minimalist-template { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; padding: 12mm !important; }
        }
      `}</style>
    </div>
  );
};

export default MinimalistTemplate;
