class CartManager {
    constructor() {
        this.cart = this.loadCart();
        this.init();
    }

    init() {
        // Только инициализируем элементы, которые существуют на странице
        const cartItemsContainer = document.getElementById('cartItems');
        if (cartItemsContainer) {
            this.displayCartItems();
        }
        
        this.setupEventListeners();
        
        const cartSummary = document.getElementById('cartSummary');
        if (cartSummary) {
            this.updateCartSummary();
        }
        
        this.updateCartCount();
    }

    loadCart() {
        // Загрузка корзины из localStorage
        const savedCart = localStorage.getItem('luxury_cart');
        if (savedCart) {
            try {
                return JSON.parse(savedCart) || [];
            } catch (error) {
                console.warn('Неверный формат корзины в localStorage, создаю пустую корзину:', error);
            }
        }

        return [];
    }

    saveCart() {
        localStorage.setItem('luxury_cart', JSON.stringify(this.cart));
        this.updateCartCount();
    }

    setupEventListeners() {
        // Обработчик оформления заказа (только если на странице cart.html)
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.handleCheckout());
        }

        // Обработчики способов доставки (только если на странице cart.html)
        const deliveryOptions = document.querySelectorAll('input[name="delivery"]');
        if (deliveryOptions.length > 0) {
            deliveryOptions.forEach(option => {
                option.addEventListener('change', () => this.updateDeliveryOption());
            });
        }

        // Обработчики способов оплаты (только если на странице cart.html)
        const paymentOptions = document.querySelectorAll('input[name="payment"]');
        if (paymentOptions.length > 0) {
            paymentOptions.forEach(option => {
                option.addEventListener('change', () => this.updatePaymentMethod());
            });
        }
    }

    displayCartItems() {
        const cartItemsContainer = document.getElementById('cartItems');
        const cartEmpty = document.getElementById('cartEmpty');

        if (this.cart.length === 0) {
            cartItemsContainer.innerHTML = '';
            cartEmpty.style.display = 'block';
            return;
        }

        cartEmpty.style.display = 'none';
        
        cartItemsContainer.innerHTML = this.cart.map(item => `
            <div class="cart-item" data-item-id="${item.id}">
                <div class="cart-item-product">
                    <div class="cart-item-image">
                        ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/120x120?text=Linomello'" />` : (item.image || '<div class="cart-image-placeholder">🛋️</div>')}
                    </div>
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p class="item-material">${item.material || 'Премиальные материалы'}</p>
                        ${item.oldPrice ? `<span class="item-old-price">${this.formatPrice(item.oldPrice)} ₽</span>` : ''}
                    </div>
                </div>
                <div class="cart-item-price">
                    <span class="price-label">Цена</span>
                    <span class="price-value">${this.formatPrice(item.price)} ₽</span>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn minus" onclick="cartManager.updateQuantity(${item.id}, -1)">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6H10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                    </button>
                    <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="10" 
                           onchange="cartManager.setQuantity(${item.id}, this.value)">
                    <button class="quantity-btn plus" onclick="cartManager.updateQuantity(${item.id}, 1)">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2V10M2 6H10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                    </button>
                </div>
                <div class="cart-item-total">
                    <span class="total-label">Итого</span>
                    <span class="total-value">${this.formatPrice(Math.round(item.price * item.quantity * 100) / 100)} ₽</span>
                </div>
                <button class="cart-item-remove" onclick="cartManager.removeItem(${item.id})" title="Удалить">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                </button>
            </div>
        `).join('');
    }

    updateQuantity(itemId, change) {
        const item = this.cart.find(item => item.id === itemId || item.productId === itemId);
        if (item) {
            const newQuantity = item.quantity + change;
            if (newQuantity >= 1 && newQuantity <= 10) {
                item.quantity = newQuantity;
                this.saveCart();
                
                const cartItemsContainer = document.getElementById('cartItems');
                if (cartItemsContainer) {
                    this.displayCartItems();
                }
                
                this.updateCartSummary();
            }
        }
    }

    setQuantity(itemId, quantity) {
        const item = this.cart.find(item => item.id === itemId || item.productId === itemId);
        if (item) {
            const newQuantity = parseInt(quantity);
            if (newQuantity >= 1 && newQuantity <= 10) {
                item.quantity = newQuantity;
                this.saveCart();
                
                const cartItemsContainer = document.getElementById('cartItems');
                if (cartItemsContainer) {
                    this.displayCartItems();
                }
                
                this.updateCartSummary();
            } else {
                // Восстанавливаем предыдущее значение
                const cartItemsContainer = document.getElementById('cartItems');
                if (cartItemsContainer) {
                    this.displayCartItems();
                }
            }
        }
    }

    removeItem(itemId) {
        if (confirm('Удалить товар из корзины?')) {
            this.cart = this.cart.filter(item => item.id !== itemId && item.productId !== itemId);
            this.saveCart();
            
            const cartItemsContainer = document.getElementById('cartItems');
            if (cartItemsContainer) {
                this.displayCartItems();
            }
            
            this.updateCartSummary();
        }
    }

    updateCartSummary() {
        // Используем Math.round для точных вычислений
        const subtotal = Math.round(this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 100) / 100;
        const totalSavings = Math.round(this.cart.reduce((sum, item) => {
            if (item.oldPrice) {
                return sum + ((item.oldPrice - item.price) * item.quantity);
            }
            return sum;
        }, 0) * 100) / 100;
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);

        const deliveryOption = document.querySelector('input[name="delivery"]:checked');
        const deliveryCost = deliveryOption ? (parseInt(deliveryOption.dataset.cost || '0', 10) || 0) : 0;
        const deliveryText = deliveryCost === 0 ? 'Бесплатно' : `${this.formatPrice(deliveryCost)} ₽`;
        const total = Math.round((subtotal + deliveryCost) * 100) / 100;

        const totalElement = document.querySelector('.summary-total-amount');
        if (totalElement) {
            totalElement.textContent = `${this.formatPrice(total)} ₽`;
        }

        const deliveryCostElement = document.querySelector('.summary-delivery-cost');
        if (deliveryCostElement) {
            deliveryCostElement.textContent = deliveryText;
            deliveryCostElement.classList.toggle('free', deliveryCost === 0);
        }

        const savingsElement = document.querySelector('.savings-amount');
        if (savingsElement && totalSavings > 0) {
            savingsElement.textContent = `${this.formatPrice(totalSavings)} ₽`;
            document.querySelector('.summary-savings').style.display = 'flex';
        } else if (savingsElement) {
            document.querySelector('.summary-savings').style.display = 'none';
        }

        const itemsCountElement = document.querySelector('.summary-line span:first-child');
        if (itemsCountElement) {
            itemsCountElement.textContent = `Товары (${totalItems})`;
        }
    }

    updateDeliveryOption() {
        const selectedOption = document.querySelector('input[name="delivery"]:checked');
        if (selectedOption) {
            document.querySelectorAll('.delivery-option').forEach(option => {
                option.classList.remove('selected');
            });
            selectedOption.closest('.delivery-option').classList.add('selected');
            this.updateCartSummary();
        }
    }

    updatePaymentMethod() {
        const selectedOption = document.querySelector('input[name="payment"]:checked');
        if (selectedOption) {
            // Обновляем стили выбранного способа оплаты
            document.querySelectorAll('.payment-option').forEach(option => {
                option.classList.remove('selected');
            });
            selectedOption.closest('.payment-option').classList.add('selected');
        }
    }

    async handleCheckout() {
        if (this.cart.length === 0) {
            alert('Корзина пуста');
            return;
        }

        // Проверяем авторизацию
        if (!authManager.isAuthenticated()) {
            const returnUrl = encodeURIComponent(window.location.href);
            window.location.href = `login.html?return=${returnUrl}`;
            return;
        }

        // Получаем данные из формы, если она есть
        const addressInput = document.getElementById('shippingAddress');
        const shippingAddress = addressInput ? addressInput.value.trim() : '';
        const recipientNameInput = document.getElementById('recipientName');
        const recipientName = recipientNameInput ? recipientNameInput.value.trim() : '';
        const recipientPhoneInput = document.getElementById('recipientPhone');
        const recipientPhone = recipientPhoneInput ? recipientPhoneInput.value.trim() : '';
        const customerNotes = document.getElementById('customerNotes')?.value.trim() || '';
        const delivery = document.querySelector('input[name="delivery"]:checked')?.value || 'Стандартная доставка';
        const payment = document.querySelector('input[name="payment"]:checked')?.value || 'Банковская карта';

        if (addressInput && !shippingAddress) {
            alert('Пожалуйста, укажите адрес доставки');
            return;
        }
        if (recipientNameInput && !recipientName) {
            alert('Пожалуйста, укажите имя получателя');
            return;
        }
        if (recipientPhoneInput && !recipientPhone) {
            alert('Пожалуйста, укажите телефон получателя');
            return;
        }

        try {
            this.showCheckoutLoading(true);
            
            const selectedDeliveryOption = document.querySelector('input[name="delivery"]:checked');
            const shippingCost = selectedDeliveryOption ? (parseInt(selectedDeliveryOption.dataset.cost || '0', 10) || 0) : 0;

            const orderData = {
                items: this.cart.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price
                })),
                shippingAddress: shippingAddress ? `${shippingAddress}${recipientName ? `, Получатель: ${recipientName}` : ''}${recipientPhone ? `, Тел: ${recipientPhone}` : ''}` : '',
                shippingCost: shippingCost,
                deliveryMethod: delivery,
                paymentMethod: payment,
                customerNotes: customerNotes ? customerNotes : ''
            };

            // Отправляем заказ на сервер
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authManager.token}`
                },
                body: JSON.stringify(orderData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Ошибка при оформлении заказа');
            }

            console.log('✅ Заказ успешно оформлен:', data.orderId);
            
            // Очищаем корзину после успешного оформления
            this.cart = [];
            this.saveCart();
            
            this.showCheckoutSuccess(data.orderId);
            
        } catch (error) {
            console.error('Ошибка оформления заказа:', error);
            this.showCheckoutError(error.message || 'Ошибка при оформлении заказа');
        } finally {
            this.showCheckoutLoading(false);
        }
    }

    showCheckoutLoading(show) {
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            if (show) {
                checkoutBtn.innerHTML = '<span class="btn-loading">Оформление...</span>';
                checkoutBtn.disabled = true;
            } else {
                checkoutBtn.innerHTML = 'Оформить заказ';
                checkoutBtn.disabled = false;
            }
        }
    }

    showCheckoutSuccess(orderId) {
        // Показываем модальное окно успеха с номером заказа
        const successModal = this.createSuccessModal(orderId);
        document.body.appendChild(successModal);
    }

    createSuccessModal(orderId) {
        const modal = document.createElement('div');
        modal.className = 'checkout-success-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div class="success-content" style="
                background: white;
                padding: 40px;
                border-radius: 10px;
                text-align: center;
                max-width: 400px;
                width: 90%;
            ">
                <div class="success-icon" style="font-size: 60px; margin-bottom: 20px;">🎉</div>
                <h3 style="margin-bottom: 15px; color: var(--primary-color);">Заказ оформлен!</h3>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 0; font-size: 12px; color: var(--text-light);">Номер заказа</p>
                    <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: var(--primary-color);">#${orderId}</p>
                </div>
                <p style="margin-bottom: 25px; color: var(--text-light);">
                    Ваш заказ успешно оформлен. Менеджер свяжется с вами для подтверждения в ближайшее время.
                </p>
                <div class="success-actions" style="display: flex; gap: 15px; justify-content: center;">
                    <button onclick="cartManager.continueShopping()" class="btn btn-primary">
                        Продолжить покупки
                    </button>
                    <button onclick="cartManager.viewOrders()" class="btn btn-secondary">
                        Мои заказы
                    </button>
                </div>
            </div>
        `;

        return modal;
    }

    continueShopping() {
        this.closeModal();
        window.location.href = 'catalog.html';
    }

    viewOrders() {
        this.closeModal();
        window.location.href = 'orders.html';
    }

    closeModal() {
        const modal = document.querySelector('.checkout-success-modal');
        if (modal) {
            modal.remove();
        }
    }

    showCheckoutError(message) {
        // Создаем модальное окно ошибки
        const errorModal = document.createElement('div');
        errorModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        errorModal.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 10px;
                text-align: center;
                max-width: 400px;
                width: 90%;
            ">
                <div style="font-size: 50px; margin-bottom: 20px;">❌</div>
                <h3 style="margin-bottom: 15px; color: #f44336;">Ошибка</h3>
                <p style="margin-bottom: 25px; color: var(--text-light);">${message}</p>
                <button onclick="this.parentElement.parentElement.remove()" class="btn btn-primary">
                    Закрыть
                </button>
            </div>
        `;

        document.body.appendChild(errorModal);
    }

    updateCartCount() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
        }
    }

    getCartItemImage(item) {
        if (item.image_url) {
            return `<img src="${item.image_url}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/120x120?text=Linomello'" />`;
        }

        return item.image || '<div class="cart-image-placeholder">🛋️</div>';
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price);
    }

    // Методы для работы с API (в реальном приложении)
    async syncWithServer() {
        if (!authManager.isAuthenticated()) return;

        try {
            const response = await fetch('/api/cart', {
                headers: authManager.getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                // Синхронизация корзины с сервером
            }
        } catch (error) {
            console.error('Cart sync error:', error);
        }
    }

    async addToCart(productOrId, quantity = 1) {
        quantity = parseInt(quantity, 10);
        if (isNaN(quantity) || quantity < 1) quantity = 1;
        if (quantity > 10) quantity = 10;

        const product = typeof productOrId === 'object' && productOrId !== null
            ? productOrId
            : await this.getProductInfo(productOrId);

        if (!product) {
            alert('Не удалось добавить товар в корзину. Попробуйте обновить страницу.');
            console.error('Cart add failed: product not found', productOrId);
            return;
        }

        const productId = product.id;
        const existingItem = this.cart.find(item => item.productId === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                id: productId,
                productId: productId,
                name: product.name,
                price: product.price,
                oldPrice: product.old_price,
                quantity: quantity,
                image_url: product.image_url,
                material: product.material
            });
        }

        this.saveCart();
        
        // Обновляем отображение только если есть контейнер с товарами
        const cartItemsContainer = document.getElementById('cartItems');
        if (cartItemsContainer) {
            this.displayCartItems();
        }
        
        this.updateCartSummary();
        this.showAddToCartSuccess(product.name);
    }

    async getProductInfo(productId) {
        // В реальном приложении здесь был бы API запрос
        try {
            const response = await fetch(`/api/products/${productId}`);
            if (response.ok) {
                const data = await response.json();
                return data.product;
            }
        } catch (error) {
            console.error('Error fetching product:', error);
        }
        
        // Демо-данные
        const demoProducts = {
            1: { id: 1, name: 'Диван "Милан"', price: 245000, old_price: 289000, category_name: 'Диваны', material: 'Натуральная кожа, Массив ореха', image_url: 'https://via.placeholder.com/120x120?text=Milan' },
            2: { id: 2, name: 'Кресло "Флоренция"', price: 89000, old_price: 99000, category_name: 'Кресла', material: 'Шелк, Массив вишни', image_url: 'https://via.placeholder.com/120x120?text=Florence' },
            3: { id: 3, name: 'Обеденный стол "Венеция"', price: 420000, old_price: 450000, category_name: 'Столы', material: 'Мрамор, Бронза', image_url: 'https://via.placeholder.com/120x120?text=Venice' }
        };
        
        return demoProducts[productId];
    }

    getProductIcon(category) {
        const icons = {
            'Диваны': '🛋️',
            'Кресла': '🪑',
            'Столы': '📦',
            'Стулья': '💺',
            'Кровати': '🛏️',
            'Шкафы': '🚪'
        };
        return icons[category] || '🛒';
    }

    showAddToCartSuccess(productName) {
        // Показываем уведомление о добавлении в корзину
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--secondary-color);
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 1000;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        `;
        notification.textContent = `${productName} добавлен в корзину`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Глобальный экземпляр менеджера корзины
window.cartManager = window.cartManager || new CartManager();

// Глобальная функция для безопасного добавления в корзину из HTML
window.addToCart = function(productId, quantity = 1) {
    if (window.cartManager) {
        window.cartManager.addToCart(productId, quantity);
    } else {
        console.error('cartManager is not initialized');
    }
};