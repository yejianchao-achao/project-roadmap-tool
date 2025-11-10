import { generateTodayOffset } from '../../utils/dateUtils'

/**
 * 时间轴叠加层组件 - 绘制“今日”红线
 * 叠加层位于项目块之上，不影响交互（pointer-events: none）
 * @param {object} timelineParams - 时间轴参数
 */
function TimelineOverlay({ timelineParams }) {
  const todayOffset = generateTodayOffset(timelineParams)

  if (todayOffset == null) {
    return null
  }

  return (
    <div className="timeline-overlay">
      <div
        className="today-line"
        style={{ left: `${todayOffset}px` }}
      />
    </div>
  )
}

export default TimelineOverlay