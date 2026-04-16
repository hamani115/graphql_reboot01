localStorage.clear();
document.addEventListener('DOMContentLoaded', () => {
    // localStorage.clear();
    if (Auth.isAuthenticated()) {
        UI.showProfilePage();
    } else {
        UI.showLoginPage();
    }
});
