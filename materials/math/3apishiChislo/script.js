// Game State
const gameState = {
    userName: '',
    difficulty: '',
    currentQuestion: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    startTime: null,
    endTime: null,
    questions: []
};

// DOM Elements
const startScreen = document.getElementById('start-screen');
const taskScreen = document.getElementById('task-screen');
const feedbackScreen = document.getElementById('feedback-screen');
const resultsScreen = document.getElementById('results-screen');
const nameInput = document.getElementById('name');
const questionElement = document.getElementById('question');
const userAnswerInput = document.getElementById('user-answer');
const progressElement = document.getElementById('progress');
const timerElement = document.getElementById('timer');
const correctFeedback = document.getElementById('correct-feedback');
const wrongFeedback = document.getElementById('wrong-feedback');
const resultNameElement = document.getElementById('result-name');
const resultLevelElement = document.getElementById('result-level');
const resultCorrectElement = document.getElementById('result-correct');
const resultTimeElement = document.getElementById('result-time');
const correctBar = document.querySelector('.correct-bar');
const wrongBar = document.querySelector('.wrong-bar');

// Keyboard buttons
const numButtons = document.querySelectorAll('.keyboard-key.num');
const backspaceButton = document.querySelector('.keyboard-key.backspace');
const resetButton = document.querySelector('.keyboard-key.reset');
const checkButton = document.querySelector('.keyboard-key.check');
const nextButton = document.querySelector('.next-btn');
const restartButton = document.querySelector('.restart-btn');
const backButton = document.querySelector('.back-btn');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');

// Event Listeners
difficultyButtons.forEach(button => {
    button.addEventListener('click', () => startGame(button.dataset.level));
});

numButtons.forEach(button => {
    button.addEventListener('click', () => appendToAnswer(button.dataset.value));
});

backspaceButton.addEventListener('click', backspace);
resetButton.addEventListener('click', resetAnswer);
checkButton.addEventListener('click', checkAnswer);
nextButton.addEventListener('click', nextQuestion);
restartButton.addEventListener('click', restartGame);
backButton.addEventListener('click', backToQuestion);

// Functions
function startGame(difficulty) {
    const name = nameInput.value.trim();
    if (!name) {
        alert('Пожалуйста, введи своё имя!');
        return;
    }
    
    gameState.userName = name;
    gameState.difficulty = difficulty;
    gameState.currentQuestion = 0;
    gameState.correctAnswers = 0;
    gameState.wrongAnswers = 0;
    gameState.startTime = new Date();
    
    // Load questions based on difficulty
    const jsonFile = `${difficulty}.json`;
    fetch(jsonFile)
        .then(response => response.json())
        .then(data => {
            gameState.questions = data;
            showTaskScreen();
            loadQuestion();
        })
        .catch(error => {
            console.error('Error loading questions:', error);
            alert('Ошибка загрузки вопросов. Пожалуйста, попробуй ещё раз.');
        });
}

function showTaskScreen() {
    startScreen.classList.remove('active');
    taskScreen.classList.add('active');
    feedbackScreen.classList.remove('active');
    resultsScreen.classList.remove('active');
    updateTimer();
}

function loadQuestion() {
    if (gameState.currentQuestion >= gameState.questions.length) {
        showResults();
        return;
    }
    
    const question = gameState.questions[gameState.currentQuestion];
    questionElement.textContent = question.question;
    userAnswerInput.value = '';
    userAnswerInput.classList.remove('shake');
    
    progressElement.textContent = `Вопрос ${gameState.currentQuestion + 1}/${gameState.questions.length}`;
}

function appendToAnswer(value) {
    userAnswerInput.value += value;
}

function backspace() {
    userAnswerInput.value = userAnswerInput.value.slice(0, -1);
}

function resetAnswer() {
    userAnswerInput.value = '';
}

function checkAnswer() {
    const userAnswer = userAnswerInput.value.trim();
    const correctAnswer = gameState.questions[gameState.currentQuestion].answer;
    
    if (userAnswer === correctAnswer) {
        // Correct answer
        gameState.correctAnswers++;
        showFeedback(true);
    } else {
        // Wrong answer
        gameState.wrongAnswers++;
        userAnswerInput.classList.add('shake');
        setTimeout(() => {
            userAnswerInput.classList.remove('shake');
        }, 500);
        showFeedback(false);
    }
}

function showFeedback(isCorrect) {
    taskScreen.classList.remove('active');
    feedbackScreen.classList.add('active');
    
    if (isCorrect) {
        correctFeedback.style.display = 'block';
        wrongFeedback.style.display = 'none';
        document.querySelector('.user-name').textContent = gameState.userName;
    } else {
        correctFeedback.style.display = 'none';
        wrongFeedback.style.display = 'block';
    }
}

function backToQuestion() {
    feedbackScreen.classList.remove('active');
    taskScreen.classList.add('active');
    userAnswerInput.focus();
}

function nextQuestion() {
    gameState.currentQuestion++;
    if (gameState.currentQuestion < 10) { // Show 10 questions
        showTaskScreen();
        loadQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    gameState.endTime = new Date();
    feedbackScreen.classList.remove('active');
    resultsScreen.classList.add('active');
    
    // Calculate time spent
    const timeDiff = (gameState.endTime - gameState.startTime) / 1000; // in seconds
    const minutes = Math.floor(timeDiff / 60);
    const seconds = Math.floor(timeDiff % 60);
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Update results
    resultNameElement.textContent = gameState.userName;
    resultLevelElement.textContent = getDifficultyName(gameState.difficulty);
    resultCorrectElement.textContent = `${gameState.correctAnswers} из ${gameState.questions.length}`;
    resultTimeElement.textContent = timeString;
    
    // Update chart
    const total = gameState.correctAnswers + gameState.wrongAnswers;
    const correctPercentage = (gameState.correctAnswers / total) * 100;
    const wrongPercentage = (gameState.wrongAnswers / total) * 100;
    
    correctBar.style.width = `${correctPercentage}%`;
    wrongBar.style.width = `${wrongPercentage}%`;
}

function getDifficultyName(difficulty) {
    switch (difficulty) {
        case 'easy': return 'Лёгкий';
        case 'medium': return 'Средний';
        case 'hard': return 'Сложный';
        default: return '';
    }
}

function restartGame() {
    resultsScreen.classList.remove('active');
    startScreen.classList.add('active');
    nameInput.value = gameState.userName;
}

function updateTimer() {
    if (!gameState.startTime || !taskScreen.classList.contains('active')) return;
    
    const currentTime = new Date();
    const timeDiff = (currentTime - gameState.startTime) / 1000; // in seconds
    const minutes = Math.floor(timeDiff / 60);
    const seconds = Math.floor(timeDiff % 60);
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    setTimeout(updateTimer, 1000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Focus on name input when page loads
    nameInput.focus();
});