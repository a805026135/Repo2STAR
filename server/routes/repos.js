import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getDb } from '../db/schema.js';
import { GitHubService } from '../services/github.js';

const router = Router();
router.use(authMiddleware);

// List user's GitHub repos (from GitHub API)
router.get('/github', async (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT access_token FROM users WHERE id = ?').get(req.user.id);
    const github = new GitHubService(user.access_token);
    const repos = await github.listRepos();

    // FR-1.3: Filter out repos with no code
    const filtered = repos.filter(r => !r.fork || r.stargazers_count > 0);

    res.json(filtered.map(r => ({
      id: r.id,
      full_name: r.full_name,
      name: r.name,
      description: r.description,
      language: r.language,
      private: r.private,
      stars: r.stargazers_count,
      updated_at: r.updated_at,
      default_branch: r.default_branch,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import repos to watch (FR-1.2)
router.post('/import', async (req, res) => {
  const { repoIds } = req.body; // Array of GitHub repo IDs
  if (!repoIds?.length) return res.status(400).json({ error: 'No repos selected' });

  const db = getDb();
  const user = db.prepare('SELECT access_token FROM users WHERE id = ?').get(req.user.id);
  const github = new GitHubService(user.access_token);
  const allRepos = await github.listRepos();

  const imported = [];
  for (const ghRepo of allRepos.filter(r => repoIds.includes(r.id))) {
    db.prepare(`
      INSERT INTO repos (user_id, github_repo_id, full_name, description, language, default_branch, is_private, is_watching)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(user_id, github_repo_id) DO UPDATE SET
        full_name = excluded.full_name, description = excluded.description,
        language = excluded.language, is_watching = 1, default_branch = excluded.default_branch
    `).run(req.user.id, ghRepo.id, ghRepo.full_name, ghRepo.description, ghRepo.language, ghRepo.default_branch, ghRepo.private ? 1 : 0);
    imported.push(ghRepo.full_name);
  }

  res.json({ imported, count: imported.length });
});

// List managed repos with status
router.get('/', async (req, res) => {
  try {
    const { AgentOrchestrator } = await import('../agent/orchestrator.js');
    const agent = new AgentOrchestrator();
    const repos = await agent.getUserReposOverview(req.user.id);
    res.json(repos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle watch status
router.patch('/:repoId/watch', (req, res) => {
  const db = getDb();
  const repo = db.prepare('SELECT * FROM repos WHERE id = ? AND user_id = ?').get(req.params.repoId, req.user.id);
  if (!repo) return res.status(404).json({ error: 'Repo not found' });

  db.prepare('UPDATE repos SET is_watching = ? WHERE id = ?').run(repo.is_watching ? 0 : 1, repo.id);
  res.json({ is_watching: !repo.is_watching });
});

// Remove repo from tracking
router.delete('/:repoId', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM repos WHERE id = ? AND user_id = ?').run(req.params.repoId, req.user.id);
  res.json({ success: true });
});

export default router;
