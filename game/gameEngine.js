// gameEngine.js - Core Monopoly Game Logic for Baku Monopoly
const boardData = require('./boardData');
const cardData = require('./cardData');

const BOARD_SIZE = 40;
const JAIL_POSITION = 10;
const GO_TO_JAIL_POSITION = 30;
const FREE_PARKING_POSITION = 20;
const TRANSPORT_POSITIONS = [5, 15, 25, 35];
const UTILITY_POSITIONS = [12, 28];

class GameEngine {
  constructor(roomCode, players) {
    this.roomCode = roomCode;
    this.players = players.map((p) => ({
      ...p,
      position: 0,
      money: 1500,
      properties: [],
      mortgaged: [],
      houses: {},
      inJail: false,
      jailTurns: 0,
      jailFreeCards: 0,
      consecutiveDoubles: 0,
      isBankrupt: false,
      color: p.color,
      figure: p.figure,
    }));
    this.currentPlayerIndex = 0;
    this.phase = 'rolling';
    this.freeParkingPool = 0;
    this.chanceCards = this._shuffle([...cardData.chance]);
    this.communityCards = this._shuffle([...cardData.community]);
    this.chanceIndex = 0;
    this.communityIndex = 0;
    this.lastDice = [1, 1];
    this.lastDoubles = false;
    this.doublesCount = 0;
    this.auctionData = null;
    this.tradeData = null;
    this._phaseBeforeTrade = null;
    this._phaseBeforeDebt = null;
    this.pendingCard = null;
    this.gameOver = false;
    this.winner = null;
    this.log = [];

    // ── Starting Phase ──────────────────────────────────────────
    this.startingPhase = true;
    this.currentPlayerIndex = 0;
    this.startingOrderRolls = {};
    this.tiedPlayers = null;
  }

  // ─── Utility ─────────────────────────────────────────────────────────────
  _shuffleArr(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  _shuffle(arr) { return this._shuffleArr(arr); }

  _rollDie() { return Math.floor(Math.random() * 6) + 1; }
  _rollDice() { return [this._rollDie(), this._rollDie()]; }

  _addLog(msgAz, msgEn) {
    this.log.push({ az: msgAz, en: msgEn, time: Date.now() });
    if (this.log.length > 100) this.log.shift();
  }

  get currentPlayer() { return this.players[this.currentPlayerIndex]; }

  _getSquare(pos) { return boardData[pos]; }

  _getPlayerById(id) { return this.players.find(p => p.id === id); }

  _isPropertyOwned(squareId) {
    for (const p of this.players) {
      if (p.properties.includes(squareId)) return p;
    }
    return null;
  }

  _isPropertyMortgaged(squareId) {
    for (const p of this.players) {
      if (p.mortgaged && p.mortgaged.includes(squareId)) return true;
    }
    return false;
  }

  _colorGroupFull(color, ownerId) {
    const group = boardData.filter(s => s.type === 'property' && s.color === color);
    return group.every(s => {
      const owner = this._isPropertyOwned(s.id);
      return owner && owner.id === ownerId;
    });
  }

  _countTransports(ownerId) {
    return TRANSPORT_POSITIONS.filter(pos => {
      const owner = this._isPropertyOwned(pos);
      return owner && owner.id === ownerId;
    }).length;
  }

  _countUtilities(ownerId) {
    return UTILITY_POSITIONS.filter(pos => {
      const owner = this._isPropertyOwned(pos);
      return owner && owner.id === ownerId;
    }).length;
  }

  _nearestTransport(position) {
    let nearest = TRANSPORT_POSITIONS[0];
    let minDist = Infinity;
    for (const tp of TRANSPORT_POSITIONS) {
      const dist = (tp - position + BOARD_SIZE) % BOARD_SIZE;
      if (dist > 0 && dist < minDist) { minDist = dist; nearest = tp; }
    }
    return nearest;
  }

  _movePlayer(player, steps, collectGo = true) {
    const oldPos = player.position;
    player.position = (player.position + steps) % BOARD_SIZE;
    // Passed GO
    if (collectGo && player.position < oldPos && steps > 0) {
      player.money += 200;
      this._addLog(`${player.nameAz} Başlanğıcdan keçdi, 200₼ aldı.`, `${player.nameEn} passed GO, collected 200₼.`);
    }
  }

  _sendToJail(player) {
    player.position = JAIL_POSITION;
    player.inJail = true;
    player.jailTurns = 0;
    player.consecutiveDoubles = 0;
    this._addLog(`${player.nameAz} həbsə getdi!`, `${player.nameAz} went to jail!`);
  }

  _payBank(player, amount) {
    player.money -= amount;
    this._checkBankruptcy(player);
  }

  _payFreeParking(player, amount) {
    player.money -= amount;
    this.freeParkingPool += amount;
    this._checkBankruptcy(player);
  }

  _payPlayer(from, to, amount) {
    from.money -= amount;
    to.money += amount;
    this._checkBankruptcy(from);
  }

  _collectFromBank(player, amount) { player.money += amount; }

  _checkBankruptcy(player) {
    if (player.money < 0 && !player.isBankrupt) {
      // Calculate total available assets
      const totalAssets = player.properties.reduce((sum, propId) => {
        if (player.mortgaged && player.mortgaged.includes(propId)) return sum;
        const sq = this._getSquare(propId);
        return sum + (sq.mortgage || 0);
      }, 0);
      
      const houseAssets = Object.entries(player.houses || {}).reduce((sum, [propId, count]) => {
        const sq = this._getSquare(parseInt(propId));
        return sum + count * Math.floor(sq.houseCost / 2);
      }, 0);

      if (player.money + totalAssets + houseAssets < 0) {
        this._declareBankruptcy(player);
      } else {
        if (this.phase !== 'debt') {
          this._phaseBeforeDebt = this.phase;
          this.phase = 'debt';
        }
      }
    }
  }

  resolveDebt(playerId) {
    const player = this._getPlayerById(playerId);
    if (!player) return { error: 'Invalid player' };
    if (this.phase !== 'debt') return { error: 'Not in debt' };
    if (player.money < 0) return { error: 'Hələ də borcunuz var' };
    
    this.phase = this._phaseBeforeDebt || 'rolling';
    this._phaseBeforeDebt = null;
    this._addLog(`${player.nameAz} borcunu ödədi.`, `${player.nameAz} resolved their debt.`);
    return { resolved: true };
  }

  declareBankrupt(playerId) {
    const player = this._getPlayerById(playerId);
    if (!player || player.isBankrupt) return { error: 'Invalid or already bankrupt' };
    this._declareBankruptcy(player);
    
    // If it was their turn, move to next player
    if (this.currentPlayer.id === playerId) {
      if (!this.gameOver) {
        this._nextTurn();
      }
    }
    return { bankrupt: true };
  }

  _declareBankruptcy(player) {
    player.isBankrupt = true;
    player.position = 10; // Send bankrupt players to just visiting graphically
    
    // Unmortgage and remove properties
    player.mortgaged = [];
    player.houses = {};
    player.properties = [];
    
    this._addLog(`${player.nameAz} müflis oldu!`, `${player.nameAz} went bankrupt!`);

    const activePlayers = this.players.filter(p => !p.isBankrupt);
    if (activePlayers.length === 1) {
      this.gameOver = true;
      this.winner = activePlayers[0];
      this._addLog(`${this.winner.nameAz} oyunu qazandı!`, `${this.winner.nameAz} won the game!`);
    }
  }

  // ─── Main Turn: Roll Dice ─────────────────────────────────────────────────
  rollDice(playerId) {
    if (this.gameOver) return { error: 'Game over' };
    if (this.currentPlayer.id !== playerId) return { error: 'Not your turn' };
    if (this.phase !== 'rolling') return { error: 'Not rolling phase' };

    const player = this.currentPlayer;
    const [d1, d2] = this._rollDice();
    const isDoubles = d1 === d2;
    this.lastDice = [d1, d2];
    this.lastDoubles = isDoubles;

    // Handle jail
    if (player.inJail) {
      return this._handleJailRoll(player, d1, d2, isDoubles);
    }

    if (isDoubles) {
      this.doublesCount++;
      if (this.doublesCount >= 3) {
        this._sendToJail(player);
        this.doublesCount = 0;
        this.lastDoubles = false;
        this._nextTurn();
        return { dice: [d1, d2], doubles: true, thirdDoubles: true, jailed: true };
      }
    } else {
      this.doublesCount = 0;
    }

    this._movePlayer(player, d1 + d2);
    const result = this._landOnSquare(player);

    return { dice: [d1, d2], doubles: isDoubles, position: player.position, ...result };
  }

  _handleJailRoll(player, d1, d2, isDoubles) {
    player.jailTurns++;

    if (isDoubles) {
      player.inJail = false;
      player.jailTurns = 0;
      this.doublesCount = 0; // doubles in jail don't chain
      this._movePlayer(player, d1 + d2);
      const result = this._landOnSquare(player);
      this._addLog(`${player.nameAz} həbsdən qoşa zərlə çıxdı!`, `${player.nameAz} rolled doubles out of jail!`);
      return { dice: [d1, d2], doubles: false, jailEscape: 'doubles', position: player.position, ...result };
    }

    if (player.jailTurns >= 3) {
      // Must pay to leave
      player.money -= 50;
      player.inJail = false;
      player.jailTurns = 0;
      this._movePlayer(player, d1 + d2);
      const result = this._landOnSquare(player);
      this._addLog(`${player.nameAz} 50₼ ödəyib həbsdən çıxdı.`, `${player.nameAz} paid 50₼ to leave jail.`);
      return { dice: [d1, d2], doubles: false, jailEscape: 'paid', position: player.position, ...result };
    }

    // Still in jail, turn ends
    this.phase = 'rolling';
    this._nextTurn();
    return { dice: [d1, d2], doubles: false, stillInJail: true };
  }

  _landOnSquare(player) {
    const square = this._getSquare(player.position);
    this._addLog(`${player.nameAz} ${square.name} xanasına düşdü.`, `${player.nameAz} landed on ${square.nameEn}.`);

    switch (square.type) {
      case 'go':
        player.money += 200; // extra 200 for landing on GO itself
        return { squareType: 'go', square };

      case 'property':
      case 'transport':
      case 'utility': {
        const owner = this._isPropertyOwned(square.id);
        if (!owner) {
          // Unowned - can buy or auction
          this.phase = 'buying';
          return { squareType: square.type, square, canBuy: true };
        }
        if (owner.id === player.id) {
          // Own transport and have all 4 → can teleport
          if (square.type === 'transport' && this._countTransports(player.id) >= 4) {
            this.phase = 'teleport';
            return { squareType: square.type, square, ownedBySelf: true, canTeleport: true };
          }
          if (this.phase !== 'debt') {
            this.phase = this.lastDoubles ? 'rolling' : 'endturn';
          }
          return { squareType: square.type, square, ownedBySelf: true };
        }
        // If property is mortgaged, no rent
        if (this._isPropertyMortgaged(square.id)) {
          this._addLog(`${square.name} ipotekadadır, icarə ödənilmir.`,
                       `${square.nameEn} is mortgaged, no rent collected.`);
          if (this.phase !== 'debt') {
            this.phase = this.lastDoubles ? 'rolling' : 'endturn';
          }
          return { squareType: square.type, square, mortgaged: true };
        }
        // Pay rent
        const rent = this._calculateRent(square, owner, this.lastDice);
        this._payPlayer(player, owner, rent);
        this._addLog(`${player.nameAz} ${owner.nameAz}-a ${rent}₼ icarə ödədi.`,
                     `${player.nameAz} paid ${rent}₼ rent to ${owner.nameEn}.`);
        if (this.phase !== 'debt') {
          this.phase = this.lastDoubles ? 'rolling' : 'endturn';
        }
        return { squareType: square.type, square, rentPaid: rent, rentTo: owner.id };
      }

      case 'tax':
        this._payFreeParking(player, square.amount);
        this._addLog(`${player.nameAz} ${square.amount}₼ vergi ödədi. Pulsuz Parka əlavə edildi.`,
                     `${player.nameAz} paid ${square.amount}₼ tax. Added to Free Parking.`);
        if (this.phase !== 'debt') {
          this.phase = this.lastDoubles ? 'rolling' : 'endturn';
        }
        return { squareType: 'tax', square, amountPaid: square.amount, freeParkingPool: this.freeParkingPool };

      case 'chance':
        return this._drawCard('chance', player);

      case 'community':
        return this._drawCard('community', player);

      case 'freeparking': {
        const pool = this.freeParkingPool;
        player.money += pool;
        this.freeParkingPool = 0;
        this._addLog(`${player.nameAz} Pulsuz Parkdan ${pool}₼ aldı!`, `${player.nameAz} collected ${pool}₼ from Free Parking!`);
        if (this.phase !== 'debt') {
          this.phase = this.lastDoubles ? 'rolling' : 'endturn';
        }
        return { squareType: 'freeparking', collected: pool };
      }

      case 'gotojail':
        this._sendToJail(player);
        this._nextTurn();
        return { squareType: 'gotojail' };

      case 'jail':
        this.phase = this.lastDoubles ? 'rolling' : 'endturn';
        return { squareType: 'jail', justVisiting: true };

      default:
        this.phase = this.lastDoubles ? 'rolling' : 'endturn';
        return { squareType: square.type, square };
    }
  }

  _calculateRent(square, owner, dice) {
    if (square.type === 'transport') {
      const count = this._countTransports(owner.id);
      return square.rent[count - 1];
    }
    if (square.type === 'utility') {
      const count = this._countUtilities(owner.id);
      const diceSum = dice[0] + dice[1];
      return count === 1 ? diceSum * 4 : diceSum * 10;
    }
    // Property
    const houses = owner.houses ? (owner.houses[square.id] || 0) : 0;
    return square.rent[houses];
  }

  _drawCard(type, player) {
    let card;
    if (type === 'chance') {
      card = this.chanceCards[this.chanceIndex % this.chanceCards.length];
      this.chanceIndex++;
    } else {
      card = this.communityCards[this.communityIndex % this.communityCards.length];
      this.communityIndex++;
    }

    this.pendingCard = { card, type, playerId: player.id };
    this.phase = 'card';
    return { squareType: type, card };
  }

  executeCard(playerId) {
    if (!this.pendingCard || this.currentPlayer.id !== playerId) return { error: 'No pending card' };
    const { card } = this.pendingCard;
    const player = this.currentPlayer;
    const action = card.action;
    let result = { cardExecuted: true, card };

    switch (action.type) {
      case 'move':
        this._movePlayer(player, (action.target - player.position + BOARD_SIZE) % BOARD_SIZE, action.collectGo);
        result.land = this._landOnSquare(player);
        break;
      case 'moveBack':
        player.position = (player.position - action.spaces + BOARD_SIZE) % BOARD_SIZE;
        result.land = this._landOnSquare(player);
        break;
      case 'nearestTransport': {
        const nearest = this._nearestTransport(player.position);
        this._movePlayer(player, (nearest - player.position + BOARD_SIZE) % BOARD_SIZE, true);
        result.land = this._landOnSquare(player);
        if (action.doubleRent) result.doubleRent = true;
        break;
      }
      case 'collectFromBank':
        this._collectFromBank(player, action.amount);
        if (this.phase !== 'debt') {
          this.phase = this.lastDoubles ? 'rolling' : 'endturn';
        }
        break;
      case 'payBank':
        this._payFreeParking(player, action.amount);
        if (this.phase !== 'debt') {
          this.phase = this.lastDoubles ? 'rolling' : 'endturn';
        }
        break;
      case 'collectFromAll':
        for (const p of this.players) {
          if (p.id !== player.id && !p.isBankrupt) {
            this._payPlayer(p, player, action.amount);
          }
        }
        if (this.phase !== 'debt') {
          this.phase = this.lastDoubles ? 'rolling' : 'endturn';
        }
        break;
      case 'payAll':
        for (const p of this.players) {
          if (p.id !== player.id && !p.isBankrupt) {
            this._payPlayer(player, p, action.amount);
          }
        }
        if (this.phase !== 'debt') {
          this.phase = this.lastDoubles ? 'rolling' : 'endturn';
        }
        break;
      case 'jail':
        this._sendToJail(player);
        this._nextTurn();
        break;
      case 'jailFree':
        player.jailFreeCards++;
        if (this.phase !== 'debt') {
          this.phase = this.lastDoubles ? 'rolling' : 'endturn';
        }
        break;
      case 'repairs': {
        let total = 0;
        for (const propId of player.properties) {
          const sq = this._getSquare(propId);
          if (sq.type === 'property') {
            const h = (player.houses && player.houses[propId]) || 0;
            if (h === 5) total += action.hotelCost;
            else total += h * action.houseCost;
          }
        }
        this._payFreeParking(player, total);
        if (this.phase !== 'debt') {
          this.phase = this.lastDoubles ? 'rolling' : 'endturn';
        }
        break;
      }
    }

    this.pendingCard = null;
    return result;
  }

  // ─── Buying ───────────────────────────────────────────────────────────────
  buyProperty(playerId) {
    if (this.currentPlayer.id !== playerId || this.phase !== 'buying') return { error: 'Cannot buy now' };
    const player = this.currentPlayer;
    const square = this._getSquare(player.position);

    if (player.money < square.price) return { error: 'Not enough money' };

    player.money -= square.price;
    player.properties.push(square.id);

    this._addLog(`${player.nameAz} ${square.name}-ı ${square.price}₼-a satın aldı.`,
                 `${player.nameAz} bought ${square.nameEn} for ${square.price}₼.`);

    this.phase = this.lastDoubles ? 'rolling' : 'endturn';
    return { bought: true, square, player: { id: player.id, money: player.money, properties: player.properties } };
  }

  declineBuy(playerId) {
    if (this.currentPlayer.id !== playerId || this.phase !== 'buying') return { error: 'Cannot decline now' };
    const square = this._getSquare(this.currentPlayer.position);
    return this.startAuction(square.id);
  }

  // ─── Auction ──────────────────────────────────────────────────────────────
  startAuction(squareId) {
    const square = this._getSquare(squareId);
    this.auctionData = {
      squareId,
      square,
      bids: {},
      currentHighest: 0,
      highestBidderId: null,
      round: 0,
      passed: {},
      active: true,
    };
    // All non-bankrupt players participate
    for (const p of this.players) {
      if (!p.isBankrupt) this.auctionData.bids[p.id] = 0;
    }
    this.phase = 'auction';
    this._addLog(`${square.name} açıq artırmaya çıxarıldı!`, `${square.nameEn} is up for auction!`);
    return { auctionStarted: true, squareId, square };
  }

  placeBid(playerId, amount) {
    if (this.phase !== 'auction' || !this.auctionData) return { error: 'No auction' };
    const player = this._getPlayerById(playerId);
    if (!player || player.isBankrupt) return { error: 'Invalid player' };
    if (amount <= this.auctionData.currentHighest) return { error: 'Bid too low' };
    if (amount > player.money) return { error: 'Not enough money' };

    this.auctionData.bids[playerId] = amount;
    this.auctionData.currentHighest = amount;
    this.auctionData.highestBidderId = playerId;
    return { bid: amount, playerId, auctionData: this.auctionData };
  }

  passAuction(playerId) {
    if (this.phase !== 'auction' || !this.auctionData) return { error: 'No auction' };
    this.auctionData.passed[playerId] = true;

    const activeBidders = this.players.filter(p => !p.isBankrupt && !this.auctionData.passed[p.id]);
    if (activeBidders.length === 0) {
      return this._endAuction();
    }
    return { passed: true, playerId, auctionData: this.auctionData };
  }

  _endAuction() {
    const { squareId, currentHighest, highestBidderId } = this.auctionData;
    const square = this._getSquare(squareId);

    if (highestBidderId && currentHighest > 0) {
      const winner = this._getPlayerById(highestBidderId);
      winner.money -= currentHighest;
      winner.properties.push(squareId);
      this._addLog(`${winner.nameAz} artırmada ${square.name}-ı ${currentHighest}₼-a aldı.`,
                   `${winner.nameAz} won auction for ${square.nameEn} at ${currentHighest}₼.`);
    } else {
      this._addLog(`Artırmada heç kim ${square.name}-ı almadı.`, `No one bought ${square.nameEn} in auction.`);
    }

    this.auctionData = null;
    this.phase = this.lastDoubles ? 'rolling' : 'endturn';
    return { auctionEnded: true, winnerId: highestBidderId, amount: currentHighest };
  }

  // ─── Jail Actions ─────────────────────────────────────────────────────────
  payJail(playerId) {
    if (this.currentPlayer.id !== playerId || !this.currentPlayer.inJail) return { error: 'Not in jail' };
    const player = this.currentPlayer;
    if (player.money < 50) return { error: 'Not enough money' };
    player.money -= 50;
    player.inJail = false;
    player.jailTurns = 0;
    this._addLog(`${player.nameAz} 50₼ ödəyib həbsdən çıxdı.`, `${player.nameAz} paid 50₼ bail.`);
    return { jailPaid: true };
  }

  useJailCard(playerId) {
    if (this.currentPlayer.id !== playerId || !this.currentPlayer.inJail) return { error: 'Not in jail' };
    const player = this.currentPlayer;
    if (player.jailFreeCards < 1) return { error: 'No jail free card' };
    player.jailFreeCards--;
    player.inJail = false;
    player.jailTurns = 0;
    this._addLog(`${player.nameAz} kartı ilə həbsdən çıxdı.`, `${player.nameAz} used Get Out of Jail Free card.`);
    return { cardUsed: true };
  }

  // ─── Building ─────────────────────────────────────────────────────────────
  buildHouse(playerId, squareId) {
    const player = this._getPlayerById(playerId);
    if (!player || !player.properties.includes(squareId)) return { error: 'Do not own this property' };
    const square = this._getSquare(squareId);
    if (square.type !== 'property') return { error: 'Cannot build here' };
    if (!this._colorGroupFull(square.color, playerId)) return { error: 'Need full color group' };
    // Cannot build on mortgaged property
    if (player.mortgaged && player.mortgaged.includes(squareId)) return { error: 'Property is mortgaged' };

    if (!player.houses) player.houses = {};
    const current = player.houses[squareId] || 0;
    if (current >= 5) return { error: 'Already has hotel' };
    if (player.money < square.houseCost) return { error: 'Not enough money' };

    // Even building rule: can only build if this has the minimum houses in the group
    const group = boardData.filter(s => s.type === 'property' && s.color === square.color);
    const minHouses = Math.min(...group.map(s => player.houses[s.id] || 0));
    if (current > minHouses) return { error: lang === 'az' ? 'Bərabər tikinti qaydası' : 'Must build evenly across color group' };

    player.money -= square.houseCost;
    player.houses[squareId] = current + 1;

    const type = current + 1 === 5 ? 'hotel' : 'house';
    this._addLog(`${player.nameAz} ${square.name}-da ${type} tikdi.`, `${player.nameAz} built a ${type} on ${square.nameEn}.`);
    return { built: true, squareId, houses: player.houses[squareId] };
  }

  sellHouse(playerId, squareId) {
    const player = this._getPlayerById(playerId);
    if (!player || !player.properties.includes(squareId)) return { error: 'Do not own this property' };
    if (!player.houses || !player.houses[squareId]) return { error: 'No houses to sell' };

    const square = this._getSquare(squareId);
    const current = player.houses[squareId] || 0;

    // Even selling rule: can only sell if this has the maximum houses in the group
    const group = boardData.filter(s => s.type === 'property' && s.color === square.color);
    const maxHouses = Math.max(...group.map(s => player.houses[s.id] || 0));
    if (current < maxHouses) return { error: 'Must sell evenly across color group' };

    const refund = Math.floor(square.houseCost / 2);
    player.houses[squareId]--;
    player.money += refund;
    
    // Automatically resolve debt if they get enough money from selling house
    if (this.phase === 'debt' && player.money >= 0) {
      this.resolveDebt(playerId);
    }
    
    return { sold: true, squareId, houses: player.houses[squareId], refund };
  }

  mortgage(playerId, squareId) {
    const player = this._getPlayerById(playerId);
    if (!player || !player.properties.includes(squareId)) return { error: 'Do not own this property' };
    if (player.mortgaged && player.mortgaged.includes(squareId)) return { error: 'Already mortgaged' };
    const square = this._getSquare(squareId);
    // Cannot mortgage if there are houses on any property in the group
    if (square.type === 'property' && square.color) {
      const group = boardData.filter(s => s.type === 'property' && s.color === square.color);
      const hasHouses = group.some(s => player.houses && player.houses[s.id] > 0);
      if (hasHouses) return { error: 'Must sell all houses in group first' };
    }
    player.money += square.mortgage;
    if (!player.mortgaged) player.mortgaged = [];
    player.mortgaged.push(squareId);
    this._addLog(`${player.nameAz} ${square.name}-ı ipoteka etdi (${square.mortgage}₼).`, `${player.nameAz} mortgaged ${square.nameEn} (${square.mortgage}₼).`);
    
    // Automatically resolve debt if they get enough money from mortgage while in debt phase
    if (this.phase === 'debt' && player.money >= 0) {
      this.resolveDebt(playerId);
    }

    return { mortgaged: true, squareId, amount: square.mortgage };
  }

  unmortgage(playerId, squareId) {
    const player = this._getPlayerById(playerId);
    if (!player || !player.properties.includes(squareId)) return { error: 'Do not own this property' };
    if (!player.mortgaged || !player.mortgaged.includes(squareId)) return { error: 'Not mortgaged' };
    const square = this._getSquare(squareId);
    const cost = square.mortgage + 10;
    if (player.money < cost) return { error: 'Not enough money' };
    player.money -= cost;
    player.mortgaged = player.mortgaged.filter(id => id !== squareId);
    this._addLog(`${player.nameAz} ${square.name}-ı ipotekadan çıxardı (${cost}₼).`, `${player.nameAz} unmortgaged ${square.nameEn} (${cost}₼).`);
    return { unmortgaged: true, squareId, cost };
  }

  // ─── Transport Teleport ───────────────────────────────────────────────────
  teleportTransport(playerId, targetSquareId) {
    const player = this._getPlayerById(playerId);
    if (!player) return { error: 'Invalid player' };
    if (this.phase !== 'teleport') return { error: 'Not in teleport phase' };
    if (this._countTransports(playerId) < 4) return { error: 'Need all 4 transports' };
    if (!TRANSPORT_POSITIONS.includes(targetSquareId)) return { error: 'Not a transport square' };
    player.position = targetSquareId;
    this._addLog(`${player.nameAz} ${boardData[targetSquareId].name}-a teleport etdi.`,
                 `${player.nameAz} teleported to ${boardData[targetSquareId].nameEn}.`);
    this.phase = this.lastDoubles ? 'rolling' : 'endturn';
    return { teleported: true, position: targetSquareId };
  }

  skipTeleport(playerId) {
    if (this.phase !== 'teleport') return { error: 'Not in teleport phase' };
    this.phase = this.lastDoubles ? 'rolling' : 'endturn';
    return { skipped: true };
  }

  // ─── Trade ───────────────────────────────────────────────────────────────
  initiateTrade(fromId, toId, offer) {
    // offer: { properties: [squareIds], money: number }
    // Save current phase to restore after trade
    this._phaseBeforeTrade = this.phase;
    this.tradeData = {
      fromId, toId,
      fromOffer: offer.fromOffer || { properties: [], money: 0 },
      toOffer: offer.toOffer || { properties: [], money: 0 },
      status: 'pending'
    };
    this.phase = 'trade';
    return { tradeInitiated: true, tradeData: this.tradeData };
  }

  respondTrade(playerId, accepted) {
    if (!this.tradeData || this.tradeData.toId !== playerId) return { error: 'Not your trade' };

    if (accepted) {
      const from = this._getPlayerById(this.tradeData.fromId);
      const to = this._getPlayerById(this.tradeData.toId);

      // Transfer properties from->to
      for (const propId of this.tradeData.fromOffer.properties) {
        from.properties = from.properties.filter(id => id !== propId);
        to.properties.push(propId);
      }
      // Transfer properties to->from
      for (const propId of this.tradeData.toOffer.properties) {
        to.properties = to.properties.filter(id => id !== propId);
        from.properties.push(propId);
      }
      // Transfer money
      from.money -= this.tradeData.fromOffer.money;
      from.money += this.tradeData.toOffer.money;
      to.money += this.tradeData.fromOffer.money;
      to.money -= this.tradeData.toOffer.money;

      this._addLog(`${from.nameAz} ilə ${to.nameAz} arasında mübadilə baş verdi.`,
                   `Trade completed between ${from.nameEn} and ${to.nameEn}.`);
    }

    const result = { tradeAccepted: accepted, tradeData: this.tradeData };
    this.tradeData = null;
    // Restore phase from before trade
    this.phase = this._phaseBeforeTrade || 'rolling';
    this._phaseBeforeTrade = null;
    return result;
  }

  cancelTrade(playerId) {
    if (!this.tradeData) return { error: 'No trade active' };
    this.tradeData = null;
    // Restore phase from before trade
    this.phase = this._phaseBeforeTrade || 'rolling';
    this._phaseBeforeTrade = null;
    return { tradeCancelled: true };
  }

  // ─── End Turn ─────────────────────────────────────────────────────────────
  endTurn(playerId) {
    if (this.currentPlayer.id !== playerId) return { error: 'Not your turn' };
    if (this.phase !== 'endturn' && this.phase !== 'rolling') return { error: 'Cannot end turn now' };
    // If doubles, must have re-rolled already handled by phase
    this._nextTurn();
    return { turnEnded: true, nextPlayer: this.currentPlayer.id };
  }

  _nextTurn() {
    this.doublesCount = 0;
    this.lastDoubles = false;
    do {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    } while (this.currentPlayer.isBankrupt);
    this.phase = 'rolling';
    this._addLog(`Sıra: ${this.currentPlayer.nameAz}`, `Turn: ${this.currentPlayer.nameEn}`);
  }

  // ─── Starting Order ───────────────────────────────────────────────────────
  rollForStart(playerId) {
    if (!this.startingPhase) return null;
    // Don't allow if already rolled (not in a tie or not this player's turn to re-roll)
    const contestants = this.tiedPlayers || this.players.map(p => p.id);
    if (!contestants.includes(playerId)) return null;
    if (this.startingOrderRolls[playerId] !== undefined) return null;

    const roll = this._rollDie() + this._rollDie();
    this.startingOrderRolls[playerId] = roll;

    // Check if all contestants have rolled
    const allRolled = contestants.every(id => this.startingOrderRolls[id] !== undefined);
    if (!allRolled) {
      return { type: 'partial', playerId, roll, allRolls: { ...this.startingOrderRolls } };
    }

    // Pass this player's roll so client knows the final value for animation
    const resolved = this._resolveStartOrder(contestants);
    return { ...resolved, roll };
  }

  rollForStartTie(playerId) {
    if (!this.startingPhase || !this.tiedPlayers) return null;
    if (!this.tiedPlayers.includes(playerId)) return null;
    if (this.startingOrderRolls[playerId] !== undefined) return null;

    const roll = this._rollDie() + this._rollDie();
    this.startingOrderRolls[playerId] = roll;

    const allRolled = this.tiedPlayers.every(id => this.startingOrderRolls[id] !== undefined);
    if (!allRolled) {
      return { type: 'partial', playerId, roll, allRolls: { ...this.startingOrderRolls } };
    }

    const resolved = this._resolveStartOrder(this.tiedPlayers);
    return { ...resolved, roll };
  }

  _resolveStartOrder(contestants) {
    const rolls = this.startingOrderRolls;
    const maxRoll = Math.max(...contestants.map(id => rolls[id]));
    const topPlayers = contestants.filter(id => rolls[id] === maxRoll);

    if (topPlayers.length > 1) {
      // Tie among top scorers — reset their rolls and ask them to re-roll
      this.tiedPlayers = topPlayers;
      for (const id of topPlayers) delete this.startingOrderRolls[id];
      return { type: 'tie', tiedPlayers: topPlayers, allRolls: { ...rolls } };
    }

    // Determine full order: sort all contestants by roll descending
    const ordered = [...contestants].sort((a, b) => rolls[b] - rolls[a]);
    // Set current player to the winner
    const winnerId = ordered[0];
    this.currentPlayerIndex = this.players.findIndex(p => p.id === winnerId);
    this.startingPhase = false;
    this.tiedPlayers = null;
    this._addLog(
      `Başlama sırası müəyyən oldu! İlk oynayan: ${this.currentPlayer.nameAz}`,
      `Starting order decided! First player: ${this.currentPlayer.nameEn}`
    );
    return { type: 'ordered', orderedPlayerIds: ordered, allRolls: { ...rolls } };
  }

  // ─── State Snapshot ───────────────────────────────────────────────────────
  getState() {
    return {
      players: this.players,
      currentPlayerIndex: this.currentPlayerIndex,
      currentPlayerId: this.currentPlayer.id,
      phase: this.phase,
      freeParkingPool: this.freeParkingPool,
      lastDice: this.lastDice,
      lastDoubles: this.lastDoubles,
      auctionData: this.auctionData,
      tradeData: this.tradeData,
      pendingCard: this.pendingCard,
      gameOver: this.gameOver,
      winner: this.winner,
      log: this.log.slice(-30),
      startingPhase: this.startingPhase,
      startingOrderRolls: { ...this.startingOrderRolls },
      tiedPlayers: this.tiedPlayers,
    };
  }

  // ─── Card Admin ───────────────────────────────────────────────────────────
  addCard(type, card) {
    if (type === 'chance') this.chanceCards.push(card);
    else this.communityCards.push(card);
    return { added: true, card };
  }

  removeCard(type, cardId) {
    if (type === 'chance') this.chanceCards = this.chanceCards.filter(c => c.id !== cardId);
    else this.communityCards = this.communityCards.filter(c => c.id !== cardId);
    return { removed: true, cardId };
  }

  updateCard(type, cardId, updates) {
    const arr = type === 'chance' ? this.chanceCards : this.communityCards;
    const idx = arr.findIndex(c => c.id === cardId);
    if (idx === -1) return { error: 'Card not found' };
    arr[idx] = { ...arr[idx], ...updates };
    return { updated: true, card: arr[idx] };
  }
}

module.exports = GameEngine;
