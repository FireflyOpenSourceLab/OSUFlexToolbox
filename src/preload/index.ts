import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { DayActivity } from '../shared/heatmap'
import type { BeatmapStats, OsuInstance } from '../shared/osu'

// Custom APIs for renderer
const api = {
  osu: {
    /** 探测本机已安装的 osu! 实例 */
    detect: (): Promise<OsuInstance[]> => ipcRenderer.invoke('osu:detect'),
    /** 启动指定实例，返回错误信息（空串表示成功） */
    launch: (executable: string): Promise<string> => ipcRenderer.invoke('osu:launch', executable),
    /** 统计该实例的谱面数量（按模式）与占用空间 */
    beatmaps: (executable: string): Promise<BeatmapStats> =>
      ipcRenderer.invoke('osu:beatmaps', executable),
    /** 谱面所在磁盘的总容量 */
    disk: (executable: string): Promise<{ totalBytes: number }> =>
      ipcRenderer.invoke('osu:disk', executable),
    /** 每日游玩活跃度，用于热力图 */
    heatmap: (executable: string): Promise<DayActivity[]> =>
      ipcRenderer.invoke('osu:heatmap', executable)
  },
  theme: {
    /** 同步 OS 层主题（Windows 窗口控件），返回系统当前是否应使用深色 */
    set: (theme: 'system' | 'light' | 'dark'): Promise<boolean> =>
      ipcRenderer.invoke('theme:set', theme)
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
