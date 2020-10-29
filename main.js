const path = require('path');
const url = require('url');
const iohook = require('iohook');

const { app, BrowserWindow, screen, systemPreferences } = require('electron');

require('./lib/app-id.js')(app);
const icon = require('./lib/icon.js');
const log = require('./lib/log.js')('main');
const config = require('./lib/config.js');

log.info(`electron node version: ${process.version}`);

const WINDOWS = [];

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

function createWindow () {
  Promise.all([
    config.read()
  ]).then(() => {
    const displays = screen.getAllDisplays().map(display => {
      const windowOptions = {
        x: display.bounds.x + 1,
        y: display.bounds.y + 1,
        darkTheme: true,
        webPreferences: {
          nodeIntegration: true,
          nodeIntegrationInWorker: true,
          webviewTag: true,
          enableRemoteModule: true
        },
        icon: icon(),
        frame: false,
        focusable: false,
        skipTaskbar: true,
        alwaysOnTop: true,
        transparent: true
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

      console.log('CLICK', data, dpiPoint);

      const { display, window } = displays.filter(({ bounds }) => {
        return dpiPoint.x >= bounds.x && dpiPoint.x <= bounds.x + bounds.width &&
          dpiPoint.y >= bounds.y && dpiPoint.y <= bounds.y + bounds.height;
      })[0] || {};

      if (window) {
        window.webContents.send('asynchronous-message', {
          command: 'draw',
          x: (dpiPoint.x - display.bounds.x),
          y: (dpiPoint.y - display.bounds.y)
        });
      }
    });

    iohook.start();
  }).catch((err) => {
    throw err;
  });
}

app.once('before-quit', () => {
  log.info('before-quit: cleanup starting');

  iohook.unload();

  for (const window of WINDOWS) {
    window.close();
  }

  log.info('before-quit: cleanup complete');
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);
