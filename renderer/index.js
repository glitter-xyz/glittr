const confetti = require('canvas-confetti');
const { ipcRenderer } = require('electron');

const { css } = require('./tools/ui.js');

css('./base.css');

if (process.env.DEBUG_DAZZLE) {
  document.querySelector('html').setAttribute('debug', true);
}

const firework = (origin) => {
  const opts = {
    ticks: 60,
    gravity: 0.8,
    startVelocity: 22
  };

  confetti({
    particleCount: 10,
    spread: 140,
    origin,
    ...opts
  });

  confetti({
    particleCount: 20,
    spread: 360,
    origin,
    ...opts
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
