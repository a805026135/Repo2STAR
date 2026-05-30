import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getDb } from '../db/schema.js';
import { AgentOrchestrator } from '../agent/orchestrator.js';

const router = Router();
router.use(authMiddleware);

const agent = new AgentOrchestrator();

// Trigger analysis for a repo (FR-1.2)
router.post('/analyze/:repoId', async (req, res) => {
  const repoId = parseInt(req.params.repoId);
  console.log(`[Route] Analyze request: user=${req.user.id} repo=${repoId}`);
  try {
    const result = await agent.fullPipeline(req.user.id, repoId);
    console.log(`[Route] Analysis success`);
    res.json(result);
  } catch (err) {
    console.error(`[Route] Analysis error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get analysis status/history
router.get('/repo/:repoId', (req, res) => {
  const db = getDb();
  const analyses = db.prepare(`
    SELECT * FROM analyses WHERE repo_id = ?
    ORDER BY created_at DESC
  `).all(req.params.repoId);
  res.json(analyses);
});

// Get STAR points for a repo
router.get('/stars/:repoId', (req, res) => {
  const db = getDb();
  const points = db.prepare(`
    SELECT sp.*, r.full_name FROM star_points sp
    JOIN repos r ON sp.repo_id = r.id
    WHERE sp.repo_id = ? AND r.user_id = ?
    ORDER BY sp.created_at DESC
  `).all(req.params.repoId, req.user.id);
  res.json(points.map(p => ({
    ...p,
    skills: JSON.parse(p.skills || '[]'),
    tags: JSON.parse(p.tags || '[]'),
  })));
});

// Get all STAR points for user
router.get('/stars', (req, res) => {
  const db = getDb();
  const points = db.prepare(`
    SELECT sp.*, r.full_name FROM star_points sp
    JOIN repos r ON sp.repo_id = r.id
    WHERE r.user_id = ? AND sp.is_active = 1
    ORDER BY sp.created_at DESC
  `).all(req.user.id);
  res.json(points.map(p => ({
    ...p,
    skills: JSON.parse(p.skills || '[]'),
    tags: JSON.parse(p.tags || '[]'),
  })));
});

// FR-4.4: Record feedback on STAR point
router.post('/stars/:starId/feedback', async (req, res) => {
  const { value } = req.body; // 1 for like, -1 for dislike
  try {
    const result = await agent.recordFeedback(req.user.id, parseInt(req.params.starId), value);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a STAR point manually
router.put('/stars/:starId', (req, res) => {
  const db = getDb();
  const { situation, task, action, result, skills, tags } = req.body;
  const sp = db.prepare(`
    SELECT sp.* FROM star_points sp
    JOIN repos r ON sp.repo_id = r.id
    WHERE sp.id = ? AND r.user_id = ?
  `).get(req.params.starId, req.user.id);

  if (!sp) return res.status(404).json({ error: 'STAR point not found' });

  db.prepare(`
    UPDATE star_points SET
      situation = COALESCE(?, situation), task = COALESCE(?, task),
      action = COALESCE(?, action), result = COALESCE(?, result),
      skills = COALESCE(?, skills), tags = COALESCE(?, tags),
      version = version + 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(situation, task, action, result,
    skills ? JSON.stringify(skills) : null,
    tags ? JSON.stringify(tags) : null,
    req.params.starId);

  res.json({ success: true });
});

// Toggle STAR point active status
router.patch('/stars/:starId/toggle', (req, res) => {
  const db = getDb();
  db.prepare('UPDATE star_points SET is_active = NOT is_active WHERE id = ?').run(req.params.starId);
  res.json({ success: true });
});

// Agent activity logs
router.get('/logs', (req, res) => {
  const db = getDb();
  const logs = db.prepare(`
    SELECT * FROM agent_logs WHERE user_id = ?
    ORDER BY created_at DESC LIMIT 50
  `).all(req.user.id);
  res.json(logs);
});

// FR-3.3: Cross-repo skill synthesis
router.get('/skills', async (req, res) => {
  try {
    const force = req.query.force === 'true';
    if (!force) {
      const db = getDb();
      const cached = db.prepare(
        "SELECT * FROM skill_profiles WHERE user_id = ? AND updated_at > datetime('now', '-24 hours') ORDER BY updated_at DESC LIMIT 1"
      ).get(req.user.id);
      if (cached) {
        return res.json({ ...JSON.parse(cached.profile_json), analysis_count: cached.analysis_count, cached: true });
      }
    }
    const profile = await agent.synthesizeUserProfile(req.user.id);
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FR-4.3: Get pending suggestions
router.get('/suggestions', (req, res) => {
  const db = getDb();
  const suggestions = db.prepare(`
    SELECT s.*, r.full_name FROM suggestions s
    JOIN repos r ON s.repo_id = r.id
    WHERE s.user_id = ? AND s.status = 'pending'
    ORDER BY s.created_at DESC
  `).all(req.user.id);
  res.json(suggestions);
});

// FR-4.3: Accept suggestion - regenerate STAR
router.post('/suggestions/:id/accept', async (req, res) => {
  try {
    const db = getDb();
    const suggestion = db.prepare('SELECT * FROM suggestions WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);
    if (!suggestion) return res.status(404).json({ error: 'Suggestion not found' });

    db.prepare('UPDATE suggestions SET status = ? WHERE id = ?').run('accepted', req.params.id);

    const stars = await agent.generateStarPoints(req.user.id, suggestion.repo_id, suggestion.analysis_id);
    agent.logAction(req.user.id, 'suggestion_accepted', `Accepted suggestion for repo ${suggestion.repo_id}`);
    res.json({ success: true, stars });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FR-4.3: Ignore suggestion
router.post('/suggestions/:id/ignore', (req, res) => {
  const db = getDb();
  db.prepare('UPDATE suggestions SET status = ? WHERE id = ? AND user_id = ?')
    .run('ignored', req.params.id, req.user.id);
  res.json({ success: true });
});

export default router;
