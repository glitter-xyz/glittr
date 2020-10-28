const confetti = require('canvas-confetti');
const { ipcRenderer } = require('electron');

const { css } = require('./tools/ui.js');

css('./base.css');

if (process.env.DEBUG_DAZZLE) {
  document.querySelector('html').setAttribute('debug', true);
}

ipcRenderer.on('asynchronous-message', (ev, { command, x, y }) => {
  if (command !== 'draw') {
    return;
  }

  confetti({
    particleCount: 30,
    startVelocity: 25,
    spread: 360,
    ticks: 60,
    origin: {
      x: x / window.innerWidth,
      y: y / window.innerHeight
    }
  });
});
