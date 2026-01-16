// --- Глобальные переменные ---
let tasks = []; // Здесь будут храниться задания из JSON
let currentTaskIndex = 0;
const alphabet = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя".split("");

// Ссылки на DOM элементы
const sentenceContainer = document.getElementById('sentence-container');
const alphabetContainer = document.getElementById('alphabet-container');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const slideCounter = document.getElementById('slide-counter');
const soundCorrect = document.getElementById('sound-correct');
const soundWrong = document.getElementById('sound-wrong');

// Элементы модального окна загрузки
const loadDataBtn = document.getElementById('load-data-btn');
const loadModal = document.getElementById('load-modal');
const closeModal = document.querySelector('.close-modal');
const filenameInput = document.getElementById('filename-input');
const loadBtn = document.getElementById('load-btn');
const loadError = document.getElementById('load-error');

// --- 1. Инициализация и Загрузка Данных ---

// Функция валидации структуры JSON
function validateTasksData(data) {
    if (!Array.isArray(data)) {
        return { valid: false, error: "Данные должны быть массивом" };
    }
    
    if (data.length === 0) {
        return { valid: false, error: "Массив заданий пуст" };
    }
    
    for (let i = 0; i < data.length; i++) {
        const task = data[i];
        
        if (!task.id || typeof task.id !== 'number') {
            return { valid: false, error: `Задание ${i + 1}: отсутствует или некорректен id` };
        }
        
        if (!task.fullSentence || typeof task.fullSentence !== 'string') {
            return { valid: false, error: `Задание ${i + 1}: отсутствует или некорректен fullSentence` };
        }
        
        if (!Array.isArray(task.textParts)) {
            return { valid: false, error: `Задание ${i + 1}: отсутствует или некорректен textParts` };
        }
        
        if (!Array.isArray(task.answers)) {
            return { valid: false, error: `Задание ${i + 1}: отсутствует или некорректен answers` };
        }
        
        // Проверяем, что количество подчеркиваний в textParts равно количеству ответов
        const blankCount = task.textParts.filter(part => part === "_").length;
        if (blankCount !== task.answers.length) {
            return { valid: false, error: `Задание ${i + 1}: количество пропусков (${blankCount}) не соответствует количеству ответов (${task.answers.length})` };
        }
    }
    
    return { valid: true, error: null };
}

// Функция старта приложения
async function initApp(filename = 'data') {
    try {
        // Выполняем fetch запрос к JSON файлу
        const response = await fetch(`${filename}.json`);
        if (!response.ok) throw new Error(`Файл "${filename}.json" не найден`);
        
        const data = await response.json();
        
        // Валидация данных
        const validation = validateTasksData(data);
        if (!validation.valid) {
            throw new Error(validation.error);
        }
        
        tasks = data;
        
        // Сбрасываем индекс текущего задания
        currentTaskIndex = 0;
        
        // Рендерим алфавит один раз (он не меняется)
        renderAlphabet();
        
        // Загружаем первый слайд
        loadSlide(currentTaskIndex);
        
        return { success: true, error: null };
    } catch (error) {
        console.error("Ошибка:", error);
        // Если это начальная загрузка (из модального окна не вызывалось), показываем ошибку на странице
        if (!loadModal.classList.contains('show')) {
            sentenceContainer.innerHTML = `<div style="color: #e74c3c; text-align: center; padding: 20px;">
                <p>Не удалось загрузить задания.</p>
                <p style="font-size: 0.9em; margin-top: 10px;">${error.message}</p>
            </div>`;
        }
        return { success: false, error: error.message };
    }
}

// --- 2. Рендеринг (Отрисовка) ---

function renderAlphabet() {
    alphabetContainer.innerHTML = '';
    alphabet.forEach(letter => {
        const el = document.createElement('div');
        el.classList.add('letter-card');
        el.textContent = letter;
        // Добавляем обработчик КЛИКА для выбора буквы
        el.addEventListener('click', handleLetterClick);
        alphabetContainer.appendChild(el);
    });
}

function loadSlide(index) {
    const task = tasks[index];
    sentenceContainer.innerHTML = ''; 
    
    let answerIndex = 0;

    task.textParts.forEach(part => {
        if (part === "_") {
            const dropZone = document.createElement('span');
            dropZone.classList.add('drop-zone');
            dropZone.dataset.answer = task.answers[answerIndex]; 
            dropZone.dataset.filled = "false"; 
            
            // Добавляем обработчик КЛИКА для зоны сброса
            dropZone.addEventListener('click', handleDropZoneClick);
            
            // Добавляем, чтобы буква внутри не скакала
            dropZone.style.lineHeight = "1"; 
            
            sentenceContainer.appendChild(dropZone);
            answerIndex++;
        } else {
            const span = document.createElement('span');
            span.classList.add('text-part');
            span.textContent = part;
            sentenceContainer.appendChild(span);
        }
    });

    updateNavigation();
}

function updateNavigation() {
    slideCounter.textContent = `${currentTaskIndex + 1} / ${tasks.length}`;
    btnPrev.disabled = currentTaskIndex === 0;
    btnNext.disabled = currentTaskIndex === tasks.length - 1;
}

// --- 3. Логика КЛИКОВОЙ системы ---

let selectedLetter = null; // Выбранная буква
let selectedElement = null; // DOM-элемент выбранной буквы
let isDragging = false; // Флаг, что буква "приклеена" к курсору

// Обработчик клика по букве
function handleLetterClick(e) {
    e.preventDefault();
    
    // Если уже перетаскиваем букву, отменяем
    if (isDragging) {
        cancelDragging();
        return;
    }
    
    // Начинаем перетаскивание
    const sourceElement = e.target;
    selectedLetter = sourceElement.textContent;
    selectedElement = sourceElement;
    
    // Делаем букву полупрозрачной в алфавите
    sourceElement.classList.add('selected');
    
    // Создаем "призрака" - копию буквы, которая будет летать
    const draggedGhost = sourceElement.cloneNode(true);
    draggedGhost.classList.add('draggable-ghost');
    draggedGhost.id = 'dragging-ghost';
    document.body.appendChild(draggedGhost);
    
    // Устанавливаем флаг перетаскивания
    isDragging = true;
    
    // Подписываемся на движение мыши для обновления позиции призрака
    document.addEventListener('mousemove', updateGhostPosition);
    document.addEventListener('touchmove', updateGhostPosition, {passive: false});
    
    // Начальная позиция призрака
    updateGhostPosition(e);
}

// Обработчик клика по зоне сброса
function handleDropZoneClick(e) {
    e.preventDefault();
    
    // Если не перетаскиваем букву, ничего не делаем
    if (!isDragging) return;
    
    const dropZone = e.target;
    
    // Проверяем ответ
    checkAnswer(dropZone, selectedLetter);
    
    // Завершаем перетаскивание
    cancelDragging();
}

// Функция обновления позиции призрака
function updateGhostPosition(e) {
    if (!isDragging) return;
    
    const ghost = document.getElementById('dragging-ghost');
    if (!ghost) return;
    
    // Определяем координаты (мышь или палец)
    const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
    
    // Центрируем элемент относительно курсора
    ghost.style.left = (clientX - 25) + 'px';
    ghost.style.top = (clientY - 25) + 'px';
}

// Функция отмены перетаскивания
function cancelDragging() {
    if (!isDragging) return;
    
    // Удаляем призрака
    const ghost = document.getElementById('dragging-ghost');
    if (ghost) ghost.remove();
    
    // Возвращаем исходной букве обычный вид
    if (selectedElement) {
        selectedElement.classList.remove('selected');
    }
    
    // Удаляем слушатели движения
    document.removeEventListener('mousemove', updateGhostPosition);
    document.removeEventListener('touchmove', updateGhostPosition);
    
    // Сбрасываем переменные
    selectedLetter = null;
    selectedElement = null;
    isDragging = false;
}

// --- 4. Проверка ответа ---

function checkAnswer(zone, letter) {
    // Если зона уже заполнена, игнорируем
    if (zone.dataset.filled === "true") return;

    const expectedLetter = zone.dataset.answer;

    if (letter.toLowerCase() === expectedLetter.toLowerCase()) {
        // -- УСПЕХ --
        zone.textContent = letter; // Вставляем букву
        zone.classList.add('filled');
        zone.classList.add('success-anim'); // Зеленая вспышка
        zone.dataset.filled = "true";
        
        soundCorrect.currentTime = 0;
        soundCorrect.play();
    } else {
        // -- ОШИБКА --
        // Визуальный эффект ошибки
        zone.classList.add('error-anim');
        
        soundWrong.currentTime = 0;
        soundWrong.play();

        // Убираем класс анимации через полсекунды
        setTimeout(() => {
            zone.classList.remove('error-anim');
        }, 400);
    }
}

// --- 5. Обработчики навигации ---

btnPrev.addEventListener('click', () => {
    if (currentTaskIndex > 0) {
        currentTaskIndex--;
        loadSlide(currentTaskIndex);
    }
});

btnNext.addEventListener('click', () => {
    if (currentTaskIndex < tasks.length - 1) {
        currentTaskIndex++;
        loadSlide(currentTaskIndex);
    }
});

// --- 6. Модальное окно загрузки ---

// Открытие модального окна
function openLoadModal() {
    loadModal.classList.add('show');
    filenameInput.value = '';
    loadError.textContent = '';
    filenameInput.focus();
}

// Закрытие модального окна
function closeLoadModal() {
    loadModal.classList.remove('show');
}

// Обработчик кнопки загрузки
async function handleLoadData() {
    const filename = filenameInput.value.trim();
    
    if (!filename) {
        loadError.textContent = 'Введите название файла';
        return;
    }
    
    loadError.textContent = 'Загрузка...';
    
    const result = await initApp(filename);
    
    if (result.success) {
        closeLoadModal();
    } else {
        loadError.textContent = result.error;
    }
}

// Обработчики событий для модального окна
loadDataBtn.addEventListener('click', openLoadModal);
closeModal.addEventListener('click', closeLoadModal);
loadBtn.addEventListener('click', handleLoadData);

// Закрытие по клику вне модального окна
loadModal.addEventListener('click', (e) => {
    if (e.target === loadModal) {
        closeLoadModal();
    }
});

// Закрытие по клавише Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && loadModal.classList.contains('show')) {
        closeLoadModal();
    }
});

// Загрузка по Enter в поле ввода
filenameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleLoadData();
    }
});

// Запуск при загрузке страницы
initApp();