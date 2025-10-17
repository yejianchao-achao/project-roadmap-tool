/**
 * 常量定义模块
 * 定义项目中使用的常量
 */

/**
 * 项目状态颜色映射
 * 用于时间轴上项目块的颜色显示
 */
export const STATUS_COLORS = {
  '规划': '#9DC3E6',  // 浅蓝色
  '方案': '#5B9BD5',  // 蓝色
  '设计': '#548235',  // 绿色
  '开发': '#FFC000',  // 黄色
  '测试': '#ED7D31',  // 橙色
  '已上': '#EA3A57',  // 深红色
  '暂停': '#808080'   // 灰色（暂停状态使用虚线边框）
}

/**
 * 项目状态列表
 * 用于下拉选择器
 */
export const PROJECT_STATUSES = [
  '规划',
  '方案',
  '设计',
  '开发',
  '测试',
  '已上',
  '暂停'
]

/**
 * 时间轴像素比例
 * 每天对应的像素数（固定值）
 */
export const PIXELS_PER_DAY = 5

/**
 * 时间轴总时间范围配置
 * 显示全年的时间范围，用户可以滚动查看
 */
export const TIMELINE_TOTAL_MONTHS_BEFORE = 6  // 当前月之前6个月
export const TIMELINE_TOTAL_MONTHS_AFTER = 5   // 当前月之后5个月（总共12个月）

/**
 * 时间窗口（视口）配置
 * 默认在视口中显示的月份数量
 */
export const DEFAULT_VISIBLE_MONTHS = 4  // 默认显示4个月

/**
 * 缩放范围：可显示的月份数量
 */
export const MIN_VISIBLE_MONTHS = 2
export const MAX_VISIBLE_MONTHS = 12

/**
 * 时间轴留白（已废弃，保留用于兼容）
 * @deprecated 使用 TIMELINE_MONTHS_BEFORE 和 TIMELINE_MONTHS_AFTER 替代
 */
export const TIMELINE_PADDING_MONTHS = 2

/**
 * 项目块高度（像素）
 */
export const PROJECT_BAR_HEIGHT = 40

/**
 * 项目块之间的间距（像素）
 */
export const PROJECT_BAR_MARGIN = 16

/**
 * 泳道标题宽度（像素）
 */
export const SWIMLANE_LABEL_WIDTH = 150

/**
 * 人员颜色池（20种高对比度颜色）
 * 与后端Owner.COLOR_POOL保持一致
 */
export const OWNER_COLOR_POOL = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
  '#E74C3C', '#3498DB', '#9B59B6', '#1ABC9C', '#F39C12',
  '#E67E22', '#95A5A6', '#34495E', '#16A085', '#27AE60'
]

/**
 * 看板类型
 */
export const BOARD_TYPES = {
  STATUS: 'status',  // 进度看板（按状态显示颜色）
  OWNER: 'owner'     // 人员看板（按负责人显示颜色）
}
