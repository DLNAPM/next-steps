const fs = require('fs');
const buffer = fs.readFileSync('src/Copilot_NextSteps_EPS.jpg');
console.log(buffer.slice(0, 50).toString('hex'));
console.log(buffer.slice(0, 50).toString('ascii'));
