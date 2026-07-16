const {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  nativeImage,
  Notification,
  powerMonitor,
  screen,
  Tray
} = require('electron');
const fs = require('fs');
const path = require('path');

const {
  defaultSettings,
  focusDurations,
  getScaleConfig,
  normalizeSettings,
  validatePosition
} = require('./settings-schema');

const IDLE_SECONDS = 5 * 60;

let win = null;
let tray = null;
let settings = defaultSettings;
let settingsPath = null;
let idleMonitor = null;
let wasSystemIdle = false;

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
}

function getSettingsPath() {
  if (!settingsPath) {
    settingsPath = path.join(app.getPath('userData'), 'settings.json');
  }
  return settingsPath;
}

function loadSettings() {
  try {
    const raw = fs.readFileSync(getSettingsPath(), 'utf8');
    settings = normalizeSettings(JSON.parse(raw));
  } catch {
    settings = normalizeSettings();
  }
  return settings;
}

function saveSettings() {
  fs.mkdirSync(path.dirname(getSettingsPath()), { recursive: true });
  fs.writeFileSync(getSettingsPath(), `${JSON.stringify(settings, null, 2)}\n`);
}

function getWindowSize() {
  return getScaleConfig(settings.scale).window;
}

function getFallbackPosition(windowSize) {
  const { workArea } = screen.getPrimaryDisplay();
  return {
    x: Math.max(workArea.x, workArea.x + workArea.width - windowSize.width - 32),
    y: Math.max(workArea.y, workArea.y + workArea.height - windowSize.height - 32)
  };
}

function clampPosition(position, windowSize = getWindowSize()) {
  const display = position
    ? screen.getDisplayNearestPoint({ x: position.x, y: position.y })
    : screen.getPrimaryDisplay();
  return validatePosition(position, display.workArea, windowSize);
}

function getInitialBounds() {
  const windowSize = getWindowSize();
  const savedPosition = clampPosition(settings.windowPosition, windowSize);
  const position = savedPosition || getFallbackPosition(windowSize);
  return { ...windowSize, ...position };
}

function persistWindowPosition() {
  if (!win || win.isDestroyed()) return;
  const bounds = win.getBounds();
  settings = normalizeSettings({
    ...settings,
    windowPosition: { x: bounds.x, y: bounds.y }
  });
  saveSettings();
}

function applyLaunchAtLogin() {
  app.setLoginItemSettings({
    openAtLogin: settings.launchAtLogin,
    openAsHidden: true
  });
}

function sendToRenderer(channel, payload) {
  if (!win || win.isDestroyed()) return;
  win.webContents.send(channel, payload);
}

function applySettingsToWindow() {
  if (!win || win.isDestroyed()) return;
  const size = getWindowSize();
  win.setAlwaysOnTop(settings.alwaysOnTop, settings.alwaysOnTop ? 'floating' : 'normal');
  win.setSize(size.width, size.height, false);

  const bounds = win.getBounds();
  const position = clampPosition({ x: bounds.x, y: bounds.y }, size) || getFallbackPosition(size);
  win.setPosition(position.x, position.y, false);
  settings = normalizeSettings({ ...settings, windowPosition: position });
  saveSettings();
  sendToRenderer('settings-changed', settings);
}

function updateSettings(patch) {
  settings = normalizeSettings({ ...settings, ...patch });
  applyLaunchAtLogin();
  applySettingsToWindow();
  buildTrayMenu();
  return settings;
}

function resetPosition() {
  const size = getWindowSize();
  const position = getFallbackPosition(size);
  if (win && !win.isDestroyed()) {
    win.setPosition(position.x, position.y, false);
  }
  settings = normalizeSettings({ ...settings, windowPosition: position });
  saveSettings();
  sendToRenderer('settings-changed', settings);
  return settings;
}

function createWindow() {
  const bounds = getInitialBounds();
  win = new BrowserWindow({
    ...bounds,
    transparent: true,
    frame: false,
    resizable: false,
    alwaysOnTop: settings.alwaysOnTop,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.setAlwaysOnTop(settings.alwaysOnTop, settings.alwaysOnTop ? 'floating' : 'normal');
  win.loadFile(path.join(__dirname, 'index.html'));

  win.once('ready-to-show', () => {
    win.showInactive();
    sendToRenderer('settings-changed', settings);
  });
  win.on('moved', persistWindowPosition);
  win.on('closed', () => {
    win = null;
  });
}

function showWindow() {
  if (!win || win.isDestroyed()) createWindow();
  win?.showInactive();
}

function toggleWindowVisibility() {
  if (!win || win.isDestroyed()) {
    createWindow();
    return;
  }
  if (win.isVisible()) win.hide();
  else win.showInactive();
  buildTrayMenu();
}

function createTrayImage() {
  const spritePath = path.join(__dirname, '..', 'assets', 'spritesheet.webp');
  const image = nativeImage.createFromPath(spritePath);
  return image.isEmpty() ? nativeImage.createEmpty() : image.resize({ width: 18, height: 18 });
}

function buildFocusSubmenu() {
  return focusDurations.map((minutes) => ({
    label: `${minutes} minutes`,
    click: () => sendToRenderer('focus-start', minutes)
  }));
}

function buildCommonMenuItems() {
  return [
    { label: 'Wave', click: () => sendToRenderer('pet-action', 'waving') },
    { label: 'Jump', click: () => sendToRenderer('pet-action', 'jumping') },
    { label: 'Work', click: () => sendToRenderer('pet-action', 'work') },
    { label: 'Review', click: () => sendToRenderer('pet-action', 'review') },
    { label: 'Rest', click: () => sendToRenderer('pet-action', 'rest') },
    { label: 'Sleep', click: () => sendToRenderer('pet-action', 'sleep') },
    { label: 'Celebrate', click: () => sendToRenderer('pet-action', 'celebrate') },
    { label: 'Focus Timer', submenu: buildFocusSubmenu() },
    { label: 'Cancel Focus Timer', click: () => sendToRenderer('focus-cancel') },
    { type: 'separator' },
    { label: 'Settings', click: () => sendToRenderer('toggle-settings') },
    { label: 'Reset position', click: resetPosition }
  ];
}

function buildTrayMenu() {
  if (!tray) return;
  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: win?.isVisible() ? 'Hide Nigar Kiz' : 'Show Nigar Kiz',
      click: toggleWindowVisibility
    },
    ...buildCommonMenuItems(),
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]));
}

function createTray() {
  tray = new Tray(createTrayImage());
  tray.setToolTip('Nigar Kiz');
  tray.on('click', toggleWindowVisibility);
  buildTrayMenu();
}

function showContextMenu() {
  const menu = Menu.buildFromTemplate([
    ...buildCommonMenuItems(),
    { type: 'separator' },
    { label: 'Quit Nigar Kiz', click: () => app.quit() }
  ]);
  menu.popup({ window: win });
}

function moveWindowBy(delta) {
  if (!win || win.isDestroyed()) return;
  const bounds = win.getBounds();
  const nextPosition = clampPosition({
    x: bounds.x + delta.x,
    y: bounds.y + delta.y
  }, { width: bounds.width, height: bounds.height });

  if (!nextPosition) return;
  win.setPosition(nextPosition.x, nextPosition.y, false);
}

function startIdleMonitor() {
  clearInterval(idleMonitor);
  idleMonitor = setInterval(() => {
    const isIdle = powerMonitor.getSystemIdleTime() >= IDLE_SECONDS;
    if (isIdle === wasSystemIdle) return;
    wasSystemIdle = isIdle;
    sendToRenderer('system-idle-changed', isIdle);
  }, 15_000);
}

ipcMain.on('show-context-menu', showContextMenu);
ipcMain.on('move-window', (_event, delta) => moveWindowBy(delta));
ipcMain.handle('settings:get', () => settings);
ipcMain.handle('settings:update', (_event, patch) => updateSettings(patch));
ipcMain.handle('settings:reset-position', () => resetPosition());
ipcMain.handle('settings:show', () => {
  showWindow();
  sendToRenderer('toggle-settings');
});
ipcMain.handle('focus:complete', (_event, minutes) => {
  if (Notification.isSupported()) {
    new Notification({
      title: 'Nigar Kiz',
      body: `${minutes} minute focus session complete.`
    }).show();
  }
});
ipcMain.handle('focus:cancel', () => sendToRenderer('focus-cancel'));

app.on('second-instance', () => {
  showWindow();
  sendToRenderer('toggle-settings');
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  loadSettings();
  applyLaunchAtLogin();
  createWindow();
  createTray();
  startIdleMonitor();
  app.on('activate', showWindow);
});

app.on('before-quit', persistWindowPosition);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
