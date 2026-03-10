const fs = require('fs');
const buffer = fs.readFileSync('src/Copilot_NextSteps_EPS.jpg');
let i = 2; // Skip FFD8
while (i < buffer.length) {
  if (buffer[i] === 0xFF) {
    const marker = buffer[i+1];
    const len = (buffer[i+2] << 8) | buffer[i+3];
    if (marker === 0xC0 || marker === 0xC2) { // SOF0 or SOF2
      console.log('SOF marker:', marker.toString(16));
      console.log('Components:', buffer[i+9]);
      break;
    }
    i += len + 2;
  } else {
    i++;
  }
}
