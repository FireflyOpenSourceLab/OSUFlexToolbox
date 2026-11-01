import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type ThemeChoice = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  /** 用户选的主题，system = 跟随系统 */
  choice: ThemeChoice
  setChoice: (c: ThemeChoice) => void
  /** 最终生效的主题（system 会解析成当前系统偏好） */
  resolved: ResolvedTheme
}

const STORAGE_KEY = 'osuflextoolbox.theme'

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStored(): ThemeChoice {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
  } catch {
    return 'system'
  }
}

/** 亮暗色主题：默认跟随系统，选择持久化到 localStorage，样式走 <html> 上的 .dark */
export function ThemeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [choice, setChoiceState] = useState<ThemeChoice>(readStored)
  const [systemDark, setSystemDark] = useState<boolean>(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  // 系统主题变化时，跟随系统那一档要实时响应
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent): void => setSystemDark(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  const resolved: ResolvedTheme =
    choice === 'system' ? (systemDark ? 'dark' : 'light') : choice

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
  }, [resolved])

  // 同步 OS 层主题：Windows 的窗口控件要跟着应用亮暗色走，否则会不协调
  useEffect(() => {
    window.api?.theme?.set(choice)?.catch(() => {
      /* 同步失败不影响应用内主题 */
    })
  }, [choice])

  const value = useMemo<ThemeContextValue>(
    () => ({
      choice,
      resolved,
      setChoice: (c) => {
        setChoiceState(c)
        try {
          localStorage.setItem(STORAGE_KEY, c)
        } catch {
          /* localStorage 不可用时忽略持久化 */
        }
      }
    }),
    [choice, resolved]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme 必须在 <ThemeProvider> 内使用')
  return ctx
}
