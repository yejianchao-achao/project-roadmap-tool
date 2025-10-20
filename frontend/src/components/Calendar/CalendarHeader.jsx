/**
 * 日历头部组件
 * 显示年月标题和月份切换按钮
 */

import { Button } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'

/**
 * 日历头部组件
 * 
 * @param {Object} props - 组件属性
 * @param {dayjs.Dayjs} props.currentMonth - 当前月份
 * @param {Function} props.onPrevMonth - 上一月回调函数
 * @param {Function} props.onNextMonth - 下一月回调函数
 * @param {Function} props.onToday - 今天回调函数
 */
function CalendarHeader({ currentMonth, onPrevMonth, onNextMonth, onToday }) {
  return (
    <div className="calendar-header">
      {/* 年月标题 */}
      <div className="calendar-title">
        {currentMonth.format('YYYY年MM月')}
      </div>
      
      {/* 切换按钮组 */}
      <div className="calendar-controls">
        <Button 
          icon={<LeftOutlined />} 
          onClick={onPrevMonth}
          size="small"
        />
        <Button 
          onClick={onToday}
          size="small"
        >
          今天
        </Button>
        <Button 
          icon={<RightOutlined />} 
          onClick={onNextMonth}
          size="small"
        />
      </div>
    </div>
  )
}

export default CalendarHeader
