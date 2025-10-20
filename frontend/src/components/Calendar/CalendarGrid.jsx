/**
 * 日历网格组件
 * 渲染7×6的日历布局，包含周标题和日期单元格
 */

import dayjs from 'dayjs'
import CalendarCell from './CalendarCell'

/**
 * 日历网格组件
 * 
 * @param {Object} props - 组件属性
 * @param {Array} props.dates - 日期数组（42个Dayjs对象）
 * @param {Object} props.projectsByDate - 按日期分组的项目 { 'YYYY-MM-DD': Project[] }
 * @param {dayjs.Dayjs} props.currentMonth - 当前月份
 * @param {Function} props.onProjectClick - 项目点击回调函数
 * @param {Array} props.owners - 人员列表
 */
function CalendarGrid({ dates, projectsByDate, currentMonth, onProjectClick, owners }) {
  // 周标题
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  
  return (
    <div className="calendar-grid-container">
      {/* 周标题行 */}
      <div className="calendar-week-header">
        {weekDays.map(day => (
          <div key={day} className="calendar-week-day">
            {day}
          </div>
        ))}
      </div>
      
      {/* 日历网格 */}
      <div className="calendar-grid">
        {dates.map(date => {
          // 生成日期键
          const dateKey = date.format('YYYY-MM-DD')
          
          // 获取该日期的项目列表（如果没有则为空数组）
          const projects = projectsByDate[dateKey] || []
          
          // 判断是否为今天
          const isToday = date.isSame(dayjs(), 'day')
          
          // 判断是否为当前月份
          const isCurrentMonth = date.isSame(currentMonth, 'month')
          
          return (
            <CalendarCell
              key={dateKey}
              date={date}
              projects={projects}
              isToday={isToday}
              isCurrentMonth={isCurrentMonth}
              onProjectClick={onProjectClick}
              owners={owners}
            />
          )
        })}
      </div>
    </div>
  )
}

export default CalendarGrid
