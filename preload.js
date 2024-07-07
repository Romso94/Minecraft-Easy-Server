const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    createFolder: (folderName,version,downloadUrl,ramAllow) => ipcRenderer.send('create-folder', folderName,version,downloadUrl,ramAllow)
});