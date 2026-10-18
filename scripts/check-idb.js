const fs = require('fs');
const content = fs.readFileSync('portfolio-data.json', 'utf8');
const regex = /idb:\/\/[^\s",]+/g;
const matches = content.match(regex);
console.log('IDB matches in portfolio-data.json:', matches);
