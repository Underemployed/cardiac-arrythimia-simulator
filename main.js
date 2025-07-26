    const { app, BrowserWindow, globalShortcut } = require('electron')
    const path = require('path')

    function createWindow() {
        const win = new BrowserWindow({
            show: false,
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


        win.loadFile('index.html')

        win.once('ready-to-show', () => {
            win.setMenu(null)
            win.maximize()
            win.show()
        win.on('focus', () => {
            globalShortcut.register('CommandOrControl+M', () => {
            win.webContents.setAudioMuted(!win.webContents.isAudioMuted())
            })
            globalShortcut.register('CommandOrControl+F', () => {
            win.setFullScreen(!win.isFullScreen())
            })
        })

        win.on('blur', () => {
            globalShortcut.unregister('CommandOrControl+M')
            globalShortcut.unregister('CommandOrControl+F')
        })    
    }

    app.on('will-quit', () => {
        globalShortcut.unregisterAll()
    })

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
