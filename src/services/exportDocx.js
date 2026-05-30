import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, TabStopType, TabStopPosition } from 'docx';
import { saveAs } from 'file-saver';

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: level === HeadingLevel.HEADING_1 ? 28 : 24, font: 'Microsoft YaHei' })],
  });
}

function text(content, opts = {}) {
  return new Paragraph({
    spacing: { after: 60 },
    children: [new TextRun({ text: content, size: 21, font: 'Microsoft YaHei', ...opts })],
  });
}

function bullet(content) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 40 },
    children: [new TextRun({ text: content, size: 21, font: 'Microsoft YaHei' })],
  });
}

function divider() {
  return new Paragraph({
    border: { bottom: { color: '#cccccc', size: 1, style: BorderStyle.SINGLE, space: 1 } },
    spacing: { after: 100 },
  });
}

function pairLine(left, right) {
  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    spacing: { after: 60 },
    children: [
      new TextRun({ text: left, bold: true, size: 22, font: 'Microsoft YaHei' }),
      new TextRun({ text: '\t' }),
      new TextRun({ text: right, size: 21, font: 'Microsoft YaHei', color: '666666' }),
    ],
  });
}

export async function exportDocx(resumeData, filename = 'resume.docx') {
  const { personal, education, work, internship, projects, skills, certificates, selfEval } = resumeData;
  const children = [];

  // Header
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: personal.name || '个人简历', bold: true, size: 40, font: 'Microsoft YaHei' })],
  }));

  if (personal.title) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: personal.title, size: 24, font: 'Microsoft YaHei', color: '555555' })],
    }));
  }

  const contactParts = [personal.phone, personal.email, personal.location, personal.website].filter(Boolean);
  if (contactParts.length) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: contactParts.join(' | '), size: 20, font: 'Microsoft YaHei', color: '666666' })],
    }));
  }
  children.push(divider());

  // Summary
  if (personal.summary) {
    children.push(heading('个人简介'));
    children.push(text(personal.summary));
  }

  // Education
  if (education?.length) {
    children.push(heading('教育经历'));
    for (const edu of education) {
      children.push(pairLine(
        edu.school,
        `${edu.startDate} - ${edu.endDate}`,
      ));
      children.push(text(`${edu.degree} | ${edu.major}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}`, { color: '555555' }));
      if (edu.description) children.push(text(edu.description));
    }
  }

  // Work
  if (work?.length) {
    children.push(heading('工作经历'));
    for (const w of work) {
      children.push(pairLine(`${w.company} - ${w.position}`, `${w.startDate} - ${w.endDate}`));
      if (w.description) children.push(text(w.description));
      w.achievements?.filter(Boolean).forEach((a) => children.push(bullet(a)));
    }
  }

  // Internship
  if (internship?.length) {
    children.push(heading('实习经历'));
    for (const i of internship) {
      children.push(pairLine(`${i.company} - ${i.position}`, `${i.startDate} - ${i.endDate}`));
      if (i.description) children.push(text(i.description));
      i.achievements?.filter(Boolean).forEach((a) => children.push(bullet(a)));
    }
  }

  // Projects
  if (projects?.length) {
    children.push(heading('项目经历'));
    for (const p of projects) {
      children.push(pairLine(`${p.name}${p.role ? ` - ${p.role}` : ''}`, `${p.startDate} - ${p.endDate}`));
      if (p.techStack) children.push(text(`技术栈：${p.techStack}`, { color: '555555', italics: true }));
      if (p.description) children.push(text(p.description));
      p.achievements?.filter(Boolean).forEach((a) => children.push(bullet(a)));
    }
  }

  // Skills
  if (skills?.length) {
    children.push(heading('专业技能'));
    children.push(text(skills.join(' · ')));
  }

  // Certificates
  if (certificates?.length) {
    children.push(heading('证书荣誉'));
    for (const c of certificates) {
      children.push(pairLine(c.name, `${c.issuer}${c.date ? ` · ${c.date}` : ''}`));
    }
  }

  // Self eval
  if (selfEval) {
    children.push(heading('自我评价'));
    children.push(text(selfEval));
  }

  const doc = new Document({
    sections: [{ children }],
    styles: {
      default: { document: { run: { font: 'Microsoft YaHei', size: 21 } } },
    },
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}
