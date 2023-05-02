const EventEmitter = require('events')
const { ipcRenderer } = window.require('electron');
// const {desktopCapturer} = require('electron')

const peer = new EventEmitter()

// 以下是 peer-puppet 的内容
async function getScreenStream() {
    const sources = await ipcRenderer.invoke('getScreenSources');
    // console.log(sources)

    navigator.webkitGetUserMedia({
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: sources[0].id,
                maxWidth: window.screen.width,
                maxHeight: window.screen.height
            }
        }
    }, (stream) => {
        console.log('add-stream')
        peer.emit('add-stream', stream)
    }, (err) => {
        console.log(err)
    })
}

getScreenStream()

module.exports = peer

