/**
 * Основной модуль приложения EduQuiz
 * Реализует квиз-механику с загрузкой вопросов из JSON
 */
document.addEventListener('DOMContentLoaded', () => {
    // Элементы интерфейса
    const startScreen = document.getElementById('start-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const resultScreen = document.getElementById('result-screen');
    const startBtn = document.getElementById('start-btn');
    const nextBtn = document.getElementById('next-btn');
    const restartBtn = document.getElementById('restart-btn');
    const homeBtn = document.getElementById('home-btn');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const progressBar = document.getElementById('progress-bar');
    const questionCounter = document.getElementById('question-counter');
    const scoreDisplay = document.getElementById('score');
    const percentageDisplay = document.getElementById('percentage');
    const feedbackDisplay = document.getElementById('feedback');

    // Состояние приложения
    let currentQuestionIndex = 0;
    let score = 0;
    let questions = [];
    let selectedOption = null;
    let quizCompleted = false;

    // Инициализация приложения
    init();

    /**
     * Инициализация приложения
     * Настройка обработчиков событий и загрузка состояния
     */
    function init() {
        setupEventListeners();
        loadProgress();
    }

    /**
     * Настройка обработчиков событий
     */
    function setupEventListeners() {
        startBtn.addEventListener('click', startQuiz);
        nextBtn.addEventListener('click', showNextQuestion);
        restartBtn.addEventListener('click', restartQuiz);
        homeBtn.addEventListener('click', goToHome);
    }

    /**
     * Загрузка прогресса из localStorage
     */
    function loadProgress() {
        const savedProgress = localStorage.getItem('quizProgress');
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            currentQuestionIndex = progress.currentQuestionIndex || 0;
            score = progress.score || 0;
            quizCompleted = progress.quizCompleted || false;
        }
    }

    /**
     * Сохранение прогресса в localStorage
     */
    function saveProgress() {
        const progress = {
            currentQuestionIndex,
            score,
            quizCompleted
        };
        localStorage.setItem('quizProgress', JSON.stringify(progress));
    }

    /**
     * Начало квиза
     */
    async function startQuiz() {
        try {
            // Загрузка вопросов из JSON
            await loadQuestions();
            
            // Сброс состояния
            currentQuestionIndex = 0;
            score = 0;
            quizCompleted = false;
            saveProgress();
            
            // Переход к экрану квиза
            startScreen.classList.remove('active');
            quizScreen.classList.add('active');
            
            // Показ первого вопроса
            showQuestion();
        } catch (error) {
            console.error('Ошибка загрузки вопросов:', error);
            alert('Не удалось загрузить вопросы. Проверьте файл questions.json');
        }
    }

    /**
     * Загрузка вопросов из JSON-файла
     */
    async function loadQuestions() {
        const response = await fetch('questions.json');
        if (!response.ok) {
            throw new Error('Не удалось загрузить вопросы');
        }
        
        const data = await response.json();
        
        // Валидация данных
        if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
            throw new Error('Некорректный формат вопросов');
        }
        
        questions = data.questions;
    }

    /**
     * Отображение текущего вопроса
     */
    function showQuestion() {
        resetState();
        
        const currentQuestion = questions[currentQuestionIndex];
        if (!currentQuestion) return;
        
        // Обновление интерфейса
        questionText.textContent = currentQuestion.text;
        questionCounter.textContent = `${currentQuestionIndex + 1}/${questions.length}`;
        
        // Прогресс бар
        const progressPercent = ((currentQuestionIndex) / questions.length) * 100;
        progressBar.style.width = `${progressPercent}%`;
        
        // Создание вариантов ответов
        currentQuestion.options.forEach((option, index) => {
            const optionElement = document.createElement('button');
            optionElement.classList.add('option-btn');
            optionElement.textContent = option;
            optionElement.dataset.index = index;
            optionElement.addEventListener('click', () => selectOption(optionElement, index));
            optionsContainer.appendChild(optionElement);
        });
    }

    /**
     * Сброс состояния перед показом нового вопроса
     */
    function resetState() {
        selectedOption = null;
        nextBtn.classList.add('hidden');
        
        // Очистка контейнера с вариантами
        while (optionsContainer.firstChild) {
            optionsContainer.removeChild(optionsContainer.firstChild);
        }
    }

    /**
     * Выбор варианта ответа
     * @param {HTMLElement} optionElement - HTML-элемент варианта ответа
     * @param {number} optionIndex - Индекс выбранного варианта
     */
    function selectOption(optionElement, optionIndex) {
        if (selectedOption !== null) return;
        
        selectedOption = optionIndex;
        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = optionIndex === currentQuestion.correct;
        
        // Подсветка выбранного варианта
        optionElement.classList.add('selected');
        
        // Подсветка правильного ответа
        const options = optionsContainer.querySelectorAll('.option-btn');
        options[currentQuestion.correct].classList.add('correct');
        
        // Если ответ неправильный, подсветить ошибку
        if (!isCorrect) {
            optionElement.classList.add('incorrect');
        } else {
            score++;
        }
        
        // Показать кнопку "Далее"
        nextBtn.classList.remove('hidden');
        
        // Сохранить прогресс
        saveProgress();
    }

    /**
     * Показать следующий вопрос или результаты
     */
    function showNextQuestion() {
        currentQuestionIndex++;
        
        if (currentQuestionIndex < questions.length) {
            showQuestion();
        } else {
            showResults();
        }
    }

    /**
     * Показать экран результатов
     */
    function showResults() {
        quizCompleted = true;
        saveProgress();
        
        // Расчет результатов
        const percentage = Math.round((score / questions.length) * 100);
        
        // Обновление интерфейса
        quizScreen.classList.remove('active');
        resultScreen.classList.add('active');
        
        scoreDisplay.textContent = `${score}/${questions.length}`;
        percentageDisplay.textContent = `${percentage}%`;
        
        // Отзыв в зависимости от результата
        if (percentage >= 80) {
            feedbackDisplay.textContent = 'Отличный результат! Вы настоящий эксперт!';
        } else if (percentage >= 50) {
            feedbackDisplay.textContent = 'Хороший результат! Еще немного практики и вы станете лучше!';
        } else {
            feedbackDisplay.textContent = 'Попробуйте еще раз! Вы обязательно улучшите свой результат!';
        }
    }

    /**
     * Перезапуск квиза
     */
    function restartQuiz() {
        // Сброс состояния
        currentQuestionIndex = 0;
        score = 0;
        quizCompleted = false;
        saveProgress();
        
        // Переход к экрану квиза
        resultScreen.classList.remove('active');
        quizScreen.classList.add('active');
        
        // Показ первого вопроса
        showQuestion();
    }

    /**
     * Возврат на главный экран
     */
    function goToHome() {
        // Сброс состояния
        currentQuestionIndex = 0;
        score = 0;
        quizCompleted = false;
        saveProgress();
        
        // Переход к стартовому экрану
        resultScreen.classList.remove('active');
        startScreen.classList.add('active');
    }
});