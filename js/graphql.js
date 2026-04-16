const GraphQL = {
    // Query user information
    async getUserInfo() {
        const query = `
            {
                user {
                    id
                    login
                }
            }
        `;
        return this.query(query);
    },

    async getUserProfile() {
        const query = `
            {
                user {
                    id
                    levelTx: transactions(
                        where: {type: {_eq: "level"}}
                        order_by: {createdAt: desc}
                        limit: 1
                    ) {
                        amount
                        createdAt
                    }
                        lastSkillTx: transactions(
                        where: {type: {_like: "skill_%"}}
                        order_by: {createdAt: desc}
                        limit: 1
                    ) {
                        type
                        amount
                        createdAt
                    }
                    profile
                    attrs
                }
            }
        `
        return this.query(query);
    },

    async getLatestActivity() {
        const query = `
            {
                transaction(
                    where: {userLogin: {_eq: "aalmarzou"}, type: {_eq: "xp"}, amount: {_is_null: false}}
                    order_by: {createdAt: desc}
                    limit: 1
                ) {
                    amount
                    createdAt
                    path
                    object {
                    name
                    type
                    }
                }
            }
        `
        return this.query(query);
    },

    // Query transactions by project for XP data //!(KEEP)
    //? Needs Renaming maybe since you are using it for two different plots 
    async getUserTransactionsByProjects() {
        const query = `
            {
                user {
                    transactions(
                        order_by: {createdAt: asc}
                        where: { 
                            object: { type: { _eq: "project" } } 
                            type: { _eq: "xp" }
                            amount: { _is_null: false }
                        }
                    ) {
                        id
                        type
                        amount
                        createdAt
                        path
                        object {
                            name
                            type
                        }
                    }
                }
            }
        `;
        return this.query(query);
    },

    // Query progress (grades)
    async getUserProgress() {
        const query = `
            {
                user {
                    progresses(
                        where: {
                            object: { type: { _eq: "project" } } 
                            grade: { _is_null: false }
                        }
                    ) {
                        id
                        grade
                        createdAt
                        object {
                            name
                            type
                        }
                    }
                }
            }
        `;
        return this.query(query);
    },

    // Query audit [ass/fail
    // How much I passed and failed other users?
    //? Try to redo where I get the AuditRatio same as Reboot
    //! Keep we will use it part of the 3 section (user id, audits, xp/projects)
    async getUserAudits() {
        const query = `
                {
                    user {
                        audits(
                            where: { 
                                grade: { _is_null: false } 
                            }
                        ) {
                            id
                            auditedAt
                            auditorLogin
                            grade
                            createdAt
                        }
                    }
                }
        `;
        return this.query(query);
    },

    // Query audit ratio
    async getUserAuditsRatio() {
        const query = `
                {
                    user {
                        id
                        totalUp
                        totalDown
                        auditRatio
                    }
                }
        `;
        return this.query(query);
    },

    // Query Total Audit Done by User //!(KEEP)
    async getTotalAuditsCount() {
        const query = `
                {
                    audit_aggregate(
                        where: {
                        auditorLogin: { _eq: "aalmarzou" }
                        auditedAt: { _is_null: false }
                        }
                    ) {
                        aggregate { count }
                    }
                }
        `;
        return this.query(query);
    },

    // Query skills/results
    //? What the hell is even this do, I get Total Results = 2?????? lol it should "project" and not "piscine"
    async getResults() {
        const query = `
            {
                result(
                    order_by: {createdAt: desc}
                    where: {
                        object: {
                        type: { _eq: "project" }
                        }
                    }
                ) {
                    id
                    grade
                    type
                    createdAt
                    object {
                        name
                        type
                    }
                }
            }
        `;
        return this.query(query);
    },

    // Query for Total XP amount //!(KEEP)
    async getXPSum() {
        const query = `
            query TotalXP {
                transaction_aggregate(
                    where: {
                    type: { _eq: "xp" }
                    object: { type: { _eq: "project" } }
                    amount: { _is_null: false }
                    }
                ) {
                    aggregate {
                    sum { amount }
                    }
                }
            }
        `;
        return this.query(query);
    },

    // Generic query function
    async query(query) {
        try {
            // Debug: log auth token structure before request
            try {
                console.log('GraphQL request auth token (raw):', Auth.token);
                if (Auth.token) console.log('Token parts:', Auth.token.split('.').length);
            } catch (e) {
                console.log('Failed to inspect token parts', e);
            }

            // Build headers and log for debugging
            let headers = {};
            try {
                headers = Auth.getAuthHeader();
            } catch (e) {
                console.error('Auth header error:', e.message);
            }
            console.log('Outgoing GraphQL headers:', headers);

            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                headers,
                body: JSON.stringify({ query })
            });

            if (!response.ok) {
                throw new Error(`GraphQL Error: ${response.status}`);
            }

            const text = await response.text();
            let data = null;
            try {
                data = JSON.parse(text);
            } catch (e) {
                data = { raw: text };
            }

            if (data && data.errors) {
                console.error('GraphQL returned errors:', data.errors);
                throw new Error(data.errors[0].message + ' -- full: ' + JSON.stringify(data.errors));
            }

            if (data && data.data) return data.data;
            
            return { raw: text };
        } catch (error) {
            console.error('GraphQL Query Error:', error);
            throw error;
        }
    }
};
