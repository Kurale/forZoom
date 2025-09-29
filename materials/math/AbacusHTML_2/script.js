// Определяем исходные позиции для костяшек
const originalPositions = {
    kost1: 1871,
    kost2: 1826,
    kost3: 1781,
    kost4: 1736,
    kost5: 1691,
    kost6: 1646,
    kost7: 1601,
    kost8: 1556,
    kost9: 1511,
    kost10: 1466,
    'kost4-4': 1871, // Уникальные позиции для group-kost4
    'kost4-5': 1826,
    'kost4-6': 1781,
    'kost4-7': 1736
};

// Порядок костяшек для обычных групп (слева направо: kost10 → kost1)
const beadOrder = [
    'kost10', 'kost9', 'kost8', 'kost7', 'kost6',
    'kost5', 'kost4', 'kost3', 'kost2', 'kost1'
];

// Порядок костяшек для group-kost4 (слева направо: kost4-7 → kost4-4)
const beadOrderGroup4 = ['kost4-7', 'kost4-6', 'kost4-5', 'kost4-4'];

// Границы рамки
const frameLeft = 1057; // Внутренний левый край rama (1046.5 + 10.5)
const beadSpacing = 45; // Расстояние между центрами костяшек

// Веса разрядов для групп
const groupWeights = {
    'group-kost5': 1,      // Единицы
    'group-kost6': 10,     // Десятки
    'group-kost7': 100,    // Сотни
    'group-kost8': 1000,   // Тысячи
    'group-kost9': 10000,  // Десятки тысяч
    'group-kost10': 100000 // Сотни тысяч
};

// Отслеживание состояния рядов (находятся ли костяшки слева)
const rowStates = {
    'group-kost1': Array(10).fill(false), // false = справа, true = слева
    'group-kost2': Array(10).fill(false),
    'group-kost3': Array(10).fill(false),
    'group-kost4': Array(4).fill(false),  // Только 4 костяшки (kost4-7 до kost4-4)
    'group-kost5': Array(10).fill(false),
    'group-kost6': Array(10).fill(false),
    'group-kost7': Array(10).fill(false),
    'group-kost8': Array(10).fill(false),
    'group-kost9': Array(10).fill(false),
    'group-kost10': Array(10).fill(false)
};

// Функция для подсчёта текущего числа
function calculateTotal() {
    let total = 0;
    // Учитываем только группы group-kost5 до group-kost10
    for (const group of ['group-kost5', 'group-kost6', 'group-kost7', 'group-kost8', 'group-kost9', 'group-kost10']) {
        // Подсчитываем количество костяшек слева (true)
        const beadsLeft = rowStates[group].filter(state => state).length;
        // Умножаем на вес разряда
        total += beadsLeft * groupWeights[group];
    }
    return total;
}

// Функция для обновления дисплея
function updateDisplay() {
    const dataElement = document.querySelector('.data');
    const total = calculateTotal();
    dataElement.textContent = total.toString(); // Преобразуем в строку без ведущих нулей
}

// Инициализация обработчиков кликов для костяшек
document.querySelectorAll('.group-kost').forEach(group => {
    const groupClass = group.classList[1]; // Например, 'group-kost1'
    const beads = group.querySelectorAll('.bead');
    const isGroup4 = groupClass === 'group-kost4';
    const currentBeadOrder = isGroup4 ? beadOrderGroup4 : beadOrder;

    beads.forEach(bead => {
        bead.addEventListener('click', () => {
            const beadClass = bead.classList[1]; // Например, 'kost4-7'
            const beadIndex = currentBeadOrder.indexOf(beadClass); // Индекс (0 для kost10 или kost4-7)

            // Определяем, находится ли костяшка слева
            const isLeft = rowStates[groupClass][beadIndex];

            if (isLeft) {
                // Двигаем только кликнутую костяшку вправо на исходную позицию
                const currentBead = group.querySelector(`.${beadClass}`);
                currentBead.style.left = `${originalPositions[beadClass]}px`;
                rowStates[groupClass][beadIndex] = false;
            } else {
                // Двигаем кликнутую костяшку и все правее неё влево
                for (let i = 0; i <= beadIndex; i++) {
                    const currentBead = group.querySelector(`.${currentBeadOrder[i]}`);
                    if (!currentBead) continue; // Проверка на существование

                    // Самая левая костяшка (kost10 или kost4-7) идёт к frameLeft (1057px)
                    const newLeft = frameLeft + i * beadSpacing;
                    currentBead.style.left = `${newLeft}px`;
                    rowStates[groupClass][i] = true;
                }
            }

            // Возвращаем костяшки левее кликнутой на исходные позиции, если они были слева
            for (let i = beadIndex + 1; i < rowStates[groupClass].length; i++) {
                const currentBead = group.querySelector(`.${currentBeadOrder[i]}`);
                if (!currentBead) continue;
                if (rowStates[groupClass][i]) {
                    currentBead.style.left = `${originalPositions[currentBeadOrder[i]]}px`;
                    rowStates[groupClass][i] = false;
                }
            }

            // Обновляем дисплей после каждого клика по костяшке
            updateDisplay();
        });
    });
});

// Инициализируем дисплей при загрузке
updateDisplay();