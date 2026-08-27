// auction.js - Auction modal UI logic
function showAuctionModal(auctionData, lang) {
  const modal   = document.getElementById('auction-modal');
  const propEl  = document.getElementById('auction-prop');
  const priceEl = document.getElementById('auction-price');
  const bidderEl= document.getElementById('auction-bidder');

  const sq = BOARD_DATA_CLIENT[auctionData.squareId];
  propEl.textContent  = sq ? (lang==='az' ? sq.name : sq.nameEn) + ' ' + (sq.icon||'🏠') : '?';
  priceEl.textContent = `${auctionData.currentHighest}₼`;
  bidderEl.textContent = auctionData.highestBidderId ? '' : (lang==='az'?'(heç kim)':'(no bids)');

  modal.classList.remove('hidden');
  document.getElementById('auction-bid-input').value = auctionData.currentHighest + 1;
}

function updateAuctionModal(auctionData, players, lang) {
  const priceEl  = document.getElementById('auction-price');
  const bidderEl = document.getElementById('auction-bidder');
  const logEl    = document.getElementById('auction-bids-log');

  priceEl.textContent = `${auctionData.currentHighest}₼`;

  const highBidder = players.find(p => p.id === auctionData.highestBidderId);
  bidderEl.textContent = highBidder ? (lang==='az' ? highBidder.nameAz : highBidder.nameEn) : '';

  // Update minimum bid
  const input = document.getElementById('auction-bid-input');
  if (input) input.min = auctionData.currentHighest + 1;

  // Add to log
  if (highBidder) {
    const entry = document.createElement('div');
    entry.textContent = `${lang==='az'?highBidder.nameAz:highBidder.nameEn}: ${auctionData.currentHighest}₼`;
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
  }
}

function hideAuctionModal() {
  document.getElementById('auction-modal').classList.add('hidden');
  document.getElementById('auction-bids-log').innerHTML = '';
}
