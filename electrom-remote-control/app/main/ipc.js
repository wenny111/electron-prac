// 主进程 Ipc 通信
const { ipcMain, desktopCapturer } = require('electron');
const {send: sendMainWindow, send: sendControlWindow} = require('./main')
const {createControlWindow} = require('./control')
const signal = require('./signal')


module.exports = function(){
  ipcMain.handle('login', async() => {
    // 先 mock 一个 code
    // let code = Math.floor(Math.random() * (999999 - 100000)) + 100000
    let {code} = await signal.invoke('login', null, 'logined')
    return code
  })

  ipcMain.handle('control', async(e, remote) => {
    // 发送控制消息
    // console.log('control', remoteCode)
    // sendMainWindow('control-state-change', remoteCode, 1)
    // createControlWindow()
    signal.send('control', {remote})
  })

  signal.on('controlled', (data) => {
    sendMainWindow('control-state-change', data.remote, 1)
    createControlWindow()
  })

  signal.on('be-controlled', (data) => {
    sendMainWindow('control-state-change', data.remote, 2)
  })

  // puppet、control共享的信道，就是转发
  ipcMain.on('forward', (e, event, data) => {
    signal.send('forward', {event, data})
  })
  
  // 收到offer，puppet响应
  signal.on('offer', (data) => {
      sendMainWindow('offer', data)
  })

  // 收到puppet证书，answer响应
  signal.on('answer', (data) => {
    sendControlWindow('answer', data)
  })
  
  // 收到control证书，puppet响应
  signal.on('puppet-candidate', (data) => {
    sendControlWindow('candidate', data)
  })
  
  // 收到puppet证书，control响应
  signal.on('control-candidate', (data) => {
    sendMainWindow('candidate', data)
  })

  ipcMain.handle('getScreenSources', async () => {
    const sources = await desktopCapturer.getSources({ types: ['screen'] });
    return sources;
  });
}