const WebSocket = require('ws');
const EventEmitter = require('events')

const SIGNAL_URL = 'ws://127.0.0.1:8080'
const signal = new EventEmitter();
const ws = new WebSocket(SIGNAL_URL);

ws.on('open', () => {
  console.log('connected');
})

ws.on('message', function incoming(message) {
  let data = JSON.parse(message)
  console.log('data', data, message);
  signal.emit(data.event, data.data)
})

const send = (event, data) => {
  console.log('sended', JSON.stringify({event, data}))
  ws.send(JSON.stringify({event, data}))
}

const invoke = (event, data, answerEvent) => {
  return new Promise((resolve, reject) => {
      send(event, data)
      signal.once(answerEvent, resolve)
      setTimeout(() => {
          reject('timeout')
      }, 5000)
  })
}

signal.send = send;
signal.invoke = invoke;

module.exports = signal;