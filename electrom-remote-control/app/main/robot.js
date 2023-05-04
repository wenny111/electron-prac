const {ipcMain} = require('electron')
const robot = require('robotjs')
const vkey = require('vkey')

const handleMouseEvents = (data) => {
  const {clientX, clientY, screen, video} = data
  let x = clientX * screen.width / video.width
  let y = clientY * screen.height / video.height
  robot.moveMouse(x, y)
  robot.mouseClick()
}

const handleKeyEvents = (data) => {
  const {keyCode, meta, alt, ctrl, shift} = data
  const modifiers = []
  if(meta) modifiers.push('meta')
  if(alt) modifiers.push('alt')
  if(ctrl) modifiers.push('ctrl')
  if(shift) modifiers.push('shift')
  const key = vkey[keyCode].toLowerCase()
  robot.keyTap(key, modifiers)
}

const handleRobotEvents = () => {
  ipcMain.on('robot', (e, type, data) => {
    switch(type) {
      case 'mouse':
        handleMouseEvents(e, type, data)
        break
      case 'key':
        handleKeyEvents(e, type, data)
        break
      default:
    }    
})
}

module.exports = handleRobotEvents