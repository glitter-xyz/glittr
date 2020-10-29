const path = require('path');
const url = require('url');
const EventEmitter = require('events');
const events = new EventEmitter();
const iohook = require('iohook');

const { app, BrowserWindow, screen, systemPreferences } = require('electron');

require('./lib/app-id.js')(app);
const icon = require('./lib/icon.js');
const log = require('./lib/log.js')('main');
const config = require('./lib/config.js');

log.info(`electron node version: ${process.version}`);

const WINDOWS = [];
let stayAlive;

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

    stayAlive = false;
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

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform === 'darwin' || stayAlive) {
    events.removeAllListeners();
  } else {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
