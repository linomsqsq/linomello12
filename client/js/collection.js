class CollectionPage {
    constructor() {
        this.collectionId = this.getCollectionId();
        this.collection = null;
        this.products = [];
        this.init();
    }

    getCollectionId() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    async init() {
        if (!this.collectionId) {
            this.showNotFound();
            return;
        }

        await this.loadCollection();
        await this.loadCollectionProducts();
    }

    async loadCollection() {
        try {
            const response = await fetch(`/api/collections/${this.collectionId}`);
            if (!response.ok) {
                this.showNotFound();
                return;
            }

            const data = await response.json();
            this.collection = data.collection;
            this.renderCollectionInfo();
        } catch (error) {
            console.error('Ошибка загрузки коллекции:', error);
            this.showNotFound();
        }
    }

    async loadCollectionProducts() {
        try {
            const response = await fetch(`/api/products?collection=${this.collectionId}`);
            const data = await response.json();
            this.products = data.products || [];
            this.renderProducts();
            this.updateProductCount();
        } catch (error) {
            console.error('Ошибка загрузки товаров коллекции:', error);
            this.renderProducts();
            this.updateProductCount();
        }
    }

    renderCollectionInfo() {
        const title = document.getElementById('collectionTitle');
        const titleLarge = document.getElementById('collectionTitleLarge');
        const description = document.getElementById('collectionDescription');
        const subtitle = document.getElementById('collectionSubtitle');
        const image = document.getElementById('collectionImage');

        if (title) title.textContent = this.collection.name;
        if (titleLarge) titleLarge.textContent = this.collection.name;
        if (description) description.textContent = this.collection.description || 'Уникальная подборка мебели под ваш интерьер.';
        if (subtitle) subtitle.textContent = this.collection.description || 'Премиальная мебель для стильных интерьеров.';

        if (image) {
            if (this.collection.image_url) {
                image.style.backgroundImage = `url('${this.collection.image_url}')`;
            } else {
                image.innerHTML = `<div class="collection-detail-icon">${this.getCollectionIcon(this.collection.name)}</div>`;
            }
        }
    }

    renderProducts() {
        const grid = document.getElementById('collectionProductsGrid');
        if (!grid) return;

        if (!this.products.length) {
            grid.innerHTML = '<p class="no-products">В этой коллекции пока нет товаров</p>';
            return;
        }

        grid.innerHTML = this.products.map(product => {
            const discount = product.old_price ? Math.round((1 - product.price / product.old_price) * 100) : 0;
            return `
                <div class="product-card-modern">
                    <div class="product-image-modern">
                        <img src="${product.image_url || `https://via.placeholder.com/480x320?text=${encodeURIComponent(product.name)}`}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.parentElement.innerHTML='🛋️'" />
                    </div>
                    <div class="product-content-modern">
                        ${discount > 0 ? `<span class="product-badge">-${discount}%</span>` : ''}
                        <h3 class="product-title-modern">${product.name}</h3>
                        <p class="product-description">${product.description || product.material || 'Премиальная мебель'}</p>
                        <div class="product-price-modern">
                            <span class="current-price-modern">${this.formatPrice(product.price)} ₽</span>
                            ${product.old_price ? `<span class="old-price-modern">${this.formatPrice(product.old_price)} ₽</span>` : ''}
                        </div>
                        <button class="btn btn-primary" onclick="collectionPage.viewProduct(${product.id})">
                            Подробнее
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateProductCount() {
        const countElement = document.getElementById('collectionCount');
        if (!countElement) return;
        const count = this.products.length;
        countElement.textContent = `${count} ${this.getWordForm(count, ['товар', 'товара', 'товаров'])}`;
    }

    showNotFound() {
        const title = document.getElementById('collectionTitle');
        const container = document.querySelector('.collection-detail-page .container');
        if (title) title.textContent = 'Коллекция не найдена';
        if (container) container.innerHTML = '<p class="no-products">Коллекция не найдена или была удалена.</p>';
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

    viewProduct(productId) {
        window.location.href = `product.html?id=${productId}`;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price);
    }

    getWordForm(number, words) {
        const cases = [2, 0, 1, 1, 1, 2];
        return words[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
    }
}

const collectionPage = new CollectionPage();
