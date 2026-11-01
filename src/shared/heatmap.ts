/**
 * 游玩热力图（纯逻辑，不依赖 Electron）——主进程与测试脚本共用。
 *
 * 数据源是 osu! 的 logs/ 目录：每次会话一组日志，文件名形如
 * `<unix秒>.<类型>.log`，文件名时间戳即会话开始时间，该组文件的最大 mtime 即结束时间。
 * 用 epoch 而非日志正文里的日期，是因为正文时间戳是 UTC，直接按本地日历归档会错一天。
 */
import { readdir, stat } from 'fs/promises'
import { join } from 'path'

export interface DayActivity {
  /** 本地时区的 YYYY-MM-DD */
  date: string
  /** 当日会话数 */
  sessions: number
  /** 当日游玩分钟数 */
  minutes: number
}

export interface SessionSpan {
  startMs: number
  endMs: number
}

const LOG_NAME = /^(\d+)\.[\w-]+\.log$/

/** 本地时区的日期键 YYYY-MM-DD */
function dayKey(ms: number): string {
  const d = new Date(ms)
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0')
  ].join('-')
}

/** 本地时区当天 24:00（即次日 00:00）的 epoch ms */
function endOfLocalDay(ms: number): number {
  const d = new Date(ms)
  d.setHours(24, 0, 0, 0)
  return d.getTime()
}

/**
 * 扫描 logs/ 目录抽出会话。
 * 会话开始 = 文件名时间戳，结束 = 该组日志的最大 mtime。
 */
export async function collectSessions(logDir: string): Promise<SessionSpan[]> {
  let entries
  try {
    entries = await readdir(logDir, { withFileTypes: true })
  } catch {
    return []
  }

  // 同一时间戳前缀的多个日志属于同一次会话，取其中最大的 mtime 作为结束
  const spans = new Map<number, number>()

  await Promise.all(
    entries.map(async (entry) => {
      if (!entry.isFile()) return
      const m = LOG_NAME.exec(entry.name)
      if (!m) return
      const startMs = Number(m[1]) * 1000
      if (!Number.isFinite(startMs) || startMs <= 0) return
      try {
        const { mtimeMs } = await stat(join(logDir, entry.name))
        spans.set(startMs, Math.max(spans.get(startMs) ?? 0, mtimeMs))
      } catch {
        /* 单个文件读不到就跳过 */
      }
    })
  )

  return [...spans.entries()]
    .map(([startMs, endMs]) => ({ startMs, endMs: Math.max(endMs, startMs) }))
    .filter((s) => s.endMs > s.startMs)
    .sort((a, b) => a.startMs - b.startMs)
}

/**
 * 把会话按本地日期归档，跨天的会话拆开算进每一天。
 */
export function aggregateByDay(sessions: SessionSpan[]): Map<string, DayActivity> {
  const days = new Map<string, DayActivity>()
  const bump = (key: string): DayActivity => {
    let d = days.get(key)
    if (!d) {
      d = { date: key, sessions: 0, minutes: 0 }
      days.set(key, d)
    }
    return d
  }

  for (const { startMs, endMs } of sessions) {
    bump(dayKey(startMs)).sessions += 1

    // 跨天时长按天切开，否则 23:00~01:00 的整场都会记到前一天
    let cursor = startMs
    while (cursor < endMs) {
      const segEnd = Math.min(endOfLocalDay(cursor), endMs)
      bump(dayKey(cursor)).minutes += (segEnd - cursor) / 60000
      cursor = segEnd
    }
  }

  return days
}

/** 扫描 osu! 的 logs/ 目录，产出每日游玩活跃度 */
export async function scanPlayActivity(logDir: string): Promise<DayActivity[]> {
  const sessions = await collectSessions(logDir)
  return [...aggregateByDay(sessions).values()].sort((a, b) => a.date.localeCompare(b.date))
}
