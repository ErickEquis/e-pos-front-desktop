const { autoUpdater } = require('electron-updater');
const { ipcMain } = require('electron');

class UpdaterManager {
    constructor(window) {
        this.mainWindow = window;

        // Configuración básica
        autoUpdater.autoDownload = true;
        autoUpdater.allowPrerelease = false;

        this.setupListeners();
    }

    setupListeners() {
        autoUpdater.on('checking-for-update', () => {
            console.log('[Updater] Comprobando actualizaciones...');
        });

        autoUpdater.on('update-available', (info) => {
            console.log('[Updater] Nueva versión disponible:', info.version);
            this.sendMessage('updater:available', info);
        });

        autoUpdater.on('download-progress', (progressObj) => {
            console.log(`[Updater] Descargando: ${progressObj.percent.toFixed(2)}%`);
            this.sendMessage('updater:progress', progressObj);
        });

        autoUpdater.on('update-downloaded', (info) => {
            console.log('[Updater] Descarga completa. Lista para instalar.');
            this.sendMessage('updater:ready', info);
        });

        autoUpdater.on('error', (err) => {
            console.error('[Updater] Error durante la actualización:', err);
            this.sendMessage('updater:error', err.message);
        });

        // Handlers de IPC para acciones del usuario (desde React)
        ipcMain.on('updater:checkNow', () => {
            autoUpdater.checkForUpdatesAndNotify();
        });

        ipcMain.on('updater:installNow', () => {
            console.log('[Updater] Ejecutando quitAndInstall...');
            autoUpdater.quitAndInstall();
        });
    }

    sendMessage(channel, data) {
        if (this.mainWindow) {
            this.mainWindow.webContents.send(channel, data);
        }
    }

    checkForUpdates() {
        autoUpdater.checkForUpdatesAndNotify();
    }
}

module.exports = UpdaterManager;
