const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

function createControlWindow () {
  const win = new BrowserWindow({
    width: 1000,  
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  })
  win.webContents.openDevTools()
  win.loadFile(path.resolve(__dirname, '../render/pages/control/index.html'))
}

module.exports = {createControlWindow}