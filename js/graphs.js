// SVG Graph module
const Graphs = {
    // Create XP over time line chart
    createXPOverTimeChart(transactions, containerId) {
        // Filter XP transactions
        const xpTransactions = transactions
            .filter(t => t.type === 'xp')
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        if (xpTransactions.length === 0) {
            document.getElementById(containerId).innerHTML = '<p>No XP data available</p>';
            return;
        }

        // Accumulate XP over time
        let totalXP = 0;
        const data = xpTransactions.map(t => {
            totalXP += t.amount;
            return {
                date: new Date(t.createdAt),
                xp: totalXP
            };
        });

        // SVG dimensions
        const width = 600;
        const height = 300;
        const margin = { top: 20, right: 30, bottom: 30, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Find min/max for scaling
        const minDate = data[0].date;
        const maxDate = data[data.length - 1].date;
        const maxXP = data[data.length - 1].xp;
        const minXP = 0;

        // Create SVG
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
            svg += `<text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" font-size="12">${xpValue}</text>`;
        }

        // X-axis labels (every nth point to avoid crowding)
        const step = Math.max(1, Math.floor(data.length / 5));
        for (let i = 0; i < data.length; i += step) {
            const x = margin.left + (i / (data.length - 1 || 1)) * innerWidth;
            const dateStr = data[i].date.toLocaleDateString();
            svg += `<line x1="${x}" y1="${height - margin.bottom}" x2="${x}" y2="${height - margin.bottom + 5}" stroke="black"/>`;
            svg += `<text x="${x}" y="${height - margin.bottom + 20}" text-anchor="middle" font-size="12">${dateStr}</text>`;
        }

        // Plot line
        let pathData = 'M';
        for (let i = 0; i < data.length; i++) {
            const x = margin.left + (i / (data.length - 1 || 1)) * innerWidth;
            const y = height - margin.bottom - ((data[i].xp - minXP) / (maxXP - minXP || 1)) * innerHeight;
            pathData += ` ${x},${y}`;
        }
        svg += `<path d="${pathData}" stroke="#2563eb" stroke-width="2" fill="none"/>`;

        // Plot points
        for (let i = 0; i < data.length; i++) {
            const x = margin.left + (i / (data.length - 1 || 1)) * innerWidth;
            const y = height - margin.bottom - ((data[i].xp - minXP) / (maxXP - minXP || 1)) * innerHeight;
            svg += `<circle cx="${x}" cy="${y}" r="3" fill="#2563eb"/>`;
        }

        // Title
        svg += `<text x="${width / 2}" y="15" text-anchor="middle" font-size="16" font-weight="bold">XP Progress Over Time</text>`;

        // Y-axis label
        svg += `<text x="20" y="${height / 2}" text-anchor="middle" font-size="12" transform="rotate(-90 20 ${height / 2})">XP Amount</text>`;

        // X-axis label
        svg += `<text x="${width / 2}" y="${height - 5}" text-anchor="middle" font-size="12">Date</text>`;

        svg += '</svg>';
        document.getElementById(containerId).innerHTML = svg;
    },

    // Create XP by project bar chart
    createXPByProjectChart(transactions, containerId) {
        // Group XP by project path
        const xpByProject = {};
        transactions
            .filter(t => t.type === 'xp')
            .forEach(t => {
                const project = t.path || 'Unknown';
                xpByProject[project] = (xpByProject[project] || 0) + t.amount;
            });

        // const projects = Object.keys(xpByProject).slice(0, 10); // Top 10 projects
        // const xpValues = projects.map(p => xpByProject[p]);

        const top = Object.entries(xpByProject)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

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

    // Create Pass/Fail ratio pie chart
    createPassFailChart(results, containerId) {
        const passed = results.filter(r => r.grade >= 1).length;
        const failed = results.length - passed;

        if (results.length === 0) {
            document.getElementById(containerId).innerHTML = '<p>No result data available</p>';
            return;
        }

        const total = results.length;
        const passPercent = (passed / total) * 100;
        const failPercent = (failed / total) * 100;

        // Pie chart
        const centerX = 200;
        const centerY = 150;
        const radius = 100;

        // Calculate angles
        const passAngle = (passPercent / 100) * 2 * Math.PI;
        const failAngle = (failPercent / 100) * 2 * Math.PI;

        // Helper to create arc
        const arcPath = (centerX, centerY, radius, startAngle, endAngle) => {
            const x1 = centerX + radius * Math.cos(startAngle);
            const y1 = centerY + radius * Math.sin(startAngle);
            const x2 = centerX + radius * Math.cos(endAngle);
            const y2 = centerY + radius * Math.sin(endAngle);
            const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
            return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        };

        let svg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">`;
        svg += `<rect width="400" height="300" fill="#f9f9f9"/>`;

        // Pass slice
        svg += `<path d="${arcPath(centerX, centerY, radius, 0, passAngle)}" fill="#10b981" stroke="black" stroke-width="1"/>`;

        // Fail slice
        svg += `<path d="${arcPath(centerX, centerY, radius, passAngle, passAngle + failAngle)}" fill="#ef4444" stroke="black" stroke-width="1"/>`;

        // Labels
        const passLabelAngle = passAngle / 2;
        const failLabelAngle = passAngle + failAngle / 2;

        const passLabelX = centerX + (radius * 0.6) * Math.cos(passLabelAngle);
        const passLabelY = centerY + (radius * 0.6) * Math.sin(passLabelAngle);
        svg += `<text x="${passLabelX}" y="${passLabelY}" text-anchor="middle" font-size="14" font-weight="bold">${passed}</text>`;

        const failLabelX = centerX + (radius * 0.6) * Math.cos(failLabelAngle);
        const failLabelY = centerY + (radius * 0.6) * Math.sin(failLabelAngle);
        svg += `<text x="${failLabelX}" y="${failLabelY}" text-anchor="middle" font-size="14" font-weight="bold">${failed}</text>`;

        // Legend
        svg += `<rect x="280" y="80" width="20" height="20" fill="#10b981"/>`;
        svg += `<text x="310" y="95" font-size="12">Pass (${passPercent.toFixed(1)}%)</text>`;

        svg += `<rect x="280" y="110" width="20" height="20" fill="#ef4444"/>`;
        svg += `<text x="310" y="125" font-size="12">Fail (${failPercent.toFixed(1)}%)</text>`;

        // Title
        svg += `<text x="200" y="20" text-anchor="middle" font-size="16" font-weight="bold">Pass/Fail Ratio</text>`;

        svg += '</svg>';
        document.getElementById(containerId).innerHTML = svg;
    },

    // Create audit ratio bar chart
    createAuditRatioChart(audits, containerId) {
        if (audits.length === 0) {
            document.getElementById(containerId).innerHTML = '<p>No audit data available</p>';
            return;
        }

        const totalAudits = audits.length;
        const passedAudits = audits.filter(a => a.grade >= 1).length;
        const failedAudits = totalAudits - passedAudits;

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
