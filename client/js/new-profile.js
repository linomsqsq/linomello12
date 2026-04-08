class NewProfileManager {
    constructor() {
        this.form = document.getElementById('newProfileForm');
        this.messageBox = document.getElementById('newProfileMessage');
        this.init();
    }

    async init() {
        if (!authManager.requireAuth('login.html')) return;
        await this.loadCurrentUser();
        this.setupEventListeners();
    }

    async loadCurrentUser() {
        try {
            const response = await fetch('/api/auth/me', {
                headers: authManager.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Не удалось загрузить профиль');
            }

            const data = await response.json();
            this.user = data.user;
            this.populateForm(this.user);
        } catch (error) {
            console.error('Ошибка получения текущего пользователя:', error);
            this.showMessage('Не удалось загрузить данные профиля', 'error');
        }
    }

    populateForm(user) {
        document.getElementById('firstName').value = user.first_name || '';
        document.getElementById('lastName').value = user.last_name || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('phone').value = user.phone || '';
        document.getElementById('userName').textContent = `${user.first_name || 'Пользователь'} ${user.last_name || ''}`.trim();
        document.getElementById('userEmail').textContent = user.email || '';
    }

    setupEventListeners() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const formData = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            phone: document.getElementById('phone').value.trim()
        };

        if (!formData.firstName || !formData.lastName) {
            this.showMessage('Введите имя и фамилию', 'error');
            return;
        }

        try {
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: authManager.getAuthHeaders(),
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка сохранения профиля');
            }

            const data = await response.json();
            if (data.token) {
                authManager.token = data.token;
                localStorage.setItem('luxury_token', data.token);
                authManager.setUserFromToken(data.token);
                authManager.updateNavigation();
            }

            this.showMessage('Новый профиль успешно сохранён', 'success');
        } catch (error) {
            console.error('Ошибка сохранения нового профиля:', error);
            this.showMessage(error.message, 'error');
        }
    }

    showMessage(text, type = 'info') {
        if (!this.messageBox) return;
        this.messageBox.textContent = text;
        this.messageBox.className = `profile-message profile-message-${type}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new NewProfileManager();
});
