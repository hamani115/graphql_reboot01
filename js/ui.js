const UI = {
    showLoginPage() {
        document.getElementById('login-container').style.display = 'block';
        document.getElementById('profile-container').style.display = 'none';

        const loginContainer = document.getElementById('login-container');
        loginContainer.innerHTML = `
        <div class="auth">
            <div class="card auth-card">
            <h1>GraphQL User Profile</h1>

            <form id="login-form" style="margin-top:14px;">
                <div class="field">
                <label for="username">Username or Email</label>
                <input type="text" id="username" name="username" autocomplete="username" required>
                </div>

                <div class="field">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" autocomplete="current-password" required>
                </div>

                <div style="margin-top:14px; display:flex; gap:10px;">
                <button type="submit" style="flex:1;">Login</button>
                </div>

                <div id="error-message" class="error"></div>
            </form>
            </div>
        </div>
        `;

        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('error-message');
            errorDiv.textContent = '';

            const result = await Auth.login({ username, password });
            if (result.success) UI.showProfilePage();
            else errorDiv.textContent = result.error;
        });
    },
    async showProfilePage() {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('profile-container').style.display = 'block';

        const profileContainer = document.getElementById('profile-container');
        profileContainer.innerHTML = `<p class="subtext">Loading profile...</p>`;

        const formatBytes = (n) => {
            if (n == null || Number.isNaN(Number(n))) return '0 B';
            const units = ['B', 'kB', 'MB'];
            let val = Number(n), i = 0;
            while (val >= 1000 && i < units.length - 1) { 
                val /= 1000; i++;
            }
            const dec = (i === 0 || val >= 100) ? 0 : 1;
            return `${val.toFixed(dec)} ${units[i]}`;
        };

        try {
            // GraphQL data fetch
            const userInfo = await GraphQL.getUserInfo();
            const userProfile = await GraphQL.getUserProfile();
            const latestActivity = await GraphQL.getLatestActivity();
            const transactionsByProjects = await GraphQL.getUserTransactionsByProjects();
            const progress = await GraphQL.getUserProgress();
            const auditsCompleted = await GraphQL.getUserAudits();
            const auditsRatio = await GraphQL.getUserAuditsRatio();
            const results = await GraphQL.getResults();
            
            const login = userInfo.user[0]?.login || 'Unknown';
            const fullname = userProfile.user[0]?.attrs.firstName + " " + userProfile.user[0]?.attrs.lastName;
            const userId = userInfo.user[0]?.id || 'Unknown';

            // Calculations
            let temp = await GraphQL.getXPSum();
            const totalXP = temp.transaction_aggregate?.aggregate?.sum?.amount ?? 0;

            const avgGrade = progress.user[0].progresses.length > 0
                ? (progress.user[0].progresses.reduce((sum, p) => sum + p.grade, 0) / progress.user[0].progresses.length).toFixed(2)
                : 'N/A';

            temp = await GraphQL.getTotalAuditsCount();
            const totalAuditsDone = temp.audit_aggregate?.aggregate?.count ?? 0;

            const auditsPassed = auditsCompleted.user[0].audits.filter(a => a.grade >= 1).length;
            const auditsFailed = auditsCompleted.user[0].audits.filter(a => a.grade < 1).length;

            const level = userProfile.user?.[0]?.levelTx?.[0]?.amount ?? 'N/A';
 
            const lastSkill = (userProfile.user?.[0]?.lastSkillTx?.[0]?.type).replace(/^skill_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

            const latestTx = latestActivity.transaction?.[0] ?? null;
            const latestName = latestTx?.object?.name ?? latestTx?.path ?? 'N/A';
            const latestDate = latestTx?.createdAt
                ? new Date(latestTx.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                    })
                : '';
            const latestXP = latestTx?.amount != null ? formatBytes(latestTx.amount) : '';

            const defaultRangeMonths = 6;
            const defaultTopProjects = 10;

            profileContainer.innerHTML = `
                <div class="topbar">
                <div>
                    <h1>Welcome, ${fullname} (${login})!</h1>
                </div>
                <button id="logout-btn">Logout</button>
                </div>

                <div class="grid">
                <!-- Section 1: Basic User Identification -->
                <div class="card">
                    <h2>Profile</h2>
                    <div class="label-val">
                        <div class="label">Login</div>
                        <div class="val">${login}</div>
                    </div>
                    <div class="label-val">
                        <div class="label">User ID</div>
                        <div class="val">${userId}</div>
                    </div>
                    <div class="label-val">
                        <div class="label">Level</div>
                        <div class="val">${level}</div>
                    </div>
                    <div class="label-val">
                        <div class="label">Last skill</div>
                        <div class="val">${lastSkill}</div>
                    </div>
                </div>

                <!-- Section 2: XP & grades -->
                <div class="card">
                    <h2>XP & Grades</h2>
                    <div class="label-val">
                        <div class="label">Total XP</div>
                        <div class="val">${formatBytes(totalXP)}</div>
                    </div>
                    <div class="label-val">
                        <div class="label">Average grade</div>
                        <div class="val">${avgGrade}</div>
                    </div>
                    <div class="label-val">
                        <div class="label">Project completed</div>
                        <div class="val">${results.result.length}</div>
                    </div>
                    <div class="label-val">
                    <div class="label">Latest activity</div>
                    <div class="val" style="text-align:right;">
                        ${latestName}<br>
                        <div class="subtext" style="font-weight:500;">${latestXP} - ${latestDate ? `${latestDate}` : ''}</div>
                    </div>
                    </div>
                </div>

                <!-- Section 3: Audits -->
                <div class="card">
                    <h2>Audits</h2>
                    <div class="label-val">
                        <div class="label">Audits done</div><div class="val">${totalAuditsDone}</div>
                    </div>
                    <div class="label-val">
                        <div class="label">Audits passed</div><div class="val">${auditsPassed}</div>
                    </div>
                    <div class="label-val">
                        <div class="label">Audits failed</div><div class="val">${auditsFailed}</div>
                    </div>
                    <div class="label-val">
                        <div class="label">Audit ratio</div><div class="val">${(auditsRatio.user[0].auditRatio ?? 0).toFixed(1)}</div>
                    </div>
                </div>

                <!-- Section 4: Graphs/Charts -->
                <div class="card card-full">
                    <div class="chart-head">
                        <div>
                            <h2>Audit Ratio Visual</h2>
                        </div>
                    </div>
                    <div class="chart" id="audit-ratio"></div>
                </div>

                <div class="card card-full">
                    <div class="chart-head">
                        <div>
                            <h2>XP Progress Over Time</h2>
                            <div class="subtext">Cumulative XP across the last N months</div>
                        </div>
                        <div class="controls">
                            <div class="control">
                                <label for="xp-range">Range (months)</label>
                                <select id="xp-range">
                                    <option value="3">3</option>
                                    <option value="6" selected>6</option>
                                    <option value="12">12</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="chart" id="xp-over-time"></div>
                </div>

                <div class="card card-full">
                    <div class="chart-head">
                        <div>
                            <h2>XP by Project</h2>
                            <div class="subtext">Top projects by XP earned</div>
                        </div>
                        <div class="controls">
                            <div class="control">
                            <label for="xp-topn">Number of projects</label>
                            <select id="xp-topn">
                                <option value="5">5</option>
                                <option value="10" selected>10</option>
                                <option value="15">15</option>
                                <option value="20">20</option>
                            </select>
                            </div>
                        </div>
                    </div>
                    <div class="chart" id="xp-by-project"></div>
                </div>
                
                </div>
            `;

            Graphs.createAuditRatioChart(auditsRatio.user[0], 'audit-ratio');

            const rangeMonths = Number(document.getElementById('xp-range').value || defaultRangeMonths);
            Graphs.createXPOverTimeChart(transactionsByProjects.user[0].transactions, 'xp-over-time', rangeMonths);

            const topN = Number(document.getElementById('xp-topn').value || defaultTopProjects);
            Graphs.createXPByProjectChart(transactionsByProjects.user[0].transactions, 'xp-by-project', topN);

            // dropdowns
            document.getElementById('xp-range').addEventListener('change', () => {
                const rangeMonths = Number(document.getElementById('xp-range').value || defaultRangeMonths);
                Graphs.createXPOverTimeChart(transactionsByProjects.user[0].transactions, 'xp-over-time', rangeMonths);
            });
            document.getElementById('xp-topn').addEventListener('change', () => {
                const topN = Number(document.getElementById('xp-topn').value || defaultTopProjects);
                Graphs.createXPByProjectChart(transactionsByProjects.user[0].transactions, 'xp-by-project', topN);
            });

            // logout
            document.getElementById('logout-btn').addEventListener('click', () => {
                Auth.logout();
                UI.showLoginPage();
            });
        } catch (error) {
            profileContainer.innerHTML = `<p class="error">Error loading profile: ${error.message}</p>`;
        }
    }
};