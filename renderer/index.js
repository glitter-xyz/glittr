const confetti = require('canvas-confetti');
const { ipcRenderer } = require('electron');

const { css } = require('./tools/ui.js');

css('./base.css');

if (process.env.DEBUG_DAZZLE) {
  document.querySelector('html').setAttribute('debug', true);
}

const COLORS = {
  christmas: [
    '#285b52',
    '#39b555',
    '#759a46',
    '#f2f3f8',
    '#c5180f',
    '#850b0c',
  ],
  halloween: [
    '#151818',
    '#313131',
    '#f28f1c',
    '#6e3a9e',
    '#52ac00',
  ],
  autumn: [
    '#810806',
    '#bf200e',
    '#fa4113',
    '#fe9b13',
    '#f9c10e',
    '#5c1009',
  ],
  winter: [
    '#172540',
    '#4177a1',
    '#97b7d8',
    '#fecd7d',
    '#b97637',
    '#c4e2e7',
    '#e9e5df',
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
