import test from 'node:test'
import assert from 'node:assert/strict'
import dayjs from 'dayjs'
import {
  calculateProjectBarPosition, calculateProjectBarLayout,
  assignRows, isTimeOverlap, getProjectDateLabel, calculateSwimlaneHeight
} from './layoutUtils.js'

const params = (pixelsPerDay = 20) => ({
  minDate: dayjs('2026-10-01'), maxDate: dayjs('2026-10-31'),
  pixelsPerDay, totalWidth: 31 * pixelsPerDay
})
const project = (id, startDate, endDate = startDate) => ({
  id, name: '短项目名称', startDate, endDate
})

test('one-day bars retain their duration at every supported zoom', () => {
  for (const pixelsPerDay of [100 / 30, 5, 500 / 30]) {
    const bar = calculateProjectBarPosition(project('one', '2026-10-13'), params(pixelsPerDay))
    assert.ok(bar.width > 0)
    assert.ok(bar.width <= pixelsPerDay)
    assert.ok(pixelsPerDay - bar.width <= 2)
    assert.equal(bar.left, 12 * pixelsPerDay)
  }
})

test('longer bars keep a fixed two-pixel gap', () => {
  const bar = calculateProjectBarPosition(project('long', '2026-10-01', '2026-10-10'), params())
  assert.equal(bar.width, 198)
})

test('text width chooses full, name-only, or external presentation', () => {
  const measurements = { nameWidth: 40, dateWidth: 80, contentInset: 30 }
  assert.equal(calculateProjectBarLayout(project('a', '2026-10-01', '2026-10-10'), params(), measurements).mode, 'full')
  assert.equal(calculateProjectBarLayout(project('a', '2026-10-01', '2026-10-05'), params(), measurements).mode, 'name')
  assert.equal(calculateProjectBarLayout(project('a', '2026-10-01'), params(), measurements).mode, 'external')
})

test('a name that fits the bar remains inside even when its dates do not fit', () => {
  const timeline = { ...params(5), maxDate: dayjs('2026-12-31'), totalWidth: 92 * 5 }
  const item = { ...project('design', '2026-11-11', '2026-11-24'), name: '声音设计' }
  const layout = calculateProjectBarLayout(item, timeline, { nameWidth: 52, dateWidth: 70, contentInset: 30, borderInset: 6 })
  assert.equal(layout.width, 68)
  assert.equal(layout.mode, 'name')
})

test('above names share one aligned band and have non-overlapping horizontal slots', () => {
  const items = [
    project('first', '2026-10-13'),
    project('second', '2026-10-14'),
    project('third', '2026-10-15')
  ]
  const measurements = Object.fromEntries(items.map(item => [item.id, { nameWidth: 70 }]))
  const rows = assignRows(items, params(10), measurements)
  assert.deepEqual(rows.map(item => item.row), [0, 0, 0])
  const above = rows.filter(item => item.layout.labelSide === 'above')
  assert.ok(above.length >= 2)
  assert.ok(rows.every(item => item.layout.top === 40))
  for (let index = 1; index < above.length; index++) {
    assert.ok(above[index - 1].layout.labelLeft + above[index - 1].layout.labelWidth + 6 <= above[index].layout.labelLeft)
  }
})

test('external labels use the right side and switch left at the range end', () => {
  const measurement = { nameWidth: 90 }
  const first = calculateProjectBarLayout(project('a', '2026-10-01'), params(), measurement)
  const last = calculateProjectBarLayout(project('b', '2026-10-31'), params(), measurement)
  assert.equal(first.labelSide, 'right')
  assert.equal(last.labelSide, 'left')
  assert.ok(first.occupiedStart >= 0)
  assert.ok(last.occupiedEnd <= params().totalWidth)
})

test('external names never extend outside the timeline or exceed their cap', () => {
  const layout = calculateProjectBarLayout(project('a', '2026-10-15'), params(100 / 30), { nameWidth: 900 })
  assert.ok(layout.labelWidth <= 240)
  assert.ok(layout.occupiedStart >= 0)
  assert.ok(layout.occupiedEnd <= params(100 / 30).totalWidth)
})

test('bars spanning range boundaries are clipped accurately', () => {
  const first = calculateProjectBarPosition(project('a', '2026-09-29', '2026-10-01'), params())
  const last = calculateProjectBarPosition(project('b', '2026-10-31', '2026-11-04'), params())
  assert.deepEqual(first, { left: 0, width: 18 })
  assert.deepEqual(last, { left: 600, width: 18 })
})

test('shared end dates and one-day projects count as overlaps', () => {
  assert.equal(isTimeOverlap(project('a', '2026-10-01', '2026-10-02'), project('b', '2026-10-02')), true)
  assert.equal(isTimeOverlap(project('a', '2026-10-02'), project('b', '2026-10-02')), true)
  assert.equal(isTimeOverlap(project('a', '2026-10-02'), project('b', '2026-10-03')), false)
})

test('consecutive projects with inside labels stay in the same row', () => {
  const timeline = { ...params(10), maxDate: dayjs('2026-12-31'), totalWidth: 92 * 10 }
  const items = [
    { ...project('subscription', '2026-10-14', '2026-11-04'), name: '会员订阅' },
    { ...project('design', '2026-11-11', '2026-11-24'), name: '声音设计' },
    { ...project('community', '2026-11-25', '2026-12-18'), name: '声音社区' }
  ]
  const rows = assignRows(items, timeline)
  assert.ok(rows.every(item => item.layout.mode === 'full'))
  assert.deepEqual(rows.map(item => item.row), [0, 0, 0])
})

test('colliding short names move above while all bars in their row stay aligned', () => {
  const items = [project('first', '2026-10-10'), project('second', '2026-10-11', '2026-10-20')]
  const rows = assignRows(items, params(), { first: { nameWidth: 70 }, second: { nameWidth: 40, dateWidth: 60 } })
  assert.equal(rows[0].layout.mode, 'external')
  assert.equal(rows[0].layout.labelSide, 'above')
  assert.deepEqual(rows.map(item => item.row), [0, 0])
  assert.equal(rows[0].layout.top, rows[1].layout.top)
  assert.equal(rows[0].layout.top, 40)
  assert.equal(calculateSwimlaneHeight(rows), 88)
})

test('same-day overlapping projects still use separate rows', () => {
  const rows = assignRows([
    project('first', '2026-10-01', '2026-10-10'),
    project('second', '2026-10-10', '2026-10-20')
  ], params())
  assert.notEqual(rows[0].row, rows[1].row)
})

test('a lower row reserves its name band without shifting individual bars', () => {
  const items = [
    project('upper', '2026-10-01', '2026-10-08'),
    project('lower-short', '2026-10-02'),
    project('lower-next', '2026-10-03', '2026-10-07')
  ]
  const rows = assignRows(items, params(), {
    upper: { nameWidth: 40, dateWidth: 60 },
    'lower-short': { nameWidth: 70 },
    'lower-next': { nameWidth: 40, dateWidth: 60 }
  })
  assert.deepEqual(rows.map(item => item.row), [0, 1, 1])
  assert.equal(rows[0].layout.top, 8)
  assert.equal(rows[1].layout.labelSide, 'above')
  assert.equal(rows[1].layout.top, 88)
  assert.equal(rows[2].layout.top, 88)
  assert.equal(calculateSwimlaneHeight(rows), 136)
})

test('adjacent short projects share a row with their names kept clear', () => {
  const items = [project('a', '2026-10-01'), project('b', '2026-10-02'), project('c', '2026-10-28')]
  const measurements = Object.fromEntries(items.map(item => [item.id, { nameWidth: 70 }]))
  const rows = assignRows(items, params(20), measurements)
  assert.equal(rows[0].row, rows[1].row)
  assert.equal(rows[0].layout.labelSide, 'above')
  assert.equal(rows[0].row, rows[2].row)
})

test('dense rows never overlap bars or outside labels', () => {
  const items = Array.from({ length: 31 }, (_, index) => {
    const date = dayjs('2026-10-01').add(index, 'day').format('YYYY-MM-DD')
    return project(String(index), date)
  })
  const measurements = Object.fromEntries(items.map(item => [item.id, { nameWidth: 65 }]))
  const rows = assignRows(items, params(5), measurements)
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      if (rows[i].row !== rows[j].row) continue
      const first = rows[i].layout
      const second = rows[j].layout
      assert.ok(first.occupiedEnd <= second.occupiedStart || second.occupiedEnd <= first.occupiedStart)
      assert.equal(first.top, second.top)
      if (first.labelSide === 'above' && second.labelSide === 'above') {
        assert.ok(first.labelLeft + first.labelWidth + 6 <= second.labelLeft || second.labelLeft + second.labelWidth + 6 <= first.labelLeft)
      }
    }
  }
})

test('same-year dates are compact and cross-year dates retain their years', () => {
  assert.equal(getProjectDateLabel(project('a', '2026-10-13', '2026-11-05')), '10/13–11/05')
  assert.equal(getProjectDateLabel(project('a', '2026-10-13')), '10/13')
  assert.equal(getProjectDateLabel(project('a', '2026-12-31', '2027-01-01')), '2026/12/31–2027/01/01')
})
