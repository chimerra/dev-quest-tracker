/**
 * script.js — клиентская логика DevQuest
 * Отвечает за: поиск, фильтрацию по тегам, цветовую маркировку сложности,
 *             трёхэтапное состояние кнопки, localStorage, счётчик выполненных
 */

// Ждём, когда DOM-дерево полностью загрузится, и только потом выполняем код
document.addEventListener('DOMContentLoaded', function () {

    // ============================================================
    // 0. ОСНОВНЫЕ ПЕРЕМЕННЫЕ
    // ============================================================

    const cards = document.querySelectorAll('.quest-card');       // Все карточки
    const completedCounterEl = document.getElementById('completedCounter'); // Счётчик в шапке
    const storageKey = 'devquest_progress'; // Ключ для localStorage

    // Загружаем сохранённый прогресс из localStorage (или пустой объект)
    let progress = JSON.parse(localStorage.getItem(storageKey)) || {};


    // ============================================================
    // 1. ЦВЕТОВАЯ МАРКИРОВКА СЛОЖНОСТИ
    // ============================================================

    cards.forEach(function (card) {
        const tagsString = card.getAttribute('data-tags') || '';
        const tags = tagsString.split(',').map(function (t) { return t.trim(); });
        const rewardBadge = card.querySelector('.quest-card__reward');
        if (!rewardBadge) return;

        if (tags.includes('легко')) {
            rewardBadge.classList.add('reward--easy');
        } else if (tags.includes('средне')) {
            rewardBadge.classList.add('reward--medium');
        } else if (tags.includes('сложно')) {
            rewardBadge.classList.add('reward--hard');
        } else {
            rewardBadge.classList.add('reward--medium');
        }
    });


    // ============================================================
    // 2. СБОР УНИКАЛЬНЫХ ТЕГОВ ДЛЯ ФИЛЬТРА
    // ============================================================

    const tagSet = new Set();
    cards.forEach(function (card) {
        const tagsString = card.getAttribute('data-tags') || '';
        tagsString.split(',').forEach(function (t) { tagSet.add(t.trim()); });
    });

    const uniqueTags = Array.from(tagSet).sort();
    const tagsFilter = document.getElementById('tagsFilter');

    uniqueTags.forEach(function (tag) {
        const btn = document.createElement('button');
        btn.classList.add('tag');
        btn.setAttribute('data-tag', tag);
        btn.textContent = tag;
        tagsFilter.appendChild(btn);
    });


    // ============================================================
    // 3. ССЫЛКИ НА ЭЛЕМЕНТЫ УПРАВЛЕНИЯ
    // ============================================================

    const searchInput = document.getElementById('searchInput');
    const filterButtons = tagsFilter.querySelectorAll('.tag');


    // ============================================================
    // 4. ФУНКЦИЯ ФИЛЬТРАЦИИ (поиск + теги)
    // ============================================================

    const FADE_DURATION = 350;
    const hideTimers = new Map();

    function showCard(card) {
        if (hideTimers.has(card)) {
            clearTimeout(hideTimers.get(card));
            hideTimers.delete(card);
        }
        card.classList.remove('quest-card--hidden');
        requestAnimationFrame(function () {
            card.classList.remove('quest-card--fading');
        });
    }

    function hideCard(card) {
        if (card.classList.contains('quest-card--hidden')) return;
        card.classList.add('quest-card--fading');
        const timer = setTimeout(function () {
            card.classList.add('quest-card--hidden');
            hideTimers.delete(card);
        }, FADE_DURATION);
        hideTimers.set(card, timer);
    }

    function filterQuests() {
        const query = searchInput.value.toLowerCase().trim();
        const activeTagBtn = tagsFilter.querySelector('.tag--active');
        const activeTag = activeTagBtn ? activeTagBtn.getAttribute('data-tag') : 'all';

        cards.forEach(function (card) {
            const title = card.querySelector('.quest-card__title').textContent.toLowerCase();
            const tagsString = card.getAttribute('data-tags') || '';
            const matchesSearch = title.includes(query);
            const matchesTag = (activeTag === 'all') || (tagsString.includes(activeTag));

            if (matchesSearch && matchesTag) {
                showCard(card);
            } else {
                hideCard(card);
            }
        });
    }


    // ============================================================
    // 5. ТРЁХЭТАПНАЯ ЛОГИКА КНОПКИ
    //
    //    Состояния (статусы квеста):
    //      undefined / отсутствует — квест не принят
    //      'progress'               — "В процессе"
    //      'done'                   — "✅ Выполнено"
    //
    //    Каждый клик по кнопке переводит квест в следующее состояние.
    //    Из 'done' назад переключиться нельзя (кнопка неактивна).
    // ============================================================

    /**
     * Сохраняет текущий прогресс в localStorage.
     * Вызывается после каждого изменения состояния.
     */
    function saveProgress() {
        localStorage.setItem(storageKey, JSON.stringify(progress));
    }

    /**
     * Обновляет внешний вид карточки и кнопки в соответствии с текущим статусом.
     */
    function updateCardUI(card, status) {
        const btn = card.querySelector('.quest-card__btn');
        const badge = card.querySelector('.quest-card__status-badge');

        // Сначала сбрасываем классы карточки (кроме --fading и --hidden)
        card.classList.remove('quest-card--progress', 'quest-card--done');

        // Сбрасываем классы и текст бейджа
        badge.classList.remove(
            'quest-card__status-badge--visible',
            'quest-card__status-badge--progress',
            'quest-card__status-badge--done'
        );

        // Сбрасываем классы кнопки
        btn.classList.remove('quest-card__btn--active', 'quest-card__btn--done');
        btn.disabled = false;

        if (status === 'progress') {
            // Квест в процессе
            card.classList.add('quest-card--progress');
            btn.textContent = 'Отметить как выполненное';
            btn.classList.add('quest-card__btn--active');

            badge.textContent = '🔥 В процессе';
            badge.classList.add(
                'quest-card__status-badge--visible',
                'quest-card__status-badge--progress'
            );

        } else if (status === 'done') {
            // Квест выполнен
            card.classList.add('quest-card--done');
            btn.textContent = '✅ Выполнено';
            btn.classList.add('quest-card__btn--done');
            btn.disabled = true;

            badge.textContent = '✅ Выполнено';
            badge.classList.add(
                'quest-card__status-badge--visible',
                'quest-card__status-badge--done'
            );

        } else {
            // Статус отсутствует — начальное состояние
            btn.textContent = 'Принять квест';
        }
    }

    /**
     * Переключает состояние квеста на следующий шаг:
     *   null → 'progress' → 'done'
     * Обновляет счётчик выполненных (увеличивает только при переходе в 'done').
     * Сохраняет прогресс в localStorage.
     */
    function advanceQuest(card) {
        const id = card.getAttribute('data-id');
        const currentStatus = progress[id];
        let newStatus;

        if (!currentStatus) {
            // Шаг 1: принимаем квест
            newStatus = 'progress';
        } else if (currentStatus === 'progress') {
            // Шаг 2: отмечаем как выполненный
            newStatus = 'done';
        } else {
            // Уже выполнен — ничего не делаем
            return;
        }

        // Сохраняем новый статус
        progress[id] = newStatus;
        saveProgress();

        // Обновляем интерфейс карточки
        updateCardUI(card, newStatus);

        // Обновляем счётчик (если перешли в 'done')
        if (newStatus === 'done') {
            updateCounter();
        }
    }

    /**
     * Обработчик клика по кнопке квеста.
     */
    function handleQuestButtonClick(e) {
        const btn = e.currentTarget;
        const card = btn.closest('.quest-card');

        // Если кнопка уже неактивна (done) — игнорируем
        if (btn.disabled) return;

        advanceQuest(card);
    }


    // ============================================================
    // 6. СЧЁТЧИК ВЫПОЛНЕННЫХ КВЕСТОВ
    // ============================================================

    /**
     * Подсчитывает количество квестов со статусом 'done'
     * и обновляет значение на странице с анимацией "всплеска".
     */
    function updateCounter() {
        let count = 0;
        for (var key in progress) {
            if (progress.hasOwnProperty(key) && progress[key] === 'done') {
                count++;
            }
        }
        completedCounterEl.textContent = count;
        // Запускаем анимацию всплеска
        completedCounterEl.classList.remove('header__counter-value--bump');
        // Небольшая задержка, чтобы браузер сбросил анимацию
        void completedCounterEl.offsetWidth;
        completedCounterEl.classList.add('header__counter-value--bump');
    }


    // ============================================================
    // 7. ВОССТАНОВЛЕНИЕ ПРОГРЕССА ИЗ LOCALSTORAGE ПРИ ЗАГРУЗКЕ
    // ============================================================

    /**
     * Проходим по всем карточкам и восстанавливаем их состояние
     * из сохранённого объекта progress.
     */
    function restoreProgress() {
        cards.forEach(function (card) {
            const id = card.getAttribute('data-id');
            const status = progress[id];
            if (status) {
                updateCardUI(card, status);
            }
        });
        // Обновляем счётчик
        updateCounter();
    }

    // Восстанавливаем прогресс при загрузке страницы
    restoreProgress();


    // ============================================================
    // 8. ПРИВЯЗКА ОБРАБОТЧИКОВ
    // ============================================================

    // --- Поиск ---
    searchInput.addEventListener('input', filterQuests);

    // --- Фильтр по тегам ---
    filterButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            if (btn.classList.contains('tag--active')) {
                btn.classList.remove('tag--active');
                const allBtn = tagsFilter.querySelector('[data-tag="all"]');
                if (allBtn) allBtn.classList.add('tag--active');
            } else {
                filterButtons.forEach(function (b) { b.classList.remove('tag--active'); });
                btn.classList.add('tag--active');
            }
            filterQuests();
        });
    });

    // --- Кнопки квестов (делегирование через родителя, чтобы не вешать на каждую) ---
    document.getElementById('questsGrid').addEventListener('click', function (e) {
        const btn = e.target.closest('.quest-card__btn');
        if (btn) {
            handleQuestButtonClick({ currentTarget: btn });
        }
    });


    // ============================================================
    // 9. ПРИВЕТСТВЕННОЕ СООБЩЕНИЕ
    // ============================================================

    console.log('%c DevQuest запущен! ', 'background: #6366f1; color: white; font-size: 16px; padding: 8px; border-radius: 4px;');
    console.log('Ищи квесты, фильтруй по тегам и становись крутым разработчиком!');

});
