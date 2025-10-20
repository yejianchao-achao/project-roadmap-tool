/**
 * 日历工具函数
 * 提供日历数据计算和颜色获取等功能
 */

import dayjs from 'dayjs'

/**
 * 计算日历数据
 * 生成日历显示所需的所有数据，包括日期数组和项目分组
 * 
 * @param {dayjs.Dayjs} month - 当前月份
 * @param {Array} projects - 项目列表
 * @param {Array} selectedProductLines - 选中的产品线ID列表
 * @returns {Object} 日历数据
 * @returns {Array} returns.dates - 日期数组（42个Dayjs对象，6周×7天）
 * @returns {Object} returns.projectsByDate - 按日期分组的项目 { 'YYYY-MM-DD': Project[] }
 * @returns {dayjs.Dayjs} returns.firstDay - 月份第一天
 * @returns {dayjs.Dayjs} returns.lastDay - 月份最后一天
 */
export function calculateCalendarData(month, projects, selectedProductLines) {
  // 步骤1: 计算月份边界
  const firstDay = month.startOf('month')  // 月份第一天
  const lastDay = month.endOf('month')     // 月份最后一天
  
  // 步骤2: 计算日历显示范围（包含上月末尾和下月开头）
  // startOf('week') 会返回该周的周日
  const startDate = firstDay.startOf('week')  // 第一周的周日
  const endDate = lastDay.endOf('week')       // 最后一周的周六
  
  // 步骤3: 生成日期数组（42个格子，6周）
  const dates = []
  let current = startDate
  
  // 循环生成日期，直到覆盖整个日历网格
  while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
    dates.push(current)
    current = current.add(1, 'day')
  }
  
  // 步骤4: 筛选项目
  const filteredProjects = projects.filter(project => {
    // 4.1 产品线筛选
    // 只显示选中产品线的项目
    if (!selectedProductLines.includes(project.productLineId)) {
      return false
    }
    
    // 4.2 月份筛选（endDate在当前月）
    // 只显示结束日期在当前月的项目
    const endDate = dayjs(project.endDate)
    return endDate.isSame(month, 'month')
  })
  
  // 步骤5: 按日期分组项目
  const projectsByDate = {}
  
  filteredProjects.forEach(project => {
    // 使用endDate作为分组键
    const dateKey = dayjs(project.endDate).format('YYYY-MM-DD')
    
    // 初始化日期数组（如果不存在）
    if (!projectsByDate[dateKey]) {
      projectsByDate[dateKey] = []
    }
    
    // 添加项目到对应日期
    projectsByDate[dateKey].push(project)
  })
  
  // 步骤6: 对每个日期的项目按创建时间排序
  // 确保项目显示顺序一致
  Object.keys(projectsByDate).forEach(dateKey => {
    projectsByDate[dateKey].sort((a, b) => a.createdAt - b.createdAt)
  })
  
  // 步骤7: 返回计算结果
  return {
    dates,              // 日期数组（42个Dayjs对象）
    projectsByDate,     // 项目分组 { 'YYYY-MM-DD': Project[] }
    firstDay,           // 月份第一天
    lastDay             // 月份最后一天
  }
}

/**
 * 获取项目的负责人颜色
 * 根据项目的负责人ID查找对应的颜色
 * 
 * @param {Object} project - 项目对象
 * @param {string} project.ownerId - 项目负责人ID
 * @param {Array} owners - 人员列表
 * @param {string} owners[].id - 人员ID
 * @param {string} owners[].color - 人员颜色（十六进制格式）
 * @returns {string} 颜色值（十六进制格式，如 #1890ff）
 */
export function getProjectOwnerColor(project, owners) {
  // 查找负责人
  const owner = owners.find(o => o.id === project.ownerId)
  
  // 返回颜色，如果找不到负责人则返回默认灰色
  return owner?.color || '#999999'
}
