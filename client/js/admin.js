class AdminManager {
    constructor() {
        this.currentSection = 'dashboard';
        this.editingId = null;
        this.editingType = null;
        this.init();
    }

    async init() {
        // Проверяем права администратора
        if (!authManager.isAdmin()) {
            window.location.href = 'admin-login.html';
            return;
        }

        this.setupNavigation();
        await this.loadDashboard();
        this.setupEventListeners();
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.admin-nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.showSection(section);
                
                // Обновляем активный элемент навигации
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    showSection(section) {
        this.currentSection = section;
        
        // Скрываем все секции
        document.querySelectorAll('.admin-section').forEach(sec => {
            sec.classList.remove('active');
        });
        
        // Показываем выбранную секцию или создаем её
        let sectionEl = document.getElementById(section);
        if (!sectionEl) {
            this.createDynamicSection(section);
            sectionEl = document.getElementById(section);
        }
        
        if (sectionEl) {
            sectionEl.classList.add('active');
        }

        // Загружаем данные для секции
        switch(section) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'orders':
                this.loadOrders();
                break;
            case 'products':
                this.loadProducts();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'categories':
                this.loadCategories();
                break;
            case 'collections':
                this.loadCollections();
                break;
        }
    }

    createDynamicSection(section) {
        const mainContent = document.querySelector('.admin-content');
        if (!mainContent) return;

        let html = '';
        if (section === 'categories') {
            html = `
                <section id="categories" class="admin-section">
                    <div class="section-header">
                        <h1>Управление категориями</h1>
                        <div class="section-actions">
                            <button class="btn btn-primary" onclick="adminManager.addCategory()">
                                + Добавить категорию
                            </button>
                        </div>
                    </div>
                    <div class="admin-table">
                        <div class="table-header">
                            <div class="table-row">
                                <div>ID</div>
                                <div>Название</div>
                                <div>Описание</div>
                                <div>Действия</div>
                            </div>
                        </div>
                        <div class="table-content" id="categoriesTable"></div>
                    </div>
                </section>
            `;
        } else if (section === 'collections') {
            html = `
                <section id="collections" class="admin-section">
                    <div class="section-header">
                        <h1>Управление коллекциями</h1>
                        <div class="section-actions">
                            <button class="btn btn-primary" onclick="adminManager.addCollection()">
                                + Добавить коллекцию
                            </button>
                        </div>
                    </div>
                    <div class="admin-table">
                        <div class="table-header">
                            <div class="table-row">
                                <div>ID</div>
                                <div>Название</div>
                                <div>Статус</div>
                                <div>Действия</div>
                            </div>
                        </div>
                        <div class="table-content" id="collectionsTable"></div>
                    </div>
                </section>
            `;
        }

        if (html) {
            mainContent.insertAdjacentHTML('beforeend', html);
        }
    }

    async loadDashboard() {
        try {
            const response = await fetch('/api/admin/stats', {
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                this.updateStats(data.stats);
                await this.loadRecentOrders();
            } else {
                throw new Error('Ошибка загрузки статистики');
            }
        } catch (error) {
            console.error('Ошибка загрузки дашборда:', error);
            this.showDemoStats();
        }
    }

    updateStats(stats) {
        document.getElementById('totalUsers').textContent = stats.total_users;
        document.getElementById('totalProducts').textContent = stats.total_products;
        document.getElementById('totalOrders').textContent = stats.total_orders;
        document.getElementById('totalRevenue').textContent = this.formatPrice(stats.total_revenue) + ' ₽';
    }

    async loadRecentOrders() {
        try {
            const response = await fetch('/api/admin/orders?limit=5', {
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                this.displayRecentOrders(data.orders);
            } else {
                throw new Error('Ошибка загрузки заказов');
            }
        } catch (error) {
            console.error('Ошибка загрузки заказов:', error);
            this.displayDemoOrders();
        }
    }

    displayRecentOrders(orders) {
        const container = document.getElementById('recentOrders');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = '<div class="table-row"><div colspan="6" style="text-align: center; padding: 20px;">Нет заказов</div></div>';
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="table-row">
                <div>#${order.id}</div>
                <div>${order.first_name} ${order.last_name}</div>
                <div>${this.formatPrice(order.total_amount)} ₽</div>
                <div><span class="order-status ${order.status}">${this.getStatusText(order.status)}</span></div>
                <div>${this.formatDate(order.created_at)}</div>
                <div>
                    <button class="btn btn-small" onclick="adminManager.viewOrder(${order.id})">
                        Просмотр
                    </button>
                </div>
            </div>
        `).join('');
    }

    async loadOrders() {
        try {
            const response = await fetch('/api/admin/orders', {
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                this.displayOrders(data.orders);
            } else {
                throw new Error('Ошибка загрузки заказов');
            }
        } catch (error) {
            console.error('Ошибка загрузки заказов:', error);
            this.displayDemoOrdersTable();
        }
    }

    displayOrders(orders) {
        const container = document.getElementById('ordersTable');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = '<div class="table-row"><div colspan="6" style="text-align: center; padding: 20px;">Нет заказов</div></div>';
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="table-row">
                <div>#${order.id}</div>
                <div>
                    <div>${order.first_name} ${order.last_name}</div>
                    <small>${order.email}</small>
                </div>
                <div>${this.formatPrice(order.total_amount)} ₽</div>
                <div>
                    <select class="status-select" data-order-id="${order.id}" onchange="adminManager.updateOrderStatus(${order.id}, this.value)">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Ожидает</option>
                        <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Подтвержден</option>
                        <option value="production" ${order.status === 'production' ? 'selected' : ''}>Изготовление</option>
                        <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Готов</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Отправлен</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Доставлен</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Отменен</option>
                    </select>
                </div>
                <div>${this.formatDate(order.created_at)}</div>
                <div>
                    <button class="btn btn-small" onclick="adminManager.viewOrder(${order.id})">
                        Просмотр
                    </button>
                </div>
            </div>
        `).join('');
    }

    async updateOrderStatus(orderId, status) {
        try {
            const response = await fetch(`/api/admin/orders/${orderId}/status`, {
                method: 'PUT',
                headers: authManager.getAuthHeaders(),
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                this.showMessage('Статус заказа обновлен', 'success');
                await this.loadOrders();
                await this.loadDashboard();
            } else {
                throw new Error('Ошибка обновления статуса');
            }
        } catch (error) {
            this.showMessage('Ошибка обновления статуса: ' + error.message, 'error');
            this.loadOrders();
        }
    }

    async loadProducts() {
        try {
            const response = await fetch('/api/admin/products', {
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                this.displayProducts(data.products);
            } else {
                throw new Error('Ошибка загрузки товаров');
            }
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
            this.showMessage('Ошибка загрузки товаров', 'error');
        }
    }

    displayProducts(products) {
        const container = document.getElementById('productsTable');
        if (!container) return;

        if (products.length === 0) {
            container.innerHTML = '<div class="table-row"><div colspan="6" style="text-align: center; padding: 20px;">Нет товаров</div></div>';
            return;
        }

        container.innerHTML = products.map(product => `
            <div class="table-row">
                <div>${product.id}</div>
                <div>${product.name}</div>
                <div>${this.formatPrice(product.price)} ₽</div>
                <div>${product.category_name || '-'}</div>
                <div>
                    <span class="product-status ${product.is_featured ? 'featured' : 'regular'}">
                        ${product.is_featured ? '⭐ Избранный' : 'Обычный'}
                    </span>
                </div>
                <div>
                    <button class="btn btn-small" onclick="adminManager.editProduct(${product.id})">
                        Редактировать
                    </button>
                    <button class="btn btn-small btn-danger" onclick="adminManager.deleteProduct(${product.id})">
                        Удалить
                    </button>
                </div>
            </div>
        `).join('');
    }

    editProduct(productId) {
        // Загружаем товар для редактирования
        this.showProductEditModal(productId);
    }

    async showProductEditModal(productId = null) {
        // Если редактируем существующий товар, загружаем его данные
        let product = {
            id: null,
            name: '',
            description: '',
            price: 0,
            old_price: 0,
            category_id: 1,
            collection_id: 1,
            material: '',
            dimensions: '',
            image_url: '',
            is_featured: false
        };

        if (productId) {
            try {
                const response = await fetch(`/api/products/${productId}`);
                if (response.ok) {
                    const data = await response.json();
                    product = data.product;
                } else {
                    this.showMessage('Не удалось загрузить товар', 'error');
                    return;
                }
            } catch (error) {
                this.showMessage('Ошибка загрузки товара: ' + error.message, 'error');
                return;
            }
        }

        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        modal.id = 'productModal';
        modal.innerHTML = `
            <div class="admin-modal-content">
                <div class="modal-header">
                    <h2>${productId ? 'Редактирование товара' : 'Создание товара'}</h2>
                    <button class="modal-close" onclick="document.getElementById('productModal').remove()">✕</button>
                </div>
                <div class="modal-body" style="display: grid; grid-template-columns: 1fr 300px; gap: 20px;">
                    <div>
                        <div class="form-group">
                            <label>Название товара *</label>
                            <input type="text" id="productName" value="${product.name}" placeholder="Введите название">
                        </div>
                        <div class="form-group">
                            <label>Описание</label>
                            <textarea id="productDescription" placeholder="Введите описание">${product.description || ''}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Цена (₽) *</label>
                                <input type="number" id="productPrice" value="${product.price}" placeholder="Цена">
                            </div>
                            <div class="form-group">
                                <label>Старая цена (₽)</label>
                                <input type="number" id="productOldPrice" value="${product.old_price || ''}" placeholder="Старая цена">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Материал</label>
                                <input type="text" id="productMaterial" value="${product.material || ''}" placeholder="Материал">
                            </div>
                            <div class="form-group">
                                <label>Размеры</label>
                                <input type="text" id="productDimensions" value="${product.dimensions || ''}" placeholder="Размеры (см)">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="productFeatured" ${product.is_featured ? 'checked' : ''}>
                                Избранный товар
                            </label>
                        </div>
                    </div>
                    <div style="border-left: 1px solid #eee; padding-left: 20px;">
                        <div style="margin-bottom: 15px;">
                            <label style="font-weight: 600; margin-bottom: 10px; display: block;">Изображение товара</label>
                            <div style="border: 2px dashed #ccc; border-radius: 8px; padding: 20px; text-align: center; cursor: pointer;" 
                                 id="imageDropZone" 
                                 onmouseover="this.style.borderColor='#999'"
                                 onmouseout="this.style.borderColor='#ccc'">
                                <input type="file" id="productImageFile" accept="image/*" style="display: none;">
                                <div id="imageUploadText">
                                    📷 Нажмите или перетащите<br><small>изображение сюда</small>
                                </div>
                            </div>
                        </div>
                        ${product.image_url ? `
                        <div>
                            <img id="imagePreview" src="${product.image_url}" style="width: 100%; border-radius: 8px; margin-bottom: 10px; max-height: 200px; object-fit: cover;">
                            <button type="button" class="btn btn-small" style="width: 100%;" onclick="this.parentElement.querySelector('img').style.display = 'none'; document.getElementById('productImage').value = '';">
                                ✕ Удалить картинку
                            </button>
                        </div>
                        ` : `
                        <div id="emptyImagePreview" style="height: 200px; background: #f5f5f5; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #999;">
                            Нет изображения
                        </div>
                        `}
                    </div>
                </div>
                <input type="hidden" id="productImage" value="${product.image_url || ''}">
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('productModal').remove()">Отмена</button>
                    <button class="btn btn-primary" onclick="adminManager.saveProduct(${productId || 'null'})">Сохранить</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        // Добавляем обработчики для загрузки файла
        const dropZone = document.getElementById('imageDropZone');
        const fileInput = document.getElementById('productImageFile');

        dropZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await this.uploadProductImage(file);
            }
        });

        // Drag and drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#999';
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.style.borderColor = '#ccc';
        });

        dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                fileInput.files = e.dataTransfer.files;
                await this.uploadProductImage(file);
            }
        });
    }

    async uploadProductImage(file) {
        try {
            const formData = new FormData();
            formData.append('image', file);

            // Получаем только Authorization заголовок, браузер сам установит multipart/form-data
            const headers = {
                'Authorization': `Bearer ${authManager.token}`
            };

            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: headers,
                body: formData
            });

            if (!response.ok) {
                throw new Error('Ошибка загрузки файла');
            }

            const data = await response.json();
            
            // Обновляем скрытое поле с URL
            document.getElementById('productImage').value = data.url;

            // Обновляем превью
            const preview = document.getElementById('imagePreview');
            const emptyPreview = document.getElementById('emptyImagePreview');
            const uploadText = document.getElementById('imageUploadText');

            if (preview) {
                preview.src = data.url;
                preview.style.display = 'block';
            } else if (emptyPreview) {
                const img = document.createElement('img');
                img.id = 'imagePreview';
                img.src = data.url;
                img.style.cssText = 'width: 100%; border-radius: 8px; margin-bottom: 10px; max-height: 200px; object-fit: cover;';
                emptyPreview.replaceWith(img);

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-small';
                deleteBtn.style.width = '100%';
                deleteBtn.type = 'button';
                deleteBtn.textContent = '✕ Удалить картинку';
                deleteBtn.onclick = () => {
                    img.style.display = 'none';
                    document.getElementById('productImage').value = '';
                };
                img.parentElement.appendChild(deleteBtn);
            }

            if (uploadText) {
                uploadText.style.display = 'none';
            }

            this.showMessage('Изображение загружено успешно', 'success');
        } catch (error) {
            this.showMessage('Ошибка загрузки изображения: ' + error.message, 'error');
        }
    }

    async saveProduct(productId) {
        const name = document.getElementById('productName').value;
        const price = document.getElementById('productPrice').value;

        if (!name || !price) {
            this.showMessage('Заполните обязательные поля', 'error');
            return;
        }

        const product = {
            name,
            description: document.getElementById('productDescription').value,
            price: parseFloat(price),
            old_price: parseFloat(document.getElementById('productOldPrice').value) || null,
            material: document.getElementById('productMaterial').value,
            dimensions: document.getElementById('productDimensions').value,
            image_url: document.getElementById('productImage').value,
            is_featured: document.getElementById('productFeatured').checked
        };

        try {
            const url = productId ? `/api/admin/products/${productId}` : '/api/admin/products';
            const method = productId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: authManager.getAuthHeaders(),
                body: JSON.stringify(product)
            });

            if (response.ok) {
                this.showMessage(productId ? 'Товар обновлен' : 'Товар создан', 'success');
                document.getElementById('productModal').remove();
                await this.loadProducts();
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка сохранения');
            }
        } catch (error) {
            this.showMessage('Ошибка: ' + error.message, 'error');
        }
    }

    deleteProduct(productId) {
        if (confirm('Вы уверены, что хотите удалить этот товар?')) {
            try {
                const response = fetch(`/api/admin/products/${productId}`, {
                    method: 'DELETE',
                    headers: authManager.getAuthHeaders()
                });

                if (response.ok) {
                    this.showMessage('Товар удален', 'success');
                    this.loadProducts();
                } else {
                    throw new Error('Ошибка удаления товара');
                }
            } catch (error) {
                this.showMessage('Ошибка удаления товара: ' + error.message, 'error');
            }
        }
    }

    async addProduct() {
        this.showProductEditModal(null);
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/admin/users', {
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                this.displayUsers(data.users);
            } else {
                throw new Error('Ошибка загрузки пользователей');
            }
        } catch (error) {
            console.error('Ошибка загрузки пользователей:', error);
            this.displayDemoUsers();
        }
    }

    displayUsers(users) {
        const container = document.getElementById('usersTable');
        if (!container) return;

        if (users.length === 0) {
            container.innerHTML = '<div class="table-row"><div colspan="6" style="text-align: center; padding: 20px;">Нет пользователей</div></div>';
            return;
        }

        container.innerHTML = users.map(user => `
            <div class="table-row">
                <div>${user.id}</div>
                <div>${user.first_name} ${user.last_name}</div>
                <div>${user.email}</div>
                <div>
                    <span class="user-role ${user.role}">
                        ${user.role === 'admin' ? '👥 Администратор' : '👤 Пользователь'}
                    </span>
                </div>
                <div>${this.formatDate(user.created_at)}</div>
                <div>
                    <button class="btn btn-small" onclick="adminManager.editUser(${user.id})">
                        Информация
                    </button>
                </div>
            </div>
        `).join('');
    }

    editUser(userId) {
        alert(`Информация пользователя #${userId}`);
    }

    // ============== КАТЕГОРИИ ==============

    async loadCategories() {
        try {
            const response = await fetch('/api/admin/categories', {
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                this.displayCategories(data.categories);
            } else {
                throw new Error('Ошибка загрузки категорий');
            }
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
            this.showMessage('Ошибка загрузки категорий', 'error');
        }
    }

    displayCategories(categories) {
        const container = document.getElementById('categoriesTable');
        if (!container) return;

        if (categories.length === 0) {
            container.innerHTML = '<div class="table-row"><div colspan="4" style="text-align: center; padding: 20px;">Нет категорий</div></div>';
            return;
        }

        container.innerHTML = categories.map(cat => `
            <div class="table-row">
                <div>${cat.id}</div>
                <div>${cat.name}</div>
                <div>${cat.description || '-'}</div>
                <div>
                    <button class="btn btn-small" onclick="adminManager.editCategory(${cat.id})">
                        Редактировать
                    </button>
                    <button class="btn btn-small btn-danger" onclick="adminManager.deleteCategory(${cat.id})">
                        Удалить
                    </button>
                </div>
            </div>
        `).join('');
    }

    async addCategory() {
        const name = prompt('Название категории:');
        if (!name) return;

        const description = prompt('Описание (опционально):');

        try {
            const response = await fetch('/api/admin/categories', {
                method: 'POST',
                headers: authManager.getAuthHeaders(),
                body: JSON.stringify({
                    name,
                    description: description || '',
                    image_url: ''
                })
            });

            if (response.ok) {
                this.showMessage('Категория создана', 'success');
                await this.loadCategories();
            } else {
                throw new Error('Ошибка создания категории');
            }
        } catch (error) {
            this.showMessage('Ошибка создания категории: ' + error.message, 'error');
        }
    }

    async deleteCategory(categoryId) {
        if (confirm('Вы уверены, что хотите удалить эту категорию?')) {
            try {
                const response = await fetch(`/api/admin/categories/${categoryId}`, {
                    method: 'DELETE',
                    headers: authManager.getAuthHeaders()
                });

                if (response.ok) {
                    this.showMessage('Категория удалена', 'success');
                    await this.loadCategories();
                } else {
                    const error = await response.json();
                    throw new Error(error.error);
                }
            } catch (error) {
                this.showMessage('Ошибка удаления: ' + error.message, 'error');
            }
        }
    }

    editCategory(categoryId) {
        // Загружаем категорию для редактирования
        this.showCategoryEditModal(categoryId);
    }

    async showCategoryEditModal(categoryId = null) {
        let category = {
            id: null,
            name: '',
            description: '',
            image_url: ''
        };

        if (categoryId) {
            try {
                const response = await fetch(`/api/admin/categories`);
                if (response.ok) {
                    const data = await response.json();
                    category = data.categories.find(c => c.id === categoryId);
                    if (!category) throw new Error('Категория не найдена');
                } else {
                    this.showMessage('Не удалось загрузить категорию', 'error');
                    return;
                }
            } catch (error) {
                this.showMessage('Ошибка загрузки: ' + error.message, 'error');
                return;
            }
        }

        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        modal.id = 'categoryModal';
        modal.innerHTML = `
            <div class="admin-modal-content">
                <div class="modal-header">
                    <h2>${categoryId ? 'Редактирование категории' : 'Создание категории'}</h2>
                    <button class="modal-close" onclick="document.getElementById('categoryModal').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Название категории *</label>
                        <input type="text" id="categoryName" value="${category.name}" placeholder="Введите название">
                    </div>
                    <div class="form-group">
                        <label>Описание</label>
                        <textarea id="categoryDescription" placeholder="Введите описание">${category.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>URL изображения</label>
                        <input type="text" id="categoryImage" value="${category.image_url || ''}" placeholder="URL изображения">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('categoryModal').remove()">Отмена</button>
                    <button class="btn btn-primary" onclick="adminManager.saveCategory(${categoryId || 'null'})">Сохранить</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    async saveCategory(categoryId) {
        const name = document.getElementById('categoryName').value;

        if (!name) {
            this.showMessage('Заполните название категории', 'error');
            return;
        }

        const category = {
            name,
            description: document.getElementById('categoryDescription').value,
            image_url: document.getElementById('categoryImage').value
        };

        try {
            const url = categoryId ? `/api/admin/categories/${categoryId}` : '/api/admin/categories';
            const method = categoryId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: authManager.getAuthHeaders(),
                body: JSON.stringify(category)
            });

            if (response.ok) {
                this.showMessage(categoryId ? 'Категория обновлена' : 'Категория создана', 'success');
                document.getElementById('categoryModal').remove();
                await this.loadCategories();
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка сохранения');
            }
        } catch (error) {
            this.showMessage('Ошибка: ' + error.message, 'error');
        }
    }

    async loadCollections() {
        try {
            const response = await fetch('/api/admin/collections', {
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                this.displayCollections(data.collections);
            } else {
                throw new Error('Ошибка загрузки коллекций');
            }
        } catch (error) {
            console.error('Ошибка загрузки коллекций:', error);
            this.showMessage('Ошибка загрузки коллекций', 'error');
        }
    }

    displayCollections(collections) {
        const container = document.getElementById('collectionsTable');
        if (!container) return;

        if (collections.length === 0) {
            container.innerHTML = '<div class="table-row"><div colspan="4" style="text-align: center; padding: 20px;">Нет коллекций</div></div>';
            return;
        }

        container.innerHTML = collections.map(col => `
            <div class="table-row">
                <div>${col.id}</div>
                <div>${col.name}</div>
                <div>
                    <span class="status ${col.is_active ? 'active' : 'inactive'}">
                        ${col.is_active ? '✓ Активна' : '⊗ Неактивна'}
                    </span>
                </div>
                <div>
                    <button class="btn btn-small" onclick="adminManager.editCollection(${col.id})">
                        Редактировать
                    </button>
                    <button class="btn btn-small btn-danger" onclick="adminManager.deleteCollection(${col.id})">
                        Удалить
                    </button>
                </div>
            </div>
        `).join('');
    }

    async addCollection() {
        const name = prompt('Название коллекции:');
        if (!name) return;

        const description = prompt('Описание (опционально):');

        try {
            const response = await fetch('/api/admin/collections', {
                method: 'POST',
                headers: authManager.getAuthHeaders(),
                body: JSON.stringify({
                    name,
                    description: description || '',
                    image_url: '',
                    is_active: true
                })
            });

            if (response.ok) {
                this.showMessage('Коллекция создана', 'success');
                await this.loadCollections();
            } else {
                throw new Error('Ошибка создания коллекции');
            }
        } catch (error) {
            this.showMessage('Ошибка создания коллекции: ' + error.message, 'error');
        }
    }

    async deleteCollection(collectionId) {
        if (confirm('Вы уверены, что хотите удалить эту коллекцию?')) {
            try {
                const response = await fetch(`/api/admin/collections/${collectionId}`, {
                    method: 'DELETE',
                    headers: authManager.getAuthHeaders()
                });

                if (response.ok) {
                    this.showMessage('Коллекция удалена', 'success');
                    await this.loadCollections();
                } else {
                    const error = await response.json();
                    throw new Error(error.error);
                }
            } catch (error) {
                this.showMessage('Ошибка удаления: ' + error.message, 'error');
            }
        }
    }

    editCollection(collectionId) {
        // Загружаем коллекцию для редактирования
        this.showCollectionEditModal(collectionId);
    }

    async showCollectionEditModal(collectionId = null) {
        let collection = {
            id: null,
            name: '',
            description: '',
            image_url: '',
            is_active: true
        };

        if (collectionId) {
            try {
                const response = await fetch(`/api/admin/collections`);
                if (response.ok) {
                    const data = await response.json();
                    collection = data.collections.find(c => c.id === collectionId);
                    if (!collection) throw new Error('Коллекция не найдена');
                } else {
                    this.showMessage('Не удалось загрузить коллекцию', 'error');
                    return;
                }
            } catch (error) {
                this.showMessage('Ошибка загрузки: ' + error.message, 'error');
                return;
            }
        }

        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        modal.id = 'collectionModal';
        modal.innerHTML = `
            <div class="admin-modal-content">
                <div class="modal-header">
                    <h2>${collectionId ? 'Редактирование коллекции' : 'Создание коллекции'}</h2>
                    <button class="modal-close" onclick="document.getElementById('collectionModal').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Название коллекции *</label>
                        <input type="text" id="collectionName" value="${collection.name}" placeholder="Введите название">
                    </div>
                    <div class="form-group">
                        <label>Описание</label>
                        <textarea id="collectionDescription" placeholder="Введите описание">${collection.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>URL изображения</label>
                        <input type="text" id="collectionImage" value="${collection.image_url || ''}" placeholder="URL изображения">
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="collectionActive" ${collection.is_active ? 'checked' : ''}>
                            Активна
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('collectionModal').remove()">Отмена</button>
                    <button class="btn btn-primary" onclick="adminManager.saveCollection(${collectionId || 'null'})">Сохранить</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    async saveCollection(collectionId) {
        const name = document.getElementById('collectionName').value;

        if (!name) {
            this.showMessage('Заполните название коллекции', 'error');
            return;
        }

        const collection = {
            name,
            description: document.getElementById('collectionDescription').value,
            image_url: document.getElementById('collectionImage').value,
            is_active: document.getElementById('collectionActive').checked
        };

        try {
            const url = collectionId ? `/api/admin/collections/${collectionId}` : '/api/admin/collections';
            const method = collectionId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: authManager.getAuthHeaders(),
                body: JSON.stringify(collection)
            });

            if (response.ok) {
                this.showMessage(collectionId ? 'Коллекция обновлена' : 'Коллекция создана', 'success');
                document.getElementById('collectionModal').remove();
                await this.loadCollections();
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка сохранения');
            }
        } catch (error) {
            this.showMessage('Ошибка: ' + error.message, 'error');
        }
    }

    viewOrder(orderId) {
        alert(`Просмотр заказа #${orderId}\nВ полной версии здесь открывалась бы детальная страница заказа.`);
    }

    exportOrders() {
        alert('Экспорт заказов в CSV\nЭта функция экспортирует все заказы в CSV формат.');
    }

    setupEventListeners() {
        // Дополнительные обработчики событий
    }

    // ============== ДЕМО-ДАННЫЕ ==============

    showDemoStats() {
        const demoStats = {
            total_users: 150,
            total_products: 45,
            total_orders: 89,
            total_revenue: 24500000
        };
        this.updateStats(demoStats);
        this.displayDemoOrders();
    }

    displayDemoOrders() {
        const demoOrders = [
            { id: 1, first_name: 'Иван', last_name: 'Петров', total_amount: 245000, status: 'delivered', created_at: '2024-01-15T10:30:00Z' },
            { id: 2, first_name: 'Анна', last_name: 'Сидорова', total_amount: 89000, status: 'shipped', created_at: '2024-01-14T14:20:00Z' },
            { id: 3, first_name: 'Петр', last_name: 'Иванов', total_amount: 420000, status: 'confirmed', created_at: '2024-01-13T09:15:00Z' }
        ];
        this.displayRecentOrders(demoOrders);
    }

    displayDemoOrdersTable() {
        const demoOrders = [
            { id: 1, first_name: 'Иван', last_name: 'Петров', email: 'ivan@example.com', total_amount: 245000, status: 'delivered', created_at: '2024-01-15T10:30:00Z' },
            { id: 2, first_name: 'Анна', last_name: 'Сидорова', email: 'anna@example.com', total_amount: 89000, status: 'shipped', created_at: '2024-01-14T14:20:00Z' },
            { id: 3, first_name: 'Петр', last_name: 'Иванов', email: 'petr@example.com', total_amount: 420000, status: 'confirmed', created_at: '2024-01-13T09:15:00Z' },
            { id: 4, first_name: 'Мария', last_name: 'Козлова', email: 'maria@example.com', total_amount: 150000, status: 'pending', created_at: '2024-01-12T16:45:00Z' }
        ];
        this.displayOrders(demoOrders);
    }

    displayDemoUsers() {
        const demoUsers = [
            { id: 1, first_name: 'Анна', last_name: 'Иванова', email: 'admin@luxury.ru', role: 'admin', created_at: '2024-01-01T00:00:00Z' },
            { id: 2, first_name: 'Иван', last_name: 'Петров', email: 'user@example.com', role: 'customer', created_at: '2024-01-05T12:00:00Z' },
            { id: 3, first_name: 'Мария', last_name: 'Сидорова', email: 'maria@example.com', role: 'customer', created_at: '2024-01-08T15:30:00Z' }
        ];
        this.displayUsers(demoUsers);
    }

    // ============== ФОРМАТИРОВАНИЕ ==============

    getStatusText(status) {
        const statusMap = {
            'pending': 'Ожидает',
            'confirmed': 'Подтвержден',
            'production': 'Изготовление',
            'ready': 'Готов',
            'shipped': 'Отправлен',
            'delivered': 'Доставлен',
            'cancelled': 'Отменен'
        };
        return statusMap[status] || status;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `admin-message admin-message-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 1000;
            color: white;
            font-weight: 500;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            max-width: 350px;
        `;

        if (type === 'success') {
            messageDiv.style.background = '#4caf50';
        } else if (type === 'error') {
            messageDiv.style.background = '#f44336';
        } else {
            messageDiv.style.background = '#2196f3';
        }

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 4000);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.adminManager = new AdminManager();
});