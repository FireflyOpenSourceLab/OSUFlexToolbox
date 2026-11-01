/**
 * 谱面扫描（纯逻辑，不依赖 Electron）——主进程与测试脚本共用。
 *
 * lazer 把 .osu 存成 content-addressed 散列文件，文件名认不出类型，
 * 但内容仍以 `osu file format v` 开头，读文件头即可识别并取出 Mode 字段。
 */
import { open, readdir, stat } from 'fs/promises'
import { join } from 'path'
import type { BeatmapStats, OsuEdition, OsuMode } from './osu'

const MODE_BY_CODE: Record<number, OsuMode> = { 0: 'osu', 1: 'taiko', 2: 'catch', 3: 'mania' }

export function emptyStats(): BeatmapStats {
  return {
    total: 0,
    byMode: { osu: 0, taiko: 0, catch: 0, mania: 0 },
    sizeBytes: 0
  }
}

/** 解析单个 .osu 文件的游戏模式；不是 .osu 内容（音频/图片等）返回 null */
export async function readBeatmapMode(filePath: string): Promise<OsuMode | null> {
  try {
    const fh = await open(filePath, 'r')
    try {
      const buf = Buffer.alloc(1024)
      const { bytesRead } = await fh.read(buf, 0, 1024, 0)
      const head = buf.subarray(0, bytesRead).toString('utf8')
      if (!/^osu file format v/i.test(head)) return null
      const m = head.match(/^Mode:\s*(\d+)/m)
      // 未写 Mode 字段的老谱面默认是 osu!standard
      return m ? (MODE_BY_CODE[Number(m[1])] ?? 'osu') : 'osu'
    } finally {
      await fh.close()
    }
  } catch {
    return null
  }
}

/** 递归收集目录下所有文件路径 */
async function collectFiles(dir: string, out: string[], depth = 0): Promise<void> {
  if (depth > 8) return
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      await collectFiles(full, out, depth + 1)
    } else if (entry.isFile()) {
      out.push(full)
    }
  }
}

/** 有限并发映射，避免一次性打开几千个文件句柄 */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++
      results[i] = await fn(items[i])
    }
  })
  await Promise.all(workers)
  return results
}

/**
 * 统计指定谱面目录的谱面数量（按模式）与占用空间。
 * stable → <安装目录>/Songs（.osu 是普通文件，按扩展名筛）
 * lazer  → 数据目录/files（散列文件，逐个读头识别）
 *
 * 模式解析与取大小合并成一趟并行完成：逐文件串行 stat 会让几万个文件等很久。
 */
export async function scanBeatmaps(beatmapDir: string, edition: OsuEdition): Promise<BeatmapStats> {
  const stats = emptyStats()
  const files: string[] = []
  await collectFiles(beatmapDir, files)

  const isCandidate = (f: string): boolean =>
    // stable 的 Songs/ 下 .osu 是普通文件，可按扩展名筛掉音频图片；
    // lazer 的 files/ 是散列文件，每个都得读头判断
    edition !== 'stable' || f.toLowerCase().endsWith('.osu')

  await mapLimit(files, 64, async (f) => {
    const [mode, size] = await Promise.all([
      isCandidate(f) ? readBeatmapMode(f) : Promise.resolve(null),
      stat(f)
        .then((s) => s.size)
        .catch(() => 0)
    ])
    if (mode) {
      stats.byMode[mode] += 1
      stats.total += 1
    }
    stats.sizeBytes += size
  })

  return stats
}
