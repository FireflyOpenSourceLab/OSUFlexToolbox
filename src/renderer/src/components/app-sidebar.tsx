import { House, Library, Music, Palette, Settings } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from '@/components/ui/sidebar'

export type NavKey = 'home' | 'skins' | 'beatmaps' | 'resources' | 'settings'

interface NavItem {
  key: NavKey
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: '主页', icon: House },
  { key: 'skins', label: '皮肤', icon: Palette },
  { key: 'beatmaps', label: '谱面', icon: Music },
  { key: 'resources', label: '资源中心', icon: Library }
]

export function AppSidebar({
  active,
  onSelect
}: {
  active: NavKey
  onSelect: (key: NavKey) => void
}): React.JSX.Element {
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>功能</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
                <SidebarMenuItem key={key}>
                  <SidebarMenuButton
                    isActive={active === key}
                    tooltip={label}
                    onClick={() => onSelect(key)}
                  >
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={active === 'settings'}
              tooltip="设置"
              onClick={() => onSelect('settings')}
            >
              <Settings />
              <span>设置</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
