import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AppSidebar, type NavKey } from '@/components/app-sidebar'
import { OsuLauncher } from '@/components/osu-launcher'
import { OsuProvider } from '@/contexts/osu-context'
import { ThemeProvider } from '@/contexts/theme-context'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import BmPage from '@/components/pages/bm'
import HomePage from '@/components/pages/home'
import SettingsPage from '@/components/pages/settings'
import SkinPage from '@/components/pages/skin'
import SourcePage from '@/components/pages/source'

const PAGE_TITLES: Record<NavKey, string> = {
  home: '主页',
  skins: '皮肤',
  beatmaps: '谱面',
  resources: '资源中心',
  settings: '设置'
}

// NavKey <-> 路径：home 落在根路径，其余为 /<key>，互转无需映射表
const pathOf = (key: NavKey): string => (key === 'home' ? '/' : `/${key}`)

const keyOf = (pathname: string): NavKey => {
  const seg = pathname.replace(/^\//, '')
  return seg && seg in PAGE_TITLES ? (seg as NavKey) : 'home'
}

function Shell(): React.JSX.Element {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const active = keyOf(pathname)

  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full flex-col">
        {/* 全宽标题栏：WCO 环境变量自动避让 macOS 红绿灯与 Windows 三大件 */}
        <header className="app-header">
          <SidebarTrigger className="ml-1" />
          <span className="truncate text-sm font-medium text-muted-foreground">
            {PAGE_TITLES[active]}
          </span>
          {/* ml-auto 顶到右端；标题栏的 padding-right 已为 Windows/Linux 三大件留出空间 */}
          <div className="ml-auto mr-1">
            <OsuLauncher />
          </div>
        </header>

        <div className="flex flex-1">
          <AppSidebar active={active} onSelect={(key) => navigate(pathOf(key))} />

          <SidebarInset>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/skins" element={<SkinPage />} />
              <Route path="/beatmaps" element={<BmPage />} />
              <Route path="/resources" element={<SourcePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              {/* 未匹配路径一律回落 home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  )
}

function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <OsuProvider>
        <HashRouter>
          <Shell />
        </HashRouter>
      </OsuProvider>
    </ThemeProvider>
  )
}

export default App
