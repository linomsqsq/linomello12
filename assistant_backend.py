from flask import Flask, request, jsonify
import os
import json
from gigachat import GigaChat
from gigachat.exceptions import GigaChatException

app = Flask(__name__)

# Конфигурация GigaChat
GIGACHAT_CREDENTIALS = os.environ.get('GIGACHAT_CREDENTIALS', '')
GIGACHAT_CA_BUNDLE = os.environ.get('GIGACHAT_CA_BUNDLE_FILE', '')
GIGACHAT_VERIFY_SSL = os.environ.get('GIGACHAT_VERIFY_SSL_CERTS', 'true').lower() == 'true'

if GIGACHAT_VERIFY_SSL and not GIGACHAT_CA_BUNDLE:
    print("⚠️  Внимание: GIGACHAT_CA_BUNDLE_FILE не установлена. Используйте GIGACHAT_VERIFY_SSL_CERTS=false для разработки.")

BOT_CONTEXT = """Ты - профессиональный консультант премиум-бренда мебели Linomello.

О компании:
- Название: Linomello
- Специализация: элитная мебель ручной работы
- Материалы: массив дуба, орех, натуральная кожа, итальянские ткани, премиальная фурнитура
- Срок изготовления: 14-30 дней (зависит от сложности)
- Доставка: Москва и МО, сборка и установка включены
- Гарантия: 5 лет на все изделия
- Цены: От 35,000 ₽ до 500,000 ₽
- Рассрочка: Доступна

Правила ответа:
1. Будь вежливым и профессиональным
2. Давай ПОЛНЫЙ и РАЗВЕРНУТЫЙ ответ (2-3 предложения минимум)
3. Используй информацию о компании
4. Если не знаешь точный ответ - предложи уточнить у менеджера
5. Говори только на русском языке
6. Отвечай только на вопросы о мебели, услугах, ценах, доставке, гарантии

Примеры ответов:
- "Доставка осуществляется по Москве и МО. Стоимость рассчитывается индивидуально. Сборка и установка включены."
- "Мы используем только премиальные материалы - массив дуба и ореха, натуральную кожу и итальянские ткани."

Запомни: Отвечай как профессиональный консультант!"""

def query_gigachat(prompt):
    """Запрос к GigaChat API"""
    try:
        if not GIGACHAT_CREDENTIALS:
            print("Ошибка: GIGACHAT_CREDENTIALS не установлена")
            return None
        
        client_kwargs = {
            'credentials': GIGACHAT_CREDENTIALS,
            'verify_ssl_certs': GIGACHAT_VERIFY_SSL
        }
        
        if GIGACHAT_CA_BUNDLE:
            client_kwargs['ca_bundle_file'] = GIGACHAT_CA_BUNDLE
        
        with GigaChat(**client_kwargs) as client:
            response = client.chat(prompt)
            return response.choices[0].message.content
    
    except GigaChatException as e:
        print(f"GigaChat ошибка: {e}")
        return None
    except Exception as e:
        print(f"Ошибка подключения: {e}")
        return None

class GigaChatAssistant:
    def __init__(self):
        self.context = BOT_CONTEXT
    
    def generate_response(self, user_message, page='index.html'):
        full_prompt = f"{BOT_CONTEXT}\n\nСтраница: {page}\n\nВопрос: {user_message}"
        
        response_text = query_gigachat(full_prompt)
        
        if response_text:
            return response_text, 'gigachat'
        else:
            return "Извините, сервис ассистента временно недоступен. Попробуйте позже.", 'error'

assistant = GigaChatAssistant()

@app.route('/api/assistant/message', methods=['POST'])
def handle_message():
    data = request.get_json()
    user_message = data.get('message', '').strip()
    page = data.get('page', 'index.html')
    
    if not user_message:
        return jsonify({'error': 'Сообщение не может быть пустым'}), 400
    
    response_text, provider = assistant.generate_response(user_message, page)
    
    return jsonify({
        'response': response_text,
        'suggestions': ['Каталог', 'Цены', 'Доставка', 'Гарантия', 'Контакты'],
        'provider': provider,
        'timestamp': None
    })

@app.route('/api/assistant/status', methods=['GET'])
def get_status():
    """Проверка статуса GigaChat"""
    try:
        if not GIGACHAT_CREDENTIALS:
            return jsonify({
                'status': 'offline',
                'provider': 'GigaChat',
                'reason': 'Credentials not configured'
            })
        
        client_kwargs = {
            'credentials': GIGACHAT_CREDENTIALS,
            'verify_ssl_certs': GIGACHAT_VERIFY_SSL
        }
        
        if GIGACHAT_CA_BUNDLE:
            client_kwargs['ca_bundle_file'] = GIGACHAT_CA_BUNDLE
        
        with GigaChat(**client_kwargs) as client:
            models = client.get_models()
            return jsonify({
                'status': 'online',
                'provider': 'GigaChat',
                'model': 'GigaChat',
                'available_models': [m.id_ for m in models.data] if hasattr(models, 'data') else []
            })
    except Exception as e:
        return jsonify({
            'status': 'offline',
            'provider': 'GigaChat',
            'error': str(e)
        })

@app.route('/api/assistant/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'linomello-gigachat',
        'provider': 'GigaChat',
        'sdk': 'python-gigachat'
    })

if __name__ == '__main__':
    print('🤖 Linomello GigaChat Assistant запущен!')
    print('   Провайдер: GigaChat')
    if GIGACHAT_CREDENTIALS:
        print('   Статус: ✅ Готов')
    else:
        print('   Статус: ⚠️  Требуется GIGACHAT_CREDENTIALS')
    print('   Эндпоинты:')
    print('   - POST /api/assistant/message')
    print('   - GET /api/assistant/status')
    print('   - GET /api/assistant/health')
    app.run(host='0.0.0.0', port=5001, debug=True)
