class WishlistManager {
    constructor() {
        this.wishlist = [];
        this.init();
    }

    async init() {
        // Проверяем авторизацию
        if (!authManager.requireAuth()) return;

        await this.loadWishlist();
        this.setupEventListeners();
        this.updateUserInfo();
    }

    async loadWishlist() {
        try {
            const response = await fetch('/api/wishlist', {
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                this.wishlist = data.wishlist || [];
            } else {
                throw new Error('Ошибка загрузки избранного');
            }
        } catch (error) {
            console.error('Ошибка загрузки избранного:', error);
            // Демо-данные для тестирования
            this.wishlist = this.getDemoWishlist();
        }

        this.displayWishlist();
    }

    getDemoWishlist() {
        return [
            {
                id: 1,
                name: 'Диван "Милан"',
                price: 245000,
                image_url: '/images/products/39k5spm8xks5bmoqa10g0cbox3285ajl.jpg',
                added_at: '2024-01-15T10:30:00Z'
            },
            {
                id: 2,
                name: 'Кресло "Флоренция"',
                price: 89000,
                image_url: '/images/products/666x444_85.webp',
                added_at: '2024-01-10T14:20:00Z'
            },
            {
                id: 3,
                name: 'Обеденный стол "Венеция"',
                price: 420000,
                image_url: '/images/products/dc3pjqchb3q8qzxjs5w0lfmb5o1kd3rz.jpg',
                added_at: '2024-01-08T09:15:00Z'
            }
        ];
    }

    setupEventListeners() {
        // Обработчики для кнопок удаления из избранного
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-from-wishlist')) {
                const productId = e.target.dataset.productId;
                this.removeFromWishlist(productId);
            }
        });
    }

    async removeFromWishlist(productId) {
        try {
            const response = await fetch(`/api/wishlist/${productId}`, {
                method: 'DELETE',
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                // Удаляем из локального массива
                this.wishlist = this.wishlist.filter(item => item.id != productId);
                this.displayWishlist();
                this.showMessage('Товар удален из избранного', 'success');
            } else {
                throw new Error('Ошибка удаления из избранного');
            }
        } catch (error) {
            console.error('Ошибка удаления из избранного:', error);
            this.showMessage('Ошибка удаления из избранного', 'error');
        }
    }

    displayWishlist() {
        const wishlistGrid = document.getElementById('wishlistGrid');
        const wishlistEmpty = document.getElementById('wishlistEmpty');

        if (this.wishlist.length === 0) {
            wishlistGrid.style.display = 'none';
            wishlistEmpty.style.display = 'block';
            return;
        }

        wishlistGrid.style.display = 'grid';
        wishlistEmpty.style.display = 'none';

        wishlistGrid.innerHTML = this.wishlist.map(item => `
            <div class="wishlist-item">
                <div class="wishlist-item-image">
                    <img src="${item.image_url || '/images/placeholder.jpg'}" alt="${item.name}" onerror="this.src='/images/placeholder.jpg'">
                </div>
                <div class="wishlist-item-info">
                    <h3>${item.name}</h3>
                    <p class="price">${this.formatPrice(item.price)} ₽</p>
                    <div class="wishlist-item-actions">
                        <a href="product.html?id=${item.id}" class="btn btn-outline">Посмотреть</a>
                        <button class="btn btn-primary remove-from-wishlist" data-product-id="${item.id}">Удалить</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateUserInfo() {
        if (authManager.currentUser) {
            document.getElementById('userName').textContent = `${authManager.currentUser.firstName} ${authManager.currentUser.lastName}`;
            document.getElementById('userEmail').textContent = authManager.currentUser.email;

            // Устанавливаем аватар
            const avatarImg = document.getElementById('userAvatar');
            if (authManager.currentUser.avatar_url) {
                avatarImg.src = authManager.currentUser.avatar_url;
                avatarImg.style.display = 'block';
            } else {
                avatarImg.src = 'data:image/svg+xml;base64,' + btoa('<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="40" fill="#f0f0f0"/><text x="40" y="45" text-anchor="middle" font-family="Arial" font-size="24" fill="#999">👤</text></svg>');
                avatarImg.style.display = 'block';
            }
        }
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price);
    }

    showMessage(message, type = 'info') {
        // Простая реализация уведомлений
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;

        if (type === 'success') {
            notification.style.background = '#4CAF50';
        } else if (type === 'error') {
            notification.style.background = '#f44336';
        } else {
            notification.style.background = '#2196F3';
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new WishlistManager();
});