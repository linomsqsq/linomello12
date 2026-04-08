class RegisterManager {
    constructor() {
        this.form = document.getElementById('registerForm');
        this.passwordInput = document.getElementById('password');
        this.confirmPasswordInput = document.getElementById('confirmPassword');
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
        
        // Отслеживание силы пароля
        this.passwordInput.addEventListener('input', () => this.updatePasswordStrength());
        
        // Проверка подтверждения пароля
        this.confirmPasswordInput.addEventListener('input', () => this.validatePasswordMatch());
        
        // Социальные кнопки
        const socialButtons = this.form.querySelectorAll('.btn-social');
        socialButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleSocialRegister(e));
        });
    }

    async handleSubmit(e) {
    e.preventDefault();
    
    if (!this.validateForm()) {
        return;
    }

    this.setLoading(true);

    const formData = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        password: this.passwordInput.value
    };

    try {
        const result = await authManager.register(formData);

        if (result.success) {
            this.showSuccess('Регистрация успешна! Добро пожаловать!');
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 1500);
        } else {
            this.showError(result.error || 'Ошибка регистрации');
        }
    } catch (error) {
        this.showError('Ошибка соединения с сервером');
        console.error('Register error:', error);
    } finally {
        this.setLoading(false);
    }
}

    validateForm() {
        let isValid = true;
        const errors = [];

        // Валидация имени
        const firstName = document.getElementById('firstName').value.trim();
        if (!firstName) {
            errors.push('Имя обязательно');
            this.highlightError(document.getElementById('firstName'));
            isValid = false;
        } else if (firstName.length < 2) {
            errors.push('Имя должно содержать минимум 2 символа');
            this.highlightError(document.getElementById('firstName'));
            isValid = false;
        } else {
            this.clearError(document.getElementById('firstName'));
        }

        // Валидация фамилии
        const lastName = document.getElementById('lastName').value.trim();
        if (!lastName) {
            errors.push('Фамилия обязательна');
            this.highlightError(document.getElementById('lastName'));
            isValid = false;
        } else if (lastName.length < 2) {
            errors.push('Фамилия должна содержать минимум 2 символа');
            this.highlightError(document.getElementById('lastName'));
            isValid = false;
        } else {
            this.clearError(document.getElementById('lastName'));
        }

        // Валидация email
        const email = document.getElementById('email').value.trim();
        if (!email) {
            errors.push('Email обязателен');
            this.highlightError(document.getElementById('email'));
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            errors.push('Введите корректный email');
            this.highlightError(document.getElementById('email'));
            isValid = false;
        } else {
            this.clearError(document.getElementById('email'));
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

        // Проверка совпадения паролей
        const confirmPassword = this.confirmPasswordInput.value;
        if (password !== confirmPassword) {
            errors.push('Пароли не совпадают');
            this.highlightError(this.confirmPasswordInput);
            isValid = false;
        } else {
            this.clearError(this.confirmPasswordInput);
        }

        // Проверка согласия с условиями
        const agreement = document.querySelector('input[name="agreement"]');
        if (!agreement.checked) {
            errors.push('Необходимо согласие с условиями использования');
            isValid = false;
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

    updatePasswordStrength() {
        const password = this.passwordInput.value;
        const strengthBar = document.querySelector('.strength-fill');
        const strengthText = document.querySelector('.strength-text');
        
        let strength = 0;
        let text = 'Слабый пароль';
        let color = '#ff4444';

        if (password.length >= 6) strength++;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
        if (password.match(/\d/)) strength++;
        if (password.match(/[^a-zA-Z\d]/)) strength++;

        switch (strength) {
            case 1:
                text = 'Слабый пароль';
                color = '#ff4444';
                break;
            case 2:
                text = 'Средний пароль';
                color = '#ffaa00';
                break;
            case 3:
                text = 'Хороший пароль';
                color = '#ffdd00';
                break;
            case 4:
                text = 'Надежный пароль';
                color = '#00c851';
                break;
        }

        strengthBar.style.width = `${strength * 25}%`;
        strengthBar.style.background = color;
        strengthBar.setAttribute('data-strength', strength);
        strengthText.textContent = text;
        strengthText.style.color = color;
    }

    validatePasswordMatch() {
        const password = this.passwordInput.value;
        const confirmPassword = this.confirmPasswordInput.value;
        
        if (confirmPassword && password !== confirmPassword) {
            this.highlightError(this.confirmPasswordInput);
        } else if (confirmPassword) {
            this.clearError(this.confirmPasswordInput);
        }
    }

    highlightError(input) {
        input.classList.add('error');
    }

    clearError(input) {
        input.classList.remove('error');
    }

    handleSocialRegister(e) {
        const provider = e.target.classList.contains('btn-google') ? 'google' : 'yandex';
        this.showMessage(`Регистрация через ${provider} временно недоступна`, 'warning');
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
    new RegisterManager();
});