// 控制端
const EventEmitter = require('events')
const { ipcRenderer } = window.require('electron');
// const {desktopCapturer} = require('electron')

const peer = new EventEmitter()
const pc = new window.RTCPeerConnection({})

// peer.on('robot', (type, data) => {
//     console.log('robot', type, data)
//     if(type === 'mouse') {
//         data.screen = {
//             width: window.screen.width, 
//             height: window.screen.height
//         }
//     }
//     setTimeout(() => {
//     ipcRenderer.send('robot', type, data)
//     }, 2000)
    
// })

const dc = pc.createDataChannel('robotchannel', {reliable: false});
dc.onopen = () => {
    console.log('opened')
    peer.on('robot', (type, data) => {
        dc.send(JSON.stringify({type, data}))
    })
}

dc.onmessage = (event) => {
    console.log('message', event)
}
dc.onerror = (e) => {console.log(e)}


// 获取 iceEvent 和 addIceCandidate
pc.onicecandidate = (e) => {
    console.log('candidate', JSON.stringify(e.candidate))
    if(e.candidate) {
        ipcRenderer.send('forward', 'control-candidate', e.candidate)
    }
}

ipcRenderer.on('candidate', (e, candidate) => {
    addIceCandidate(candidate)
})

let candidateQueue = []
async function addIceCandidate(candidate) {
    candidate && candidateQueue.push(candidate)
    if(pc.remoteDescription && pc.remoteDescription.type) {
        for (let candidate of candidateQueue) {
            try {
                const rtcIceCandidate = new RTCIceCandidate(candidate);
                await peerConnection.addIceCandidate(rtcIceCandidate);
                candidateQueue.shift();
            } catch (e) {
                console.error(e)
            }
        }
    } 
}
window.addIceCandidate = addIceCandidate


const createOffer = async() => {
    const offer = await pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: true
    })
    await pc.setLocalDescription(offer)
    console.log('create-offer\n', JSON.stringify(pc.localDescription))
    return pc.localDescription
}

createOffer().then((offer) => {
    ipcRenderer.send('forward', 'offer', {type: offer.type, sdp: offer.sdp})
})

const setRemote = async(answer) => {
    await pc.setRemoteDescription(answer)
    console.log('create-answer', pc)
}
window.setRemote = setRemote

ipcRenderer.on('answer', (e, answer) => {
    setRemote(answer)
})


pc.onaddstream = (e) => {
	peer.emit('add-stream', e.stream)
}

module.exports = peer
