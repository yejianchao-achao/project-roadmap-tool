import dayjs from 'dayjs'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import ProjectBar from './ProjectBar'
import { assignRows, calculateProjectBarPosition, getProjectDateLabel } from '../../utils/layoutUtils'
import { PROJECT_BAR_HEIGHT, PROJECT_BAR_MARGIN } from '../../utils/constants'

/**
 * 检查项目是否在时间范围内可见
 * @param {object} project - 项目对象
 * @param {object} timelineParams - 时间轴参数（包含minDate和maxDate）
 * @param {array} owners - 人员列表（用于检查可见性）
 * @returns {boolean} 是否在时间范围内可见
 */
function isProjectVisible(project, timelineParams, owners) {
  // 检查人员可见性
  if (owners && owners.length > 0) {
    const owner = owners.find(o => o.id === project.ownerId)
    if (owner && owner.visible === false) {
      return false // 人员被隐藏，项目不可见
    }
  }

  if (!timelineParams || !timelineParams.minDate || !timelineParams.maxDate) {
    return true // 没有时间范围限制时显示所有项目
  }

  const projectStart = dayjs(project.startDate)
  const projectEnd = dayjs(project.endDate)
  const timelineStart = dayjs(timelineParams.minDate)
  const timelineEnd = dayjs(timelineParams.maxDate)

  // 项目与时间范围有交集则可见
  return !projectStart.isAfter(timelineEnd, 'day') && !projectEnd.isBefore(timelineStart, 'day')
}

/**
 * 泳道组件 - 显示单个产品线的所有项目
 * @param {object} productLine - 产品线对象
 * @param {array} projects - 该产品线下的项目列表
 * @param {object} timelineParams - 时间轴参数
 * @param {function} onEditProject - 编辑项目回调
 * @param {string} boardType - 看板类型
 * @param {array} owners - 人员列表
 */
function Swimlane({ productLine, projects, timelineParams, onEditProject, boardType, owners,
  registerLayout, onPointerDown, preview, saving }) {
  const measurementRef = useRef(null)
  const [measurements, setMeasurements] = useState({})
  // 过滤出当前时间范围内可见的项目
  const visibleProjects = useMemo(
    () => projects.filter(p => isProjectVisible(p, timelineParams, owners)),
    [projects, timelineParams, owners]
  )

  // 使用当前字体与响应式样式测量名称、日期，避免依靠固定天数猜测。
  useLayoutEffect(() => {
    let active = true
    const measure = () => {
      if (!active || !measurementRef.current) return
      const barStyle = getComputedStyle(measurementRef.current.querySelector('.project-bar'))
      const contentInset = ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth']
        .reduce((sum, property) => sum + parseFloat(barStyle[property] || 0), 0)
      const borderInset = parseFloat(barStyle.borderLeftWidth) + parseFloat(barStyle.borderRightWidth)
      const next = {}
      measurementRef.current.querySelectorAll('[data-project-id]').forEach(element => {
        next[element.dataset.projectId] = {
          nameWidth: element.querySelector('.project-name').getBoundingClientRect().width,
          dateWidth: element.querySelector('.project-dates').getBoundingClientRect().width,
          contentInset, borderInset
        }
      })
      setMeasurements(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next)
    }
    measure()
    window.addEventListener('resize', measure)
    document.fonts?.ready.then(measure)
    return () => {
      active = false
      window.removeEventListener('resize', measure)
    }
  }, [projects])

  // 隐藏项目也参与行占用，拖入后不会与它们发生工期冲突。
  const projectsWithRows = useMemo(
    () => assignRows(projects, timelineParams, measurements),
    [projects, timelineParams, measurements]
  )
  useLayoutEffect(() => {
    registerLayout?.(productLine.id, projectsWithRows)
  }, [registerLayout, productLine.id, projectsWithRows])

  const rowCount = Math.max(0, ...projectsWithRows.map(project => project.row)) + 2
  const rowSlots = []
  let height = 0
  for (let row = 0; row < rowCount; row++) {
    const barTop = projectsWithRows.find(project => project.row === row)?.layout.top ?? (height || PROJECT_BAR_MARGIN)
    const bottom = barTop + PROJECT_BAR_HEIGHT + PROJECT_BAR_MARGIN
    rowSlots.push({ row, top: height, height: bottom - height, barTop })
    height = bottom
  }
  const isTarget = preview?.valid && preview.productLineId === productLine.id
  const ghost = isTarget ? calculateProjectBarPosition(preview.candidate, timelineParams) : null
  const targetSlot = isTarget ? rowSlots.find(slot => slot.row === preview.row) : null

  return (
    <div className={`swimlane${isTarget ? ' swimlane--drop-target' : ''}`}
      data-product-line-id={productLine.id} data-product-line-name={productLine.name}
      style={{ height: `${height}px` }}>
      {rowSlots.map(slot => (
        <div key={slot.row} data-layout-row={slot.row} data-bar-top={slot.barTop}
          className={`timeline-row-slot${isTarget && preview.row === slot.row ? ' timeline-row-slot--target' : ''}`}
          style={{ top: slot.top, height: slot.height }} aria-hidden="true" />
      ))}
      <div className="project-text-measurements" ref={measurementRef} aria-hidden="true">
        <span className="project-bar" />
        {projects.map(project => (
          <div key={project.id} data-project-id={project.id}>
            <span className="project-name">{project.name}</span>
            <span className="project-dates">{getProjectDateLabel(project)}</span>
          </div>
        ))}
      </div>
      {/* 产品线标签 */}
      <div className="swimlane-label">
        <span className="productline-name">{productLine.name}</span>
        <span className="project-count">({visibleProjects.length}个项目)</span>
      </div>

      {/* 项目块容器 */}
      <div className="swimlane-content">
        {projectsWithRows.filter(project => isProjectVisible(project, timelineParams, owners)).map(project => (
          <ProjectBar
            key={project.id}
            project={project}
            timelineParams={timelineParams}
            row={project.row}
            onEdit={onEditProject}
            boardType={boardType}
            owners={owners}
            onPointerDown={onPointerDown}
            isDragging={preview?.project.id === project.id}
          />
        ))}
        {ghost && targetSlot && (
          <div className={`project-drop-preview${saving ? ' project-drop-preview--saving' : ''}`}
            data-drop-row={preview.row}
            style={{ left: ghost.left, width: Math.max(ghost.width, 2), top: targetSlot.barTop, height: PROJECT_BAR_HEIGHT }}
            aria-hidden="true">
            <span>{preview.project.name}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default Swimlane
