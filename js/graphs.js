const Graphs = {
    createXPOverTimeChart(transactions, containerId, rangeMonths = 6) {
        const xpTransactions = transactions
            .filter(t => t.type === 'xp' && t.createdAt && typeof t.amount === 'number')
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        if (xpTransactions.length === 0) {
            document.getElementById(containerId).innerHTML = '<p>No XP data available</p>';
            return;
        }

        const lastTxDate = new Date(xpTransactions[xpTransactions.length - 1].createdAt);
        const endMonth = new Date(lastTxDate.getFullYear(), lastTxDate.getMonth(), 1);
        const startMonth = new Date(endMonth.getFullYear(), endMonth.getMonth() - rangeMonths + 1, 1);

        // Accumulate XP
        let runningXP = 0;
        let txIndex = 0;

        while (
            txIndex < xpTransactions.length &&
            new Date(xpTransactions[txIndex].createdAt) < startMonth
        ) {
            runningXP += xpTransactions[txIndex].amount;
            txIndex++;
        }

        // Build fixed monthly buckets
        const data = [];
        for (let i = 0; i < rangeMonths; i++) {
            const bucketStart = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
            const bucketEnd = new Date(startMonth.getFullYear(), startMonth.getMonth() + i + 1, 1);

            while (
                txIndex < xpTransactions.length &&
                new Date(xpTransactions[txIndex].createdAt) < bucketEnd
            ) {
                runningXP += xpTransactions[txIndex].amount;
                txIndex++;
            }

            data.push({
                label: bucketStart.toLocaleDateString(undefined, {
                    month: 'short',
                    year: 'numeric'
                }),
                xp: runningXP
            });
        }

        const width = 700;
        const height = 320;
        const margin = { top: 20, right: 30, bottom: 60, left: 70 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const minXP = 0;
        const maxXP = Math.max(...data.map(d => d.xp), 1);

        const xStep = data.length > 1 ? innerWidth / (data.length - 1) : innerWidth;

        const xScale = (index) => margin.left + index * xStep;
        const yScale = (xp) =>
            height - margin.bottom - ((xp - minXP) / (maxXP - minXP || 1)) * innerHeight;

        let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

        // Chart box
        svg += `<rect width="${width}" height="${height}" fill="#f9f9f9"/>`;

        // Axes
        svg += `<line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="black" stroke-width="1"/>`;
        svg += `<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="black" stroke-width="1"/>`;

        // Y-axis labels
        for (let i = 0; i <= 5; i++) {
            const value = Math.round((i / 5) * maxXP);
            const y = yScale(value);
            svg += `<line x1="${margin.left - 5}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="black"/>`;
            svg += `<text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" font-size="12">${value}</text>`;
        }

        // X-axis labels
        data.forEach((d, i) => {
            const x = xScale(i);
            svg += `<line x1="${x}" y1="${height - margin.bottom}" x2="${x}" y2="${height - margin.bottom + 5}" stroke="black"/>`;
            svg += `<text x="${x}" y="${height - margin.bottom + 20}" text-anchor="middle" font-size="11">${d.label}</text>`;
        });

        // Plot line
        let pathData = '';
        data.forEach((d, i) => {
            const x = xScale(i);
            const y = yScale(d.xp);
            pathData += i === 0 ? `M ${x},${y}` : ` L ${x},${y}`;
        });
        svg += `<path d="${pathData}" stroke="#2563eb" stroke-width="2" fill="none"/>`;

        // Plot points
        data.forEach((d, i) => {
            const x = xScale(i);
            const y = yScale(d.xp);
            svg += `<circle cx="${x}" cy="${y}" r="3" fill="#2563eb"/>`;
        });

        // Title
        svg += `<text x="${width / 2}" y="15" text-anchor="middle" font-size="16" font-weight="bold">XP Progress Over Time</text>`;

        // Y-axis label
        svg += `<text x="20" y="${height / 2}" text-anchor="middle" font-size="12" transform="rotate(-90 20 ${height / 2})">XP Amount</text>`;

        // X-axis label
        svg += `<text x="${width / 2}" y="${height - 10}" text-anchor="middle" font-size="12">Month</text>`;

        svg += `</svg>`;

        document.getElementById(containerId).innerHTML = svg;
    },

    // Create XP by project bar chart
    createXPByProjectChart(transactions, containerId, numProjects=10) {
        // Group XP by project path
        const xpByProject = {};
        transactions
            // .filter(t => t.type === 'xp')
            .forEach(t => {
                const project = t.path || 'Unknown';
                xpByProject[project] = (xpByProject[project] || 0) + t.amount;
            });

        // const projects = Object.keys(xpByProject).slice(0, 10); // Top 10 projects
        // const xpValues = projects.map(p => xpByProject[p]);

        const top = Object.entries(xpByProject)
            .sort((a, b) => b[1] - a[1])
            .slice(0, numProjects);

        const projects = top.map(([p]) => p);
        const xpValues = top.map(([,v]) => v);

        

        if (projects.length === 0) {
            document.getElementById(containerId).innerHTML = '<p>No project data available</p>';
            return;
        }

        const width = 600;
        const height = 300;
        const margin = { top: 20, right: 30, bottom: 60, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const maxXP = Math.max(...xpValues);
        const barWidth = innerWidth / projects.length * 0.8;
        const barGap = innerWidth / projects.length * 0.2;

        let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
        
        // Background
        svg += `<rect width="${width}" height="${height}" fill="#f9f9f9"/>`;
        
        // Axes
        svg += `<line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="black" stroke-width="1"/>`;
        svg += `<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="black" stroke-width="1"/>`;

        // Y-axis labels
        for (let i = 0; i <= 5; i++) {
            const y = height - margin.bottom - (i * innerHeight / 5);
            const xpValue = Math.round((i / 5) * maxXP);
            svg += `<line x1="${margin.left - 5}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="black"/>`;
            svg += `<text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" font-size="11">${xpValue}</text>`;
        }

        // Bars and labels
        projects.forEach((project, i) => {
            const x = margin.left + barGap / 2 + i * (barWidth + barGap);
            const barHeight = (xpValues[i] / maxXP) * innerHeight;
            const y = height - margin.bottom - barHeight;

            svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="#10b981"/>`;
            
            const projectName = project.split('/').pop() || project;
            svg += `<text x="${x + barWidth / 2}" y="${height - margin.bottom + 15}" text-anchor="middle" font-size="10" transform="rotate(45 ${x + barWidth / 2} ${height - margin.bottom + 15})">${projectName}</text>`;
        });

        // Title
        svg += `<text x="${width / 2}" y="15" text-anchor="middle" font-size="16" font-weight="bold">XP by Project</text>`;

        // Y-axis label
        svg += `<text x="20" y="${height / 2}" text-anchor="middle" font-size="12" transform="rotate(-90 20 ${height / 2})">XP Amount</text>`;

        svg += '</svg>';
        document.getElementById(containerId).innerHTML = svg;
    },

    // Create audit ratio bar chart
    createAuditRatioChart(audits, containerId) {
        if (!audits.totalUp && !audits.totalDown) {
            document.getElementById(containerId).innerHTML = '<p>No audit data missing/available</p>';
            return;
        }

        const passedAudits = audits.totalUp;
        const failedAudits = audits.totalDown;

        const width = 400;
        const height = 250;
        const margin = { top: 20, right: 30, bottom: 30, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const barWidth = innerWidth / 2 * 0.6;
        const barGap = innerWidth / 2 * 0.4;

        let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
        svg += `<rect width="${width}" height="${height}" fill="#f9f9f9"/>`;

        // Axes
        svg += `<line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="black" stroke-width="1"/>`;
        svg += `<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="black" stroke-width="1"/>`;

        const maxAudits = Math.max(passedAudits, failedAudits);

        // Y-axis labels
        for (let i = 0; i <= 5; i++) {
            const y = height - margin.bottom - (i * innerHeight / 5);
            const value = Math.round((i / 5) * maxAudits);
            svg += `<line x1="${margin.left - 5}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="black"/>`;
            svg += `<text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" font-size="11">${value}</text>`;
        }

        // Passed bar
        const x1 = margin.left + barGap / 4;
        const barHeight1 = (passedAudits / maxAudits) * innerHeight;
        const y1 = height - margin.bottom - barHeight1;
        svg += `<rect x="${x1}" y="${y1}" width="${barWidth}" height="${barHeight1}" fill="#10b981"/>`;
        svg += `<text x="${x1 + barWidth / 2}" y="${height - margin.bottom + 20}" text-anchor="middle" font-size="12">Passed</text>`;

        // Failed bar
        const x2 = margin.left + barGap / 4 + barWidth + barGap;
        const barHeight2 = (failedAudits / maxAudits) * innerHeight;
        const y2 = height - margin.bottom - barHeight2;
        svg += `<rect x="${x2}" y="${y2}" width="${barWidth}" height="${barHeight2}" fill="#ef4444"/>`;
        svg += `<text x="${x2 + barWidth / 2}" y="${height - margin.bottom + 20}" text-anchor="middle" font-size="12">Failed</text>`;

        // Title
        svg += `<text x="${width / 2}" y="15" text-anchor="middle" font-size="16" font-weight="bold">Audit Ratio</text>`;

        // Y-axis label
        svg += `<text x="20" y="${height / 2}" text-anchor="middle" font-size="12" transform="rotate(-90 20 ${height / 2})">Count</text>`;

        svg += '</svg>';
        document.getElementById(containerId).innerHTML = svg;
    }
};
