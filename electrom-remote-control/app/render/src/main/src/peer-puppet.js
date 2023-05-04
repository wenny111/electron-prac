// 傀儡端
import EventEmitter from 'events'
import {ipcRenderer} from 'electron'
let peer = new EventEmitter()
let candidateQueue = [];
const pc = new window.RTCPeerConnection({}) // 建立 p2p 连接

// 捕获画面
async function getScreenStream() {
  const sources = await ipcRenderer.invoke('getScreenSources');
  return new Promise((resolve, reject) => {
    navigator.mediaDevices.getUserMedia({
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
        resolve(stream)
        peer.emit('add-stream', stream)
    }, (err) => {
        console.log(err)
        reject(err)
    })
  })
}


pc.ondatachannel = (e) => {
  console.log('data', e)
  e.channel.onmessage = (e)  => {
  console.log('onmessage', e, JSON.parse(e.data))
      let {type, data} = JSON.parse(e.data)
        console.log('robot', type, data)
        if(type === 'mouse') {
            data.screen = {
                width: window.screen.width, 
                height: window.screen.height
            }
        }
        ipcRenderer.send('robot', type, data)
  }
}

async function createAnswer(offer) {
  let stream = await getScreenStream()

  pc.addStream(stream)
  await pc.setRemoteDescription(offer);
  await pc.setLocalDescription(await pc.createAnswer());
  console.log('create answer \n', JSON.stringify(pc.localDescription))
  return pc.localDescription
}

window.createAnswer = createAnswer
// createAnswer(offer).then((answer) => {
//   ipcRenderer.send('forward', 'answer', {type: answer.type, sdp: answer.sdp})
// })


// 获取 iceEvent 和 addIceCandidate
pc.onicecandidate = function(e) {
  console.log('candidate', JSON.stringify(e.candidate))
  ipcRenderer.send('forward', 'puppet-candidate', e.candidate)
}

// 设置 addIceCandidate
const addIceCandidate = async(candidate) => {
  // 依赖remoteDescription,等其设置成功后才会生效
  candidate && candidateQueue.push(candidate);
  if (pc.remoteDescription && pc.remoteDescription.type) {
      for (let candidate of candidateQueue) {
          try {
              const rtcIceCandidate = new RTCIceCandidate(candidate);
              await pc.addIceCandidate(rtcIceCandidate);
              candidateQueue.shift();
          } catch (e) {
              console.error(e)
          }
      }
  }
};
// let candidates = []
// async function addIceCandidate(candidate) {
//   if(!candidate || !candidate.type) return
//   candidates.push(candidate)
//   if(pc.remoteDescription && pc.remoteDescription.type) {
//       for(let i = 0; i < candidates.length; i ++) {
//           await pc.addIceCandidate(new RTCIceCandidate(candidates[i]))
//       }
//       candidates = []
//   } 
// }

window.addIceCandidate = addIceCandidate

ipcRenderer.on('offer', async(e, offer) => {
  let answer = await createAnswer(offer)
  ipcRenderer.send('forward', 'answer', {type: answer.type, sdp: answer.sdp})
})