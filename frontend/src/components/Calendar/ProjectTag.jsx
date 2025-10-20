/**
 * 项目标签组件
 * 显示单个项目的标签，包含项目名称和负责人颜色
 */

import { Tooltip } from 'antd'
import { getProjectOwnerColor } from '../../utils/calendarUtils'

/**
 * 项目标签组件
 * 
 * @param {Object} props - 组件属性
 * @param {Object} props.project - 项目对象
 * @param {string} props.project.id - 项目ID
 * @param {string} props.project.name - 项目名称
 * @param {string} props.project.ownerId - 项目负责人ID
 * @param {Array} props.owners - 人员列表
 * @param {Function} props.onClick - 点击回调函数
 */
function ProjectTag({ project, owners, onClick }) {
  // 获取负责人颜色
  const color = getProjectOwnerColor(project, owners)
  
  // 截断项目名称（最多显示10个字符）
  const displayName = project.name.length > 10 
    ? project.name.substring(0, 10) + '...' 
    : project.name
  
  return (
    <Tooltip title={project.name} placement="top">
      <div
        className="project-tag"
        style={{ backgroundColor: color }}
        onClick={onClick}
      >
        {displayName}
      </div>
    </Tooltip>
  )
}

export default ProjectTag
