import { STATUS_COLORS, PROJECT_BAR_HEIGHT, PROJECT_BAR_MARGIN, BOARD_TYPES } from '../../utils/constants'
import { calculateProjectBarPosition } from '../../utils/layoutUtils'

/**
 * 项目块组件 - 显示单个项目
 * @param {object} project - 项目对象
 * @param {object} timelineParams - 时间轴参数
 * @param {number} row - 行号
 * @param {function} onEdit - 编辑回调
 * @param {string} boardType - 看板类型
 * @param {array} owners - 人员列表
 */
function ProjectBar({ project, timelineParams, row, onEdit, boardType = BOARD_TYPES.STATUS, owners = [] }) {
  const { left, width } = calculateProjectBarPosition(project, timelineParams)
  
  // 根据看板类型选择颜色
  let color
  if (boardType === BOARD_TYPES.OWNER) {
    // 人员看板：根据负责人颜色
    const owner = owners.find(o => o.id === project.ownerId)
    color = owner?.color || '#999'
  } else {
    // 进度看板：根据状态颜色
    color = STATUS_COLORS[project.status] || '#999'
  }
  
  // 边框样式：暂定项目使用虚线
  const isPending = project.isPending || false
  const borderStyle = isPending ? 'dashed' : 'solid'
  
  // 边框颜色：暂定项目使用黑色，让虚线更明显
  const borderColor = isPending ? '#000' : color
  
  // 填充颜色：暂停状态特殊处理
  const isPaused = project.status === '暂停'
  const backgroundColor = isPaused ? '#f5f5f5' : color
  
  // 计算垂直位置：顶部间距 + 行号 * (块高度 + 间距)
  const top = PROJECT_BAR_MARGIN + row * (PROJECT_BAR_HEIGHT + PROJECT_BAR_MARGIN)

  const handleClick = () => {
    onEdit(project)
  }

  return (
    <div
      className="project-bar"
      style={{
        left: `${left}px`,
        width: `${width}px`,
        top: `${top}px`,
        backgroundColor: backgroundColor,
        borderColor: borderColor,
        borderStyle: borderStyle
      }}
      onClick={handleClick}
      title={`${project.name}\n${project.startDate} ~ ${project.endDate}\n状态: ${project.status}${isPending ? '\n(暂定)' : ''}`}
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
