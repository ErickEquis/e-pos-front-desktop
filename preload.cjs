const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getBackendPort: () => ipcRenderer.invoke('get-backend-port'),
    updater: {
        checkNow: () => ipcRenderer.send('updater:checkNow'),
        installNow: () => ipcRenderer.send('updater:installNow'),
        onStatus: (callback) => {
            const channels = ['updater:available', 'updater:progress', 'updater:ready', 'updater:error'];
            channels.forEach(channel => {
                ipcRenderer.on(channel, (event, data) => callback(channel, data));
            });
        },
        getAppVersion: () => ipcRenderer.invoke('get-app-version')
    }
});


