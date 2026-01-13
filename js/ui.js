// UI Module
const UI = {
    // Show login page
    showLoginPage() {
        const loginContainer = document.getElementById('login-container');
        loginContainer.innerHTML = `
            <div>
                <h1>GraphQL Profile Login</h1>
                <form id="login-form">
                    <div>
                        <label for="username">Username or Email:</label>
                        <input type="text" id="username" name="username" required>
                    </div>
                    <div>
                        <label for="password">Password:</label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    <button type="submit">Login</button>
                    <div id="error-message" style="color: red; margin-top: 10px;"></div>
                </form>
            </div>
        `;

        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('error-message');

            const result = await Auth.login({ username, password });
            if (result.success) {
                UI.showProfilePage();
            } else {
                errorDiv.textContent = result.error;
            }
        });
    },

    // Show profile page
    async showProfilePage() {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('profile-container').style.display = 'block';

        const profileContainer = document.getElementById('profile-container');
        profileContainer.innerHTML = '<p>Loading profile...</p>';

        try {
            // Fetch all data
            const userInfo = await GraphQL.getUserInfo();
            const transactions = await GraphQL.getTransactions();
            const progress = await GraphQL.getProgress();
            const audits = await GraphQL.getAudits();
            const results = await GraphQL.getResults();

            const login = userInfo.user[0]?.login || 'Unknown';
            const userId = userInfo.user[0]?.id || 'Unknown';

            // Calculate stats
            const totalXP = transactions.transaction
                .filter(t => t.type === 'xp')
                .reduce((sum, t) => sum + t.amount, 0);

            const avgGrade = progress.progress.length > 0
                ? (progress.progress.reduce((sum, p) => sum + p.grade, 0) / progress.progress.length).toFixed(2)
                : 'N/A';

            const auditsPassed = audits.audit.filter(a => a.grade >= 1).length;
            const auditsFailed = audits.audit.length - auditsPassed;

            // Build profile HTML
            profileContainer.innerHTML = `
                <div>
                    <h1>Profile - ${login}</h1>
                    <button id="logout-btn">Logout</button>
                    
                    <div style="margin-top: 20px; border: 1px solid black; padding: 10px;">
                        <h2>User Information</h2>
                        <p><strong>Login:</strong> ${login}</p>
                        <p><strong>User ID:</strong> ${userId}</p>
                    </div>

                    <div style="margin-top: 20px; border: 1px solid black; padding: 10px;">
                        <h2>Statistics</h2>
                        <p><strong>Total XP:</strong> ${totalXP}</p>
                        <p><strong>Average Grade:</strong> ${avgGrade}</p>
                        <p><strong>Audits Passed:</strong> ${auditsPassed}</p>
                        <p><strong>Audits Failed:</strong> ${auditsFailed}</p>
                        <p><strong>Total Results:</strong> ${results.result.length}</p>
                    </div>

                    <div style="margin-top: 20px; border: 1px solid black; padding: 10px;">
                        <h2>XP Progress Over Time</h2>
                        <div id="xp-over-time"></div>
                    </div>

                    <div style="margin-top: 20px; border: 1px solid black; padding: 10px;">
                        <h2>XP by Project</h2>
                        <div id="xp-by-project"></div>
                    </div>

                    <div style="margin-top: 20px; border: 1px solid black; padding: 10px;">
                        <h2>Pass/Fail Ratio</h2>
                        <div id="pass-fail"></div>
                    </div>

                    <div style="margin-top: 20px; border: 1px solid black; padding: 10px;">
                        <h2>Audit Ratio</h2>
                        <div id="audit-ratio"></div>
                    </div>
                </div>
            `;

            // Generate graphs
            Graphs.createXPOverTimeChart(transactions.transaction, 'xp-over-time');
            console.log(transactions.transaction);
            Graphs.createXPByProjectChart(transactions.transaction, 'xp-by-project');
            Graphs.createPassFailChart(results.result, 'pass-fail');
            Graphs.createAuditRatioChart(audits.audit, 'audit-ratio');

            // Logout button
            document.getElementById('logout-btn').addEventListener('click', () => {
                Auth.logout();
                UI.showLoginPage();
            });

        } catch (error) {
            profileContainer.innerHTML = `<p>Error loading profile: ${error.message}</p>`;
        }
    }
};
