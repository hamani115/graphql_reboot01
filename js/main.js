// Main application entry point
document.addEventListener('DOMContentLoaded', () => {
    if (Auth.isAuthenticated()) {
        UI.showProfilePage();
    } else {
        UI.showLoginPage();
    }
});
