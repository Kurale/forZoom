document.addEventListener('DOMContentLoaded', () => {
    // === Глобальные переменные ===
    let levelsData = []; // Сюда загрузим JSON
    let currentLevelIndex = 0; // Текущий уровень
    let correctFoundCount = 0; // Сколько правильных нашли на текущем уровне

    // === DOM Элементы ===
    const screens = {
        start: document.getElementById('start-screen'),
        word: document.getElementById('word-screen'),
        choice: document.getElementById('choice-screen'),
        win: document.getElementById('win-screen')
    };

    const wordDisplay = document.getElementById('word-display');
    const emojiGrid = document.getElementById('emoji-grid');
    const startBtn = document.getElementById('start-btn');
    const nextBtn = document.getElementById('next-level-btn');

    // === Аудио (Создаем объекты Audio) ===
    // Примечание: Для работы нужны файлы в папке звуков.
    // Если файлов нет, код не сломается, просто будет ошибка в консоли.
    const audio = {
        pop: new Audio('sound/pop.wav'), // Звук появления слова
        correct: new Audio('sound/correct.wav'), // Звук успеха
        wrong: new Audio('sound/incorrect.wav'), // Звук ошибки
        win: new Audio('sound/Winner.wav') // Финал
    };
    
    // Понизим громкость, чтобы не пугать детей
    Object.values(audio).forEach(snd => snd.volume = 0.5);


    // === 1. Инициализация и Загрузка Данных ===
    async function initGame() {
        try {
            const response = await fetch('data.json');
            levelsData = await response.json();
            
            startBtn.addEventListener('click', () => startLevel(currentLevelIndex));
            nextBtn.addEventListener('click', nextLevel);
            
            console.log("Данные загружены:", levelsData);
        } catch (error) {
            console.error("Ошибка загрузки JSON:", error);
            wordDisplay.innerText = "Ошибка загрузки :(";
            wordDisplay.classList.remove('hidden');
        }
    }

    // === 2. Управление экранами ===
    function showScreen(screenName) {
        // Скрываем все экраны
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        // Показываем нужный
        screens[screenName].classList.add('active');
    }

    // === 3. Старт Уровня ===
    function startLevel(index) {
        if (index >= levelsData.length) {
            alert("Все уровни пройдены! Начинаем сначала.");
            currentLevelIndex = 0;
            index = 0;
        }

        const level = levelsData[index];
        correctFoundCount = 0; // Сброс счетчика
        
        // Запуск фазы показа слов
        playWordSequence(level.words);
    }

    // === 4. Фаза 1: Показ слов (Асинхронно) ===
    async function playWordSequence(words) {
        showScreen('word');
        
        // Вспомогательная функция задержки
        const delay = ms => new Promise(res => setTimeout(res, ms));

        for (let i = 0; i < words.length; i++) {
            // 1. Позиционируем слово в случайном месте
            // Отступаем 10-80%, чтобы не ушло за край
            const randomTop = 20 + Math.random() * 50; 
            const randomLeft = 10 + Math.random() * 60; 
            
            wordDisplay.style.top = `${randomTop}%`;
            wordDisplay.style.left = `${randomLeft}%`;
            wordDisplay.innerText = words[i];

            // 2. Показываем
            wordDisplay.classList.remove('hidden');
            wordDisplay.classList.add('visible');
            audio.pop.play().catch(() => {}); // Игнор ошибки автоплея

            // 3. Ждем 1.5 - 2 секунды (чтобы ребенок прочитал)
            await delay(2000); 

            // 4. Скрываем
            wordDisplay.classList.remove('visible');
            wordDisplay.classList.add('hidden');

            // 5. Короткая пауза перед следующим словом
            await delay(500); 
        }

        // Когда слова закончились -> переходим к выбору
        setupChoicePhase(levelsData[currentLevelIndex].options);
    }

    // === 5. Фаза 2: Настройка выбора ===
    function setupChoicePhase(options) {
        showScreen('choice');
        emojiGrid.innerHTML = ''; // Очищаем старое

        // Перемешиваем варианты, чтобы правильные не были всегда первыми
        const shuffledOptions = [...options].sort(() => Math.random() - 0.5);

        shuffledOptions.forEach(opt => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.innerText = opt.emoji;
            
            // Сохраняем в dataset правильный это ответ или нет
            // Преобразуем boolean в string для dataset
            card.dataset.correct = opt.isCorrect;

            // Вешаем обработчик клика
            card.addEventListener('click', handleCardClick);
            
            emojiGrid.appendChild(card);
        });
    }

    // === 6. Обработка клика ===
    function handleCardClick(e) {
        const card = e.target;

        // Если уже угадано, ничего не делаем
        if (card.classList.contains('correct')) return;

        const isCorrect = card.dataset.correct === 'true';

        if (isCorrect) {
            // ПРАВИЛЬНО
            card.classList.add('correct');
            audio.correct.currentTime = 0;
            audio.correct.play();
            correctFoundCount++;

            // Проверка на победу (нужно найти 4 слова)
            if (correctFoundCount === 4) {
                setTimeout(handleWin, 1000); // Небольшая задержка перед победой
            }
        } else {
            // ОШИБКА
            card.classList.add('wrong');
            audio.wrong.currentTime = 0;
            audio.wrong.play();

            // Убираем класс ошибки через полсекунды, чтобы можно было снова "трясти"
            setTimeout(() => {
                card.classList.remove('wrong');
            }, 500);
        }
    }

    // === 7. Победа и переход ===
    function handleWin() {
        audio.win.play();
        showScreen('win');
    }

    function nextLevel() {
        currentLevelIndex++;
        startLevel(currentLevelIndex);
    }

    // Запуск приложения
    initGame();
});