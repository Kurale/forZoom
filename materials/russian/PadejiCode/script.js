// --- Переменные состояния ---
let questions = []; // Плоский список всех вопросов
let currentQuestionIndex = 0;
let score = 0;
let errors = 0;
let startTime;
let timerInterval;
let casesList = []; // Список названий падежей (ключи из JSON)

// Настройки
let isTimerEnabled = true;
let isSoundEnabled = true;

// DOM элементы
const screens = {
    menu: document.getElementById('menu-screen'),
    game: document.getElementById('game-screen'),
    result: document.getElementById('result-screen')
};
const wordBubble = document.getElementById('word-bubble');
const wheel = document.getElementById('wheel');
const timerDisplay = document.getElementById('timer-display');
const scoreDisplay = document.getElementById('score-val');

// --- 1. Инициализация и Загрузка ---

// Функция загрузки JSON (запускается при старте)
async function loadData() {
    try {
        const response = await fetch('data.json'); 
        const data = await response.json();
        processData(data);
    } catch (error) {
        console.error("Ошибка загрузки data.json:", error);
        wordBubble.textContent = "Ошибка данных!";
    }
}

// Превращаем JSON в удобный массив для игры
function processData(data) {
    questions = [];
    casesList = Object.keys(data); // Получаем список падежей (Родительный, Дательный...)
    
    // Рисуем колесо на основе количества падежей
    renderWheel(casesList);

    // Собираем все фразы в одну кучу
    casesList.forEach(caseName => {
        data[caseName].forEach(phrase => {
            questions.push({
                text: phrase,
                correctCase: caseName
            });
        });
    });
}

// Отрисовка секторов колеса (CSS conic-gradient)
function renderWheel(keys) {
    const count = keys.length;
    const sectorSize = 360 / count;
    
    // Цвета для секторов (мягкие пастельные тона)
    const colors = ['#FF9AA2', '#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA'];
    
    // Формируем градиент
    let gradientParts = [];
    keys.forEach((key, index) => {
        const startDeg = index * sectorSize;
        const endDeg = (index + 1) * sectorSize;
        const color = colors[index % colors.length];
        gradientParts.push(`${color} ${startDeg}deg ${endDeg}deg`);
        
        // Добавляем подпись (Label)
        const label = document.createElement('div');
        label.className = 'sector-label';
        label.textContent = key;
        
        // Математика для позиционирования текста по кругу
        // Смещаем угол на половину сектора, чтобы текст был в центре
        const midAngle = startDeg + (sectorSize / 2);
        // Коррекция -90 градусов, т.к. 0 градусов в CSS это 12 часов, а в Math - 3 часа
        const rad = (midAngle - 90) * (Math.PI / 180); 
        const radius = 120; // Радиус размещения текста (чуть меньше радиуса круга)
        
        const x = Math.cos(rad) * radius;
        const y = Math.sin(rad) * radius;
        
        // translate(-50%, -50%) нужен, чтобы центрировать сам div текста
        label.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${midAngle}deg)`;
        
        wheel.appendChild(label);
    });
    
    wheel.style.background = `conic-gradient(${gradientParts.join(', ')})`;
}

// --- 2. Управление игрой ---

function startGame() {
    // Считываем настройки
    isTimerEnabled = document.getElementById('timer-toggle').checked;
    isSoundEnabled = document.getElementById('sound-toggle').checked;

    // Сброс счетчиков
    score = 0;
    errors = 0;
    currentQuestionIndex = 0;
    scoreDisplay.textContent = '0';
    
    // Перемешиваем вопросы (Алгоритм Фишера-Йейтса)
    questions.sort(() => Math.random() - 0.5);

    // Переключаем экран
    showScreen('game');
    
    // Запускаем таймер
    if (isTimerEnabled) {
        startTime = Date.now();
        timerInterval = setInterval(updateTimer, 1000);
    } else {
        timerDisplay.textContent = "--:--";
    }

    showNextWord();
}

function showNextWord() {
    // Сбрасываем стили (цвет, позицию)
    resetBubble();

    if (currentQuestionIndex >= questions.length) {
        endGame();
        return;
    }

    const q = questions[currentQuestionIndex];
    // Можно добавить выделение жирным ключевых слов, если нужно
    wordBubble.innerHTML = q.text.replace(" ", "<br>"); 
    // Записываем правильный ответ в атрибут элемента (для проверки)
    wordBubble.dataset.correct = q.correctCase;
}

function resetBubble() {
    wordBubble.className = 'word-bubble'; // Убираем классы wrong/correct
    wordBubble.style.transform = `translate(0px, 0px)`; // Возвращаем в центр
    wordBubble.style.transition = 'transform 0.2s';
}

// --- 3. Логика Drag & Drop (Свайпы) ---

let isDragging = false;
let startX, startY;
let currentX = 0, currentY = 0;

// Обработчики событий (поддержка мыши и тача)
wordBubble.addEventListener('mousedown', startDrag);
wordBubble.addEventListener('touchstart', startDrag, {passive: false});

document.addEventListener('mousemove', drag);
document.addEventListener('touchmove', drag, {passive: false});

document.addEventListener('mouseup', endDrag);
document.addEventListener('touchend', endDrag);

function startDrag(e) {
    if (currentQuestionIndex >= questions.length) return; // Игра окончена
    
    isDragging = true;
    wordBubble.style.transition = 'none'; // Убираем плавность для мгновенной реакции
    wordBubble.classList.add('dragging');

    // Получаем координаты начала (мышь или палец)
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    startX = clientX;
    startY = clientY;
}

function drag(e) {
    if (!isDragging) return;
    e.preventDefault(); // Блокируем скролл страницы

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Вычисляем смещение
    currentX = clientX - startX;
    currentY = clientY - startY;

    // Двигаем пузырь
    wordBubble.style.transform = `translate(${currentX}px, ${currentY}px)`;
}

function endDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    wordBubble.classList.remove('dragging');

    // Проверяем, достаточно ли далеко утащили (защита от случайных кликов)
    const distance = Math.sqrt(currentX*currentX + currentY*currentY);
    
    if (distance > 50) {
        checkAnswer(currentX, currentY);
    } else {
        // Если просто кликнули или мало сдвинули - возвращаем назад
        resetBubble();
    }
}

// --- 4. Проверка ответа (Математика) ---

function checkAnswer(x, y) {
    // Вычисляем угол в радианах. Math.atan2 возвращает угол от -PI до +PI
    // (0 - это 3 часа, положительные по часовой стрелке)
    let angleRad = Math.atan2(y, x);
    let angleDeg = angleRad * (180 / Math.PI);
    
    // Преобразуем угол к системе 0-360, где 0 - это 12 часов (как в CSS)
    // Math.atan2: 0 = Right. CSS: 0 = Top. Сдвигаем на 90.
    angleDeg += 90; 
    
    // Нормализуем (если стало < 0 или > 360)
    if (angleDeg < 0) angleDeg += 360;
    if (angleDeg >= 360) angleDeg -= 360;

    // Определяем сектор
    const sectorCount = casesList.length;
    const sectorSize = 360 / sectorCount;
    
    // Индекс сектора = угол / размер сектора
    const sectorIndex = Math.floor(angleDeg / sectorSize);
    
    // Защита от выхода за массив (редкий случай ровно 360)
    const safeIndex = sectorIndex >= sectorCount ? 0 : sectorIndex;
    
    const selectedCase = casesList[safeIndex];
    const correctCase = wordBubble.dataset.correct;

    if (selectedCase === correctCase) {
        // ВЕРНО
        score++;
        scoreDisplay.textContent = score;
        wordBubble.classList.add('correct');
        // Небольшая задержка перед следующим словом
        setTimeout(() => {
            currentQuestionIndex++;
            showNextWord();
        }, 500);
    } else {
        // ОШИБКА
        errors++;
        wordBubble.classList.add('wrong');
        if (isSoundEnabled) {
            // Можно добавить звук ошибки здесь
            // console.log("Sound: Error");
        }
        // Возвращаем в центр, даем попробовать еще раз (или пропускаем, зависит от правил)
        // В данном варианте - возвращаем, пусть исправляет
        setTimeout(resetBubble, 500);
    }
}

// --- 5. Вспомогательные функции ---

function updateTimer() {
    const now = Date.now();
    const diff = Math.floor((now - startTime) / 1000);
    const m = Math.floor(diff / 60).toString().padStart(2, '0');
    const s = (diff % 60).toString().padStart(2, '0');
    timerDisplay.textContent = `${m}:${s}`;
}

function endGame() {
    clearInterval(timerInterval);
    document.getElementById('final-score').textContent = score;
    document.getElementById('final-errors').textContent = errors;
    document.getElementById('final-time').textContent = timerDisplay.textContent;
    showScreen('result');
}

function showScreen(id) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[id].classList.add('active');
}

// Привязка кнопок
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);

// Запуск
loadData();