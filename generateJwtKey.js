const crypto = require('crypto');

const key = crypto.randomBytes(64).toString('hex');

console.log('Kunci JWT Anda yang baru adalah:');
console.log(key);
console.log('\nSalin kunci di atas dan tempelkan ke file .env Anda sebagai JWT_SECRET.');