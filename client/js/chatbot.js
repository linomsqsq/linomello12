// Chatbot JavaScript
class OllamaChatbot {
    constructor() {
        this.messages = [
            {
                role: 'assistant',
                content: 'Привет! Я AI-ассистент Linomello. Чем могу помочь? Могу помочь с выбором мебели, ответить на вопросы о товарах или помочь с оформлением заказа.'
            }
        ];
        this.isOpen = false;
        this.init();
    }

    init() {
        this.createToggleButton();
        this.createChatContainer();
        this.setupEventListeners();
    }

    createToggleButton() {
        const toggle = document.createElement('button');
        toggle.className = 'chatbot-toggle';
        toggle.id = 'chatbot-toggle';
        toggle.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
        `;
        document.body.appendChild(toggle);
    }

    createChatContainer() {
        const container = document.createElement('div');
        container.className = 'chatbot-container';
        container.id = 'chatbot-container';
        container.innerHTML = `
            <div class="chatbot-header">
                <h3>🤖 AI Ассистент</h3>
                <button class="chatbot-close" id="chatbot-close">&times;</button>
            </div>
            <div class="chatbot-messages" id="chatbot-messages">
                <div class="chatbot-message assistant">
                    Привет! Я AI-ассистент Linomello. Чем могу помочь? Могу помочь с выбором мебели, ответить на вопросы о товарах или помочь с оформлением заказа.
                </div>
            </div>
            <div class="chatbot-typing" id="chatbot-typing">
                <div class="chatbot-typing-dots">
                    <div class="chatbot-typing-dot"></div>
                    <div class="chatbot-typing-dot"></div>
                    <div class="chatbot-typing-dot"></div>
                </div>
            </div>
            <div class="chatbot-input-area">
                <input type="text" class="chatbot-input" id="chatbot-input" placeholder="Введите сообщение..." autocomplete="off">
                <button class="chatbot-send" id="chatbot-send">Отправить</button>
            </div>
        `;
        document.body.appendChild(container);
    }

    setupEventListeners() {
        const toggle = document.getElementById('chatbot-toggle');
        const close = document.getElementById('chatbot-close');
        const sendBtn = document.getElementById('chatbot-send');
        const input = document.getElementById('chatbot-input');

        toggle.addEventListener('click', () => this.toggleChat());
        close.addEventListener('click', () => this.closeChat());
        sendBtn.addEventListener('click', () => this.sendMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    toggleChat() {
        const container = document.getElementById('chatbot-container');
        this.isOpen = !this.isOpen;
        container.classList.toggle('active', this.isOpen);
        if (this.isOpen) {
            document.getElementById('chatbot-input').focus();
        }
    }

    closeChat() {
        const container = document.getElementById('chatbot-container');
        this.isOpen = false;
        container.classList.remove('active');
    }

    async sendMessage() {
        const input = document.getElementById('chatbot-input');
        const sendBtn = document.getElementById('chatbot-send');
        const message = input.value.trim();
        
        if (!message) return;

        this.addMessage('user', message);
        input.value = '';
        sendBtn.disabled = true;
        this.showTyping();

        try {
            const response = await this.getOllamaResponse(message);
            this.hideTyping();
            this.addMessage('assistant', response);
        } catch (error) {
            this.hideTyping();
            this.addMessage('assistant', 'Извините, произошла ошибка. Попробуйте еще раз.');
            console.error('Chatbot error:', error);
        } finally {
            sendBtn.disabled = false;
            input.focus();
        }
    }

    async getOllamaResponse(message) {
        this.messages.push({ role: 'user', content: message });

        const OLLAMA_URL = 'http://localhost:11434/api/chat';
        
        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama2',
                messages: this.messages,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const botResponse = data.message.content;
        this.messages.push({ role: 'assistant', content: botResponse });

        return botResponse;
    }

    addMessage(role, content) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message ${role}`;
        messageDiv.textContent = content;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTyping() {
        document.getElementById('chatbot-typing').classList.add('active');
        document.getElementById('chatbot-messages').scrollTop = 
            document.getElementById('chatbot-messages').scrollHeight;
    }

    hideTyping() {
        document.getElementById('chatbot-typing').classList.remove('active');
    }
}

// Initialize chatbot when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new OllamaChatbot();
});