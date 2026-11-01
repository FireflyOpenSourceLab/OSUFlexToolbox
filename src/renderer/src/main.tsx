import './assets/globals.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// 标记平台，供 CSS 判断窗口控件位置：
// macOS 红绿灯在左上、右端无遮挡；Windows/Linux 三大件在右上，必须让开。
const platform = window.electron?.process?.platform
if (platform) document.documentElement.dataset.platform = platform

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
