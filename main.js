const { app, BrowserWindow, screen, ipcMain, systemPreferences } = require('electron');
const path = require('path');

let controllerWindow;
let displayWindow;

function launchSoftwareStudio() {
  const displays = screen.getAllDisplays();
  let mainDisplay = screen.getPrimaryDisplay();
  let projectorDisplay = displays.find(d => d.bounds.x !== 0 || d.bounds.y !== 0) || mainDisplay;

  // 1. Controller Deck Window
  controllerWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    x: mainDisplay.bounds.x + 50,
    y: mainDisplay.bounds.y + 50,
    title: "Zisus Bible Display - Controller Deck",
    backgroundColor: '#1a1a1a',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  controllerWindow.loadFile(path.join(__dirname, 'index.html'));

  // 2. Projector Display Window
  displayWindow = new BrowserWindow({
    x: projectorDisplay.bounds.x,
    y: projectorDisplay.bounds.y,
    width: projectorDisplay.bounds.width,
    height: projectorDisplay.bounds.height,
    fullscreen: true,
    frame: false,
    alwaysOnTop: false,
    title: "Zisus Bible Display - Live Broadcast Canvas",
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  displayWindow.loadFile(path.join(__dirname, 'display.html'));

  controllerWindow.on('closed', () => { if (process.platform !== 'darwin') app.quit(); });
  displayWindow.on('closed', () => { displayWindow = null; });
}

// System Hardware Permission Overrides
app.commandLine.appendSwitch('use-fake-ui-for-media-stream');

// Local IPC Bridge (Controller <-> Display sync)
ipcMain.on('update-live-feed', (event, data) => {
  if (displayWindow) {
    displayWindow.webContents.send('render-live-feed', data);
  }
});

ipcMain.on('update-layout-mode', (event, mode) => {
  if (displayWindow) {
    displayWindow.webContents.send('apply-layout-mode', mode);
  }
});

app.whenReady().then(async () => {
  if (process.platform === 'win32' || process.platform === 'darwin') {
    try {
      await systemPreferences.askForMediaAccess('microphone');
    } catch (e) {}
  }
  setTimeout(launchSoftwareStudio, 1000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
