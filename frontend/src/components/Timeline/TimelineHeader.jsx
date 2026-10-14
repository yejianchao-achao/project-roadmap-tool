import { generateMonthTicks, generateWeekTicks } from '../../utils/dateUtils'

/**
 * 时间轴头部组件 - 显示月份与按宽度启用的周一日期
 * @param {Object} timelineParams - 时间轴参数
 * @param {Object} headerRef - 头部容器的ref引用
 * @param {string} viewportWidth - 视口宽度（与内容区域保持一致）
 */
function TimelineHeader({ timelineParams, headerRef, viewportWidth, showWeekDates = false }) {
  const monthTicks = generateMonthTicks(timelineParams)
  const weekTicks = showWeekDates ? generateWeekTicks(timelineParams) : []

  return (
    <div 
      className={`timeline-header${showWeekDates ? ' timeline-header--weekly' : ''}`}
      ref={headerRef}
      style={{ width: viewportWidth }}
    >
      <div 
        className="timeline-header-content" 
        style={{ width: `${timelineParams.totalWidth}px` }}
      >
        {monthTicks.map((tick, index) => (
          <div
            key={index}
            className="month-tick"
            style={{
              left: `${tick.offset}px`,
              width: `${tick.width}px`
            }}
          >
            <span className="month-label">{tick.label}</span>
          </div>
        ))}
        {showWeekDates && (
          <div className="week-ticks" aria-label="每周一日期">
            {weekTicks.map(tick => (
              <div
                key={tick.date}
                className="week-tick"
                style={{ left: `${tick.offset}px` }}
                title={`${tick.date} 周一`}
              >
                <span className="week-date-label">{tick.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TimelineHeader
