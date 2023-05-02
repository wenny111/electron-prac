const startButton = document.getElementById('start')
const stopButton = document.getElementById('stop')
const timeLeftDiv = document.querySelector('.time-left')
let timerId

startButton.addEventListener('click', async() => {
  await window.myAPI.startTimer()
})

stopButton.addEventListener('click', async() => {
  await window.myAPI.stopTimer()
})

window.myAPI.updateTimer((event, timeLeft) => {
  timeLeftDiv.textContent = timeLeft
})

window.myAPI.timerDone(() => {
  clearInterval(timerId)
  timeLeftDiv.textContent = '00:05'
  notification()
})

async function notification() {
    let res = await window.myAPI.notification()
    switch(res) {
        case 'rest':
          setTimeout(() => {
            alert('休息结束')
        }, 1 * 60 * 1000)
          break;
        case 'work':
          await window.myAPI.startTimer()
          break;
        default:
    }
}
