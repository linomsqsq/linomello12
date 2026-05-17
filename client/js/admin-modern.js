// Современная админ-панель с полным функционалом

class AdminPanelModern {
    constructor() {
        this.currentSection = 'dashboard';
        this.editingId = null;
        this.editingType = null;
        this.uploadedImageUrl = null;
        this.currentProductImage = null;
        this.ordersCache = [];
        this.usersCache = [];
        this.init();
    }

    async init() {
        // Проверяем права администратора
        if (!authManager.isAdmin()) {
            window.location.href = 'admin-login.html';
            return;
        }

        console.log('✅ Админ авторизован:', authManager.currentUser?.email);
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
                
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    showSection(section) {
        this.currentSection = section;
        
        document.querySelectorAll('.admin-section').forEach(sec => {
            sec.classList.remove('active');
        });
        
        let sectionEl = document.getElementById(section);
        if (sectionEl) {
            sectionEl.classList.add('active');
        }

        // Загружаем данные для секции
        switch(section) {
            case 'products': this.loadProducts(); break;
            case 'categories': this.loadCategories(); break;
            case 'collections': this.loadCollections(); break;
            case 'users': this.loadUsers(); break;
            case 'orders': this.loadOrders(); break;
        }
    }

    async loadDashboard() {
        try {
            const response = await fetch('/api/admin/stats', {
                headers: authManager.getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            const stats = data.stats || data;
            
            document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
            document.getElementById('totalProducts').textContent = stats.totalProducts || 0;
            document.getElementById('totalCategories').textContent = stats.totalCategories || 0;
            document.getElementById('totalCollections').textContent = stats.totalCollections || 0;
            document.getElementById('totalOrders').textContent = stats.totalOrders || 0;
            document.getElementById('pendingOrders').textContent = `В ожидании: ${stats.pendingOrders || 0}`;
            document.getElementById('totalRevenue').textContent = (stats.totalRevenue || 0) + ' ₽';

            await this.loadRecentOrders();
            console.log('📊 Дашборд загружен');
        } catch (error) {
            console.error('Ошибка загрузки дашборда:', error);
            document.getElementById('totalUsers').textContent = '—';
            document.getElementById('totalProducts').textContent = '—';
            document.getElementById('totalCategories').textContent = '—';
            document.getElementById('totalCollections').textContent = '—';
            document.getElementById('totalOrders').textContent = '—';
            document.getElementById('pendingOrders').textContent = 'В ожидании: —';
            document.getElementById('totalRevenue').textContent = '—';
            document.getElementById('recentOrders').innerHTML = '<div class="admin-empty"><div class="empty-icon">⚠️</div><div class="empty-text">Не удалось загрузить последние заказы</div></div>';
        }
    }

    async loadRecentOrders() {
        try {
            const response = await fetch('/api/admin/orders', {
                headers: authManager.getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const orders = (data.orders || []).slice(0, 5);
            this.displayRecentOrders(orders);
        } catch (error) {
            console.error('Ошибка загрузки последних заказов:', error);
            document.getElementById('recentOrders').innerHTML = '<div class="admin-empty"><div class="empty-icon">⚠️</div><div class="empty-text">Не удалось загрузить последние заказы</div></div>';
        }
    }

    displayRecentOrders(orders) {
        const container = document.getElementById('recentOrders');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = '<div class="admin-empty"><div class="empty-icon">📦</div><div class="empty-text">Нет последних заказов</div></div>';
            return;
        }

        container.innerHTML = orders.map(order => {
            const fullName = `${order.first_name || ''} ${order.last_name || ''}`.trim();
            const customerLabel = order.customer_name || fullName || 'Гость';
            return `
                <div class="table-row">
                    <div>#${order.id}</div>
                    <div>${customerLabel}</div>
                    <div>${order.total_amount} ₽</div>
                    <div><span class="order-status ${order.status}">${order.status}</span></div>
                    <div>${new Date(order.created_at).toLocaleDateString('ru-RU')}</div>
                    <div></div>
                </div>
            `;
        }).join('');
    }

    async exportOrders() {
        try {
            const response = await fetch('/api/admin/orders', {
                headers: authManager.getAuthHeaders()
            });
            if (!response.ok) throw new Error('Не удалось получить заказы');

            const data = await response.json();
            const orders = data.orders || [];
            if (!orders.length) {
                alert('Нет заказов для экспорта');
                return;
            }

            const csv = [
                ['ID', 'Клиент', 'Сумма', 'Статус', 'Дата']
            ].concat(orders.map(order => [
                order.id,
                `${order.first_name || ''} ${order.last_name || ''}`.trim() || 'Гость',
                `${order.total_amount} ₽`,
                order.status,
                new Date(order.created_at).toLocaleString('ru-RU')
            ].map(value => `"${String(value).replace(/"/g, '""')}"`)));

            const csvContent = csv.map(row => row.join(',')).join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'admin_orders.csv';
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (error) {
            alert('Ошибка экспорта заказов: ' + error.message);
        }
    }

    async viewUser(id) {
        try {
            const response = await fetch('/api/admin/users', {
                headers: authManager.getAuthHeaders()
            });
            if (!response.ok) throw new Error('Не удалось загрузить пользователя');

            const data = await response.json();
            const user = (data.users || []).find(u => u.id === id);
            if (!user) {
                alert('Пользователь не найден');
                return;
            }

            const modal = document.createElement('div');
            modal.className = 'admin-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>👤 Пользователь #${user.id}</h2>
                        <button class="modal-close-btn" onclick="this.closest('.admin-modal').remove()">✕</button>
                    </div>
                    <div class="modal-body">
                        <p><strong>Имя:</strong> ${user.first_name} ${user.last_name}</p>
                        <p><strong>Email:</strong> ${user.email}</p>
                        <p><strong>Роль:</strong> ${user.role}</p>
                        <p><strong>Зарегистрирован:</strong> ${new Date(user.created_at).toLocaleString('ru-RU')}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-cancel" onclick="this.closest('.admin-modal').remove()">Закрыть</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } catch (error) {
            alert('Ошибка просмотра пользователя: ' + error.message);
        }
    }

    editOrder(id) {
        const order = this.ordersCache.find(o => o.id === id);
        if (!order) {
            alert('Заказ не найден. Обновите страницу и попробуйте снова.');
            return;
        }

        const statuses = ['pending', 'confirmed', 'production', 'ready', 'shipped', 'delivered', 'cancelled'];
        const options = statuses.map(status => `
            <option value="${status}" ${order.status === status ? 'selected' : ''}>${status}</option>
        `).join('');

        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Изменить статус заказа #${order.id}</h2>
                    <button class="modal-close-btn" onclick="this.closest('.admin-modal').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Статус</label>
                        <select id="orderStatusSelect">${options}</select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-cancel" onclick="this.closest('.admin-modal').remove()">Отмена</button>
                    <button class="btn btn-primary" onclick="adminPanel.saveOrderStatus(${order.id})">Сохранить</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    async saveOrderStatus(id) {
        const select = document.getElementById('orderStatusSelect');
        if (!select) return;
        const status = select.value;

        try {
            const response = await fetch(`/api/admin/orders/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...authManager.getAuthHeaders()
                },
                body: JSON.stringify({ status })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Ошибка обновления статуса');
            }

            this.showMessage('✅ Статус заказа обновлен', 'success');
            document.querySelector('.admin-modal')?.remove();
            await this.loadOrders();
            await this.loadDashboard();
        } catch (error) {
            alert('Ошибка сохранения статуса заказа: ' + error.message);
        }
    }

    async loadProducts() {
        try {
            const response = await fetch('/api/admin/products', {
                headers: authManager.getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.displayProducts(data.products || []);
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
            const table = document.getElementById('productsTable');
            if (table) {
                table.innerHTML = `<div class="admin-empty"><div class="empty-icon">⚠️</div><div class="empty-text">Ошибка загрузки товаров</div></div>`;
            }
        }
    }

    displayProducts(products) {
        const table = document.getElementById('productsTable');
        if (!table) return;

        if (products.length === 0) {
            table.innerHTML = '<div class="admin-empty"><div class="empty-icon">📦</div><div class="empty-text">Нет товаров</div></div>';
            return;
        }

        table.innerHTML = products.map(product => `
            <div class="table-row">
                <div><img src="${product.image_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22%3E%3Crect fill=%22%23f0f0f0%22 width=%2250%22 height=%2250%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2224%22%3E🛋️%3C/text%3E%3C/svg%3E'}" alt="${product.name}" class="admin-table-img" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22%3E%3Crect fill=%22%23f0f0f0%22 width=%2250%22 height=%2250%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2224%22%3E🛋️%3C/text%3E%3C/svg%3E'"></div>
                <div><strong>${product.name}</strong></div>
                <div>${product.price} ₽</div>
                <div>${product.category_name || '-'}</div>
                <div>${product.is_featured ? '⭐ Featured' : 'Regular'}</div>
                <div class="admin-table-actions">
                    <button class="btn btn-edit btn-small" onclick="adminPanel.editProduct(${product.id})">✏️ Ред.</button>
                    <button class="btn btn-delete btn-small" onclick="adminPanel.deleteProduct(${product.id})">🗑️ Удал.</button>
                </div>
            </div>
        `).join('');
    }

    async autoFillProductImages() {
        try {
            const response = await fetch('/api/admin/products/auto-fill-images', {
                method: 'POST',
                headers: authManager.getAuthHeaders()
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Ошибка автоматического назначения изображений');
            }

            this.showMessage(data.message || 'Изображения назначены', 'success');
            this.loadProducts();
        } catch (error) {
            alert('Ошибка: ' + error.message);
        }
    }

    async autoUploadProductImages() {
        try {
            const response = await fetch('/api/admin/products/auto-upload-images', {
                method: 'POST',
                headers: authManager.getAuthHeaders()
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Ошибка автоматической загрузки изображений');
            }

            this.showMessage(data.message || 'Изображения загружены', 'success');
            this.loadProducts();
        } catch (error) {
            alert('Ошибка: ' + error.message);
        }
    }

    async loadCategories() {
        try {
            const response = await fetch('/api/admin/categories', {
                headers: authManager.getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.displayCategories(data.categories || []);
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
            document.getElementById('categoriesTable').innerHTML = '<div class="admin-empty"><div class="empty-icon">⚠️</div><div class="empty-text">Ошибка загрузки категорий</div></div>';
        }
    }

    displayCategories(categories) {
        const table = document.getElementById('categoriesTable');
        if (!table) return;

        if (categories.length === 0) {
            table.innerHTML = '<div class="admin-empty"><div class="empty-icon">📁</div><div class="empty-text">Нет категорий</div></div>';
            return;
        }

        table.innerHTML = categories.map(cat => `
            <div class="table-row">
                <div>#${cat.id}</div>
                <div><strong>${cat.name}</strong></div>
                <div>${cat.description || '-'}</div>
                <div class="admin-table-actions">
                    <button class="btn btn-edit btn-small" onclick="adminPanel.editCategory(${cat.id})">✏️ Редактировать</button>
                    <button class="btn btn-delete btn-small" onclick="adminPanel.deleteCategory(${cat.id})">🗑️ Удалить</button>
                </div>
            </div>
        `).join('');
    }

    async loadCollections() {
        try {
            const response = await fetch('/api/admin/collections', {
                headers: authManager.getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.displayCollections(data.collections || []);
        } catch (error) {
            console.error('Ошибка загрузки коллекций:', error);
            const table = document.getElementById('collectionsTable');
            if (table) {
                table.innerHTML = '<div class="admin-empty"><div class="empty-icon">⚠️</div><div class="empty-text">Ошибка загрузки коллекций</div></div>';
            }
        }
    }

    displayCollections(collections) {
        const table = document.getElementById('collectionsTable');
        if (!table) return;

        if (collections.length === 0) {
            table.innerHTML = '<div class="admin-empty"><div class="empty-icon">🎨</div><div class="empty-text">Нет коллекций</div></div>';
            return;
        }

        table.innerHTML = collections.map(col => `
            <div class="table-row">
                <div>#${col.id}</div>
                <div><strong>${col.name}</strong></div>
                <div>${col.description || '-'}</div>
                <div class="admin-table-actions">
                    <button class="btn btn-edit btn-small" onclick="adminPanel.editCollection(${col.id})">✏️ Ред.</button>
                    <button class="btn btn-delete btn-small" onclick="adminPanel.deleteCollection(${col.id})">🗑️ Удал.</button>
                </div>
            </div>
        `).join('');
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/admin/users', {
                headers: authManager.getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.displayUsers(data.users || []);
        } catch (error) {
            console.error('Ошибка загрузки пользователей:', error);
            const table = document.getElementById('usersTable');
            if (table) {
                table.innerHTML = '<div class="admin-empty"><div class="empty-icon">⚠️</div><div class="empty-text">Ошибка загрузки пользователей</div></div>';
            }
        }
    }

    displayUsers(users) {
        const table = document.getElementById('usersTable');
        if (!table) return;

        if (users.length === 0) {
            table.innerHTML = '<div class="admin-empty"><div class="empty-icon">👥</div><div class="empty-text">Нет пользователей</div></div>';
            return;
        }

        table.innerHTML = users.map(user => `
            <div class="table-row">
                <div>#${user.id}</div>
                <div><strong>${user.first_name} ${user.last_name}</strong></div>
                <div>${user.email}</div>
                <div><span class="status ${user.role === 'admin' ? 'active' : ''}">${user.role}</span></div>
                <div>${new Date(user.created_at).toLocaleDateString('ru-RU')}</div>
                <div class="admin-table-actions">
                    <button class="btn btn-view btn-small" onclick="adminPanel.viewUser(${user.id})">👁️ Просмотр</button>
                </div>
            </div>
        `).join('');
    }

    async loadOrders() {
        try {
            const response = await fetch('/api/admin/orders', {
                headers: authManager.getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.ordersCache = data.orders || [];
            this.displayOrders(this.ordersCache);
        } catch (error) {
            console.error('Ошибка загрузки заказов:', error);
            const table = document.getElementById('ordersTable');
            if (table) {
                table.innerHTML = '<div class="admin-empty"><div class="empty-icon">⚠️</div><div class="empty-text">Ошибка загрузки заказов</div></div>';
            }
        }
    }

    displayOrders(orders) {
        const table = document.getElementById('ordersTable');
        if (!table) return;

        if (orders.length === 0) {
            table.innerHTML = '<div class="admin-empty"><div class="empty-icon">📦</div><div class="empty-text">Нет заказов</div></div>';
            return;
        }

        table.innerHTML = orders.map(order => `
            <div class="table-row">
                <div>#${order.id}</div>
                <div><strong>${order.customer_name || 'Гость'}</strong></div>
                <div>${order.total_amount} ₽</div>
                <div><span class="order-status ${order.status}">${order.status}</span></div>
                <div>${new Date(order.created_at).toLocaleDateString('ru-RU')}</div>
                <div class="admin-table-actions">
                    <button class="btn btn-edit btn-small" onclick="adminPanel.editOrder(${order.id})">✏️ Ред.</button>
                </div>
            </div>
        `).join('');
    }

    // ДОБАВЛЕНИЕ/РЕДАКТИРОВАНИЕ

    addProduct() {
        this.editingType = 'product';
        this.editingId = null;
        this.showProductModal(null);
    }

    editProduct(id) {
        this.editingType = 'product';
        this.editingId = id;
        this.showProductModal(id);
    }

    showProductModal(id) {
        this.currentProductImage = null;
        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${id ? '📝 Редактирование товара' : '➕ Новый товар'}</h2>
                    <button class="modal-close-btn" onclick="this.closest('.admin-modal').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <form id="productForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Название *</label>
                                <input type="text" id="productName" required>
                            </div>
                            <div class="form-group">
                                <label>Цена *</label>
                                <input type="number" id="productPrice" step="0.01" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Старая цена</label>
                                <input type="number" id="productOldPrice" step="0.01">
                            </div>
                            <div class="form-group">
                                <label>Категория</label>
                                <select id="productCategory"></select>
                            </div>
                        </div>
                        <div class="form-group full">
                            <label>Описание</label>
                            <textarea id="productDescription"></textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Материал</label>
                                <input type="text" id="productMaterial">
                            </div>
                            <div class="form-group">
                                <label>Размеры</label>
                                <input type="text" id="productDimensions">
                            </div>
                        </div>
                        <div class="image-select-group">
                            <label class="image-select-label">Изображение товара</label>
                            <div class="image-select-controls">
                                <select id="productImageSelect" class="image-select">
                                    <option value="">Выберите изображение...</option>
                                </select>
                                <button type="button" class="image-upload-btn" onclick="document.getElementById('productImageInput').click()">
                                    <span>📸 Загрузить новое</span>
                                    <span class="image-upload-spinner"></span>
                                </button>
                                <input type="file" id="productImageInput" class="image-input" accept="image/*">
                            </div>
                            <div class="image-preview" id="productImagePreview"></div>
                        </div>
                        <div class="form-group checkbox">
                            <input type="checkbox" id="productFeatured">
                            <label>⭐ Избранный товар</label>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-cancel" onclick="this.closest('.admin-modal').remove()">Отмена</button>
                    <button class="btn btn-primary" onclick="adminPanel.saveProduct()">💾 Сохранить</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.loadCategoriesSelect();
        this.setupImageUpload('product');

        if (id) {
            this.loadProductData(id);
        }
    }

    loadCategoriesSelect() {
        fetch('/api/categories')
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(data => {
                const select = document.getElementById('productCategory');
                if (select) {
                    select.innerHTML = (data.categories || []).map(cat => 
                        `<option value="${cat.id}">${cat.name}</option>`
                    ).join('');
                }
            })
            .catch(error => {
                console.error('Ошибка загрузки категорий для селекта:', error);
            });
    }

    setupImageUpload(type) {
        if (type === 'product') {
            this.loadProductImages();
            this.setupProductImageUpload();
        }
    }

    setupProductImageUpload() {
        const input = document.getElementById('productImageInput');
        if (!input) return;

        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('image', file);

            const btn = input.previousElementSibling;
            const spinner = btn.querySelector('.image-upload-spinner');
            if (spinner) spinner.style.display = 'inline-block';

            try {
                const response = await fetch('/api/admin/upload-product-image', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Authorization': `Bearer ${authManager.token}`
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                if (data.url) {
                    this.uploadedImageUrl = data.url;
                    this.showImagePreview('product', data.url);
                    
                    // Обновляем список изображений
                    this.loadProductImages();
                    
                    console.log('✅ Изображение товара загружено:', data.url);
                } else {
                    throw new Error('Сервер не вернул URL изображения');
                }
            } catch (error) {
                console.error('Ошибка загрузки изображения:', error);
                alert('❌ Ошибка загрузки изображения:\n' + error.message);
            } finally {
                if (spinner) spinner.style.display = 'none';
                // Очищаем input
                input.value = '';
            }
        });
    }

    async loadProductImages() {
        try {
            const response = await fetch('/api/admin/product-images', {
                headers: authManager.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const select = document.getElementById('productImageSelect');
            if (!select) return;

            // Очищаем селект, оставляя только опцию по умолчанию
            select.innerHTML = '<option value="">Выберите изображение...</option>';

            // Добавляем изображения
            (data.images || []).forEach(image => {
                const option = document.createElement('option');
                option.value = image.url;
                option.textContent = image.filename;
                select.appendChild(option);
            });

            // Устанавливаем текущее изображение, если оно есть
            if (this.currentProductImage) {
                select.value = this.currentProductImage;
            } else if (this.uploadedImageUrl) {
                select.value = this.uploadedImageUrl;
            }

            // Обработчик изменения селекта
            select.addEventListener('change', (e) => {
                const selectedUrl = e.target.value;
                if (selectedUrl) {
                    this.uploadedImageUrl = selectedUrl;
                    this.showImagePreview('product', selectedUrl);
                } else {
                    this.uploadedImageUrl = null;
                    this.clearImagePreview('product');
                }
            });

        } catch (error) {
            console.error('Ошибка загрузки списка изображений:', error);
            const select = document.getElementById('productImageSelect');
            if (select) {
                select.innerHTML = '<option value="">Ошибка загрузки изображений</option>';
            }
        }
    }

    showImagePreview(type, url) {
        const preview = document.getElementById(type + 'ImagePreview');
        if (!preview) {
            console.warn(`Element #${type}ImagePreview not found`);
            return;
        }
        
        preview.innerHTML = `
            <div class="preview-item">
                <img src="${url}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px;">
                <button type="button" class="preview-remove" onclick="this.parentElement.remove()" style="position: absolute; top: -8px; right: -8px; background: #ff4444; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 16px;">✕</button>
            </div>
        `;
    }

    clearImagePreview(type) {
        const preview = document.getElementById(type + 'ImagePreview');
        if (preview) {
            preview.innerHTML = '';
        }
    }

    loadProductData(id) {
        fetch(`/api/products/${id}`)
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(data => {
                const product = data.product;
                document.getElementById('productName').value = product.name;
                document.getElementById('productPrice').value = product.price;
                document.getElementById('productOldPrice').value = product.old_price || '';
                document.getElementById('productCategory').value = product.category_id || '';
                document.getElementById('productDescription').value = product.description || '';
                document.getElementById('productMaterial').value = product.material || '';
                document.getElementById('productDimensions').value = product.dimensions || '';
                document.getElementById('productFeatured').checked = product.is_featured;

                if (product.image_url) {
                    this.uploadedImageUrl = product.image_url;
                    this.currentProductImage = product.image_url;
                    this.showImagePreview('product', product.image_url);
                }
            })
            .catch(error => {
                console.error('Ошибка загрузки товара:', error);
                alert('Ошибка загрузки товара: ' + error.message);
            });
    }

    async saveProduct() {
        const name = document.getElementById('productName').value;
        const price = document.getElementById('productPrice').value;
        const oldPrice = document.getElementById('productOldPrice').value;
        const categoryId = document.getElementById('productCategory').value;
        const description = document.getElementById('productDescription').value;
        const material = document.getElementById('productMaterial').value;
        const dimensions = document.getElementById('productDimensions').value;
        const isFeatured = document.getElementById('productFeatured').checked;

        if (!name || !price) {
            alert('Заполните обязательные поля');
            return;
        }

        const productData = {
            name, price, category_id: categoryId, 
            description, material, dimensions, is_featured: isFeatured
        };

        if (oldPrice) productData.old_price = oldPrice;
        if (this.uploadedImageUrl) productData.image_url = this.uploadedImageUrl;

        try {
            const endpoint = this.editingId ? 
                `/api/admin/products/${this.editingId}` : 
                '/api/admin/products';
            
            const method = this.editingId ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...authManager.getAuthHeaders()
                },
                body: JSON.stringify(productData)
            });

            if (response.ok) {
                this.showMessage('✅ Товар успешно сохранен!', 'success');
                document.querySelector('.admin-modal')?.remove();
                this.uploadedImageUrl = null;
                this.loadProducts();
            } else {
                const err = await response.json();
                alert('Ошибка: ' + (err.error || 'Неизвестная ошибка'));
            }
        } catch (error) {
            alert('Ошибка сохранения: ' + error.message);
        }
    }

    async deleteProduct(id) {
        if (!confirm('Вы уверены? Это действие необратимо.')) return;

        try {
            const response = await fetch(`/api/admin/products/${id}`, {
                method: 'DELETE',
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                this.showMessage('✅ Товар удален!', 'success');
                this.loadProducts();
            } else {
                alert('Ошибка удаления');
            }
        } catch (error) {
            alert('Ошибка: ' + error.message);
        }
    }

    // КАТЕГОРИИ
    addCategory() {
        this.editCategory(null);
    }

    editCategory(id) {
        this.editingId = id;
        this.editingType = 'category';
        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${id ? '📝 Редактирование категории' : '➕ Новая категория'}</h2>
                    <button class="modal-close-btn" onclick="this.closest('.admin-modal').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <form id="categoryForm">
                        <div class="form-group">
                            <label>Название *</label>
                            <input type="text" id="catName" required>
                        </div>
                        <div class="form-group">
                            <label>Описание</label>
                            <textarea id="catDesc"></textarea>
                        </div>
                        <div class="form-group">
                            <label>URL изображения</label>
                            <input type="text" id="catImage">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-cancel" onclick="this.closest('.admin-modal').remove()">Отмена</button>
                    <button class="btn btn-primary" onclick="adminPanel.saveCategoryData()">💾 Сохранить</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Загружаем данные если редактируем существующую категорию
        if (id) {
            fetch(`/api/admin/categories/${id}`)
                .then(r => {
                    if (!r.ok) throw new Error(`HTTP ${r.status}`);
                    return r.json();
                })
                    .then(data => {
                    const cat = data.category;
                    document.getElementById('catName').value = cat.name;
                    document.getElementById('catDesc').value = cat.description || '';
                    document.getElementById('catImage').value = cat.image_url || '';
                })
                .catch(error => {
                    console.error('Ошибка загрузки категории:', error);
                    alert('Ошибка загрузки категории');
                });
        }
    }

    async saveCategoryData(id) {
        const name = document.getElementById('catName').value;
        const description = document.getElementById('catDesc').value;
        const image_url = document.getElementById('catImage').value;

        if (!name) {
            alert('Название категории обязательно');
            return;
        }

        try {
            const endpoint = this.editingId ? `/api/admin/categories/${this.editingId}` : '/api/admin/categories';
            const method = this.editingId ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...authManager.getAuthHeaders()
                },
                body: JSON.stringify({ name, description, image_url })
            });

            if (response.ok) {
                this.showMessage('✅ Категория сохранена!', 'success');
                document.querySelector('.admin-modal')?.remove();
                this.loadCategories();
            } else {
                const err = await response.json();
                alert('Ошибка: ' + (err.error || 'Неизвестная ошибка'));
            }
        } catch (error) {
            alert('Ошибка: ' + error.message);
        }
    }

    async deleteCategory(id) {
        if (!confirm('Удалить категорию?')) return;

        try {
            const response = await fetch(`/api/admin/categories/${id}`, {
                method: 'DELETE',
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                this.showMessage('✅ Категория удалена!', 'success');
                this.loadCategories();
            }
        } catch (error) {
            alert('Ошибка: ' + error.message);
        }
    }

    // КОЛЛЕКЦИИ
    addCollection() {
        this.editCollection(null);
    }

    editCollection(id) {
        this.editingId = id;
        this.editingType = 'collection';
        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${id ? '🎨 Редактирование коллекции' : '🎨 Новая коллекция'}</h2>
                    <button class="modal-close-btn" onclick="this.closest('.admin-modal').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <form id="collectionForm">
                        <div class="form-group">
                            <label>Название *</label>
                            <input type="text" id="colName" required>
                        </div>
                        <div class="form-group">
                            <label>Описание</label>
                            <textarea id="colDesc"></textarea>
                        </div>
                        <div class="form-group">
                            <label>URL изображения</label>
                            <input type="text" id="colImage">
                            <button type="button" class="btn btn-secondary btn-small" onclick="adminPanel.uploadCollectionImage()">📤 Загрузить</button>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-cancel" onclick="this.closest('.admin-modal').remove()">Отмена</button>
                    <button class="btn btn-primary" onclick="adminPanel.saveCollectionData()">💾 Сохранить</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Загружаем данные если редактируем существующую коллекцию
        if (id) {
            fetch(`/api/admin/collections/${id}`)
                .then(r => {
                    if (!r.ok) throw new Error(`HTTP ${r.status}`);
                    return r.json();
                })
                .then(data => {
                    const col = data.collection;
                    document.getElementById('colName').value = col.name;
                    document.getElementById('colDesc').value = col.description || '';
                    document.getElementById('colImage').value = col.image_url || '';
                })
                .catch(error => {
                    console.error('Ошибка загрузки коллекции:', error);
                    alert('Ошибка загрузки коллекции');
                });
        }
    }

    async saveCollectionData(id) {
        const name = document.getElementById('colName').value;
        const description = document.getElementById('colDesc').value;
        const image_url = document.getElementById('colImage').value;

        if (!name) {
            alert('Название коллекции обязательно');
            return;
        }

        try {
            const endpoint = this.editingId ? `/api/admin/collections/${this.editingId}` : '/api/admin/collections';
            const method = this.editingId ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...authManager.getAuthHeaders()
                },
                body: JSON.stringify({ name, description, image_url })
            });

            if (response.ok) {
                this.showMessage('✅ Коллекция сохранена!', 'success');
                document.querySelector('.admin-modal')?.remove();
                this.loadCollections();
            } else {
                const err = await response.json();
                alert('Ошибка: ' + (err.error || 'Неизвестная ошибка'));
            }
        } catch (error) {
            alert('Ошибка: ' + error.message);
        }
    }

    async deleteCollection(id) {
        if (!confirm('Удалить коллекцию?')) return;

        try {
            const response = await fetch(`/api/admin/collections/${id}`, {
                method: 'DELETE',
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                this.showMessage('✅ Коллекция удалена!', 'success');
                this.loadCollections();
            }
        } catch (error) {
            alert('Ошибка: ' + error.message);
        }
    }

    async uploadCollectionImage() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('image', file);

            try {
                const response = await fetch('/api/admin/upload-collection-image', {
                    method: 'POST',
                    headers: authManager.getAuthHeaders(),
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    document.getElementById('colImage').value = data.imageUrl;
                    this.showMessage('✅ Изображение загружено!', 'success');
                } else {
                    const err = await response.json();
                    alert('Ошибка загрузки: ' + (err.error || 'Неизвестная ошибка'));
                }
            } catch (error) {
                alert('Ошибка загрузки: ' + error.message);
            }
        };
        input.click();
    }

    // ПОМОЩНИКИ

    showMessage(text, type = 'success') {
        const box = document.createElement('div');
        box.className = `message-box ${type}`;
        box.innerHTML = `
            <span class="message-icon">${type === 'success' ? '✅' : '❌'}</span>
            <span class="message-text">${text}</span>
        `;
        document.body.appendChild(box);

        setTimeout(() => box.remove(), 3000);
    }

    setupEventListeners() {
        console.log('✅ Админ-панель инициализирована');
    }
}

// Инициализация
let adminPanel = new AdminPanelModern();
window.adminManager = adminPanel;
