const Auth = {
    token: localStorage.getItem('jwtToken') || null,
    userId: localStorage.getItem('userId') || null,

    // Decode JWT to extract payload
    decodeToken(token) {
        if (!token) return null;
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        try {
            const payload = JSON.parse(atob(parts[1]));
            return payload;
        } catch (error) {
            console.error('Failed to decode token:', error);
            return null;
        }
    },
    // Login
    async login(credentials) {
        try {
            const encodedCredentials = btoa(`${credentials.username}:${credentials.password}`);

            const response = await fetch(CONFIG.AUTH_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${encodedCredentials}`
                }
            });

            const raw = await response.text();

            // Try to parse JSON or raw data
            let parsed = null;
            try { parsed = JSON.parse(raw); } catch (e) { parsed = null; }

            let tokenCandidates = null;
            if (parsed !== null) {
                if (typeof parsed === 'string') {
                    tokenCandidates = parsed;
                } else if (typeof parsed === 'object') {
                    tokenCandidates = parsed.access_token || parsed.token || parsed.jwt || parsed.accessToken || parsed.jwt_token || Object.values(parsed)[0];
                }
            } else {
                tokenCandidates = raw && raw.trim();
            }

            if (!response.ok) {
                const msg = tokenCandidates || response.statusText || `HTTP ${response.status}`;
                throw new Error(msg);
            }

            if (!tokenCandidates) {
                throw new Error('Signin response did not contain a JWT token. Response: ' + (raw || '').slice(0, 200));
            }

            let token = String(tokenCandidates).trim();

            if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
                try {
                    token = JSON.parse(token);
                } catch (e) {
                    token = token.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
                }
            }

            if (token.split('.').length !== 3) {
                throw new Error('Signin did not return a valid JWT token. Response: ' + (raw || '').slice(0, 200));
            }

            this.token = token;

            // Decode token
            const decoded = this.decodeToken(this.token);
            if (decoded) {
                this.userId = decoded.sub || decoded.user_id || decoded.uid || decoded.id || null;
            }

            // Store token and userId when available
            localStorage.setItem('jwtToken', this.token);
            if (this.userId) localStorage.setItem('userId', this.userId);

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Login failed'
            };
        }
    },

    // Logout
    logout() {
        this.token = null;
        this.userId = null;
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('userId');
    },

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token;
    },

    // Get auth header
    getAuthHeader() {
        if (!this.token) throw new Error('No JWT token available');
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }
};

// Initialize userId from stored token in localStorage
if (Auth.token && !Auth.userId) {
    const decoded = Auth.decodeToken(Auth.token);
    if (decoded) {
        Auth.userId = decoded.sub || decoded.user_id || decoded.uid || decoded.id || null;
        if (Auth.userId) localStorage.setItem('userId', Auth.userId);
    }
}
