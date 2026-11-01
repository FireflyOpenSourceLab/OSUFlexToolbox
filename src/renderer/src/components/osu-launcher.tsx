import { useEffect, useState } from 'react'
import { Loader2, Play } from 'lucide-react'
import type { OsuInstance } from '../../../shared/osu'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

/**
 * 标题栏右端的 osu! 启动器：下拉切换实例 + Play 启动。
 * 实例由主进程探测（Windows: lazer + stable；macOS: 仅 lazer）。
 */
export function OsuLauncher(): React.JSX.Element {
  const [instances, setInstances] = useState<OsuInstance[]>([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(true)
  const [launching, setLaunching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    window.api.osu
      .detect()
      .then((found) => {
        if (cancelled) return
        setInstances(found)
        // 默认选中第一个探测到的实例
        if (found[0]) setSelected(found[0].executable)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '探测 osu! 失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleLaunch = async (): Promise<void> => {
    if (!selected || launching) return
    setLaunching(true)
    setError(null)
    try {
      const err = await window.api.osu.launch(selected)
      if (err) setError(err)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '启动失败')
    } finally {
      setLaunching(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Select value={selected} onValueChange={setSelected} disabled={instances.length === 0}>
        <SelectTrigger size="sm" className="h-7 w-[132px] text-xs">
          <SelectValue placeholder={loading ? '探测中…' : '未检测到 osu!'} />
        </SelectTrigger>
        <SelectContent>
          {instances.map((inst) => (
            <SelectItem key={inst.executable} value={inst.executable}>
              {inst.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        size="sm"
        className="h-7 gap-1 px-2.5 text-xs"
        disabled={!selected || launching}
        onClick={handleLaunch}
      >
        {launching ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
        Play
      </Button>

      {error ? (
        <span className="max-w-[200px] truncate text-xs text-destructive" title={error}>
          {error}
        </span>
      ) : null}
    </div>
  )
}
