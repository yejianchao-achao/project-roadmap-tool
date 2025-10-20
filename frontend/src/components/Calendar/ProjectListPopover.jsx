/**
 * 项目列表弹出层组件
 * 用于显示超过5个项目时的完整项目列表
 */

import { Popover } from 'antd'
import ProjectTag from './ProjectTag'

/**
 * 项目列表弹出层组件
 * 
 * @param {Object} props - 组件属性
 * @param {Array} props.projects - 项目列表
 * @param {Array} props.owners - 人员列表
 * @param {Function} props.onProjectClick - 项目点击回调函数
 * @param {ReactNode} props.children - 触发元素（通常是"+N更多"按钮）
 */
function ProjectListPopover({ projects, owners, onProjectClick, children }) {
  // 弹出层内容
  const content = (
    <div className="project-list-popover">
      {projects.map(project => (
        <ProjectTag
          key={project.id}
          project={project}
          owners={owners}
          onClick={() => onProjectClick(project)}
        />
      ))}
    </div>
  )
  
  return (
    <Popover 
      content={content} 
      trigger="click" 
      placement="bottom"
      overlayClassName="calendar-project-popover"
    >
      {children}
    </Popover>
  )
}

export default ProjectListPopover
