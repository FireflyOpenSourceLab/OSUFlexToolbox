import { shell } from 'electron'
import { execFileSync } from 'child_process'
import { existsSync } from 'fs'
import { statfs } from 'fs/promises'
import { homedir } from 'os'
import { dirname, join } from 'path'
import type { BeatmapStats, OsuEdition, OsuInstance, OsuMode } from '../shared/osu'
import type { DayActivity } from '../shared/heatmap'
import { scanBeatmaps } from '../shared/beatmap-scan'
import { scanPlayActivity } from '../shared/heatmap'

export type { BeatmapStats, OsuEdition, OsuInstance, OsuMode }
export type { DayActivity }

/**
 * 读取单个注册表键值（Windows）。失败返回 null，不抛错。
 * 注册表比固定路径可靠，因为 osu! stable 允许自定义安装目录。
 */
function readRegistryValue(key: string): string | null {
  try {
    const out = execFileSync('reg', ['query', key, '/ve'], {
      encoding: 'utf-8',
      windowsHide: true
    })
    const match = out.match(/REG_SZ\s+(.+)$/m)
    return match ? match[1].trim() : null
  } catch {
    return null
  }
}

/** 注册表里的命令形如 `"C:\...\osu!.exe" "%1"`，取出 exe 的绝对路径 */
function extractExecutablePath(raw: string | null): string | null {
  if (!raw) return null
  const quoted = raw.match(/^"([^"]+)"/)
  const path = quoted ? quoted[1] : raw.split(/\s+/)[0]
  return path && existsSync(path) ? path : null
}

/** lazer 的用户数据目录：Windows 在 %APPDATA%\osu，macOS 在 ~/Library/Application Support/osu */
function resolveLazerDataDir(): string {
  if (process.platform === 'win32') {
    return join(process.env.APPDATA || join(homedir(), 'AppData', 'Roaming'), 'osu')
  }
  return join(homedir(), 'Library', 'Application Support', 'osu')
}

/** stable 的谱面固定在安装目录下的 Songs/ */
function resolveStableBeatmapDir(executable: string): string {
  return join(dirname(executable), 'Songs')
}

/** lazer 的谱面素材是数据目录下 files/ 里的内容寻址散列文件 */
function resolveLazerBeatmapDir(): string {
  return join(resolveLazerDataDir(), 'files')
}

function makeInstance(
  edition: OsuEdition,
  label: string,
  executable: string,
  beatmapDir: string
): OsuInstance {
  return { edition, label, executable, beatmapDir }
}

function detectWindowsLazer(): OsuInstance | null {
  const localAppData = process.env.LOCALAPPDATA
  if (!localAppData) return null

  // 安装器会把 exe 放在根目录或 current\ 子目录，两种布局都试
  const candidates = [
    join(localAppData, 'osulazer', 'osu!.exe'),
    join(localAppData, 'osulazer', 'current', 'osu!.exe')
  ]
  for (const exe of candidates) {
    if (existsSync(exe)) {
      return makeInstance('lazer', 'osu!lazer', exe, resolveLazerBeatmapDir())
    }
  }
  return null
}

function detectWindowsStable(): OsuInstance | null {
  // 1) 文件关联：用户自定义安装位置时，这里才有正确路径
  const association = extractExecutablePath(
    readRegistryValue('HKEY_CLASSES_ROOT\\osu!\\shell\\open\\command')
  )
  if (association) {
    return makeInstance('stable', 'osu!stable', association, resolveStableBeatmapDir(association))
  }

  // 2) 卸载项记录的安装目录
  const installLocation = readRegistryValue(
    'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\osu!'
  )
  if (installLocation) {
    const exe = join(installLocation.replace(/\\+$/, ''), 'osu!.exe')
    if (existsSync(exe)) {
      return makeInstance('stable', 'osu!stable', exe, resolveStableBeatmapDir(exe))
    }
  }

  // 3) 兜底：默认按用户安装的位置
  const localAppData = process.env.LOCALAPPDATA
  if (localAppData) {
    const exe = join(localAppData, 'osu!', 'osu!.exe')
    if (existsSync(exe)) {
      return makeInstance('stable', 'osu!stable', exe, resolveStableBeatmapDir(exe))
    }
  }
  return null
}

/** macOS 只探测 lazer（stable 是 Windows-only） */
function detectMacLazer(): OsuInstance | null {
  const candidates = ['/Applications/osu!.app', join(homedir(), 'Applications', 'osu!.app')]
  for (const appPath of candidates) {
    if (existsSync(appPath)) {
      return makeInstance('lazer', 'osu!lazer', appPath, resolveLazerBeatmapDir())
    }
  }
  return null
}

/**
 * 探测本机 osu! 实例。
 * Windows：lazer 与 stable 都探测，装了几个返回几个。
 * macOS：只探测 lazer。Linux：当前不支持，返回空。
 */
export function detectOsuInstances(): OsuInstance[] {
  const found: OsuInstance[] = []

  if (process.platform === 'win32') {
    // lazer 在前：现代版本优先展示
    const lazer = detectWindowsLazer()
    if (lazer) found.push(lazer)
    const stable = detectWindowsStable()
    if (stable) found.push(stable)
  } else if (process.platform === 'darwin') {
    const lazer = detectMacLazer()
    if (lazer) found.push(lazer)
  }

  return found
}

/** 启动指定实例，返回错误信息（空串表示成功） */
export async function launchOsu(executable: string): Promise<string> {
  if (!existsSync(executable)) {
    return `找不到可执行文件：${executable}`
  }
  return shell.openPath(executable)
}

/* ───────────────────────── 谱面统计 ───────────────────────── */

// 扫描可能上万次读盘，按目录缓存，切换实例时不必重扫
const beatmapStatsCache = new Map<string, BeatmapStats>()

/** 统计指定实例的谱面数量（按模式）与占用空间 */
export async function getBeatmapStats(inst: OsuInstance): Promise<BeatmapStats> {
  const cached = beatmapStatsCache.get(inst.beatmapDir)
  if (cached) return cached
  const stats = await scanBeatmaps(inst.beatmapDir, inst.edition)
  beatmapStatsCache.set(inst.beatmapDir, stats)
  return stats
}

/** 谱面所在磁盘的总容量，用于计算占比 */
export async function getDiskTotal(inst: OsuInstance): Promise<number> {
  // statfs 要求路径存在；目录被删时退回到 home，保证总能拿到一个分母
  const target = existsSync(inst.beatmapDir) ? inst.beatmapDir : homedir()
  const st = await statfs(target)
  return Number(st.blocks) * Number(st.bsize)
}

/** 每日游玩活跃度：osu! 的 logs/ 与谱面目录同级，stable 是 <安装目录>/logs，lazer 是 <数据目录>/logs */
export async function getPlayHeatmap(inst: OsuInstance): Promise<DayActivity[]> {
  return scanPlayActivity(join(dirname(inst.beatmapDir), 'logs'))
}
