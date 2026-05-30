export default function ExecutiveTemplate({ data, sections }) {
  const { personal, education, work, internship, projects, skills, certificates, selfEval } = data;

  const s = {
    page: { fontFamily: "'Nunito Sans', 'Noto Sans SC', system-ui, sans-serif", padding: '32px 36px', background: '#eef2f5', color: '#333', lineHeight: 1.7, fontSize: 15 },
    profileCard: { background: '#fff', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: '28px 32px', marginBottom: 20, textAlign: 'center', position: 'relative', overflow: 'hidden' },
    accentBar: { position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: '#4a6c8f', borderRadius: '12px 0 0 12px' },
    photo: { width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', display: 'block', margin: '0 auto 12px', border: '3px solid #e6edf3' },
    name: { fontSize: 26, fontWeight: 700, color: '#4a6c8f', margin: 0 },
    jobTitle: { fontSize: 13, color: '#888', margin: '4px 0 12px' },
    contactRow: { display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap', fontSize: 12, color: '#777' },
    contactItem: { display: 'flex', alignItems: 'center', gap: 5 },
    card: { background: '#fff', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: '20px 24px', marginBottom: 20, position: 'relative', overflow: 'hidden' },
    cardTitle: { fontSize: 15, fontWeight: 700, color: '#4a6c8f', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 },
    cardTitleDot: { width: 8, height: 8, borderRadius: '50%', background: '#d4a373', flexShrink: 0 },
    entry: { marginBottom: 16 },
    entryHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
    entryTitle: { fontSize: 14, fontWeight: 600, color: '#333', margin: 0 },
    entryDate: { fontSize: 11, color: '#aaa', fontStyle: 'italic', flexShrink: 0 },
    entrySub: { fontSize: 13, color: '#777', margin: '2px 0 0' },
    entryDesc: { fontSize: 13, color: '#555', margin: '6px 0 0' },
    bullet: { fontSize: 13, color: '#555', marginBottom: 3, display: 'flex', gap: 6 },
    bulletDot: { color: '#d4a373', fontWeight: 700, flexShrink: 0 },
    skillTag: { display: 'inline-block', background: '#e6edf3', color: '#4a6c8f', padding: '4px 14px', borderRadius: 20, fontSize: 12, margin: '0 6px 6px 0', fontWeight: 500 },
  };

  const Card = ({ title, children, accent = '#4a6c8f' }) => (
    <div style={s.card}>
      <div style={{ ...s.accentBar, background: accent }} />
      <h3 style={s.cardTitle}><span style={{ ...s.cardTitleDot, background: accent }} />{title}</h3>
      <div style={{ paddingLeft: 16 }}>{children}</div>
    </div>
  );

  return (
    <div style={s.page}>
      {/* Profile card */}
      <div style={s.profileCard}>
        <div style={s.accentBar} />
        {personal.photo ? <img src={personal.photo} alt="" style={s.photo} /> : <div style={{ ...s.photo, background: '#e6edf3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#4a6c8f' }}>{personal.name?.[0] || '?'}</div>}
        <h1 style={s.name}>{personal.name || '你的姓名'}</h1>
        {personal.title && <p style={s.jobTitle}>{personal.title}</p>}
        <div style={s.contactRow}>
          {personal.phone && <span style={s.contactItem}>📞 {personal.phone}</span>}
          {personal.email && <span style={s.contactItem}>✉️ {personal.email}</span>}
          {personal.location && <span style={s.contactItem}>📍 {personal.location}</span>}
          {personal.website && <span style={s.contactItem}>🔗 {personal.website}</span>}
        </div>
      </div>

      {personal.summary && (
        <Card title="个人简介">
          <p style={{ fontSize: 13, color: '#555', margin: 0 }}>{personal.summary}</p>
        </Card>
      )}

      {sections.includes('education') && education.length > 0 && (
        <Card title="教育经历" accent="#4a6c8f">
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
        </Card>
      )}

      {sections.includes('work') && work.length > 0 && (
        <Card title="工作经历" accent="#4a6c8f">
          {work.map((w) => (
            <div key={w.id} style={s.entry}>
              <div style={s.entryHeader}>
                <span style={s.entryTitle}>{w.company} · {w.position}</span>
                <span style={s.entryDate}>{w.startDate} — {w.endDate}</span>
              </div>
              {w.description && <p style={s.entryDesc}>{w.description}</p>}
              {w.achievements?.filter(Boolean).length > 0 && (
                <ul style={{ margin: '6px 0 0', padding: 0, listStyle: 'none' }}>
                  {w.achievements.filter(Boolean).map((a, i) => <li key={i} style={s.bullet}><span style={s.bulletDot}>•</span>{a}</li>)}
                </ul>
              )}
            </div>
          ))}
        </Card>
      )}

      {sections.includes('internship') && internship.length > 0 && (
        <Card title="实习经历" accent="#4a6c8f">
          {internship.map((i) => (
            <div key={i.id} style={s.entry}>
              <div style={s.entryHeader}>
                <span style={s.entryTitle}>{i.company} · {i.position}</span>
                <span style={s.entryDate}>{i.startDate} — {i.endDate}</span>
              </div>
              {i.description && <p style={s.entryDesc}>{i.description}</p>}
              {i.achievements?.filter(Boolean).length > 0 && (
                <ul style={{ margin: '6px 0 0', padding: 0, listStyle: 'none' }}>
                  {i.achievements.filter(Boolean).map((a, idx) => <li key={idx} style={s.bullet}><span style={s.bulletDot}>•</span>{a}</li>)}
                </ul>
              )}
            </div>
          ))}
        </Card>
      )}

      {sections.includes('projects') && projects.length > 0 && (
        <Card title="项目经历" accent="#d4a373">
          {projects.map((p) => (
            <div key={p.id} style={s.entry}>
              <div style={s.entryHeader}>
                <span style={s.entryTitle}>{p.name}{p.role ? ` · ${p.role}` : ''}</span>
                <span style={s.entryDate}>{p.startDate} — {p.endDate}</span>
              </div>
              {p.techStack && <p style={{ fontSize: 12, color: '#aaa', margin: '2px 0 0' }}>{p.techStack}</p>}
              {p.description && <p style={s.entryDesc}>{p.description}</p>}
              {p.achievements?.filter(Boolean).length > 0 && (
                <ul style={{ margin: '6px 0 0', padding: 0, listStyle: 'none' }}>
                  {p.achievements.filter(Boolean).map((a, idx) => <li key={idx} style={s.bullet}><span style={s.bulletDot}>•</span>{a}</li>)}
                </ul>
              )}
            </div>
          ))}
        </Card>
      )}

      {sections.includes('skills') && skills.length > 0 && (
        <Card title="专业技能" accent="#4a6c8f">
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {skills.map((sk, i) => <span key={i} style={s.skillTag}>{sk}</span>)}
          </div>
          {certificates.length > 0 && (
            <div style={{ marginTop: 14 }}>
              {certificates.map((c) => (
                <div key={c.id} style={{ fontSize: 13, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 500 }}>{c.name}</span>
                  <span style={{ color: '#aaa', fontStyle: 'italic' }}>{c.issuer}{c.date ? ` · ${c.date}` : ''}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {sections.includes('selfEval') && selfEval && (
        <Card title="自我评价" accent="#d4a373">
          <p style={{ fontSize: 13, color: '#555', margin: 0 }}>{selfEval}</p>
        </Card>
      )}
    </div>
  );
}
