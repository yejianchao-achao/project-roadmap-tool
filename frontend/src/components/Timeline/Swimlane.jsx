import ProjectBar from './ProjectBar'
import { assignRows, calculateSwimlaneHeight } from '../../utils/layoutUtils'
import { PROJECT_BAR_HEIGHT, PROJECT_BAR_MARGIN } from '../../utils/constants'

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
  // 为项目分配行号（避免重叠）
  const projectsWithRows = assignRows(projects)
  
  // 计算泳道高度
  const height = calculateSwimlaneHeight(projectsWithRows, PROJECT_BAR_HEIGHT, PROJECT_BAR_MARGIN)

  return (
    <div className="swimlane" style={{ height: `${height}px` }}>
      {/* 产品线标签 */}
      <div className="swimlane-label">
        <span className="productline-name">{productLine.name}</span>
        <span className="project-count">({projects.length}个项目)</span>
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
