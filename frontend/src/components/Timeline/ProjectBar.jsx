import { STATUS_COLORS, PROJECT_BAR_HEIGHT, PROJECT_BAR_MARGIN, PROJECT_LABEL_HEIGHT, PROJECT_LABEL_GAP, PROJECT_BAR_NAME_PADDING, BOARD_TYPES } from '../../utils/constants'
import { calculateProjectBarLayout } from '../../utils/layoutUtils'

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
  const layout = project.layout || calculateProjectBarLayout(project, timelineParams)
  const { left, width, mode, dateLabel } = layout
  
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
  const top = layout.top ?? PROJECT_BAR_MARGIN + row * (PROJECT_BAR_HEIGHT + PROJECT_BAR_MARGIN)
  const labelCenter = (layout.labelLeft ?? left) - left + (layout.labelWidth ?? width) / 2
  const connectorLeft = Math.min(labelCenter, width / 2) - 1
  const connectorWidth = Math.abs(labelCenter - width / 2) + 2

  const handleClick = () => {
    onEdit(project)
  }

  return (
    <button
      type="button"
      className={`project-item project-item--${mode}`}
      aria-label={`编辑项目：${project.name}，${project.startDate} 至 ${project.endDate}，状态：${project.status}${isPending ? '，暂定' : ''}`}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        top: `${top}px`
      }}
      onClick={handleClick}
      title={`${project.name}\n${project.startDate} ~ ${project.endDate}\n状态: ${project.status}${isPending ? '\n(暂定)' : ''}`}
    >
      <span
        className="project-bar"
        style={{
          backgroundColor,
          borderColor,
          borderStyle,
          ...(mode === 'name' ? { paddingLeft: PROJECT_BAR_NAME_PADDING, paddingRight: PROJECT_BAR_NAME_PADDING } : {}),
          ...(mode === 'external' ? { padding: 0, borderWidth: `${Math.min(3, width / 2)}px` } : {})
        }}
      >
        {mode !== 'external' && (
          <span className="project-bar-content">
            <span className="project-name">{project.name}</span>
            {mode === 'full' && <span className="project-dates">{dateLabel}</span>}
          </span>
        )}
      </span>
      {mode === 'external' && layout.labelSide === 'above' && (
        <svg
          className="project-label-connector" aria-hidden="true"
          viewBox={`0 0 ${connectorWidth} ${PROJECT_LABEL_GAP}`}
          style={{ left: `${connectorLeft}px`, top: `-${PROJECT_LABEL_GAP}px`, width: `${connectorWidth}px`, height: `${PROJECT_LABEL_GAP}px` }}
        >
          <line
            x1={labelCenter - connectorLeft} y1="0.5"
            x2={width / 2 - connectorLeft} y2={PROJECT_LABEL_GAP - 0.5}
            stroke={borderColor} strokeWidth="1.5"
          />
        </svg>
      )}
      {mode === 'external' && (
        <span
          className={`project-name project-name-external${layout.labelSide === 'above' ? ' project-name-above' : ''}`}
          style={{
            left: `${layout.labelLeft - left}px`, width: `${layout.labelWidth}px`,
            ...(layout.labelSide === 'above' ? {
              top: `${-(PROJECT_LABEL_HEIGHT + PROJECT_LABEL_GAP)}px`,
              height: `${PROJECT_LABEL_HEIGHT}px`, lineHeight: `${PROJECT_LABEL_HEIGHT}px`
            } : {})
          }}
        >
          {project.name}
        </span>
      )}
    </button>
  )
}

export default ProjectBar
