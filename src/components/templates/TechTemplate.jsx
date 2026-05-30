export default function TechTemplate({ data, sections }) {
  const { personal, education, work, internship, projects, skills, certificates, selfEval } = data;

  const s = {
    page: { fontFamily: "'JetBrains Mono', 'Space Grotesk', 'Consolas', monospace", display: 'flex', minHeight: '297mm', background: '#fff', fontSize: 13, lineHeight: 1.5, color: '#333' },
    left: { width: 260, background: '#1e1e2f', color: '#b0b0c0', padding: '32px 22px', flexShrink: 0 },
    right: { flex: 1, padding: '32px 36px', background: '#fff' },
    decoLine: { height: 2, background: 'linear-gradient(to right, #6c63ff, #3b82f6)', border: 'none', margin: '0 0 24px' },
    photo: { width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', display: 'block', margin: '0 auto 14px', border: '3px solid #3a3a5c', boxShadow: '0 0 20px rgba(108,99,255,0.2)' },
    avatar: { width: 80, height: 80, borderRadius: '50%', background: '#2a2a40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 700, color: '#6c63ff', margin: '0 auto 14px', border: '3px solid #3a3a5c', boxShadow: '0 0 20px rgba(108,99,255,0.2)' },
    name: { fontSize: 20, fontWeight: 700, color: '#eee', textAlign: 'center', margin: 0 },
    jobTitle: { fontSize: 11, color: '#888', textAlign: 'center', margin: '4px 0 20px' },
    sideSection: { marginBottom: 22 },
    sideTitle: { fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2, color: '#6c63ff', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #2a2a40' },
    contactItem: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, fontSize: 11 },
    progressBar: { height: 5, background: '#2a2a40', borderRadius: 3, overflow: 'hidden', marginTop: 4 },
    progressFill: (level = 80) => ({ height: '100%', width: `${level}%`, background: 'linear-gradient(to right, #6c63ff, #3b82f6)', borderRadius: 3 }),
    mainSection: { marginBottom: 24 },
    mainTitle: { fontSize: 15, fontWeight: 700, color: '#1e1e2f', marginBottom: 14 },
    entry: { marginBottom: 16, padding: '12px 16px', background: '#fafafa', borderRadius: 6, borderLeft: '3px solid #1e1e2f' },
    entryHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
    entryTitle: { fontSize: 13, fontWeight: 600, color: '#1e1e2f', margin: 0 },
    entryDate: { fontSize: 10, color: '#999', flexShrink: 0 },
    entrySub: { fontSize: 12, color: '#666', margin: '2px 0 0' },
    entryDesc: { fontSize: 12, color: '#555', margin: '6px 0 0', lineHeight: 1.6 },
    bullet: { fontSize: 12, color: '#555', marginBottom: 3, display: 'flex', gap: 6 },
    arrow: { color: '#6c63ff', fontWeight: 700, flexShrink: 0 },
  };

  return (
    <div style={s.page}>
      {/* Left dark sidebar */}
      <div style={s.left}>
        <div style={{ height: 2, background: 'linear-gradient(to right, transparent, #6c63ff, transparent)', marginBottom: 20 }} />
        {personal.photo ? <img src={personal.photo} alt="" style={s.photo} /> : <div style={s.avatar}>{personal.name?.[0] || '?'}</div>}
        <h1 style={s.name}>{personal.name || 'your_name'}</h1>
        {personal.title && <p style={s.jobTitle}>{personal.title}</p>}

        <div style={s.sideSection}>
          <h3 style={s.sideTitle}>Contact</h3>
          {personal.phone && <div style={s.contactItem}><span style={{ color: '#6c63ff' }}>→</span>{personal.phone}</div>}
          {personal.email && <div style={s.contactItem}><span style={{ color: '#6c63ff' }}>→</span><span style={{ wordBreak: 'break-all', fontSize: 10 }}>{personal.email}</span></div>}
          {personal.location && <div style={s.contactItem}><span style={{ color: '#6c63ff' }}>→</span>{personal.location}</div>}
          {personal.website && <div style={s.contactItem}><span style={{ color: '#6c63ff' }}>→</span><span style={{ wordBreak: 'break-all', fontSize: 10 }}>{personal.website}</span></div>}
        </div>

        {sections.includes('skills') && skills.length > 0 && (
          <div style={s.sideSection}>
            <h3 style={s.sideTitle}>Skills</h3>
            {skills.map((sk, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: '#ccc', display: 'flex', justifyContent: 'space-between' }}><span>{sk}</span></div>
                <div style={s.progressBar}><div style={s.progressFill(65 + (i % 4) * 10)} /></div>
              </div>
            ))}
          </div>
        )}

        {sections.includes('certificates') && certificates.length > 0 && (
          <div style={s.sideSection}>
            <h3 style={s.sideTitle}>Certifications</h3>
            {certificates.map((c) => (
              <div key={c.id} style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 11, color: '#ddd', margin: 0 }}>{c.name}</p>
                <p style={{ fontSize: 9, color: '#666', margin: '1px 0 0' }}>{c.issuer}{c.date ? ` · ${c.date}` : ''}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right content */}
      <div style={s.right}>
        {personal.summary && (
          <div style={s.mainSection}>
            <h3 style={s.mainTitle}>个人简介</h3>
            <p style={{ fontSize: 12.5, color: '#555', margin: 0, lineHeight: 1.7 }}>{personal.summary}</p>
          </div>
        )}

        {sections.includes('work') && work.length > 0 && (
          <div style={s.mainSection}>
            <h3 style={s.mainTitle}>工作经历</h3>
            {work.map((w) => (
              <div key={w.id} style={s.entry}>
                <div style={s.entryHeader}>
                  <span style={s.entryTitle}>{w.company} · {w.position}</span>
                  <span style={s.entryDate}>{w.startDate} — {w.endDate}</span>
                </div>
                {w.description && <p style={s.entryDesc}>{w.description}</p>}
                {w.achievements?.filter(Boolean).length > 0 && (
                  <ul style={{ margin: '6px 0 0', padding: 0, listStyle: 'none' }}>
                    {w.achievements.filter(Boolean).map((a, i) => <li key={i} style={s.bullet}><span style={s.arrow}>→</span>{a}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {sections.includes('internship') && internship.length > 0 && (
          <div style={s.mainSection}>
            <h3 style={s.mainTitle}>实习经历</h3>
            {internship.map((i) => (
              <div key={i.id} style={s.entry}>
                <div style={s.entryHeader}>
                  <span style={s.entryTitle}>{i.company} · {i.position}</span>
                  <span style={s.entryDate}>{i.startDate} — {i.endDate}</span>
                </div>
                {i.description && <p style={s.entryDesc}>{i.description}</p>}
                {i.achievements?.filter(Boolean).length > 0 && (
                  <ul style={{ margin: '6px 0 0', padding: 0, listStyle: 'none' }}>
                    {i.achievements.filter(Boolean).map((a, idx) => <li key={idx} style={s.bullet}><span style={s.arrow}>→</span>{a}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {sections.includes('projects') && projects.length > 0 && (
          <div style={s.mainSection}>
            <h3 style={s.mainTitle}>项目经历</h3>
            {projects.map((p) => (
              <div key={p.id} style={s.entry}>
                <div style={s.entryHeader}>
                  <span style={s.entryTitle}>{p.name}{p.role ? ` · ${p.role}` : ''}</span>
                  <span style={s.entryDate}>{p.startDate} — {p.endDate}</span>
                </div>
                {p.techStack && <p style={{ fontSize: 10, color: '#6c63ff', margin: '2px 0 0' }}>{p.techStack}</p>}
                {p.description && <p style={s.entryDesc}>{p.description}</p>}
                {p.achievements?.filter(Boolean).length > 0 && (
                  <ul style={{ margin: '6px 0 0', padding: 0, listStyle: 'none' }}>
                    {p.achievements.filter(Boolean).map((a, idx) => <li key={idx} style={s.bullet}><span style={s.arrow}>→</span>{a}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {sections.includes('education') && education.length > 0 && (
          <div style={s.mainSection}>
            <h3 style={s.mainTitle}>教育经历</h3>
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

        {sections.includes('selfEval') && selfEval && (
          <div style={s.mainSection}>
            <h3 style={s.mainTitle}>自我评价</h3>
            <p style={{ fontSize: 12.5, color: '#555', margin: 0, lineHeight: 1.7 }}>{selfEval}</p>
          </div>
        )}
      </div>
    </div>
  );
}
