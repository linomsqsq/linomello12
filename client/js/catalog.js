class CatalogManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.filters = {
            categories: [],
            collections: [],
            materials: [],
            minPrice: 0,
            maxPrice: 1000000
        };
        this.currentPage = 1;
        this.pageSize = 8;
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.setupEventListeners();
        this.applyInitialSearch();
        this.displayProducts();
        this.renderPagination();
    }

    applyInitialSearch() {
        const params = new URLSearchParams(window.location.search);
        const searchTerm = params.get('search')?.trim();
        if (searchTerm) {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = searchTerm;
            }
            this.handleSearch();
        }
    }

    async loadProducts() {
        try {
            const response = await fetch('/api/products');
            const data = await response.json();
            this.products = Array.isArray(data.products) ? data.products : [];
            this.filteredProducts = [...this.products];
            this.updateProductsCount();
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
            // Демо-данные для тестирования
            this.products = this.getDemoProducts();
            this.filteredProducts = [...this.products];
            this.updateProductsCount();
        }
    }

    getDemoProducts() {
        return [
            {
                id: 1,
                name: 'Диван "Милан"',
                price: 245000,
                old_price: 289000,
                category_name: 'Диваны',
                collection_name: 'Милан',
                material: 'Натуральная кожа, Массив ореха',
                image_url: '/images/products/milan-sofa.jpg',
                is_featured: true
            },
            {
                id: 2,
                name: 'Кресло "Флоренция"',
                price: 89000,
                old_price: 99000,
                category_name: 'Кресла',
                collection_name: 'Флоренция',
                material: 'Шелк, Массив вишни',
                image_url: '/images/products/florence-armchair.jpg',
                is_featured: true
            },
            {
                id: 3,
                name: 'Обеденный стол "Венеция"',
                price: 420000,
                old_price: 450000,
                category_name: 'Столы',
                collection_name: 'Венеция',
                material: 'Мрамор, Бронза',
                image_url: '/images/products/venice-table.jpg',
                is_featured: true
            },
            {
                id: 4,
                name: 'Стул "Неаполь"',
                price: 45000,
                old_price: 52000,
                category_name: 'Стулья',
                collection_name: 'Неаполь',
                material: 'Гобелен, Массив дуба',
                image_url: '/images/products/naples-chair.jpg',
                is_featured: true
            },
            {
                id: 5,
                name: 'Кровать "Милан"',
                price: 320000,
                old_price: 350000,
                category_name: 'Кровати',
                collection_name: 'Милан',
                material: 'Бархат, Массив ореха',
                image_url: '/images/products/milan-bed.jpg',
                is_featured: true
            },
            {
                id: 6,
                name: 'Гардероб "Флоренция"',
                price: 280000,
                old_price: 310000,
                category_name: 'Шкафы',
                collection_name: 'Флоренция',
                material: 'Шпон ореха, Зеркало',
                image_url: '/images/products/florence-wardrobe.jpg',
                is_featured: true
            }
        ];
    }

    setupEventListeners() {
        // Фильтры по категориям
        document.querySelectorAll('input[name="category"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.handleFilterChange());
        });

        // Фильтры по коллекциям
        document.querySelectorAll('input[name="collection"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.handleFilterChange());
        });

        // Фильтры по материалам
        document.querySelectorAll('input[name="material"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.handleFilterChange());
        });

        // Фильтр по цене
        document.getElementById('minPrice').addEventListener('input', () => this.handleFilterChange());
        document.getElementById('maxPrice').addEventListener('input', () => this.handleFilterChange());

        // Поиск
        document.getElementById('searchInput').addEventListener('input', () => this.handleSearch());

        // Сортировка
        document.getElementById('sortSelect').addEventListener('change', () => this.handleSort());

        // Кнопки фильтров
        document.querySelector('.apply-filters').addEventListener('click', () => this.applyFilters());
        document.querySelector('.reset-filters').addEventListener('click', () => this.resetFilters());
    }

    handleFilterChange() {
        this.updateFilters();
        this.applyFilters();
    }

    updateFilters() {
        this.filters.categories = Array.from(document.querySelectorAll('input[name="category"]:checked'))
            .map(cb => cb.value);
        
        this.filters.collections = Array.from(document.querySelectorAll('input[name="collection"]:checked'))
            .map(cb => cb.value);
        
        this.filters.materials = Array.from(document.querySelectorAll('input[name="material"]:checked'))
            .map(cb => cb.value);
        
        this.filters.minPrice = parseInt(document.getElementById('minPrice').value) || 0;
        this.filters.maxPrice = parseInt(document.getElementById('maxPrice').value) || 1000000;
    }

    applyFilters() {
        this.currentPage = 1;
        this.filteredProducts = this.products.filter(product => {
            // Фильтр по категориям
            if (this.filters.categories.length > 0 && !this.filters.categories.includes(product.category_name)) {
                return false;
            }

            // Фильтр по коллекциям
            if (this.filters.collections.length > 0 && !this.filters.collections.includes(product.collection_name)) {
                return false;
            }

            // Фильтр по материалам
            if (this.filters.materials.length > 0) {
                const productMaterials = (product.material || '').split(', ');
                const hasMaterial = this.filters.materials.some(material => 
                    productMaterials.some(pm => pm.includes(material))
                );
                if (!hasMaterial) return false;
            }

            // Фильтр по цене
            if (product.price < this.filters.minPrice || product.price > this.filters.maxPrice) {
                return false;
            }

            return true;
        });

        this.handleSort();
        this.displayProducts();
        this.renderPagination();
        this.updateProductsCount();
    }

    handleSearch() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        this.currentPage = 1;

        if (searchTerm === '') {
            this.applyFilters();
            return;
        }

        this.filteredProducts = this.products.filter(product =>
            (product.name || '').toLowerCase().includes(searchTerm) ||
            (product.description || '').toLowerCase().includes(searchTerm) ||
            (product.material || '').toLowerCase().includes(searchTerm)
        );

        this.handleSort();
        this.displayProducts();
        this.renderPagination();
        this.updateProductsCount();
    }

    handleSort() {
        const sortValue = document.getElementById('sortSelect').value;

        switch (sortValue) {
            case 'price_asc':
                this.filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price_desc':
                this.filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'name':
                this.filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'newest':
            default:
                // Уже отсортировано по новизне
                break;
        }

        this.displayProducts();
    }

    resetFilters() {
        // Сбросить все чекбоксы
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });

        // Сбросить цену
        document.getElementById('minPrice').value = '';
        document.getElementById('maxPrice').value = '';

        // Сбросить поиск
        document.getElementById('searchInput').value = '';

        // Сбросить сортировку
        document.getElementById('sortSelect').value = 'newest';

        // Применить сброс
        this.filteredProducts = [...this.products];
        this.currentPage = 1;
        this.handleSort();
        this.displayProducts();
        this.renderPagination();
        this.updateProductsCount();
    }

    displayProducts() {
        const grid = document.getElementById('catalogProducts');
        
        if (this.filteredProducts.length === 0) {
            grid.innerHTML = `
                <div class="no-products">
                    <h3>Товары не найдены</h3>
                    <p>Попробуйте изменить параметры фильтрации</p>
                    <button class="btn btn-primary" onclick="catalogManager.resetFilters()">Сбросить фильтры</button>
                </div>
            `;
            return;
        }

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const pageItems = this.filteredProducts.slice(startIndex, startIndex + this.pageSize);

        grid.innerHTML = pageItems.map(product => `
            <div class="product-card">
                <div class="product-image">
                    <img src="${this.getProductImageUrl(product)}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/480x320?text=Linomello'" />
                </div>
                <div class="product-content">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-category">${product.category_name} • ${product.collection_name}</p>
                    <p class="product-material">${product.material || ''}</p>
                    <div class="product-price">
                        <span class="current-price">${this.formatPrice(product.price)} ₽</span>
                        ${product.old_price ? `<span class="old-price">${this.formatPrice(product.old_price)} ₽</span>` : ''}
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-primary" onclick="window.catalogManager.viewProduct(${product.id})">
                            Подробнее
                        </button>
                        <button class="btn btn-secondary" onclick="addToCart(${product.id})">
                            В корзину
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        this.renderPagination();
    }

    renderPagination() {
        const paginationContainer = document.querySelector('.pagination');
        const pagesWrapper = document.querySelector('.pagination-pages');
        const prevBtn = document.querySelector('.pagination-btn.prev');
        const nextBtn = document.querySelector('.pagination-btn.next');

        if (!paginationContainer || !pagesWrapper || !prevBtn || !nextBtn) return;

        const totalPages = Math.max(1, Math.ceil(this.filteredProducts.length / this.pageSize));
        pagesWrapper.innerHTML = '';

        for (let page = 1; page <= totalPages; page += 1) {
            const button = document.createElement('button');
            button.className = `pagination-page${page === this.currentPage ? ' active' : ''}`;
            button.textContent = page;
            button.addEventListener('click', () => {
                this.currentPage = page;
                this.displayProducts();
                this.updatePaginationButtons();
            });
            pagesWrapper.appendChild(button);
        }

        this.updatePaginationButtons();
    }

    updatePaginationButtons() {
        const totalPages = Math.max(1, Math.ceil(this.filteredProducts.length / this.pageSize));
        const prevBtn = document.querySelector('.pagination-btn.prev');
        const nextBtn = document.querySelector('.pagination-btn.next');

        if (!prevBtn || !nextBtn) return;

        prevBtn.disabled = this.currentPage <= 1;
        nextBtn.disabled = this.currentPage >= totalPages;

        prevBtn.onclick = () => {
            if (this.currentPage > 1) {
                this.currentPage -= 1;
                this.displayProducts();
            }
        };

        nextBtn.onclick = () => {
            if (this.currentPage < totalPages) {
                this.currentPage += 1;
                this.displayProducts();
            }
        };
    }

    getProductImageUrl(product) {
        if (product.image_url) {
            return product.image_url;
        }
        return `https://via.placeholder.com/480x320?text=${encodeURIComponent(product.name)}`;
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

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price);
    }

    updateProductsCount() {
        const countElement = document.getElementById('productsCount');
        if (countElement) {
            countElement.textContent = this.filteredProducts.length;
        }
    }

    viewProduct(productId) {
        window.location.href = `product.html?id=${productId}`;
    }

    addToCart(productId) {
        if (typeof cartManager !== 'undefined') {
            cartManager.addToCart(productId);
        } else {
            console.error('Cart manager не инициализирован');
            alert('Ошибка при добавлении товара в корзину');
        }
    }
}

// Инициализация каталога
window.catalogManager = new CatalogManager();