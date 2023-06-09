const { app, BrowserWindow, ipcMain } = require('electron')
const isDev = require('electron-is-dev')
const path = require('path')
const handleIPC = require('./ipc')
const {createMainWindow} = require('./main')
// const {createControlWindow} = require('./control')


app.whenReady().then(() => {
  createMainWindow()
  // createControlWindow()
  handleIPC()
  require('./robot.js')()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
