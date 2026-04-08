class OrdersManager {
    constructor() {
        this.orders = [];
        this.filteredOrders = [];
        this.currentFilter = 'all';
        this.init();
    }

    async init() {
        // Проверяем авторизацию
        if (!authManager.requireAuth()) return;

        await this.loadOrders();
        this.setupEventListeners();
        this.updateUserInfo();
    }

    async loadOrders() {
        try {
            const response = await fetch('/api/orders', {
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                this.orders = data.orders;
            } else {
                throw new Error('Ошибка загрузки заказов');
            }
        } catch (error) {
            console.error('Ошибка загрузки заказов:', error);
            // Демо-данные для тестирования
            this.orders = this.getDemoOrders();
        }

        this.applyFilter(this.currentFilter);
        this.displayOrders();
    }

    getDemoOrders() {
        return [
            {
                id: 1,
                total_amount: 534000,
                status: 'delivered',
                shipping_address: 'Москва, ул. Тверская, 15, кв. 45',
                created_at: '2024-01-15T10:30:00Z',
                items_count: 3
            },
            {
                id: 2,
                total_amount: 245000,
                status: 'shipped',
                shipping_address: 'Москва, ул. Арбат, 25, кв. 12',
                created_at: '2024-01-10T14:20:00Z',
                items_count: 1
            },
            {
                id: 3,
                total_amount: 89000,
                status: 'confirmed',
                shipping_address: 'Москва, ул. Новый Арбат, 30, кв. 8',
                created_at: '2024-01-08T09:15:00Z',
                items_count: 1
            }
        ];
    }

    setupEventListeners() {
        // Фильтры заказов
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                this.applyFilter(filter);
                
                // Обновляем активную кнопку
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    applyFilter(filter) {
        this.currentFilter = filter;
        
        if (filter === 'all') {
            this.filteredOrders = [...this.orders];
        } else {
            this.filteredOrders = this.orders.filter(order => order.status === filter);
        }
        
        this.displayOrders();
    }

    displayOrders() {
        const ordersList = document.getElementById('ordersList');
        const ordersEmpty = document.getElementById('ordersEmpty');

        if (this.filteredOrders.length === 0) {
            ordersList.style.display = 'none';
            ordersEmpty.style.display = 'block';
            return;
        }

        ordersList.style.display = 'block';
        ordersEmpty.style.display = 'none';

        ordersList.innerHTML = this.filteredOrders.map(order => `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-header">
                    <div class="order-info">
                        <h3>Заказ #${order.id}</h3>
                        <div class="order-meta">
                            <span class="order-date">${this.formatDate(order.created_at)}</span>
                            <span class="order-items">${order.items_count} товар(а)</span>
                        </div>
                    </div>
                    <div class="order-status ${order.status}">
                        ${this.getStatusText(order.status)}
                    </div>
                </div>
                
                <div class="order-details">
                    <div class="order-amount">
                        <strong>Сумма:</strong> ${this.formatPrice(order.total_amount)} ₽
                    </div>
                    <div class="order-address">
                        <strong>Адрес доставки:</strong> ${order.shipping_address}
                    </div>
                </div>
                
                <div class="order-actions">
                    <button class="btn btn-secondary" onclick="ordersManager.viewOrder(${order.id})">
                        Подробнее
                    </button>
                    ${order.status === 'pending' ? `
                        <button class="btn btn-cancel" onclick="ordersManager.cancelOrder(${order.id})">
                            Отменить заказ
                        </button>
                    ` : ''}
                    ${order.status === 'delivered' ? `
                        <button class="btn btn-primary" onclick="ordersManager.repeatOrder(${order.id})">
                            Повторить заказ
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    getStatusText(status) {
        const statuses = {
            'pending': 'Ожидает подтверждения',
            'confirmed': 'Подтвержден',
            'shipped': 'Отправлен',
            'delivered': 'Доставлен',
            'cancelled': 'Отменен'
        };
        return statuses[status] || status;
    }

    viewOrder(orderId) {
        // В реальном приложении здесь открывалась бы страница деталей заказа
        alert(`Просмотр заказа #${orderId}\nВ полной версии здесь открывалась бы страница с деталями заказа.`);
    }

    async cancelOrder(orderId) {
        if (!confirm('Вы уверены, что хотите отменить заказ?')) return;

        try {
            const response = await fetch(`/api/orders/${orderId}/cancel`, {
                method: 'POST',
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                this.showMessage('Заказ успешно отменен', 'success');
                await this.loadOrders(); // Перезагружаем список заказов
            } else {
                throw new Error('Ошибка отмены заказа');
            }
        } catch (error) {
            this.showMessage('Не удалось отменить заказ', 'error');
        }
    }

    repeatOrder(orderId) {
        // В реальном приложении здесь товары из заказа добавлялись бы в корзину
        this.showMessage('Товары из заказа добавлены в корзину', 'success');
    }

    updateUserInfo() {
        // Загружаем информацию о пользователе
        this.loadUserProfile();
    }

    async loadUserProfile() {
        try {
            const response = await fetch('/api/users/profile', {
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                this.updateUserDisplay(data.user);
            }
        } catch (error) {
            console.error('Ошибка загрузки профиля:', error);
        }
    }

    updateUserDisplay(user) {
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');

        if (userName) userName.textContent = `${user.first_name} ${user.last_name}`;
        if (userEmail) userEmail.textContent = user.email;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `orders-message orders-message-${type}`;
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
    new OrdersManager();
});