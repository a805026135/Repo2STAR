export default function FreshTemplate({ data, sections }) {
  const { personal, education, work, internship, projects, skills, certificates, selfEval } = data;

  const colors = ['#6a11cb', '#2575fc', '#e74c8b', '#f39c12', '#2ecc71', '#e67e22', '#9b59b6', '#1abc9c'];

  const s = {
    page: { fontFamily: "'Poppins', 'Noto Sans SC', system-ui, sans-serif", display: 'flex', minHeight: '297mm', background: '#fff', fontSize: 14, lineHeight: 1.8, color: '#333' },
    left: { width: 240, background: 'linear-gradient(180deg, #6a11cb 0%, #2575fc 100%)', color: '#fff', padding: '36px 24px', flexShrink: 0 },
    right: { flex: 1, padding: '36px 36px', background: '#fff' },
    photo: { width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', display: 'block', margin: '0 auto 16px', border: '3px solid rgba(255,255,255,0.4)' },
    avatar: { width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 700, margin: '0 auto 16px', border: '3px solid rgba(255,255,255,0.4)' },
    name: { fontSize: 22, fontWeight: 700, textAlign: 'center', margin: 0 },
    jobTitle: { fontSize: 12, textAlign: 'center', color: 'rgba(255,255,255,0.8)', margin: '4px 0 24px' },
    sideSection: { marginBottom: 24 },
    sideTitle: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(255,255,255,0.6)', marginBottom: 10 },
    contactItem: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 12, color: 'rgba(255,255,255,0.9)' },
    sideTag: { display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '4px 12px', fontSize: 11, margin: '0 4px 6px 0' },
    mainSection: { marginBottom: 24 },
    mainTitle: { fontSize: 16, fontWeight: 700, color: '#6a11cb', marginBottom: 14, paddingBottom: 6, borderBottom: '2px solid', borderImage: 'linear-gradient(to right, #6a11cb, #2575fc) 1' },
    entry: { marginBottom: 16, padding: '14px 18px', background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
    entryHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
    entryTitle: { fontSize: 14, fontWeight: 600, color: '#333', margin: 0 },
    entryDate: { fontSize: 11, color: '#999', fontStyle: 'italic', flexShrink: 0 },
    entrySub: { fontSize: 12, color: '#888', margin: '2px 0 0' },
    entryDesc: { fontSize: 12.5, color: '#555', margin: '6px 0 0' },
    bullet: { fontSize: 12.5, color: '#555', marginBottom: 3, display: 'flex', gap: 6 },
    bulletDot: (i) => ({ color: colors[i % colors.length], fontWeight: 700, flexShrink: 0 }),
    skillTag: (i) => ({ display: 'inline-block', background: `${colors[i % colors.length]}15`, color: colors[i % colors.length], padding: '4px 14px', borderRadius: 20, fontSize: 12, margin: '0 6px 6px 0', fontWeight: 500, border: `1px solid ${colors[i % colors.length]}30` }),
  };

  return (
    <div style={s.page}>
      {/* Left gradient sidebar */}
      <div style={s.left}>
        {personal.photo ? <img src={personal.photo} alt="" style={s.photo} /> : <div style={s.avatar}>{personal.name?.[0] || '?'}</div>}
        <h1 style={s.name}>{personal.name || '你的姓名'}</h1>
        {personal.title && <p style={s.jobTitle}>{personal.title}</p>}

        <div style={s.sideSection}>
          <h3 style={s.sideTitle}>联系方式</h3>
          {personal.phone && <div style={s.contactItem}><span>📞</span>{personal.phone}</div>}
          {personal.email && <div style={s.contactItem}><span>✉️</span><span style={{ wordBreak: 'break-all' }}>{personal.email}</span></div>}
          {personal.location && <div style={s.contactItem}><span>📍</span>{personal.location}</div>}
          {personal.website && <div style={s.contactItem}><span>🔗</span><span style={{ wordBreak: 'break-all' }}>{personal.website}</span></div>}
        </div>

        {sections.includes('skills') && skills.length > 0 && (
          <div style={s.sideSection}>
            <h3 style={s.sideTitle}>专业技能</h3>
            <div>{skills.map((sk, i) => <span key={i} style={s.sideTag}>{sk}</span>)}</div>
          </div>
        )}

        {sections.includes('certificates') && certificates.length > 0 && (
          <div style={s.sideSection}>
            <h3 style={s.sideTitle}>证书荣誉</h3>
            {certificates.map((c) => (
              <div key={c.id} style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 500, margin: 0 }}>{c.name}</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', margin: '1px 0 0' }}>{c.issuer}{c.date ? ` · ${c.date}` : ''}</p>
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
            <p style={{ fontSize: 13, color: '#555', margin: 0 }}>{personal.summary}</p>
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
                    {w.achievements.filter(Boolean).map((a, i) => <li key={i} style={s.bullet}><span style={s.bulletDot(i)}>●</span>{a}</li>)}
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
                    {i.achievements.filter(Boolean).map((a, idx) => <li key={idx} style={s.bullet}><span style={s.bulletDot(idx)}>●</span>{a}</li>)}
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
                {p.techStack && <p style={{ fontSize: 11, color: '#999', margin: '2px 0 0' }}>{p.techStack}</p>}
                {p.description && <p style={s.entryDesc}>{p.description}</p>}
                {p.achievements?.filter(Boolean).length > 0 && (
                  <ul style={{ margin: '6px 0 0', padding: 0, listStyle: 'none' }}>
                    {p.achievements.filter(Boolean).map((a, idx) => <li key={idx} style={s.bullet}><span style={s.bulletDot(idx)}>●</span>{a}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {sections.includes('selfEval') && selfEval && (
          <div style={s.mainSection}>
            <h3 style={s.mainTitle}>自我评价</h3>
            <p style={{ fontSize: 13, color: '#555', margin: 0 }}>{selfEval}</p>
          </div>
        )}
      </div>
    </div>
  );
}
