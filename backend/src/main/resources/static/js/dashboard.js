document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Guard - redirect if not authenticated
    const userDataStr = localStorage.getItem('user');
    if (!userDataStr) {
        window.location.href = 'auth.html';
        return;
    }

    const user = JSON.parse(userDataStr);

    // 2. Populate User Profile Details
    const profileTrigger = document.getElementById('profile-trigger');
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    const userIndustry = document.getElementById('user-industry');

    if (user.fullName) {
        // Set Profile Icon text to first letter of user's name
        profileTrigger.textContent = user.fullName.charAt(0).toUpperCase();
        userName.textContent = user.fullName;
    }
    if (user.email) {
        userEmail.textContent = user.email;
    }
    if (user.industry) {
        userIndustry.textContent = `Industry: ${user.industry}`;
    }

    // 3. Dropdown Menu Toggle (Pure JS controller with CSS selectors)
    const profileDropdown = document.getElementById('profile-dropdown');

    profileTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('show');
    });

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
        if (!profileDropdown.contains(e.target) && e.target !== profileTrigger) {
            profileDropdown.classList.remove('show');
        }
    });

    // 4. Logout Action Handler
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', () => {
        // Clear cached credentials
        localStorage.removeItem('user');
        // Redirect to login page
        window.location.href = 'auth.html';
    });
});
