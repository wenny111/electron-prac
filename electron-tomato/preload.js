// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('myAPI', {
  notification: () => ipcRenderer.invoke('work-notification'),
  startTimer: () => {
    ipcRenderer.invoke('start-timer')
  },
  stopTimer: () => {
    ipcRenderer.invoke('stop-timer')
  },
  updateTimer: (callback) => {
    ipcRenderer.on('update-timer', callback)
  },
  timerDone: (callback) => {
    ipcRenderer.on('timer-done', callback)
  }
});