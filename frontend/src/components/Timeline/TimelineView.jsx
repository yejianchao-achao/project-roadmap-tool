import { useEffect, useState, useRef } from 'react'
import { Spin } from 'antd'
import { ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import TimelineHeader from './TimelineHeader'
import TimelineGrid from './TimelineGrid'
import Swimlane from './Swimlane'
import { calculateTimelineParams } from '../../utils/dateUtils'
import { groupProjectsByProductLine } from '../../utils/layoutUtils'
import { DEFAULT_VISIBLE_MONTHS, MIN_VISIBLE_MONTHS, MAX_VISIBLE_MONTHS } from '../../utils/constants'
import '../../styles/timeline.css'

/**
 * 时间轴主视图组件
 * @param {array} projects - 项目列表
 * @param {array} productLines - 产品线列表
 * @param {array} selectedProductLines - 选中的产品线ID列表
 * @param {function} onEditProject - 编辑项目回调
 */
function TimelineView({ projects, productLines, selectedProductLines, onEditProject }) {
  const [timelineParams, setTimelineParams] = useState(null)
  const [groupedProjects, setGroupedProjects] = useState({})
  const [visibleMonths, setVisibleMonths] = useState(DEFAULT_VISIBLE_MONTHS)
  const scrollContainerRef = useRef(null)
  const headerRef = useRef(null)

  /**
   * 计算时间轴参数和分组项目
   */
  useEffect(() => {
    // 计算时间轴参数（全年12个月）
    const params = calculateTimelineParams(projects)
    setTimelineParams(params)

    // 按产品线分组项目
    const grouped = groupProjectsByProductLine(projects, productLines)
    setGroupedProjects(grouped)
  }, [projects, productLines])

  /**
   * 根据视口宽度和显示月份数动态计算每天像素数
   */
  useEffect(() => {
    if (!scrollContainerRef.current || !timelineParams) return

    const updateTimelineScale = () => {
      // 获取实际视口宽度
      const viewportWidthPx = scrollContainerRef.current.offsetWidth
      
      if (viewportWidthPx === 0) return // 避免除以0

      // 计算每天像素数（基于显示的月份数）
      const avgDaysPerMonth = 30
      const pixelsPerDay = viewportWidthPx / (visibleMonths * avgDaysPerMonth)
      
      // 计算总天数
      const totalDays = timelineParams.maxDate.diff(timelineParams.minDate, 'day')
      
      // 更新timelineParams
      setTimelineParams(prev => ({
        ...prev,
        pixelsPerDay: pixelsPerDay,
        totalWidth: totalDays * pixelsPerDay
      }))
    }

    // 延迟执行，确保DOM已渲染
    const timer = setTimeout(updateTimelineScale, 0)
    return () => clearTimeout(timer)
  }, [visibleMonths, scrollContainerRef.current?.offsetWidth])

  /**
   * 监听窗口大小变化，重新计算布局
   */
  useEffect(() => {
    const handleResize = () => {
      if (!scrollContainerRef.current || !timelineParams) return

      const viewportWidthPx = scrollContainerRef.current.offsetWidth
      if (viewportWidthPx === 0) return

      const avgDaysPerMonth = 30
      const pixelsPerDay = viewportWidthPx / (visibleMonths * avgDaysPerMonth)
      const totalDays = timelineParams.maxDate.diff(timelineParams.minDate, 'day')
      
      setTimelineParams(prev => ({
        ...prev,
        pixelsPerDay: pixelsPerDay,
        totalWidth: totalDays * pixelsPerDay
      }))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [visibleMonths, timelineParams?.minDate, timelineParams?.maxDate])

  /**
   * 同步头部和内容区域的滚动
   */
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    const header = headerRef.current

    if (!scrollContainer || !header) return

    const handleScroll = () => {
      header.scrollLeft = scrollContainer.scrollLeft
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [])

  /**
   * 初始化时滚动到当前月份（改进版）
   */
  useEffect(() => {
    if (!timelineParams?.pixelsPerDay || !scrollContainerRef.current) return

    const scrollContainer = scrollContainerRef.current
    const { minDate, pixelsPerDay } = timelineParams
    const now = dayjs()
    
    // 计算当前日期距离起始日期的天数
    const daysFromStart = now.diff(minDate, 'day')
    
    // 计算当前日期的像素位置
    const currentDatePosition = daysFromStart * pixelsPerDay
    
    // 获取视口宽度
    const viewportWidth = scrollContainer.offsetWidth
    
    // 让当前日期显示在视口左侧1/4位置
    const scrollLeft = Math.max(0, currentDatePosition - viewportWidth / 4)
    
    // 使用requestAnimationFrame确保DOM已渲染
    requestAnimationFrame(() => {
      scrollContainer.scrollLeft = scrollLeft
    })
  }, [timelineParams?.pixelsPerDay, timelineParams?.minDate, timelineParams?.totalWidth])

  /**
   * 增加显示的月份数量（缩小视口）
   */
  const handleZoomOut = () => {
    setVisibleMonths(prev => Math.min(prev + 1, MAX_VISIBLE_MONTHS))
  }

  /**
   * 减少显示的月份数量（放大视口）
   */
  const handleZoomIn = () => {
    setVisibleMonths(prev => Math.max(prev - 1, MIN_VISIBLE_MONTHS))
  }

  /**
   * 获取视口宽度（始终撑满屏幕）
   */
  const getViewportWidth = () => {
    return '100%'
  }

  /**
   * 过滤显示的产品线
   */
  const getVisibleProductLines = () => {
    // 只显示选中的产品线
    return productLines.filter(pl => selectedProductLines.includes(pl.id))
  }

  // 如果没有项目，显示空状态
  if (!timelineParams || projects.length === 0) {
    return (
      <div className="timeline-empty">
        <p>暂无项目数据</p>
        <p style={{ color: '#999', fontSize: '14px' }}>点击右上角"新建项目"按钮创建第一个项目</p>
      </div>
    )
  }

  const visibleProductLines = getVisibleProductLines()

  return (
    <div className="timeline-container">
      {/* 缩放控制按钮 */}
      <div className="timeline-zoom-controls">
        <button 
          className="zoom-button" 
          onClick={handleZoomOut}
          disabled={visibleMonths >= MAX_VISIBLE_MONTHS}
          title="显示更多月份"
        >
          <ZoomOutOutlined />
        </button>
        <span className="zoom-level">{visibleMonths}个月</span>
        <button 
          className="zoom-button" 
          onClick={handleZoomIn}
          disabled={visibleMonths <= MIN_VISIBLE_MONTHS}
          title="显示更少月份"
        >
          <ZoomInOutlined />
        </button>
      </div>

      {/* 时间轴头部 - 月份刻度 */}
      <TimelineHeader 
        timelineParams={timelineParams} 
        headerRef={headerRef}
        viewportWidth={getViewportWidth()}
      />

      {/* 时间轴内容区域 - 可滚动，宽度由视口月份数决定 */}
      <div 
        className="timeline-scroll-container" 
        ref={scrollContainerRef}
        style={{ width: getViewportWidth() }}
      >
        <div 
          className="timeline-content" 
          style={{ width: `${timelineParams.totalWidth}px` }}
        >
          {/* 背景网格 - 周刻度 */}
          <TimelineGrid timelineParams={timelineParams} />

          {/* 产品线泳道 */}
          {visibleProductLines.length > 0 ? (
            visibleProductLines.map(productLine => (
              <Swimlane
                key={productLine.id}
                productLine={productLine}
                projects={groupedProjects[productLine.id]?.projects || []}
                timelineParams={timelineParams}
                onEditProject={onEditProject}
              />
            ))
          ) : (
            <div className="timeline-empty">
              <p>请选择要显示的产品线</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TimelineView
