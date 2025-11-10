import { generateWeekGridLines, generateCurrentWeekHighlightRange } from '../../utils/dateUtils'

/**
 * 时间轴背景网格组件 - 显示周刻度线
 * @param {object} timelineParams - 时间轴参数
 */
/**
 * 时间轴背景网格组件 - 显示周刻度线与本周阴影背景
 * @param {object} timelineParams - 时间轴参数
 */
function TimelineGrid({ timelineParams }) {
  const weekLines = generateWeekGridLines(timelineParams)
  const weekHighlight = generateCurrentWeekHighlightRange(timelineParams)

  return (
    <div className="timeline-grid">
      {/* 本周阴影背景（半透明） */}
      {weekHighlight && (
        <div
          className="week-highlight"
          style={{ left: `${weekHighlight.left}px`, width: `${weekHighlight.width}px` }}
        />
      )}
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
