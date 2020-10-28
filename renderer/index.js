const confetti = require('canvas-confetti');
const { ipcRenderer } = require('electron');

ipcRenderer.on('asynchronous-message', (ev, { command, x, y }) => {
  if (command !== 'draw') {
    return;
  }

  confetti({
    particleCount: 30,
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    origin: {
      x: x / window.innerWidth,
      y: y / window.innerHeight
    }
  });
});
