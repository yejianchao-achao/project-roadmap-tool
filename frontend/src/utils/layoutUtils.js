/**
 * 布局工具函数模块
 * 处理项目块的位置计算和重叠检测
 */
import dayjs from 'dayjs'

/**
 * 计算项目块的位置和尺寸
 * @param {Object} project - 项目对象
 * @param {Object} timelineParams - 时间轴参数
 * @returns {Object} 位置和尺寸 {left, width}
 */
export function calculateProjectBarPosition(project, timelineParams) {
  const { minDate, pixelsPerDay } = timelineParams
  
  // 计算起始位置（相对于时间轴起点的偏移）
  const startOffset = dayjs(project.startDate).diff(minDate, 'day')
  const left = startOffset * pixelsPerDay
  
  // 计算宽度（项目持续天数）
  const duration = dayjs(project.endDate).diff(project.startDate, 'day') + 1 // +1 包含结束日
  const width = duration * pixelsPerDay
  
  return { left, width }
}

/**
 * 检测两个项目的时间是否重叠
 * @param {Object} p1 - 项目1
 * @param {Object} p2 - 项目2
 * @returns {boolean} 是否重叠
 */
export function isTimeOverlap(p1, p2) {
  const start1 = dayjs(p1.startDate)
  const end1 = dayjs(p1.endDate)
  const start2 = dayjs(p2.startDate)
  const end2 = dayjs(p2.endDate)
  
  // 两个时间段重叠的条件：start1 < end2 && start2 < end1
  return start1.isBefore(end2) && start2.isBefore(end1)
}

/**
 * 为项目分配行号（避免重叠）
 * 使用贪心算法，尽量将项目放在较低的行
 * @param {Array} projects - 同一产品线的项目列表
 * @returns {Array} 带行号的项目列表
 */
export function assignRows(projects) {
  if (!projects || projects.length === 0) {
    return []
  }
  
  // 按开始时间排序
  const sorted = [...projects].sort((a, b) => 
    dayjs(a.startDate).diff(dayjs(b.startDate))
  )
  
  const result = []
  
  for (const project of sorted) {
    let row = 0
    
    // 找到第一个不冲突的行
    while (true) {
      // 检查当前行是否有冲突
      const conflicts = result.filter(p => 
        p.row === row && isTimeOverlap(p, project)
      )
      
      if (conflicts.length === 0) {
        // 没有冲突，分配到这一行
        result.push({ ...project, row })
        break
      }
      
      // 有冲突，尝试下一行
      row++
    }
  }
  
  return result
}

/**
 * 按产品线分组项目
 * @param {Array} projects - 项目列表
 * @param {Array} productLines - 产品线列表
 * @returns {Object} 按产品线ID分组的项目对象
 */
export function groupProjectsByProductLine(projects, productLines) {
  const grouped = {}
  
  // 初始化所有产品线的分组
  productLines.forEach(pl => {
    grouped[pl.id] = {
      productLine: pl,
      projects: []
    }
  })
  
  // 将项目分配到对应的产品线
  projects.forEach(project => {
    if (grouped[project.productLineId]) {
      grouped[project.productLineId].projects.push(project)
    }
  })
  
  return grouped
}

/**
 * 计算产品线泳道的高度
 * @param {Array} projects - 该产品线的项目列表（已分配行号）
 * @param {number} barHeight - 项目块高度（默认40）
 * @param {number} barMargin - 项目块间距（默认8）
 * @returns {number} 泳道高度（像素）
 */
export function calculateSwimlaneHeight(projects, barHeight = 40, barMargin = 8) {
  if (!projects || projects.length === 0) {
    return barHeight + barMargin * 2 // 最小高度
  }
  
  // 找出最大的行号
  const maxRow = Math.max(...projects.map(p => p.row || 0))
  
  // 高度 = (行数 * (块高度 + 间距)) + 顶部间距 + 底部间距
  return (maxRow + 1) * (barHeight + barMargin) + barMargin
}
