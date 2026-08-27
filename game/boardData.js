// boardData.js - Baku Monopoly Board Configuration (40 squares)
module.exports = [
  // Square 0 - GO
  { id: 0, type: 'go', name: 'Başlanğıc', nameEn: 'GO', bonus: 200 },

  // Brown Group
  { id: 1, type: 'property', name: 'Zabrat', nameEn: 'Zabrat', color: 'brown', price: 60, rent: [2,10,30,90,160,250], houseCost: 50, mortgage: 30, icon: '🏭', description: 'Neft qüllələri' },
  { id: 2, type: 'community', name: 'Xəzinə', nameEn: 'Community Chest' },
  { id: 3, type: 'property', name: 'Balaxanı', nameEn: 'Balaxani', color: 'brown', price: 80, rent: [4,20,60,180,320,450], houseCost: 50, mortgage: 40, icon: '🏭', description: 'Mədən sahəsi' },
  { id: 4, type: 'tax', name: 'Gəlir Vergisi', nameEn: 'Income Tax', amount: 200 },

  // Transport 1
  { id: 5, type: 'transport', name: 'Hava Limanı', nameEn: 'Airport', price: 200, rent: [25,50,100,200], mortgage: 100, icon: '✈️' },

  // Light Blue Group
  { id: 6, type: 'property', name: 'Binəqədi', nameEn: 'Binagadi', color: 'lightblue', price: 100, rent: [6,30,90,270,400,550], houseCost: 50, mortgage: 50, icon: '🕌', description: 'Biləcəri məscidi' },
  { id: 7, type: 'chance', name: 'Şans', nameEn: 'Chance' },
  { id: 8, type: 'property', name: 'Suraxanı', nameEn: 'Surakhani', color: 'lightblue', price: 100, rent: [6,30,90,270,400,550], houseCost: 50, mortgage: 50, icon: '🔥', description: 'Atəşgah məbədi' },
  { id: 9, type: 'property', name: 'Maştağa', nameEn: 'Mashtaga', color: 'lightblue', price: 120, rent: [8,40,100,300,450,600], houseCost: 50, mortgage: 60, icon: '🏘️', description: 'Qədim kənd' },

  // Jail / Just Visiting
  { id: 10, type: 'jail', name: 'Həbs / Sadəcə Baxış', nameEn: 'Jail / Just Visiting' },

  // Pink Group
  { id: 11, type: 'property', name: 'Sabunçu', nameEn: 'Sabunchu', color: 'pink', price: 140, rent: [10,50,150,450,625,750], houseCost: 100, mortgage: 70, icon: '🏗️', description: 'Sənaye rayonu' },
  { id: 12, type: 'utility', name: 'Elektrik Şirkəti', nameEn: 'Electric Company', price: 150, mortgage: 75, icon: '⚡' },
  { id: 13, type: 'property', name: 'Lökbatan', nameEn: 'Lokbatan', color: 'pink', price: 140, rent: [10,50,150,450,625,750], houseCost: 100, mortgage: 70, icon: '🌋', description: 'Palçıq vulkanı' },
  { id: 14, type: 'property', name: 'Ramana', nameEn: 'Ramana', color: 'pink', price: 160, rent: [12,60,180,500,700,900], houseCost: 100, mortgage: 80, icon: '🏰', description: 'Ramana qalası' },

  // Transport 2
  { id: 15, type: 'transport', name: 'Dəmiryolu', nameEn: 'Railway Station', price: 200, rent: [25,50,100,200], mortgage: 100, icon: '🚂' },

  // Orange Group
  { id: 16, type: 'property', name: 'Nardaran', nameEn: 'Nardaran', color: 'orange', price: 180, rent: [14,70,200,550,750,950], houseCost: 100, mortgage: 90, icon: '🏰', description: 'Nardaran qalası' },
  { id: 17, type: 'community', name: 'Xəzinə', nameEn: 'Community Chest' },
  { id: 18, type: 'property', name: 'Novxanı', nameEn: 'Novkhani', color: 'orange', price: 180, rent: [14,70,200,550,750,950], houseCost: 100, mortgage: 90, icon: '🌿', description: 'Novxanı bağları' },
  { id: 19, type: 'property', name: 'Bilgəh', nameEn: 'Bilgah', color: 'orange', price: 200, rent: [16,80,220,600,800,1000], houseCost: 100, mortgage: 100, icon: '🏖️', description: 'Bilgəh çimərliyi' },

  // Free Parking
  { id: 20, type: 'freeparking', name: 'Pulsuz Park', nameEn: 'Free Parking' },

  // Red Group
  { id: 21, type: 'property', name: 'Buzovna', nameEn: 'Buzovna', color: 'red', price: 220, rent: [18,90,250,700,875,1050], houseCost: 150, mortgage: 110, icon: '🏖️', description: 'Buzovna çimərliyi' },
  { id: 22, type: 'chance', name: 'Şans', nameEn: 'Chance' },
  { id: 23, type: 'property', name: 'Novbəgün', nameEn: 'Novbagun', color: 'red', price: 220, rent: [18,90,250,700,875,1050], houseCost: 150, mortgage: 110, icon: '🌲', description: 'Meşəlik ərazi' },
  { id: 24, type: 'property', name: 'Balacadir', nameEn: 'Balacadir', color: 'red', price: 240, rent: [20,100,300,750,925,1100], houseCost: 150, mortgage: 120, icon: '🌾', description: 'Kənd mənzərəsi' },

  // Transport 3
  { id: 25, type: 'transport', name: 'Avtovağzal', nameEn: 'Bus Terminal', price: 200, rent: [25,50,100,200], mortgage: 100, icon: '🚌' },

  // Yellow Group
  { id: 26, type: 'property', name: 'Xətai', nameEn: 'Khatai', color: 'yellow', price: 260, rent: [22,110,330,800,975,1150], houseCost: 150, mortgage: 130, icon: '🏛️', description: 'H.Əliyev Mərkəzi' },
  { id: 27, type: 'property', name: 'Binə', nameEn: 'Bina', color: 'yellow', price: 260, rent: [22,110,330,800,975,1150], houseCost: 150, mortgage: 130, icon: '✈️', description: 'Hava limanı ətrafı' },
  { id: 28, type: 'utility', name: 'Su Şirkəti', nameEn: 'Water Works', price: 150, mortgage: 75, icon: '💧' },
  { id: 29, type: 'property', name: 'Nərimanov', nameEn: 'Narimanov', color: 'yellow', price: 280, rent: [24,120,360,850,1025,1200], houseCost: 150, mortgage: 140, icon: '🏟️', description: 'Avropa Oyunları' },

  // Go To Jail
  { id: 30, type: 'gotojail', name: 'Həbsə Get', nameEn: 'Go To Jail' },

  // Green Group
  { id: 31, type: 'property', name: 'Nizami', nameEn: 'Nizami', color: 'green', price: 300, rent: [26,130,390,900,1100,1275], houseCost: 200, mortgage: 150, icon: '🛍️', description: 'Nizami küçəsi' },
  { id: 32, type: 'property', name: 'Yasamal', nameEn: 'Yasamal', color: 'green', price: 300, rent: [26,130,390,900,1100,1275], houseCost: 200, mortgage: 150, icon: '🏙️', description: 'Yaşıl məhəllə' },
  { id: 33, type: 'community', name: 'Xəzinə', nameEn: 'Community Chest' },
  { id: 34, type: 'property', name: 'Nəsimi', nameEn: 'Nasimi', color: 'green', price: 320, rent: [28,150,450,1000,1200,1400], houseCost: 200, mortgage: 160, icon: '🕌', description: 'Şəhər mərkəzi' },

  // Transport 4
  { id: 35, type: 'transport', name: 'Dəniz Limanı', nameEn: 'Sea Port', price: 200, rent: [25,50,100,200], mortgage: 100, icon: '🚢' },

  // Dark Blue Group
  { id: 36, type: 'chance', name: 'Şans', nameEn: 'Chance' },
  { id: 37, type: 'property', name: 'Şirvan', nameEn: 'Shirvan', color: 'darkblue', price: 350, rent: [35,175,500,1100,1300,1500], houseCost: 200, mortgage: 175, icon: '🏰', description: 'Şirvanşahlar sarayı' },
  { id: 38, type: 'tax', name: 'Əmlak Vergisi', nameEn: 'Luxury Tax', amount: 100 },
  { id: 39, type: 'property', name: 'İçərişəhər', nameEn: 'Icherisheher', color: 'darkblue', price: 400, rent: [50,200,600,1400,1700,2000], houseCost: 200, mortgage: 200, icon: '🗼', description: 'Qız Qalası' },
];
