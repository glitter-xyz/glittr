const path = require('path');
const url = require('url');
const EventEmitter = require('events');
const events = new EventEmitter();

const { app, BrowserWindow, screen, systemPreferences } = require('electron');

require('./lib/app-id.js')(app);
const icon = require('./lib/icon.js');
const log = require('./lib/log.js')('main');
const config = require('./lib/config.js');

log.info(`electron node version: ${process.version}`);

let mainWindow;
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
    // TODO open one window per monitor I think?
    const size = screen.getAllDisplays().reduce((size, display) => {
      size.x = Math.min(size.x, display.bounds.x);
      size.y = Math.min(size.y, display.bounds.y);
      size.width = Math.max(size.width, display.bounds.x + display.bounds.width);
      size.height = Math.max(size.height, display.bounds.y + display.bounds.height);

      return size;
    }, { x: 0, y: 0, width: 0, height: 0 });

    const windowOptions = {
      x: size.x,
      y: size.y,
      width: size.width,
      height: size.height,
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

    if (process.platform === 'darwin' && config.getProp('experiments.framelessWindow')) {
      windowOptions.titleBarStyle = 'hidden';
    }

    // Create the browser window.
    mainWindow = new BrowserWindow(windowOptions);

    mainWindow.setIgnoreMouseEvents(true);

    stayAlive = false;

    if (config.getProp('window.maximized')) {
      mainWindow.maximize();
    }

    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'public', 'index.html'),
      protocol: 'file:',
      slashes: true
    }));

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }).catch((err) => {
    throw err;
  });
}

// It's common to need to do some cleanup before closing, so if
// you do, do it here
app.once('before-quit', () => {
  log.info(`${app.getName()} is closing, cleaning up`);
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
