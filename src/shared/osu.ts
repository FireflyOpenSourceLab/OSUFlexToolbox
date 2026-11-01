/** osu! 实例的类型定义 —— 主进程与 preload 共用，避免两边声明漂移 */
export type OsuEdition = 'lazer' | 'stable'

export interface OsuInstance {
  edition: OsuEdition
  label: string
  executable: string
}
