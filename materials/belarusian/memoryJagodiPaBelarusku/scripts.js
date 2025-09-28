const cards = document.querySelectorAll('.memory-card');
const gameContainer = document.querySelector('.memory-game');

let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;
let mistakes = 0;
let timer;
let timeElapsed = 0;
let matchesFound = 0;
const totalPairs = cards.length / 2;

// Создаем элементы интерфейса
const timerDisplay = document.createElement('div');
timerDisplay.classList.add('timer');
timerDisplay.textContent = 'Время: 0s';
document.body.insertBefore(timerDisplay, gameContainer);

function flipCard() {
  if (lockBoard) return;
  if (this === firstCard) return;

  this.classList.add('flip');

  if (!hasFlippedCard) {
    hasFlippedCard = true;
    firstCard = this;
    startTimer();
    return;
  }

  secondCard = this;
  checkForMatch();
}

function checkForMatch() {
  let isMatch = firstCard.dataset.framework === secondCard.dataset.framework;
  isMatch ? disableCards() : unflipCards();
}

function disableCards() {
  firstCard.removeEventListener('click', flipCard);
  secondCard.removeEventListener('click', flipCard);
  matchesFound++;
  
  if (matchesFound === totalPairs) {
    endGame();
  }
  
  resetBoard();
}

function unflipCards() {
  lockBoard = true;
  mistakes++;

  setTimeout(() => {
    firstCard.classList.remove('flip');
    secondCard.classList.remove('flip');
    resetBoard();
  }, 900);
}

function resetBoard() {
  [hasFlippedCard, lockBoard] = [false, false];
  [firstCard, secondCard] = [null, null];
}

function startTimer() {
  if (!timer) {
    timer = setInterval(() => {
      timeElapsed++;
      timerDisplay.textContent = `Время: ${timeElapsed}s`;
    }, 1000);
  }
}

function endGame() {
  clearInterval(timer);
  showResults();
}

function showResults() {
  const resultsScreen = document.createElement('div');
  resultsScreen.classList.add('results');
  resultsScreen.innerHTML = `
    <div class="results-content">
      <h2>Молодец! У тебя всё получилось!</h2>
      <p>Время: ${timeElapsed} секунд</p>
      <p>Ошибок: ${mistakes}</p>
      <button class="restart-btn">Пробовать ещё!</button>
    </div>
  `;
  document.body.appendChild(resultsScreen);

  const restartBtn = resultsScreen.querySelector('.restart-btn');
  restartBtn.addEventListener('click', restartGame);
}

function restartGame() {
  // Сбрасываем все значения
  matchesFound = 0;
  mistakes = 0;
  timeElapsed = 0;
  timer = null;
  timerDisplay.textContent = 'Время: 0s';
  
  // Удаляем экран результатов
  const resultsScreen = document.querySelector('.results');
  if (resultsScreen) resultsScreen.remove();
  
  // Переворачиваем все карты обратно и включаем слушатели
  cards.forEach(card => {
    card.classList.remove('flip');
    card.addEventListener('click', flipCard);
  });
  
  // Перемешиваем карты
  cards.forEach(card => {
    let randomPos = Math.floor(Math.random() * 12);
    card.style.order = randomPos;
  });
}

(function shuffle() {
  cards.forEach(card => {
    let randomPos = Math.floor(Math.random() * 12);
    card.style.order = randomPos;
  });
})();

cards.forEach(card => card.addEventListener('click', flipCard));