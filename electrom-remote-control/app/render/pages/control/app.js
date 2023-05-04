// 视频流捕获
const peer = require('./peer-control')

peer.on('add-stream', (stream) => {
  console.log('play stream')
  play(stream)
})

let video = document.getElementById('screen-video')
const play = (stream) => {
  video.srcObject = stream
  video.onloadedmetadata = function () {
    video.play()
  }
}

window.onkeydown = function (e) {
  let data = 
  {
    keyCode: e.keyCode,
    meta: e.metaKey,
    alt: e.altKey,
    ctrl: e.ctrlKey,
    shift: e.shiftKey
  }
  peer.emit('robot', 'key', data)
}


window.onmouseup = function (e) {
  let data =
  {
    clientX: e.clientX,
    clientY: e.clientY,
    video: {
      width: video.getBoundingClientRect().width,
      height: video.getBoundingClientRect().height
    }
  }
  peer.emit('robot', 'mouse', data)
}
