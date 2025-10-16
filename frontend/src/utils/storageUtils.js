/**
 * localStorage工具函数模块
 * 处理时间轴设置的持久化存储
 */

const STORAGE_KEY = 'timeline_settings'

/**
 * 保存时间轴设置到localStorage
 * @param {object} settings - 设置对象
 * @param {object} settings.timelineRange - 时间范围设置
 * @param {string} settings.timelineRange.type - 范围类型: '3months' | '6months' | '1year' | 'custom'
 * @param {object} settings.timelineRange.customRange - 自定义范围 { startDate, endDate }
 * @param {number} settings.visibleMonths - 可见月份数
 */
export function saveTimelineSettings(settings) {
  try {
    const data = {
      timelineRange: settings.timelineRange,
      visibleMonths: settings.visibleMonths,
      timestamp: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('保存时间轴设置失败:', error)
    // localStorage可能在隐私模式下不可用，或配额已满
    // 静默失败，不影响用户使用
  }
}

/**
 * 从localStorage加载时间轴设置
 * @returns {object|null} 设置对象或null（无数据或数据无效时）
 */
export function loadTimelineSettings() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) {
      return null
    }
    
    const settings = JSON.parse(data)
    
    // 验证数据结构
    if (!validateSettings(settings)) {
      console.warn('时间轴设置数据无效，将使用默认值')
      // 清除无效数据
      clearTimelineSettings()
      return null
    }
    
    return settings
  } catch (error) {
    console.error('加载时间轴设置失败:', error)
    // JSON解析失败或localStorage不可用
    return null
  }
}

/**
 * 验证设置数据结构的有效性
 * @param {object} settings - 设置对象
 * @returns {boolean} 是否有效
 */
export function validateSettings(settings) {
  // 检查基本结构
  if (!settings || typeof settings !== 'object') {
    return false
  }
  
  // 验证timelineRange
  if (!settings.timelineRange || typeof settings.timelineRange !== 'object') {
    return false
  }
  
  // 验证范围类型
  const validTypes = ['3months', '6months', '1year', 'custom']
  if (!validTypes.includes(settings.timelineRange.type)) {
    return false
  }
  
  // 如果是自定义类型，验证customRange
  if (settings.timelineRange.type === 'custom') {
    const { customRange } = settings.timelineRange
    if (!customRange || 
        typeof customRange !== 'object' ||
        !customRange.startDate || 
        !customRange.endDate) {
      return false
    }
    
    // 验证日期格式（简单检查）
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(customRange.startDate) || 
        !dateRegex.test(customRange.endDate)) {
      return false
    }
  }
  
  // 验证visibleMonths
  if (typeof settings.visibleMonths !== 'number' || 
      settings.visibleMonths < 2 || 
      settings.visibleMonths > 12) {
    return false
  }
  
  return true
}

/**
 * 清除localStorage中的时间轴设置
 */
export function clearTimelineSettings() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('清除时间轴设置失败:', error)
  }
}
