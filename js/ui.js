const UI = {
    showLoginPage() {
        document.getElementById('login-container').style.display = 'block';
        document.getElementById('profile-container').style.display = 'none';

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
    async showProfilePage() {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('profile-container').style.display = 'block';

        const profileContainer = document.getElementById('profile-container');
        profileContainer.innerHTML = '<p>Loading profile...</p>';

        try {
            const userInfo = await GraphQL.getUserInfo();
            const userProfile = await GraphQL.getUserProfile();
            const latestActivity = await GraphQL.getLatestActivity();
            console.log("latest activity:", latestActivity);
            const transactionsByProjects = await GraphQL.getUserTransactionsByProjects();
            const progress = await GraphQL.getUserProgress();
            const auditsCompeleted = await GraphQL.getUserAudits();
            const auditsRatio = await GraphQL.getUserAuditsRatio();
            const results = await GraphQL.getResults();

            const login = userInfo.user[0]?.login || 'Unknown';
            const userId = userInfo.user[0]?.id || 'Unknown';

            //------------------ Calculate stats ------------------
            // Total XP Calc
            // const totalXP = transactionsByProjects.user[0].transactions
            //     .reduce((sum, t) => sum + t.amount, 0);
            let temp = await GraphQL.getXPSum();
            const totalXP = temp.transaction_aggregate.aggregate.sum.amount;
            console.log("totalXP: ", totalXP)

            // Average Grade Calc
            const avgGrade = progress.user[0].progresses.length > 0
                ? (progress.user[0].progresses.reduce((sum, p) => sum + p.grade, 0) / progress.user[0].progresses.length).toFixed(2)
                : 'N/A';

            // Total Audits Done Calc
            temp = await GraphQL.getTotalAuditsCount();
            const totalAuditsDone = temp.audit_aggregate.aggregate.count;

            // Audit Passed/Failed Calc
            const auditsPassed = auditsCompeleted.user[0].audits.filter(a => a.grade >= 1).length;
            const auditsFailed  = auditsCompeleted.user[0].audits.filter(a => a.grade < 1).length; //? Confirmed by Yaman

            // Build profile
            profileContainer.innerHTML = `
                <div>
                    <h1>${login}</h1>
                    <button id="logout-btn">Logout</button>
                    
                    <div style="margin-top: 20px; border: 1px solid black; padding: 10px;">
                        <h2>My Stats</h2>
                        <p><strong>Login:</strong> ${login}</p>
                        <p><strong>User ID:</strong> ${userId}</p>
                        <p><strong>Level:</strong> ${userProfile.user[0].levelTx[0].amount}</p>
                        <p><strong>Last Skill:</strong> ${userProfile.user[0].lastSkillTx[0].type}</p>
                    </div>

                    <div style="margin-top: 20px; border: 1px solid black; padding: 10px;">                        
                        <h2>XP & Grades</h2>
                        <p><strong>Total XP:</strong> ${totalXP}</p>
                        <p><strong>Average Grade:</strong> ${avgGrade}</p>
                        <p><strong>Total Results/Projects:</strong> ${results.result.length}</p>
                        <p><strong>Latest activity:</strong> ${latestActivity.transaction[0].object.name}</p>
                    </div>

                    <div style="margin-top: 20px; border: 1px solid black; padding: 10px;">                        
                        <h2>Audits Details</h2>
                        <p><strong>Audits Done:</strong> ${totalAuditsDone}</p>
                        <p><strong>Audits Passed:</strong> ${auditsPassed}</p>
                        <p><strong>Audits Failed:</strong> ${auditsFailed}</p>
                        <p><strong>Audit Ratio:</strong> ${auditsRatio.user[0].auditRatio.toFixed(1)}</p>                        
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
                        <h2>Audit Ratio</h2>
                        <div id="audit-ratio"></div>
                        <div><strong>${auditsRatio.user[0].auditRatio.toFixed(1)}</strong></div>
                    </div>
                </div>
            `;

            // Generate graphs
            Graphs.createXPOverTimeChart(transactionsByProjects.user[0].transactions, 'xp-over-time');
            // console.log(transactionsByProjects.user[0].transactions);
            Graphs.createXPByProjectChart(transactionsByProjects.user[0].transactions, 'xp-by-project');
            Graphs.createAuditRatioChart(auditsRatio.user[0], 'audit-ratio');

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
