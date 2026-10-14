import { useEffect, useRef, useState } from 'react'
import { dateAtPosition, nearestFreeRow, shiftProjectDates } from '../../utils/placementUtils'

const DRAG_DISTANCE = 6

export default function useTimelineInteractions({ timelineParams, scrollContainerRef, onCreateProject, onMoveProject }) {
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const layouts = useRef({})
  const gesture = useRef(null)
  const suppressClick = useRef(false)
  const blankDown = useRef(null)
  const cleanup = useRef(() => {})
  const latest = useRef(null)
  latest.current = { timelineParams, onCreateProject, onMoveProject, saving }

  useEffect(() => () => cleanup.current(), [])

  const registerLayout = (lineId, items) => { layouts.current[lineId] = items }

  const startDrag = (project, event) => {
    if (event.button !== 0 || !event.isPrimary || latest.current.saving || !latest.current.timelineParams) return
    cleanup.current()
    const scroller = scrollContainerRef.current
    const node = event.currentTarget
    const pointerId = event.pointerId
    const state = {
      project, startX: event.clientX, startY: event.clientY,
      x: event.clientX, y: event.clientY, initialScroll: scroller.scrollLeft,
      active: false, preview: null, rows: { ...layouts.current }, frame: null
    }
    gesture.current = state

    const compute = () => {
      const params = latest.current.timelineParams
      const bounds = scroller.getBoundingClientRect()
      const inViewport = state.x >= bounds.left && state.x < bounds.left + scroller.clientWidth &&
        state.y >= bounds.top && state.y < bounds.top + scroller.clientHeight
      const lane = inViewport && [...scroller.querySelectorAll('.swimlane[data-product-line-id]')].find(element => {
        const rect = element.getBoundingClientRect()
        return state.y >= rect.top && state.y < rect.bottom
      })
      if (!lane) {
        state.preview = { project, valid: false, x: state.x, y: state.y }
        setPreview(state.preview)
        return
      }
      const productLineId = lane.dataset.productLineId
      const slots = [...lane.querySelectorAll('.timeline-row-slot')]
      const slot = slots.find(element => {
        const rect = element.getBoundingClientRect()
        return state.y >= rect.top && state.y < rect.bottom
      }) || slots[slots.length - 1]
      const requestedRow = Number(slot?.dataset.layoutRow || 0)
      const deltaDays = Math.round((state.x - state.startX + scroller.scrollLeft - state.initialScroll) / params.pixelsPerDay)
      const candidate = { ...project, ...shiftProjectDates(project, deltaDays, params), productLineId }
      const row = nearestFreeRow(candidate, state.rows[productLineId] || [], requestedRow)
      state.preview = {
        project, candidate, requestedRow, row, productLineId,
        productLineName: lane.dataset.productLineName,
        valid: true, x: state.x, y: state.y
      }
      setPreview(state.preview)
    }

    const autoScroll = () => {
      if (!state.active) return
      const bounds = scroller.getBoundingClientRect()
      const board = scroller.closest('.roadmap-board')
      let changed = false
      if (state.y >= bounds.top && state.y <= bounds.bottom && state.x >= bounds.left && state.x <= bounds.right) {
        const oldLeft = scroller.scrollLeft
        const margin = 36
        if (state.x < bounds.left + margin) scroller.scrollLeft -= 12
        else if (state.x > bounds.right - margin) scroller.scrollLeft += 12
        changed = oldLeft !== scroller.scrollLeft
      }
      if (board) {
        const rect = board.getBoundingClientRect()
        const oldTop = board.scrollTop
        if (state.x >= rect.left && state.x <= rect.right) {
          if (state.y >= rect.top && state.y < rect.top + 32) board.scrollTop -= 10
          else if (state.y <= rect.bottom && state.y > rect.bottom - 32) board.scrollTop += 10
        }
        changed ||= oldTop !== board.scrollTop
      }
      if (changed) compute()
      state.frame = requestAnimationFrame(autoScroll)
    }

    const move = pointer => {
      if (pointer.pointerId !== pointerId) return
      state.x = pointer.clientX
      state.y = pointer.clientY
      if (!state.active && Math.hypot(state.x - state.startX, state.y - state.startY) >= DRAG_DISTANCE) {
        state.active = true
        suppressClick.current = true
        node.setPointerCapture?.(pointerId)
        document.body.classList.add('timeline-dragging')
        state.frame = requestAnimationFrame(autoScroll)
      }
      if (state.active) {
        pointer.preventDefault()
        compute()
      }
    }

    const dispose = () => {
      state.active = false
      cancelAnimationFrame(state.frame)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', cancel)
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('blur', cancel)
      if (node.hasPointerCapture?.(pointerId)) node.releasePointerCapture(pointerId)
      document.body.classList.remove('timeline-dragging')
      gesture.current = null
      cleanup.current = () => {}
    }
    const cancel = () => {
      if (state.active) suppressClick.current = true
      dispose()
      setPreview(null)
    }
    const keydown = key => {
      if (key.key === 'Escape') { key.preventDefault(); cancel() }
    }
    const finish = async pointer => {
      if (pointer.pointerId !== pointerId) return
      if (!state.active) { dispose(); return }
      state.x = pointer.clientX
      state.y = pointer.clientY
      compute()
      const drop = state.preview
      dispose()
      if (!drop?.valid || (drop.candidate.startDate === project.startDate && drop.candidate.endDate === project.endDate &&
        drop.productLineId === project.productLineId && drop.row === project.row)) {
        setPreview(null)
        return
      }
      setSaving(true)
      const affectedLines = [...new Set([project.productLineId, drop.productLineId])]
      try {
        await latest.current.onMoveProject(project.id, {
          startDate: drop.candidate.startDate, endDate: drop.candidate.endDate,
          productLineId: drop.productLineId, preferredRow: drop.requestedRow,
          expectedUpdatedAt: project.updatedAt,
          rowAssignments: affectedLines.flatMap(id => state.rows[id] || []).map(item => ({ id: item.id, row: item.row, updatedAt: item.updatedAt }))
        })
      } finally {
        setSaving(false)
        setPreview(null)
      }
    }

    cleanup.current = dispose
    window.addEventListener('pointermove', move, { passive: false })
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', cancel)
    window.addEventListener('keydown', keydown)
    window.addEventListener('blur', cancel)
  }

  const onPointerDownCapture = event => {
    suppressClick.current = false
    blankDown.current = { x: event.clientX, y: event.clientY }
  }
  const onClickCapture = event => {
    if (suppressClick.current || latest.current.saving) {
      event.preventDefault()
      event.stopPropagation()
    }
  }
  const onBlankClick = event => {
    if (event.button !== 0 || suppressClick.current || latest.current.saving) return
    if (blankDown.current && Math.hypot(event.clientX - blankDown.current.x, event.clientY - blankDown.current.y) >= DRAG_DISTANCE) return
    if (event.target.closest('button, a, input, label, select, textarea, [role="radio"], [role="slider"], .swimlane-label, .timeline-header, .timeline-toolbar')) return
    const scroller = scrollContainerRef.current
    const params = latest.current.timelineParams
    if (!scroller || !params) { latest.current.onCreateProject?.(); return }
    const rect = scroller.getBoundingClientRect()
    if (scroller.contains(event.target) &&
      (event.clientX >= rect.left + scroller.clientWidth || event.clientY >= rect.top + scroller.clientHeight)) return
    const lane = event.target.closest('.swimlane[data-product-line-id]')
    const date = dateAtPosition(event.clientX - rect.left + scroller.scrollLeft, params)
    const slots = lane ? [...lane.querySelectorAll('.timeline-row-slot')] : []
    const slot = slots.find(element => {
      const bounds = element.getBoundingClientRect()
      return event.clientY >= bounds.top && event.clientY < bounds.bottom
    })
    latest.current.onCreateProject?.({
      startDate: date, endDate: date, productLineId: lane?.dataset.productLineId,
      layoutRow: slot ? Number(slot.dataset.layoutRow) : undefined
    })
  }

  return { preview, saving, registerLayout, startDrag, onPointerDownCapture, onClickCapture, onBlankClick }
}
