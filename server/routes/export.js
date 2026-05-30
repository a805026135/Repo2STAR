import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getDb } from '../db/schema.js';
import { AgentOrchestrator } from '../agent/orchestrator.js';
import { GitHubService } from '../services/github.js';
import { IntegrationService } from '../services/integrations.js';
import { getSetting } from './settings.js';

const router = Router();
router.use(authMiddleware);

// FR-7.1: Export as JSON (JsonResume compatible)
router.get('/jsonresume', (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const starPoints = db.prepare(`
    SELECT sp.*, r.full_name, r.language FROM star_points sp
    JOIN repos r ON sp.repo_id = r.id
    WHERE r.user_id = ? AND sp.is_active = 1
    ORDER BY sp.created_at DESC
  `).all(req.user.id);

  // Group by repo
  const projects = {};
  for (const sp of starPoints) {
    if (!projects[sp.repo_id]) {
      projects[sp.repo_id] = {
        name: sp.full_name,
        language: sp.language,
        highlights: [],
      };
    }
    projects[sp.repo_id].highlights.push(
      `${sp.situation} ${sp.task}. ${sp.action} ${sp.result}`
    );
  }

  const jsonResume = {
    basics: {
      name: user.name || user.login,
      profiles: [{
        network: 'GitHub',
        username: user.login,
        url: `https://github.com/${user.login}`,
      }],
    },
    projects: Object.values(projects),
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="resume.json"');
  res.json(jsonResume);
});

// FR-7.1: Export as Markdown
router.get('/markdown', (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const starPoints = db.prepare(`
    SELECT sp.*, r.full_name, r.language FROM star_points sp
    JOIN repos r ON sp.repo_id = r.id
    WHERE r.user_id = ? AND sp.is_active = 1
    ORDER BY sp.created_at DESC
  `).all(req.user.id);

  const projects = {};
  for (const sp of starPoints) {
    if (!projects[sp.repo_id]) {
      projects[sp.repo_id] = {
        name: sp.full_name,
        language: sp.language,
        points: [],
      };
    }
    projects[sp.repo_id].points.push(sp);
  }

  let md = `# ${user.name || user.login}\n\n`;
  md += `GitHub: [@${user.login}](https://github.com/${user.login})\n\n`;
  md += `## Projects\n\n`;

  for (const proj of Object.values(projects)) {
    md += `### ${proj.name}\n`;
    if (proj.language) md += `*${proj.language}*\n\n`;
    for (const sp of proj.points) {
      md += `- **${sp.situation}** ${sp.task} ${sp.action} *${sp.result}*\n`;
    }
    md += '\n';
  }

  res.setHeader('Content-Type', 'text/markdown');
  res.setHeader('Content-Disposition', 'attachment; filename="resume.md"');
  res.send(md);
});

// FR-7.1: Export specific job match
router.get('/match/:matchId/markdown', (req, res) => {
  const db = getDb();
  const match = db.prepare('SELECT * FROM job_matches WHERE id = ? AND user_id = ?')
    .get(req.params.matchId, req.user.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });

  const rewritten = JSON.parse(match.rewritten_points || '[]');
  let md = `# Resume - ${match.jd_title || 'Target Position'}`;
  if (match.jd_company) md += ` @ ${match.jd_company}`;
  md += `\n\n`;

  for (const sp of rewritten) {
    md += `- **${sp.situation}** ${sp.task} ${sp.action} *${sp.result}*\n`;
  }

  const report = JSON.parse(match.match_report || '{}');
  if (report.matched_keywords?.length) {
    md += `\n## Matched Keywords\n${report.matched_keywords.join(', ')}\n`;
  }
  if (report.coverage_score) {
    md += `\n**Coverage Score:** ${Math.round(report.coverage_score * 100)}%\n`;
  }

  res.setHeader('Content-Type', 'text/markdown');
  res.setHeader('Content-Disposition', `attachment; filename="resume-${match.jd_title || 'match'}.md"`);
  res.send(md);
});

// FR-5.4: Create PR to resume repo
router.post('/pr', async (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const repoName = req.body.repoName || getSetting(req.user.id, 'resume_repo') || `${user.login}/resume`;

    const [owner, repo] = repoName.includes('/') ? repoName.split('/') : [user.login, repoName];
    const github = new GitHubService(user.access_token);

    // Ensure repo exists
    try {
      await github.getRepo(owner, repo);
    } catch {
      if (owner === user.login) {
        await github.createRepo(repo);
      } else {
        return res.status(404).json({ error: `Repository ${repoName} not found` });
      }
    }

    // Generate markdown content
    const agent = new AgentOrchestrator();
    const starPoints = db.prepare(`
      SELECT sp.*, r.full_name, r.language FROM star_points sp
      JOIN repos r ON sp.repo_id = r.id
      WHERE r.user_id = ? AND sp.is_active = 1
      ORDER BY sp.created_at DESC
    `).all(req.user.id);

    const projects = {};
    for (const sp of starPoints) {
      if (!projects[sp.repo_id]) projects[sp.repo_id] = { name: sp.full_name, language: sp.language, points: [] };
      projects[sp.repo_id].points.push(sp);
    }

    let md = `# ${user.name || user.login}\n\n`;
    md += `GitHub: [@${user.login}](https://github.com/${user.login})\n\n`;
    md += `## Projects\n\n`;
    for (const proj of Object.values(projects)) {
      md += `### ${proj.name}\n`;
      if (proj.language) md += `*${proj.language}*\n\n`;
      for (const sp of proj.points) {
        md += `- **${sp.situation}** ${sp.task} ${sp.action} *${sp.result}*\n`;
      }
      md += '\n';
    }

    // Create branch and PR
    const timestamp = Date.now();
    const branchName = `repo2star-update-${timestamp}`;

    let defaultBranch = 'main';
    try {
      const repoInfo = await github.getRepo(owner, repo);
      defaultBranch = repoInfo.default_branch || 'main';
    } catch {}

    const headRepo = await github.getRepo(owner, repo);
    await github.createBranch(owner, repo, branchName, headRepo.default_branch_sha || headRepo.sha || 'HEAD');

    // Try to update existing file, or create new
    const existingSha = await github.getFileSha(owner, repo, 'resume.md', branchName);
    if (existingSha) {
      await github.updateFile(owner, repo, 'resume.md', md, 'Update resume via Repo2STAR', existingSha, branchName);
    } else {
      await github.createFile(owner, repo, 'resume.md', md, 'Add resume via Repo2STAR', branchName);
    }

    const pr = await github.createPullRequest(
      owner, repo,
      `Update resume - ${new Date().toISOString().split('T')[0]}`,
      `Auto-generated resume update by Repo2STAR Agent\n\n${md.substring(0, 2000)}`,
      branchName, defaultBranch
    );

    agent.logAction(req.user.id, 'pr_created', `Created PR #${pr.number} on ${repoName}`);
    res.json({ success: true, pr_url: pr.html_url, pr_number: pr.number });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FR-7.3: Push to Notion/Feishu
router.post('/push', async (req, res) => {
  try {
    const { target } = req.body; // 'notion' or 'feishu'
    const db = getDb();
    const integration = new IntegrationService();

    const starPoints = db.prepare(`
      SELECT sp.*, r.full_name FROM star_points sp
      JOIN repos r ON sp.repo_id = r.id
      WHERE r.user_id = ? AND sp.is_active = 1
      ORDER BY sp.created_at DESC
    `).all(req.user.id);

    const resumeData = integration.formatResumeForExport(starPoints);

    if (target === 'notion') {
      const apiKey = getSetting(req.user.id, 'notion_api_key');
      const pageId = getSetting(req.user.id, 'notion_page_id');
      if (!apiKey) return res.status(400).json({ error: 'Notion API key not configured. Go to Settings.' });
      const result = await integration.pushToNotion(apiKey, pageId, resumeData);
      const agent = new AgentOrchestrator();
      agent.logAction(req.user.id, 'push_notion', 'Pushed resume to Notion');
      return res.json(result);
    }

    if (target === 'feishu') {
      const webhookUrl = getSetting(req.user.id, 'feishu_webhook_url');
      if (!webhookUrl) return res.status(400).json({ error: 'Feishu webhook URL not configured. Go to Settings.' });
      const result = await integration.pushToFeishu(webhookUrl, resumeData);
      const agent = new AgentOrchestrator();
      agent.logAction(req.user.id, 'push_feishu', 'Pushed resume to Feishu');
      return res.json(result);
    }

    res.status(400).json({ error: 'Invalid target. Use "notion" or "feishu".' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
