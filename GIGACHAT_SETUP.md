# GigaChat Integration Guide

Этот сайт использует **GigaChat API** от Sber для AI-ассистента.

## 🚀 Быстрая Настройка

### 1. Получить API Ключ

Перейти на https://developers.sber.ru/docs/ru/gigachat/quickstart/main и получить свой `GIGACHAT_CREDENTIALS` ключ.

### 2. Загрузить SSL Сертификат

**Для Production:**
1. Скачайте "Russian Trusted Root CA" с https://www.gosuslugi.ru/crt
2. Разместите файл в проекте (например, `certs/Russian_Trusted_Root_CA.crt`)

**Для Разработки (не рекомендуется):**
```bash
# Отключить проверку SSL
export GIGACHAT_VERIFY_SSL_CERTS=true
```

### 3. Установить зависимости

```bash
pip install -r requirements.txt
```

### 4. Установить переменные окружения

#### Linux/macOS:
```bash
export GIGACHAT_CREDENTIALS="MDE5ZTM2ZmItYjBlOS03OGIxLWJjYjMtZWYzYzY4MGViY2FjOmYwNWZlYzU5LWU1ZmItNDFiMS1iMzEyLThmNTMwN2M0NWFmMw"
export GIGACHAT_CA_BUNDLE_FILE="/path/to/Russian_Trusted_Root_CA.crt"
# export GIGACHAT_VERIFY_SSL_CERTS="true"  # по умолчанию true
```

#### Windows (PowerShell):
```powershell
$env:GIGACHAT_CREDENTIALS = "MDE5ZTM2ZmItYjBlOS03OGIxLWJjYjMtZWYzYzY4MGViY2FjOmYwNWZlYzU5LWU1ZmItNDFiMS1iMzEyLThmNTMwN2M0NWFmMw"
$env:GIGACHAT_CA_BUNDLE_FILE = "C:\path\to\Russian_Trusted_Root_CA.crt"
```

#### Или через `.env` файл:
```
GIGACHAT_CREDENTIALS=MDE5ZTM2ZmItYjBlOS03OGIxLWJjYjMtZWYzYzY4MGViY2FjOmYwNWZlYzU5LWU1ZmItNDFiMS1iMzEyLThmNTMwN2M0NWFmMw
GIGACHAT_CA_BUNDLE_FILE=/path/to/Russian_Trusted_Root_CA.crt
GIGACHAT_VERIFY_SSL_CERTS=true
```

### 5. Запустить ассистент

```bash
python assistant_backend.py
```

Сервер запустится на `http://localhost:5001`

## 🔧 API Endpoints

### POST `/api/assistant/message`
Отправить сообщение ботом

**Request:**
```json
{
  "message": "Какие материалы вы используете?",
  "page": "index.html"
}
```

**Response:**
```json
{
  "response": "Мы используем только премиальные материалы...",
  "suggestions": ["Каталог", "Цены", "Доставка"],
  "provider": "gigachat"
}
```

### GET `/api/assistant/status`
Проверить статус подключения к GigaChat

### GET `/api/assistant/health`
Проверка здоровья сервиса

## 🛠️ Конфигурация

| Переменная | Описание | По умолчанию |
|---|---|---|
| `GIGACHAT_CREDENTIALS` | API ключ (обязательно) | - |
| `GIGACHAT_CA_BUNDLE_FILE` | Путь к SSL сертификату | - |
| `GIGACHAT_VERIFY_SSL_CERTS` | Проверять ли SSL (разработка: false) | true |

## ⚠️ Важно

- **Никогда** не коммитьте `GIGACHAT_CREDENTIALS` в Git!
- Используйте `.env` файл или переменные окружения
- Для production обязательно используйте валидный SSL сертификат
- Ассистент работает **только на русском языке**

## 📚 Полная документация GigaChat

https://developers.sber.ru/docs/ru/gigachat/api/main

## 🔗 Связанные файлы

- Backend: [assistant_backend.py](./assistant_backend.py)
- Frontend: [client/js/assistant.js](./client/js/assistant.js)
- Стили: [client/css/assistant.css](./client/css/assistant.css)
