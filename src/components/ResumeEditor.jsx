import { useState, useCallback, useRef } from 'react';
import { useResume } from '../store/ResumeContext';
import { sectionConfig } from '../data/defaultResume';
import { polishText } from '../services/mimoApi';
import {
  GraduationCap, Briefcase, Building, FolderKanban, Wrench, Award, User,
  Plus, Trash2, Sparkles, ChevronDown, ChevronRight, GripVertical, Loader2,
  Camera, X,
} from 'lucide-react';
import toast from 'react-hot-toast';

const iconMap = { GraduationCap, Briefcase, Building, FolderKanban, Wrench, Award, User };

function AchievementList({ items, onChange, disabled }) {
  const update = (i, val) => {
    const next = [...items];
    next[i] = val;
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input className="input-field flex-1" value={item} onChange={(e) => update(i, e.target.value)} placeholder={`成就/成果 ${i + 1}`} disabled={disabled} />
          {items.length > 1 && (
            <button className="btn-danger" onClick={() => onChange(items.filter((_, j) => j !== i))} disabled={disabled}>
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}
      <button className="text-indigo-400 text-xs flex items-center gap-1 hover:text-indigo-300" onClick={() => onChange([...items, ''])} disabled={disabled}>
        <Plus size={12} /> 添加成就
      </button>
    </div>
  );
}

function PolishButton({ text, context, onPolished }) {
  const [loading, setLoading] = useState(false);
  const handlePolish = async () => {
    if (!text?.trim()) return toast.error('请先输入内容');
    setLoading(true);
    try {
      const result = await polishText(text, context);
      onPolished(result);
      toast.success('AI润色完成');
    } catch (err) {
      toast.error('润色失败：' + err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <button className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-1" onClick={handlePolish} disabled={loading}>
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
      AI润色
    </button>
  );
}

function SectionWrapper({ title, icon, sectionKey, children, onAdd, itemCount, removable, onRemove }) {
  const [open, setOpen] = useState(true);
  const Icon = iconMap[icon];

  return (
    <div className="section-card">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-2">
          <GripVertical size={16} className="text-gray-300" />
          {Icon && <Icon size={18} className="text-indigo-400" />}
          <h3 className="font-semibold text-white">{title}</h3>
          {itemCount != null && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{itemCount}</span>}
        </div>
        <div className="flex items-center gap-2">
          {onAdd && (
            <button className="text-indigo-400 hover:text-indigo-300 p-1" onClick={(e) => { e.stopPropagation(); onAdd(); }} title="添加">
              <Plus size={18} />
            </button>
          )}
          {open ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
        </div>
      </div>
      {open && <div className="mt-4 space-y-4">{children}</div>}
    </div>
  );
}

function PersonalSection() {
  const { resumeData, updatePersonal } = useResume();
  const p = resumeData.personal;
  const fileRef = useRef(null);

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('照片大小不能超过 2MB'); return; }
    const reader = new FileReader();
    reader.onload = () => updatePersonal({ photo: reader.result });
    reader.readAsDataURL(file);
  };

  return (
    <SectionWrapper title="个人信息" icon="User" sectionKey="personal">
      {/* Photo upload */}
      <div className="flex items-center gap-4">
        <div className="relative group">
          <div className="w-24 h-28 rounded-lg border-2 border-dashed border-gray-300 bg-gray-800 flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-500 transition-colors" onClick={() => fileRef.current?.click()}>
            {p.photo ? (
              <img src={p.photo} alt="证件照" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <Camera size={20} className="text-gray-400 mx-auto mb-1" />
                <span className="text-[10px] text-gray-400">上传照片</span>
              </div>
            )}
          </div>
          {p.photo && (
            <button className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600" onClick={() => updatePersonal({ photo: '' })}>
              <X size={12} />
            </button>
          )}
        </div>
        <div className="text-xs text-gray-500">
          <p className="font-medium text-gray-300 mb-1">证件照</p>
          <p>建议上传正装证件照</p>
          <p>支持 JPG/PNG，最大 2MB</p>
          <button className="text-indigo-400 hover:text-indigo-300 mt-1 font-medium" onClick={() => fileRef.current?.click()}>选择文件</button>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handlePhoto} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">姓名</label><input className="input-field" value={p.name} onChange={(e) => updatePersonal({ name: e.target.value })} placeholder="张三" /></div>
        <div><label className="label">求职意向</label><input className="input-field" value={p.title} onChange={(e) => updatePersonal({ title: e.target.value })} placeholder="前端开发工程师" /></div>
        <div><label className="label">手机号</label><input className="input-field" value={p.phone} onChange={(e) => updatePersonal({ phone: e.target.value })} placeholder="138-0000-0000" /></div>
        <div><label className="label">邮箱</label><input className="input-field" value={p.email} onChange={(e) => updatePersonal({ email: e.target.value })} placeholder="email@example.com" /></div>
        <div><label className="label">所在城市</label><input className="input-field" value={p.location} onChange={(e) => updatePersonal({ location: e.target.value })} placeholder="北京" /></div>
        <div><label className="label">个人网站</label><input className="input-field" value={p.website} onChange={(e) => updatePersonal({ website: e.target.value })} placeholder="https://..." /></div>
      </div>
      <div>
        <label className="label">个人简介</label>
        <textarea className="input-field h-20 resize-none" value={p.summary} onChange={(e) => updatePersonal({ summary: e.target.value })} placeholder="简要介绍你的专业背景和核心优势..." />
        <PolishButton text={p.summary} context="个人简介/自我介绍" onPolished={(val) => updatePersonal({ summary: val })} />
      </div>
    </SectionWrapper>
  );
}

function EducationSection() {
  const { resumeData, updateField, addItem, removeItem } = useResume();
  return (
    <SectionWrapper title="教育经历" icon="GraduationCap" sectionKey="education" onAdd={() => addItem('education')} itemCount={resumeData.education.length}>
      {resumeData.education.map((edu) => (
        <div key={edu.id} className="border border-gray-800 rounded-lg p-4 space-y-3 relative">
          <button className="absolute top-2 right-2 text-red-400 hover:text-red-600" onClick={() => removeItem('education', edu.id)}><Trash2 size={16} /></button>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">学校</label><input className="input-field" value={edu.school} onChange={(e) => updateField('education', edu.id, { school: e.target.value })} /></div>
            <div><label className="label">学历</label><input className="input-field" value={edu.degree} onChange={(e) => updateField('education', edu.id, { degree: e.target.value })} placeholder="本科" /></div>
            <div><label className="label">专业</label><input className="input-field" value={edu.major} onChange={(e) => updateField('education', edu.id, { major: e.target.value })} /></div>
            <div><label className="label">GPA</label><input className="input-field" value={edu.gpa} onChange={(e) => updateField('education', edu.id, { gpa: e.target.value })} placeholder="3.8/4.0" /></div>
            <div><label className="label">开始时间</label><input className="input-field" value={edu.startDate} onChange={(e) => updateField('education', edu.id, { startDate: e.target.value })} placeholder="2020.09" /></div>
            <div><label className="label">结束时间</label><input className="input-field" value={edu.endDate} onChange={(e) => updateField('education', edu.id, { endDate: e.target.value })} placeholder="2024.06" /></div>
          </div>
          <div>
            <label className="label">描述</label>
            <textarea className="input-field h-16 resize-none" value={edu.description} onChange={(e) => updateField('education', edu.id, { description: e.target.value })} placeholder="相关课程、学术成就等..." />
            <PolishButton text={edu.description} context={`教育经历 - ${edu.school} ${edu.major}`} onPolished={(val) => updateField('education', edu.id, { description: val })} />
          </div>
        </div>
      ))}
    </SectionWrapper>
  );
}

function ExperienceSection({ type, title, icon }) {
  const { resumeData, updateField, addItem, removeItem } = useResume();
  const items = resumeData[type] || [];
  return (
    <SectionWrapper title={title} icon={icon} sectionKey={type} onAdd={() => addItem(type)} itemCount={items.length}>
      {items.map((item) => (
        <div key={item.id} className="border border-gray-800 rounded-lg p-4 space-y-3 relative">
          <button className="absolute top-2 right-2 text-red-400 hover:text-red-600" onClick={() => removeItem(type, item.id)}><Trash2 size={16} /></button>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">公司</label><input className="input-field" value={item.company} onChange={(e) => updateField(type, item.id, { company: e.target.value })} /></div>
            <div><label className="label">职位</label><input className="input-field" value={item.position} onChange={(e) => updateField(type, item.id, { position: e.target.value })} /></div>
            <div><label className="label">开始时间</label><input className="input-field" value={item.startDate} onChange={(e) => updateField(type, item.id, { startDate: e.target.value })} placeholder="2023.06" /></div>
            <div><label className="label">结束时间</label><input className="input-field" value={item.endDate} onChange={(e) => updateField(type, item.id, { endDate: e.target.value })} placeholder="2024.01" /></div>
          </div>
          <div>
            <label className="label">工作描述</label>
            <textarea className="input-field h-16 resize-none" value={item.description} onChange={(e) => updateField(type, item.id, { description: e.target.value })} placeholder="描述你的主要职责..." />
            <PolishButton text={item.description} context={`${title} - ${item.company} ${item.position}`} onPolished={(val) => updateField(type, item.id, { description: val })} />
          </div>
          <div>
            <label className="label">主要成就</label>
            <AchievementList items={item.achievements || ['']} onChange={(val) => updateField(type, item.id, { achievements: val })} />
          </div>
        </div>
      ))}
    </SectionWrapper>
  );
}

function ProjectSection() {
  const { resumeData, updateField, addItem, removeItem } = useResume();
  return (
    <SectionWrapper title="项目经历" icon="FolderKanban" sectionKey="projects" onAdd={() => addItem('projects')} itemCount={resumeData.projects.length}>
      {resumeData.projects.map((proj) => (
        <div key={proj.id} className="border border-gray-800 rounded-lg p-4 space-y-3 relative">
          <button className="absolute top-2 right-2 text-red-400 hover:text-red-600" onClick={() => removeItem('projects', proj.id)}><Trash2 size={16} /></button>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">项目名称</label><input className="input-field" value={proj.name} onChange={(e) => updateField('projects', proj.id, { name: e.target.value })} /></div>
            <div><label className="label">担任角色</label><input className="input-field" value={proj.role} onChange={(e) => updateField('projects', proj.id, { role: e.target.value })} /></div>
            <div><label className="label">开始时间</label><input className="input-field" value={proj.startDate} onChange={(e) => updateField('projects', proj.id, { startDate: e.target.value })} placeholder="2023.03" /></div>
            <div><label className="label">结束时间</label><input className="input-field" value={proj.endDate} onChange={(e) => updateField('projects', proj.id, { endDate: e.target.value })} placeholder="2023.06" /></div>
          </div>
          <div><label className="label">技术栈</label><input className="input-field" value={proj.techStack} onChange={(e) => updateField('projects', proj.id, { techStack: e.target.value })} placeholder="React, Node.js, MySQL..." /></div>
          <div>
            <label className="label">项目描述</label>
            <textarea className="input-field h-16 resize-none" value={proj.description} onChange={(e) => updateField('projects', proj.id, { description: e.target.value })} placeholder="描述项目背景和你的贡献..." />
            <PolishButton text={proj.description} context={`项目经历 - ${proj.name}，技术栈：${proj.techStack}`} onPolished={(val) => updateField('projects', proj.id, { description: val })} />
          </div>
          <div>
            <label className="label">项目成就</label>
            <AchievementList items={proj.achievements || ['']} onChange={(val) => updateField('projects', proj.id, { achievements: val })} />
          </div>
        </div>
      ))}
    </SectionWrapper>
  );
}

function SkillsSection() {
  const { resumeData, setField } = useResume();
  const skills = resumeData.skills;
  const [input, setInput] = useState('');
  const add = () => { if (input.trim()) { setField('skills', [...skills, input.trim()]); setInput(''); } };
  const remove = (i) => setField('skills', skills.filter((_, j) => j !== i));

  return (
    <SectionWrapper title="专业技能" icon="Wrench" sectionKey="skills">
      <div className="flex gap-2">
        <input className="input-field flex-1" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="输入技能后按回车添加" />
        <button className="btn-primary text-sm" onClick={add}>添加</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.map((s, i) => (
          <span key={i} className="bg-primary-50 text-indigo-300 px-3 py-1 rounded-full text-sm flex items-center gap-1">
            {s}
            <button className="hover:text-red-500" onClick={() => remove(i)}><Trash2 size={12} /></button>
          </span>
        ))}
      </div>
    </SectionWrapper>
  );
}

function CertificatesSection() {
  const { resumeData, updateField, addItem, removeItem } = useResume();
  return (
    <SectionWrapper title="证书荣誉" icon="Award" sectionKey="certificates" onAdd={() => addItem('certificates')} itemCount={resumeData.certificates.length}>
      {resumeData.certificates.map((cert) => (
        <div key={cert.id} className="border border-gray-800 rounded-lg p-4 space-y-3 relative">
          <button className="absolute top-2 right-2 text-red-400 hover:text-red-600" onClick={() => removeItem('certificates', cert.id)}><Trash2 size={16} /></button>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">证书名称</label><input className="input-field" value={cert.name} onChange={(e) => updateField('certificates', cert.id, { name: e.target.value })} /></div>
            <div><label className="label">颁发机构</label><input className="input-field" value={cert.issuer} onChange={(e) => updateField('certificates', cert.id, { issuer: e.target.value })} /></div>
            <div><label className="label">获得时间</label><input className="input-field" value={cert.date} onChange={(e) => updateField('certificates', cert.id, { date: e.target.value })} placeholder="2024.05" /></div>
          </div>
        </div>
      ))}
    </SectionWrapper>
  );
}

function SelfEvalSection() {
  const { resumeData, setField } = useResume();
  return (
    <SectionWrapper title="自我评价" icon="User" sectionKey="selfEval">
      <textarea className="input-field h-24 resize-none" value={resumeData.selfEval} onChange={(e) => setField('selfEval', e.target.value)} placeholder="总结你的核心优势、职业特质和发展方向..." />
      <PolishButton text={resumeData.selfEval} context="自我评价/个人优势" onPolished={(val) => setField('selfEval', val)} />
    </SectionWrapper>
  );
}

export default function ResumeEditor() {
  const { enabledSections, toggleSection, setActiveSection } = useResume();

  return (
    <div className="space-y-4 pb-8">
      {/* Section toggle */}
      <div className="section-card">
        <h3 className="font-semibold text-white mb-3">模块管理</h3>
        <div className="flex flex-wrap gap-2">
          {sectionConfig.map((sec) => {
            const active = enabledSections.includes(sec.key);
            const Icon = iconMap[sec.icon];
            return (
              <button
                key={sec.key}
                onClick={() => { if (!sec.required) toggleSection(sec.key); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                  active ? 'bg-primary-100 text-indigo-300 border border-primary-200' : 'bg-gray-100 text-gray-400 border border-transparent'
                } ${sec.required ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}`}
              >
                {Icon && <Icon size={14} />}
                {sec.label}
                {sec.required && <span className="text-[10px] text-gray-400">必选</span>}
              </button>
            );
          })}
        </div>
      </div>

      <PersonalSection />
      {enabledSections.includes('education') && <EducationSection />}
      {enabledSections.includes('work') && <ExperienceSection type="work" title="工作经历" icon="Briefcase" />}
      {enabledSections.includes('internship') && <ExperienceSection type="internship" title="实习经历" icon="Building" />}
      {enabledSections.includes('projects') && <ProjectSection />}
      {enabledSections.includes('skills') && <SkillsSection />}
      {enabledSections.includes('certificates') && <CertificatesSection />}
      {enabledSections.includes('selfEval') && <SelfEvalSection />}
    </div>
  );
}
