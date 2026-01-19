import dayjs from 'dayjs'
import ProjectBar from './ProjectBar'
import { assignRows, calculateSwimlaneHeight } from '../../utils/layoutUtils'
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
  return projectStart.isBefore(timelineEnd) && projectEnd.isAfter(timelineStart)
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
  // 过滤出当前时间范围内可见的项目
  const visibleProjects = projects.filter(p => isProjectVisible(p, timelineParams, owners))

  // 只为可见项目分配行号（避免重叠）
  const projectsWithRows = assignRows(visibleProjects)

  // 只根据可见项目计算泳道高度
  const height = calculateSwimlaneHeight(projectsWithRows, PROJECT_BAR_HEIGHT, PROJECT_BAR_MARGIN)

  return (
    <div className="swimlane" style={{ height: `${height}px` }}>
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
