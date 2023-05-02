// 主进程 Ipc 通信
const { ipcMain, desktopCapturer } = require('electron');
const {send: sendMainWindow} = require('./main')
const {createControlWindow} = require('./control')


module.exports = function(){
  ipcMain.handle('login', async() => {
    let code = Math.floor(Math.random() * (999999 - 100000)) + 100000
    return code
  })

  ipcMain.handle('control', async(e, remoteCode) => {
    // 发送控制消息
    console.log('control', remoteCode)
    sendMainWindow('control-state-change', remoteCode, 1)
    createControlWindow()
  })

  ipcMain.handle('getScreenSources', async () => {
    const sources = await desktopCapturer.getSources({ types: ['screen'] });
    return sources;
  });
}