const confetti = require('canvas-confetti');
const { ipcRenderer } = require('electron');

const { css } = require('./tools/ui.js');

css('./base.css');

if (process.env.DEBUG_DAZZLE) {
  document.querySelector('html').setAttribute('debug', true);
}

const COLORS = {
  christmas: [
    '#fffeed',
    '#39b555',
    '#d03b3b',
    '#901a1a',
    '#0f6536',
  ]
};

const firework = (origin, palette) => {
  const opts = {
    ticks: 60,
    gravity: 0.8,
    startVelocity: 22,
    colors: COLORS[palette],
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

ipcRenderer.on('asynchronous-message', (ev, { command, x, y, palette }) => {
  if (command !== 'draw') {
    return;
  }

  firework({
    x: x / window.innerWidth,
    y: y / window.innerHeight
  }, palette);
});
