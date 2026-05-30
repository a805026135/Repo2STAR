import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getDb } from '../db/schema.js';
import { AgentOrchestrator } from '../agent/orchestrator.js';

const router = Router();
router.use(authMiddleware);

const agent = new AgentOrchestrator();

// FR-5.1/FR-5.2: Match and rewrite for job
router.post('/match', async (req, res) => {
  const { jd_text, jd_title, jd_company } = req.body;
  if (!jd_text) return res.status(400).json({ error: 'Job description is required' });

  try {
    const result = await agent.matchJob(req.user.id, jd_text, jd_title, jd_company);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get match history
router.get('/matches', (req, res) => {
  const db = getDb();
  const matches = db.prepare(`
    SELECT * FROM job_matches WHERE user_id = ?
    ORDER BY created_at DESC LIMIT 20
  `).all(req.user.id);
  res.json(matches.map(m => ({
    ...m,
    matched_points: JSON.parse(m.matched_points || '{}'),
    rewritten_points: JSON.parse(m.rewritten_points || '[]'),
    match_report: JSON.parse(m.match_report || '{}'),
  })));
});

// Get specific match detail
router.get('/matches/:matchId', (req, res) => {
  const db = getDb();
  const match = db.prepare('SELECT * FROM job_matches WHERE id = ? AND user_id = ?')
    .get(req.params.matchId, req.user.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });

  res.json({
    ...match,
    matched_points: JSON.parse(match.matched_points || '{}'),
    rewritten_points: JSON.parse(match.rewritten_points || '[]'),
    match_report: JSON.parse(match.match_report || '{}'),
  });
});

// Delete match
router.delete('/matches/:matchId', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM job_matches WHERE id = ? AND user_id = ?')
    .run(req.params.matchId, req.user.id);
  res.json({ success: true });
});

// FR-6.1/6.2: Generate interview questions with persistence
router.post('/interview-prep/:repoId', async (req, res) => {
  try {
    const result = await agent.generateInterviewPrepPersisted(req.user.id, parseInt(req.params.repoId));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get saved interview preps
router.get('/interview-prep', (req, res) => {
  const db = getDb();
  const preps = db.prepare(`
    SELECT ip.*, r.full_name FROM interview_prep ip
    JOIN repos r ON ip.repo_id = r.id
    WHERE ip.user_id = ?
    ORDER BY ip.created_at DESC LIMIT 20
  `).all(req.user.id);
  res.json(preps.map(p => ({
    ...p,
    questions: JSON.parse(p.questions_json || '{}'),
  })));
});

// Get specific interview prep
router.get('/interview-prep/:prepId', (req, res) => {
  const db = getDb();
  const prep = db.prepare(`
    SELECT ip.*, r.full_name FROM interview_prep ip
    JOIN repos r ON ip.repo_id = r.id
    WHERE ip.id = ? AND ip.user_id = ?
  `).get(req.params.prepId, req.user.id);
  if (!prep) return res.status(404).json({ error: 'Interview prep not found' });
  res.json({ ...prep, questions: JSON.parse(prep.questions_json || '{}') });
});

export default router;
