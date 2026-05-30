import { Octokit } from '@octokit/rest';

export class GitHubService {
  constructor(accessToken) {
    this.octokit = new Octokit({ auth: accessToken });
  }

  async getUser() {
    const { data } = await this.octokit.users.getAuthenticated();
    return data;
  }

  async listRepos(options = {}) {
    const { data } = await this.octokit.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: 'updated',
      ...options,
    });
    return data;
  }

  async getRepo(owner, repo) {
    const { data } = await this.octokit.repos.get({ owner, repo });
    return data;
  }

  async getReadme(owner, repo) {
    try {
      const { data } = await this.octokit.repos.getReadme({ owner, repo });
      return Buffer.from(data.content, 'base64').toString('utf-8');
    } catch {
      return null;
    }
  }

  async getTree(owner, repo, sha) {
    const { data } = await this.octokit.git.getTree({
      owner,
      repo,
      tree_sha: sha,
      recursive: 'true',
    });
    return data.tree;
  }

  async getFileContent(owner, repo, path) {
    try {
      const { data } = await this.octokit.repos.getContent({ owner, repo, path });
      if (data.encoding === 'base64') {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      return data.content;
    } catch {
      return null;
    }
  }

  async listCommits(owner, repo, options = {}) {
    const { data } = await this.octokit.repos.listCommits({
      owner,
      repo,
      per_page: 50,
      ...options,
    });
    return data;
  }

  async listIssues(owner, repo, options = {}) {
    const { data } = await this.octokit.issues.listForRepo({
      owner,
      repo,
      state: 'all',
      per_page: 30,
      ...options,
    });
    return data;
  }

  async listPullRequests(owner, repo) {
    const { data } = await this.octokit.pulls.list({
      owner,
      repo,
      state: 'all',
      per_page: 30,
      sort: 'updated',
    });
    return data;
  }

  async getLanguages(owner, repo) {
    const { data } = await this.octokit.repos.listLanguages({ owner, repo });
    return data;
  }

  async getContributorsStats(owner, repo) {
    try {
      const { data } = await this.octokit.repos.getContributorsStats({ owner, repo });
      return data;
    } catch {
      return [];
    }
  }

  async getRepoContents(owner, repo, path = '', branch) {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      });
      return Array.isArray(data) ? data : [data];
    } catch {
      return [];
    }
  }

  async createWebhook(owner, repo, config) {
    try {
      const { data } = await this.octokit.repos.createWebhook({
        owner,
        repo,
        config: {
          url: config.url,
          content_type: 'json',
          secret: config.secret,
        },
        events: ['push'],
        active: true,
      });
      return data;
    } catch {
      return null;
    }
  }

  async createFile(owner, repo, filePath, content, message, branch = 'main') {
    const { data } = await this.octokit.repos.createOrUpdateFileContents({
      owner, repo, path: filePath, message,
      content: Buffer.from(content).toString('base64'),
      branch,
    });
    return data;
  }

  async updateFile(owner, repo, filePath, content, message, sha, branch = 'main') {
    const { data } = await this.octokit.repos.createOrUpdateFileContents({
      owner, repo, path: filePath, message,
      content: Buffer.from(content).toString('base64'),
      sha, branch,
    });
    return data;
  }

  async createPullRequest(owner, repo, title, body, head, base = 'main') {
    const { data } = await this.octokit.pulls.create({
      owner, repo, title, body, head, base,
    });
    return data;
  }

  async createBranch(owner, repo, branchName, baseSha) {
    const { data } = await this.octokit.git.createRef({
      owner, repo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });
    return data;
  }

  async createRepo(name, options = {}) {
    const { data } = await this.octokit.repos.createForAuthenticatedUser({
      name,
      auto_init: true,
      description: options.description || 'Auto-generated resume by Repo2STAR',
      private: options.private ?? false,
    });
    return data;
  }

  async getFileSha(owner, repo, filePath, branch = 'main') {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner, repo, path: filePath, ref: branch,
      });
      return data.sha;
    } catch {
      return null;
    }
  }
}
