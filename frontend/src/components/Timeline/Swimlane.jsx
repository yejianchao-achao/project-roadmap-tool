import dayjs from 'dayjs'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import ProjectBar from './ProjectBar'
import { assignRows, calculateSwimlaneHeight, getProjectDateLabel } from '../../utils/layoutUtils'
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
function Swimlane({ productLine, projects, timelineParams, onEditProject, boardType, owners }) {
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
  }, [visibleProjects])

  // 只为可见项目分配行号（避免重叠）
  const projectsWithRows = useMemo(
    () => assignRows(visibleProjects, timelineParams, measurements),
    [visibleProjects, timelineParams, measurements]
  )

  // 只根据可见项目计算泳道高度
  const height = calculateSwimlaneHeight(projectsWithRows, PROJECT_BAR_HEIGHT, PROJECT_BAR_MARGIN)

  return (
    <div className="swimlane" style={{ height: `${height}px` }}>
      <div className="project-text-measurements" ref={measurementRef} aria-hidden="true">
        <span className="project-bar" />
        {visibleProjects.map(project => (
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
        {projectsWithRows.map(project => (
          <ProjectBar
            key={project.id}
            project={project}
            timelineParams={timelineParams}
            row={project.row}
            onEdit={onEditProject}
            boardType={boardType}
            owners={owners}
          />
        ))}
      </div>
    </div>
  )
}

export default Swimlane
