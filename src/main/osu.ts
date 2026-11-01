import { shell } from 'electron'
import { execFileSync } from 'child_process'
import { existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import type { OsuEdition, OsuInstance } from '../shared/osu'

export type { OsuEdition, OsuInstance }

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
      return { edition: 'lazer', label: 'osu!lazer', executable: exe }
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
    return { edition: 'stable', label: 'osu!stable', executable: association }
  }

  // 2) 卸载项记录的安装目录
  const installLocation = readRegistryValue(
    'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\osu!'
  )
  if (installLocation) {
    const exe = join(installLocation.replace(/\\+$/, ''), 'osu!.exe')
    if (existsSync(exe)) {
      return { edition: 'stable', label: 'osu!stable', executable: exe }
    }
  }

  // 3) 兜底：默认按用户安装的位置
  const localAppData = process.env.LOCALAPPDATA
  if (localAppData) {
    const exe = join(localAppData, 'osu!', 'osu!.exe')
    if (existsSync(exe)) {
      return { edition: 'stable', label: 'osu!stable', executable: exe }
    }
  }
  return null
}

/** macOS 只探测 lazer（stable 是 Windows-only） */
function detectMacLazer(): OsuInstance | null {
  const candidates = ['/Applications/osu!.app', join(homedir(), 'Applications', 'osu!.app')]
  for (const appPath of candidates) {
    if (existsSync(appPath)) {
      return { edition: 'lazer', label: 'osu!lazer', executable: appPath }
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
