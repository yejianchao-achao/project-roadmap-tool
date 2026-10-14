import test from 'node:test'
import assert from 'node:assert/strict'
import dayjs from 'dayjs'
import { nearestFreeRow, shiftProjectDates, dateAtPosition } from './placementUtils.js'
import { assignRows } from './layoutUtils.js'

const item = (id, start = '2026-10-14', end = '2026-10-21', row = 0) => ({ id, name: '项目名称', startDate: start, endDate: end, row })
const params = (pixelsPerDay = 8) => ({ minDate: dayjs('2026-10-01'), maxDate: dayjs('2027-01-31'), totalDays: 123, pixelsPerDay, totalWidth: 123 * pixelsPerDay })

test('occupied target keeps dates and chooses nearest free row, downward on ties', () => {
  const project = item('moving')
  const others = [item('occupied', undefined, undefined, 2)]
  assert.equal(nearestFreeRow(project, others, 2), 3)
  assert.equal(nearestFreeRow(project, [...others, item('below', undefined, undefined, 3)], 2), 1)
  assert.equal(project.startDate, '2026-10-14')
})

test('same-day boundaries collide, adjacent days share rows, self is excluded', () => {
  const project = item('moving', '2026-10-21', '2026-10-23')
  assert.equal(nearestFreeRow(project, [item('other')], 0), 1)
  assert.equal(nearestFreeRow(item('moving', '2026-10-22'), [item('other')], 0), 0)
  assert.equal(nearestFreeRow(project, [project], 0), 0)
})

test('horizontal shifts preserve inclusive duration across year boundaries and clamp at range edges', () => {
  assert.deepEqual(shiftProjectDates(item('a', '2026-12-29', '2027-01-02'), 3, params()), { startDate: '2027-01-01', endDate: '2027-01-05' })
  assert.deepEqual(shiftProjectDates(item('a', '2026-10-01', '2026-10-03'), -10, params()), { startDate: '2026-10-01', endDate: '2026-10-03' })
  assert.deepEqual(shiftProjectDates(item('a', '2027-01-28', '2027-01-30'), 10, params()), { startDate: '2027-01-29', endDate: '2027-01-31' })
})

test('blank click date respects scale, fractional day and time-range boundaries', () => {
  for (const width of [100, 240, 500]) {
    const timeline = params(width / 30)
    assert.equal(dateAtPosition(25.1 * timeline.pixelsPerDay, timeline), '2026-10-26')
    assert.equal(dateAtPosition(-8, timeline), '2026-10-01')
    assert.equal(dateAtPosition(timeline.totalWidth + 8, timeline), '2027-01-31')
  }
})

test('vertical movement of a partially visible project preserves its dates', () => {
  const project = item('partial', '2026-09-28', '2026-10-04')
  assert.deepEqual(shiftProjectDates(project, 0, params()), { startDate: project.startDate, endDate: project.endDate })
})

test('manual row positions survive zoom changes and automatic items avoid reserved periods', () => {
  const projects = [{ ...item('manual'), layoutRow: 2 }, item('auto')]
  for (const width of [100, 240, 500]) {
    const rows = assignRows(projects, params(width / 30))
    assert.equal(rows.find(p => p.id === 'manual').row, 2)
    assert.equal(rows.find(p => p.id === 'auto').row, 0)
  }
})

test('dense pinned projects keep their row even when names need truncation', () => {
  const projects = Array.from({ length: 25 }, (_, i) => {
    const date = dayjs('2026-10-01').add(i, 'day').format('YYYY-MM-DD')
    return { ...item(String(i), date, date), layoutRow: 1 }
  })
  const timeline = { ...params(100 / 30), totalWidth: 31 * 100 / 30 }
  const rows = assignRows(projects, timeline)
  assert.ok(rows.every(p => p.row === 1))
  const above = rows.filter(p => p.layout.labelSide === 'above')
  for (let i = 1; i < above.length; i++) {
    assert.ok(above[i - 1].layout.labelLeft + above[i - 1].layout.labelWidth <= above[i].layout.labelLeft + 0.01)
  }
})
