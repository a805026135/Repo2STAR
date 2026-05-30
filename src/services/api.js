const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('repo2star_token');
  }

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('repo2star_token', token);
    else localStorage.removeItem('repo2star_token');
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    return headers;
  }

  async request(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...this.getHeaders(), ...options.headers },
    });
    if (res.status === 401) {
      this.setToken(null);
      window.location.href = '/';
      throw new Error('Unauthorized');
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Request failed: ${res.status}`);
    }
    const contentType = res.headers.get('content-type');
    if (contentType?.includes('text/')) return res.text();
    return res.json();
  }

  // Auth
  getMe() { return this.request('/auth/me'); }
  getGithubAuthUrl() { return `${API_BASE}/auth/github`; }

  // Repos
  listGithubRepos() { return this.request('/repos/github'); }
  importRepos(repoIds) { return this.request('/repos/import', { method: 'POST', body: JSON.stringify({ repoIds }) }); }
  getManagedRepos() { return this.request('/repos'); }
  toggleWatch(repoId) { return this.request(`/repos/${repoId}/watch`, { method: 'PATCH' }); }
  removeRepo(repoId) { return this.request(`/repos/${repoId}`, { method: 'DELETE' }); }

  // Analysis
  analyzeRepo(repoId) { return this.request(`/analysis/analyze/${repoId}`, { method: 'POST' }); }
  getAnalyses(repoId) { return this.request(`/analysis/repo/${repoId}`); }
  getStarPoints(repoId) { return this.request(`/analysis/stars/${repoId}`); }
  getAllStarPoints() { return this.request('/analysis/stars'); }
  updateStarPoint(starId, data) { return this.request(`/analysis/stars/${starId}`, { method: 'PUT', body: JSON.stringify(data) }); }
  feedbackStarPoint(starId, value) { return this.request(`/analysis/stars/${starId}/feedback`, { method: 'POST', body: JSON.stringify({ value }) }); }
  toggleStarPoint(starId) { return this.request(`/analysis/stars/${starId}/toggle`, { method: 'PATCH' }); }
  getAgentLogs() { return this.request('/analysis/logs'); }

  // Job matching
  matchJob(jdText, jdTitle, jdCompany) {
    return this.request('/jobs/match', { method: 'POST', body: JSON.stringify({ jd_text: jdText, jd_title: jdTitle, jd_company: jdCompany }) });
  }
  getMatchHistory() { return this.request('/jobs/matches'); }
  getMatchDetail(matchId) { return this.request(`/jobs/matches/${matchId}`); }
  deleteMatch(matchId) { return this.request(`/jobs/matches/${matchId}`, { method: 'DELETE' }); }
  getInterviewPrep(repoId) { return this.request(`/jobs/interview-prep/${repoId}`, { method: 'POST' }); }

  // Skills
  getSkillProfile(force = false) { return this.request(`/analysis/skills${force ? '?force=true' : ''}`); }

  // Suggestions
  getSuggestions() { return this.request('/analysis/suggestions'); }
  acceptSuggestion(suggestionId) { return this.request(`/analysis/suggestions/${suggestionId}/accept`, { method: 'POST' }); }
  ignoreSuggestion(suggestionId) { return this.request(`/analysis/suggestions/${suggestionId}/ignore`, { method: 'POST' }); }

  // Interview Prep
  getInterviewPrepList() { return this.request('/jobs/interview-prep'); }
  getInterviewPrepDetail(prepId) { return this.request(`/jobs/interview-prep/${prepId}`); }

  // Settings
  getSettings() { return this.request('/settings'); }
  updateSetting(key, value) { return this.request('/settings', { method: 'PUT', body: JSON.stringify({ key, value }) }); }
  deleteSetting(key) { return this.request(`/settings/${key}`, { method: 'DELETE' }); }

  // Export
  exportJsonResume() { return this.request('/export/jsonresume'); }
  exportMarkdown() { return this.request('/export/markdown'); }
  exportMatchMarkdown(matchId) { return this.request(`/export/match/${matchId}/markdown`); }
  createResumePR(options = {}) { return this.request('/export/pr', { method: 'POST', body: JSON.stringify(options) }); }
  pushResume(target) { return this.request('/export/push', { method: 'POST', body: JSON.stringify({ target }) }); }

  // Health
  health() { return this.request('/health'); }
}

export const api = new ApiClient();
