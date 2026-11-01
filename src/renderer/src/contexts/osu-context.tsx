import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { OsuInstance } from '../../../shared/osu'

interface OsuContextValue {
  /** 本机探测到的 osu! 实例 */
  instances: OsuInstance[]
  /** 当前选中的实例，未探测到任何实例时为 null */
  selected: OsuInstance | null
  /** 按 executable 切换选中实例 */
  select: (executable: string) => void
  /** 探测是否仍在进行 */
  detecting: boolean
}

const OsuContext = createContext<OsuContextValue | null>(null)

/**
 * 标题栏的启动器与主页仪表盘都要读「当前选中的 osu! 实例」，
 * 用 Context 共享，避免把状态提到 Router 之上再层层透传。
 */
export function OsuProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [instances, setInstances] = useState<OsuInstance[]>([])
  const [selectedExe, setSelectedExe] = useState('')
  const [detecting, setDetecting] = useState(true)

  useEffect(() => {
    let cancelled = false
    const api = window.api?.osu
    if (!api) {
      // preload 未就绪：不抛错，避免整棵树卸载成白屏
      setDetecting(false)
      return
    }
    api
      .detect()
      .then((found) => {
        if (cancelled) return
        setInstances(found)
        if (found[0]) setSelectedExe(found[0].executable)
      })
      .catch(() => {
        /* 探测失败时保持空列表，界面显示「未检测到」 */
      })
      .finally(() => {
        if (!cancelled) setDetecting(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<OsuContextValue>(
    () => ({
      instances,
      selected: instances.find((i) => i.executable === selectedExe) ?? null,
      select: setSelectedExe,
      detecting
    }),
    [instances, selectedExe, detecting]
  )

  return <OsuContext.Provider value={value}>{children}</OsuContext.Provider>
}

export function useOsu(): OsuContextValue {
  const ctx = useContext(OsuContext)
  if (!ctx) throw new Error('useOsu 必须在 <OsuProvider> 内使用')
  return ctx
}
