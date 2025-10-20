/**
 * 日历单元格组件
 * 显示单个日期及其对应的项目列表
 */

import ProjectTag from './ProjectTag'
import ProjectListPopover from './ProjectListPopover'

/**
 * 日历单元格组件
 * 
 * @param {Object} props - 组件属性
 * @param {dayjs.Dayjs} props.date - 日期对象
 * @param {Array} props.projects - 该日期的项目列表
 * @param {boolean} props.isToday - 是否为今天
 * @param {boolean} props.isCurrentMonth - 是否为当前月份
 * @param {Function} props.onProjectClick - 项目点击回调函数
 * @param {Array} props.owners - 人员列表
 */
function CalendarCell({ date, projects, isToday, isCurrentMonth, onProjectClick, owners }) {
  // 最多显示的项目数量
  const MAX_VISIBLE_PROJECTS = 5
  
  // 可见的项目（前5个）
  const visibleProjects = projects.slice(0, MAX_VISIBLE_PROJECTS)
  
  // 隐藏的项目数量
  const hiddenCount = Math.max(0, projects.length - MAX_VISIBLE_PROJECTS)
  
  // 构建CSS类名
  const cellClasses = [
    'calendar-cell',
    isToday && 'today',
    !isCurrentMonth && 'other-month'
  ].filter(Boolean).join(' ')
  
  return (
    <div className={cellClasses}>
      {/* 日期数字 */}
      <div className="calendar-cell-date">
        {date.format('D')}
      </div>
      
      {/* 项目列表 */}
      <div className="calendar-cell-projects">
        {visibleProjects.map(project => (
          <ProjectTag
            key={project.id}
            project={project}
            owners={owners}
            onClick={() => onProjectClick(project)}
          />
        ))}
        
        {/* 更多按钮 */}
        {hiddenCount > 0 && (
          <ProjectListPopover
            projects={projects.slice(MAX_VISIBLE_PROJECTS)}
            owners={owners}
            onProjectClick={onProjectClick}
          >
            <div className="more-projects">
              +{hiddenCount}更多
            </div>
          </ProjectListPopover>
        )}
      </div>
    </div>
  )
}

export default CalendarCell
