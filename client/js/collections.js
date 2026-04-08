class CollectionsManager {
    constructor() {
        this.collections = [];
        this.init();
    }

    async init() {
        await this.loadCollections();
        this.setupEventListeners();
    }

    async loadCollections() {
        try {
            const response = await fetch('/api/collections');
            const data = await response.json();
            this.collections = data.collections || [];
            this.displayCollections();
        } catch (error) {
            console.error('Ошибка загрузки коллекций:', error);
            this.showDemoCollections();
        }
    }

    displayCollections() {
        const grid = document.getElementById('collectionsGrid');
        if (!grid) return;

        if (this.collections.length === 0) {
            this.showDemoCollections();
            return;
        }

        grid.innerHTML = this.collections.map(collection => {
            const imageStyle = collection.image_url ? `background-image: url('${collection.image_url}');` : '';
            return `
            <div class="collection-card-full">
                <a href="collection.html?id=${collection.id}" class="collection-image-large" style="${imageStyle}">
                    ${collection.image_url ? '' : `<div class="collection-icon">${this.getCollectionIcon(collection.name)}</div>`}
                </a>
                <div class="collection-info">
                    <h2>${collection.name}</h2>
                    <p>${collection.description || 'Эксклюзивная коллекция мебели ручной работы'}</p>
                    <div class="collection-meta">
                        <span class="collection-items" id="items-${collection.id}">
                            Загрузка...
                        </span>
                    </div>
                    <button class="btn btn-primary" onclick="window.location.href='collection.html?id=${collection.id}'">
                        Подробнее о коллекции
                    </button>
                </div>
            </div>
        `;
        }).join('');

        this.collections.forEach(collection => {
            this.loadCollectionItemsCount(collection.id);
        });
    }

    showDemoCollections() {
        const demoCollections = [
            { id: 1, name: 'Милан', description: 'Современная классика с итальянским шиком' },
            { id: 2, name: 'Флоренция', description: 'Элегантность и утонченность в каждой детали' },
            { id: 3, name: 'Венеция', description: 'Роскошь барокко в современном прочтении' },
            { id: 4, name: 'Неаполь', description: 'Средиземноморский шарм и южный темперамент' }
        ];

        const grid = document.getElementById('collectionsGrid');
        grid.innerHTML = demoCollections.map(collection => `
            <div class="collection-card-full">
                <a href="collection.html?id=${collection.id}" class="collection-image-large">
                    <div class="collection-icon">${this.getCollectionIcon(collection.name)}</div>
                </a>
                <div class="collection-info">
                    <h2>${collection.name}</h2>
                    <p>${collection.description}</p>
                    <div class="collection-meta">
                        <span class="collection-items">12 предметов</span>
                    </div>
                    <button class="btn btn-primary" onclick="window.location.href='collection.html?id=${collection.id}'">
                        Подробнее о коллекции
                    </button>
                </div>
            </div>
        `).join('');
    }

    async loadCollectionItemsCount(collectionId) {
        try {
            const response = await fetch(`/api/products?collection=${collectionId}`);
            const data = await response.json();
            const count = data.products?.length || 0;
            
            const itemsSpan = document.getElementById(`items-${collectionId}`);
            if (itemsSpan) {
                itemsSpan.textContent = `${count} ${this.getWordForm(count, ['предмет', 'предмета', 'предметов'])}`;
            }
        } catch (error) {
            console.error('Ошибка загрузки количества товаров:', error);
        }
    }

    async showCollection(collectionId) {
        try {
            // Загружаем информацию о коллекции
            const collection = this.collections.find(c => c.id === collectionId) || 
                              { id: collectionId, name: 'Коллекция', description: '' };

            // Загружаем товары коллекции
            const response = await fetch(`/api/products?collection=${collectionId}`);
            const data = await response.json();
            const products = data.products || [];

            this.displayCollectionModal(collection, products);
        } catch (error) {
            console.error('Ошибка загрузки коллекции:', error);
            this.showDemoCollectionDetail(collectionId);
        }
    }

    displayCollectionModal(collection, products) {
        const modal = document.getElementById('collectionModal');
        const detailContainer = document.getElementById('collectionDetail');

        const productsHtml = products.map(product => `
            <div class="collection-product-card" onclick="window.location.href='product.html?id=${product.id}'">
                <div class="product-image-small">
                    <img src="${product.image_url || `https://via.placeholder.com/160x120?text=${encodeURIComponent(product.name)}`}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/160x120?text=Linomello'" />
                </div>
                <div class="product-info-small">
                    <h4>${product.name}</h4>
                    <p>${product.material || 'Премиальные материалы'}</p>
                    <div class="product-price-small">
                        <span class="current-price">${this.formatPrice(product.price)} ₽</span>
                        ${product.old_price ? `<span class="old-price">${this.formatPrice(product.old_price)} ₽</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('') || '<p class="no-products">В этой коллекции пока нет товаров</p>';

        detailContainer.innerHTML = `
            <div class="collection-detail">
                <div class="collection-detail-header">
                    <div class="collection-detail-icon">${this.getCollectionIcon(collection.name)}</div>
                    <h2>Коллекция "${collection.name}"</h2>
                    <p class="collection-detail-description">${collection.description || 'Эксклюзивная коллекция мебели ручной работы'}</p>
                </div>
                
                <div class="collection-products">
                    <h3>Товары в коллекции (${products.length})</h3>
                    <div class="collection-products-grid">
                        ${productsHtml}
                    </div>
                </div>

                <div class="collection-actions">
                    <button class="btn btn-primary" onclick="window.location.href='catalog.html?collection=${collection.id}'">
                        Смотреть все товары коллекции
                    </button>
                    <button class="btn btn-secondary" onclick="collectionsManager.closeModal()">
                        Закрыть
                    </button>
                </div>
            </div>
        `;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    showDemoCollectionDetail(collectionId) {
        const collections = {
            1: { name: 'Милан', description: 'Современная классика с итальянским шиком' },
            2: { name: 'Флоренция', description: 'Элегантность и утонченность в каждой детали' },
            3: { name: 'Венеция', description: 'Роскошь барокко в современном прочтении' },
            4: { name: 'Неаполь', description: 'Средиземноморский шарм и южный темперамент' }
        };

        const collection = collections[collectionId] || { name: 'Коллекция', description: '' };
        
        const demoProducts = [
            { id: 1, name: 'Диван "Милан"', price: 245000, category_name: 'Диваны', material: 'Натуральная кожа, Массив ореха', image_url: 'https://via.placeholder.com/160x120?text=Милан' },
            { id: 2, name: 'Кресло "Флоренция"', price: 89000, category_name: 'Кресла', material: 'Шелк, Массив вишни', image_url: 'https://via.placeholder.com/160x120?text=Флоренция' },
            { id: 3, name: 'Стол "Венеция"', price: 420000, category_name: 'Столы', material: 'Мрамор, Бронза', image_url: 'https://via.placeholder.com/160x120?text=Венеция' }
        ];

        this.displayCollectionModal(collection, demoProducts);
    }

    closeModal() {
        const modal = document.getElementById('collectionModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
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

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price);
    }

    getWordForm(number, words) {
        const cases = [2, 0, 1, 1, 1, 2];
        return words[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
    }

    setupEventListeners() {
        // Закрытие модального окна по клику на overlay
        const modal = document.getElementById('collectionModal');
        const overlay = document.querySelector('.modal-overlay');
        
        if (overlay) {
            overlay.addEventListener('click', () => this.closeModal());
        }

        // Закрытие по ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                this.closeModal();
            }
        });
    }
}

// Инициализация
const collectionsManager = new CollectionsManager();