import { useEffect, useState } from 'react'
import type { DayActivity } from '../../../../shared/heatmap'
import type { BeatmapStats, OsuMode } from '../../../../shared/osu'
import { useOsu } from '@/contexts/osu-context'
import { PlayHeatmap } from '@/components/play-heatmap'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

const MODE_LABELS: Record<OsuMode, string> = {
  osu: 'osu!standard',
  taiko: 'osu!taiko',
  catch: 'osu!catch',
  mania: 'osu!mania'
}

const MODES = Object.keys(MODE_LABELS) as OsuMode[]

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** i
  return `${value.toFixed(i === 0 || value >= 100 ? 0 : 1)} ${units[i]}`
}

function formatPercent(used: number, total: number): string {
  if (total <= 0) return '—'
  const pct = (used / total) * 100
  if (pct > 0 && pct < 0.01) return '<0.01%'
  return `${pct.toFixed(2)}%`
}

/** 占用百分比（0-100），给进度条用 */
function percentOf(used: number, total: number): number {
  if (total <= 0) return 0
  return Math.min((used / total) * 100, 100)
}

/** 大数字：加载中显示骨架，否则显示格式化后的值 */
function StatValue({ loading, value }: { loading: boolean; value: string }): React.JSX.Element {
  if (loading) return <Skeleton className="h-9 w-24" />
  return <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
}

export default function HomePage(): React.JSX.Element {
  const { selected, detecting } = useOsu()
  const [stats, setStats] = useState<BeatmapStats | null>(null)
  const [diskTotal, setDiskTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [activity, setActivity] = useState<DayActivity[]>([])
  const [activityLoading, setActivityLoading] = useState(false)

  useEffect(() => {
    const api = window.api?.osu
    if (!selected || !api) {
      setStats(null)
      setDiskTotal(null)
      return
    }
    let cancelled = false
    setLoading(true)
    Promise.all([api.beatmaps(selected.executable), api.disk(selected.executable)])
      .then(([beatmaps, disk]) => {
        if (cancelled) return
        setStats(beatmaps)
        setDiskTotal(disk.totalBytes)
      })
      .catch(() => {
        if (cancelled) return
        setStats(null)
        setDiskTotal(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selected])

  // 热力图只读 logs/ 目录，很快，单独请求不必陪谱面扫描一起等
  useEffect(() => {
    const api = window.api?.osu
    if (!selected || !api) {
      setActivity([])
      return
    }
    let cancelled = false
    setActivityLoading(true)
    api
      .heatmap(selected.executable)
      .then((rows) => {
        if (!cancelled) setActivity(rows)
      })
      .catch(() => {
        if (!cancelled) setActivity([])
      })
      .finally(() => {
        if (!cancelled) setActivityLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selected])

  const scanning = detecting || loading

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-semibold">主页</h1>
        <p className="text-sm text-muted-foreground">
          {selected ? selected.label : '未选择 osu! 实例'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* 谱面总数：当前选中实例里四种模式的谱面数 */}
        <Card>
          <CardHeader>
            <CardDescription>谱面总数</CardDescription>
            <StatValue loading={scanning} value={(stats?.total ?? 0).toLocaleString()} />
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              {MODES.map((mode) => (
                <div key={mode} className="flex items-baseline justify-between gap-2">
                  <dt>{MODE_LABELS[mode]}</dt>
                  <dd className="tabular-nums">{(stats?.byMode[mode] ?? 0).toLocaleString()}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        {/* 占用空间 */}
        <Card>
          <CardHeader>
            <CardDescription>谱面占用空间</CardDescription>
            <StatValue loading={scanning} value={formatBytes(stats?.sizeBytes ?? 0)} />
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-xs leading-relaxed text-muted-foreground">
              这些谱面占您电脑 {formatPercent(stats?.sizeBytes ?? 0, diskTotal ?? 0)} 存储空间
            </p>
            <Progress value={percentOf(stats?.sizeBytes ?? 0, diskTotal ?? 0)} />
          </CardContent>
        </Card>

        {/* 账号 PP：暂未接入 osu! API */}
        <Card>
          <CardHeader>
            <CardDescription>账号 PP</CardDescription>
            <StatValue loading={false} value="0 pp" />
          </CardHeader>
          <CardContent>
            <p className="text-xs leading-relaxed text-muted-foreground">请认证后才显示 pp</p>
          </CardContent>
        </Card>
      </div>

      {/* 游玩热力图 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">游玩热力图</CardTitle>
          <CardDescription>最近 53 周的每日游玩时长</CardDescription>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <Skeleton className="h-[136px] w-full" />
          ) : (
            <PlayHeatmap data={activity} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
