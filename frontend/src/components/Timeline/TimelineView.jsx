import { useEffect, useState, useRef, useCallback } from 'react'
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
   * 计算时间轴参数和分组项目（统一计算 pixelsPerDay）
   */
  useEffect(() => {
    // 获取基础时间参数
    const params = calculateTimelineParams(projects)
    
    // 按产品线分组项目
    const grouped = groupProjectsByProductLine(projects, productLines)
    setGroupedProjects(grouped)
    
    // 如果 scrollContainerRef 还未准备好，先设置基础参数
    if (!scrollContainerRef.current) {
      // 使用默认值先渲染，等 ref 准备好后再更新
      const avgDaysPerMonth = 30
      const defaultPixelsPerDay = 1200 / (visibleMonths * avgDaysPerMonth) // 假设默认宽度1200px
      setTimelineParams({
        ...params,
        pixelsPerDay: defaultPixelsPerDay,
        totalWidth: params.totalDays * defaultPixelsPerDay
      })
      return
    }

    // 动态计算 pixelsPerDay
    // 关键：pixelsPerDay 应该是固定的，不应该基于 visibleMonths
    // 而应该基于一个合理的显示密度（例如每天5像素）
    const pixelsPerDay = 5 // 固定值，每天5像素
    
    // totalWidth 基于实际的时间轴总天数
    const totalWidth = params.totalDays * pixelsPerDay
    
    // 设置完整的时间轴参数
    setTimelineParams({
      ...params,
      pixelsPerDay,
      totalWidth
    })
  }, [projects, productLines, visibleMonths, scrollContainerRef.current?.offsetWidth])

  /**
   * 监听窗口大小变化，触发重新计算
   * 注意：实际计算由上面的 useEffect 处理（通过 offsetWidth 依赖）
   */
  useEffect(() => {
    const handleResize = () => {
      // 强制触发重新渲染，让上面的 useEffect 重新计算
      if (scrollContainerRef.current) {
        // 通过改变依赖项触发重新计算
        scrollContainerRef.current.offsetWidth
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  /**
   * 同步头部和内容区域的滚动
   * 使用 transform 而不是 scrollLeft，因为 header 设置了 overflow-x: hidden
   */
  const syncHeaderScroll = useCallback(() => {
    const scrollContainer = scrollContainerRef.current
    const header = headerRef.current
    if (!scrollContainer || !header) return
    
    const headerContent = header.querySelector('.timeline-header-content')
    if (headerContent) {
      const scrollLeft = scrollContainer.scrollLeft
      headerContent.style.transform = `translateX(-${scrollLeft}px)`
    }
  }, [])

  /**
   * 建立滚动事件监听器，并立即执行一次同步
   * 依赖timelineParams确保在组件完全渲染后才建立监听器
   */
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    const header = headerRef.current
    
    if (!scrollContainer || !header || !timelineParams) {
      return
    }
    
    const handleScroll = () => {
      syncHeaderScroll()
    }
    
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    
    // 立即执行一次同步，确保初始状态正确
    syncHeaderScroll()
    
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, [syncHeaderScroll, timelineParams])

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
      // 手动触发一次同步，确保初始滚动位置的头部也同步
      syncHeaderScroll()
    })
  }, [timelineParams?.pixelsPerDay, timelineParams?.minDate, timelineParams?.totalWidth, syncHeaderScroll])

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
