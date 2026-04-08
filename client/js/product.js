class ProductManager {
    constructor() {
        this.product = null;
        this.init();
    }

    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        if (productId) {
            await this.loadProduct(productId);
            this.setupEventListeners();
        } else {
            this.showError('Товар не найден');
        }
    }

    async loadProduct(productId) {
        try {
            const response = await fetch(`/api/products/${productId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Товар не найден');
            }

            this.product = data.product;
            this.displayProduct();
        } catch (error) {
            console.error('Ошибка загрузки товара:', error);
            this.showDemoProduct();
        }
    }

    displayProduct() {
        if (!this.product) return;

        // Обновляем заголовок страницы
        document.title = `${this.product.name} - Linomello`;

        // Обновляем хлебные крошки
        const breadcrumbs = document.querySelector('.breadcrumbs');
        if (breadcrumbs) {
            breadcrumbs.innerHTML = `
                <a href="index.html">Главная</a>
                <span>/</span>
                <a href="catalog.html">Каталог</a>
                <span>/</span>
                <a href="catalog.html?category=${this.product.category_name}">${this.product.category_name}</a>
                <span>/</span>
                <span>${this.product.name}</span>
            `;
        }

        // Обновляем основную информацию о товаре
        this.updateProductInfo();
        this.renderThumbnails();
        this.setupTabs();
    }

    updateProductInfo() {
        // Основная информация
        const productTitle = document.querySelector('.product-title');
        if (productTitle) productTitle.textContent = this.product.name;

        const productPrice = document.querySelector('.current-price');
        if (productPrice) productPrice.textContent = `${this.formatPrice(this.product.price)} ₽`;

        const oldPrice = document.querySelector('.old-price');
        if (oldPrice && this.product.old_price) {
            oldPrice.textContent = `${this.formatPrice(this.product.old_price)} ₽`;
        } else if (oldPrice) {
            oldPrice.style.display = 'none';
        }

        const discount = document.querySelector('.discount');
        if (discount && this.product.old_price) {
            const discountPercent = Math.round((1 - this.product.price / this.product.old_price) * 100);
            discount.textContent = `-${discountPercent}%`;
        } else if (discount) {
            discount.style.display = 'none';
        }

        const productDescription = document.querySelector('.product-description p');
        if (productDescription) productDescription.textContent = this.product.description;

        const mainImageContainer = document.querySelector('.main-image');
        if (mainImageContainer) {
            mainImageContainer.innerHTML = `<img src="${this.getProductImageUrl()}" alt="${this.product.name}" onerror="this.src='https://via.placeholder.com/800x500?text=Linomello'" />`;
        }

        // Характеристики
        const featuresContainer = document.querySelector('.product-features');
        if (featuresContainer) {
            featuresContainer.innerHTML = `
                <div class="feature">
                    <span class="feature-icon">📏</span>
                    <span class="feature-text">Размеры: ${this.product.dimensions || 'Не указаны'}</span>
                </div>
                <div class="feature">
                    <span class="feature-icon">🌳</span>
                    <span class="feature-text">Материал: ${this.product.material || 'Не указан'}</span>
                </div>
                <div class="feature">
                    <span class="feature-icon">⚡</span>
                    <span class="feature-text">Срок изготовления: 14-21 день</span>
                </div>
                <div class="feature">
                    <span class="feature-icon">🚚</span>
                    <span class="feature-text">Бесплатная доставка по Москве</span>
                </div>
            `;
        }

        // Вкладка с описанием
        const descriptionTab = document.querySelector('#description');
        if (descriptionTab) {
            descriptionTab.innerHTML = `
                <h3>Эксклюзивный ${this.product.category_name?.toLowerCase()} ручной работы</h3>
                <p>${this.product.description}</p>
                
                <h4>Особенности:</h4>
                <ul>
                    <li>Премиальные материалы высшего качества</li>
                    <li>Ручная работа опытных мастеров</li>
                    <li>Индивидуальный подход к каждому клиенту</li>
                    <li>Гарантия 5 лет на все изделия</li>
                    <li>Экологически чистые материалы</li>
                </ul>

                <div class="craftsmanship">
                    <h4>Искусство создания мебели</h4>
                    <p>Каждое изделие создается нашими мастерами вручную, что гарантирует уникальность и долговечность. Мы используем традиционные техники, передаваемые из поколения в поколение, сочетая их с современными технологиями.</p>
                </div>
            `;
        }

        // Вкладка с характеристиками
        const specsTab = document.querySelector('#specifications');
        if (specsTab) {
            specsTab.innerHTML = `
                <div class="specs-table">
                    <div class="spec-row">
                        <div class="spec-name">Габариты</div>
                        <div class="spec-value">${this.product.dimensions || 'Не указаны'}</div>
                    </div>
                    <div class="spec-row">
                        <div class="spec-name">Материал</div>
                        <div class="spec-value">${this.product.material || 'Не указан'}</div>
                    </div>
                    <div class="spec-row">
                        <div class="spec-name">Вес</div>
                        <div class="spec-value">${this.product.weight || 'Не указан'}</div>
                    </div>
                    <div class="spec-row">
                        <div class="spec-name">Категория</div>
                        <div class="spec-value">${this.product.category_name}</div>
                    </div>
                    <div class="spec-row">
                        <div class="spec-name">Коллекция</div>
                        <div class="spec-value">${this.product.collection_name}</div>
                    </div>
                    <div class="spec-row">
                        <div class="spec-name">Страна производства</div>
                        <div class="spec-value">Россия</div>
                    </div>
                    <div class="spec-row">
                        <div class="spec-name">Гарантия</div>
                        <div class="spec-value">5 лет</div>
                    </div>
                </div>
            `;
        }
    }

    setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                
                // Убираем активный класс у всех кнопок и вкладок
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanes.forEach(p => p.classList.remove('active'));
                
                // Добавляем активный класс текущей кнопке и вкладке
                btn.classList.add('active');
                document.getElementById(tabId).classList.add('active');
            });
        });
    }

    setupEventListeners() {
        // Управление количеством
        const minusBtn = document.querySelector('.quantity-btn.minus');
        const plusBtn = document.querySelector('.quantity-btn.plus');
        const quantityInput = document.querySelector('.quantity-input');

        if (minusBtn && plusBtn && quantityInput) {
            minusBtn.addEventListener('click', () => {
                const currentValue = parseInt(quantityInput.value);
                if (currentValue > 1) {
                    quantityInput.value = currentValue - 1;
                }
            });

            plusBtn.addEventListener('click', () => {
                const currentValue = parseInt(quantityInput.value);
                if (currentValue < 10) {
                    quantityInput.value = currentValue + 1;
                }
            });

            quantityInput.addEventListener('change', () => {
                let value = parseInt(quantityInput.value);
                if (isNaN(value) || value < 1) value = 1;
                if (value > 10) value = 10;
                quantityInput.value = value;
            });
        }

        // Добавление в корзину
        const addToCartBtn = document.querySelector('.add-to-cart');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', (event) => {
                event.preventDefault();
                this.addToCart();
            });
        }

        // Добавление в избранное
        const wishlistBtn = document.querySelector('.add-to-wishlist');
        if (wishlistBtn) {
            wishlistBtn.addEventListener('click', (event) => {
                event.preventDefault();
                this.addToWishlist();
            });
        }

        // Галерея изображений
        this.setupImageGallery();
    }

    renderThumbnails() {
        const thumbnails = document.querySelectorAll('.thumbnail');
        if (!thumbnails.length) return;

        thumbnails.forEach((thumb, index) => {
            thumb.innerHTML = `<img src="${this.getProductImageUrl()}" alt="${this.product.name} ${index + 1}" onerror="this.src='https://via.placeholder.com/80x80?text=Linomello'" />`;
        });
    }

    getProductImageUrl() {
        if (this.product && this.product.image_url) {
            return this.product.image_url;
        }
        return `https://via.placeholder.com/800x500?text=${encodeURIComponent(this.product ? this.product.name : 'Linomello')}`;
    }

    setupImageGallery() {
        const thumbnails = document.querySelectorAll('.thumbnail');
        const mainImage = document.querySelector('.main-image img');

        thumbnails.forEach((thumb, index) => {
            thumb.addEventListener('click', () => {
                thumbnails.forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');

                const thumbImage = thumb.querySelector('img');
                if (mainImage && thumbImage) {
                    mainImage.src = thumbImage.src;
                }
            });
        });
    }

    addToCart() {
        if (!this.product) return;

        const quantityInput = document.querySelector('.quantity-input');
        let quantity = quantityInput ? parseInt(quantityInput.value, 10) : 1;
        if (isNaN(quantity) || quantity < 1) quantity = 1;
        if (quantity > 10) quantity = 10;

        if (window.cartManager) {
            window.cartManager.addToCart(this.product, quantity);
        } else {
            alert(`Товар "${this.product.name}" добавлен в корзину!`);
        }
    }

    addToWishlist() {
        if (!this.product) return;

        // В реальном приложении здесь был бы API вызов
        const wishlist = JSON.parse(localStorage.getItem('luxury_wishlist') || '[]');
        const existingItem = wishlist.find(item => item.id === this.product.id);

        if (!existingItem) {
            wishlist.push({
                id: this.product.id,
                name: this.product.name,
                price: this.product.price,
                image: this.getProductIcon()
            });
            localStorage.setItem('luxury_wishlist', JSON.stringify(wishlist));
            this.showMessage('Товар добавлен в избранное!', 'success');
        } else {
            this.showMessage('Товар уже в избранном', 'info');
        }
    }

    getProductIcon() {
        const icons = {
            'Диваны': '🛋️',
            'Кресла': '🪑',
            'Столы': '📦',
            'Стулья': '💺',
            'Кровати': '🛏️',
            'Шкафы': '🚪'
        };
        return icons[this.product.category_name] || '🛒';
    }

    showDemoProduct() {
        this.product = {
            id: 1,
            name: 'Диван "Милан"',
            price: 245000,
            old_price: 289000,
            description: 'Роскошный трехместный диван с ручной стежкой. Изготовлен из натуральной кожи премиум-класса итальянского производства.',
            category_name: 'Диваны',
            collection_name: 'Милан',
            material: 'Натуральная кожа, Массив ореха',
            dimensions: '220×95×85 см',
            weight: '85 кг'
        };
        this.displayProduct();
    }

    showError(message) {
        const productLayout = document.querySelector('.product-layout');
        if (productLayout) {
            productLayout.innerHTML = `
                <div class="error-message">
                    <h2>Товар не найден</h2>
                    <p>${message}</p>
                    <a href="catalog.html" class="btn btn-primary">Вернуться в каталог</a>
                </div>
            `;
        }
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `product-message product-message-${type}`;
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

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new ProductManager();
});