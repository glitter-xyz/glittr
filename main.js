const path = require('path');
const url = require('url');
const iohook = require('iohook');

const { app, BrowserWindow, Menu, shell, screen, systemPreferences, Tray } = require('electron');
const { homepage } = require('./package.json');

// See:
// https://stackoverflow.com/questions/54763647/transparent-windows-on-linux-electron
// https://github.com/electron/electron/issues/7076
// https://github.com/electron/electron/issues/16809
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('enable-transparent-visuals');
}

require('./lib/app-id.js')(app);
const icon = require('./lib/icon.js')();
const log = require('./lib/log.js')('main');
const config = require('./lib/config.js');

log.info(`electron node version: ${process.version}`);

const WINDOWS = [];
const THEME = {
  get: () => config.getProp('theme.palette'),
  set: name => config.setProp('theme.palette', name)
};

// macOS Mojave light/dark mode changed
const setMacOSTheme = () => {
  if (!(systemPreferences.setAppLevelAppearance && systemPreferences.isDarkMode)) {
    log.info('this system does not support setting app-level appearance');
    return;
  }

  const mode = systemPreferences.isDarkMode() ? 'dark' : 'light';
  log.info(`setting app-level appearance to ${mode}`);
  systemPreferences.setAppLevelAppearance(mode);
};

if (systemPreferences.subscribeNotification) {
  systemPreferences.subscribeNotification('AppleInterfaceThemeChangedNotification', setMacOSTheme);
  setMacOSTheme();
}

function windowOptionsForDisplay(display) {
  if (process.platform === 'linux') {
    return display.workArea;
  }

  return {
    x: display.bounds.x + 1,
    y: display.bounds.y + 1
  };
}

(async () => {
  await Promise.all([
    app.whenReady(),
    config.read()
  ]);

  // see Linux notes above
  await new Promise(r => process.platform === 'linux' ? setTimeout(r, 1000) : r());

  const displays = screen.getAllDisplays().map(display => {
    const windowOptions = {
      darkTheme: true,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
        contextIsolation: false
      },
      icon: icon,
      frame: false,
      focusable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      transparent: true,
      ...windowOptionsForDisplay(display),
    };

    // Create the browser window.
    const window = new BrowserWindow(windowOptions);
    window.setIgnoreMouseEvents(true, { forward: true });
    window.maximize();

    window.loadURL(url.format({
      pathname: path.join(__dirname, 'public', 'index.html'),
      protocol: 'file:',
      slashes: true
    }));

    WINDOWS.push(window);

    return { display, window, bounds: display.bounds };
  });

  iohook.on('mouseclick', (data) => {
    if (data.button !== 1) {
      return;
    }

    const { x, y } = data;
    const dpiPoint = screen.screenToDipPoint ?
      screen.screenToDipPoint({ x, y }) :
      { x, y };

    log.info('CLICK', data, dpiPoint);

    const { display, window } = displays.filter(({ bounds }) => {
      return dpiPoint.x >= bounds.x && dpiPoint.x <= bounds.x + bounds.width &&
        dpiPoint.y >= bounds.y && dpiPoint.y <= bounds.y + bounds.height;
    })[0] || {};

    if (window) {
      window.webContents.send('asynchronous-message', {
        command: 'draw',
        x: (dpiPoint.x - display.bounds.x),
        y: (dpiPoint.y - display.bounds.y),
        palette: THEME.get()
      });
    }
  });

  iohook.start();

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
          ['default', undefined].includes(THEME.get()) :
          THEME.get() === name;

        return {
          label, checked,
          type: 'radio',
          click: () => void THEME.set(name)
        };
      })
    },
    { type: 'separator' },
    { role: 'reload' },
    { role: 'quit' }
  ]);
  tray.setToolTip(app.name);
  tray.setContextMenu(trayMenu);
  log.info('tray icon was set');
})().then(() => {
  log.info('application is running');
}).catch(err => {
  log.error('application has failed to start', err);
  process.exitCode = 1;
});

app.once('before-quit', () => {
  log.info('before-quit: cleanup starting');

  iohook.unload();

  for (const window of WINDOWS) {
    window.close();
  }

  log.info('before-quit: cleanup complete');
});
