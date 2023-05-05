const { BrowserWindow } = require('electron')
const path = require('path')

let win
function createControlWindow () {
  win = new BrowserWindow({
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

function sendControlWindow(channel, ...args) {
  win.webContents.send(channel, ...args)
}

module.exports = {createControlWindow, sendControlWindow}