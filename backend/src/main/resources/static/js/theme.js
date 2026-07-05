// Immediately apply theme before document body finishes rendering to avoid a bright flash
(function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark-theme');
        document.body?.classList.add('dark-theme'); // Apply to body too, just in case
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    // Re-verify document body has the class
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
});

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    
    if (isDark) {
        document.documentElement.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
    }
}
