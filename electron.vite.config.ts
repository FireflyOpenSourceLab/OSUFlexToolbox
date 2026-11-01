import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // 构建时不清空 outDir，避免批量删除被安全策略拦截（产物直接覆盖写入）
  main: { build: { emptyOutDir: false } },
  preload: { build: { emptyOutDir: false } },
  renderer: {
    build: { emptyOutDir: false },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        // shadcn/ui 约定别名：@/ -> 渲染进程源码根目录
        '@': resolve('src/renderer/src')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
