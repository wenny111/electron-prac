const { override  } = require('customize-cra');

function addRendererTarget(config) {
    config.target = 'electron-renderer' // 设置目标为 Electron 渲染进程
    return config
}

module.exports = override(addRendererTarget)

