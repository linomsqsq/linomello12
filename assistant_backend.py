#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Настройка Gemini API
GEMINI_API_KEY = 'AIzaSyDdTF83-hG7llh1Uc3veW-LF_Dzt-a9Qnc'
client = OpenAI(api_key=OPENAI_API_KEY)

# Контекст для бота
BOT_CONTEXT = """
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

Запомни: Отвечай как реальный консультант, дающий полезную информацию, а не короткие фразы!
"""


class GeminiAssistant:
    def __init__(self):
        self.model = 'gpt-4o-mini'
    
    def generate_response(self, user_message, page='index.html'):
        """Генерирует ответ от OpenAI API"""
        try:
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": BOT_CONTEXT},
                    {"role": "user", "content": f"Страница: {page}\n\nВопрос: {user_message}"}
                ],
                temperature=0.7,
                max_tokens=500,
            )
            
            response_text = response.choices[0].message.content.strip()
            if response_text:
                return response_text, 'openai'
            
            return 'Извините, не смог обработать запрос. Пожалуйста, переформулируйте вопрос.', 'openai-error'
        
        except Exception as e:
            print(f"❌ OpenAI error: {str(e)}")
            raise Exception(f"AI service error: {str(e)}")


# Инициализируем ассистента
assistant = GeminiAssistant()

@app.route('/api/assistant/message', methods=['POST'])
def send_message():
    """Обрабатывает сообщение пользователя"""
    data = request.get_json()
    
    if not data or not data.get('message'):
        return jsonify({'error': 'Message is required'}), 400
    
    user_message = data.get('message', '').strip()
    page = data.get('page', 'index.html')
    
    if not user_message:
        return jsonify({'error': 'Message cannot be empty'}), 400
    
    # Генерируем ответ
    response_text, provider = assistant.generate_response(user_message, page)
    
    return jsonify({
        'response': response_text,
        'provider': provider,
        'timestamp': datetime.utcnow().isoformat(),
        'suggestions': ['Каталог', 'Цены', 'Доставка', 'Гарантия', 'Контакты']
    })

@app.route('/api/assistant/status', methods=['GET'])
def get_status():
    """Возвращает статус ассистента"""
    return jsonify({
        'status': 'online',
        'provider': 'OpenAI GPT-4o Mini',
        'version': '2.0',
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/api/assistant/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'linomello-assistant',
        'api_key_configured': bool(GEMINI_API_KEY),
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/', methods=['GET'])
def index():
    """Root endpoint"""
    return jsonify({
        'service': 'Linomello AI Assistant',
        'version': '2.0',
        'status': 'running',
        'endpoints': {
            'message': 'POST /api/assistant/message',
            'status': 'GET /api/assistant/status',
            'health': 'GET /api/assistant/health'
        }
    })

if __name__ == '__main__':
    print('\n' + '='*50)
    print('🤖 Linomello AI Assistant (Python) запущен!')
    print('📍 Адрес: http://localhost:3001')
    print('🔌 Provider: Google Gemini 2.0 Flash')
    print('='*50 + '\n')
    app.run(debug=False, host='0.0.0.0', port=3001)
