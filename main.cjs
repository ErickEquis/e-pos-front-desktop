const { app, BrowserWindow, ipcMain, utilityProcess } = require('electron');
const path = require('path');
const fs = require('fs');
const { fork, spawn } = require('child_process');
const UpdaterManager = require(path.join(__dirname, 'updater.cjs'));
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let backendProcess;
let backendPort = null;
let mainWindowReady = false;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs')
        }
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:8080');
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    }

    // Abrir la consola de desarrollo (DevTools) para depurar la app empaquetada
    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function startBackend() {
    let apiPath;
    if (isDev) {
        // En entorno dev el backend está en la carpeta de al lado
        apiPath = path.resolve(__dirname, '..', 'e-pos-api-desktop');
    } else {
        // En producción el backend se empaquetó en .unpacked para poder ejecutar librerías C/C++ nativas (sqlite)
        apiPath = path.join(__dirname, '..', 'app.asar.unpacked', 'desktop-api');
    }
    const scriptPath = path.join(apiPath, 'app.js');

    // Handle SQLite DB
    const userDataPath = app.getPath('userData');
    const dbDestPath = path.join(userDataPath, 'epos_local.sqlite');

    if (!isDev) {
        const dbSourcePath = path.join(apiPath, 'epos_local.sqlite');
        // If the database has never been initialized in userData, copy the pre-seeded one
        if (fs.existsSync(dbSourcePath) && !fs.existsSync(dbDestPath)) {
            try {
                fs.copyFileSync(dbSourcePath, dbDestPath);
                console.log('[Electron] Initialized hydrated SQLite DB in userData:', dbDestPath);
            } catch (e) {
                console.error('[Electron] Failed to copy initial DB:', e);
            }
        }
    }

    const env = {
        ...process.env,
        NODE_ENV: 'desktop',
        PORT: '0'
    };

    if (!isDev) {
        env.SQLITE_DB_PATH = dbDestPath;
    }

    // Utilizamos child_process.fork clásico ya que desktop-api está en app.asar.unpacked
    backendProcess = fork(scriptPath, [], {
        cwd: apiPath,
        env: env,
        stdio: 'pipe',
        execPath: process.execPath
    });

    if (backendProcess.stdout) {
        backendProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(`Backend: ${output}`);

            // Capturamos el puerto emitido por app.js
            const match = output.match(/__APP_PORT__=(\d+)/);
            if (match && match[1]) {
                backendPort = match[1];
                console.log(`[Electron] Puerto IPC capturado desde Worker: ${backendPort}`);
            }
        });
    }

    if (backendProcess.stderr) {
        backendProcess.stderr.on('data', (data) => {
            console.error(`Backend Error CMD: ${data.toString()}`);
        });
    }
}

// Handlers de IPC
ipcMain.handle('get-backend-port', async () => {
    // Si el puerto aún no está listo, hacemos comprobaciones hasta que esté disponible
    return new Promise((resolve) => {
        if (backendPort) {
            resolve(backendPort);
        } else {
            const checkInterval = setInterval(() => {
                if (backendPort) {
                    clearInterval(checkInterval);
                    resolve(backendPort);
                }
            }, 100);

            // Timeout de seguridad de 10 segundos
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve(null);
            }, 10000);
        }
    });
});

app.whenReady().then(() => {
    startBackend();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    // Inicializar el sistema de actualizaciones automáticas
    if (!isDev) {
        const updater = new UpdaterManager(mainWindow);
        updater.checkForUpdates();
    }
});




ipcMain.handle('get-app-version', () => app.getVersion());
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    if (backendProcess) {
        backendProcess.kill();
    }
});
