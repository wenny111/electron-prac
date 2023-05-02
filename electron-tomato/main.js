const { app, BrowserWindow, Notification, ipcMain } = require("electron");
let timerId;
let timeLeftString;

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: __dirname + "/preload.js",
    },
  });

  win.loadFile("index.html");
  // win.webContents.openDevTools();

  ipcMain.handle("start-timer", () => {
    let timeLeft = 0.1 * 60;
    timerId = setInterval(() => {
      timeLeft--;
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      timeLeftString = `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
      win.webContents.send("update-timer", timeLeftString);
      if (timeLeft === 0) {
        clearInterval(timerId);
        win.webContents.send("timer-done");
      }
    }, 1000);
  });

  ipcMain.handle("stop-timer", () => {
    clearInterval(timerId);
    win.webContents.send("update-timer", timeLeftString);
  });
}

app.whenReady().then(createWindow).then(handleIPC);

function handleIPC() {
  ipcMain.handle("work-notification", async function () {
    let res = await new Promise((resolve, reject) => {
      let notification = new Notification({
        title: "任务结束",
        body: "是否开始休息",
        actions: [{ text: "开始休息", type: "button" }],
        closeButtonText: "继续工作",
      });
      notification.show();
      notification.on("action", () => {
        resolve("rest");
      });
      notification.on("close", () => {
        resolve("work");
      });
    });
    return res;
  });
}
