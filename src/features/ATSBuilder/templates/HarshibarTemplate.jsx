import React from 'react';

const HarshibarTemplate = ({ data, visibleSections = {} }) => {
  const { personalInfo, summary, experience, education, skills, projects, certifications } = data;
  const show = visibleSections;

  const lightGrey = '#D4D4D4';
  const darkGrey = '#4D4D4D';
  const textGrey = '#141414';

  const sectionHeading = {
    fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase',
    borderBottom: `2pt solid ${lightGrey}`, paddingBottom: 2, marginBottom: 10,
  };

  // Flatten skills for display
  const flatSkills = (skills || []).flatMap(cat =>
    cat.items?.length ? [`${cat.category}: ${cat.items.join(', ')}`] : []
  );

  return (
    <div className="resume-preview harshibar-template" style={{
      background: '#FFFFFF', color: textGrey, width: '100%', maxWidth: '210mm', minHeight: '297mm',
      margin: '0 auto', padding: '12mm 15mm', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif"
    }}>

      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: 15 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6, letterSpacing: '-0.5px' }}>
          {personalInfo?.fullName || 'YOUR NAME'}
        </h1>
        <div style={{ fontSize: 9.5, color: textGrey, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 6, fontWeight: 500 }}>
          {personalInfo?.phone && <span>{personalInfo.phone}</span>}
          {personalInfo?.email && <span>| {personalInfo.email}</span>}
          {personalInfo?.linkedin && <span>| {personalInfo.linkedin}</span>}
          {personalInfo?.website && <span>| {personalInfo.website}</span>}
          {personalInfo?.location && <span>| {personalInfo.location}</span>}
        </div>
      </header>

      {/* Summary */}
      {show.summary && summary && (
        <section style={{ marginBottom: 18 }}>
          <h2 style={sectionHeading}>Summary</h2>
          <p style={{ fontSize: 10, lineHeight: 1.5, margin: 0 }}>{summary}</p>
        </section>
      )}

      {/* Experience */}
      {show.experience && experience?.length > 0 && (
        <section style={{ marginBottom: 18 }}>
          <h2 style={sectionHeading}>Experience</h2>
          {experience.map((job, idx) => (
            <div key={idx} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 'bold' }}>{job.company}</span>
                <span style={{ fontSize: 10, color: darkGrey }}>{job.startDate}{job.endDate ? ` — ${job.endDate}` : ''}</span>
              </div>
              <div style={{ fontSize: 10, fontStyle: 'italic', marginBottom: 5 }}>{job.position}</div>
              <ul style={{ paddingLeft: 18, margin: 0, listStyleType: 'disc' }}>
                {job.description?.map((bullet, bIdx) => (
                  <li key={bIdx} style={{ fontSize: 10, lineHeight: 1.4, marginBottom: 3 }}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {show.projects && projects?.length > 0 && (
        <section style={{ marginBottom: 18 }}>
          <h2 style={sectionHeading}>Projects</h2>
          {projects.map((proj, idx) => (
            <div key={idx} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 'bold' }}>{proj.name}</span>
                {proj.link && <span style={{ fontSize: 9, color: darkGrey }}>{proj.link}</span>}
              </div>
              {proj.techStack?.length > 0 && (
                <div style={{ fontSize: 9.5, color: darkGrey, fontStyle: 'italic', marginBottom: 4 }}>{proj.techStack.join(' · ')}</div>
              )}
              <ul style={{ paddingLeft: 18, margin: 0, listStyleType: 'disc' }}>
                {proj.description?.map((bullet, bIdx) => (
                  <li key={bIdx} style={{ fontSize: 10, lineHeight: 1.4, marginBottom: 3 }}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {show.education && education?.length > 0 && (
        <section style={{ marginBottom: 18 }}>
          <h2 style={sectionHeading}>Education</h2>
          {education.map((edu, idx) => (
            <div key={idx} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 11, fontWeight: 'bold' }}>{edu.school}</span>
                <span style={{ fontSize: 10, color: darkGrey }}>{edu.year}</span>
              </div>
              <div style={{ fontSize: 10, fontStyle: 'italic' }}>
                {edu.degree}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {show.skills && flatSkills.length > 0 && (
        <section style={{ marginBottom: 18 }}>
          <h2 style={sectionHeading}>Skills</h2>
          <div style={{ fontSize: 10, lineHeight: 1.6 }}>
            {flatSkills.map((line, i) => <div key={i}>{line}</div>)}
          </div>
        </section>
      )}

      {/* Certifications */}
      {show.certifications && certifications?.length > 0 && (
        <section>
          <h2 style={sectionHeading}>Certifications</h2>
          {certifications.map((cert, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 4 }}>
              <span><strong>{cert.name}</strong>{cert.issuer ? ` — ${cert.issuer}` : ''}</span>
              <span style={{ color: darkGrey }}>{cert.date}</span>
            </div>
          ))}
        </section>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .harshibar-template, .harshibar-template * { visibility: visible !important; }
          .harshibar-template { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; padding: 15mm !important; }
        }
      `}</style>
    </div>
  );
};

export default HarshibarTemplate;
