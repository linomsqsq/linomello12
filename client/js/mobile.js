// Mobile Menu Handler
class MobileMenu {
    constructor() {
        this.menuBtn = null;
        this.nav = null;
        this.init();
    }

    init() {
        // На мобильных экранах создаём кнопку меню
        if (window.innerWidth <= 768) {
            this.createMobileMenu();
        }

        // Слушаем изменение размера окна
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768 && !this.menuBtn) {
                this.createMobileMenu();
            } else if (window.innerWidth > 768 && this.menuBtn) {
                this.removeMobileMenu();
            }
        });
    }

    createMobileMenu() {
        const header = document.querySelector('header .container');
        const headerInner = document.querySelector('.header-inner');
        const logo = document.querySelector('.logo');
        const nav = document.querySelector('.nav');

        if (!logo || !nav || !header || !headerInner) return;

        // Создаём кнопку меню
        const menuBtn = document.createElement('button');
        menuBtn.className = 'mobile-menu-btn';
        menuBtn.innerHTML = '<span></span><span></span><span></span>';
        
        // Вставляем кнопку между логотипом и actions
        const actions = document.querySelector('.header-actions');
        if (actions) {
            headerInner.insertBefore(menuBtn, actions);
        }

        this.menuBtn = menuBtn;
        this.nav = nav;

        // Обработчик клика
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMenu();
        });

        // Закрываем меню при клике на ссылку
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                this.closeMenu();
            });
        });

        // Закрываем меню при клике вне его
        document.addEventListener('click', (e) => {
            if (nav.classList.contains('active') && 
                !nav.contains(e.target) && 
                !menuBtn.contains(e.target)) {
                this.closeMenu();
            }
        });
    }

    removeMobileMenu() {
        if (this.menuBtn) {
            this.menuBtn.remove();
            this.menuBtn = null;
        }
        if (this.nav) {
            this.nav.classList.remove('active');
        }
    }

    toggleMenu() {
        if (!this.menuBtn || !this.nav) return;
        
        this.menuBtn.classList.toggle('active');
        this.nav.classList.toggle('active');
    }

    openMenu() {
        if (!this.menuBtn || !this.nav) return;
        
        this.menuBtn.classList.add('active');
        this.nav.classList.add('active');
    }

    closeMenu() {
        if (!this.menuBtn || !this.nav) return;
        
        this.menuBtn.classList.remove('active');
        this.nav.classList.remove('active');
    }
}

// Инициализируем при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.mobileMenu = new MobileMenu();
});
