const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // Enable media playback
      webSecurity: true
    },
    title: 'AI Media Editor - Phase 2'
  });

  // Load the React app
  mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle file dialog request from renderer
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Media Files', extensions: ['mp4', 'webm', 'mkv', 'avi', 'mov', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'mp3', 'wav', 'ogg', 'aac', 'm4a'] },
      { name: 'Videos', extensions: ['mp4', 'webm', 'mkv', 'avi', 'mov'] },
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'] },
      { name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'aac', 'm4a'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return result;
});
