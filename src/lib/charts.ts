// =========================================
// Client-side GitHub Data Component
// Renders charts and data directly in the browser
// Uses Canvas API for performance
// =========================================

import type {
  GitHubUser, GitHubRepo, GitHubContributionDay,
  LanguageStat, StarHistory,
} from '../lib/github-api';

// SVG Path helpers for pie chart
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const clampedEnd = Math.min(endAngle, startAngle + 359.99);
  const startRad = ((clampedEnd - 90) * Math.PI) / 180;
  const endRad = ((startAngle - 90) * Math.PI) / 180;

  const x1 = cx + r * Math.cos(endRad);
  const y1 = cy + r * Math.sin(endRad);
  const x2 = cx + r * Math.cos(startRad);
  const y2 = cy + r * Math.sin(startRad);

  const largeArc = clampedEnd - startAngle > 180 ? 1 : 0;

  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

// Contribution heatmap cell rendering
function renderContributionHeatmap(
  container: HTMLElement,
  days: GitHubContributionDay[],
  theme: string
) {
  const levelColors: Record<string, string[]> = {
    mirror: ['#0d1117', '#00f3ff33', '#00f3ff66', '#00f3ff99', '#00f3ff'],
    version: ['#0d1117', '#00ff8833', '#00ff8866', '#00ff8899', '#00ff88'],
    loop: ['#0d1117', '#b478ff33', '#b478ff66', '#b478ff99', '#b478ff'],
  };

  const colors = levelColors[theme] || levelColors.mirror;

  // Create SVG grid
  const cols = 52;
  const rows = 7;
  const total = days.length;
  const startRow = Math.max(0, cols - Math.ceil(total / rows));

  const gridWidth = cols * 14;
  const gridHeight = rows * 14 + 20;

  let svgContent = `<svg width="${gridWidth + 10}" height="${gridHeight}" xmlns="http://www.w3.org/2000/svg" style="font-size:10px;">`;

  for (let col = 0; col < cols && col * rows < total; col++) {
    for (let row = 0; row < rows; row++) {
      const idx = col * rows + row;
      if (idx >= total) continue;
      const day = days[idx];
      const x = col * 15;
      const y = row * 15 + 10;

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', String(x));
      rect.setAttribute('y', String(y));
      rect.setAttribute('width', '13');
      rect.setAttribute('height', '13');
      rect.setAttribute('rx', '2');
      rect.setAttribute('fill', colors[day.level]);
      rect.setAttribute('class', `contrib-cell level-${day.level}`);

      if (day.date) {
        rect.setAttribute('data-date', day.date);
        rect.setAttribute('data-count', String(day.count));
        rect.title = `${day.date}: ${day.count} contributions`;
      }

      svgContent += `<rect x="${x}" y="${y}" width="13" height="13" rx="2" fill="${colors[day.level]}" />`;
    }
  }

  svgContent += '</svg>';
  container.innerHTML = svgContent;
}

// Pie chart for languages
function renderLanguagePie(container: HTMLElement, languages: LanguageStat[], theme: string) {
  const total = languages.reduce((s, l) => s + l.bytes, 0);
  if (total === 0) {
    container.innerHTML = '<p class="text-dim" style="font-size:0.85rem;">No data yet</p>';
    return;
  }

  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 80;
  const innerR = 50;

  let svgContent = `<svg width="${size}" height="${size + 60}" viewBox="0 0 ${size} ${size + 60}" xmlns="http://www.w3.org/2000/svg">`;

  let startAngle = 0;
  const donutSegments = languages.slice(0, 8); // Top 8

  for (const lang of donutSegments) {
    const angle = (lang.bytes / total) * 360;
    const endAngle = startAngle + angle;

    // Outer arc
    const outerStart = ((startAngle - 90) * Math.PI) / 180;
    const outerEnd = ((endAngle - 90) * Math.PI) / 180;

    const x1 = cx + r * Math.cos(outerStart);
    const y1 = cy + r * Math.sin(outerStart);
    const x2 = cx + r * Math.cos(outerEnd);
    const y2 = cy + r * Math.sin(outerEnd);

    const ix1 = cx + innerR * Math.cos(outerStart);
    const iy1 = cy + innerR * Math.sin(outerStart);
    const ix2 = cx + innerR * Math.cos(outerEnd);
    const iy2 = cy + innerR * Math.sin(outerEnd);

    const largeArc = angle > 180 ? 1 : 0;

    svgContent += `<path d="M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z" fill="${lang.color}" opacity="0.85" />`;

    startAngle = endAngle;
  }

  // Center text
  svgContent += `<text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="var(--text-primary)" font-size="14" font-weight="600" style="font-family: var(--font-mono);">${languages.length}</text>`;
  svgContent += `<text x="${cx}" y="${cy + 12}" text-anchor="middle" fill="var(--text-secondary)" font-size="9" style="font-family: var(--font-mono);">languages</text>`;

  // Legend
  const legendStartY = size + 15;
  let legendX = 10;
  for (const lang of donutSegments) {
    const label = lang.language;
    const maxLabelWidth = 70;
    const truncated = label.length > maxLabelWidth ? label.slice(0, maxLabelWidth - 1) + '…' : label;

    svgContent += `<rect x="${legendX}" y="${legendStartY}" width="10" height="10" rx="2" fill="${lang.color}" />`;
    svgContent += `<text x="${legendX + 14}" y="${legendStartY + 9}" fill="var(--text-secondary)" font-size="9" style="font-family: var(--font-mono);">${truncated}</text>`;
    legendX += Math.min(label.length * 7 + 20, 90);
    if (legendX > size - 100) {
      legendX = 10;
      legendStartY += 16;
    }
  }

  svgContent += '</svg>';
  container.innerHTML = svgContent;
}

// Star history line chart
function renderStarChart(container: HTMLElement, stars: StarHistory[], theme: string) {
  if (stars.length < 2) {
    container.innerHTML = '<p class="text-dim" style="font-size:0.85rem;">Not enough data yet</p>';
    return;
  }

  const width = 400;
  const height = 150;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const values = stars.map((s) => s.count);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const points = stars.map((s, i) => {
    const x = padding.left + (i / (stars.length - 1)) * chartW;
    const y = padding.top + chartH - ((s.count - minVal) / range) * chartH;
    return { x, y, ...s };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Gradient fill area
  const areaD = pathD + ` L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  const themeColor: Record<string, string> = {
    mirror: '#00f3ff',
    version: '#00ff88',
    loop: '#b478ff',
  };
  const color = themeColor[theme] || themeColor.mirror;

  // Y-axis labels
  const ySteps = 4;
  let yLabels = '';
  for (let i = 0; i <= ySteps; i++) {
    const val = minVal + (range * i) / ySteps;
    const y = padding.top + chartH - (i / ySteps) * chartH;
    yLabels += `<text x="${padding.left - 5}" y="${y + 4}" text-anchor="end" fill="var(--text-muted)" font-size="9" style="font-family: var(--font-mono);">${Math.round(val)}</text>`;
    yLabels += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="rgba(255,255,255,0.04)" stroke-width="1" />`;
  }

  // X-axis labels
  let xLabels = '';
  const labelInterval = Math.max(1, Math.floor(stars.length / 6));
  for (let i = 0; i < stars.length; i += labelInterval) {
    const x = padding.left + (i / (stars.length - 1)) * chartW;
    const d = new Date(stars[i].year, stars[i].month);
    const label = d.toLocaleDateString('en', { month: 'short', year: '2-digit' });
    xLabels += `<text x="${x}" y="${height - 5}" text-anchor="middle" fill="var(--text-muted)" font-size="9" style="font-family: var(--font-mono);">${label}</text>`;
  }

  let svgContent = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  svgContent += `<defs><linearGradient id="starGrad-${theme}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity="0.3"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>`;
  svgContent += `<path d="${areaD}" fill="url(#starGrad-${theme})" />`;
  svgContent += `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />`;

  // Dots on points
  points.forEach((p) => {
    svgContent += `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${color}" />`;
  });

  svgContent += yLabels + xLabels;
  svgContent += '</svg>';
  container.innerHTML = svgContent;
}

// Trophy/Achievement badges
function renderTrophyWall(container: HTMLElement, stats: {
  totalStars: number;
  followerCount: number;
  followingCount: number;
  langCount: number;
  contributionCount: number;
}, theme: string) {
  const trophies = [
    { icon: '🏆', title: 'All-Star', desc: '50+ stars', condition: stats.totalStars >= 50 },
    { icon: '⭐', title: 'Rising Star', desc: '20+ stars', condition: stats.totalStars >= 20 },
    { icon: '🌟', title: 'Star Seeker', desc: '10+ stars', condition: stats.totalStars >= 10 },
    { icon: '👥', title: 'Social', desc: '50+ followers', condition: stats.followerCount >= 50 },
    { icon: '🔗', title: 'Connector', desc: '30+ following', condition: stats.followingCount >= 30 },
    { icon: '🌍', title: 'Polyglot', desc: '5+ languages', condition: stats.langCount >= 5 },
    { icon: '💻', title: 'Coder', desc: '3+ languages', condition: stats.langCount >= 3 },
    { icon: '📅', title: 'Dedicated', desc: '100+ days', condition: stats.contributionCount >= 100 },
    { icon: '🔥', title: 'Consistent', desc: '30+ days', condition: stats.contributionCount >= 30 },
    { icon: '🚀', title: 'First Launch', desc: 'Any release', condition: stats.totalStars >= 0 },
  ];

  const unlocked = trophies.filter((t) => t.condition);
  const locked = trophies.filter((t) => !t.condition);

  let html = '<div class="trophy-grid">';

  // Unlocked trophies
  for (const t of unlocked) {
    html += `<div class="trophy trophy-unlocked"><span class="trophy-icon">${t.icon}</span><span class="trophy-title">${t.title}</span><span class="trophy-desc">${t.desc}</span></div>`;
  }

  // Locked trophies
  for (const t of locked.slice(0, 5)) {
    html += `<div class="trophy trophy-locked"><span class="trophy-icon">🔒</span><span class="trophy-title">${t.title}</span><span class="trophy-desc">${t.desc}</span></div>`;
  }

  html += '</div>';

  if (locked.length > 5) {
    html += `<p class="text-dim trophy-more">+ ${locked.length - 5} more achievements locked</p>`;
  }

  container.innerHTML = html;
}

// Export all renderers
export { renderContributionHeatmap, renderLanguagePie, renderStarChart, renderTrophyWall };