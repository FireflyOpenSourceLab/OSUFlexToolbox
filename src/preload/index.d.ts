import { ElectronAPI } from '@electron-toolkit/preload'
import type { OsuInstance } from '../shared/osu'

export interface OsuApi {
  detect: () => Promise<OsuInstance[]>
  launch: (executable: string) => Promise<string>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      osu: OsuApi
    }
  }
}
