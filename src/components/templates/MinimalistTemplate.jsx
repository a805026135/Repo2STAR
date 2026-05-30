export default function MinimalistTemplate({ data, sections }) {
  const { personal, education, work, internship, projects, skills, certificates, selfEval } = data;

  const s = {
    page: { fontFamily: "'Outfit', 'Noto Sans SC', system-ui, sans-serif", padding: '48px 30px', background: '#fff', color: '#111', lineHeight: 1.8, fontSize: 14 },
    name: { fontSize: 34, fontWeight: 300, textAlign: 'center', margin: 0, color: '#111', letterSpacing: 2 },
    jobTitle: { fontSize: 14, color: '#0f5e7d', textAlign: 'center', margin: '4px 0 16px', letterSpacing: 3 },
    contactLine: { textAlign: 'center', fontSize: 12, color: '#666', marginBottom: 32 },
    sectionTitle: { fontSize: 14, fontWeight: 600, color: '#0f5e7d', margin: '28px 0 8px', paddingBottom: 6, borderBottom: '1px solid #0f5e7d', letterSpacing: 1 },
    entry: { marginBottom: 16 },
    entryHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
    entryTitle: { fontSize: 14, fontWeight: 500, color: '#111', margin: 0 },
    entryDate: { fontSize: 12, color: '#999' },
    entrySub: { fontSize: 13, color: '#555', margin: '2px 0 0' },
    entryDesc: { fontSize: 13, color: '#333', margin: '4px 0 0' },
    bullet: { fontSize: 13, color: '#333', marginBottom: 2, paddingLeft: 14 },
    photo: { width: 72, height: 88, objectFit: 'cover', borderRadius: 4, display: 'block', margin: '0 auto 16px' },
  };

  return (
    <div style={s.page}>
      {personal.photo && <img src={personal.photo} alt="" style={s.photo} />}
      <h1 style={s.name}>{personal.name || '你的姓名'}</h1>
      {personal.title && <p style={s.jobTitle}>{personal.title}</p>}
      <div style={s.contactLine}>
        {[personal.phone, personal.email, personal.location, personal.website].filter(Boolean).map((c, i, arr) => (
          <span key={i}>{c}{i < arr.length - 1 && <span style={{ margin: '0 8px', color: '#ccc' }}>|</span>}</span>
        ))}
      </div>

      {personal.summary && (
        <div>
          <h2 style={s.sectionTitle}>个人简介</h2>
          <p style={{ fontSize: 13, color: '#333', margin: 0 }}>{personal.summary}</p>
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
              {w.achievements?.filter(Boolean).length > 0 && w.achievements.filter(Boolean).map((a, i) => <p key={i} style={s.bullet}>– {a}</p>)}
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
              {i.achievements?.filter(Boolean).length > 0 && i.achievements.filter(Boolean).map((a, idx) => <p key={idx} style={s.bullet}>– {a}</p>)}
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
              {p.techStack && <p style={{ fontSize: 12, color: '#0f5e7d', margin: '2px 0 0' }}>{p.techStack}</p>}
              {p.description && <p style={s.entryDesc}>{p.description}</p>}
              {p.achievements?.filter(Boolean).length > 0 && p.achievements.filter(Boolean).map((a, idx) => <p key={idx} style={s.bullet}>– {a}</p>)}
            </div>
          ))}
        </div>
      )}

      {sections.includes('skills') && skills.length > 0 && (
        <div>
          <h2 style={s.sectionTitle}>专业技能</h2>
          <p style={{ fontSize: 13, color: '#333', margin: 0 }}>
            {skills.map((sk, i) => <span key={i}>{i > 0 && <span style={{ margin: '0 6px', color: '#ccc' }}>·</span>}{sk}</span>)}
          </p>
        </div>
      )}

      {sections.includes('certificates') && certificates.length > 0 && (
        <div>
          <h2 style={s.sectionTitle}>证书荣誉</h2>
          {certificates.map((c) => (
            <div key={c.id} style={{ fontSize: 13, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
              <span>{c.name}</span>
              <span style={{ color: '#999' }}>{c.issuer}{c.date ? ` · ${c.date}` : ''}</span>
            </div>
          ))}
        </div>
      )}

      {sections.includes('selfEval') && selfEval && (
        <div>
          <h2 style={s.sectionTitle}>自我评价</h2>
          <p style={{ fontSize: 13, color: '#333', margin: 0 }}>{selfEval}</p>
        </div>
      )}
    </div>
  );
}
