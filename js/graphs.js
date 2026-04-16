const Graphs = {
  createXPOverTimeChart(transactions, containerId, rangeMonths = 6) {
    const xpTransactions = transactions
      .filter(t => t.type === 'xp' && t.createdAt && typeof t.amount === 'number')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const el = document.getElementById(containerId);
    if (!el) return;

    if (xpTransactions.length === 0) {
      el.innerHTML = '<p class="subtext">No XP data available</p>';
      return;
    }

    const lastTxDate = new Date(xpTransactions[xpTransactions.length - 1].createdAt);
    const endMonth = new Date(lastTxDate.getFullYear(), lastTxDate.getMonth(), 1);
    const startMonth = new Date(endMonth.getFullYear(), endMonth.getMonth() - rangeMonths + 1, 1);

    let runningXP = 0;
    let txIndex = 0;

    while (txIndex < xpTransactions.length && new Date(xpTransactions[txIndex].createdAt) < startMonth) {
      runningXP += xpTransactions[txIndex].amount;
      txIndex++;
    }

    const data = [];
    for (let i = 0; i < rangeMonths; i++) {
      const bucketStart = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
      const bucketEnd = new Date(startMonth.getFullYear(), startMonth.getMonth() + i + 1, 1);

      while (txIndex < xpTransactions.length && new Date(xpTransactions[txIndex].createdAt) < bucketEnd) {
        runningXP += xpTransactions[txIndex].amount;
        txIndex++;
      }

      data.push({
        label: bucketStart.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
        xp: runningXP
      });
    }

    const width = 700;
    const height = 320;
    const margin = { top: 28, right: 30, bottom: 60, left: 75 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const minXP = 0;
    const maxXP = Math.max(...data.map(d => d.xp), 1);

    const xStep = data.length > 1 ? innerWidth / (data.length - 1) : innerWidth;
    const xScale = (index) => margin.left + index * xStep;
    const yScale = (xp) =>
      height - margin.bottom - ((xp - minXP) / (maxXP - minXP || 1)) * innerHeight;

    let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" aria-label="XP Progress Over Time" role="img">`;
    svg += `<rect width="${width}" height="${height}" fill="var(--chart-bg)"/>`;

    // x-axis, y-axis
    svg += `<line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="var(--chart-axis)" stroke-width="1"/>`;
    svg += `<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="var(--chart-axis)" stroke-width="1"/>`;

    // y gaps + labels
    for (let i = 0; i <= 5; i++) {
      const value = Math.round((i / 5) * maxXP);
      const y = yScale(value);
      svg += `<line x1="${margin.left - 5}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="var(--chart-axis)"/>`;
      svg += `<text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" font-size="12" fill="var(--chart-fg)">${value}</text>`;
    }

    // x gaps + labels
    data.forEach((d, i) => {
      const x = xScale(i);
      svg += `<line x1="${x}" y1="${height - margin.bottom}" x2="${x}" y2="${height - margin.bottom + 5}" stroke="var(--chart-axis)"/>`;
      svg += `<text x="${x}" y="${height - margin.bottom + 20}" text-anchor="middle" font-size="11" fill="var(--chart-fg)">${d.label}</text>`;
    });

    // line
    let pathData = '';
    data.forEach((d, i) => {
      const x = xScale(i);
      const y = yScale(d.xp);
      pathData += i === 0 ? `M ${x},${y}` : ` L ${x},${y}`;
    });
    svg += `<path d="${pathData}" stroke="var(--chart-line)" stroke-width="2.5" fill="none"/>`;

    // points
    data.forEach((d, i) => {
      const x = xScale(i);
      const y = yScale(d.xp);
      svg += `<circle cx="${x}" cy="${y}" r="3.2" fill="var(--chart-line)"/>`;
    });

    // title + axis labels
    svg += `<text x="${width / 2}" y="18" text-anchor="middle" font-size="15" font-weight="700" fill="var(--chart-fg)">XP Progress Over Time</text>`;
    svg += `<text x="20" y="${height / 2}" text-anchor="middle" font-size="12" fill="var(--chart-fg)" transform="rotate(-90 20 ${height / 2})">XP Amount</text>`;
    svg += `<text x="${width / 2}" y="${height - 10}" text-anchor="middle" font-size="12" fill="var(--chart-fg)">Month</text>`;
    svg += `</svg>`;
    el.innerHTML = svg;
  },

  createXPByProjectChart(transactions, containerId, numProjects = 10) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const xpByProject = {};
    transactions.forEach(t => {
      const project = t.path || 'Unknown';
      xpByProject[project] = (xpByProject[project] || 0) + t.amount;
    });

    const top = Object.entries(xpByProject)
      .sort((a, b) => b[1] - a[1])
      .slice(0, numProjects);

    const projects = top.map(([p]) => p);
    const xpValues = top.map(([, val]) => val);

    if (projects.length === 0) {
      el.innerHTML = '<p class="subtext">No project data available</p>';
      return;
    }

    const width = 700;
    const height = 320;
    const margin = { top: 28, right: 30, bottom: 80, left: 75 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const maxXP = Math.max(...xpValues, 1);
    const barSlot = innerWidth / projects.length;
    const barWidth = barSlot * 0.72;
    const barGap = barSlot - barWidth;

    let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" aria-label="XP by Project" role="img">`;
    svg += `<rect width="${width}" height="${height}" fill="var(--chart-bg)"/>`;

    // x-axis, y-axis
    svg += `<line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="var(--chart-axis)" stroke-width="1"/>`;
    svg += `<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="var(--chart-axis)" stroke-width="1"/>`;

    // y gapss + labels
    for (let i = 0; i <= 5; i++) {
      const y = height - margin.bottom - (i * innerHeight / 5);
      const xpValue = Math.round((i / 5) * maxXP);
      svg += `<line x1="${margin.left - 5}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="var(--chart-axis)"/>`;
      svg += `<text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="var(--chart-fg)">${xpValue}</text>`;
    }

    // bars + x labels
    projects.forEach((project, i) => {
      const x = margin.left + (barGap / 2) + i * (barWidth + barGap);
      const barHeight = (xpValues[i] / maxXP) * innerHeight;
      const y = height - margin.bottom - barHeight;

      svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="var(--chart-bar)"/>`;

      const projectName = project.split('/').pop() || project;
      const lx = x + barWidth / 2;
      const ly = height - margin.bottom + 16;
      svg += `<text x="${lx}" y="${ly}" text-anchor="middle" font-size="10" fill="var(--chart-fg)"
        transform="rotate(40 ${lx} ${ly})">${projectName}</text>`;
    });

    // title + y label
    svg += `<text x="${width / 2}" y="18" text-anchor="middle" font-size="15" font-weight="700" fill="var(--chart-fg)">XP by Project</text>`;
    svg += `<text x="20" y="${height / 2}" text-anchor="middle" font-size="12" fill="var(--chart-fg)" transform="rotate(-90 20 ${height / 2})">XP Amount</text>`;
    svg += `</svg>`;
    el.innerHTML = svg;
  },

  createAuditRatioChart(audits, containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;

    if (!audits.totalUp && !audits.totalDown) {
      el.innerHTML = '<p class="subtext">No audit data available</p>';
      return;
    }

    const passedAudits = audits.totalUp;
    const failedAudits = audits.totalDown;

    const width = 520;
    const height = 250;
    const margin = { top: 28, right: 30, bottom: 40, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const barWidth = (innerWidth / 2) * 0.65;
    const barGap = (innerWidth / 2) * 0.35;

    let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" aria-label="Audit counts" role="img">`;
    svg += `<rect width="${width}" height="${height}" fill="var(--chart-bg)"/>`;
    
    // x-axis, y-axis
    svg += `<line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="var(--chart-axis)" stroke-width="1"/>`;
    svg += `<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="var(--chart-axis)" stroke-width="1"/>`;

    const maxAudits = Math.max(passedAudits, failedAudits, 1);

    // y gaps + labels
    for (let i = 0; i <= 5; i++) {
      const y = height - margin.bottom - (i * innerHeight / 5);
      const value = Math.round((i / 5) * maxAudits);
      svg += `<line x1="${margin.left - 5}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="var(--chart-axis)"/>`;
      svg += `<text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="var(--chart-fg)">${value}</text>`;
    }

    // bars + x labels
    const x1 = margin.left + barGap / 4;
    const h1 = (passedAudits / maxAudits) * innerHeight;
    const y1 = height - margin.bottom - h1;
    svg += `<rect x="${x1}" y="${y1}" width="${barWidth}" height="${h1}" fill="var(--chart-bar)"/>`;
    svg += `<text x="${x1 + barWidth / 2}" y="${height - margin.bottom + 22}" text-anchor="middle" font-size="12" fill="var(--chart-fg)">Done</text>`;

    const x2 = margin.left + barGap / 4 + barWidth + barGap;
    const h2 = (failedAudits / maxAudits) * innerHeight;
    const y2 = height - margin.bottom - h2;
    svg += `<rect x="${x2}" y="${y2}" width="${barWidth}" height="${h2}" fill="var(--danger)"/>`;
    svg += `<text x="${x2 + barWidth / 2}" y="${height - margin.bottom + 22}" text-anchor="middle" font-size="12" fill="var(--chart-fg)">Received</text>`;

    // title + y label
    svg += `<text x="${width / 2}" y="18" text-anchor="middle" font-size="15" font-weight="700" fill="var(--chart-fg)">Audit Ratio</text>`;
    svg += `<text x="20" y="${height / 2}" text-anchor="middle" font-size="12" fill="var(--chart-fg)" transform="rotate(-90 20 ${height / 2})">Count</text>`;
    svg += `</svg>`;
    el.innerHTML = svg;
  }
};