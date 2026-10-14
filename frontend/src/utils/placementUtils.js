import dayjs from 'dayjs'

export function datesOverlap(first, second) {
  return first.startDate <= second.endDate && second.startDate <= first.endDate
}

// 与服务端一致：等距离时优先向下，然后向上。
export function nearestFreeRow(project, placements, preferredRow = 0) {
  const occupied = new Set(placements.filter(item => item.id !== project.id && datesOverlap(project, item)).map(item => item.row))
  for (let distance = 0; distance <= occupied.size; distance++) {
    const candidates = distance === 0 ? [preferredRow] : [preferredRow + distance, preferredRow - distance]
    for (const row of candidates) {
      if (row >= 0 && row <= 10000 && !occupied.has(row)) return row
    }
  }
  throw new Error('没有可用布局行')
}

export function shiftProjectDates(project, deltaDays, timelineParams) {
  const start = dayjs(project.startDate)
  const end = dayjs(project.endDate)
  const minDelta = Math.min(0, timelineParams.minDate.startOf('day').diff(start, 'day'))
  const maxDelta = Math.max(0, timelineParams.maxDate.startOf('day').diff(end, 'day'))
  const shift = minDelta <= maxDelta ? Math.max(minDelta, Math.min(deltaDays, maxDelta)) : deltaDays
  return { startDate: start.add(shift, 'day').format('YYYY-MM-DD'), endDate: end.add(shift, 'day').format('YYYY-MM-DD') }
}

export function dateAtPosition(x, timelineParams) {
  const day = Math.max(0, Math.min(timelineParams.totalDays - 1, Math.floor(x / timelineParams.pixelsPerDay)))
  return timelineParams.minDate.add(day, 'day').format('YYYY-MM-DD')
}
