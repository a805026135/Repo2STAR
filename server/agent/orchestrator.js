import { GitHubService } from '../services/github.js';
import { AnalyzerService } from '../services/analyzer.js';
import { StarGeneratorService } from '../services/starGenerator.js';
import { JobMatcherService } from '../services/jobMatcher.js';
import { getDb } from '../db/schema.js';


export class AgentOrchestrator {
  constructor() {
    this.starGen = new StarGeneratorService();
    this.jobMatcher = new JobMatcherService();
    this.pendingDebounce = new Map();
  }

  getGitHub(userId) {
    const db = getDb();
    const user = db.prepare('SELECT access_token FROM users WHERE id = ?').get(userId);
    if (!user) throw new Error('User not found');
    return new GitHubService(user.access_token);
  }

  // FR-1.2: Trigger analysis for a specific repo
  async analyzeRepository(userId, repoId) {
    const db = getDb();
    const repo = db.prepare('SELECT * FROM repos WHERE id = ? AND user_id = ?').get(repoId, userId);
    if (!repo) throw new Error('Repository not found');

    const [owner, name] = repo.full_name.split('/');
    const github = this.getGitHub(userId);
    const analyzer = new AnalyzerService(github);

    // Create analysis record
    const analysisInsert = db.prepare(
      'INSERT INTO analyses (repo_id, status) VALUES (?, ?)'
    );
    const { lastInsertRowid: analysisId } = analysisInsert.run(repoId, 'running');
    this.logAction(userId, 'analyze_start', `Starting analysis of ${repo.full_name}`);

    try {
      console.log(`[Analyzer] Calling mimo API for ${repo.full_name}...`);
      const result = await analyzer.analyzeRepo(owner, name, repo.default_branch);
      console.log(`[Analyzer] API response received, tech_stack=${result.tech_stack?.length || 0} items`);

      db.prepare(`
        UPDATE analyses SET status = ?, tech_stack = ?, architecture = ?,
        core_logic = ?, personal_contributions = ?, commit_summary = ?,
        readme_summary = ?, completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        'completed',
        JSON.stringify(result.tech_stack),
        result.architecture,
        result.core_logic,
        JSON.stringify(result.personal_contributions),
        result.commit_summary,
        result.readme_summary,
        analysisId
      );

      db.prepare('UPDATE repos SET last_analyzed_at = CURRENT_TIMESTAMP WHERE id = ?').run(repoId);
      this.logAction(userId, 'analyze_complete', `Analysis completed for ${repo.full_name}`);

      return { analysisId: Number(analysisId), result };
    } catch (err) {
      db.prepare('UPDATE analyses SET status = ?, error_message = ? WHERE id = ?')
        .run('failed', err.message, analysisId);
      this.logAction(userId, 'analyze_failed', `Analysis failed for ${repo.full_name}: ${err.message}`, 'error');
      throw err;
    }
  }

  // FR-4.1: Generate STAR points from analysis
  async generateStarPoints(userId, repoId, analysisId) {
    const db = getDb();
    const repo = db.prepare('SELECT * FROM repos WHERE id = ? AND user_id = ?').get(repoId, userId);
    const analysis = db.prepare('SELECT * FROM analyses WHERE id = ?').get(analysisId);
    console.log(`[STAR] repo=${repo?.full_name || 'NULL'} analysis=${analysis ? `id=${analysis.id} status=${analysis.status}` : 'NULL'} analysisId=${analysisId}`);
    if (!repo || !analysis) throw new Error(`Repo or analysis not found (repo=${!!repo}, analysis=${!!analysis}, analysisId=${analysisId})`);

    const [owner, name] = repo.full_name.split('/');
    const parsedAnalysis = {
      tech_stack: JSON.parse(analysis.tech_stack || '[]'),
      architecture: analysis.architecture,
      core_logic: analysis.core_logic,
      personal_contributions: JSON.parse(analysis.personal_contributions || '[]'),
      commit_summary: analysis.commit_summary,
    };

    const result = await this.starGen.generateStarPoints(parsedAnalysis, {
      full_name: repo.full_name,
      description: repo.description,
      language: repo.language,
    });

    const insertStmt = db.prepare(`
      INSERT INTO star_points (repo_id, analysis_id, situation, task, action, result, skills, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const starPointIds = [];
    for (const sp of result.star_points || []) {
      const { lastInsertRowid } = insertStmt.run(
        repoId, analysisId,
        sp.situation, sp.task, sp.action, sp.result,
        JSON.stringify(sp.skills || []),
        JSON.stringify(sp.tags || [])
      );
      starPointIds.push(Number(lastInsertRowid));
    }

    this.logAction(userId, 'star_generated', `Generated ${starPointIds.length} STAR points for ${repo.full_name}`);
    return { starPointIds, points: result.star_points };
  }

  // Full pipeline: analyze + generate + auto-suggest check
  async fullPipeline(userId, repoId) {
    const db = getDb();
    const prevAnalysis = db.prepare(
      "SELECT id FROM analyses WHERE repo_id = ? AND status = 'completed' ORDER BY created_at DESC LIMIT 1"
    ).get(repoId);

    console.log(`[Pipeline] Starting for user=${userId} repo=${repoId}`);
    const analysis = await this.analyzeRepository(userId, repoId);
    console.log(`[Pipeline] Analysis done, analysisId=${analysis.analysisId}`);
    const stars = await this.generateStarPoints(userId, repoId, analysis.analysisId);
    console.log(`[Pipeline] STAR generation done, ${stars.starPointIds.length} points`);

    // FR-4.3: Check if analysis changed significantly
    if (prevAnalysis) {
      await this.checkAndCreateSuggestion(userId, repoId, analysis.analysisId, prevAnalysis.id);
    }

    return { analysis, stars };
  }

  // FR-5.1/FR-5.2: Match and rewrite for job
  async matchJob(userId, jdText, jdTitle, jdCompany) {
    const db = getDb();
    const starPoints = db.prepare(`
      SELECT sp.*, r.full_name FROM star_points sp
      JOIN repos r ON sp.repo_id = r.id
      WHERE r.user_id = ? AND sp.is_active = 1
    `).all(userId);

    if (starPoints.length === 0) throw new Error('No STAR points available. Analyze a repo first.');

    // Select best projects
    const grouped = {};
    for (const sp of starPoints) {
      if (!grouped[sp.repo_id]) grouped[sp.repo_id] = { repo_id: sp.repo_id, full_name: sp.full_name, points: [] };
      grouped[sp.repo_id].points.push({
        id: sp.id,
        situation: sp.situation,
        task: sp.task,
        action: sp.action,
        result: sp.result,
        skills: JSON.parse(sp.skills || '[]'),
      });
    }

    const selection = await this.jobMatcher.selectBestProjects(Object.values(grouped), jdText, jdTitle);

    // Rewrite selected points
    const selectedPoints = starPoints.filter(sp =>
      selection.selected_project_ids?.includes(sp.repo_id)
    );

    const rewrite = await this.starGen.rewriteForJob(selectedPoints, jdText, jdTitle);

    // Save job match
    const { lastInsertRowid: matchId } = db.prepare(`
      INSERT INTO job_matches (user_id, jd_text, jd_title, jd_company, matched_points, rewritten_points, match_report, coverage_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId, jdText, jdTitle, jdCompany,
      JSON.stringify(selection),
      JSON.stringify(rewrite.rewritten_points),
      JSON.stringify(rewrite.match_report),
      rewrite.match_report?.coverage_score || 0
    );

    this.logAction(userId, 'job_match', `Matched job: ${jdTitle} at ${jdCompany || 'Unknown'}`);

    return {
      matchId: Number(matchId),
      selection,
      rewritten: rewrite.rewritten_points,
      report: rewrite.match_report,
    };
  }

  // FR-6.1: Generate interview questions
  async generateInterviewPrep(userId, repoId) {
    const db = getDb();
    const starPoints = db.prepare(`
      SELECT * FROM star_points WHERE repo_id = ? AND is_active = 1
    `).all(repoId);

    const latestAnalysis = db.prepare(`
      SELECT * FROM analyses WHERE repo_id = ? AND status = 'completed' ORDER BY created_at DESC LIMIT 1
    `).get(repoId);

    return this.jobMatcher.generateInterviewQuestions(starPoints, latestAnalysis);
  }

  // FR-2.2: Debounced webhook handler
  handleWebhookPush(payload) {
    const repoFullName = payload.repository?.full_name;
    if (!repoFullName) return;

    // Debounce: wait 60s after last push event for same repo
    if (this.pendingDebounce.has(repoFullName)) {
      clearTimeout(this.pendingDebounce.get(repoFullName));
    }

    this.pendingDebounce.set(repoFullName, setTimeout(async () => {
      this.pendingDebounce.delete(repoFullName);
      const db = getDb();
      const repo = db.prepare('SELECT * FROM repos WHERE full_name = ? AND is_watching = 1').get(repoFullName);
      if (repo) {
        try {
          await this.fullPipeline(repo.user_id, repo.id);
        } catch (err) {
          console.error(`Webhook analysis failed for ${repoFullName}:`, err.message);
        }
      }
    }, 60000));
  }

  // FR-4.4: User feedback
  async recordFeedback(userId, starPointId, feedbackValue) {
    const db = getDb();
    const sp = db.prepare(`
      SELECT sp.* FROM star_points sp
      JOIN repos r ON sp.repo_id = r.id
      WHERE sp.id = ? AND r.user_id = ?
    `).get(starPointId, userId);

    if (!sp) throw new Error('STAR point not found');

    db.prepare('UPDATE star_points SET feedback = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(feedbackValue, starPointId);

    // Generate improved version based on feedback
    const improved = await this.starGen.suggestImprovements(sp, feedbackValue);
    this.logAction(userId, 'feedback_recorded', `Feedback (${feedbackValue > 0 ? '👍' : '👎'}) on STAR point ${starPointId}`);

    return improved;
  }

  // Get all user repos with analysis status
  async getUserReposOverview(userId) {
    const db = getDb();
    return db.prepare(`
      SELECT r.*,
        (SELECT COUNT(*) FROM analyses WHERE repo_id = r.id AND status = 'completed') as analysis_count,
        (SELECT COUNT(*) FROM star_points WHERE repo_id = r.id AND is_active = 1) as star_count,
        (SELECT created_at FROM analyses WHERE repo_id = r.id AND status = 'completed' ORDER BY created_at DESC LIMIT 1) as last_analysis
      FROM repos r WHERE r.user_id = ?
      ORDER BY r.last_analyzed_at DESC NULLS LAST
    `).all(userId);
  }

  // FR-3.3: Cross-repo skill synthesis
  async synthesizeUserProfile(userId) {
    const db = getDb();

    // Check cached profile (within 24 hours)
    const cached = db.prepare(
      "SELECT * FROM skill_profiles WHERE user_id = ? AND updated_at > datetime('now', '-24 hours') ORDER BY updated_at DESC LIMIT 1"
    ).get(userId);
    if (cached) {
      return { ...JSON.parse(cached.profile_json), analysis_count: cached.analysis_count, cached: true };
    }

    const starPoints = db.prepare(`
      SELECT sp.*, r.full_name FROM star_points sp
      JOIN repos r ON sp.repo_id = r.id
      WHERE r.user_id = ? AND sp.is_active = 1
    `).all(userId);

    if (starPoints.length === 0) throw new Error('No STAR points available. Analyze repos first.');

    const analyses = db.prepare(`
      SELECT a.* FROM analyses a
      JOIN repos r ON a.repo_id = r.id
      WHERE r.user_id = ? AND a.status = 'completed'
    `).all(userId);

    const profile = await this.starGen.synthesizeCrossRepoSkills(starPoints, analyses);

    // Upsert: delete old, insert new
    db.prepare('DELETE FROM skill_profiles WHERE user_id = ?').run(userId);
    db.prepare(
      'INSERT INTO skill_profiles (user_id, profile_json, analysis_count) VALUES (?, ?, ?)'
    ).run(userId, JSON.stringify(profile), analyses.length);

    this.logAction(userId, 'skill_synthesis', `Synthesized skills from ${starPoints.length} STAR points across ${analyses.length} analyses`);
    return { ...profile, analysis_count: analyses.length, cached: false };
  }

  // FR-4.3: Check and create suggestions after analysis
  async checkAndCreateSuggestion(userId, repoId, newAnalysisId, oldAnalysisId) {
    const db = getDb();
    const oldAnalysis = db.prepare('SELECT * FROM analyses WHERE id = ?').get(oldAnalysisId);
    const newAnalysis = db.prepare('SELECT * FROM analyses WHERE id = ?').get(newAnalysisId);
    if (!oldAnalysis || !newAnalysis) return;

    const github = this.getGitHub(userId);
    const analyzer = new AnalyzerService(github);
    const changes = analyzer.detectSignificantChanges(oldAnalysis, newAnalysis);

    if (changes.hasChanges) {
      db.prepare(
        'INSERT INTO suggestions (repo_id, user_id, analysis_id, old_analysis_id, change_summary) VALUES (?, ?, ?, ?, ?)'
      ).run(repoId, userId, newAnalysisId, oldAnalysisId, changes.changeSummary);
      this.logAction(userId, 'suggestion_available', changes.changeSummary);
    }
  }

  // FR-6.2: Enhanced interview prep with persistence
  async generateInterviewPrepPersisted(userId, repoId) {
    const db = getDb();
    const repo = db.prepare('SELECT * FROM repos WHERE id = ? AND user_id = ?').get(repoId, userId);
    if (!repo) throw new Error('Repository not found');

    const result = await this.generateInterviewPrep(userId, repoId);

    db.prepare(
      'INSERT INTO interview_prep (repo_id, user_id, questions_json) VALUES (?, ?, ?)'
    ).run(repoId, userId, JSON.stringify(result));

    this.logAction(userId, 'interview_prep', `Generated interview questions for ${repo.full_name}`);
    return result;
  }

  logAction(userId, action, detail, status = 'success') {
    const db = getDb();
    db.prepare('INSERT INTO agent_logs (user_id, action, detail, status) VALUES (?, ?, ?, ?)')
      .run(userId, action, detail, status);
  }
}
