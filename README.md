
## tomato
一款类似于番茄倒计时功能的app
![Alt text](/images/tomato.png)

### 关键点
1. 通信：渲染进程 -> 主进程 
    ipcRenderer.invoke(...) 发送事件
    ipcMain.handle(...) 监听事件
    事件有 work-notification，start-timer，stop-timer
    
    主进程 ->  渲染进程
    webContents.send(...)
    ipcRenderer.on(...)
    事件有 update-timer，timer-done

2. 主进程做的事情有  app, BroserWindow, Notification, ipcMain
   渲染进程：渲染页面，ipc通信

### TODO
1. 添加菜单自定义时间
2. 暂停重启的边界情况
3. 添加白噪音


## remote-control
基于electron 和 webrtc 的远程控制工具
npm start 输入控制码后需要「Ctrl + R」或「Cmd + R」手动刷新一下控制端页面 才会显示视频流 
### 业务流程
1. 傀儡端告知控制端本机控制码
2. 控制端输入控制码 连接 傀儡端
3. 傀儡端将 捕获的画面传至 控制端
4. 控制端的鼠标和键盘指令传到傀儡端
5. 傀儡端响应控制指令

### 关键点
1. 如何捕获画面
  Electron desktopCapture
  https://www.electronjs.org/zh/docs/latest/api/desktop-capturer


2. 如何完成用户间连接+画面+指令传输
  WebRTC
  https://webrtc.org/?hl=zh-cn
  [a]. getUserMedia 获取媒体数据(音视频)
  [b]. RTCPeerConnection 建立P2P连接、传输多媒体数据
        P2P(peer-to-peer)通信原理 https://zhuanlan.zhihu.com/p/26796476
  [c]. RTCDataChannel 传输数据

3. 怎么响应控制指令
  robotjs(Node.js) 是nodejs的一个用于桌面自动化的库。他能自动化鼠标、键盘和读取屏幕，并且提供了Mac, Windows, and Linux的跨平台支持。
  http://robotjs.io/docs/examples


### webrtc

* 实现细节
1. 使用 Electron 中的 desktopCapturer 模块来获取屏幕捕获的源,
  再使用 getUserMedia() 方法来获取屏幕流；（navigator.webkitGetUserMedia()方法已经废弃）
  最后添加到 peer 对象中。
  ```js
    // EventEmitter 是 Node.js 内置的一个模块, on() 方法注册事件监听器， emit() 方法触发事件
    import EventEmitter from 'events'
    let peer = new EventEmitter()

    ipcMain.handle('getScreenSources', async () => {
      await desktopCapturer.getSources({ types: ['screen'] })
      ...
    });

    async getScreenStream = () => {
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
          peer.emit('add-stream', stream) // 触发 add-stream事件，用于 P2P 通信中傀儡端添加桌面流
        } ...
      )
      })
    }
  ```

2. 播放 媒体流 对象

  ```js
    let video = document.getElementById('screen-video')
    const play = (stream) => {
      video.srcObject = stream
      video.onloadedmetadata = function () {
        video.play()
      }
    }
  ```

3. 创建 P2P 连接
  简言之，控制端发起邀请协议A，傀儡端在确定A之后，把自己的桌面流添加到P2P的连接当中，然后同样返回一个确定的协议B，最后控制端将B也设置上。
  * SDP
    Session Description Protocol, 是一种描述流媒体会话信息的协议。https://developer.mozilla.org/zh-CN/docs/Glossary/SDP

  ![Alt text](/images/p2p.png)
  ```js
    // 控制端流程
    // a. 创建 RTCPeerConnection
    const pc = new window.RTCPeerConnection({}) 

    // b. 发起连接 createOffer, 得到 offer SDP
    const createOffer = async() => {
      const offer = await pc.createOffer({
          offerToReceiveAudio: false,
          offerToReceiveVideo: true
      })
      // c. setLocalDescription，设置 offer SDP
      await pc.setLocalDescription(offer)
      return pc.localDescription
    }

    // d. 将控制端的 offer SDP 传输到傀儡端
    createOffer().then((offer) => {
      ipcRenderer.send('forward', 'offer', {type: offer.type, sdp: offer.sdp})
    })
  ```

  ```js
    // 傀儡端流程
    // a. 创建 RTCPeerConnection
    const pc = new window.RTCPeerConnection({})

    // b. 添加初始时捕获的桌面流 addStream
    async function createAnswer(offer) {
      let stream = await getScreenStream()

      pc.addStream(stream)
      // c. setRemoteDescription, 设置控制端 offer SDP
      await pc.setRemoteDescription(offer);
      // d. 响应连接 createAnswer, 得到 answer SDP
      // e. setLocalDescription, 设置 answer SDP
      await pc.setLocalDescription(await pc.createAnswer());
      return pc.localDescription
    }

    // f. 将 傀儡端的 answer SDP发送给控制端
    ipcRenderer.on('offer', async(e, offer) => {
      let answer = await createAnswer(offer)
      ipcRenderer.send('forward', 'answer', {type: answer.type, sdp: answer.sdp})
    })
  ```
  ```js
    // g. 控制端设置 answer SDP
    async function setRemote(answer) {
      await pc.setRemoteDescription(answer)
    }

    ipcRenderer.on('answer', (e, answer) => {
      setRemote(answer)
    })
  ```
4. STUN 过程
  * STUN（Session Traversal Utilities for NAT）是一种用于网络通信的协议，它的主要作用是帮助在 NAT（Network Address Translation）环境下的设备进行网络通信。在 NAT 环境中，设备的 IP 地址会被 NAT 网关转换为公网 IP 地址，因此设备之间进行网络通信时需要经过 NAT 网关的转换。STUN 协议可以帮助设备获取其在 NAT 环境中的公网 IP 地址和端口号，以便设备之间进行直接通信。
  * NAT（Network Address Translation）是一种网络协议，它将私有网络中的内部 IP 地址转换为公共网络中的外部 IP 地址，以便内部网络中的计算机可以与公共网络中的其他计算机进行通信。但是，由于 NAT 的存在，内部网络中的计算机通常无法直接接收来自公共网络的连接，这就是 NAT 打洞技术可以解决的问题。
  NAT 打洞是一种技术，它利用了 NAT 的一些特殊行为，使得两个位于不同 NAT 后的计算机可以直接通信。这通常涉及到使用一个第三方服务器（称为 STUN 服务器），它可以帮助计算机确定它们在 NAT 后的 IP 地址和端口号。
  * ICE（Interactive Connectivity Establishment）是一种网络连接协议，用于在网络上建立实时通信连接，例如 WebRTC 中的音频和视频聊天。它的主要目的是解决网络地址转换（NAT）和防火墙等网络障碍的问题。
  ICE 会在两个设备之间建立连接前，先进行网络探测和地址收集，来确定它们之间可用的网络路径。它会尝试使用各种协议和技术（例如 STUN、TURN 和 ICE Candidate），以便找到最佳的通信路径。
  在 WebRTC 应用程序中，ICE 通常与 SDP（Session Description Protocol）一起使用，以便在设备之间交换网络地址和信息，从而建立连接。这种交互式连接创建过程可以确保实时通信连接的可靠性和质量。
  ![Alt text](/images/stun.png)

  1. 控制端寻址，STUN 打洞，获取 IP和端口，传输给傀儡端
  2. 傀儡端拿到了IceEvent之后，通过addIceCandidate的方法添加代理；傀儡端也会拿到自己的IP和端口给到控制端，控制端添加ICE代理
  ```js
  pc.onicecandidate = (e) => {
    if(e.candidate) {
        ipcRenderer.send('forward', 'control-candidate', e.candidate)
    }
  }
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

  ```
  ```js
  pc.onicecandidate = function(e) {
    ipcRenderer.send('forward', 'puppet-candidate', e.candidate)
  }

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
  }
  ```

5. 信令服务：连接两端，各种转发，基于 webSocket
* WebSocket 是一种在单个 TCP 连接上进行全双工通信的协议。它在客户端和服务器之间建立一个持久化的连接，允许服务器主动向客户端推送消息。相比传统的 HTTP 请求响应模式，WebSocket 可以实现更实时、更高效的通信。
WebSocket 协议的使用需要客户端和服务器端都支持该协议。在客户端浏览器中，可以通过 JavaScript 创建 WebSocket 对象，然后连接到服务器端。同时，服务器端也需要支持 WebSocket 协议，通常可以使用相应的库或框架来实现。
WebSocket 协议通常用于实时通信、多人在线游戏、实时数据推送等场景。它可以大大简化前后端的通信逻辑，提高应用的实时性和性能。
![Alt text](/images/signal.png)
![Alt text](/images/signal-2.png)

6. RTCDataChannel 传输数据
![Alt text](/images/channel.png)

```js
  // 控制端
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
```
```js
  // 傀儡端
  const pc = new window.RTCPeerConnection({}) 
  pc.ondatachannel = (e) => {
    e.channel.onmessage = (e)  => {
    console.log('onmessage', e, JSON.parse(e.data))
        let {type, data} = JSON.parse(e.data)
          if(type === 'mouse') {
              data.screen = {
                  width: window.screen.width, 
                  height: window.screen.height
              }
          }
          ipcRenderer.send('robot', type, data)
    }
  }
```


### 项目架构
```js
app
├── main 主进程
│   ├── control.js 输入验证码后的控制端窗体
│   ├── index.js 主进程
│   ├── ipc.js 通信模块
│   ├── main.js react页面 双方的初始化窗口
│   ├── robot.js 鼠标键盘控制指令模块
│   └── signal.js websocket 转发
└── render 渲染进程
    ├── pages
    │   └── control 构建产物页面
    │       ├── app.js 控制端JS逻辑
    │       ├── index.html 控制端视图
    │       └── peer-control.js 控制端webRtc逻辑 
    └── src
        └── main  基于react create-react-app脚手架创建的傀儡端页面
            └── src
                ├── index.js
                ├── peer-puppet.js 傀儡端webRtc逻辑

```
### 踩坑记录
1. mac/windows/ubuntu兼容性
2. 调试

### TODO
1. app 特性：窗口假关闭、禁止多开
2. 原生GUI相关: 托盘、菜单
3. robotjs： mac 和 windows键盘输入转换，拖拽事件等
4. 完善页面样式
5. 使用 ES Module的写法

## 服务端 