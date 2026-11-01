import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { detectOsuInstances, launchOsu } from './osu'

// 自定义标题栏高度（三平台统一），同时决定 WCO 控件覆盖层高度
const TITLE_BAR_HEIGHT = 40

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    // 隐藏系统标题栏，内容延伸到窗口顶部
    titleBarStyle: 'hidden',
    // 启用 Chromium 的 Window Controls Overlay（WCO）——三平台统一走这套：
    //  macOS        → 保留系统红绿灯，并暴露 titlebar-area-* CSS 环境变量
    //  Windows/Linux → 渲染原生三大件（最小化/最大化/关闭）
    // height 让三平台标题栏高度一致；color/symbolColor 仅 Windows/Linux 生效，
    // 不传即跟随系统配色，保持原生观感。
    titleBarOverlay: { height: TITLE_BAR_HEIGHT },
    // macOS：红绿灯相对窗口左上角的内缩边距（上 / 左）
    ...(process.platform === 'darwin' ? { trafficLightPosition: { x: 12, y: 12 } } : {}),
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // osu! 实例探测 / 启动
  ipcMain.handle('osu:detect', () => detectOsuInstances())
  ipcMain.handle('osu:launch', (_event, executable: string) => launchOsu(executable))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
