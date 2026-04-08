class LoginManager {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.submitBtn = this.form.querySelector('.btn-auth');
        this.init();
    }

    init() {
        this.setupEventListeners();
        
        // Если пользователь уже авторизован, перенаправляем
        if (authManager.isAuthenticated()) {
            window.location.href = 'profile.html';
        }
    }

    setupEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Переключение видимости пароля
        const toggleBtn = this.form.querySelector('.toggle-password');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.togglePasswordVisibility());
        }

        // Социальные кнопки
        const socialButtons = this.form.querySelectorAll('.btn-social');
        socialButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleSocialLogin(e));
        });
    }

    async handleSubmit(e) {
    e.preventDefault();
    
    if (!this.validateForm()) {
        return;
    }

    this.setLoading(true);

    const formData = {
        email: this.emailInput.value.trim(),
        password: this.passwordInput.value
    };

    try {
        const result = await authManager.login(formData.email, formData.password);

        if (result.success) {
            this.showSuccess('Успешный вход!');
            setTimeout(() => {
                const returnUrl = new URLSearchParams(window.location.search).get('return') || 'profile.html';
                window.location.href = returnUrl;
            }, 1000);
        } else {
            this.showError(result.error || 'Ошибка входа');
        }
    } catch (error) {
        this.showError('Ошибка соединения с сервером');
        console.error('Login error:', error);
    } finally {
        this.setLoading(false);
    }
}

    validateForm() {
        let isValid = true;
        const errors = [];

        // Валидация email
        const email = this.emailInput.value.trim();
        if (!email) {
            errors.push('Email обязателен');
            this.highlightError(this.emailInput);
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            errors.push('Введите корректный email');
            this.highlightError(this.emailInput);
            isValid = false;
        } else {
            this.clearError(this.emailInput);
        }

        // Валидация пароля
        const password = this.passwordInput.value;
        if (!password) {
            errors.push('Пароль обязателен');
            this.highlightError(this.passwordInput);
            isValid = false;
        } else if (password.length < 6) {
            errors.push('Пароль должен содержать минимум 6 символов');
            this.highlightError(this.passwordInput);
            isValid = false;
        } else {
            this.clearError(this.passwordInput);
        }

        if (errors.length > 0) {
            this.showError(errors.join('<br>'));
        }

        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    highlightError(input) {
        input.classList.add('error');
    }

    clearError(input) {
        input.classList.remove('error');
    }

    togglePasswordVisibility() {
        const type = this.passwordInput.type === 'password' ? 'text' : 'password';
        this.passwordInput.type = type;
        
        const toggleBtn = this.form.querySelector('.toggle-password');
        toggleBtn.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
    }

    handleSocialLogin(e) {
        const provider = e.target.classList.contains('btn-google') ? 'google' : 'yandex';
        this.showMessage(`Вход через ${provider} временно недоступен`, 'warning');
    }

    setLoading(loading) {
        const btnText = this.submitBtn.querySelector('.btn-text');
        const btnLoading = this.submitBtn.querySelector('.btn-loading');
        
        if (loading) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline';
            this.submitBtn.disabled = true;
        } else {
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            this.submitBtn.disabled = false;
        }
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type = 'info') {
        // Удаляем существующие сообщения
        const existingMessage = document.querySelector('.auth-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `auth-message auth-message-${type}`;
        messageDiv.innerHTML = message;

        // Стили для сообщения
        messageDiv.style.cssText = `
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            text-align: center;
            font-weight: 500;
        `;

        if (type === 'success') {
            messageDiv.style.background = '#d4edda';
            messageDiv.style.color = '#155724';
            messageDiv.style.border = '1px solid #c3e6cb';
        } else if (type === 'error') {
            messageDiv.style.background = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.style.border = '1px solid #f5c6cb';
        } else if (type === 'warning') {
            messageDiv.style.background = '#fff3cd';
            messageDiv.style.color = '#856404';
            messageDiv.style.border = '1px solid #ffeaa7';
        }

        this.form.insertBefore(messageDiv, this.form.firstChild);

        // Автоматическое скрытие для success сообщений
        if (type === 'success') {
            setTimeout(() => {
                messageDiv.remove();
            }, 3000);
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});