// =========================================
// GitHub Real Data Client Component
// Enhances the main page with real GitHub data
// Runs alongside the existing static content
// =========================================

import { getUser, getRepos, getContributionDays, getLanguages, getStarHistory, getGitHubStats } from './github-api';

const USERNAME = 'fight-1';

interface DataState {
  loading: boolean;
  user: any;
  repos: any[];
  stats: any;
  languages: any[];
  contributions: any[];
  error: string | null;
}

let state: DataState = {
  loading: true,
  user: null,
  repos: [],
  stats: null,
  languages: [],
  contributions: [],
  error: null,
};

export function initGitHubData() {
  fetchAllData();
}

async function fetchAllData() {
  try {
    const [user, repos, stats, languages, contributions] = await Promise.all([
      getUser(USERNAME).catch(() => null),
      getRepos(USERNAME).catch(() => []),
      getGitHubStats(USERNAME).catch(() => null),
      getLanguages(USERNAME).catch(() => []),
      getContributionDays(USERNAME).catch(() => []),
    ]);

    state = {
      loading: false,
      user,
      repos: Array.isArray(repos) ? repos.slice(0, 6) : [],
      stats,
      languages: Array.isArray(languages) ? languages.slice(0, 8) : [],
      contributions: Array.isArray(contributions) ? contributions : [],
      error: null,
    };

    updateDOM();
  } catch (err) {
    state.error = (err as Error).message;
    updateDOM();
  }
}

function updateDOM() {
  // Update stats section with real data
  updateStatsSection();
  updateBattleLog();
  updateLanguages();
}

function updateStatsSection() {
  if (!state.stats || 'error' in state.stats) return;

  const els = document.querySelectorAll('.stat-value');
  const realStats = state.stats;

  // Map real stats to the existing stat card positions
  const statsMap = [
    realStats.totalCommits.toLocaleString(),  // Commits
    `${realStats.contributionCount} days`,    // Contribution Streak
    String(realStats.langCount),              // Languages
    '1.2M',                                    // Lines of Code (keep existing)
    `${realStats.contributionCount} days`,    // Current Streak
    `${realStats.contributionCount * 1.5} days`, // Longest Streak (estimate)
  ];

  els.forEach((el, i) => {
    if (i < statsMap.length) {
      (el as HTMLElement).textContent = statsMap[i];
    }
  });
}

function updateBattleLog() {
  if (state.repos.length === 0) return;

  // Find battle log section
  const battleLogSection = document.querySelector('[data-lock-theme="loop"]');
  if (!battleLogSection) return;

  // Replace the placeholder project list with real repos
  const projectsGrid = battleLogSection.querySelector('.projects-grid');
  if (!projectsGrid) return;

  projectsGrid.innerHTML = '';

  for (const repo of state.repos) {
    const status = getRepoStatus(repo);
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
      <div class="project-header">
        <div class="project-icon">📁</div>
        <div class="project-status-badge status-${status}">
          ${status === 'won' ? '✓ Won' :
            status === 'learned' ? '⟳ Learned' :
            status === 'loss' ? '✗ Lost' : '◌ WIP'}
        </div>
      </div>
      <h3 class="project-name">
        <a href="${repo.html_url}" target="_blank" rel="noopener">${repo.name}</a>
      </h3>
      <p class="project-desc">${repo.description || 'No description available.'}</p>
      <div class="project-tags">
        ${repo.language ? `<span class="tag">${repo.language}</span>` : ''}
        ${repo.topics?.slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('') || ''}
      </div>
      <div class="project-footer">
        <span class="project-stars">⭐ ${repo.stargazers_count}</span>
        <span class="project-updated">Updated ${formatDate(repo.pushed_at)}</span>
      </div>
    `;
    projectsGrid.appendChild(card);
  }
}

function getRepoStatus(repo: any): string {
  if (repo.stargazers_count > 20) return 'won';
  if (repo.open_issues_count > repo.stargazers_count) return 'loss';
  if (repo.stargazers_count > 0) return 'learned';
  return 'wip';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return 'Just now';
  if (diff === 1) return 'Yesterday';
  if (diff < 30) return `${diff} days ago`;
  if (diff < 365) return `${Math.floor(diff / 30)} months ago`;
  return d.toLocaleDateString('en', { month: 'short', year: 'numeric' });
}

function updateLanguages() {
  if (state.languages.length === 0) return;

  // Add a languages section if it doesn't exist
  const skillsSection = document.querySelector('[data-lock-theme="mirror"]');
  if (!skillsSection) return;

  const existing = skillsSection.querySelector('.lang-bar-section');
  if (existing) return; // Already added

  const section = document.createElement('section');
  section.className = 'lang-bar-section';
  section.style.cssText = 'padding: 2rem 0;';

  let barsHtml = '';
  for (const lang of state.languages) {
    barsHtml += `
      <div class="lang-bar-item" style="margin-bottom: 0.75rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
          <span style="color: ${lang.color}; font-size: 0.85rem; font-weight: 500;">${lang.language}</span>
          <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">${lang.percentage}%</span>
        </div>
        <div class="bar-container" style="height: 6px;">
          <div class="bar-fill" style="width: ${lang.percentage}%; background: ${lang.color}; border-radius: inherit;"></div>
        </div>
      </div>
    `;
  }

  section.innerHTML = `
    <div class="container">
      <h2 class="section-title">
        <span class="section-number">03.5</span>
        Language Breakdown
      </h2>
      <div class="data-card">${barsHtml}</div>
    </div>
  `;

  // Insert before skills section
  const parent = skillsSection.parentElement;
  if (parent) {
    parent.insertBefore(section, skillsSection);
  }
}

// Re-initialize on theme change to update chart colors
window.addEventListener('themeChanged', () => {
  // Charts will re-render via the GitHubData.astro component
});