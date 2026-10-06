const { app, BrowserWindow, dialog, ipcMain, session } = require('electron');
const fs = require('node:fs/promises');
const syncFs = require('node:fs');
const path = require('node:path');

app.setName('实验记录本');
app.disableHardwareAcceleration();

const explicitUserData = process.env.ENOTE_USER_DATA || process.env.TODO_LOCAL_USER_DATA;
const oldUserDataPath = path.join(app.getPath('appData'), 'Todo清单本地版');
const userDataPath = explicitUserData || path.join(app.getPath('appData'), '实验记录本');

if (!explicitUserData && !syncFs.existsSync(userDataPath) && syncFs.existsSync(oldUserDataPath)) {
  try {
    syncFs.cpSync(oldUserDataPath, userDataPath, { recursive: true });
  } catch (error) {
    console.warn('旧版数据迁移未完成，将使用新的本地数据目录。', error);
  }
}

app.setPath('userData', userDataPath);

if (process.platform === 'win32') {
  app.setAppUserModelId('cn.local.enote');
}

const gotSingleInstanceLock = explicitUserData ? true : app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) app.quit();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 920,
    minHeight: 620,
    show: Boolean(explicitUserData),
    title: '实验记录本',
    icon: path.join(__dirname, 'assets', 'enote.png'),
    backgroundColor: '#f4f6f4',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  mainWindow.removeMenu();
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) event.preventDefault();
  });
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    callback({ cancel: /^https?:/i.test(details.url) });
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('second-instance', () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('backup:save', async (_event, content) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: '导出本地备份',
    defaultPath: `实验记录本备份-${new Date().toISOString().slice(0, 10)}.json`,
    filters: [{ name: '实验记录本备份', extensions: ['json'] }],
  });
  if (result.canceled || !result.filePath) return { canceled: true };
  await fs.writeFile(result.filePath, content, 'utf8');
  return { canceled: false, filePath: result.filePath };
});

ipcMain.handle('backup:open', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '导入本地备份',
    properties: ['openFile'],
    filters: [{ name: '实验记录本备份', extensions: ['json'] }],
  });
  if (result.canceled || result.filePaths.length === 0) return { canceled: true };
  const filePath = result.filePaths[0];
  const content = await fs.readFile(filePath, 'utf8');
  return { canceled: false, filePath, content };
});
