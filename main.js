const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const https = require('https');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        },
        icon: path.join(__dirname, "assets/logo.ico"),
        autoHideMenuBar: true,
    });

    ipcMain.on('create-folder', (event, folderName, version, downloadUrl,ramAllow) => {
        const desktopPath = path.resolve(os.homedir(), 'Desktop', `${folderName}_${version}`);
        

        if (!fs.existsSync(desktopPath)) {
            fs.mkdirSync(desktopPath);
        }

        const filePath = path.join(desktopPath, 'server.jar');
        

        downloadFile(downloadUrl, filePath, (error) => {
            if (error) {
                mainWindow.close();

            } else {
                
                const batContent = `@echo off\njava -Xmx${ramAllow}M -Xms1024M -jar "./server.jar" nogui\nexit`;
                const batFilePath = path.join(desktopPath, 'run.bat');

                fs.writeFileSync(batFilePath, batContent);
                

            
            exec(`start ${batFilePath}`, { cwd: desktopPath }, (error, stdout, stderr) => {
                    if (error) {
                        mainWindow.close();
                    } else {
                        
                        const eulaFilePath = path.join(desktopPath, 'eula.txt');
                        modifyEulaFile(eulaFilePath);
                        
                        exec(`start ${batFilePath}`, { cwd: desktopPath }, (error, stdout, stderr) => {
                            if (error) {
                                mainWindow.close();
                            } else {
                                mainWindow.close();
                                
                            }
                        });
                    }
                });
            
            }
        });


    });

    function downloadFile(url, dest, callback) {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(callback);
            });
        }).on('error', (error) => {
            fs.unlink(dest, () => { }); 
            if (callback) callback(error);
        });
    }

    function modifyEulaFile(eulaFilePath) {
        fs.readFile(eulaFilePath, 'utf8', (err, data) => {
            if (err) {
                mainWindow.close();
                return;
            }

            const updatedData = data.replace(/eula=false/g, 'eula=true');

            fs.writeFile(eulaFilePath, updatedData, 'utf8', (err) => {
                if (err) {
                    mainWindow.close();
                } else {
                    console.log('eula.txt updated successfully');
                }
            });
        });
    }


    mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
