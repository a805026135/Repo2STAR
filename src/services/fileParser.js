const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const PDF_TYPES = ['application/pdf'];
const DOCX_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];
const TEXT_TYPES = ['text/plain', 'text/markdown'];

export function getFileCategory(file) {
  if (IMAGE_TYPES.includes(file.type)) return 'image';
  if (PDF_TYPES.includes(file.type)) return 'pdf';
  if (DOCX_TYPES.includes(file.type)) return 'docx';
  if (TEXT_TYPES.includes(file.type) || file.name.endsWith('.txt') || file.name.endsWith('.md')) return 'text';
  return null;
}

// Read file as base64 data URL
function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

// Read file as text
function readAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file, 'utf-8');
  });
}

// Read file as ArrayBuffer
function readAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}

// Parse PDF using pdfjs-dist
async function parsePdf(file) {
  const arrayBuffer = await readAsArrayBuffer(file);
  const pdfjsLib = await import('pdfjs-dist');

  // Set worker source from CDN
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str).join(' ');
    if (text.trim()) pages.push(text);
  }

  return pages.join('\n\n');
}

// Parse DOCX using mammoth
async function parseDocx(file) {
  const arrayBuffer = await readAsArrayBuffer(file);
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * Parse an uploaded file and return structured result.
 * @param {File} file
 * @returns {Promise<{ type: 'image'|'text', data: string, fileName: string }>}
 */
export async function parseFile(file) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`文件大小超过限制（最大 10MB），当前 ${(file.size / 1024 / 1024).toFixed(1)}MB`);
  }

  const category = getFileCategory(file);
  if (!category) {
    throw new Error(`不支持的文件格式：${file.name}\n支持 PDF、Word、图片（JPG/PNG）、文本文件`);
  }

  switch (category) {
    case 'image': {
      const dataUrl = await readAsDataURL(file);
      return { type: 'image', data: dataUrl, fileName: file.name };
    }
    case 'pdf': {
      const text = await parsePdf(file);
      if (!text.trim()) throw new Error('PDF 文件无法提取文本内容，可能是扫描件。请上传图片格式的简历。');
      return { type: 'text', data: text, fileName: file.name };
    }
    case 'docx': {
      const text = await parseDocx(file);
      if (!text.trim()) throw new Error('Word 文件内容为空');
      return { type: 'text', data: text, fileName: file.name };
    }
    case 'text': {
      const text = await readAsText(file);
      return { type: 'text', data: text, fileName: file.name };
    }
    default:
      throw new Error('未知文件类型');
  }
}
