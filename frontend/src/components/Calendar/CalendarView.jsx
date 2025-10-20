/**
 * 日历视图主组件
 * 协调所有子组件，管理日历状态和数据
 */

import { useState, useEffect, useCallback } from 'react'
import { Spin, Segmented } from 'antd'
import dayjs from 'dayjs'
import CalendarHeader from './CalendarHeader'
import CalendarGrid from './CalendarGrid'
import { calculateCalendarData } from '../../utils/calendarUtils'

/**
 * 日历视图主组件
 * 
 * @param {Object} props - 组件属性
 * @param {Array} props.projects - 项目列表
 * @param {Array} props.productLines - 产品线列表
 * @param {Array} props.selectedProductLines - 选中的产品线ID列表
 * @param {Function} props.onEditProject - 编辑项目回调函数
 * @param {Array} props.owners - 人员列表
 * @param {Function} props.onViewTypeChange - 视图类型变化回调函数
 */
function CalendarView({ projects, productLines, selectedProductLines, onEditProject, owners, onViewTypeChange }) {
  // 当前显示的月份（默认为当前月）
  const [currentMonth, setCurrentMonth] = useState(dayjs())
  
  // 日历数据（日期数组和项目分组）
  const [calendarData, setCalendarData] = useState(null)
  
  /**
   * 计算日历数据
   * 当月份、项目或产品线筛选变化时重新计算
   */
  useEffect(() => {
    const data = calculateCalendarData(currentMonth, projects, selectedProductLines)
    setCalendarData(data)
  }, [currentMonth, projects, selectedProductLines])
  
  /**
   * 切换到上一月
   */
  const handlePrevMonth = useCallback(() => {
    setCurrentMonth(prev => prev.subtract(1, 'month'))
  }, [])
  
  /**
   * 切换到下一月
   */
  const handleNextMonth = useCallback(() => {
    setCurrentMonth(prev => prev.add(1, 'month'))
  }, [])
  
  /**
   * 回到今天所在月份
   */
  const handleToday = useCallback(() => {
    setCurrentMonth(dayjs())
  }, [])
  
  /**
   * 处理项目点击
   * 调用父组件传入的编辑回调
   */
  const handleProjectClick = useCallback((project) => {
    onEditProject(project)
  }, [onEditProject])
  
  // 加载状态
  if (!calendarData) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }
  
  return (
    <div className="calendar-view">
      {/* 看板切换控件 */}
      <div style={{ 
        marginBottom: 16, 
        display: 'flex', 
        justifyContent: 'flex-end',
        alignItems: 'center'
      }}>
        <Segmented
          value="calendar"
          onChange={(value) => onViewTypeChange && onViewTypeChange(value)}
          options={[
            { label: '进度看板', value: 'timeline-status' },
            { label: '人员看板', value: 'timeline-owner' },
            { label: '日历看板', value: 'calendar' }
          ]}
        />
      </div>

      {/* 日历头部 */}
      <CalendarHeader
        currentMonth={currentMonth}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />
      
      {/* 日历网格 */}
      <CalendarGrid
        dates={calendarData.dates}
        projectsByDate={calendarData.projectsByDate}
        currentMonth={currentMonth}
        onProjectClick={handleProjectClick}
        owners={owners}
      />
    </div>
  )
}

export default CalendarView
