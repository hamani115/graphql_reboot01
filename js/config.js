const CONFIG = {
    API_URL: 'https://learn.reboot01.com/api/graphql-engine/v1/graphql',
    AUTH_URL: 'https://learn.reboot01.com/api/auth/signin',
};

// Update CONFIG if needed from environment
if (typeof process !== 'undefined' && process.env) {
    CONFIG.API_URL = process.env.REACT_APP_API_URL || CONFIG.API_URL;
    CONFIG.AUTH_URL = process.env.REACT_APP_AUTH_URL || CONFIG.AUTH_URL;
}
