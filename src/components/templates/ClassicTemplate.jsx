export default function ClassicTemplate({ data, sections }) {
  const { personal, education, work, internship, projects, skills, certificates, selfEval } = data;

  const s = {
    page: { fontFamily: "'Merriweather', 'Noto Serif SC', Georgia, serif", padding: '40px', background: '#fff', color: '#3d3d3d', lineHeight: 1.6, fontSize: 14 },
    name: { fontSize: 32, fontWeight: 700, color: '#c0392b', textAlign: 'center', margin: '0 0 8px', letterSpacing: 3 },
    contactLine: { textAlign: 'center', fontSize: 12, color: '#7f8c8d', marginBottom: 20, display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' },
    redLine: { height: 2, background: '#c0392b', border: 'none', margin: '0 0 24px' },
    sectionTitle: { fontSize: 13, fontWeight: 700, color: '#2c3e50', textTransform: 'uppercase', letterSpacing: 2.5, margin: '28px 0 12px', paddingBottom: 6, borderBottom: '1px solid #e0e0e0' },
    entry: { marginBottom: 18 },
    entryHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
    entryTitle: { fontSize: 15, fontWeight: 600, color: '#2c3e50', margin: 0 },
    entryDate: { fontSize: 12, color: '#95a5a6', fontStyle: 'italic', flexShrink: 0 },
    entrySub: { fontSize: 13, color: '#7f8c8d', margin: '2px 0 0' },
    entryDesc: { fontSize: 13, color: '#3d3d3d', margin: '6px 0 0', lineHeight: 1.7 },
    bullet: { fontSize: 13, color: '#3d3d3d', marginBottom: 3, paddingLeft: 14 },
    skillTag: { display: 'inline-block', background: '#ecf0f1', color: '#2c3e50', padding: '4px 12px', borderRadius: 4, fontSize: 12, margin: '0 6px 6px 0' },
    photo: { width: 80, height: 100, objectFit: 'cover', borderRadius: 4, border: '2px solid #e0e0e0', display: 'block', margin: '0 auto 16px' },
  };

  return (
    <div style={s.page}>
      {personal.photo && <img src={personal.photo} alt="" style={s.photo} />}
      <h1 style={s.name}>{personal.name || '你的姓名'}</h1>
      {personal.title && <p style={{ textAlign: 'center', fontSize: 14, color: '#7f8c8d', margin: '0 0 12px', fontStyle: 'italic' }}>{personal.title}</p>}
      <div style={s.contactLine}>
        {personal.phone && <span>{personal.phone}</span>}
        {personal.email && <span>{personal.email}</span>}
        {personal.location && <span>{personal.location}</span>}
        {personal.website && <span>{personal.website}</span>}
      </div>
      <hr style={s.redLine} />

      {personal.summary && (
        <div style={{ marginBottom: 8 }}>
          <h2 style={s.sectionTitle}>个人简介</h2>
          <p style={{ fontSize: 13, color: '#3d3d3d', margin: 0, lineHeight: 1.8 }}>{personal.summary}</p>
        </div>
      )}

      {sections.includes('work') && work.length > 0 && (
        <div>
          <h2 style={s.sectionTitle}>工作经历</h2>
          {work.map((w) => (
            <div key={w.id} style={s.entry}>
              <div style={s.entryHeader}>
                <span style={s.entryTitle}>{w.company} · {w.position}</span>
                <span style={s.entryDate}>{w.startDate} — {w.endDate}</span>
              </div>
              {w.description && <p style={s.entryDesc}>{w.description}</p>}
              {w.achievements?.filter(Boolean).length > 0 && w.achievements.filter(Boolean).map((a, i) => <p key={i} style={s.bullet}>• {a}</p>)}
            </div>
          ))}
        </div>
      )}

      {sections.includes('internship') && internship.length > 0 && (
        <div>
          <h2 style={s.sectionTitle}>实习经历</h2>
          {internship.map((i) => (
            <div key={i.id} style={s.entry}>
              <div style={s.entryHeader}>
                <span style={s.entryTitle}>{i.company} · {i.position}</span>
                <span style={s.entryDate}>{i.startDate} — {i.endDate}</span>
              </div>
              {i.description && <p style={s.entryDesc}>{i.description}</p>}
              {i.achievements?.filter(Boolean).length > 0 && i.achievements.filter(Boolean).map((a, idx) => <p key={idx} style={s.bullet}>• {a}</p>)}
            </div>
          ))}
        </div>
      )}

      {sections.includes('education') && education.length > 0 && (
        <div>
          <h2 style={s.sectionTitle}>教育背景</h2>
          {education.map((edu) => (
            <div key={edu.id} style={s.entry}>
              <div style={s.entryHeader}>
                <span style={s.entryTitle}>{edu.school}</span>
                <span style={s.entryDate}>{edu.startDate} — {edu.endDate}</span>
              </div>
              <p style={s.entrySub}>{edu.degree} · {edu.major}{edu.gpa ? ` · GPA: ${edu.gpa}` : ''}</p>
              {edu.description && <p style={s.entryDesc}>{edu.description}</p>}
            </div>
          ))}
        </div>
      )}

      {sections.includes('projects') && projects.length > 0 && (
        <div>
          <h2 style={s.sectionTitle}>项目经历</h2>
          {projects.map((p) => (
            <div key={p.id} style={s.entry}>
              <div style={s.entryHeader}>
                <span style={s.entryTitle}>{p.name}{p.role ? ` · ${p.role}` : ''}</span>
                <span style={s.entryDate}>{p.startDate} — {p.endDate}</span>
              </div>
              {p.techStack && <p style={{ fontSize: 12, color: '#95a5a6', margin: '2px 0 0', fontStyle: 'italic' }}>技术栈：{p.techStack}</p>}
              {p.description && <p style={s.entryDesc}>{p.description}</p>}
              {p.achievements?.filter(Boolean).length > 0 && p.achievements.filter(Boolean).map((a, idx) => <p key={idx} style={s.bullet}>• {a}</p>)}
            </div>
          ))}
        </div>
      )}

      {sections.includes('skills') && skills.length > 0 && (
        <div>
          <h2 style={s.sectionTitle}>技能与证书</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {skills.map((sk, i) => <span key={i} style={s.skillTag}>{sk}</span>)}
          </div>
          {certificates.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {certificates.map((c) => (
                <div key={c.id} style={{ fontSize: 13, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 500 }}>{c.name}</span>
                  <span style={{ color: '#95a5a6', fontStyle: 'italic' }}>{c.issuer}{c.date ? ` · ${c.date}` : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {sections.includes('selfEval') && selfEval && (
        <div>
          <h2 style={s.sectionTitle}>自我评价</h2>
          <p style={{ fontSize: 13, color: '#3d3d3d', margin: 0, lineHeight: 1.8 }}>{selfEval}</p>
        </div>
      )}
    </div>
  );
}
