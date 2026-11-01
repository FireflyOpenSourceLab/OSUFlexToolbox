/** osu! 实例的类型定义 —— 主进程与 preload 共用，避免两边声明漂移 */
export type OsuEdition = 'lazer' | 'stable'

export interface OsuInstance {
  edition: OsuEdition
  label: string
  executable: string
  /**
   * 谱面所在目录。
   * stable → <安装目录>/Songs
   * lazer  → 用户数据目录下的 files/（内容寻址存储，含谱面素材）
   */
  beatmapDir: string
}

/** 四种游戏模式，与 .osu 文件里 Mode 字段一一对应 */
export type OsuMode = 'osu' | 'taiko' | 'catch' | 'mania'

export interface BeatmapStats {
  /** 谱面总数（即 .osu 文件数，等于各模式之和） */
  total: number
  byMode: Record<OsuMode, number>
  /** 谱面占用的磁盘字节数 */
  sizeBytes: number
}
