const confetti = require('canvas-confetti');
const { ipcRenderer } = require('electron');

const { css } = require('./tools/ui.js');

css('./base.css');

if (process.env.DEBUG_DAZZLE) {
  document.querySelector('html').setAttribute('debug', true);
}

const firework = (origin) => {
  confetti({
    particleCount: 10,
    startVelocity: 25,
    spread: 140,
    ticks: 60,
    origin
  });

  confetti({
    particleCount: 20,
    startVelocity: 25,
    spread: 360,
    ticks: 60,
    origin
  });
};

ipcRenderer.on('asynchronous-message', (ev, { command, x, y }) => {
  if (command !== 'draw') {
    return;
  }

  firework({
    x: x / window.innerWidth,
    y: y / window.innerHeight
  });
});
