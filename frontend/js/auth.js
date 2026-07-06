const API_BASE = `${CONFIG.API_BASE_URL}/api`;

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in, if so redirect to dashboard
    if (localStorage.getItem('user')) {
        window.location.href = 'index.html';
        return;
    }

    const subtitle = document.getElementById('auth-subtitle');
    const alertBox = document.getElementById('alert-box');

    // Forms
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const forgotForm = document.getElementById('forgot-form');

    // Toggles
    const toSignup = document.getElementById('to-signup');
    const toForgot = document.getElementById('to-forgot');
    const toLoginFromSignup = document.getElementById('to-login-from-signup');
    const toLoginFromForgot = document.getElementById('to-login-from-forgot');

    // Helper functions
    const showAlert = (message, type) => {
        alertBox.textContent = message;
        alertBox.className = `alert-message ${type}`;
    };

    const clearAlert = () => {
        alertBox.textContent = '';
        alertBox.className = 'alert-message';
    };

    const switchForm = (showForm, subtitleText) => {
        clearAlert();
        [loginForm, signupForm, forgotForm].forEach(f => f.classList.remove('active'));
        showForm.classList.add('active');
        subtitle.textContent = subtitleText;
    };

    // Event listeners for switching forms
    toSignup.addEventListener('click', (e) => {
        e.preventDefault();
        switchForm(signupForm, 'Create a new account to get started.');
    });

    toForgot.addEventListener('click', (e) => {
        e.preventDefault();
        switchForm(forgotForm, 'Enter your email to simulate password recovery.');
    });

    toLoginFromSignup.addEventListener('click', (e) => {
        e.preventDefault();
        switchForm(loginForm, 'Welcome back! Please enter your details.');
    });

    toLoginFromForgot.addEventListener('click', (e) => {
        e.preventDefault();
        switchForm(loginForm, 'Welcome back! Please enter your details.');
    });

    // Form Submission: SIGN UP
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAlert();

        const fullName = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const countryCode = document.getElementById('signup-country-code').value;
        const phoneInput = document.getElementById('signup-phone').value.trim();
        const phoneNumber = `${countryCode} ${phoneInput}`;
        const password = document.getElementById('signup-password').value;
        const industry = document.getElementById('signup-industry').value;

        try {
            const response = await fetch(`${API_BASE}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fullName, email, phoneNumber, password, industry })
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                showAlert(data.message + " Redirecting to Login...", 'success');
                signupForm.reset();
                setTimeout(() => {
                    switchForm(loginForm, 'Welcome back! Please enter your details.');
                }, 2000);
            } else {
                showAlert(data.message || 'Registration failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Signup Error:', error);
            showAlert('Cannot connect to the authentication server. Ensure it is running.', 'error');
        }
    });

    // Form Submission: LOGIN
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAlert();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                showAlert('Login successful! Redirecting...', 'success');
                // Store user details in localStorage
                localStorage.setItem('user', JSON.stringify(data.user));
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                showAlert(data.message || 'Invalid email or password.', 'error');
            }
        } catch (error) {
            console.error('Login Error:', error);
            showAlert('Cannot connect to the authentication server. Ensure it is running.', 'error');
        }
    });

    // Form Submission: FORGOT PASSWORD
    forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAlert();

        const email = document.getElementById('forgot-email').value;

        try {
            const response = await fetch(`${API_BASE}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                showAlert(data.message, 'success');
                forgotForm.reset();
            } else {
                showAlert(data.message || 'Error occurred. Verify the email exists.', 'error');
            }
        } catch (error) {
            console.error('Forgot Password Error:', error);
            showAlert('Cannot connect to the authentication server. Ensure it is running.', 'error');
        }
    });

    // Toggle Password Visibility
    const togglePasswordButtons = document.querySelectorAll('.toggle-password-btn');
    togglePasswordButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            const eyeOpen = btn.querySelector('.eye-open');
            const eyeClosed = btn.querySelector('.eye-closed');
            
            if (input.type === 'password') {
                input.type = 'text';
                eyeOpen.style.display = 'none';
                eyeClosed.style.display = 'block';
            } else {
                input.type = 'password';
                eyeOpen.style.display = 'block';
                eyeClosed.style.display = 'none';
            }
        });
    });
});
