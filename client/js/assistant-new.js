class LinomelloAssistant {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.isLoading = false;
        this.init();
    }

    init() {
        this.renderWidget();
        this.bindEvents();
        this.checkBackendStatus();
        this.loadHistory();
    }

    renderWidget() {
        const widgetHtml = `
            <div class="linomello-assistant-widget" id="assistantWidget">
                <!-- Кнопка открытия -->
                <button class="assistant-toggle-btn" id="assistantToggle" aria-label="Открыть AI-ассистента">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                        <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                    </svg>
                    <span class="assistant-indicator"></span>
                </button>

                <!-- Основная панель чата -->
                <div class="assistant-panel" id="assistantPanel" style="display: none;">
                    <!-- Заголовок -->
                    <div class="assistant-header">
                        <div class="assistant-header-content">
                            <div class="assistant-title">
                                <span class="title-text">Linomello Assistant</span>
                                <span class="title-badge">AI 2.0</span>
                            </div>
                            <div class="assistant-subtitle">Консультант по премиальной мебели</div>
                            <div class="assistant-status" id="assistantStatus">
                                <span class="status-indicator online"></span>
                                <span class="status-text">Онлайн</span>
                            </div>
                        </div>
                        <div class="assistant-header-controls">
                            <button class="assistant-control-btn" id="assistantClear" title="Очистить чат">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                                </svg>
                            </button>
                            <button class="assistant-control-btn" id="assistantClose" title="Закрыть">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Сообщения -->
                    <div class="assistant-messages-container">
                        <div class="assistant-messages" id="assistantMessages">
                            <div class="message-greeting">
                                <div class="greeting-icon">👋</div>
                                <div class="greeting-text">Здравствуйте! Я AI-консультант Linomello. Готов помочь с выбором мебели, ценами и доставкой.</div>
                            </div>
                        </div>
                        <div class="assistant-suggestions" id="assistantSuggestions">
                            <button type="button" class="suggestion-btn">Рассчитать цену</button>
                            <button type="button" class="suggestion-btn">Сроки изготовления</button>
                            <button type="button" class="suggestion-btn">Материалы</button>
                            <button type="button" class="suggestion-btn">Гарантия</button>
                        </div>
                    </div>

                    <!-- Ввод сообщения -->
                    <div class="assistant-input-section">
                        <div class="input-wrapper">
                            <input 
                                type="text" 
                                id="assistantInput" 
                                class="assistant-input" 
                                placeholder="Напишите вопрос..." 
                                autocomplete="off"
                            >
                            <button id="assistantSendBtn" class="assistant-send-btn" aria-label="Отправить">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.9429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,2.79248897 C3.34915502,2.40625407 2.40734225,2.51639589 1.77946707,3.0876881 C0.994623095,3.65907034 0.837654326,4.74840148 1.15159189,5.53389833 L3.03521743,12.0412075 C3.03521743,12.1982049 3.34915502,12.3553023 3.50612381,12.3553023 L16.6915026,13.1407893 C16.6915026,13.1407893 17.1624089,13.1407893 17.1624089,12.6589028 L17.1624089,12.8016901 C17.1624089,12.3553023 16.6915026,12.4744748 16.6915026,12.4744748 Z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', widgetHtml);
    }

    bindEvents() {
        // Открытие/закрытие
        const toggle = document.getElementById('assistantToggle');
        const close = document.getElementById('assistantClose');
        
        if (toggle) toggle.addEventListener('click', () => this.togglePanel());
        if (close) close.addEventListener('click', () => this.togglePanel());

        // Отправка сообщения
        const send = document.getElementById('assistantSendBtn');
        const input = document.getElementById('assistantInput');
        
        if (send) send.addEventListener('click', () => this.handleSend());
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSend();
                }
            });
        }

        // Очистка чата
        const clearBtn = document.getElementById('assistantClear');
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearChat());

        // Рекомендации
        const suggestions = document.getElementById('assistantSuggestions');
        if (suggestions) {
            suggestions.addEventListener('click', (e) => {
                const btn = e.target.closest('.suggestion-btn');
                if (btn) this.sendMessage(btn.textContent.trim());
            });
        }
    }

    togglePanel() {
        this.isOpen = !this.isOpen;
        const panel = document.getElementById('assistantPanel');
        if (panel) {
            panel.style.display = this.isOpen ? 'flex' : 'none';
            if (this.isOpen) {
                setTimeout(() => {
                    const input = document.getElementById('assistantInput');
                    if (input) input.focus();
                }, 100);
            }
        }
    }

    async handleSend() {
        const input = document.getElementById('assistantInput');
        if (!input) return;
        
        const text = input.value.trim();
        if (!text || this.isLoading) return;
        
        input.value = '';
        this.sendMessage(text);
    }

    async sendMessage(text) {
        this.addMessage(text, 'user');
        this.hideSuggestions();
        this.showTyping();
        this.disableInput(true);
        this.isLoading = true;

        try {
            const page = window.location.pathname.split('/').pop() || 'index.html';
            
            // Используем Node.js backend (Gemini AI через Node.js)
            const response = await fetch('/api/bot/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, page })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            this.hideTyping();
            this.disableInput(false);
            this.isLoading = false;

            const answer = data.response || 'Извините, не удалось обработать запрос. Попробуйте переформулировать вопрос.';
            this.addMessage(answer, 'assistant');
            this.saveHistory();
        } catch (error) {
            console.error('Assistant error:', error);
            this.hideTyping();
            this.disableInput(false);
            this.isLoading = false;
            this.addMessage('❌ Ошибка подключения к AI. Пожалуйста, обновите страницу и попробуйте снова.', 'assistant');
        }
    }

    async checkBackendStatus() {
        try {
            const response = await fetch('/api/bot/status');
            const data = await response.json();
            this.updateStatus(data.status === 'online', data.provider || 'Gemini 2.0 Flash');
        } catch (error) {
            this.updateStatus(false, 'Offline');
        }
    }

    updateStatus(isOnline, provider) {
        const status = document.getElementById('assistantStatus');
        if (status) {
            const indicator = status.querySelector('.status-indicator');
            const text = status.querySelector('.status-text');
            
            if (indicator) {
                indicator.className = isOnline ? 'status-indicator online' : 'status-indicator offline';
            }
            if (text) {
                text.textContent = isOnline ? `Онлайн - ${provider}` : 'Офлайн';
            }
        }
    }

    addMessage(text, sender) {
        const container = document.getElementById('assistantMessages');
        if (!container) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${sender}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = this.formatText(text);
        
        messageDiv.appendChild(contentDiv);
        container.appendChild(messageDiv);
        
        this.scrollToBottom();
        this.messages.push({ sender, text, time: new Date().toISOString() });
    }

    formatText(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    showTyping() {
        const container = document.getElementById('assistantMessages');
        if (!container) return;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message message-typing';
        typingDiv.id = 'assistantTyping';
        typingDiv.innerHTML = `
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        container.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTyping() {
        const typing = document.getElementById('assistantTyping');
        if (typing) typing.remove();
    }

    hideSuggestions() {
        const suggestions = document.getElementById('assistantSuggestions');
        if (suggestions) {
            suggestions.style.display = 'none';
        }
    }

    scrollToBottom() {
        const container = document.querySelector('.assistant-messages-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    disableInput(disabled) {
        const input = document.getElementById('assistantInput');
        const send = document.getElementById('assistantSendBtn');
        if (input) input.disabled = disabled;
        if (send) send.disabled = disabled;
    }

    clearChat() {
        if (confirm('Очистить историю чата?')) {
            this.messages = [];
            this.saveHistory();
            const container = document.getElementById('assistantMessages');
            if (container) {
                container.innerHTML = `
                    <div class="message-greeting">
                        <div class="greeting-icon">👋</div>
                        <div class="greeting-text">Здравствуйте! Я AI-консультант Linomello. Готов помочь с выбором мебели, ценами и доставкой.</div>
                    </div>
                `;
            }
            this.showSuggestions();
        }
    }

    showSuggestions() {
        const suggestions = document.getElementById('assistantSuggestions');
        if (suggestions) {
            suggestions.style.display = 'flex';
        }
    }

    saveHistory() {
        try {
            localStorage.setItem('assistantHistory', JSON.stringify(this.messages));
        } catch (e) {
            console.warn('Cannot save history:', e);
        }
    }

    loadHistory() {
        try {
            const history = localStorage.getItem('assistantHistory');
            if (history) {
                this.messages = JSON.parse(history);
                const container = document.getElementById('assistantMessages');
                if (container && this.messages.length > 0) {
                    container.innerHTML = '';
                    this.messages.forEach(msg => {
                        this.addMessage(msg.text, msg.sender);
                    });
                    this.hideSuggestions();
                }
            }
        } catch (e) {
            console.warn('Cannot load history:', e);
        }
    }
}

// Инициализируем ассистента при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.linomelloAssistant = new LinomelloAssistant();
    });
} else {
    window.linomelloAssistant = new LinomelloAssistant();
}
