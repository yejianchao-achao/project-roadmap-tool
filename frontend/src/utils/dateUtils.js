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

/**
 * 根据范围类型计算自定义时间轴参数
 * @param {string} rangeType - 范围类型: '3months' | '6months' | '1year' | 'custom'
 * @param {object} customRange - 自定义范围 { startDate, endDate }（仅当rangeType为'custom'时使用）
 * @returns {object} { minDate, maxDate, totalDays }
 */
export function calculateCustomTimelineParams(rangeType, customRange) {
  const now = dayjs()
  let minDate, maxDate
  
  switch (rangeType) {
    case '3months':
      // 当前月前后各1.5个月（共3个月）
      minDate = now.subtract(1.5, 'month').startOf('month')
      maxDate = now.add(1.5, 'month').endOf('month')
      break
      
    case '6months':
      // 当前月前后各3个月（共6个月）
      minDate = now.subtract(3, 'month').startOf('month')
      maxDate = now.add(3, 'month').endOf('month')
      break
      
    case '1year':
      // 当前月前6个月，后5个月（共12个月）
      minDate = now.subtract(6, 'month').startOf('month')
      maxDate = now.add(5, 'month').endOf('month')
      break
      
    case 'custom':
      if (!customRange || !customRange.startDate || !customRange.endDate) {
        // 如果自定义范围无效，回退到默认1年
        console.warn('自定义范围无效，使用默认1年范围')
        minDate = now.subtract(6, 'month').startOf('month')
        maxDate = now.add(5, 'month').endOf('month')
      } else {
        minDate = dayjs(customRange.startDate).startOf('month')
        maxDate = dayjs(customRange.endDate).endOf('month')
      }
      break
      
    default:
      // 默认1年
      minDate = now.subtract(6, 'month').startOf('month')
      maxDate = now.add(5, 'month').endOf('month')
  }
  
  const totalDays = maxDate.diff(minDate, 'day')
  
  return {
    minDate,
    maxDate,
    totalDays
  }
}

/**
 * 获取所有项目的时间范围
 * @param {Array} projects - 项目列表
 * @returns {object|null} { minDate, maxDate } 或 null（无项目时）
 */
export function getProjectsDateRange(projects) {
  if (!projects || projects.length === 0) {
    return null
  }
  
  const dates = projects.flatMap(p => [
    dayjs(p.startDate),
    dayjs(p.endDate)
  ])
  
  const minDate = dayjs.min(dates)
  const maxDate = dayjs.max(dates)
  
  return {
    minDate: minDate.format('YYYY-MM-DD'),
    maxDate: maxDate.format('YYYY-MM-DD')
  }
}

/**
 * 验证日期范围的有效性
 * @param {string} startDate - 开始日期 (YYYY-MM-DD)
 * @param {string} endDate - 结束日期 (YYYY-MM-DD)
 * @returns {object} { valid: boolean, error?: string, warning?: string }
 */
export function validateDateRange(startDate, endDate) {
  const start = dayjs(startDate)
  const end = dayjs(endDate)
  
  // 检查日期有效性
  if (!start.isValid() || !end.isValid()) {
    return { valid: false, error: '日期格式无效' }
  }
  
  // 检查开始日期 < 结束日期
  if (!start.isBefore(end)) {
    return { valid: false, error: '开始日期必须早于结束日期' }
  }
  
  // 检查最小跨度（1个月）
  const monthsDiff = end.diff(start, 'month')
  if (monthsDiff < 1) {
    return { valid: false, error: '时间范围至少需要1个月' }
  }
  
  // 检查最大跨度（5年）
  const yearsDiff = end.diff(start, 'year', true)
  if (yearsDiff > 5) {
    return { 
      valid: true, 
      warning: '时间范围超过5年，可能影响性能' 
    }
  }
  
  return { valid: true }
}
