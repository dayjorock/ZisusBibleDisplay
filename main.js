const { app, BrowserWindow, screen, systemPreferences } = require('electron');

process.env.GOOGLE_API_KEY = 'LOmUkEHZbq-98XMzdHqx9';

let controllerWindow;
let displayWindow;

const GOOGLE_WEB_APP_BASE_URL = 'https://script.google.com/macros/s/AKfycbyDdykO1vcXWIBGajQoPzgk0_60XB8ThEYa6JJaOoI-p2BEKNfDnS4buWXYTS1Dnzxf/exec';

function launchSoftwareStudio() {
  const displays = screen.getAllDisplays();
  let mainDisplay = screen.getPrimaryDisplay();
  let projectorDisplay = displays.find(d => d.bounds.x !== 0 || d.bounds.y !== 0) || mainDisplay;

  controllerWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    x: mainDisplay.bounds.x + 50,
    y: mainDisplay.bounds.y + 50,
    title: "Zisus Bible Display - Controller Deck",
    backgroundColor: '#1a1a1a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      backgroundThrottling: false,
      webSecurity: false,
      allowRunningInsecureContent: true
    }
  });

  // Explicitly grant media permissions across all nested frames & origins
  controllerWindow.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    return true;
  });

  controllerWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    return callback(true);
  });

  controllerWindow.loadURL(`https://script.google.com/macros/s/AKfycbyDdykO1vcXWIBGajQoPzgk0_60XB8ThEYa6JJaOoI-p2BEKNfDnS4buWXYTS1Dnzxf/exec?view=controller`);

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
      backgroundThrottling: false,
      webSecurity: false
    }
  });

  displayWindow.loadURL(`https://script.google.com/macros/s/AKfycbyDdykO1vcXWIBGajQoPzgk0_60XB8ThEYa6JJaOoI-p2BEKNfDnS4buWXYTS1Dnzxf/exec?view=display`);

  controllerWindow.on('closed', () => { if (process.platform !== 'darwin') app.quit(); });
  displayWindow.on('closed', () => { displayWindow = null; });
}

// Bypasses browser UI permissions prompts completely
app.commandLine.appendSwitch('use-fake-ui-for-media-stream');
app.commandLine.appendSwitch('enable-speech-dispatcher');
app.commandLine.appendSwitch('unsafely-treat-insecure-origin-as-secure', GOOGLE_WEB_APP_BASE_URL);

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
