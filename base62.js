// base62.js
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const BASE = ALPHABET.length;

function encode(num) {
  if (num === 0) return ALPHABET[0];
  let s = '';
  let n = Number(num);
  while (n > 0) {
    s = ALPHABET[n % BASE] + s;
    n = Math.floor(n / BASE);
  }
  return s;
}

function decode(str) {
  let n = 0;
  for (let i = 0; i < str.length; i++) {
    const val = ALPHABET.indexOf(str[i]);
    if (val === -1) throw new Error('Invalid character');
    n = n * BASE + val;
  }
  return n;
}

module.exports = { encode, decode };
