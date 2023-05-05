const { app, BrowserWindow, ipcMain } = require('electron')
const isDev = require('electron-is-dev')
const path = require('path')

let mainWindow
function createMainWindow () {
  mainWindow = new BrowserWindow({
    width: 1000,  
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  })
  mainWindow.webContents.openDevTools()

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
  } else {
      // 第三章用到
    mainWindow.loadFile(path.resolve(__dirname, '../render/pages/control/index.html'))
  }
}

function send(channel, ...args) {
  mainWindow.webContents.send(channel, ...args)
}

module.exports = {createMainWindow, send}
