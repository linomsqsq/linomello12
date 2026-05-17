class FurnitureApp {
    constructor() {
        this.categories = [];
        this.products = [];
        this.init();
    }

    async init() {
        await this.checkServerStatus();
        await this.loadCategories();
        await this.loadProducts();
        await this.loadCollectionsSection();
        this.setupGlobalEventListeners();
    }

    async checkServerStatus() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            this.updateStatusIndicator('✅ Сервер онлайн', '#4CAF50');
        } catch (error) {
            this.updateStatusIndicator('❌ Сервер офлайн', '#f44336');
            console.error('Ошибка подключения к серверу:', error);
            this.showDemoData();
        }
    }

    updateStatusIndicator(message, color) {
        const indicator = document.getElementById('statusIndicator');
        if (indicator) {
            indicator.textContent = message;
            indicator.style.background = color;
        }
    }

    async loadCategories() {
        try {
            const response = await fetch('/api/categories');
            const data = await response.json();
            this.categories = data.categories;
            this.displayCategories();
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
        }
    }

    async loadProducts() {
        try {
            const response = await fetch('/api/products?featured=true');
            const data = await response.json();
            this.products = data.products;
            this.displayProducts();
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
        }
    }

    displayCategories() {
        const grid = document.getElementById('categoriesGrid');
        if (!grid) return;

        grid.innerHTML = this.categories.map(category => `
            <div class="category-card" onclick="location.href='catalog.html?category=${category.name}'">
                <div class="category-icon">${this.getCategoryIcon(category.name)}</div>
                <h3>${category.name}</h3>
                <p>${category.description}</p>
            </div>
        `).join('');
    }

    displayProducts() {
        const grid = document.getElementById('featuredProducts');
        if (!grid) return;

        grid.innerHTML = this.products.map(product => {
            const discount = product.old_price ? Math.round((1 - product.price / product.old_price) * 100) : 0;
            return `
                <div class="product-card">
                    <div class="product-image">
                        <img src="${product.image_url || `https://via.placeholder.com/480x320?text=${encodeURIComponent(product.name)}`}" alt="${product.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='🛋️'" />
                        ${discount > 0 ? `<span class="product-badge">-${discount}%</span>` : ''}
                    </div>
                    <div class="product-info">
                        <p class="product-brand">${product.category_name || product.collection_name || 'Премиум мебель'}</p>
                        <h3 class="product-name">${product.name}</h3>
                        <p>${product.description || product.material || 'Премиальная мебель из натуральных материалов'}</p>
                        <div class="product-price-block">
                            <span class="product-price">${this.formatPrice(product.price)} ₽</span>
                            ${product.old_price ? `<span class="product-old-price">${this.formatPrice(product.old_price)} ₽</span>` : ''}
                        </div>
                        <button class="btn-small" onclick="furnitureApp.viewProduct(${product.id})">Подробнее</button>
                    </div>
                </div>
            `;
        }).join('');

        if (this.products.length > 0) {
            this.updateHeroProduct(this.products[0]);
            this.setupHeroSlider();
        }
    }

    setupHeroSlider() {
        const slides = this.products.slice(0, 4).filter(product => product.image_url);
        if (!slides.length) return;

        this.heroSlides = slides;
        this.heroCurrentSlide = 0;

        const sliderDots = document.getElementById('heroSliderDots');
        const sliderImage = document.getElementById('heroSlideImage');
        if (!sliderDots || !sliderImage) return;

        sliderDots.innerHTML = slides.map((slide, index) => `
            <button class="hero-slider-dot ${index === 0 ? 'active' : ''}" data-index="${index}" aria-label="Слайд ${index + 1}"></button>
        `).join('');

        sliderDots.querySelectorAll('.hero-slider-dot').forEach(dot => {
            dot.addEventListener('click', (event) => {
                const index = parseInt(event.currentTarget.dataset.index, 10);
                this.switchHeroSlide(index);
            });
        });

        this.startHeroSliderAuto();
    }

    startHeroSliderAuto() {
        if (this.heroSliderInterval) {
            clearInterval(this.heroSliderInterval);
        }

        this.heroSliderInterval = setInterval(() => {
            const nextIndex = (this.heroCurrentSlide + 1) % this.heroSlides.length;
            this.switchHeroSlide(nextIndex);
        }, 5500);
    }

    switchHeroSlide(index) {
        if (!this.heroSlides || this.heroSlides.length === 0) return;
        this.heroCurrentSlide = index;

        const slide = this.heroSlides[index];
        const slideImage = document.getElementById('heroSlideImage');
        const sliderDots = document.querySelectorAll('.hero-slider-dot');

        if (slideImage) {
            slideImage.src = slide.image_url;
            slideImage.alt = slide.name;
        }

        sliderDots.forEach((dot, dotIndex) => {
            dot.classList.toggle('active', dotIndex === index);
        });
    }

    updateHeroProduct(product) {
        const heroImage = document.getElementById('heroSlideImage');
        if (!heroImage) return;
        heroImage.src = product.image_url || `https://via.placeholder.com/760x640?text=${encodeURIComponent(product.name)}`;
        heroImage.alt = product.name;
    }

    async loadCollectionsSection() {
        try {
            const response = await fetch('/api/collections');
            const data = await response.json();
            this.collections = data.collections || [];
            this.displayCollectionsSection();
        } catch (error) {
            console.error('Ошибка загрузки коллекций:', error);
        }
    }

    displayCollectionsSection() {
        const grid = document.getElementById('homepageCollections');
        if (!grid) return;

        if (!this.collections.length) {
            grid.innerHTML = '<p class="empty-message">Коллекции скоро появятся.</p>';
            return;
        }

        grid.innerHTML = this.collections.slice(0, 3).map(collection => {
            const imageStyle = collection.image_url ? `background-image: url('${collection.image_url}');` : '';
            return `
                <div class="collection-card" onclick="location.href='collection.html?id=${collection.id}'" style="${imageStyle}">
                    <div class="collection-info">
                        <h3>${collection.name}</h3>
                        <p>${collection.description || 'Эксклюзивная мебель из натуральных материалов'}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateHeroProduct(product) {
        const heroImage = document.getElementById('heroProductImage');
        if (!heroImage) return;
        heroImage.src = product.image_url || `https://via.placeholder.com/760x640?text=${encodeURIComponent(product.name)}`;
        heroImage.alt = product.name;
    }

    showDemoData() {
        const demoCategories = [
            { id: 1, name: 'Диваны', description: 'Эксклюзивные диваны ручной работы', icon: '🛋️' },
            { id: 2, name: 'Кресла', description: 'Комфортные кресла для гостиной', icon: '🪑' },
            { id: 3, name: 'Столы', description: 'Обеденные и кофейные столы', icon: '📦' },
            { id: 4, name: 'Стулья', description: 'Элегантные стулья для столовой', icon: '💺' },
            { id: 5, name: 'Кровати', description: 'Роскошные спальные гарнитуры', icon: '🛏️' },
            { id: 6, name: 'Шкафы', description: 'Вместительные системы хранения', icon: '🚪' }
        ];

        const demoProducts = [
            {
                id: 1,
                name: 'Диван "Милан"',
                price: 245000,
                old_price: 289000,
                description: 'Роскошный трехместный диван с ручной стежкой',
                category_name: 'Диваны',
                image_url: 'https://via.placeholder.com/480x320?text=Милан'
            },
            {
                id: 2,
                name: 'Кресло "Флоренция"',
                price: 89000,
                old_price: 99000,
                description: 'Элегантное кресло с резными ножками',
                category_name: 'Кресла',
                image_url: 'https://via.placeholder.com/480x320?text=Флоренция'
            },
            {
                id: 3,
                name: 'Обеденный стол "Венеция"',
                price: 420000,
                old_price: 450000,
                description: 'Массивный стол из цельного куска мрамора',
                category_name: 'Столы',
                image_url: 'https://via.placeholder.com/480x320?text=Венеция'
            }
        ];

        if (document.getElementById('categoriesGrid')) {
            document.getElementById('categoriesGrid').innerHTML = demoCategories.map(cat => `
                <div class="category-card" onclick="location.href='catalog.html?category=${cat.name}'">
                    <div class="category-icon">${cat.icon}</div>
                    <h3>${cat.name}</h3>
                    <p>${cat.description}</p>
                </div>
            `).join('');
        }

        if (document.getElementById('featuredProducts')) {
            document.getElementById('featuredProducts').innerHTML = demoProducts.map(product => {
                const discount = product.old_price ? Math.round((1 - product.price / product.old_price) * 100) : 0;
                return `
                    <div class="product-card">
                        <div class="product-image">
                            <img src="${product.image_url}" alt="${product.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='🛋️'" />
                            ${discount > 0 ? `<span class="product-badge">-${discount}%</span>` : ''}
                        </div>
                        <div class="product-info">
                            <p class="product-brand">${product.category_name || product.collection_name || 'Премиум мебель'}</p>
                            <h3 class="product-name">${product.name}</h3>
                            <p>${product.description}</p>
                            <div class="product-price-block">
                                <span class="product-price">${this.formatPrice(product.price)} ₽</span>
                                ${product.old_price ? `<span class="product-old-price">${this.formatPrice(product.old_price)} ₽</span>` : ''}
                            </div>
                            <button class="btn-small" onclick="furnitureApp.viewProduct(${product.id})">Подробнее</button>
                        </div>
                    </div>
                `;
            }).join('');

            const heroImage = document.getElementById('heroSlideImage');
            if (heroImage && demoProducts.length) {
                heroImage.src = demoProducts[0].image_url;
                heroImage.alt = demoProducts[0].name;
            }
        }
    }

    getCategoryIcon(categoryName) {
        const icons = {
            'Диваны': '🛋️',
            'Кресла': '🪑',
            'Столы': '📦',
            'Стулья': '💺',
            'Кровати': '🛏️',
            'Шкафы': '🚪'
        };
        return icons[categoryName] || '🏷️';
    }

    getCollectionIcon(collectionName) {
        const icons = {
            'Милан': '🏛️',
            'Флоренция': '🎭',
            'Венеция': '⚜️',
            'Неаполь': '🌊',
            'Рим': '🏟️',
            'Тоскана': '🍷'
        };
        return icons[collectionName] || '🎨';
    }

    getProductIcon(categoryName) {
        const icons = {
            'Диваны': '🛋️',
            'Кресла': '🪑',
            'Столы': '📦',
            'Стулья': '💺',
            'Кровати': '🛏️',
            'Шкафы': '🚪'
        };
        return icons[categoryName] || '🛒';
    }

    viewProduct(productId) {
        window.location.href = `product.html?id=${productId}`;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price);
    }

    setupGlobalEventListeners() {
        // Глобальный поиск
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.handleSearch());
        }

        // Обработчики для кнопок "В корзину"
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart')) {
                const productId = e.target.dataset.productId;
                if (productId) {
                    this.addToCart(parseInt(productId));
                }
            }
        });
    }

    handleSearch() {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `catalog.html?search=${encodeURIComponent(query)}`;
            }
        } else {
            // Создаем поле поиска если его нет
            this.createSearchInput();
        }
    }

    createSearchInput() {
        const searchContainer = document.querySelector('.header-actions');
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Поиск товаров...';
        searchInput.className = 'search-input';
        searchInput.style.cssText = `
            padding: 8px 12px;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            margin-right: 10px;
            min-width: 180px;
        `;

        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.handleSearch();
            }
        });
        
        searchContainer.insertBefore(searchInput, searchContainer.firstChild);
        searchInput.focus();
    }

    async addToCart(productId) {
        try {
            if (typeof cartManager !== 'undefined') {
                await cartManager.addToCart(productId);
            } else {
                // Базовое добавление в корзину
                const cart = JSON.parse(localStorage.getItem('luxury_cart') || '[]');
                const existingItem = cart.find(item => item.productId === productId);
                
                if (existingItem) {
                    existingItem.quantity += 1;
                } else {
                    cart.push({
                        id: Date.now(),
                        productId: productId,
                        quantity: 1
                    });
                }
                
                localStorage.setItem('luxury_cart', JSON.stringify(cart));
                this.showNotification('Товар добавлен в корзину!', 'success');
                
                // Обновляем счетчик корзины
                if (typeof authManager !== 'undefined') {
                    authManager.updateNavigation();
                }
            }
        } catch (error) {
            this.showNotification('Ошибка при добавлении в корзину', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `global-notification global-notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            color: white;
            font-weight: 500;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        `;

        if (type === 'success') {
            notification.style.background = '#00c851';
        } else if (type === 'error') {
            notification.style.background = '#ff4444';
        } else {
            notification.style.background = '#33b5e5';
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Инициализация приложения
const furnitureApp = new FurnitureApp();