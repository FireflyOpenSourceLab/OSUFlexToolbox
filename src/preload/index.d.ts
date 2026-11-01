import { ElectronAPI } from '@electron-toolkit/preload'
import type { DayActivity } from '../shared/heatmap'
import type { BeatmapStats, OsuInstance } from '../shared/osu'

export interface OsuApi {
  detect: () => Promise<OsuInstance[]>
  launch: (executable: string) => Promise<string>
  beatmaps: (executable: string) => Promise<BeatmapStats>
  disk: (executable: string) => Promise<{ totalBytes: number }>
  heatmap: (executable: string) => Promise<DayActivity[]>
}

export type ThemeChoice = 'system' | 'light' | 'dark'

export interface ThemeApi {
  set: (theme: ThemeChoice) => Promise<boolean>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      osu: OsuApi
      theme: ThemeApi
    }
  }
}
