const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'linomello-secret-key-2024';
const YANDEX_API_KEY = process.env.YANDEX_API_KEY || '';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = path.join(__dirname, 'client', 'images', 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'img-' + uniqueSuffix + ext);
    }
});

const productStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = path.join(__dirname, 'client', 'images', 'products');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'product-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase()); 
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Только изображения разрешены!'));
        }
    }
});

const uploadProduct = multer({ 
    storage: productStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase()); 
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Только изображения разрешены!'));
        }
    }
});

// Путь к базе данных
const dbPath = path.join(__dirname, 'database', 'furniture.db');
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Инициализация базы данных
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Ошибка подключения к базе данных:', err.message);
    } else {
        console.log('✅ Подключение к SQLite базе данных установлено');
        initializeDatabase();
    }
});

function initializeDatabase() {
    const createTablesSQL = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            phone VARCHAR(20),
            role VARCHAR(50) DEFAULT 'customer',
            avatar_url VARCHAR(500),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            image_url VARCHAR(500),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS collections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            image_url VARCHAR(500),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            old_price DECIMAL(10,2),
            category_id INTEGER,
            collection_id INTEGER,
            material VARCHAR(100),
            dimensions VARCHAR(100),
            weight DECIMAL(8,2),
            image_url VARCHAR(500),
            gallery TEXT,
            stock_quantity INTEGER DEFAULT 0,
            is_featured BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id),
            FOREIGN KEY (collection_id) REFERENCES collections(id)
        );

        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            total_amount DECIMAL(10,2) NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            shipping_address TEXT NOT NULL,
            customer_notes TEXT,
            admin_notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            comment TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS wishlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, product_id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        );

        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
        CREATE INDEX IF NOT EXISTS idx_products_collection ON products(collection_id);
        CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
        CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
        CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
        CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);
        CREATE INDEX IF NOT EXISTS idx_wishlist_product ON wishlist(product_id);
    `;

    db.exec(createTablesSQL, (err) => {
        if (err) {
            console.error('Ошибка создания таблиц:', err.message);
        } else {
            console.log('✅ Таблицы созданы или уже существуют');
            createInitialData();
            assignMissingProductImages((err, count) => {
                if (err) {
                    console.error('Ошибка автоматического распределения изображений при инициализации:', err.message);
                } else if (count > 0) {
                    console.log(`✅ Автоматически назначено изображений для ${count} товаров`);
                }
            });
        }
    });
}

async function createInitialData() {
    db.get('SELECT COUNT(*) as count FROM categories', async (err, row) => {
        if (err) return;
        
        if (row.count === 0) {
            console.log('📦 Создание начальных данных...');

            db.run(`
                INSERT INTO categories (name, description, image_url) VALUES 
                ('Диваны', 'Эксклюзивные диваны ручной работы', '/images/categories/sofas.jpg'),
                ('Кресла', 'Комфортные кресла для гостиной', '/images/categories/armchairs.jpg'),
                ('Столы', 'Обеденные и кофейные столы', '/images/categories/tables.jpg'),
                ('Стулья', 'Элегантные стулья для столовой', '/images/categories/chairs.jpg'),
                ('Кровати', 'Роскошные спальные гарнитуры', '/images/categories/beds.jpg'),
                ('Шкафы', 'Вместительные системы хранения', '/images/categories/wardrobes.jpg')
            `);

            db.run(`
                INSERT INTO collections (name, description, image_url) VALUES 
                ('Милан', 'Современная классика с итальянским шиком', '/images/collections/milan.jpg'),
                ('Флоренция', 'Элегантность и утонченность', '/images/collections/florence.jpg'),
                ('Венеция', 'Роскошь в деталях', '/images/collections/venice.jpg'),
                ('Неаполь', 'Средиземноморский шарм', '/images/collections/naples.jpg'),
                ('Минимализм', 'Лаконичный дизайн, максимальный комфорт. Функциональная мебель без лишних деталей', '/images/collections/minimalism.jpg')
            `);

            setTimeout(() => {
                db.run(`
                    INSERT INTO products (name, description, price, old_price, category_id, collection_id, material, dimensions, image_url, is_featured) VALUES 
                    ('Диван "Милан"', 'Роскошный трехместный диван с ручной стежкой. Изготовлен из натуральной кожи премиум-класса.', 245000, 289000, 1, 1, 'Натуральная кожа, Массив ореха', '220x95x85 см', '/images/products/39k5spm8xks5bmoqa10g0cbox3285ajl.jpg', 1),
                    ('Кресло "Флоренция"', 'Элегантное кресло с резными ножками. Идеально для чтения и отдыха.', 89000, 99000, 2, 2, 'Шелк, Массив вишни', '85x95x105 см', '/images/products/666x444_85.webp', 1),
                    ('Обеденный стол "Венеция"', 'Массивный стол из цельного куска мрамора на бронзовом основании.', 420000, 450000, 3, 3, 'Мрамор, Бронза', '180x90x75 см', '/images/products/dc3pjqchb3q8qzxjs5w0lfmb5o1kd3rz.jpg', 1),
                    ('Стул "Неаполь"', 'Винтажный стул с гобеленовой обивкой. Ручная резьба по дереву.', 45000, 52000, 4, 4, 'Гобелен, Массив дуба', '45x55x95 см', '/images/products/edt31gne3oqv6g61n3y9n9fjoph1ahoi.jpg', 1),
                    ('Кровать "Милан"', 'Царская кровать с высоким изголовьем. Роскошная стеганая обивка.', 320000, 350000, 5, 1, 'Бархат, Массив ореха', '200x180x150 см', '/images/products/hg9xt2d2q3qkvc7chizbvk254fqhx91o.jpg', 1),
                    ('Гардероб "Флоренция"', 'Вместительный гардероб с зеркальными фасадами. Система подсветки.', 280000, 310000, 6, 2, 'Шпон ореха, Зеркало', '240x60x220 см', '/images/products/iszc0qdmv6pm5r9onxca58w2pfpwpv81.jpg', 1),
                    ('Диван "Минимум"', 'Лаконичный диван на металлических ножках. Светлая льняная обивка, просторные подушки.', 135000, 159000, 1, 5, 'Лен, Металл, Фанера', '210x90x80 см', '/images/products/lvbazwd0lgadgsxbncb3e1mrzv3s79vh.jpg', 1),
                    ('Кресло "Гармония"', 'Компактное кресло с деревянным каркасом. Идеально для небольших помещений.', 52000, 65000, 2, 5, 'Дуб, Хлопок', '75x85x85 см', '/images/products/mnvfvfk614j2fqpg5sukgd57rg3d4m3n.jpg', 1),
                    ('Стол кофейный "Простота"', 'Мобильный столик из светлого дерева. Минималистичный дизайн, практичность.', 28000, 35000, 3, 5, 'Ясень, Металл', '120x60x45 см', '/images/products/on4vdfkg04bgt3fvbvds13nljh51pb9v.jpg', 1),
                    ('Стул "Норд"', 'Скандинавский стул с прямыми линиями. Удобное сиденье, прочная конструкция.', 18000, 22000, 4, 5, 'Береза, Текстиль', '45x50x85 см', '/images/products/oufh7t24i81to0yxdd02fap3dqjjy7y7.jpg', 1),
                    ('Кровать "Zen"', 'Низкая платформа-кровать. Деревянный каркас, никаких лишних деталей.', 185000, 220000, 5, 5, 'Дуб натуральный', '200x180x35 см', '/images/products/q59j0pkwl5morf0gqtt550y0pqp0mcio.jpg', 1),
                    ('Шкаф "Минимал"', 'Модульный шкаф-купе с белыми фасадами. Максимум пространства, минимум места.', 165000, 195000, 6, 5, 'ДСП, Зеркало', '240x50x200 см', '/images/products/r0b5o9d7fykq97nsju2q5n7arwyimxkm.jpg', 1),
                    ('Софа "Мягкость"', 'Элегантная двухместная софа с роскошной обивкой. Удобная и стильная.', 198000, 245000, 1, 2, 'Бархат, Массив ореха', '190x85x80 см', '/images/products/sush17bixqbtif8r749g90qi4x7wgqgd.jpg', 1),
                    ('Кресло-качалка "Покой"', 'Классическое кресло-качалка с деревянным каркасом. Идеально для отдыха.', 75000, 89000, 2, 3, 'Красное дерево, Текстиль', '70x80x100 см', '/images/products/vvds8w7jyqvz8sf2x324zhdvgdnb5gey.jpg', 1),
                    ('Обеденный стол "Люкс"', 'Огромный обеденный стол на 10 персон. Сделан из цельного дерева.', 550000, 650000, 3, 1, 'Массив дуба, Металл', '240x120x75 см', '/images/products/39k5spm8xks5bmoqa10g0cbox3285ajl.jpg', 1),
                    ('Стул "Классик"', 'Классический деревянный стул с мягкой спинкой. Украшение любого интерьера.', 35000, 42000, 4, 2, 'Массив дуба, Кожа', '45x50x90 см', '/images/products/666x444_85.webp', 1),
                    ('Кровать "Роскошь"', 'Огромная кровать с массивным резным изголовьем. Премиум качество.', 450000, 520000, 5, 2, 'Массив красного дерева, Шелк', '220x200x160 см', '/images/products/dc3pjqchb3q8qzxjs5w0lfmb5o1kd3rz.jpg', 1)
                `);
            }, 100);
        }
    });

    db.get('SELECT COUNT(*) as count FROM users', async (err, row) => {
        if (err) return;
        
        if (row.count === 0) {
            console.log('👤 Создание тестовых пользователей...');
            
            const adminPassword = await bcrypt.hash('admin123', 10);
            const userPassword = await bcrypt.hash('user123', 10);
            
            db.run(
                `INSERT INTO users (email, password, first_name, last_name, phone, role, avatar_url) VALUES 
                (?, ?, ?, ?, ?, ?, ?),
                (?, ?, ?, ?, ?, ?, ?)`,
                [
                    'admin@linomello.ru', adminPassword, 'Анна', 'Иванова', '+7 (999) 123-45-67', 'admin', '/images/team/anna.jpg',
                    'user@example.com', userPassword, 'Иван', 'Петров', '+7 (999) 987-65-43', 'customer', '/images/team/ivan.jpg'
                ],
                function(err) {
                    if (err) {
                        console.error('Ошибка создания пользователей:', err);
                    } else {
                        console.log('✅ Тестовые пользователи созданы');
                        console.log('   Админ: admin@linomello.ru / admin123');
                        console.log('   Пользователь: user@example.com / user123');
                    }
                }
            );
        }
    });
}

function createAutoImageUrl(name, collection) {
    const promptText = [name, collection].filter(Boolean).join(' ');
    const safeText = encodeURIComponent(promptText.replace(/[^a-zA-Z0-9а-яА-ЯёЁ ]/g, '').trim().slice(0, 50).replace(/\s+/g, '+')) || 'Linomello';
    return `https://via.placeholder.com/800x500/9bbc22/243500?text=${safeText}`;
}

async function enrichProductImage(product) {
    if (!product) return product;
    if (!product.image_url || product.image_url.trim() === '') {
        const savedUrl = await downloadAndSaveProductImage(product);
        return {
            ...product,
            image_url: savedUrl || createAutoImageUrl(product.name, product.collection_name)
        };
    }
    return product;
}

async function downloadAndSaveProductImage(product) {
    try {
        const url = await downloadImageBySearch(`мебель ${product.name}`, product.id);
        await new Promise((resolve, reject) => {
            db.run('UPDATE products SET image_url = ? WHERE id = ?', [url, product.id], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
        return url;
    } catch (error) {
        console.error(`Ошибка сохранения изображения для товара ${product.id}:`, error.message);
        return null;
    }
}

function assignMissingProductImages(callback) {
    const query = `SELECT p.id, p.name, col.name as collection_name, p.image_url FROM products p LEFT JOIN collections col ON p.collection_id = col.id WHERE p.image_url IS NULL OR TRIM(p.image_url) = ''`;
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Ошибка при поиске товаров без изображений:', err.message);
            if (typeof callback === 'function') callback(err);
            return;
        }

        if (!rows || rows.length === 0) {
            console.log('✅ Нет товаров без изображений.');
            if (typeof callback === 'function') callback(null, 0);
            return;
        }

        const updatedCount = { count: 0 };
        rows.forEach(async row => {
            try {
                const savedUrl = await downloadImageBySearch(`мебель ${row.name}`, row.id);
                if (savedUrl) {
                    db.run('UPDATE products SET image_url = ? WHERE id = ?', [savedUrl, row.id], (updateErr) => {
                        if (updateErr) {
                            console.error('Ошибка при обновлении изображения товара:', updateErr.message);
                        } else {
                            updatedCount.count += 1;
                        }
                    });
                }
            } catch (downloadErr) {
                console.error(`Ошибка автоматической загрузки изображения для товара ${row.id}:`, downloadErr.message);
            }
        });

        setTimeout(() => {
            if (typeof callback === 'function') callback(null, updatedCount.count);
        }, 1000);
    });
}

app.post('/api/admin/products/auto-fill-images', authenticateToken, requireAdmin, (req, res) => {
    assignMissingProductImages((err, updatedCount) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка при автоматическом назначении изображений' });
        }
        res.json({ message: `Автоматически назначено изображений для ${updatedCount} товаров`, assigned: updatedCount });
    });
});

// Middleware для проверки JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Токен доступа отсутствует' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Недействительный токен' });
        }
        req.user = user;
        next();
    });
}

function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Недостаточно прав' });
    }
    next();
}

// ============== HEALTH CHECK ==============

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), server: 'Linomello OK' });
});

// ============== FILE UPLOAD ==============
// (Storage already configured above)

async function downloadImageBySearch(query, productId) {
    const imageUrl = `https://source.unsplash.com/featured/800x600?${encodeURIComponent(query)}`;
    const response = await axios.get(imageUrl, { responseType: 'stream', maxRedirects: 5 });

    const contentType = response.headers['content-type'] || '';
    let ext = '.jpg';
    if (contentType.includes('png')) ext = '.png';
    else if (contentType.includes('gif')) ext = '.gif';
    else if (contentType.includes('webp')) ext = '.webp';

    const filename = `ai-${productId}-${Date.now()}${ext}`;
    const uploadDir = path.join(__dirname, 'client', 'images', 'uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });

    return `/images/uploads/${filename}`;
}

app.post('/api/admin/products/auto-upload-images', authenticateToken, requireAdmin, async (req, res) => {
    db.all('SELECT id, name FROM products WHERE image_url IS NULL OR image_url = ""', async (err, products) => {
        if (err) {
            console.error('Ошибка получения товаров для авто-загрузки изображений:', err.message);
            return res.status(500).json({ error: 'Ошибка базы данных' });
        }

        if (!products || products.length === 0) {
            return res.json({ message: 'Нет товаров без изображений для загрузки', assigned: 0 });
        }

        let assigned = 0;
        for (const product of products) {
            try {
                const query = `мебель ${product.name}`;
                const savedUrl = await downloadImageBySearch(query, product.id);
                await new Promise((resolve, reject) => {
                    db.run('UPDATE products SET image_url = ? WHERE id = ?', [savedUrl, product.id], function (updateErr) {
                        if (updateErr) return reject(updateErr);
                        resolve();
                    });
                });
                assigned += 1;
                console.log(`📸 Изображение для товара ${product.id} сохранено как ${savedUrl}`);
            } catch (downloadError) {
                console.error(`Ошибка загрузки изображения для товара ${product.id}:`, downloadError.message);
            }
        }

        res.json({
            message: `ИИ сама загрузила изображения для ${assigned} товаров`,
            assigned: assigned
        });
    });
});

app.post('/api/upload', authenticateToken, requireAdmin, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Файл не загружен' });
    }

    const imageUrl = `/images/uploads/${req.file.filename}`;
    console.log('📸 Изображение загружено:', imageUrl);

    res.json({
        success: true,
        url: imageUrl,
        filename: req.file.filename,
        size: req.file.size
    });
});

app.post('/api/admin/upload-product-image', authenticateToken, requireAdmin, uploadProduct.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Файл не загружен' });
    }

    const imageUrl = `/images/products/${req.file.filename}`;
    console.log('📸 Изображение товара загружено:', imageUrl);

    res.json({
        success: true,
        url: imageUrl,
        filename: req.file.filename,
        size: req.file.size
    });
});

// Обработка ошибок multer
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Файл слишком большой. Максимум 5MB' });
        }
        return res.status(400).json({ error: 'Ошибка загрузки файла: ' + err.message });
    } else if (err) {
        return res.status(400).json({ error: err.message || 'Ошибка загрузки файла' });
    }
    next();
});

// ============== АУТЕНТИФИКАЦИЯ ==============

app.post('/api/auth/register', async (req, res) => {
    const { email, password, firstName, lastName, phone } = req.body;

    // Валидация входных данных
    if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
    }

    if (!email.includes('@')) {
        return res.status(400).json({ error: 'Введите корректный email' });
    }

    try {
        // Проверка уникальности email
        db.get('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email], async (err, row) => {
            if (err) {
                console.error('Ошибка проверки email:', err);
                return res.status(500).json({ error: 'Ошибка базы данных' });
            }
            
            if (row) {
                return res.status(400).json({ error: 'Этот email уже зарегистрирован' });
            }

            try {
                // Хешируем пароль
                const hashedPassword = await bcrypt.hash(password, 10);

                // Вставляем нового пользователя в БД
                db.run(
                    `INSERT INTO users (email, password, first_name, last_name, phone, role, created_at, updated_at) 
                     VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                    [email.toLowerCase(), hashedPassword, firstName, lastName, phone || '', 'customer'],
                    function(err) {
                        if (err) {
                            console.error('Ошибка создания пользователя:', err);
                            return res.status(500).json({ error: 'Ошибка создания пользователя' });
                        }

                        const userId = this.lastID;

                        // Создаём JWT токен
                        const token = jwt.sign(
                            { 
                                userId: userId, 
                                email: email.toLowerCase(), 
                                firstName, 
                                lastName, 
                                role: 'customer' 
                            },
                            JWT_SECRET,
                            { expiresIn: '24h' }
                        );

                        console.log('✅ Новый пользователь зарегистрирован:', email, '(ID:', userId, ')');

                        res.json({
                            token,
                            user: { 
                                id: userId, 
                                email: email.toLowerCase(), 
                                firstName, 
                                lastName, 
                                phone: phone || '', 
                                role: 'customer' 
                            }
                        });
                    }
                );
            } catch (hashError) {
                console.error('Ошибка хеширования пароля:', hashError);
                res.status(500).json({ error: 'Ошибка сервера при обработке пароля' });
            }
        });
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    db.get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email], async (err, user) => {
        if (err) {
            console.error('Ошибка БД при логине:', err);
            return res.status(500).json({ error: 'Ошибка базы данных' });
        }
        
        if (!user) {
            return res.status(400).json({ error: 'Неверный email или пароль' });
        }

        try {
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(400).json({ error: 'Неверный email или пароль' });
            }

            const token = jwt.sign(
                { 
                    userId: user.id, 
                    email: user.email, 
                    firstName: user.first_name, 
                    lastName: user.last_name, 
                    role: user.role 
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            console.log('✅ Пользователь вошел:', email, '(ID:', user.id, ')');

            res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    phone: user.phone,
                    role: user.role,
                    avatar_url: user.avatar_url
                }
            });
        } catch (error) {
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });
});

// ============== ПРОДУКТЫ ==============

app.get('/api/products', async (req, res) => {
    const { category, collection, featured } = req.query;
    
    let query = `
        SELECT p.*, c.name as category_name, col.name as collection_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        LEFT JOIN collections col ON p.collection_id = col.id 
        WHERE 1=1
    `;
    let params = [];

    if (category) {
        const isNumeric = /^\d+$/.test(category);
        query += isNumeric ? ' AND c.id = ?' : ' AND c.name = ?';
        params.push(isNumeric ? parseInt(category, 10) : category);
    }
    if (collection) {
        const isNumeric = /^\d+$/.test(collection);
        query += isNumeric ? ' AND col.id = ?' : ' AND col.name = ?';
        params.push(isNumeric ? parseInt(collection, 10) : collection);
    }
    if (featured === 'true') {
        query += ' AND p.is_featured = 1';
    }

    query += ' ORDER BY p.created_at DESC';

    db.all(query, params, async (err, products) => {
        if (err) return res.status(500).json({ error: 'Ошибка базы данных' });
        const enrichedProducts = await Promise.all(products.map(enrichProductImage));
        res.json({ products: enrichedProducts });
    });
});

app.get('/api/products/:id', (req, res) => {
    const { id } = req.params;

    db.get(
        `SELECT p.*, c.name as category_name, col.name as collection_name 
         FROM products p 
         LEFT JOIN categories c ON p.category_id = c.id 
         LEFT JOIN collections col ON p.collection_id = col.id 
         WHERE p.id = ?`,
        [id],
        async (err, product) => {
            if (err) return res.status(500).json({ error: 'Ошибка базы данных' });
            if (!product) return res.status(404).json({ error: 'Товар не найден' });

            const enrichedProduct = await enrichProductImage(product);

            db.all(
                `SELECT r.*, u.first_name, u.last_name 
                 FROM reviews r 
                 JOIN users u ON r.user_id = u.id 
                 WHERE r.product_id = ? 
                 ORDER BY r.created_at DESC`,
                [id],
                (err, reviews) => {
                    if (err) return res.status(500).json({ error: 'Ошибка базы данных' });
                    res.json({ product: { ...enrichedProduct, reviews: reviews || [] } });
                }
            );
        }
    );
});

// ============== КАТЕГОРИИ И КОЛЛЕКЦИИ ==============

app.get('/api/categories', (req, res) => {
    db.all('SELECT * FROM categories ORDER BY name', (err, categories) => {
        if (err) return res.status(500).json({ error: 'Ошибка базы данных' });
        res.json({ categories });
    });
});

app.get('/api/collections', (req, res) => {
    db.all('SELECT * FROM collections ORDER BY name', (err, collections) => {
        if (err) return res.status(500).json({ error: 'Ошибка базы данных' });
        res.json({ collections });
    });
});

app.get('/api/collections/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM collections WHERE id = ? OR name = ?', [id, id], (err, collection) => {
        if (err) return res.status(500).json({ error: 'Ошибка базы данных' });
        if (!collection) return res.status(404).json({ error: 'Коллекция не найдена' });
        res.json({ collection });
    });
});

// ============== ПОЛЬЗОВАТЕЛИ ==============

app.get('/api/users/profile', authenticateToken, (req, res) => {
    db.get(
        'SELECT id, email, first_name, last_name, phone, role, avatar_url, created_at FROM users WHERE id = ?',
        [req.user.userId],
        (err, user) => {
            if (err) return res.status(500).json({ error: 'Ошибка базы данных' });
            if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
            res.json({ user });
        }
    );
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
    db.get(
        'SELECT id, email, first_name, last_name, phone, role, avatar_url, created_at FROM users WHERE id = ?',
        [req.user.userId],
        (err, user) => {
            if (err) return res.status(500).json({ error: 'Ошибка базы данных' });
            if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
            res.json({ user });
        }
    );
});

app.put('/api/users/profile', authenticateToken, (req, res) => {
    const { firstName, lastName, phone } = req.body;

    if (!firstName || !lastName) {
        return res.status(400).json({ error: 'Имя и фамилия обязательны' });
    }

    db.run(
        'UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?',
        [firstName, lastName, phone, req.user.userId],
        function(err) {
            if (err) return res.status(500).json({ error: 'Ошибка обновления' });

            const updatedToken = jwt.sign(
                {
                    userId: req.user.userId,
                    email: req.user.email,
                    firstName,
                    lastName,
                    role: req.user.role
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Профиль обновлен',
                token: updatedToken,
                user: {
                    id: req.user.userId,
                    email: req.user.email,
                    firstName,
                    lastName,
                    phone: phone || '',
                    role: req.user.role
                }
            });
        }
    );
});

// ============== ЗАКАЗЫ ==============

app.get('/api/orders', authenticateToken, (req, res) => {
    db.all(
        `SELECT o.*, COUNT(oi.id) as items_count 
         FROM orders o 
         LEFT JOIN order_items oi ON o.id = oi.order_id 
         WHERE o.user_id = ? 
         GROUP BY o.id 
         ORDER BY o.created_at DESC`,
        [req.user.userId],
        (err, orders) => {
            if (err) return res.status(500).json({ error: 'Ошибка базы данных' });
            res.json({ orders });
        }
    );
});

app.post('/api/orders', authenticateToken, (req, res) => {
    const { items, shippingAddress, customerNotes, shippingCost = 0 } = req.body;

    if (!items || !items.length) return res.status(400).json({ error: 'Корзина пуста' });
    if (!shippingAddress) return res.status(400).json({ error: 'Адрес доставки обязателен' });

    const shippingCostValue = parseFloat(shippingCost) || 0;
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalAmount = subtotal + shippingCostValue;

    db.serialize(() => {
        db.run(
            `INSERT INTO orders (user_id, total_amount, shipping_address, customer_notes) VALUES (?, ?, ?, ?)`,
            [req.user.userId, totalAmount, shippingAddress, customerNotes || ''],
            function(err) {
                if (err) return res.status(500).json({ error: 'Ошибка создания заказа' });

                const orderId = this.lastID;
                items.forEach(item => {
                    db.run(
                        `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
                        [orderId, item.productId, item.quantity, item.price]
                    );
                });

                res.json({ message: 'Заказ создан', orderId });
            }
        );
    });
});

// ============== ОТЗЫВЫ ==============

// Получить отзывы для продукта
app.get('/api/products/:productId/reviews', (req, res) => {
    const { productId } = req.params;
    
    db.all(
        `SELECT r.id, r.rating, r.comment, r.created_at, u.first_name, u.last_name
         FROM reviews r
         JOIN users u ON r.user_id = u.id
         WHERE r.product_id = ?
         ORDER BY r.created_at DESC`,
        [productId],
        (err, reviews) => {
            if (err) return res.status(500).json({ error: 'Ошибка БД' });
            res.json({ reviews: reviews || [] });
        }
    );
});

// Создать отзыв
app.post('/api/products/:productId/reviews', authenticateToken, async (req, res) => {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Рейтинг должен быть от 1 до 5' });
    }

    if (!comment || comment.trim().length === 0) {
        return res.status(400).json({ error: 'Комментарий не может быть пустым' });
    }

    // Проверяем, купил ли пользователь этот продукт
    db.get(
        `SELECT oi.id FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         WHERE o.user_id = ? AND oi.product_id = ? AND o.status != 'cancelled'`,
        [req.user.userId, productId],
        (err, row) => {
            if (err) return res.status(500).json({ error: 'Ошибка БД' });
            
            if (!row) {
                return res.status(403).json({ error: 'Вы можете оставить отзыв только на купленный товар' });
            }

            // Проверяем, не оставил ли уже отзыв
            db.get(
                `SELECT id FROM reviews WHERE user_id = ? AND product_id = ?`,
                [req.user.userId, productId],
                (err, existingReview) => {
                    if (err) return res.status(500).json({ error: 'Ошибка БД' });

                    if (existingReview) {
                        // Обновляем существующий отзыв
                        db.run(
                            `UPDATE reviews SET rating = ?, comment = ? WHERE user_id = ? AND product_id = ?`,
                            [rating, comment, req.user.userId, productId],
                            function(err) {
                                if (err) return res.status(500).json({ error: 'Ошибка обновления отзыва' });
                                res.json({ message: 'Отзыв обновлен' });
                            }
                        );
                    } else {
                        // Создаем новый отзыв
                        db.run(
                            `INSERT INTO reviews (user_id, product_id, rating, comment, created_at)
                             VALUES (?, ?, ?, ?, datetime('now'))`,
                            [req.user.userId, productId, rating, comment],
                            function(err) {
                                if (err) return res.status(500).json({ error: 'Ошибка создания отзыва' });
                                res.json({ message: 'Отзыв создан', reviewId: this.lastID });
                            }
                        );
                    }
                }
            );
        }
    );
});

// ============== ИЗБРАННОЕ (WISHLIST) ==============

// Получить избранное пользователя
app.get('/api/wishlist', authenticateToken, (req, res) => {
    db.all(
        `SELECT p.* FROM wishlist w
         JOIN products p ON w.product_id = p.id
         WHERE w.user_id = ?
         ORDER BY w.added_at DESC`,
        [req.user.userId],
        (err, products) => {
            if (err) return res.status(500).json({ error: 'Ошибка БД' });
            res.json({ wishlist: products || [] });
        }
    );
});

// Добавить в избранное
app.post('/api/wishlist/:productId', authenticateToken, (req, res) => {
    const { productId } = req.params;

    db.run(
        `INSERT OR IGNORE INTO wishlist (user_id, product_id, added_at)
         VALUES (?, ?, datetime('now'))`,
        [req.user.userId, productId],
        function(err) {
            if (err) return res.status(500).json({ error: 'Ошибка добавления в избранное' });
            res.json({ message: 'Добавлено в избранное' });
        }
    );
});

// Удалить из избранного
app.delete('/api/wishlist/:productId', authenticateToken, (req, res) => {
    const { productId } = req.params;

    db.run(
        `DELETE FROM wishlist WHERE user_id = ? AND product_id = ?`,
        [req.user.userId, productId],
        function(err) {
            if (err) return res.status(500).json({ error: 'Ошибка удаления из избранного' });
            res.json({ message: 'Удалено из избранного' });
        }
    );
});

// Проверить, в избранном ли продукт
app.get('/api/wishlist/:productId/check', authenticateToken, (req, res) => {
    const { productId } = req.params;

    db.get(
        `SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?`,
        [req.user.userId, productId],
        (err, row) => {
            if (err) return res.status(500).json({ error: 'Ошибка БД' });
            res.json({ inWishlist: !!row });
        }
    );
});

// ============== АДМИН ==============

app.get('/api/admin/stats', authenticateToken, requireAdmin, (req, res) => {
    db.get(`
        SELECT 
            (SELECT COUNT(*) FROM users) as total_users,
            (SELECT COUNT(*) FROM products) as total_products,
            (SELECT COUNT(*) FROM categories) as total_categories,
            (SELECT COUNT(*) FROM collections) as total_collections,
            (SELECT COUNT(*) FROM orders) as total_orders,
            (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
            (SELECT COALESCE(SUM(total_amount), 0) FROM orders) as total_revenue
    `, (err, stats) => {
        if (err) return res.status(500).json({ error: 'Ошибка базы данных' });
        res.json({
            totalUsers: stats.total_users,
            totalProducts: stats.total_products,
            totalCategories: stats.total_categories,
            totalCollections: stats.total_collections,
            totalOrders: stats.total_orders,
            pendingOrders: stats.pending_orders,
            totalRevenue: stats.total_revenue
        });
    });
});

app.get('/api/admin/orders', authenticateToken, requireAdmin, (req, res) => {
    db.all(`
        SELECT o.*, u.first_name, u.last_name, u.email 
        FROM orders o 
        JOIN users u ON o.user_id = u.id 
        ORDER BY o.created_at DESC
    `, (err, orders) => {
        if (err) return res.status(500).json({ error: 'Ошибка базы данных' });
        res.json({ orders });
    });
});

app.put('/api/admin/orders/:id/status', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'production', 'ready', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Неверный статус' });
    }

    db.run('UPDATE orders SET status = ? WHERE id = ?', [status, id], function(err) {
        if (err) return res.status(500).json({ error: 'Ошибка обновления' });
        res.json({ message: 'Статус обновлен' });
    });
});

app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
    db.all('SELECT id, email, first_name, last_name, phone, role, avatar_url, created_at FROM users', (err, users) => {
        if (err) return res.status(500).json({ error: 'Ошибка базы данных' });
        res.json({ users });
    });
});

// ============== АДМИН: ТОВАРЫ ==============

// Получить все товары
app.get('/api/admin/products', authenticateToken, requireAdmin, (req, res) => {
    db.all(`
        SELECT p.*, c.name as category_name, col.name as collection_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        LEFT JOIN collections col ON p.collection_id = col.id 
        ORDER BY p.created_at DESC
    `, async (err, products) => {
        if (err) return res.status(500).json({ error: 'Ошибка базы данных' });
        const enrichedProducts = await Promise.all(products.map(enrichProductImage));
        res.json({ products: enrichedProducts });
    });
});

// Создать новый товар
app.post('/api/admin/products', authenticateToken, requireAdmin, (req, res) => {
    const { name, description, price, old_price, category_id, collection_id, material, dimensions, image_url, is_featured } = req.body;

    if (!name || !price) return res.status(400).json({ error: 'Название и цена обязательны' });

    const finalImageUrl = image_url && image_url.trim() ? image_url : createAutoImageUrl(name, '');

    db.run(
        `INSERT INTO products (name, description, price, old_price, category_id, collection_id, material, dimensions, image_url, is_featured, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [name, description, price, old_price || price, category_id, collection_id, material, dimensions, finalImageUrl, is_featured ? 1 : 0],
        function(err) {
            if (err) return res.status(500).json({ error: 'Ошибка создания товара' });
            res.json({ message: 'Товар создан', productId: this.lastID });
        }
    );
});

// Обновить товар
app.put('/api/admin/products/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { name, description, price, old_price, category_id, collection_id, material, dimensions, image_url, is_featured } = req.body;
    const finalImageUrl = image_url && image_url.trim() ? image_url : createAutoImageUrl(name, '');

    db.run(
        `UPDATE products SET name=?, description=?, price=?, old_price=?, category_id=?, collection_id=?, material=?, dimensions=?, image_url=?, is_featured=? WHERE id=?`,
        [name, description, price, old_price || price, category_id, collection_id, material, dimensions, finalImageUrl, is_featured ? 1 : 0, id],
        function(err) {
            if (err) return res.status(500).json({ error: 'Ошибка обновления товара' });
            if (this.changes === 0) return res.status(404).json({ error: 'Товар не найден' });
            res.json({ message: 'Товар обновлен' });
        }
    );
});

// Удалить товар
app.delete('/api/admin/products/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;

    // Сначала удалим связанные данные
    db.serialize(() => {
        db.run('DELETE FROM order_items WHERE product_id = ?', [id]);
        db.run('DELETE FROM reviews WHERE product_id = ?', [id]);
        db.run('DELETE FROM wishlist WHERE product_id = ?', [id]);
        db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
            if (err) return res.status(500).json({ error: 'Ошибка удаления товара' });
            if (this.changes === 0) return res.status(404).json({ error: 'Товар не найден' });
            res.json({ message: 'Товар удален' });
        });
    });
});

// ============== АДМИН: КАТЕГОРИИ ==============

// Получить все категории
app.get('/api/admin/categories', authenticateToken, requireAdmin, (req, res) => {
    db.all('SELECT * FROM categories ORDER BY name', (err, categories) => {
        if (err) return res.status(500).json({ error: 'Ошибка базы данных' });
        res.json({ categories });
    });
});

// Создать категорию
app.post('/api/admin/categories', authenticateToken, requireAdmin, (req, res) => {
    const { name, description, image_url } = req.body;

    if (!name) return res.status(400).json({ error: 'Название категории обязательно' });

    db.run(
        'INSERT INTO categories (name, description, image_url) VALUES (?, ?, ?)',
        [name, description || '', image_url || ''],
        function(err) {
            if (err) return res.status(500).json({ error: 'Ошибка создания категории' });
            res.json({ message: 'Категория создана', categoryId: this.lastID });
        }
    );
});

// Обновить категорию
app.put('/api/admin/categories/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { name, description, image_url } = req.body;

    db.run(
        'UPDATE categories SET name=?, description=?, image_url=? WHERE id=?',
        [name, description || '', image_url || '', id],
        function(err) {
            if (err) return res.status(500).json({ error: 'Ошибка обновления категории' });
            if (this.changes === 0) return res.status(404).json({ error: 'Категория не найдена' });
            res.json({ message: 'Категория обновлена' });
        }
    );
});

// Удалить категорию
app.delete('/api/admin/categories/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;

    // Проверяем, есть ли товары в этой категории
    db.get('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Ошибка базы данных' });
        if (result.count > 0) {
            return res.status(400).json({ error: 'Невозможно удалить категорию с товарами' });
        }

        db.run('DELETE FROM categories WHERE id = ?', [id], function(err) {
            if (err) return res.status(500).json({ error: 'Ошибка удаления категории' });
            if (this.changes === 0) return res.status(404).json({ error: 'Категория не найдена' });
            res.json({ message: 'Категория удалена' });
        });
    });
});

// ============== АДМИН: КОЛЛЕКЦИИ ==============

// Получить все коллекции
app.get('/api/admin/collections', authenticateToken, requireAdmin, (req, res) => {
    db.all('SELECT * FROM collections ORDER BY name', (err, collections) => {
        if (err) return res.status(500).json({ error: 'Ошибка базы данных' });
        res.json({ collections });
    });
});

// Создать коллекцию
app.post('/api/admin/collections', authenticateToken, requireAdmin, (req, res) => {
    const { name, description, image_url, is_active } = req.body;

    if (!name) return res.status(400).json({ error: 'Название коллекции обязательно' });

    db.run(
        'INSERT INTO collections (name, description, image_url, is_active) VALUES (?, ?, ?, ?)',
        [name, description || '', image_url || '', is_active ? 1 : 0],
        function(err) {
            if (err) return res.status(500).json({ error: 'Ошибка создания коллекции' });
            res.json({ message: 'Коллекция создана', collectionId: this.lastID });
        }
    );
});

// Обновить коллекцию
app.put('/api/admin/collections/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { name, description, image_url, is_active } = req.body;

    db.run(
        'UPDATE collections SET name=?, description=?, image_url=?, is_active=? WHERE id=?',
        [name, description || '', image_url || '', is_active ? 1 : 0, id],
        function(err) {
            if (err) return res.status(500).json({ error: 'Ошибка обновления коллекции' });
            if (this.changes === 0) return res.status(404).json({ error: 'Коллекция не найдена' });
            res.json({ message: 'Коллекция обновлена' });
        }
    );
});

// Удалить коллекцию
app.delete('/api/admin/collections/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;

    // Проверяем, есть ли товары в этой коллекции
    db.get('SELECT COUNT(*) as count FROM products WHERE collection_id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Ошибка базы данных' });
        if (result.count > 0) {
            return res.status(400).json({ error: 'Невозможно удалить коллекцию с товарами' });
        }

        db.run('DELETE FROM collections WHERE id = ?', [id], function(err) {
            if (err) return res.status(500).json({ error: 'Ошибка удаления коллекции' });
            if (this.changes === 0) return res.status(404).json({ error: 'Коллекция не найдена' });
            res.json({ message: 'Коллекция удалена' });
        });
    });
});

// ============== AI БОТ ==============

const BOT_CONTEXT = `
Ты профессиональный AI-ассистент премиум-бренда мебели "Linomello".

О компании:
- Название: Linomello
- Специализация: мебель ручной работы высокого качества
- Материалы: массив дуба, орех, натуральная кожа, итальянские ткани, премиальная фурнитура
- Срок изготовления: 14-30 дней (зависит от сложности)
- Доставка: Москва и МО, сборка и установка включены
- Гарантия: 5 лет на все изделия
- Цены: От 35,000 ₽ до 500,000 ₽ в зависимости от модели
- Рассрочка: Доступна (уточняется у менеджера)

Как отвечать:
1. Будь вежливым и профессиональным
2. Дай ПОЛНЫЙ и РАЗВЕРНУТЫЙ ответ (2-3 предложения минимум)
3. Используй информацию о компании в ответах
4. Если не знаешь точный ответ - предложи уточнить у менеджера
5. Говори только на русском языке
6. Отвечай только на вопросы о мебели, услугах, ценах, доставке, гарантии и оплате

Примеры хороших ответов:
- "Доставка осуществляется по Москве и Московской области. Стоимость рассчитывается индивидуально в зависимости от размера и сложности мебели. Сборка и установка уже включены в стоимость доставки. Обычно доставка происходит в течение 1-3 дней после завершения производства."
- "Мы использует только премиальные материалы - массив дуба и ореха, натуральную кожу и итальянские ткани. Это гарантирует долгий срок службы и красивый внешний вид мебели на протяжении многих лет."

Запомни: Отвечай как реальный консультант, дающий полезную информацию, а не короткие фразы!
`;

function buildBotMessagesText(message, page) {
    return `${BOT_CONTEXT}

Пользователь находится на странице: ${page}

Вопрос клиента: "${message}"

Дай полный и развернутый ответ как профессиональный консультант:`;
}

app.post('/api/bot/message', async (req, res) => {
    const { message, page } = req.body;

    if (!message || message.trim() === '') {
        return res.status(400).json({ error: 'Сообщение не может быть пустым' });
    }

    let responseText = null;
    let provider = 'fallback';

    // Используем Yandex AI
    if (YANDEX_API_KEY) {
        const botContext = buildBotMessagesText(message, page || 'index.html');
        const models = ['gpt-4o-mini', 'gpt-4o'];

        for (const model of models) {
            if (responseText) break;

            try {
                console.log(`🔄 Запрос к Yandex AI (${model})...`);
                console.log(`📝 API Key: ${YANDEX_API_KEY.substring(0, 20)}...`);

                const response = await axios.post(
                    `https://api.generativeai.yandexcloud.net/v1/models/${model}/generate`,
                    {
                        input: botContext,
                        temperature: 0.7,
                        top_p: 0.95,
                        max_output_tokens: 500
                    },
                    {
                        headers: {
                            'Authorization': `Api-Key ${YANDEX_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 30000
                    }
                );

                responseText = response.data?.result?.text
                    || response.data?.output_text
                    || response.data?.generated_text
                    || response.data?.output?.[0]?.content?.text
                    || response.data?.text;

                if (responseText) {
                    provider = `yandex:${model}`;
                    console.log(`✅ ${model} ответил`);
                } else {
                    console.log(`⚠️ ${model}: нет текста в ответе`);
                }
            } catch (error) {
                const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message;
                const status = error.response?.status;

                if (status === 401) {
                    console.error(`❌ ${model}: Unauthorized - invalid Yandex API key`);
                } else if (status === 429) {
                    console.error(`❌ ${model}: Rate limit - ${errorMsg}`);
                } else if (status === 400) {
                    console.error(`❌ ${model}: Bad request - ${errorMsg}`);
                } else {
                    console.error(`❌ ${model} (${status}):`, errorMsg);
                }
            }
        }
    }

    // Fallback если Yandex не сработал
    if (!responseText) {
        console.log('❌ AI service unavailable - no response from Yandex AI');
        responseText = 'Извините, AI сервис временно недоступен. Пожалуйста, попробуйте позже или переформулируйте вопрос.';
        provider = 'error';
    }

    res.json({
        response: responseText,
        suggestions: ['Каталог', 'Цены', 'Доставка', 'Гарантия', 'Контакты'],
        provider: provider,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/admin/product-images', authenticateToken, requireAdmin, (req, res) => {
    const imagesDir = path.join(__dirname, 'client', 'images', 'products');

    fs.readdir(imagesDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Не удалось прочитать папку с изображениями' });
        }

        const images = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file)).map(file => ({
            filename: file,
            url: `/images/products/${file}`
        }));

        res.json({ images });
    });
});

app.get('/api/bot/status', (req, res) => {
    if (YANDEX_API_KEY) {
        return res.json({ status: 'online', provider: 'Yandex AI' });
    }
    res.json({ status: 'offline', provider: 'none', message: 'AI service not configured' });
});

// ============== HEALTH CHECK ==============

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Linomello API работает',
        timestamp: new Date().toISOString()
    });
});

// ============== СТАТИЧЕСКИЕ ФАЙЛЫ ==============

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// ============== ЗАПУСК СЕРВЕРА ==============

app.listen(PORT, () => {
    console.log('\n=================================');
    console.log('🚀 Linomello Server запущен!');
    console.log(`📍 Адрес: http://localhost:${PORT}`);
    console.log('=================================');
    console.log('🤖 AI-консультант: Yandex AI');
    console.log('👤 Тестовые пользователи:' )
    console.log('   Админ: admin@linomello.ru / admin123');
    console.log('   Пользователь: user@example.com / user123');
    console.log('=================================\n');
});