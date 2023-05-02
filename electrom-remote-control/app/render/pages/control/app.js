// 视频流捕获
const peer = require('./peer-control')

peer.on('add-stream', (stream) => {
  console.log('play stream')
  play(stream)
})

function play() {
  let video = document.getElementById('screen-video')
  video.srcObject = stream
  video.onloadedmetadata = function () {
    video.play()
  }
}