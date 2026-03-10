const fs = require('fs');
const buffer = fs.readFileSync('src/Copilot_NextSteps_EPS.jpg');
// Check for CMYK marker
const isCMYK = buffer.includes(Buffer.from('CMYK'));
console.log('Is CMYK:', isCMYK);
