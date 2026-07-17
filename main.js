const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { EXEBuilder } = require('./src/exe_builder');

let mainWindow;
let exeBuilder;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        backgroundColor: '#1e1e1e',
        title: 'RunnerPython'
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

ipcMain.on('build-and-run', async (event, code) => {
    if (exeBuilder) {
        exeBuilder.removeAllListeners();
    }

    exeBuilder = new EXEBuilder();

    exeBuilder.on('log', (msg) => {
        mainWindow.webContents.send('build-log', msg);
    });

    exeBuilder.on('error', (msg) => {
        mainWindow.webContents.send('build-error', msg);
    });

    try {
        await exeBuilder.buildAndRun(code);
    } catch (error) {
        mainWindow.webContents.send('build-error', error.message);
    }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});