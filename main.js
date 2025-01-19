const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
    const win = new BrowserWindow({
        width: 1080,
        height: 1920,
        webPreferences: {
            nodeIntegration: true,
            devTools: false
        },
        autoHideMenuBar: true,
        menuBarVisible: false,
        frame: true,
        useContentSize: true,
    })

    win.maximize()

    win.setMenu(null)
    win.loadFile('index.html')
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
