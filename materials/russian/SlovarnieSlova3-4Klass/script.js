class WordTrainingApp {
    constructor() {
        this.words = {};
        this.currentLevel = null;
        this.currentWordIndex = 0;
        this.currentWord = null;
        this.selectedSyllables = [];
        this.correctAnswers = 0;
        this.totalWords = 20;
        this.speechSynthesis = window.speechSynthesis;
        this.soundEnabled = true;
        
        // Статистика
        this.startTime = null;
        this.endTime = null;
        this.totalAttempts = 0;
        this.correctAttempts = 0;
        this.incorrectAttempts = 0;
        
        this.init();
    }

    async init() {
        await this.loadWords();
        this.setupEventListeners();
        this.showScreen('welcome-screen');
    }

    async loadWords() {
        try {
            const response = await fetch('words_1.json');
            this.wordsData = await response.json();
            // Преобразуем структуру данных для удобства использования
            this.words = {};
            this.wordsData.levels.forEach(level => {
                this.words[level.id] = level.words;
            });
        } catch (error) {
            console.error('Ошибка загрузки слов:', error);
            alert('Не удалось загрузить словарные слова. Пожалуйста, проверьте подключение к интернету.');
        }
    }

    setupEventListeners() {
        // Кнопки выбора уровня
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectLevel(e));
        });

        // Кнопка старт
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());

        // Кнопка назад
        document.getElementById('back-btn').addEventListener('click', () => this.backToMenu());

        // Кнопка проверки
        document.getElementById('check-btn').addEventListener('click', () => this.checkAnswer());

        // Кнопка пропуска
        document.getElementById('skip-btn').addEventListener('click', () => this.skipWord());

        // Кнопка звука
        document.getElementById('sound-btn').addEventListener('click', () => this.speakWord());
        
        // Кнопка отключения звука
        document.getElementById('mute-btn').addEventListener('click', () => this.toggleSound());

        // Кнопки результатов
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('menu-btn').addEventListener('click', () => this.backToMenu());

        // Drag and drop для зоны сброса
        const dropZone = document.getElementById('drop-zone');
        dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        dropZone.addEventListener('drop', (e) => this.handleDrop(e));
        dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    }

    selectLevel(e) {
        // Удаляем предыдущий выбор
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        // Выбираем текущий уровень
        e.target.classList.add('selected');
        this.currentLevel = e.target.dataset.level;

        // Активируем кнопку старт
        document.getElementById('start-btn').disabled = false;
    }

    startGame() {
        if (!this.currentLevel) return;

        this.currentWordIndex = 0;
        this.correctAnswers = 0;
        this.selectedSyllables = [];
        
        // Сбрасываем статистику
        this.startTime = Date.now();
        this.totalAttempts = 0;
        this.correctAttempts = 0;
        this.incorrectAttempts = 0;

        // Перемешиваем слова для текущего уровня
        const levelWords = [...this.words[this.currentLevel]];
        this.shuffledWords = this.shuffleArray(levelWords).slice(0, this.totalWords);

        this.showScreen('game-screen');
        this.loadWord();
    }

    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    loadWord() {
        if (this.currentWordIndex >= this.shuffledWords.length) {
            this.showResults();
            return;
        }

        this.currentWord = this.shuffledWords[this.currentWordIndex];
        this.selectedSyllables = [];

        // Обновляем счетчик
        document.getElementById('word-counter').textContent = 
            `Слово ${this.currentWordIndex + 1} из ${this.totalWords}`;

        // Очищаем зоны
        document.getElementById('drop-zone-content').innerHTML = '';
        document.getElementById('syllables-container').innerHTML = '';
        
        // Обновляем видимость плейсхолдера
        this.updatePlaceholderVisibility();

        // Создаем массив всех слогов (правильных и неправильных)
        const allSyllables = [
            ...this.currentWord.correctSyllables.map(syllable => ({ text: syllable, correct: true })),
            ...this.currentWord.distractors.map(syllable => ({ text: syllable, correct: false }))
        ];

        // Перемешиваем слоги
        const shuffledSyllables = this.shuffleArray(allSyllables);

        // Создаем элементы слогов
        shuffledSyllables.forEach((syllable, index) => {
            const syllableElement = this.createSyllableElement(syllable.text, syllable.correct, index);
            document.getElementById('syllables-container').appendChild(syllableElement);
        });

        // Отключаем кнопку проверки
        document.getElementById('check-btn').disabled = true;

        // Произносим слово
        setTimeout(() => this.speakWord(), 500);
    }

    createSyllableElement(text, isCorrect, index) {
        const element = document.createElement('div');
        element.className = 'syllable';
        element.textContent = text;
        element.dataset.text = text;
        element.dataset.correct = isCorrect;
        element.dataset.index = index;
        element.draggable = true;

        // Добавляем обработчики событий
        element.addEventListener('click', () => this.handleSyllableClick(element));
        element.addEventListener('dragstart', (e) => this.handleDragStart(e));
        element.addEventListener('dragend', (e) => this.handleDragEnd(e));

        return element;
    }

    handleSyllableClick(element) {
        if (element.classList.contains('disabled')) return;

        const dropZoneContent = document.getElementById('drop-zone-content');
        const syllablesContainer = document.getElementById('syllables-container');
        
        // Проверяем, где находится элемент (в зоне сброса или в контейнере слогов)
        if (element.parentElement === dropZoneContent) {
            // Если элемент в зоне сброса, возвращаем его в контейнер слогов
            element.classList.remove('selected');
            syllablesContainer.appendChild(element);
            
            // Обновляем массив выбранных слогов
            this.selectedSyllables = [];
            const selectedElements = dropZoneContent.querySelectorAll('.syllable');
            selectedElements.forEach(syllable => {
                this.selectedSyllables.push(syllable.dataset.text);
            });
        } else {
            // Если элемент в контейнере слогов, перемещаем его в зону сброса
            element.classList.add('selected');
            dropZoneContent.appendChild(element);
            
            this.selectedSyllables.push(element.dataset.text);
        }
        
        // Обновляем видимость плейсхолдера
        this.updatePlaceholderVisibility();
        
        // Активируем кнопку проверки если есть выбранные слоги
        document.getElementById('check-btn').disabled = this.selectedSyllables.length === 0;
    }

    handleDragStart(e) {
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.innerHTML);
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        document.getElementById('drop-zone').classList.add('drag-over');
    }

    handleDragLeave(e) {
        if (e.target.id === 'drop-zone') {
            document.getElementById('drop-zone').classList.remove('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        document.getElementById('drop-zone').classList.remove('drag-over');

        const draggingElement = document.querySelector('.dragging');
        if (draggingElement) {
            const dropZoneContent = document.getElementById('drop-zone-content');
            dropZoneContent.appendChild(draggingElement);
            
            this.selectedSyllables = [];
            const syllables = dropZoneContent.querySelectorAll('.syllable');
            syllables.forEach(syllable => {
                this.selectedSyllables.push(syllable.dataset.text);
            });

            // Обновляем видимость плейсхолдера
            this.updatePlaceholderVisibility();

            document.getElementById('check-btn').disabled = this.selectedSyllables.length === 0;
        }
    }

    checkAnswer() {
        const userAnswer = this.selectedSyllables.join('');
        const correctAnswer = this.currentWord.correctSyllables.join('');
        const dropZoneContent = document.getElementById('drop-zone-content');
        const syllables = dropZoneContent.querySelectorAll('.syllable');
        
        // Увеличиваем общее количество попыток
        this.totalAttempts++;

        if (userAnswer === correctAnswer) {
            // Правильный ответ
            syllables.forEach(syllable => {
                syllable.classList.add('correct');
                syllable.classList.add('disabled');
            });

            this.correctAnswers++;
            this.correctAttempts++;
            
            setTimeout(() => {
                this.currentWordIndex++;
                this.loadWord();
            }, 1500);
        } else {
            // Неправильный ответ
            syllables.forEach(syllable => {
                syllable.classList.add('incorrect');
            });
            
            this.incorrectAttempts++;

            // Возвращаем слоги обратно через секунду
            setTimeout(() => {
                syllables.forEach(syllable => {
                    syllable.classList.remove('incorrect', 'selected');
                    document.getElementById('syllables-container').appendChild(syllable);
                });

                this.selectedSyllables = [];
                
                // Обновляем видимость плейсхолдера
                this.updatePlaceholderVisibility();
                
                document.getElementById('check-btn').disabled = true;
            }, 1000);
        }
    }

    skipWord() {
        this.currentWordIndex++;
        this.loadWord();
    }

    speakWord() {
        if (!this.currentWord || !this.soundEnabled) return;

        // Отменяем предыдущее произношение
        this.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(this.currentWord.word);
        utterance.lang = 'ru-RU';
        utterance.rate = 0.8;
        utterance.pitch = 1;
        
        this.speechSynthesis.speak(utterance);
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const muteBtn = document.getElementById('mute-btn');
        
        if (this.soundEnabled) {
            muteBtn.textContent = '🔇';
            muteBtn.classList.remove('muted');
            muteBtn.title = 'Выключить звук';
        } else {
            muteBtn.textContent = '🔈';
            muteBtn.classList.add('muted');
            muteBtn.title = 'Включить звук';
            
            // Отменяем текущее произношение если звук выключен
            this.speechSynthesis.cancel();
        }
    }

    showResults() {
        this.endTime = Date.now();
        const timeSpent = Math.round((this.endTime - this.startTime) / 1000);
        const minutes = Math.floor(timeSpent / 60);
        const seconds = timeSpent % 60;
        const accuracy = Math.round((this.correctAnswers / this.totalWords) * 100);
        
        // Находим название уровня по его ID
        const levelInfo = this.wordsData.levels.find(level => level.id === this.currentLevel);
        const levelTitle = levelInfo ? levelInfo.title : '';
        
        document.getElementById('level-title').textContent = levelTitle;
        document.getElementById('correct-count').textContent = this.correctAnswers;
        document.getElementById('total-count').textContent = this.totalWords;
        document.getElementById('accuracy').textContent = `${accuracy}%`;
        document.getElementById('time-spent').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('total-attempts').textContent = this.totalAttempts;
        
        // Рисуем диаграмму
        this.drawChart();

        this.showScreen('results-screen');
    }
    
    drawChart() {
        const canvas = document.getElementById('results-chart');
        const ctx = canvas.getContext('2d');
        
        // Очищаем canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Данные для диаграммы
        const data = [
            { label: 'Правильно', value: this.correctAttempts, color: '#48bb78' },
            { label: 'Неправильно', value: this.incorrectAttempts, color: '#f56565' }
        ];
        
        const total = this.correctAttempts + this.incorrectAttempts;
        if (total === 0) return;
        
        // Размеры и позиция диаграммы
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 40;
        
        let currentAngle = -Math.PI / 2; // Начинаем сверху
        
        // Рисуем сегменты диаграммы
        data.forEach(segment => {
            const segmentAngle = (segment.value / total) * 2 * Math.PI;
            
            // Рисуем сегмент
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + segmentAngle);
            ctx.lineTo(centerX, centerY);
            ctx.fillStyle = segment.color;
            ctx.fill();
            
            // Рисуем текст с процентами
            const textAngle = currentAngle + segmentAngle / 2;
            const textX = centerX + Math.cos(textAngle) * (radius * 0.7);
            const textY = centerY + Math.sin(textAngle) * (radius * 0.7);
            
            const percentage = Math.round((segment.value / total) * 100);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${percentage}%`, textX, textY);
            
            currentAngle += segmentAngle;
        });
        
        // Рисуем легенду
        let legendY = 20;
        data.forEach(segment => {
            // Цветной квадрат
            ctx.fillStyle = segment.color;
            ctx.fillRect(10, legendY - 10, 15, 15);
            
            // Текст легенды
            ctx.fillStyle = '#333';
            ctx.font = '14px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`${segment.label}: ${segment.value}`, 30, legendY);
            
            legendY += 25;
        });
    }

    restartGame() {
        this.startGame();
    }

    backToMenu() {
        this.showScreen('welcome-screen');
        
        // Сбрасываем выбор уровня
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.getElementById('start-btn').disabled = true;
        this.currentLevel = null;
    }

    updatePlaceholderVisibility() {
        const dropZoneContent = document.getElementById('drop-zone-content');
        const placeholder = document.querySelector('.drop-zone-placeholder');
        
        if (dropZoneContent.children.length === 0) {
            placeholder.style.display = 'block';
        } else {
            placeholder.style.display = 'none';
        }
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        document.getElementById(screenId).classList.remove('hidden');
    }
}

// Запускаем приложение когда DOM загружен
document.addEventListener('DOMContentLoaded', () => {
    new WordTrainingApp();
});