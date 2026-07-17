const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    buildAndRun: (code) => ipcRenderer.send('build-and-run', code),
    onBuildLog: (callback) => {
        ipcRenderer.on('build-log', (event, msg) => callback(msg));
    },
    onBuildError: (callback) => {
        ipcRenderer.on('build-error', (event, msg) => callback(msg));
    }
});