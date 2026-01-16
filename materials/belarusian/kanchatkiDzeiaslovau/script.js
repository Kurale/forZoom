document.addEventListener('DOMContentLoaded', () => {
    // Ссылки на элементы DOM
    const exerciseArea = document.getElementById('exercise-area');
    const checkBtn = document.getElementById('check-btn');
    const resetBtn = document.getElementById('reset-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const resultMessage = document.getElementById('result-message');
    const datasetNumber = document.getElementById('dataset-number');

    let exerciseData = []; // Сюда загрузим данные
    
    // Массив с именами файлов данных (масштабируемая система)
    const dataFiles = [
        './data.json',
        './data_1.json'
        // Можно добавить больше файлов: './data_2.json', './data_3.json' и т.д.
    ];
    
    let currentDatasetIndex = 0; // Индекс текущего набора данных

    // 1. Функция загрузки данных
    async function fetchData(datasetIndex) {
        try {
            // Используем fetch, так как ты работаешь через Go Live (локальный сервер)
            const response = await fetch(dataFiles[datasetIndex]);
            if (!response.ok) throw new Error('Ошибка загрузки JSON');
            
            exerciseData = await response.json();
            updateDatasetInfo();
            renderExercise(); // После загрузки сразу рисуем упражнение
        } catch (error) {
            console.error(error);
            exerciseArea.innerHTML = '<p style="color:red">Не удалось загрузить задание.</p>';
        }
    }
    
    // Обновление информации о текущем наборе данных
    function updateDatasetInfo() {
        datasetNumber.textContent = `Набор ${currentDatasetIndex + 1} з ${dataFiles.length}`;
        
        // Управление видимостью кнопок навигации
        prevBtn.classList.toggle('hidden', currentDatasetIndex === 0);
        nextBtn.classList.toggle('hidden', currentDatasetIndex === dataFiles.length - 1);
    }

    // 2. Функция отрисовки (Рендер)
    function renderExercise() {
        exerciseArea.innerHTML = ''; // Очищаем поле
        resultMessage.textContent = '';
        checkBtn.classList.remove('hidden');
        resetBtn.classList.add('hidden');

        // Проходим по каждой строке (группе слов) из JSON
        exerciseData.forEach((rowGroup, rowIndex) => {
            const rowDiv = document.createElement('div');
            rowDiv.classList.add('row');

            // Проходим по каждому слову в строке
            rowGroup.words.forEach((word, wordIndex) => {
                // Создаем контейнер слова
                const wordUnit = document.createElement('div');
                wordUnit.classList.add('word-unit');
                
                // Уникальный ID для слова, чтобы потом найти его при проверке
                // data-row и data-word помогут нам быстро найти данные в массиве
                wordUnit.dataset.rowIndex = rowIndex;
                wordUnit.dataset.wordIndex = wordIndex;

                // 1. Основа слова (например, "Законч")
                const stemSpan = document.createElement('span');
                stemSpan.classList.add('stem');
                stemSpan.textContent = word.stem;

                // 2. Дробь с окончаниями
                const fractionDiv = document.createElement('div');
                fractionDiv.classList.add('endings-fraction');

                // Верхний вариант
                const topOption = createOptionElement(word.options[0], 0);
                // Линия
                const line = document.createElement('div');
                line.classList.add('fraction-line');
                // Нижний вариант
                const bottomOption = createOptionElement(word.options[1], 1);

                // Собираем дробь
                fractionDiv.appendChild(topOption);
                fractionDiv.appendChild(line);
                fractionDiv.appendChild(bottomOption);

                // Собираем слово целиком
                wordUnit.appendChild(stemSpan);
                wordUnit.appendChild(fractionDiv);

                // Добавляем слово в строку
                rowDiv.appendChild(wordUnit);
            });

            // Добавляем строку в упражнение
            exerciseArea.appendChild(rowDiv);
        });
    }

    // Вспомогательная функция для создания кликабельного окончания
    function createOptionElement(text, index) {
        const div = document.createElement('div');
        div.classList.add('option');
        div.textContent = text;
        div.dataset.optionIndex = index; // 0 или 1
        
        // Обработчик клика
        div.addEventListener('click', handleOptionClick);
        return div;
    }

    // 3. Обработка выбора (Клик по окончанию)
    function handleOptionClick(e) {
        // Если проверка уже прошла, запрещаем кликать (проверяем наличие кнопки сброса)
        if (!resetBtn.classList.contains('hidden')) return;

        const clickedOption = e.target;
        const fractionContainer = clickedOption.parentElement;
        
        // Находим все опции в этой "дроби"
        const allOptions = fractionContainer.querySelectorAll('.option');

        // Снимаем выделение со всех
        allOptions.forEach(opt => opt.classList.remove('selected'));

        // Ставим выделение на нажатую
        clickedOption.classList.add('selected');
    }

    // 4. Логика проверки
    checkBtn.addEventListener('click', () => {
        let correctCount = 0;
        let totalWords = 0;
        let allAnswered = true;

        // Находим все слова на странице
        const wordUnits = document.querySelectorAll('.word-unit');

        wordUnits.forEach(unit => {
            totalWords++;
            const rIndex = unit.dataset.rowIndex;
            const wIndex = unit.dataset.wordIndex;
            
            // Получаем правильный ответ из исходных данных
            const correctDataIndex = exerciseData[rIndex].words[wIndex].correctIndex;

            // Ищем, что выбрал пользователь внутри этого слова
            const selectedOption = unit.querySelector('.option.selected');
            
            // Если ничего не выбрано
            if (!selectedOption) {
                allAnswered = false;
                // Можно подсветить слово, которое пропустили (опционально)
                return;
            }

            const selectedUserIndex = parseInt(selectedOption.dataset.optionIndex);
            
            // Снимаем класс selected, чтобы заменить его на correct/wrong
            selectedOption.classList.remove('selected');

            if (selectedUserIndex === correctDataIndex) {
                // Правильно
                selectedOption.classList.add('correct');
                correctCount++;
            } else {
                // Неправильно
                selectedOption.classList.add('wrong');
                
                // Подсвечиваем правильный ответ пунктиром, чтобы ребенок знал, как надо было
                const options = unit.querySelectorAll('.option');
                options[correctDataIndex].classList.add('missed');
            }
        });

        if (!allAnswered) {
            resultMessage.textContent = "Вылучыце канчаткі ва ўсіх словах!";
            resultMessage.style.color = "orange";
            // Возвращаем класс selected, чтобы не сбрасывать прогресс, если не все ответили
            // (В простой реализации мы уже заменили классы, поэтому лучше просто прервать проверку ДО изменения классов
            // или просто попросить дозаполнить).
            // Для простоты здесь: если не все ответили, мы проверим то, что есть, а остальное останется пустым.
        }
        
        if (correctCount === totalWords) {
            resultMessage.textContent = "Маладзец! Усё правільна! 🎉";
            resultMessage.style.color = "green";
            
            // Если есть следующий набор данных, показываем кнопку перехода
            if (currentDatasetIndex < dataFiles.length - 1) {
                nextBtn.classList.remove('hidden');
            }
        } else {
            resultMessage.textContent = `Вынік: ${correctCount} з ${totalWords}. Паспрабуй яшчэ раз!`;
            resultMessage.style.color = "var(--text-color)";
        }

        // Переключаем кнопки
        checkBtn.classList.add('hidden');
        resetBtn.classList.remove('hidden');
    });
    
    // 5. Кнопка перехода к следующему набору
    nextBtn.addEventListener('click', () => {
        if (currentDatasetIndex < dataFiles.length - 1) {
            currentDatasetIndex++;
            fetchData(currentDatasetIndex);
        }
    });
    
    // 6. Кнопка перехода к предыдущему набору
    prevBtn.addEventListener('click', () => {
        if (currentDatasetIndex > 0) {
            currentDatasetIndex--;
            fetchData(currentDatasetIndex);
        }
    });

    // 7. Кнопка сброса
    resetBtn.addEventListener('click', () => {
        renderExercise(); // Просто перерисовываем всё заново
    });

    // Запуск приложения
    fetchData(currentDatasetIndex);
});