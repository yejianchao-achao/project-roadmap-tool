import { Card, Radio, DatePicker, Button, Space, message } from 'antd'
import { ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons'
import { useState, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import { getProjectsDateRange, validateDateRange } from '../utils/dateUtils'
import { MIN_VISIBLE_MONTHS, MAX_VISIBLE_MONTHS } from '../utils/constants'
import '../styles/timeline-settings.css'

const { RangePicker } = DatePicker

/**
 * 时间轴设置组件
 * 提供时间范围设置和缩放控制功能
 * @param {Array} projects - 项目列表
 * @param {Object} currentRange - 当前时间范围 { type, customRange }
 * @param {Function} onRangeChange - 时间范围变化回调
 * @param {Number} visibleMonths - 当前缩放级别
 * @param {Function} onZoomChange - 缩放变化回调
 */
function TimelineSettings({ 
  projects, 
  currentRange, 
  onRangeChange, 
  visibleMonths, 
  onZoomChange 
}) {
  // 状态管理
  const [rangeType, setRangeType] = useState(currentRange.type)
  const [customRange, setCustomRange] = useState(
    currentRange.customRange 
      ? [dayjs(currentRange.customRange.startDate), dayjs(currentRange.customRange.endDate)]
      : null
  )
  const [showCustomPicker, setShowCustomPicker] = useState(currentRange.type === 'custom')
  const [projectsDateRange, setProjectsDateRange] = useState(null)
  const [validationWarning, setValidationWarning] = useState(null)

  /**
   * 计算并更新项目时间范围提示
   */
  useEffect(() => {
    const range = getProjectsDateRange(projects)
    setProjectsDateRange(range)
  }, [projects])

  /**
   * 同步外部传入的currentRange
   */
  useEffect(() => {
    setRangeType(currentRange.type)
    setShowCustomPicker(currentRange.type === 'custom')
    if (currentRange.customRange) {
      setCustomRange([
        dayjs(currentRange.customRange.startDate),
        dayjs(currentRange.customRange.endDate)
      ])
    }
  }, [currentRange])

  /**
   * 处理快捷选项变化
   */
  const handleRangeTypeChange = useCallback((e) => {
    const newType = e.target.value
    setRangeType(newType)
    
    if (newType === 'custom') {
      setShowCustomPicker(true)
    } else {
      setShowCustomPicker(false)
      setValidationWarning(null)
      // 立即应用快捷选项
      onRangeChange({ type: newType, customRange: null })
    }
  }, [onRangeChange])

  /**
   * 处理自定义日期范围变化
   */
  const handleCustomRangeChange = useCallback((dates) => {
    setCustomRange(dates)
    setValidationWarning(null)
  }, [])

  /**
   * 应用自定义日期范围
   */
  const handleApply = useCallback(() => {
    if (!customRange || customRange.length !== 2) {
      message.error('请选择日期范围')
      return
    }

    const startDate = customRange[0].format('YYYY-MM-DD')
    const endDate = customRange[1].format('YYYY-MM-DD')

    // 验证日期范围
    const validation = validateDateRange(startDate, endDate)
    
    if (!validation.valid) {
      message.error(validation.error)
      return
    }

    if (validation.warning) {
      setValidationWarning(validation.warning)
    } else {
      setValidationWarning(null)
    }

    // 应用自定义范围
    onRangeChange({
      type: 'custom',
      customRange: { startDate, endDate }
    })
    
    message.success('时间范围已更新')
  }, [customRange, onRangeChange])

  /**
   * 重置为默认范围（最近一年）
   */
  const handleReset = useCallback(() => {
    setRangeType('1year')
    setShowCustomPicker(false)
    setCustomRange(null)
    setValidationWarning(null)
    onRangeChange({ type: '1year', customRange: null })
    message.success('已重置为默认范围')
  }, [onRangeChange])

  /**
   * 处理缩放控制 - 放大（减少显示月份）
   */
  const handleZoomIn = useCallback(() => {
    if (visibleMonths > MIN_VISIBLE_MONTHS) {
      onZoomChange(visibleMonths - 1)
    }
  }, [visibleMonths, onZoomChange])

  /**
   * 处理缩放控制 - 缩小（增加显示月份）
   */
  const handleZoomOut = useCallback(() => {
    if (visibleMonths < MAX_VISIBLE_MONTHS) {
      onZoomChange(visibleMonths + 1)
    }
  }, [visibleMonths, onZoomChange])

  /**
   * 禁用未来日期（可选，根据需求调整）
   */
  const disabledDate = (current) => {
    // 可以根据需求禁用某些日期
    // 例如：禁用未来日期
    // return current && current > dayjs().endOf('day')
    return false
  }

  return (
    <Card title="时间轴设置" size="small" className="timeline-settings-card">
      {/* 项目时间范围提示 */}
      <div className={`project-range-hint ${!projectsDateRange ? 'no-projects' : ''}`}>
        {projectsDateRange ? (
          <>
            项目时间范围: {projectsDateRange.minDate} ~ {projectsDateRange.maxDate}
          </>
        ) : (
          '暂无项目'
        )}
      </div>

      {/* 时间范围快捷选项 */}
      <div className="range-options">
        <Radio.Group value={rangeType} onChange={handleRangeTypeChange}>
          <Space direction="vertical">
            <Radio value="3months">最近3个月</Radio>
            <Radio value="6months">最近半年</Radio>
            <Radio value="1year">最近一年</Radio>
            <Radio value="custom">自定义</Radio>
          </Space>
        </Radio.Group>
      </div>

      {/* 自定义日期选择器 */}
      {showCustomPicker && (
        <div className="custom-range-picker">
          <RangePicker
            value={customRange}
            onChange={handleCustomRangeChange}
            disabledDate={disabledDate}
            format="YYYY-MM-DD"
            placeholder={['开始日期', '结束日期']}
            style={{ width: '100%', marginBottom: '12px' }}
          />
          
          {/* 警告提示 */}
          {validationWarning && (
            <div className="range-warning">
              ⚠️ {validationWarning}
            </div>
          )}
          
          {/* 操作按钮 */}
          <div className="range-actions">
            <Button type="primary" onClick={handleApply} size="small">
              应用
            </Button>
            <Button onClick={handleReset} size="small">
              重置
            </Button>
          </div>
        </div>
      )}

      {/* 缩放控制 */}
      <div className="zoom-controls">
        <Button
          icon={<ZoomOutOutlined />}
          onClick={handleZoomOut}
          disabled={visibleMonths >= MAX_VISIBLE_MONTHS}
          title="显示更多月份"
          size="small"
        />
        <span className="zoom-level">{visibleMonths}个月</span>
        <Button
          icon={<ZoomInOutlined />}
          onClick={handleZoomIn}
          disabled={visibleMonths <= MIN_VISIBLE_MONTHS}
          title="显示更少月份"
          size="small"
        />
      </div>
    </Card>
  )
}

export default TimelineSettings
