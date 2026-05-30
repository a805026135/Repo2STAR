import cron from 'node-cron';
import { getDb } from '../db/schema.js';

export class SchedulerService {
  constructor(orchestrator) {
    this.orchestrator = orchestrator;
    this.task = null;
  }

  start() {
    // Sunday 2:00 AM
    this.task = cron.schedule('0 2 * * 0', () => {
      this.runWeeklyScan().catch(err => {
        console.error('[Scheduler] Weekly scan failed:', err.message);
      });
    });
    console.log('[Scheduler] Weekly scan started (Sunday 02:00)');
  }

  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
    }
  }

  async runWeeklyScan() {
    console.log('[Scheduler] Starting weekly scan...');
    const db = getDb();

    const staleRepos = db.prepare(`
      SELECT r.*, u.id as uid
      FROM repos r
      JOIN users u ON r.user_id = u.id
      WHERE r.is_watching = 1
        AND (r.last_analyzed_at IS NULL OR r.last_analyzed_at < datetime('now', '-7 days'))
    `).all();

    if (staleRepos.length === 0) {
      console.log('[Scheduler] No stale repos found');
      return { scanned: 0 };
    }

    console.log(`[Scheduler] Found ${staleRepos.length} stale repos`);
    let success = 0;
    let failed = 0;

    for (const repo of staleRepos) {
      try {
        await this.orchestrator.fullPipeline(repo.uid, repo.id);
        this.orchestrator.logAction(repo.uid, 'scheduled_scan', `Scheduled re-analysis of ${repo.full_name}`);
        success++;
      } catch (err) {
        this.orchestrator.logAction(repo.uid, 'scheduled_scan', `Scheduled scan failed for ${repo.full_name}: ${err.message}`, 'error');
        failed++;
      }
    }

    console.log(`[Scheduler] Weekly scan complete: ${success} succeeded, ${failed} failed`);
    return { scanned: staleRepos.length, success, failed };
  }
}
