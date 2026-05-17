class AssistantManager {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.isLoading = false;
        this.init();
    }

    init() {
        this.createWidget();
        this.loadMessages();
        this.setupEventListeners();
    }

    createWidget() {
        const widget = document.createElement('div');
        widget.id = 'assistant-widget';
        widget.className = 'assistant-widget';
        widget.innerHTML = `
            <button class="assistant-toggle" id="assistantToggle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span class="assistant-status"></span>
            </button>
            <div class="assistant-container" id="assistantContainer">
                <div class="assistant-header">
                    <div class="assistant-title">
                        <div class="assistant-avatar">🪑</div>
                        <div class="assistant-info">
                            <h3>Linomello GigaChat</h3>
                            <span class="assistant-status-text">
                                <span class="assistant-status-dot"></span>
                                Всегда онлайн
                            </span>
                        </div>
                    </div>
                    <button class="assistant-close" id="assistantClose">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="assistant-messages" id="assistantMessages">
                    <div class="assistant-welcome">
                        <div class="welcome-icon">🪑</div>
                        <h4>Добро пожаловать!</h4>
                        <p>Я помогу вам подобрать идеальную мебель для вашего дома. Задайте мне любой вопрос!</p>
                        <div class="quick-actions">
                            <button onclick="assistantManager.sendQuickQuestion('Каталог')">Каталог</button>
                            <button onclick="assistantManager.sendQuickQuestion('Цены')">Цены</button>
                            <button onclick="assistantManager.sendQuickQuestion('Доставка')">Доставка</button>
                            <button onclick="assistantManager.sendQuickQuestion('Гарантия')">Гарантия</button>
                        </div>
                    </div>
                </div>
                <div class="assistant-input">
                    <input type="text" id="assistantInput" placeholder="Напишите сообщение..." autocomplete="off">
                    <button class="send-btn" id="sendMessage">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(widget);
    }

    loadMessages() {
        const saved = localStorage.getItem('linomello_assistant_messages');
        if (saved) {
            try {
                this.messages = JSON.parse(saved);
            } catch (e) {
                this.messages = [];
            }
        }
    }

    saveMessages() {
        localStorage.setItem('linomello_assistant_messages', JSON.stringify(this.messages));
    }

    setupEventListeners() {
        const toggle = document.getElementById('assistantToggle');
        const close = document.getElementById('assistantClose');
        const container = document.getElementById('assistantContainer');
        const input = document.getElementById('assistantInput');
        const sendBtn = document.getElementById('sendMessage');

        if (toggle) {
            toggle.addEventListener('click', () => this.toggle());
        }
        if (close) {
            close.addEventListener('click', () => this.close());
        }
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        }
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }
    }

    toggle() {
        this.isOpen = !this.isOpen;
        const container = document.getElementById('assistantContainer');
        const toggle = document.getElementById('assistantToggle');
        
        if (this.isOpen) {
            container.classList.add('active');
            toggle.classList.add('active');
            setTimeout(() => {
                document.getElementById('assistantInput').focus();
            }, 300);
        } else {
            container.classList.remove('active');
            toggle.classList.remove('active');
        }
    }

    close() {
        this.isOpen = false;
        document.getElementById('assistantContainer').classList.remove('active');
    }

    open() {
        if (!this.isOpen) {
            this.isOpen = true;
            const container = document.getElementById('assistantContainer');
            const toggle = document.getElementById('assistantToggle');
            container.classList.add('active');
            toggle.classList.add('active');
            setTimeout(() => {
                document.getElementById('assistantInput').focus();
            }, 300);
        }
    }

    async sendMessage() {
        const input = document.getElementById('assistantInput');
        const message = input.value.trim();
        
        if (!message || this.isLoading) return;

        input.value = '';
        this.addMessage(message, 'user');
        await this.getBotResponse(message);
    }

    async sendQuickQuestion(question) {
        this.addMessage(question, 'user');
        await this.getBotResponse(question);
    }

    addMessage(text, sender) {
        const messagesContainer = document.getElementById('assistantMessages');
        const welcome = messagesContainer.querySelector('.assistant-welcome');
        if (welcome) welcome.remove();

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.innerHTML = `
            <div class="message-content">${this.escapeHtml(text)}</div>
            <div class="message-time">${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        this.messages.push({ text, sender, time: Date.now() });
        this.saveMessages();
    }

    async getBotResponse(userMessage) {
        const messagesContainer = document.getElementById('assistantMessages');
        this.isLoading = true;

        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message bot loading';
        loadingDiv.innerHTML = '<div class="message-content"><span class="typing"><span>.</span><span>.</span><span>.</span></span></div>';
        messagesContainer.appendChild(loadingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        try {
            const page = window.location.pathname.split('/').pop() || 'index.html';
            const response = await fetch('/api/assistant/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage, page: page })
            });

            const data = await response.json();
            loadingDiv.remove();

            if (data.response) {
                this.addMessage(data.response, 'bot');
            } else {
                this.addMessage('Извините, произошла ошибка. Попробуйте позже.', 'bot');
            }
        } catch (error) {
            console.error('Assistant error:', error);
            loadingDiv.remove();
            this.addMessage('Извините, сервис временно недоступен. Попробуйте позже.', 'bot');
        }

        this.isLoading = false;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    window.assistantManager = new AssistantManager();
});