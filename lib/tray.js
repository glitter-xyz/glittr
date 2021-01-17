const { app, Menu, shell, Tray } = require('electron');
const { homepage } = require('../package.json');
const icon = require('./icon.js')();
const log = require('./log.js')('tray');

module.exports = ({ theme }) => {
  const tray = new Tray(icon);
  const trayMenu = Menu.buildFromTemplate([
    {
      label: 'About',
      click: () => {
        shell.openExternal(homepage);
      }
    },
    {
      label: 'Theme',
      type: 'submenu',
      submenu: ['Default', 'Autumn', 'Halloween', 'Winter', 'Christmas'].map(label => {
        const name = label.toLowerCase().replace(/ /g, '-');
        const checked = name === 'default' ?
          ['default', undefined].includes(theme.get()) :
          theme.get() === name;

        return {
          label, checked,
          type: 'radio',
          click: () => void theme.set(name)
        };
      })
    },
    { type: 'separator' },
    { role: 'reload' },
    { role: 'quit' }
  ]);
  tray.setToolTip(app.name);
  tray.setContextMenu(trayMenu);
  log.info('tray was created');

  return () => {
    log.info('destroying tray');
    tray.destroy();
  };
};
