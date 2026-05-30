const I = {
  phone: <svg width="14" height="14" fill="none" stroke="#64748b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.13.81.36 1.6.68 2.34a2 2 0 01-.45 2.11L8.09 9.45a16 16 0 006.46 6.46l1.28-1.28a2 2 0 012.11-.45c.74.32 1.53.55 2.34.68A2 2 0 0122 16.92z"/></svg>,
  email: <svg width="14" height="14" fill="none" stroke="#64748b" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4L12 13 2 4"/></svg>,
  location: <svg width="14" height="14" fill="none" stroke="#64748b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  web: <svg width="14" height="14" fill="none" stroke="#64748b" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z"/></svg>,
  briefcase: <svg width="14" height="14" fill="none" stroke="#64748b" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>,
  grad: <svg width="14" height="14" fill="none" stroke="#64748b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 0 2.5 3 6 3s6-3 6-3v-5"/></svg>,
  folder: <svg width="14" height="14" fill="none" stroke="#64748b" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>,
  star: <svg width="14" height="14" fill="none" stroke="#64748b" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
};

export default function ModernTemplate({ data, sections }) {
  const { personal, education, work, internship, projects, skills, certificates, selfEval } = data;

  const s = {
    page: { fontFamily: "'Inter', 'Noto Sans SC', system-ui, sans-serif", display: 'flex', minHeight: '297mm', background: '#f8fafc', fontSize: 14, lineHeight: 1.6, color: '#334155' },
    left: { width: '30%', background: '#f1f5f9', padding: '32px 24px', flexShrink: 0 },
    right: { width: '70%', padding: '32px 32px', background: '#fff' },
    photo: { width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', display: 'block', margin: '0 auto 16px', border: '3px solid #e2e8f0' },
    name: { fontSize: 24, fontWeight: 700, color: '#1e293b', margin: 0, textAlign: 'center' },
    jobTitle: { fontSize: 13, color: '#64748b', textAlign: 'center', margin: '4px 0 20px' },
    sideSection: { marginBottom: 24 },
    sideTitle: { fontSize: 12, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #e2e8f0' },
    contactRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 12, color: '#475569' },
    skillItem: { marginBottom: 8 },
    skillName: { fontSize: 12, color: '#334155', marginBottom: 3, display: 'flex', justifyContent: 'space-between' },
    skillBar: { height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
    skillFill: (level = 80) => ({ height: '100%', width: `${level}%`, background: '#1e293b', borderRadius: 3 }),
    mainSection: { marginBottom: 24 },
    mainTitle: { fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 },
    card: { background: '#fff', padding: '14px 18px', borderRadius: 12, boxShadow: '0 2px 6px rgba(0,0,0,0.05)', marginBottom: 12 },
    entryTitle: { fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 },
    entryDate: { fontSize: 11, color: '#94a3b8' },
    entrySub: { fontSize: 12, color: '#64748b', margin: '2px 0 0' },
    entryDesc: { fontSize: 12.5, color: '#475569', margin: '6px 0 0', lineHeight: 1.6 },
    bullet: { fontSize: 12.5, color: '#475569', marginBottom: 3, display: 'flex', gap: 6 },
    bulletDot: { color: '#94a3b8', flexShrink: 0 },
    summaryCard: { background: '#fff', padding: '14px 18px', borderRadius: 12, boxShadow: '0 2px 6px rgba(0,0,0,0.05)', marginBottom: 20 },
  };

  return (
    <div style={s.page}>
      {/* Left sidebar */}
      <div style={s.left}>
        {personal.photo ? <img src={personal.photo} alt="" style={s.photo} /> : <div style={{ ...s.photo, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#94a3b8' }}>{personal.name?.[0] || '?'}</div>}
        <h1 style={s.name}>{personal.name || '你的姓名'}</h1>
        {personal.title && <p style={s.jobTitle}>{personal.title}</p>}

        <div style={s.sideSection}>
          <h3 style={s.sideTitle}>联系方式</h3>
          {personal.phone && <div style={s.contactRow}>{I.phone}<span>{personal.phone}</span></div>}
          {personal.email && <div style={s.contactRow}>{I.email}<span style={{ wordBreak: 'break-all' }}>{personal.email}</span></div>}
          {personal.location && <div style={s.contactRow}>{I.location}<span>{personal.location}</span></div>}
          {personal.website && <div style={s.contactRow}>{I.web}<span style={{ wordBreak: 'break-all' }}>{personal.website}</span></div>}
        </div>

        {sections.includes('skills') && skills.length > 0 && (
          <div style={s.sideSection}>
            <h3 style={s.sideTitle}>专业技能</h3>
            {skills.map((sk, i) => (
              <div key={i} style={s.skillItem}>
                <div style={s.skillName}><span>{sk}</span></div>
                <div style={s.skillBar}><div style={s.skillFill(70 + (i % 3) * 10)} /></div>
              </div>
            ))}
          </div>
        )}

        {sections.includes('certificates') && certificates.length > 0 && (
          <div style={s.sideSection}>
            <h3 style={s.sideTitle}>证书荣誉</h3>
            {certificates.map((c) => (
              <div key={c.id} style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: '#1e293b', margin: 0 }}>{c.name}</p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '1px 0 0' }}>{c.issuer}{c.date ? ` · ${c.date}` : ''}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right content */}
      <div style={s.right}>
        {personal.summary && (
          <div style={s.summaryCard}>
            <h3 style={{ ...s.mainTitle, marginBottom: 8, fontSize: 14 }}>{I.star} 个人简介</h3>
            <p style={{ fontSize: 12.5, color: '#475569', margin: 0, lineHeight: 1.7 }}>{personal.summary}</p>
          </div>
        )}

        {sections.includes('education') && education.length > 0 && (
          <div style={s.mainSection}>
            <h3 style={s.mainTitle}>{I.grad} 教育经历</h3>
            {education.map((edu) => (
              <div key={edu.id} style={s.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
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
            <h3 style={s.mainTitle}>{I.briefcase} 工作经历</h3>
            {work.map((w) => (
              <div key={w.id} style={s.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
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
          </div>
        )}

        {sections.includes('internship') && internship.length > 0 && (
          <div style={s.mainSection}>
            <h3 style={s.mainTitle}>{I.briefcase} 实习经历</h3>
            {internship.map((i) => (
              <div key={i.id} style={s.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
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
          </div>
        )}

        {sections.includes('projects') && projects.length > 0 && (
          <div style={s.mainSection}>
            <h3 style={s.mainTitle}>{I.folder} 项目经历</h3>
            {projects.map((p) => (
              <div key={p.id} style={s.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={s.entryTitle}>{p.name}{p.role ? ` · ${p.role}` : ''}</span>
                  <span style={s.entryDate}>{p.startDate} — {p.endDate}</span>
                </div>
                {p.techStack && <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>{p.techStack}</p>}
                {p.description && <p style={s.entryDesc}>{p.description}</p>}
                {p.achievements?.filter(Boolean).length > 0 && (
                  <ul style={{ margin: '6px 0 0', padding: 0, listStyle: 'none' }}>
                    {p.achievements.filter(Boolean).map((a, idx) => <li key={idx} style={s.bullet}><span style={s.bulletDot}>•</span>{a}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {sections.includes('selfEval') && selfEval && (
          <div style={s.mainSection}>
            <h3 style={s.mainTitle}>{I.star} 自我评价</h3>
            <div style={s.card}><p style={{ fontSize: 12.5, color: '#475569', margin: 0, lineHeight: 1.7 }}>{selfEval}</p></div>
          </div>
        )}
      </div>
    </div>
  );
}
