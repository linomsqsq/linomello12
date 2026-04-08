class LinomelloAssistant {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.init();
    }

    init() {
        this.renderWidget();
        this.bindEvents();
        this.updateBotStatus();
        this.loadHistory();
    }

    renderWidget() {
        const widgetHtml = `
            <div class="assistant-widget" id="assistantWidget">
                <button class="assistant-button" id="assistantToggle" aria-label="Открыть чат помощника">
                    <span>AI</span>
                </button>
                <div class="assistant-panel hidden" id="assistantPanel">
                    <div class="assistant-header">
                        <div>
                            <div class="assistant-title">Linomello AI-ассистент</div>
                            <div class="assistant-subtitle">Помогу выбрать мебель, цену и доставку</div>
                            <div class="assistant-status" id="assistantStatus">Статус: загрузка...</div>
                        </div>
                        <div class="assistant-header-actions">
                            <button class="assistant-clear" id="assistantClear">Очистить</button>
                            <button class="assistant-close" id="assistantClose">✕</button>
                        </div>
                    </div>
                    <div class="assistant-body">
                        <div class="assistant-messages" id="assistantMessages"></div>
                        <div class="assistant-placeholder" id="assistantPlaceholder">Здравствуйте! Задайте вопрос о мебели, доставке, гарантии или стоимости.</div>
                        <div class="assistant-suggestions" id="assistantSuggestions">
                            <button type="button">Рассчитать цену</button>
                            <button type="button">Сроки изготовления</button>
                            <button type="button">Выбрать материал</button>
                        </div>
                    </div>
                    <div class="assistant-input-group">
                        <input type="text" id="assistantInput" placeholder="Напишите вопрос..." autocomplete="off">
                        <button id="assistantSendBtn">Отправить</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', widgetHtml);
    }

    bindEvents() {
        const toggle = document.getElementById('assistantToggle');
        const close = document.getElementById('assistantClose');
        const send = document.getElementById('assistantSendBtn');
        const input = document.getElementById('assistantInput');
        const suggestions = document.getElementById('assistantSuggestions');

        if (toggle) toggle.addEventListener('click', () => this.togglePanel());
        if (close) close.addEventListener('click', () => this.togglePanel());
        if (send) send.addEventListener('click', () => this.handleSend());
        if (input) input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleSend();
            }
        });

        const clearBtn = document.getElementById('assistantClear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearChat());
        }

        if (suggestions) {
            suggestions.addEventListener('click', (event) => {
                const button = event.target.closest('button');
                if (!button) return;
                this.sendMessage(button.textContent.trim());
            });
        }
    }

    togglePanel() {
        this.isOpen = !this.isOpen;
        const panel = document.getElementById('assistantPanel');
        if (!panel) return;

        panel.classList.toggle('hidden');
        if (this.isOpen) {
            document.getElementById('assistantInput').focus();
        }
    }

    async handleSend() {
        const input = document.getElementById('assistantInput');
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        this.sendMessage(text);
    }

    async sendMessage(text) {
        this.addMessage(text, 'user');
        this.updatePlaceholder();
        this.showTyping();
        this.disableInput(true);

        try {
            const page = window.location.pathname.split('/').pop() || 'index.html';
            const response = await fetch('/api/bot/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, page })
            });

            const data = await response.json();
            this.hideTyping();
            this.disableInput(false);

            const answer = data.response || 'Извините, я не смог найти ответ. Попробуйте сформулировать вопрос иначе.';
            this.addMessage(answer, 'assistant');
            this.saveHistory();
            this.updatePlaceholder();
        } catch (error) {
            this.hideTyping();
            this.disableInput(false);
            this.addMessage('Ошибка соединения. Попробуйте позже.', 'assistant');
            console.error('Assistant error:', error);
        }
    }

    async updateBotStatus() {
        try {
            const response = await fetch('/api/bot/status');
            const data = await response.json();
            this.showStatus(`Статус: ${data.status === 'online' ? 'Онлайн' : 'Офлайн'} (${data.provider || 'fallback'})`);
        } catch (error) {
            this.showStatus('Статус: недоступен');
        }
    }

    showStatus(text) {
        const status = document.getElementById('assistantStatus');
        if (status) {
            status.textContent = text;
        }
    }

    disableInput(disabled) {
        const input = document.getElementById('assistantInput');
        const send = document.getElementById('assistantSendBtn');
        if (input) input.disabled = disabled;
        if (send) send.disabled = disabled;
    }

    clearChat() {
        this.messages = [];
        this.saveHistory();
        const container = document.getElementById('assistantMessages');
        if (container) container.innerHTML = '';
        this.updatePlaceholder();
    }

    updatePlaceholder() {
        const placeholder = document.getElementById('assistantPlaceholder');
        const container = document.getElementById('assistantMessages');
        if (!placeholder || !container) return;
        placeholder.style.display = container.children.length === 0 ? 'block' : 'none';
    }

    addMessage(text, sender) {
        const container = document.getElementById('assistantMessages');
        if (!container) return;

        const messageElement = document.createElement('div');
        messageElement.className = `assistant-message ${sender}`;
        messageElement.innerHTML = `
            <div class="assistant-message-content">${this.escapeHtml(text).replace(/\n/g, '<br>')}</div>
        `;
        container.appendChild(messageElement);
        container.scrollTop = container.scrollHeight;

        this.messages.push({ sender, text, time: new Date().toISOString() });
    }

    showTyping() {
        const container = document.getElementById('assistantMessages');
        if (!container) return;
        this.removeTypingIndicator();
        const indicator = document.createElement('div');
        indicator.className = 'assistant-typing';
        indicator.id = 'assistantTyping';
        indicator.innerHTML = '<span></span><span></span><span></span>';
        container.appendChild(indicator);
        container.scrollTop = container.scrollHeight;
    }

    hideTyping() {
        this.removeTypingIndicator();
    }

    removeTypingIndicator() {
        const indicator = document.getElementById('assistantTyping');
        if (indicator && indicator.parentElement) {
            indicator.parentElement.removeChild(indicator);
        }
    }

    saveHistory() {
        localStorage.setItem('linomelloAssistantHistory', JSON.stringify(this.messages.slice(-20)));
    }

    loadHistory() {
        try {
            const stored = localStorage.getItem('linomelloAssistantHistory');
            if (!stored) return;
            this.messages = JSON.parse(stored);
            const container = document.getElementById('assistantMessages');
            if (!container) return;
            container.innerHTML = '';
            this.messages.forEach(entry => {
                const messageElement = document.createElement('div');
                messageElement.className = `assistant-message ${entry.sender}`;
                messageElement.innerHTML = `<div class="assistant-message-content">${this.escapeHtml(entry.text).replace(/\n/g, '<br>')}</div>`;
                container.appendChild(messageElement);
            });
            container.scrollTop = container.scrollHeight;
            this.updatePlaceholder();
        } catch (error) {
            console.warn('Не удалось загрузить историю ассистента:', error);
        }
    }

    escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

window.linomelloAssistant = new LinomelloAssistant();
