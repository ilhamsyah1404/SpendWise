// src/data/categories.js

const CATEGORIES = [
  { id:'makanan',    emoji:'🍜', label:'Makanan & Minum', color:'#ff6b6b', defaultBudget:600000,  tips:'Coba masak sendiri 3x seminggu, hemat hingga 40%' },
  { id:'transport',  emoji:'🚗', label:'Transport',       color:'#4ecdc4', defaultBudget:300000,  tips:'Gunakan transportasi umum atau sepeda untuk jarak dekat' },
  { id:'belanja',    emoji:'🛍️', label:'Belanja',         color:'#a29bfe', defaultBudget:400000,  tips:'Buat daftar belanja, hindari impulse buying' },
  { id:'hiburan',    emoji:'🎮', label:'Hiburan',         color:'#fd79a8', defaultBudget:200000,  tips:'Cari hiburan gratis: taman, library, event komunitas' },
  { id:'kesehatan',  emoji:'💊', label:'Kesehatan',       color:'#00e5a0', defaultBudget:200000,  tips:'Olahraga rutin adalah investasi kesehatan terbaik' },
  { id:'tagihan',    emoji:'📱', label:'Tagihan & Utilitas', color:'#fdcb6e', defaultBudget:350000, tips:'Review langganan tak terpakai dan batalkan' },
  { id:'pendidikan', emoji:'📚', label:'Pendidikan',      color:'#00b8d4', defaultBudget:200000,  tips:'Manfaatkan platform gratis: YouTube, Coursera, dll' },
  { id:'rumah',      emoji:'🏠', label:'Rumah & Furnitur',color:'#e17055', defaultBudget:300000,  tips:'Prioritaskan kebutuhan rumah yang urgent dahulu' },
  { id:'investasi',  emoji:'📈', label:'Investasi',       color:'#55efc4', defaultBudget:500000,  tips:'Investasi rutin setiap bulan, mulai dari yang kecil' },
  { id:'donasi',     emoji:'❤️', label:'Donasi & Sosial', color:'#ff7675', defaultBudget:100000,  tips:'Sisihkan minimal 2.5% dari penghasilan untuk berbagi' },
  { id:'lainnya',    emoji:'📦', label:'Lainnya',          color:'#b2bec3', defaultBudget:100000,  tips:'Kategorikan lebih spesifik untuk analisis yang lebih baik' },
];

const INCOME_SOURCES = [
  { id:'gaji',      emoji:'💼', label:'Gaji' },
  { id:'bisnis',    emoji:'🏪', label:'Bisnis' },
  { id:'bonus',     emoji:'🎁', label:'Bonus' },
  { id:'freelance', emoji:'💻', label:'Freelance' },
  { id:'investasi', emoji:'📈', label:'Hasil Investasi' },
  { id:'hadiah',    emoji:'🎀', label:'Hadiah' },
  { id:'lainnya',   emoji:'📦', label:'Lainnya' },
];

const PAYMENT_METHODS = [
  { id:'tunai',    emoji:'💵', label:'Tunai' },
  { id:'transfer', emoji:'🏦', label:'Transfer Bank' },
  { id:'gopay',    emoji:'🟢', label:'GoPay' },
  { id:'ovo',      emoji:'💜', label:'OVO' },
  { id:'dana',     emoji:'🔵', label:'Dana' },
  { id:'qris',     emoji:'📲', label:'QRIS' },
  { id:'cc',       emoji:'💳', label:'Kartu Kredit' },
  { id:'debit',    emoji:'💰', label:'Kartu Debit' },
  { id:'shopeepay',emoji:'🟠', label:'ShopeePay' },
];

function getCatById(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}
function getSrcById(id) {
  return INCOME_SOURCES.find(s => s.id === id) || INCOME_SOURCES[INCOME_SOURCES.length - 1];
}