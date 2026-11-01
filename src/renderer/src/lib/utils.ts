/**
 * 组件类名合并工具。
 * shadcn v4 官方已将 clsx + tailwind-merge 合并为 `cn` 包，
 * 此处统一 re-export，保证 `@/lib/utils` 与 `from "cn"` 两种写法一致。
 */
export { cn, clsx, twMerge, twJoin } from 'cn'
export type { ClassValue } from 'cn'
