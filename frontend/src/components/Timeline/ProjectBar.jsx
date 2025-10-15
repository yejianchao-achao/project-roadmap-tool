import { STATUS_COLORS, PROJECT_BAR_HEIGHT, PROJECT_BAR_MARGIN } from '../../utils/constants'
import { calculateProjectBarPosition } from '../../utils/layoutUtils'

/**
 * 项目块组件 - 显示单个项目
 * @param {object} project - 项目对象
 * @param {object} timelineParams - 时间轴参数
 * @param {number} row - 行号
 * @param {function} onEdit - 编辑回调
 */
function ProjectBar({ project, timelineParams, row, onEdit }) {
  const { left, width } = calculateProjectBarPosition(project, timelineParams)
  const color = STATUS_COLORS[project.status] || '#999'
  
  // 暂停状态使用虚线边框
  const isPaused = project.status === '暂停'
  
  // 计算垂直位置：顶部间距 + 行号 * (块高度 + 间距)
  const top = PROJECT_BAR_MARGIN + row * (PROJECT_BAR_HEIGHT + PROJECT_BAR_MARGIN)

  const handleClick = () => {
    onEdit(project)
  }

  return (
    <div
      className={`project-bar ${isPaused ? 'project-bar-paused' : ''}`}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        top: `${top}px`,
        backgroundColor: isPaused ? '#f5f5f5' : color,
        borderColor: color,
        borderStyle: isPaused ? 'dashed' : 'solid'
      }}
      onClick={handleClick}
      title={`${project.name}\n${project.startDate} ~ ${project.endDate}\n状态: ${project.status}`}
    >
      <div className="project-bar-content">
        <span className="project-name">{project.name}</span>
        <span className="project-dates">
          {project.startDate} ~ {project.endDate}
        </span>
      </div>
    </div>
  )
}

export default ProjectBar
