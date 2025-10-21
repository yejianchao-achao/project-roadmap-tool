import { useEffect, useState, useRef, useCallback } from 'react'
import { Spin, Segmented } from 'antd'
import dayjs from 'dayjs'
import TimelineHeader from './TimelineHeader'
import TimelineGrid from './TimelineGrid'
import Swimlane from './Swimlane'
import { calculateTimelineParams, calculateCustomTimelineParams } from '../../utils/dateUtils'
import { groupProjectsByProductLine } from '../../utils/layoutUtils'
import { BOARD_TYPES } from '../../utils/constants'
import '../../styles/timeline.css'

/**
 * 时间轴主视图组件
 * @param {array} projects - 项目列表
 * @param {array} productLines - 产品线列表
 * @param {array} selectedProductLines - 选中的产品线ID列表
 * @param {function} onEditProject - 编辑项目回调
 * @param {object} customTimelineRange - 自定义时间范围 { type, customRange }
 * @param {number} visibleMonths - 视口显示月份数（从外部传入）
 * @param {array} owners - 人员列表
 * @param {string} boardType - 看板类型（'status' | 'owner'）
 * @param {function} onBoardTypeChange - 看板类型变化回调
 * @param {number} monthWidth - 单月宽度（像素），默认150px
 */
function TimelineView({ 
  projects, 
  productLines, 
  selectedProductLines, 
  onEditProject,
  customTimelineRange,
  visibleMonths,
  owners = [],
  boardType = BOARD_TYPES.STATUS,
  onBoardTypeChange,
  monthWidth = 150
}) {
  const [timelineParams, setTimelineParams] = useState(null)
  const [groupedProjects, setGroupedProjects] = useState({})
  const scrollContainerRef = useRef(null)
  const headerRef = useRef(null)

  /**
   * 计算时间轴参数和分组项目（统一计算 pixelsPerDay）
   * 使用 monthWidth 动态计算 pixelsPerDay
   */
  useEffect(() => {
    // 使用自定义时间范围计算参数（如果提供）
    const params = customTimelineRange 
      ? calculateCustomTimelineParams(
          customTimelineRange.type, 
          customTimelineRange.customRange
        )
      : calculateTimelineParams(projects)
    
    // 按产品线分组项目
    const grouped = groupProjectsByProductLine(projects, productLines)
    setGroupedProjects(grouped)
    
    // 从单月宽度计算每天像素数
    // 假设每月30天，pixelsPerDay = monthWidth / 30
    const pixelsPerDay = monthWidth / 30
    
    // totalWidth 基于实际的时间轴总天数
    const totalWidth = params.totalDays * pixelsPerDay
    
    // 设置完整的时间轴参数
    setTimelineParams({
      ...params,
      pixelsPerDay,
      totalWidth
    })
  }, [projects, productLines, customTimelineRange, monthWidth])

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
   * 当时间范围变化时，滚动到起始位置
   */
  useEffect(() => {
    if (!scrollContainerRef.current || !timelineParams) return
    
    // 滚动到起始位置
    scrollContainerRef.current.scrollLeft = 0
    syncHeaderScroll()
  }, [customTimelineRange, syncHeaderScroll])

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
      {/* 看板切换控件 */}
      <div style={{ 
        marginBottom: 16, 
        display: 'flex', 
        justifyContent: 'flex-end',
        alignItems: 'center'
      }}>
        <Segmented
          value={boardType === BOARD_TYPES.STATUS ? 'timeline-status' : boardType === BOARD_TYPES.OWNER ? 'timeline-owner' : 'calendar'}
          onChange={(value) => onBoardTypeChange(value)}
          options={[
            { label: '进度看板', value: 'timeline-status' },
            { label: '人员看板', value: 'timeline-owner' },
            { label: '日历看板', value: 'calendar' }
          ]}
        />
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
                boardType={boardType}
                owners={owners}
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
