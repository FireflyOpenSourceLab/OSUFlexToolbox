import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { OsuInstance } from '../shared/osu'

// Custom APIs for renderer
const api = {
  osu: {
    /** 探测本机已安装的 osu! 实例 */
    detect: (): Promise<OsuInstance[]> => ipcRenderer.invoke('osu:detect'),
    /** 启动指定实例，返回错误信息（空串表示成功） */
    launch: (executable: string): Promise<string> => ipcRenderer.invoke('osu:launch', executable)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
