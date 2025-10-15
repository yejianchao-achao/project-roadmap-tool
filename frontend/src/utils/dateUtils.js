/**
 * 日期工具函数模块
 * 处理时间轴相关的日期计算
 */
import dayjs from 'dayjs'
import minMax from 'dayjs/plugin/minMax'
import { 
  PIXELS_PER_DAY, 
  TIMELINE_TOTAL_MONTHS_BEFORE, 
  TIMELINE_TOTAL_MONTHS_AFTER 
} from './constants'

// 扩展dayjs以支持min/max方法
dayjs.extend(minMax)

/**
 * 计算时间轴渲染参数
 * 显示全年时间范围（当前月前后各6个月，共12个月）
 * 注意：pixelsPerDay 和 totalWidth 由调用方动态计算
 * @param {Array} projects - 项目列表（暂未使用，保留用于未来扩展）
 * @returns {Object} 时间轴基础参数（不包含 pixelsPerDay 和 totalWidth）
 */
export function calculateTimelineParams(projects) {
  // 基于当前月份计算全年时间范围
  const now = dayjs()
  const minDate = now.subtract(TIMELINE_TOTAL_MONTHS_BEFORE, 'month').startOf('month')
  const maxDate = now.add(TIMELINE_TOTAL_MONTHS_AFTER, 'month').endOf('month')
  
  // 计算总天数
  const totalDays = maxDate.diff(minDate, 'day')
  
  return {
    minDate,
    maxDate,
    totalDays
  }
}

/**
 * 生成月份刻度
 * @param {Object} timelineParams - 时间轴参数
 * @returns {Array} 月份刻度数组
 */
export function generateMonthTicks(timelineParams) {
  const { minDate, maxDate, pixelsPerDay } = timelineParams
  const ticks = []
  
  let current = minDate.startOf('month')
  
  while (current.isBefore(maxDate) || current.isSame(maxDate, 'month')) {
    const offset = current.diff(minDate, 'day') * pixelsPerDay
    const daysInMonth = current.daysInMonth()
    const width = daysInMonth * pixelsPerDay
    
    ticks.push({
      date: current.format('YYYY-MM'),
      label: current.format('YYYY年MM月'),
      offset,
      width,
      year: current.year(),
      month: current.month() + 1
    })
    
    current = current.add(1, 'month')
  }
  
  return ticks
}

/**
 * 生成周刻度网格线位置
 * @param {Object} timelineParams - 时间轴参数
 * @returns {Array} 周刻度位置数组（像素值）
 */
export function generateWeekGridLines(timelineParams) {
  const { minDate, maxDate, pixelsPerDay } = timelineParams
  const lines = []
  
  let current = minDate.startOf('week')
  
  while (current.isBefore(maxDate)) {
    const offset = current.diff(minDate, 'day') * pixelsPerDay
    if (offset >= 0) {
      lines.push(offset)
    }
    current = current.add(1, 'week')
  }
  
  return lines
}

/**
 * 格式化日期为显示文本
 * @param {string} dateStr - 日期字符串 (YYYY-MM-DD)
 * @returns {string} 格式化后的日期文本
 */
export function formatDate(dateStr) {
  return dayjs(dateStr).format('YYYY年MM月DD日')
}

/**
 * 计算两个日期之间的天数
 * @param {string} startDate - 开始日期 (YYYY-MM-DD)
 * @param {string} endDate - 结束日期 (YYYY-MM-DD)
 * @returns {number} 天数
 */
export function getDaysBetween(startDate, endDate) {
  return dayjs(endDate).diff(dayjs(startDate), 'day')
}
