// dice.js - Dice animation and display
const DIE_FACES = ['', '⚀','⚁','⚂','⚃','⚄','⚅'];
const DIE_NUMS  = ['', '1','2','3','4','5','6'];

function animateDice(d1, d2, onDone) {
  const die1El = document.getElementById('die1');
  const die2El = document.getElementById('die2');
  if (!die1El || !die2El) { onDone && onDone(); return; }

  die1El.classList.add('rolling');
  die2El.classList.add('rolling');

  // Flash random numbers
  let ticks = 0;
  const interval = setInterval(() => {
    die1El.textContent = Math.floor(Math.random()*6)+1;
    die2El.textContent = Math.floor(Math.random()*6)+1;
    ticks++;
    if (ticks >= 8) {
      clearInterval(interval);
      die1El.classList.remove('rolling');
      die2El.classList.remove('rolling');
      die1El.textContent = d1;
      die2El.textContent = d2;
      onDone && onDone();
    }
  }, 80);
}

function showDice(d1, d2) {
  const die1El = document.getElementById('die1');
  const die2El = document.getElementById('die2');
  if (die1El) die1El.textContent = d1;
  if (die2El) die2El.textContent = d2;
}

function showDoublesBadge(show) {
  const el = document.getElementById('doubles-badge');
  if (!el) return;
  if (show) el.classList.remove('hidden');
  else      el.classList.add('hidden');
}
