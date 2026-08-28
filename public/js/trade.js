// trade.js - Trade modal UI logic
let _tradeTargetId = null;
let _tradeMySelected = [];
let _tradeTheirSelected = [];

const BOARD_DATA_CLIENT = [
  {id:0,type:'go'},{id:1,type:'property',name:'Zabrat',nameEn:'Zabrat',color:'brown'},
  {id:2,type:'community'},{id:3,type:'property',name:'Balaxanı',nameEn:'Balaxani',color:'brown'},
  {id:4,type:'tax'},{id:5,type:'transport',name:'Hava Limanı',nameEn:'Airport'},
  {id:6,type:'property',name:'Binəqədi',nameEn:'Binagadi',color:'lightblue'},
  {id:7,type:'chance'},{id:8,type:'property',name:'Suraxanı',nameEn:'Surakhani',color:'lightblue'},
  {id:9,type:'property',name:'Maştağa',nameEn:'Mashtaga',color:'lightblue'},
  {id:10,type:'jail'},{id:11,type:'property',name:'Sabunçu',nameEn:'Sabunchu',color:'pink'},
  {id:12,type:'utility',name:'Elektrik',nameEn:'Electric Co.'},{id:13,type:'property',name:'Lökbatan',nameEn:'Lokbatan',color:'pink'},
  {id:14,type:'property',name:'Ramana',nameEn:'Ramana',color:'pink'},
  {id:15,type:'transport',name:'Dəmiryolu',nameEn:'Railway'},
  {id:16,type:'property',name:'Nardaran',nameEn:'Nardaran',color:'orange'},
  {id:17,type:'community'},{id:18,type:'property',name:'Novxanı',nameEn:'Novkhani',color:'orange'},
  {id:19,type:'property',name:'Bilgəh',nameEn:'Bilgah',color:'orange'},
  {id:20,type:'freeparking'},{id:21,type:'property',name:'Buzovna',nameEn:'Buzovna',color:'red'},
  {id:22,type:'chance'},{id:23,type:'property',name:'Novbəgün',nameEn:'Novbagun',color:'red'},
  {id:24,type:'property',name:'Balacadir',nameEn:'Balacadir',color:'red'},
  {id:25,type:'transport',name:'Avtovağzal',nameEn:'Bus Terminal'},
  {id:26,type:'property',name:'Xətai',nameEn:'Khatai',color:'yellow'},
  {id:27,type:'property',name:'Binə',nameEn:'Bina',color:'yellow'},
  {id:28,type:'utility',name:'Su Şirkəti',nameEn:'Water Works'},
  {id:29,type:'property',name:'Nərimanov',nameEn:'Narimanov',color:'yellow'},
  {id:30,type:'gotojail'},{id:31,type:'property',name:'Nizami',nameEn:'Nizami',color:'green'},
  {id:32,type:'property',name:'Yasamal',nameEn:'Yasamal',color:'green'},
  {id:33,type:'community'},{id:34,type:'property',name:'Nəsimi',nameEn:'Nasimi',color:'green'},
  {id:35,type:'transport',name:'Dəniz Limanı',nameEn:'Sea Port'},
  {id:36,type:'chance'},{id:37,type:'property',name:'Şirvan',nameEn:'Shirvan',color:'darkblue'},
  {id:38,type:'tax'},{id:39,type:'property',name:'İçərişəhər',nameEn:'Icherisheher',color:'darkblue'},
];

const COLOR_HEX = {
  brown:'#8B4513',lightblue:'#87CEEB',pink:'#FF69B4',orange:'#FFA500',
  red:'#FF3333',yellow:'#FFD700',green:'#228B22',darkblue:'#00008B'
};

function openTradeModal(targetPlayer, myPlayer, lang) {
  _tradeTargetId = targetPlayer.id;
  _tradeMySelected = [];
  _tradeTheirSelected = [];

  document.getElementById('trade-incoming').classList.add('hidden');
  document.getElementById('trade-other-label').textContent =
    lang === 'az' ? `${targetPlayer.nameAz} - Mülklər` : `${targetPlayer.nameEn} - Properties`;

  // Render my properties
  renderTradeProps('trade-my-props', myPlayer.properties, true, lang);
  // Render their properties
  renderTradeProps('trade-other-props', targetPlayer.properties, false, lang);

  document.getElementById('trade-my-money').value = 0;
  document.getElementById('trade-other-money').value = 0;
  document.getElementById('trade-modal').classList.remove('hidden');
}

function renderTradeProps(containerId, propIds, isMine, lang) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  const tradable = propIds.filter(id => {
    const sq = BOARD_DATA_CLIENT[id];
    return sq && (sq.type === 'property' || sq.type === 'transport' || sq.type === 'utility');
  });
  if (tradable.length === 0) {
    container.innerHTML = `<div style="color:var(--text-muted);font-size:12px;padding:8px;">${lang==='az'?'Mülk yoxdur':'No properties'}</div>`;
    return;
  }
  tradable.forEach(id => {
    const sq = BOARD_DATA_CLIENT[id];
    if (!sq) return;
    const name = lang === 'az' ? (sq.name || '') : (sq.nameEn || sq.name || '');
    const colorHex = sq.color ? (COLOR_HEX[sq.color] || '#888') : '#888';
    const item = document.createElement('div');
    item.className = 'trade-prop-item';
    item.dataset.id = id;
    item.innerHTML = `
      <div class="trade-prop-color" style="background:${colorHex}"></div>
      <span>${name}</span>
    `;
    item.onclick = () => {
      item.classList.toggle('selected');
      if (isMine) {
        if (_tradeMySelected.includes(id)) _tradeMySelected = _tradeMySelected.filter(x=>x!==id);
        else _tradeMySelected.push(id);
      } else {
        if (_tradeTheirSelected.includes(id)) _tradeTheirSelected = _tradeTheirSelected.filter(x=>x!==id);
        else _tradeTheirSelected.push(id);
      }
    };
    container.appendChild(item);
  });
}

function getTradeOffer() {
  return {
    fromOffer: {
      properties: _tradeMySelected,
      money: parseInt(document.getElementById('trade-my-money').value) || 0,
    },
    toOffer: {
      properties: _tradeTheirSelected,
      money: parseInt(document.getElementById('trade-other-money').value) || 0,
    },
    toId: _tradeTargetId,
  };
}

function _closeTradeUI() {
  document.getElementById('trade-modal').classList.add('hidden');
  _tradeTargetId = null;
  _tradeMySelected = [];
  _tradeTheirSelected = [];
}

function showIncomingTrade(tradeData, fromPlayer, myPlayer, lang) {
  const sq = (id) => BOARD_DATA_CLIENT[id];
  const fromProps = tradeData.fromOffer.properties.map(id => lang==='az' ? sq(id)?.name : sq(id)?.nameEn).join(', ') || (lang==='az'?'Yoxdur':'None');
  const toProps   = tradeData.toOffer.properties.map(id => lang==='az' ? sq(id)?.name : sq(id)?.nameEn).join(', ') || (lang==='az'?'Yoxdur':'None');

  const text = lang === 'az'
    ? `${fromPlayer.nameAz} mübadilə təklif edir:\n` +
      `Onun teklifi: ${fromProps} + ${tradeData.fromOffer.money}₼\n` +
      `Sizin verəcəyiniz: ${toProps} + ${tradeData.toOffer.money}₼`
    : `${fromPlayer.nameEn} offers a trade:\n` +
      `Their offer: ${fromProps} + ${tradeData.fromOffer.money}₼\n` +
      `Your give: ${toProps} + ${tradeData.toOffer.money}₼`;

  document.getElementById('trade-incoming-text').textContent = text;
  document.getElementById('trade-incoming').classList.remove('hidden');

  // Hide the offer sections
  document.querySelector('.trade-sides').classList.add('hidden');
  document.querySelector('.trade-actions').classList.add('hidden');

  document.getElementById('trade-modal').classList.remove('hidden');
}

function hideIncomingTrade() {
  document.getElementById('trade-incoming').classList.add('hidden');
  const sides = document.querySelector('.trade-sides');
  const actions = document.querySelector('.trade-actions');
  if (sides) sides.classList.remove('hidden');
  if (actions) actions.classList.remove('hidden');
  document.getElementById('trade-modal').classList.add('hidden');
}
