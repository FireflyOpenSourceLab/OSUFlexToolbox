import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type ThemeChoice } from '@/contexts/theme-context'
import { SidebarMenuButton } from '@/components/ui/sidebar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const OPTIONS: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: '跟随系统', icon: Monitor },
  { value: 'light', label: '亮色', icon: Sun },
  { value: 'dark', label: '暗色', icon: Moon }
]

/**
 * 侧边栏底部的外观入口：点击弹出对话框，用下拉选择亮/暗/跟随系统。
 * 主题有三态，二元开关表达不了，所以是按钮 + 对话框的组合。
 */
export function ThemeDialog(): React.JSX.Element {
  const { choice, setChoice } = useTheme()
  const ActiveIcon = OPTIONS.find((o) => o.value === choice)?.icon ?? Monitor

  return (
    <Dialog>
      <DialogTrigger asChild>
        <SidebarMenuButton tooltip="外观">
          <ActiveIcon />
          <span>外观</span>
        </SidebarMenuButton>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>外观</DialogTitle>
          <DialogDescription>选择界面主题，默认跟随系统。</DialogDescription>
        </DialogHeader>

        <Select value={choice} onValueChange={(v) => setChoice(v as ThemeChoice)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="选择主题" />
          </SelectTrigger>
          <SelectContent>
            {OPTIONS.map(({ value, label, icon: Icon }) => (
              <SelectItem key={value} value={value}>
                <span className="flex items-center gap-2">
                  <Icon className="size-4" />
                  {label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DialogContent>
    </Dialog>
  )
}
