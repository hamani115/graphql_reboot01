// GraphQL module
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

    // Query transactions (XP data)
    async getTransactions() {
        const query = `
            {
                transaction(order_by: {createdAt: asc}) {
                    id
                    type
                    amount
                    createdAt
                    path
                    object {
                        name
                    }
                }
            }
        `;
        return this.query(query);
    },

    // Query progress (grades)
    async getProgress() {
        const query = `
            {
                progress {
                    id
                    grade
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

    // Query audit ratio
    async getAudits() {
        const query = `
            {
                audit {
                    id
                    grade
                    createdAt
                }
            }
        `;
        return this.query(query);
    },

    // Query skills/results
    async getResults() {
        const query = `
            {
                result(order_by: {createdAt: desc}) {
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

            // Build headers and log them for debugging
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
            // Fallback: return raw text
            return { raw: text };
        } catch (error) {
            console.error('GraphQL Query Error:', error);
            throw error;
        }
    }
};
