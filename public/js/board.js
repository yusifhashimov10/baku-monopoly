// board.js - Baku Monopoly Board Renderer (Canvas)
// Draws the complete 40-square Monopoly board on a <canvas>

const BOARD_DATA = [
  { id:0,  type:'go',        name:'Başlanğıc',      nameEn:'GO',             color:null,       icon:'🚀' },
  { id:1,  type:'property',  name:'Zabrat',          nameEn:'Zabrat',         color:'brown',    icon:'🏭' },
  { id:2,  type:'community', name:'Xəzinə',          nameEn:'Community',      color:null,       icon:'💰' },
  { id:3,  type:'property',  name:'Balaxanı',        nameEn:'Balaxani',       color:'brown',    icon:'🏭' },
  { id:4,  type:'tax',       name:'Gəlir Vergisi',   nameEn:'Income Tax',     color:null,       icon:'🏦' },
  { id:5,  type:'transport', name:'Hava Limanı',     nameEn:'Airport',        color:null,       icon:'✈️' },
  { id:6,  type:'property',  name:'Binəqədi',        nameEn:'Binagadi',       color:'lightblue',icon:'🕌' },
  { id:7,  type:'chance',    name:'Şans',            nameEn:'Chance',         color:null,       icon:'⚡' },
  { id:8,  type:'property',  name:'Suraxanı',        nameEn:'Surakhani',      color:'lightblue',icon:'🔥' },
  { id:9,  type:'property',  name:'Maştağa',         nameEn:'Mashtaga',       color:'lightblue',icon:'🏘️' },
  { id:10, type:'jail',      name:'Həbs',            nameEn:'Jail',           color:null,       icon:'⛓️' },
  { id:11, type:'property',  name:'Sabunçu',         nameEn:'Sabunchu',       color:'pink',     icon:'🏗️' },
  { id:12, type:'utility',   name:'Elektrik',        nameEn:'Electric Co.',   color:null,       icon:'⚡' },
  { id:13, type:'property',  name:'Lökbatan',        nameEn:'Lokbatan',       color:'pink',     icon:'🌋' },
  { id:14, type:'property',  name:'Ramana',          nameEn:'Ramana',         color:'pink',     icon:'🏰' },
  { id:15, type:'transport', name:'Dəmiryolu',       nameEn:'Railway',        color:null,       icon:'🚂' },
  { id:16, type:'property',  name:'Nardaran',        nameEn:'Nardaran',       color:'orange',   icon:'🏰' },
  { id:17, type:'community', name:'Xəzinə',          nameEn:'Community',      color:null,       icon:'💰' },
  { id:18, type:'property',  name:'Novxanı',         nameEn:'Novkhani',       color:'orange',   icon:'🌿' },
  { id:19, type:'property',  name:'Bilgəh',          nameEn:'Bilgah',         color:'orange',   icon:'🏖️' },
  { id:20, type:'freeparking',name:'Pulsuz Park',    nameEn:'Free Parking',   color:null,       icon:'🅿️' },
  { id:21, type:'property',  name:'Buzovna',         nameEn:'Buzovna',        color:'red',      icon:'🏖️' },
  { id:22, type:'chance',    name:'Şans',            nameEn:'Chance',         color:null,       icon:'⚡' },
  { id:23, type:'property',  name:'Novbəgün',        nameEn:'Novbagun',       color:'red',      icon:'🌲' },
  { id:24, type:'property',  name:'Balacadir',       nameEn:'Balacadir',      color:'red',      icon:'🌾' },
  { id:25, type:'transport', name:'Avtovağzal',      nameEn:'Bus Terminal',   color:null,       icon:'🚌' },
  { id:26, type:'property',  name:'Xətai',           nameEn:'Khatai',         color:'yellow',   icon:'🏛️' },
  { id:27, type:'property',  name:'Binə',            nameEn:'Bina',           color:'yellow',   icon:'✈️' },
  { id:28, type:'utility',   name:'Su Şirkəti',      nameEn:'Water Works',    color:null,       icon:'💧' },
  { id:29, type:'property',  name:'Nərimanov',       nameEn:'Narimanov',      color:'yellow',   icon:'🏟️' },
  { id:30, type:'gotojail',  name:'Həbsə Get',       nameEn:'Go To Jail',     color:null,       icon:'🚓' },
  { id:31, type:'property',  name:'Nizami',          nameEn:'Nizami',         color:'green',    icon:'🛍️' },
  { id:32, type:'property',  name:'Yasamal',         nameEn:'Yasamal',        color:'green',    icon:'🏙️' },
  { id:33, type:'community', name:'Xəzinə',          nameEn:'Community',      color:null,       icon:'💰' },
  { id:34, type:'property',  name:'Nəsimi',          nameEn:'Nasimi',         color:'green',    icon:'🕌' },
  { id:35, type:'transport', name:'Dəniz Limanı',    nameEn:'Sea Port',       color:null,       icon:'🚢' },
  { id:36, type:'chance',    name:'Şans',            nameEn:'Chance',         color:null,       icon:'⚡' },
  { id:37, type:'property',  name:'Şirvan',          nameEn:'Shirvan',        color:'darkblue', icon:'🏰' },
  { id:38, type:'tax',       name:'Əmlak Vergisi',   nameEn:'Luxury Tax',     color:null,       icon:'💸' },
  { id:39, type:'property',  name:'İçərişəhər',      nameEn:'Icherisheher',   color:'darkblue', icon:'🗼' },
];

const COLOR_MAP = {
  brown:    '#8B4513',
  lightblue:'#87CEEB',
  pink:     '#FF69B4',
  orange:   '#FFA500',
  red:      '#FF3333',
  yellow:   '#FFD700',
  green:    '#228B22',
  darkblue: '#00008B',
};

const BG_DARK    = '#0B1220';
const BG_SQUARE  = '#0F1A2E';
const BG_CORNER  = '#091326';
const BORDER_CLR = '#1E3050';
const TEXT_CLR   = '#E8F0FF';
const TEXT_MUTED = '#5A7090';

// Board layout constants
// Total board = N x N squares
// Corners: 10 each side including corners → 11 squares per side (10+10+10+10 - 4 corners = 36 + 4 = 40) ✓
// Corner size = 2x normal square

let BOARD_SIZE = 0;  // set at render time
let SQ = 0;          // normal square width
let CSQ = 0;         // corner square size
let canvas, ctx;
let currentLang = 'az';
let gameState = null;
let playerColorMap = {}; // playerId -> hex color

// ── Position Calculations ────────────────────────────────────
// Square IDs: 0=bottom-right corner, going counter-clockwise
// Classic board: 0=GO (bottom-right), 1-9 bottom row (right→left)
// 10=Jail (bottom-left), 11-19 left col (bottom→top)
// 20=FreeParking (top-left), 21-29 top row (left→right)
// 30=GoToJail (top-right), 31-39 right col (top→bottom)

function getSquareScreenPos(id) {
  // Returns center {x, y} of the square on the canvas
  const total = BOARD_SIZE;
  const corner = CSQ;
  const sq = SQ;

  // Bottom row: ids 0..10 (right to left, 0=rightmost corner)
  if (id <= 10) {
    if (id === 0) return { x: total - corner / 2, y: total - corner / 2 };
    if (id === 10) return { x: corner / 2, y: total - corner / 2 };
    // squares 1-9 from right to left
    const x = total - corner - (id - 1 + 0.5) * sq;
    return { x, y: total - corner / 2 };
  }
  // Left col: ids 11..20 (bottom to top, 20=top-left corner)
  if (id <= 20) {
    if (id === 20) return { x: corner / 2, y: corner / 2 };
    // squares 11-19 from bottom to top
    const y = total - corner - (id - 11 + 0.5) * sq;
    return { x: corner / 2, y };
  }
  // Top row: ids 21..30 (left to right, 30=top-right corner)
  if (id <= 30) {
    if (id === 30) return { x: total - corner / 2, y: corner / 2 };
    // squares 21-29 from left to right
    const x = corner + (id - 21 + 0.5) * sq;
    return { x, y: corner / 2 };
  }
  // Right col: ids 31..39 (top to bottom)
  const y = corner + (id - 31 + 0.5) * sq;
  return { x: total - corner / 2, y };
}

// ── Board Drawing ─────────────────────────────────────────────
function drawBoard(lang) {
  currentLang = lang || 'az';
  if (!canvas) return;

  // Fit board in container
  const container = document.getElementById('board-wrap');
  if (!container || !container.parentElement) return;
  const vw = container.parentElement.clientWidth - 40;
  const vh = window.innerHeight - 40;
  let size = Math.min(vw, vh, 800);

  // Guard: if container hasn't been laid out yet, skip rendering
  // (will be re-called once layout is ready)
  if (size < 100) return;

  BOARD_SIZE = size;
  canvas.width = size;
  canvas.height = size;

  // 9 normal squares each side + 2 corners = 11 per side
  // Corner = 2x, 9 normals share remaining space
  CSQ = Math.round(size / 11);
  SQ = CSQ;  // corners = 2*SQ wide, so total = 2*SQ + 9*SQ = 11*SQ ✓

  ctx.clearRect(0, 0, size, size);

  // Background
  ctx.fillStyle = '#061020';
  ctx.fillRect(0, 0, size, size);

  // ── Draw center area ──
  drawCenter();

  // ── Draw all squares ──
  for (const sq of BOARD_DATA) {
    drawSquare(sq);
  }
}

function drawCenter() {
  const margin = CSQ;
  const w = BOARD_SIZE - 2 * margin;

  // Gradient background
  const grad = ctx.createRadialGradient(
    BOARD_SIZE/2, BOARD_SIZE/2, w*0.1,
    BOARD_SIZE/2, BOARD_SIZE/2, w*0.6
  );
  grad.addColorStop(0, '#0d2040');
  grad.addColorStop(1, '#071018');
  ctx.fillStyle = grad;
  ctx.fillRect(margin, margin, w, w);

  // Border
  ctx.strokeStyle = '#1A3A5C';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(margin, margin, w, w);

  // Title
  const cx = BOARD_SIZE / 2;
  const cy = BOARD_SIZE / 2;

  ctx.font = `900 ${Math.round(w*0.06)}px Outfit, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // BAKI gradient text
  const gtitle = ctx.createLinearGradient(cx-60, cy-40, cx+60, cy-20);
  gtitle.addColorStop(0, '#0092BC');
  gtitle.addColorStop(1, '#509E2F');
  ctx.fillStyle = gtitle;
  ctx.fillText('BAKI', cx, cy - Math.round(w*0.07));

  // MONOPOLY gradient
  const gmono = ctx.createLinearGradient(cx-80, cy, cx+80, cy+20);
  gmono.addColorStop(0, '#FFD700');
  gmono.addColorStop(1, '#FFA500');
  ctx.fillStyle = gmono;
  ctx.font = `900 ${Math.round(w*0.08)}px Outfit, sans-serif`;
  ctx.fillText('MONOPOLY', cx, cy + Math.round(w*0.01));

  // Flame towers icon
  ctx.font = `${Math.round(w*0.09)}px serif`;
  ctx.fillText('🔥', cx, cy + Math.round(w*0.1));

  // Flag strip
  const stripY = cy + Math.round(w * 0.18);
  const stripW = w * 0.5;
  const stripX = cx - stripW/2;
  const stripH = 8;
  ctx.fillStyle = '#0092BC';
  ctx.fillRect(stripX, stripY, stripW, stripH);
  ctx.fillStyle = '#EF3340';
  ctx.fillRect(stripX, stripY + stripH, stripW, stripH);
  ctx.fillStyle = '#509E2F';
  ctx.fillRect(stripX, stripY + stripH*2, stripW, stripH);
}

function drawSquare(squareData) {
  const id = squareData.id;

  // Corner squares
  if ([0, 10, 20, 30].includes(id)) {
    drawCornerSquare(squareData);
    return;
  }

  // Determine position and orientation
  let x, y, w, h, orientation;
  const cs = CSQ;
  const sq = SQ;
  const bs = BOARD_SIZE;

  if (id >= 1 && id <= 9) {
    // Bottom row (right to left)
    x = bs - cs - (id) * sq;
    y = bs - cs;
    w = sq; h = cs;
    orientation = 'bottom';
  } else if (id >= 11 && id <= 19) {
    // Left col (bottom to top)
    x = 0;
    y = bs - cs - (id - 10) * sq;
    w = cs; h = sq;
    orientation = 'left';
  } else if (id >= 21 && id <= 29) {
    // Top row (left to right)
    x = cs + (id - 21) * sq;
    y = 0;
    w = sq; h = cs;
    orientation = 'top';
  } else {
    // Right col (top to bottom)
    x = bs - cs;
    y = cs + (id - 31) * sq;
    w = cs; h = sq;
    orientation = 'right';
  }

  // Background
  ctx.fillStyle = BG_SQUARE;
  ctx.fillRect(x, y, w, h);

  // Border
  ctx.strokeStyle = BORDER_CLR;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  // Color band
  if (squareData.color && COLOR_MAP[squareData.color]) {
    const bandSize = Math.round(cs * 0.22);
    ctx.fillStyle = COLOR_MAP[squareData.color];
    switch(orientation) {
      case 'bottom': ctx.fillRect(x, y, w, bandSize); break;
      case 'top':    ctx.fillRect(x, y + h - bandSize, w, bandSize); break;
      case 'left':   ctx.fillRect(x + w - bandSize, y, bandSize, h); break;
      case 'right':  ctx.fillRect(x, y, bandSize, h); break;
    }
  }

  // Draw text (rotated for sides)
  ctx.save();
  const cx2 = x + w/2;
  const cy2 = y + h/2;

  let angle = 0;
  if (orientation === 'left')  angle = Math.PI / 2;
  if (orientation === 'right') angle = -Math.PI / 2;
  if (orientation === 'top')   angle = Math.PI;

  ctx.translate(cx2, cy2);
  ctx.rotate(angle);

  const textW = orientation === 'left' || orientation === 'right' ? h : w;
  const textH = orientation === 'left' || orientation === 'right' ? w : h;

  // Icon
  const iconY = orientation === 'bottom' ? textH * 0.18 : -textH * 0.05;
  ctx.font = `${Math.round(textW * 0.28)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(squareData.icon, 0, iconY);

  // Name
  const name = currentLang === 'az' ? squareData.name : squareData.nameEn;
  const nameParts = wrapText(name, textW - 4, Math.round(textW * 0.09));
  const nameSize = Math.max(6, Math.round(textW * 0.09));
  ctx.font = `600 ${nameSize}px Outfit, sans-serif`;
  ctx.fillStyle = TEXT_CLR;

  const nameY = orientation === 'bottom'
    ? textH * 0.45
    : textH * 0.1;

  nameParts.forEach((part, i) => {
    ctx.fillText(part, 0, nameY + i * (nameSize + 1));
  });

  // Draw owner color indicator if owned
  if (gameState) {
    const ownerColor = getOwnerColor(id);
    if (ownerColor) {
      ctx.fillStyle = ownerColor;
      const dotR = textW * 0.08;
      ctx.beginPath();
      ctx.arc(0, textH * 0.3, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
    
    if (isMortgaged(id)) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-textW/2, -textH/2, textW, textH);
      ctx.font = `${Math.round(textW * 0.2)}px sans-serif`;
      ctx.fillText('🔒', 0, 0);
    } else {
      // Draw houses
      drawHousesOnSquare(id, 0, nameY - textH*0.1, textW);
    }
  }

  ctx.restore();
}

function drawCornerSquare(squareData) {
  const id = squareData.id;
  const cs = CSQ;
  const bs = BOARD_SIZE;

  let x, y;
  if (id === 0)  { x = bs - cs; y = bs - cs; }
  else if (id === 10) { x = 0; y = bs - cs; }
  else if (id === 20) { x = 0; y = 0; }
  else           { x = bs - cs; y = 0; }  // id === 30

  ctx.fillStyle = BG_CORNER;
  ctx.fillRect(x, y, cs, cs);
  ctx.strokeStyle = BORDER_CLR;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, cs, cs);

  const cx = x + cs/2;
  const cy = y + cs/2;

  // Icon
  ctx.font = `${Math.round(cs * 0.35)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(squareData.icon, cx, cy - cs * 0.1);

  // Name
  const name = currentLang === 'az' ? squareData.name : squareData.nameEn;
  ctx.font = `700 ${Math.round(cs * 0.1)}px Outfit, sans-serif`;
  ctx.fillStyle = TEXT_CLR;
  ctx.fillText(name, cx, cy + cs * 0.25);

  // Special decorations
  if (id === 0) {
    // GO - draw arrow and amount
    ctx.fillStyle = '#2ECC71';
    ctx.font = `900 ${Math.round(cs * 0.12)}px Outfit`;
    ctx.fillText('→', cx + cs*0.2, cy - cs*0.05);
    ctx.font = `600 ${Math.round(cs * 0.09)}px Outfit`;
    ctx.fillStyle = '#FFD700';
    ctx.fillText('200₼ al', cx, cy + cs * 0.37);
  }

  if (id === 10) {
    // Jail bars
    ctx.strokeStyle = '#EF3340';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + cs*0.65 + i*8, y + cs*0.55);
      ctx.lineTo(x + cs*0.65 + i*8, y + cs*0.9);
      ctx.stroke();
    }
  }

  if (id === 20) {
    // Free Parking pool
    if (gameState) {
      ctx.font = `700 ${Math.round(cs * 0.1)}px Outfit`;
      ctx.fillStyle = '#FFD700';
      ctx.fillText(`💰 ${gameState.freeParkingPool}₼`, cx, cy + cs * 0.37);
    }
  }

  if (id === 30) {
    // Go to jail - red glow
    ctx.shadowColor = '#EF3340';
    ctx.shadowBlur = 10;
    ctx.font = `${Math.round(cs * 0.32)}px serif`;
    ctx.fillText('🚨', cx, cy - cs*0.05);
    ctx.shadowBlur = 0;
  }
}

function drawHousesOnSquare(id, offsetX, offsetY, availW) {
  if (!gameState) return;
  // Find player who owns this with houses
  let houses = 0;
  for (const p of gameState.players) {
    if (p.properties.includes(id) && p.houses && p.houses[id]) {
      houses = p.houses[id];
      break;
    }
  }
  if (!houses) return;

  const houseSize = Math.min(availW / 6, 8);
  const startX = -(houses * (houseSize + 2)) / 2;
  for (let i = 0; i < houses; i++) {
    if (i < 4) {
      ctx.fillStyle = '#27AE60';
    } else {
      ctx.fillStyle = '#E74C3C';
    }
    ctx.fillRect(startX + i*(houseSize+2) + offsetX, offsetY, houseSize, houseSize);
  }
}

function getOwnerColor(squareId) {
  if (!gameState) return null;
  for (const p of gameState.players) {
    if (p.properties.includes(squareId)) {
      return playerColorMap[p.id] || null;
    }
  }
  return null;
}

function isMortgaged(squareId) {
  if (!gameState) return false;
  for (const p of gameState.players) {
    if (p.mortgaged && p.mortgaged.includes(squareId)) {
      return true;
    }
  }
  return false;
}

function wrapText(text, maxWidth, fontSize) {
  // Simple word wrap
  const words = text.split(' ');
  const lines = [];
  let line = '';
  const approxCharW = fontSize * 0.55;
  const maxChars = Math.floor(maxWidth / approxCharW);

  for (const word of words) {
    if ((line + word).length <= maxChars) {
      line += (line ? ' ' : '') + word;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

// ── Update board with game state ──────────────────────────────
function updateBoard(state, colorMap, lang) {
  gameState = state;
  if (colorMap) playerColorMap = colorMap;
  drawBoard(lang);
}

// ── Click detection on board ──────────────────────────────────
function getBoardSquareAtClick(mouseX, mouseY) {
  const cs = CSQ;
  const sq = SQ;
  const bs = BOARD_SIZE;

  for (const squareData of BOARD_DATA) {
    const id = squareData.id;
    let x, y, w, h;

    if (id === 0)  { x = bs-cs; y = bs-cs; w = cs; h = cs; }
    else if (id === 10) { x = 0; y = bs-cs; w = cs; h = cs; }
    else if (id === 20) { x = 0; y = 0; w = cs; h = cs; }
    else if (id === 30) { x = bs-cs; y = 0; w = cs; h = cs; }
    else if (id >= 1 && id <= 9)   { x = bs-cs-id*sq; y = bs-cs; w = sq; h = cs; }
    else if (id >= 11 && id <= 19) { x = 0; y = bs-cs-(id-10)*sq; w = cs; h = sq; }
    else if (id >= 21 && id <= 29) { x = cs+(id-21)*sq; y = 0; w = sq; h = cs; }
    else                           { x = bs-cs; y = cs+(id-31)*sq; w = cs; h = sq; }

    if (mouseX >= x && mouseX <= x+w && mouseY >= y && mouseY <= y+h) {
      return id;
    }
  }
  return -1;
}

// ── Token Positions ───────────────────────────────────────────
function getTokenScreenPos(squareId, tokenIndex, totalTokens) {
  const pos = getSquareScreenPos(squareId);
  // Offset multiple tokens in a small grid
  const offset = 12;
  const cols = Math.ceil(Math.sqrt(totalTokens));
  const col = tokenIndex % cols;
  const row = Math.floor(tokenIndex / cols);
  return {
    x: pos.x + (col - (cols-1)/2) * offset,
    y: pos.y + (row - Math.floor(totalTokens/cols)/2) * offset,
  };
}
