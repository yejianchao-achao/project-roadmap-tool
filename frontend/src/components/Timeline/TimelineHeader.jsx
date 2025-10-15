import { generateMonthTicks } from '../../utils/dateUtils'

/**
 * 时间轴头部组件 - 显示月份刻度
 * @param {Object} timelineParams - 时间轴参数
 * @param {Object} headerRef - 头部容器的ref引用
 * @param {string} viewportWidth - 视口宽度（与内容区域保持一致）
 */
function TimelineHeader({ timelineParams, headerRef, viewportWidth }) {
  const monthTicks = generateMonthTicks(timelineParams)

  return (
    <div 
      className="timeline-header" 
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
      </div>
    </div>
  )
}

export default TimelineHeader
