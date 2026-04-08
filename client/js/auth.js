class AuthManager {
    constructor() {
        this.currentUser = null;
        this.token = localStorage.getItem('luxury_token');
        this.init();
    }

    init() {
        if (this.token) {
            this.setUserFromToken(this.token);
        }
        this.updateNavigation();
    }

    setUserFromToken(token) {
        try {
            // В реальном приложении здесь была бы проверка JWT токена
            const userData = this.parseJWT(token);
            this.currentUser = userData;
            this.token = token;
        } catch (error) {
            console.error('Invalid token:', error);
            this.logout();
        }
    }

    parseJWT(token) {
        try {
            // Простая имитация парсинга JWT токена
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4);
            const jsonPayload = decodeURIComponent(atob(paddedBase64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            // Если токен не в JWT формате, используем как простой JSON
            const decoded = atob(token);
            return JSON.parse(decoded);
        }
    }

    async login(email, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Ошибка входа');
            }

            this.token = data.token;
            this.currentUser = data.user;
            
            localStorage.setItem('luxury_token', this.token);
            this.updateNavigation();
            
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }

    async register(userData) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Ошибка регистрации');
            }

            this.token = data.token;
            this.currentUser = data.user;
            
            localStorage.setItem('luxury_token', this.token);
            this.updateNavigation();
            
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        }
    }

    logout() {
        this.currentUser = null;
        this.token = null;
        localStorage.removeItem('luxury_token');
        localStorage.removeItem('luxury_cart');
        this.updateNavigation();
        window.location.href = 'index.html';
    }

    updateNavigation() {
        const navAuth = document.querySelector('.header-actions');
        if (!navAuth) return;

        if (this.currentUser) {
            const adminLink = this.isAdmin() ? `<a href="admin.html" class="auth-link">Админ</a>` : '';
            navAuth.innerHTML = `
                <span class="user-greeting">Привет, ${this.currentUser.firstName}</span>
                ${adminLink}
                <a href="profile.html" class="auth-link">Профиль</a>
                <a href="orders.html" class="auth-link">Заказы</a>
                <a href="cart.html" class="cart-link">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.4 5.2 16.4H17M17 13V16.4M9 19C9 19.6 8.6 20 8 20C7.4 20 7 19.6 7 19C7 18.4 7.4 18 8 18C8.6 18 9 18.4 9 19ZM17 19C17 19.6 16.6 20 16 20C15.4 20 15 19.6 15 19C15 18.4 15.4 18 16 18C16.6 18 17 18.4 17 19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="cart-count">${this.getCartItemCount()}</span>
                </a>
                <button class="logout-btn" onclick="authManager.logout()">Выйти</button>
            `;
        } else {
            navAuth.innerHTML = `
                <button class="search-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                <a href="login.html" class="auth-link">Войти</a>
                <a href="register.html" class="auth-link">Регистрация</a>
                <a href="cart.html" class="cart-link">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.4 5.2 16.4H17M17 13V16.4M9 19C9 19.6 8.6 20 8 20C7.4 20 7 19.6 7 19C7 18.4 7.4 18 8 18C8.6 18 9 18.4 9 19ZM17 19C17 19.6 16.6 20 16 20C15.4 20 15 19.6 15 19C15 18.4 15.4 18 16 18C16.6 18 17 18.4 17 19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="cart-count">${this.getCartItemCount()}</span>
                </a>
            `;
        }
    }

    getCartItemCount() {
        const cart = JSON.parse(localStorage.getItem('luxury_cart') || '[]');
        return cart.reduce((total, item) => total + item.quantity, 0);
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    requireAuth(redirectUrl = 'login.html') {
        if (!this.isAuthenticated()) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    requireAdmin(redirectUrl = 'index.html') {
        if (!this.isAdmin()) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }
}

// Глобальный экземпляр менеджера авторизации
const authManager = new AuthManager();