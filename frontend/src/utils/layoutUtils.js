/**
 * 布局工具函数模块
 * 处理项目块的位置计算和重叠检测
 */
import dayjs from 'dayjs'
import { nearestFreeRow } from './placementUtils.js'
import { PROJECT_BAR_HEIGHT, PROJECT_BAR_MARGIN, PROJECT_LABEL_HEIGHT, PROJECT_LABEL_GAP, PROJECT_LABEL_SPACING, PROJECT_BAR_NAME_PADDING } from './constants.js'

/**
 * 计算项目块的位置和尺寸
 * 保留固定像素间隔，并把跨出时间范围的部分裁剪到边界。
 * @param {Object} project - 项目对象
 * @param {Object} timelineParams - 时间轴参数
 * @returns {Object} 位置和尺寸 {left, width}
 */
export function calculateProjectBarPosition(project, timelineParams) {
  const { minDate, pixelsPerDay } = timelineParams
  
  // 计算起始位置（相对于时间轴起点的偏移）
  const startOffset = dayjs(project.startDate).diff(minDate, 'day')
  const left = Math.max(0, startOffset * pixelsPerDay)
  
  // 计算宽度（项目持续天数）
  const endOffset = dayjs(project.endDate).diff(minDate, 'day') + 1
  const right = Math.min(endOffset * pixelsPerDay, timelineParams.totalWidth ?? Infinity)
  const durationWidth = Math.max(0, right - left)
  const gap = Math.min(2, durationWidth / 4)
  const width = durationWidth - gap
  
  return { left, width }
}

export function getProjectDateLabel(project) {
  const start = dayjs(project.startDate)
  const end = dayjs(project.endDate)
  const format = start.year() === end.year() ? 'MM/DD' : 'YYYY/MM/DD'
  return start.isSame(end, 'day')
    ? start.format(format)
    : `${start.format(format)}–${end.format(format)}`
}

/**
 * 色条只表达工期，名称和日期根据实际文字宽度选择显示位置。
 * 外置名称的位置由整行布局进一步调整。
 */
export function calculateProjectBarLayout(project, timelineParams, measurement = {}) {
  const { left, width } = calculateProjectBarPosition(project, timelineParams)
  const dateLabel = getProjectDateLabel(project)
  const nameWidth = measurement.nameWidth ?? Array.from(project.name).reduce(
    (sum, character) => sum + (/[^\x00-\x7F]/.test(character) ? 13 : 7), 0
  )
  const dateWidth = measurement.dateWidth ?? dateLabel.length * 7
  const availableWidth = Math.max(0, width - (measurement.contentInset ?? 30))
  const compactWidth = Math.max(0, width - (measurement.borderInset ?? 6) - PROJECT_BAR_NAME_PADDING * 2)
  const mode = nameWidth + 2 <= availableWidth && dateWidth + 2 <= availableWidth
    ? 'full'
    : (nameWidth + 2 <= compactWidth ? 'name' : 'external')
  const layout = { left, width, mode, dateLabel, occupiedStart: left, occupiedEnd: left + width }
  if (width === 0) return { ...layout, mode: 'hidden' }

  if (mode === 'external') {
    const labelGap = 6
    const desiredWidth = Math.min(240, Math.ceil(nameWidth) + 2)
    const rightSpace = Math.max(0, (timelineParams.totalWidth ?? Infinity) - left - width - labelGap)
    const leftSpace = Math.max(0, left - labelGap)
    const labelSide = rightSpace >= desiredWidth || rightSpace >= leftSpace ? 'right' : 'left'
    const labelWidth = Math.min(desiredWidth, labelSide === 'right' ? rightSpace : leftSpace)
    const labelLeft = labelSide === 'right' ? left + width + labelGap : left - labelGap - labelWidth
    Object.assign(layout, {
      labelSide, labelLeft, labelWidth, desiredLabelWidth: desiredWidth,
      occupiedStart: Math.min(left, labelLeft),
      occupiedEnd: Math.max(left + width, labelLeft + labelWidth)
    })
  }

  return layout
}

function rangesOverlap(firstStart, firstEnd, secondStart, secondEnd, gap = 0) {
  return firstStart < secondEnd + gap && secondStart < firstEnd + gap
}

/** 先排工期，再为名称安排位置，同一行的所有色条共享垂直位置。 */
function positionRowLabels(rowProjects, timelineParams, preserveRow = false) {
  const sideLabels = []
  const aboveLabels = []

  for (const project of rowProjects) {
    const layout = project.layout
    if (layout.mode !== 'external') continue

    const overlapsBar = rowProjects.some(other => other.id !== project.id && other.layout.width > 0 && rangesOverlap(
      layout.occupiedStart, layout.occupiedEnd, other.layout.left, other.layout.left + other.layout.width
    ))
    const overlapsSideLabel = sideLabels.some(other => rangesOverlap(
      layout.occupiedStart, layout.occupiedEnd, other.occupiedStart, other.occupiedEnd, PROJECT_LABEL_SPACING
    ))

    if (!overlapsBar && !overlapsSideLabel) {
      sideLabels.push(layout)
      continue
    }

    const labelWidth = Math.min(layout.desiredLabelWidth, timelineParams.totalWidth ?? Infinity)
    const centeredLeft = layout.left + layout.width / 2 - labelWidth / 2
    const labelLeft = Math.max(0, Math.min(centeredLeft, (timelineParams.totalWidth ?? Infinity) - labelWidth))

    Object.assign(layout, {
      labelSide: 'above', labelLeft, labelWidth,
      occupiedStart: layout.left, occupiedEnd: layout.left + layout.width
    })
    aboveLabels.push(layout)
  }

  const totalWidth = timelineParams.totalWidth ?? Infinity
  const requiredWidth = aboveLabels.reduce((sum, layout) => sum + layout.labelWidth, 0) +
    Math.max(0, aboveLabels.length - 1) * PROJECT_LABEL_SPACING
  let labelSpacing = PROJECT_LABEL_SPACING
  if (requiredWidth > totalWidth) {
    if (!preserveRow) return null
    // 手动行优先保留；极密缩放时收紧名称槽，完整名称仍可悬停查看。
    labelSpacing = Math.min(PROJECT_LABEL_SPACING, totalWidth / (aboveLabels.length * 2))
    const available = Math.max(0, totalWidth - Math.max(0, aboveLabels.length - 1) * labelSpacing)
    const maxLabelWidth = available / aboveLabels.length
    aboveLabels.forEach(layout => { layout.labelWidth = Math.min(layout.labelWidth, maxLabelWidth) })
  }

  let previousEnd = -labelSpacing
  for (const layout of aboveLabels) {
    layout.labelLeft = Math.max(layout.labelLeft, previousEnd + labelSpacing)
    previousEnd = layout.labelLeft + layout.labelWidth
  }
  let rightBoundary = totalWidth
  for (let index = aboveLabels.length - 1; index >= 0; index--) {
    const layout = aboveLabels[index]
    layout.labelLeft = Math.min(layout.labelLeft, rightBoundary - layout.labelWidth)
    rightBoundary = layout.labelLeft - labelSpacing
  }

  return aboveLabels.length ? PROJECT_LABEL_HEIGHT + PROJECT_LABEL_GAP : 0
}

function createRowLayouts(projects, timelineParams, measurements) {
  const rowProjects = projects.map(project => ({
    ...project, layout: calculateProjectBarLayout(project, timelineParams, measurements[project.id])
  }))
  const labelSpace = positionRowLabels(rowProjects, timelineParams, projects.some(project => Number.isInteger(project.layoutRow)))
  return labelSpace === null ? null : { rowProjects, labelSpace }
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
  
  // 开始和结束日期都包含当天，同日项目需要分行。
  return !start1.isAfter(end2, 'day') && !start2.isAfter(end1, 'day')
}

/**
 * 为项目分配行号（避免重叠）
 * 使用贪心算法，尽量将项目放在较低的行
 * @param {Array} projects - 同一产品线的项目列表
 * @returns {Array} 带行号的项目列表
 */
export function assignRows(projects, timelineParams, measurements = {}) {
  if (!projects || projects.length === 0) {
    return []
  }
  
  // 手动行优先占位，自动项目保持按开始时间排布。
  const sorted = [...projects].sort((a, b) => 
    Number(!Number.isInteger(a.layoutRow)) - Number(!Number.isInteger(b.layoutRow)) ||
    dayjs(a.startDate).diff(dayjs(b.startDate))
  )
  
  const result = []
  
  for (const project of sorted) {
    let row = Number.isInteger(project.layoutRow) ? nearestFreeRow(project, result, project.layoutRow) : 0
    
    // 找到第一个不冲突的行
    while (true) {
      const rowProjects = result.filter(item => item.row === row)
      const hasTimeOverlap = rowProjects.some(item => isTimeOverlap(item, project))
      const placement = !hasTimeOverlap && timelineParams
        ? createRowLayouts([...rowProjects, project], timelineParams, measurements)
        : null

      if (!hasTimeOverlap && (!timelineParams || placement)) {
        // 没有冲突，分配到这一行
        result.push({ ...project, row })
        break
      }
      
      // 有冲突，尝试下一行
      row++
    }
  }

  if (timelineParams) {
    let top = PROJECT_BAR_MARGIN
    const rowCount = Math.max(...result.map(project => project.row)) + 1
    for (let row = 0; row < rowCount; row++) {
      const rowProjects = result.filter(project => project.row === row)
      const placement = createRowLayouts(rowProjects, timelineParams, measurements)
      const barTop = top + placement.labelSpace
      rowProjects.forEach((project, index) => {
        project.layout = { ...placement.rowProjects[index].layout, top: barTop }
      })
      top = barTop + PROJECT_BAR_HEIGHT + PROJECT_BAR_MARGIN
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

  if (projects.every(project => typeof project.layout?.top === 'number')) {
    return Math.max(...projects.map(project => project.layout.top + barHeight)) + barMargin
  }
  
  // 找出最大的行号
  const maxRow = Math.max(...projects.map(p => p.row || 0))
  
  // 高度 = (行数 * (块高度 + 间距)) + 顶部间距 + 底部间距
  return (maxRow + 1) * (barHeight + barMargin) + barMargin
}
