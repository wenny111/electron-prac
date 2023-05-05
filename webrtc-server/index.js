// 服务端：建立端和控制码的联系，通过控制码找到用户
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

// 创建一个 Map，用于存储连接的 WebSocket 和随机生成的 code 值
const code2ws = new Map()

wss.on('connection', function connection(ws, request) {
  ws.sendData = (event, data) => {
    ws.send(JSON.stringify({event, data}));
  };
  
  ws.sendError = msg => {
    ws.sendData('error', {msg})
  };
  
  // 生成随机的 6 位数作为 code
  let code =  Math.floor(Math.random()*(999999-100000)) + 100000;
  
  // // 获取客户端的 IP 地址
  // let ip = request.connection.remoteAddress.replace('::ffff:', '');
  // console.log(`ip is connected ${ip} `)
  
  // 将 code 和对应的 WebSocket 存储到 Map 中
  code2ws.set(code, ws)
  
  // 当收到 WebSocket 发来的消息时触发
  ws.on('message', function incoming(message) {
    console.log('imcoming message')
    
    // 解析收到的消息
    let parsedMessage = {}
    try {
        parsedMessage = JSON.parse(message);
    } catch (e) {
        console.log('parse error', e)
        ws.sendError('message not valid')
        return
    }
    let {event, data} = parsedMessage

    switch(event) {
      // 处理登录事件，发送 logined 事件和 code
      case 'login':
        ws.sendData( 'logined', {code})
        break
      // 处理控制事件，查找对应的 remote WebSocket，进行控制
      case 'control':
        let remote = +data.remote
        console.log('control', remote)
        let remoteWS = code2ws.get(remote)
        console.log('remoteWS', remoteWS)
        if (remoteWS) {
            ws.sendData('controlled', {remote})
            ws.sendRemote = remoteWS.sendData
            remoteWS.sendRemote = ws.sendData
            ws.sendRemote('be-controlled', {remote: code})
        } else {
            ws.sendError('user not found')
        }
        break
      // 处理转发事件，将事件和数据转发给远程 WebSocket
      case 'forward':
        console.log('forward', data)
        ws.sendRemote(data.event, data.data)
        break
      // 其他事件则发送错误信息
      default:
        ws.sendError('message not handle', message)
    }
  })

  // 当 WebSocket 连接关闭时触发
  ws.on('close', () => {
    code2ws.delete(code)
    delete ws.sendRemote
    clearTimeout(ws._closeTimeout);
  })

  // 设置一个定时器，10 分钟未收到消息就关闭 WebSocket 连接
  ws._closeTimeout = setTimeout(() => {
    ws.terminate();
  }, 600000);
});
