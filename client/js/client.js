class ClientApp {
    constructor() {
        this.API_BASE_URL = 'https://four537-termproj-server.onrender.com/api'; 
        
        this.views = {
            login: document.getElementById('login-view'),
            register: document.getElementById('register-view'),
            user: document.getElementById('user-view'),
            admin: document.getElementById('admin-view')
        };
        this.logoutBtn = document.getElementById('logout-btn');
        this.alertBox = document.getElementById('alert-box');
        this.quotaDisplay = document.getElementById('api-quota-display');
        
        this.bindEvents();
        this.checkAuthStatus();
    }

    bindEvents() {
        document.getElementById('show-register').onclick = (e) => { e.preventDefault(); this.switchView('register'); };
        document.getElementById('show-login').onclick = (e) => { e.preventDefault(); this.switchView('login'); };
        
        document.getElementById('login-form').onsubmit = (e) => this.handleLogin(e);
        document.getElementById('register-form').onsubmit = (e) => this.handleRegister(e);
        
        this.logoutBtn.onclick = () => this.handleLogout();
        
        const testBtn = document.getElementById('test-api-btn');
        if(testBtn) testBtn.onclick = () => this.testProtectedAPI();
    }

    switchView(viewName) {
        Object.values(this.views).forEach(view => {
            if(view) view.classList.add('hidden');
        });

        if(this.views[viewName]) this.views[viewName].classList.remove('hidden');
        
        if(viewName === 'login' || viewName === 'register') {
            this.logoutBtn.classList.add('hidden');
        } else {
            this.logoutBtn.classList.remove('hidden');
        }
    }

    showAlert(message, isError = true) {
        this.alertBox.textContent = message;
        this.alertBox.className = isError ? 'response-error response-card' : 'response-success response-card';
        this.alertBox.classList.remove('hidden');
        setTimeout(() => this.alertBox.classList.add('hidden'), 4000);
    }

    checkAuthStatus() {
        const token = localStorage.getItem('jwt_token');
        const role = localStorage.getItem('user_role');
        const quota = localStorage.getItem('api_quota');

        if (token) {
            if (role === 'admin') {
                this.switchView('admin');
            } else {
                this.switchView('user');
                if(this.quotaDisplay) this.quotaDisplay.textContent = quota || '20';
            }
        } else {
            this.switchView('login');
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch(`${this.API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('jwt_token', data.token);
                localStorage.setItem('user_role', data.role);
                localStorage.setItem('api_quota', data.api_calls_remaining);
                
                this.checkAuthStatus(); 
                this.showAlert('Login successful!', false);
            } else {
                this.showAlert(data.error || 'Login failed');
            }
        } catch (error) {
            this.showAlert('Cannot connect to server');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        try {
            const response = await fetch(`${this.API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert('Registration successful! Please log in.', false);
                this.switchView('login');
            } else {
                this.showAlert(data.error || 'Registration failed');
            }
        } catch (error) {
            this.showAlert('Cannot connect to server');
        }
    }

    handleLogout() {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('api_quota');
        this.checkAuthStatus();
        this.showAlert('You have been logged out.', false);
    }

    async testProtectedAPI() {
        const token = localStorage.getItem('jwt_token');
        
        try {
            const response = await fetch(`${this.API_BASE_URL}/ai/ask`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                }
            });
            
            const data = await response.json();
            
            if(response.ok) {
                this.showAlert(data.message, false);
            } else {
                this.showAlert(data.error || 'API call failed');
                if(response.status === 401 || response.status === 403) {
                    this.handleLogout(); 
                }
            }
        } catch (error) {
            this.showAlert('Error calling API');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ClientApp();
});