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
  console.log('key', key)
  if(key[0] !== '<') { //<shift>
    robot.keyTap(key, modifiers)
  } else {
    robot.keyTap(key.slice(1, -1), modifiers)
  }
}

const handleRobotEvents = () => {
  ipcMain.on('robot', (e, type, data) => {
    // console.log('handle', type, data)
    switch(type) {
      case 'mouse':
        handleMouseEvents(data)
        break
      case 'key':
        handleKeyEvents(data)
        break
      default:
    }    
})
}

module.exports = handleRobotEvents