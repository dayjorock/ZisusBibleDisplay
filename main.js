const { app, BrowserWindow, screen, ipcMain, systemPreferences } = require('electron');
const path = require('path');
const fs = require('fs');

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

  // Auto-approve media/microphone permissions
  controllerWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      return callback(true);
    }
    callback(false);
  });

  controllerWindow.loadFile(path.join(__dirname, 'index.html'));

  // 2. Projector Display Window
  createDisplayWindow(projectorDisplay);

  controllerWindow.on('closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}

function createDisplayWindow(targetDisplay) {
  if (displayWindow && !displayWindow.isDestroyed()) {
    displayWindow.focus();
    return;
  }

  const displays = screen.getAllDisplays();
  const mainDisplay = screen.getPrimaryDisplay();
  const projector = targetDisplay || displays.find(d => d.bounds.x !== 0 || d.bounds.y !== 0) || mainDisplay;

  displayWindow = new BrowserWindow({
    x: projector.bounds.x,
    y: projector.bounds.y,
    width: projector.bounds.width,
    height: projector.bounds.height,
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

  displayWindow.on('closed', () => { displayWindow = null; });
}

// Hardware & Permission Overrides
app.commandLine.appendSwitch('use-fake-ui-for-media-stream');

// IPC Bridge for Loading Bible JSON
ipcMain.handle('get-bible-data', async () => {
  try {
    const jsonPath = path.join(__dirname, 'bible-kjv_2.json');
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error("Error reading bible-kjv_2.json:", error);
    return [];
  }
});

// Local IPC Bridge (Controller <-> Display sync)
ipcMain.on('update-live-feed', (event, data) => {
  if (displayWindow && !displayWindow.isDestroyed()) {
    displayWindow.webContents.send('render-live-feed', data);
  }
});

ipcMain.on('update-layout-mode', (event, mode) => {
  if (displayWindow && !displayWindow.isDestroyed()) {
    displayWindow.webContents.send('apply-layout-mode', mode);
  }
});

// IPC Bridge for Background Picture Updating
ipcMain.on('update-background-image', (event, imageUrl) => {
  if (displayWindow && !displayWindow.isDestroyed()) {
    displayWindow.webContents.send('set-background-image', imageUrl);
  }
});

// IPC Bridge for Display Window Management
ipcMain.on('open-display-window', () => {
  createDisplayWindow();
});

ipcMain.on('close-display-window', () => {
  if (displayWindow && !displayWindow.isDestroyed()) {
    displayWindow.close();
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
