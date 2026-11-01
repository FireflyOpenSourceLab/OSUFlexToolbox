import type { DayActivity } from '../../../shared/heatmap'

/** 展示最近多少周（GitHub 贡献图同款 53 周 / 一年） */
const WEEKS = 53

/** 5 档强度，用 primary 的透明度，天然适配深浅色主题 */
const LEVEL_CLASS = ['bg-primary/5', 'bg-primary/20', 'bg-primary/45', 'bg-primary/70', 'bg-primary']

const WEEKDAY_LABELS: Record<number, string> = { 0: '周一', 2: '周三', 4: '周五' }

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

/** 本周的周一（本地时区） */
function mondayOf(d: Date): Date {
  const x = startOfDay(d)
  return addDays(x, -((x.getDay() + 6) % 7))
}

function dayKey(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0')
  ].join('-')
}

/** 相对当日峰值分 5 档 */
function levelOf(minutes: number, max: number): number {
  if (minutes <= 0 || max <= 0) return 0
  const ratio = minutes / max
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

/**
 * 游玩热力图：按天归档游玩时长，行是周一~周日，列是最近 53 周。
 * 数据由主进程从 osu! 的 logs/ 目录解析。
 */
export function PlayHeatmap({ data }: { data: DayActivity[] }): React.JSX.Element {
  const byDate = new Map(data.map((d) => [d.date, d]))
  const max = data.reduce((m, d) => Math.max(m, d.minutes), 0)

  const thisMonday = mondayOf(new Date())
  const firstMonday = addDays(thisMonday, -(WEEKS - 1) * 7)

  // 列 = 周，行 = 周内第几天（0 = 周一）
  const columns = Array.from({ length: WEEKS }, (_, w) => {
    const month = addDays(firstMonday, w * 7).getMonth()
    return {
      month,
      days: Array.from({ length: 7 }, (_, d) => addDays(firstMonday, w * 7 + d))
    }
  })

  const totalMinutes = data.reduce((s, d) => s + d.minutes, 0)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {/* 周内标签 */}
        <div className="flex flex-col gap-[2px] pt-[18px] text-[10px] leading-none text-muted-foreground">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} className="flex h-2.5 items-center">
              {WEEKDAY_LABELS[i] ?? ''}
            </span>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-[2px] overflow-x-auto">
          {/* 月份标签 */}
          <div className="flex gap-[2px] text-[10px] leading-none text-muted-foreground">
            {columns.map((col, w) => (
              <span key={w} className="w-2.5 shrink-0">
                {/* 只在月份变化的那列显示，避免挤在一起 */}
                {w === 0 || columns[w - 1].month !== col.month ? MONTH_LABELS[col.month] : ''}
              </span>
            ))}
          </div>

          {/* 日历网格 */}
          <div className="flex gap-[2px]">
            {columns.map((col, w) => (
              <div key={w} className="flex shrink-0 flex-col gap-[2px]">
                {col.days.map((d) => {
                  const key = dayKey(d)
                  const act = byDate.get(key)
                  const level = levelOf(act?.minutes ?? 0, max)
                  return (
                    <div
                      key={key}
                      title={`${key}${act ? ` · ${Math.round(act.minutes)} 分钟 · ${act.sessions} 次会话` : ''}`}
                      className={`size-2.5 rounded-[2px] ${LEVEL_CLASS[level]}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 图例 */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>共 {Math.round(totalMinutes / 60)} 小时</span>
        <span className="ml-auto">少</span>
        {LEVEL_CLASS.map((cls, i) => (
          <span key={i} className={`size-2.5 rounded-[2px] ${cls}`} />
        ))}
        <span>多</span>
      </div>
    </div>
  )
}
