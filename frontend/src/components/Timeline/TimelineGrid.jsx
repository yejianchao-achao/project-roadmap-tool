import { generateWeekGridLines } from '../../utils/dateUtils'

/**
 * 时间轴背景网格组件 - 显示周刻度线
 * @param {object} timelineParams - 时间轴参数
 */
function TimelineGrid({ timelineParams }) {
  const weekLines = generateWeekGridLines(timelineParams)

  return (
    <div className="timeline-grid">
      {weekLines.map((offset, index) => (
        <div
          key={index}
          className="week-line"
          style={{ left: `${offset}px` }}
        />
      ))}
    </div>
  )
}

export default TimelineGrid
