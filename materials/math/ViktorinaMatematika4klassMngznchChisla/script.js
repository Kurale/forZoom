document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const startScreen = document.getElementById('start-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const resultScreen = document.getElementById('result-screen');
    const usernameInput = document.getElementById('username');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    const startButton = document.getElementById('start-btn');
    const nextButton = document.getElementById('next-btn');
    const restartButton = document.getElementById('restart-btn');
    const changeDifficultyButton = document.getElementById('change-difficulty-btn');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const currentQuestionDisplay = document.getElementById('current-question');
    const progressBar = document.getElementById('progress-bar');
    const timerDisplay = document.getElementById('timer');
    
    // Элементы результатов
    const resultUsername = document.getElementById('result-username');
    const resultScore = document.getElementById('result-score');
    const resultPercentage = document.getElementById('result-percentage');
    const resultTime = document.getElementById('result-time');
    const resultFeedback = document.getElementById('result-feedback');
    
    // Переменные викторины
    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let selectedDifficulty = '';
    let username = '';
    let startTime;
    let timerInterval;
    let selectedOption = null;
    let answered = false;
    
    // Обработчики событий
    difficultyButtons.forEach(button => {
    button.addEventListener('click', function() {
        // Удаляем активное состояние у всех кнопок
        difficultyButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.style.opacity = '0.7';
            btn.style.transform = 'translateY(0)';
        });
        
        // Добавляем активное состояние к выбранной кнопке
        this.classList.add('active');
        this.style.opacity = '1';
        this.style.transform = 'translateY(-3px)';
        
        selectedDifficulty = this.dataset.level;
    });
});
    
    startButton.addEventListener('click', startQuiz);
    nextButton.addEventListener('click', nextQuestion);
    restartButton.addEventListener('click', restartQuiz);
    changeDifficultyButton.addEventListener('click', changeDifficulty);
    
    // Начать викторину
    function startQuiz() {
        username = usernameInput.value.trim();
        
        if (!username) {
            alert('Пожалуйста, введите ваше имя');
            return;
        }
        
        if (!selectedDifficulty) {
            alert('Пожалуйста, выберите уровень сложности');
            return;
        }
        
        // Загрузка вопросов
        loadQuestions(selectedDifficulty)
            .then(() => {
                username = usernameInput.value.trim();
                startScreen.classList.remove('active');
                quizScreen.classList.add('active');
                startTime = new Date();
                startTimer();
                showQuestion();
            })
            .catch(error => {
                console.error('Ошибка загрузки вопросов:', error);
                alert('Произошла ошибка при загрузке вопросов. Пожалуйста, попробуйте позже.');
            });
    }
    
    // Загрузка вопросов из JSON
    async function loadQuestions(difficulty) {
        try {
            const response = await fetch(`questions/${difficulty}.json`);
            if (!response.ok) {
                throw new Error('Не удалось загрузить вопросы');
            }
            questions = await response.json();
            // Перемешиваем вопросы
            questions = shuffleArray(questions).slice(0, 10); // Берем 10 случайных вопросов
        } catch (error) {
            throw error;
        }
    }
    
    // Показать текущий вопрос
    function showQuestion() {
        resetState();
        const currentQuestion = questions[currentQuestionIndex];
        const questionNo = currentQuestionIndex + 1;
        
        currentQuestionDisplay.textContent = `${questionNo}/${questions.length}`;
        progressBar.style.width = `${(questionNo / questions.length) * 100}%`;
        questionText.textContent = currentQuestion.question;
        
        // Создаем варианты ответов
        currentQuestion.options.forEach(option => {
            const button = document.createElement('button');
            button.classList.add('option-btn');
            button.textContent = option.text;
            button.dataset.correct = option.correct;
            button.addEventListener('click', selectAnswer);
            optionsContainer.appendChild(button);
        });
    }
    
    // Сброс состояния перед новым вопросом
    function resetState() {
        answered = false;
        selectedOption = null;
        nextButton.disabled = true;
        while (optionsContainer.firstChild) {
            optionsContainer.removeChild(optionsContainer.firstChild);
        }
    }
    
    // Выбор ответа
    function selectAnswer(e) {
        if (answered) return;
        
        answered = true;
        selectedOption = e.target;
        const correct = selectedOption.dataset.correct === 'true';
        
        if (correct) {
            score++;
            selectedOption.classList.add('correct');
        } else {
            selectedOption.classList.add('incorrect');
            // Показать правильный ответ
            const options = document.querySelectorAll('.option-btn');
            options.forEach(option => {
                if (option.dataset.correct === 'true') {
                    option.classList.add('correct');
                }
            });
        }
        
        nextButton.disabled = false;
    }
    
    // Следующий вопрос
    function nextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            showQuestion();
        } else {
            finishQuiz();
        }
    }
    
    // Завершение викторины
    function finishQuiz() {
        clearInterval(timerInterval);
        const endTime = new Date();
        const timeSpent = Math.floor((endTime - startTime) / 1000);
        const minutes = Math.floor(timeSpent / 60);
        const seconds = timeSpent % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const percentage = Math.round((score / questions.length) * 100);
        
        // Показать результаты
        quizScreen.classList.remove('active');
        resultScreen.classList.add('active');
        
        resultUsername.textContent = `Пользователь: ${username}`;
        resultScore.textContent = `Правильных ответов: ${score} из ${questions.length}`;
        resultPercentage.textContent = `Процент правильных ответов: ${percentage}%`;
        resultTime.textContent = `Затраченное время: ${timeString}`;
        
        // Обратная связь в зависимости от результата
        let feedback = '';
        if (percentage >= 90) {
            feedback = 'Отличный результат! Вы отлично знаете нумерацию многозначных чисел!';
        } else if (percentage >= 70) {
            feedback = 'Хороший результат! Есть еще что повторить, но вы на верном пути!';
        } else if (percentage >= 50) {
            feedback = 'Неплохо, но стоит еще раз изучить тему нумерации многозначных чисел.';
        } else {
            feedback = 'Вам нужно повторить тему нумерации многозначных чисел. Попробуйте еще раз!';
        }
        
        resultFeedback.textContent = `Отзыв: ${feedback}`;
    }
    
    // Перезапуск викторины
    function restartQuiz() {
        currentQuestionIndex = 0;
        score = 0;
        resultScreen.classList.remove('active');
        quizScreen.classList.add('active');
        startTime = new Date();
        startTimer();
        showQuestion();
    }
    
    // Изменить уровень сложности
    function changeDifficulty() {
        currentQuestionIndex = 0;
        score = 0;
        resultScreen.classList.remove('active');
        startScreen.classList.add('active');
    }
    
    // Таймер
    function startTimer() {
        clearInterval(timerInterval);
        let seconds = 0;
        
        function updateTimer() {
            seconds++;
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        
        timerInterval = setInterval(updateTimer, 1000);
    }
    
    // Вспомогательные функции
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
});