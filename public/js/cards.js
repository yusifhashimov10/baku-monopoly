// cards.js - Card modal display
function showCardModal(card, type, lang, onExecute) {
  const modal = document.getElementById('card-modal');
  const badge = document.getElementById('card-type-badge');
  const text  = document.getElementById('card-text');

  modal.classList.remove('hidden');

  if (type === 'chance') {
    badge.textContent = lang === 'az' ? 'ŞANS' : 'CHANCE';
    badge.className = 'card-type-badge chance';
  } else {
    badge.textContent = lang === 'az' ? 'XƏZİNƏ' : 'COMMUNITY CHEST';
    badge.className = 'card-type-badge community';
  }

  text.textContent = lang === 'az' ? card.textAz : card.textEn;

  // Store callback
  window._cardExecuteCallback = onExecute;
}

function hideCardModal() {
  const modal = document.getElementById('card-modal');
  modal.classList.add('hidden');
  window._cardExecuteCallback = null;
}
