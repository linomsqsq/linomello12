class ProfileManager {
    constructor() {
        this.user = null;
        this.init();
    }

    async init() {
        // Проверяем авторизацию
        if (!authManager.requireAuth()) return;

        await this.loadUserProfile();
        this.setupEventListeners();
        this.loadPreferences();
        this.loadUserStats();
    }

    async loadUserProfile() {
        try {
            const response = await fetch('/api/users/profile', {
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
                this.populateForm(data.user);
            } else {
                throw new Error('Ошибка загрузки профиля');
            }
        } catch (error) {
            console.error('Ошибка загрузки профиля:', error);
            this.showDemoProfile();
        }
    }

    populateForm(user) {
        document.getElementById('firstName').value = user.first_name || '';
        document.getElementById('lastName').value = user.last_name || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('phone').value = user.phone || '';

        // Устанавливаем аватар
        const avatarImg = document.getElementById('userAvatar');
        if (user.avatar_url) {
            avatarImg.src = user.avatar_url;
            avatarImg.style.display = 'block';
        } else {
            avatarImg.src = 'data:image/svg+xml;base64,' + btoa('<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="40" fill="#f0f0f0"/><text x="40" y="45" text-anchor="middle" font-family="Arial" font-size="24" fill="#999">👤</text></svg>');
            avatarImg.style.display = 'block';
        }

        // Обновляем отображаемое имя
        document.getElementById('userName').textContent = `${user.first_name} ${user.last_name}`;
        document.getElementById('userEmail').textContent = user.email;
    }

    showDemoProfile() {
        this.user = {
            first_name: 'Иван',
            last_name: 'Петров',
            email: 'user@example.com',
            phone: '+7 (999) 987-65-43',
            created_at: '2024-01-01T00:00:00Z'
        };
        this.populateForm(this.user);
    }

    setupEventListeners() {
        const form = document.getElementById('profileForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Загрузка аватарки
        const avatarInput = document.getElementById('avatarInput');
        if (avatarInput) {
            avatarInput.addEventListener('change', (e) => this.handleAvatarUpload(e));
        }

        // Настройки уведомлений
        const notificationCheckboxes = document.querySelectorAll('.preferences-options input[type="checkbox"]');
        notificationCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.savePreferences());
        });
    }

    async handleSubmit(e) {
        e.preventDefault();

        const formData = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            phone: document.getElementById('phone').value.trim()
        };

        // Валидация
        if (!formData.firstName || !formData.lastName) {
            this.showMessage('Пожалуйста, заполните все обязательные поля', 'error');
            return;
        }

        try {
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: authManager.getAuthHeaders(),
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const data = await response.json();
                this.showMessage('Профиль успешно обновлен', 'success');
                
                // Обновляем данные в authManager и на странице
                if (authManager.currentUser) {
                    authManager.currentUser.firstName = formData.firstName;
                    authManager.currentUser.lastName = formData.lastName;
                    if (data.token) {
                        authManager.token = data.token;
                        localStorage.setItem('luxury_token', data.token);
                    }
                    authManager.updateNavigation();
                }
                this.user.first_name = formData.firstName;
                this.user.last_name = formData.lastName;
                document.getElementById('userName').textContent = `${formData.firstName} ${formData.lastName}`;
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Ошибка обновления профиля');
            }
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    async handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Проверка размера файла (2MB)
        if (file.size > 2 * 1024 * 1024) {
            this.showMessage('Файл слишком большой. Максимум 2MB', 'error');
            return;
        }

        // Проверка типа файла
        if (!file.type.startsWith('image/')) {
            this.showMessage('Пожалуйста, выберите изображение', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await fetch('/api/users/avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authManager.token}`
                    // Не устанавливаем Content-Type для FormData
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                // Обновляем аватар на странице
                document.getElementById('userAvatar').src = data.avatarUrl;
                this.showMessage('Аватар успешно обновлен', 'success');
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Ошибка загрузки аватара');
            }
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    async loadUserStats() {
        const memberSince = this.user && this.user.created_at ? new Date(this.user.created_at).getFullYear() : 2024;
        const demoStats = {
            totalOrders: 3,
            totalSpent: 868000,
            memberSince
        };

        document.getElementById('totalOrders').textContent = demoStats.totalOrders;
        document.getElementById('totalSpent').textContent = this.formatPrice(demoStats.totalSpent) + ' ₽';
        document.getElementById('memberSince').textContent = demoStats.memberSince;
    }

    changePassword() {
        // В реальном приложении здесь открывалось бы модальное окно смены пароля
        alert('Функция смены пароля будет доступна в полной версии приложения');
    }

    manageSessions() {
        // В реальном приложении здесь отображались бы активные сессии
        alert('Управление сессиями будет доступно в полной версии приложения');
    }

    savePreferences() {
        const preferences = {
            emailNotifications: document.getElementById('emailNotifications').checked,
            smsNotifications: document.getElementById('smsNotifications').checked,
            marketingEmails: document.getElementById('marketingEmails').checked
        };

        localStorage.setItem('luxury_preferences', JSON.stringify(preferences));
        this.showMessage('Настройки сохранены', 'success');
    }

    loadPreferences() {
        const saved = localStorage.getItem('luxury_preferences');
        if (saved) {
            const preferences = JSON.parse(saved);
            document.getElementById('emailNotifications').checked = preferences.emailNotifications;
            document.getElementById('smsNotifications').checked = preferences.smsNotifications;
            document.getElementById('marketingEmails').checked = preferences.marketingEmails;
        }
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price);
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `profile-message profile-message-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 1000;
            color: white;
            font-weight: 500;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        `;

        if (type === 'success') {
            messageDiv.style.background = '#00c851';
        } else if (type === 'error') {
            messageDiv.style.background = '#ff4444';
        } else {
            messageDiv.style.background = '#33b5e5';
        }

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});