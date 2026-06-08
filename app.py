# app.py — главный файл Flask-приложения "DevQuest"
# Запуск: python app.py
# После запуска открой в браузере http://127.0.0.1:5000

import json  # Модуль для работы с JSON-файлами
from flask import Flask, render_template  # Flask — веб-фреймворк, render_template — рендеринг HTML-шаблонов

# Создаём экземпляр Flask-приложения
# __name__ — стандартный способ указать имя текущего модуля
app = Flask(__name__)


# Декоратор @app.route связывает URL-адрес с функцией.
# Когда пользователь заходит на главную страницу ('/'),
# вызывается функция index().
@app.route('/')
def index():
    """
    Главная страница сайта.
    Читает данные из файла content.json и передаёт их в HTML-шаблон.
    """
    # Открываем файл content.json в режиме чтения ('r', encoding='utf-8' для поддержки русского языка)
    with open('content.json', 'r', encoding='utf-8') as f:
        # json.load() превращает содержимое JSON-файла в словарь Python
        data = json.load(f)
        # Извлекаем список квестов по ключу 'quests'
        quests = data['quests']

    # render_template загружает шаблон index.html из папки templates/
    # и передаёт в него переменную quests (список словарей с квестами)
    return render_template('index.html', quests=quests)


# Этот блок выполняется только при прямом запуске файла (python app.py),
# а не при импорте из другого модуля.
if __name__ == '__main__':
    # Запускаем сервер разработки Flask
    # debug=True — автоматически перезагружает сервер при изменениях в коде
    app.run(debug=True)
