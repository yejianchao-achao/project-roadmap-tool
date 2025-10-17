/**
 * API服务模块
 * 封装所有与后端的HTTP通信
 */
import { message } from 'antd'

const API_BASE_URL = '/api'

/**
 * 封装fetch请求，统一处理错误
 * @param {string} url - 请求URL
 * @param {Object} options - fetch选项
 * @returns {Promise} 响应数据
 */
async function fetchWithErrorHandling(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    if (!data.success) {
      throw new Error(data.error || '请求失败')
    }

    return data
  } catch (error) {
    message.error(`请求失败: ${error.message}`)
    throw error
  }
}

// ==================== 产品线API ====================

/**
 * 获取所有产品线
 * @returns {Promise<Array>} 产品线列表
 */
export async function getProductLines() {
  const data = await fetchWithErrorHandling(`${API_BASE_URL}/productlines`)
  return data.data.productlines
}

/**
 * 创建新产品线
 * @param {string} name - 产品线名称
 * @returns {Promise<Object>} 创建的产品线对象
 */
export async function createProductLine(name) {
  const response = await fetch(`${API_BASE_URL}/productlines`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || '创建产品线失败')
  }

  return data.data
}

/**
 * 更新产品线
 * @param {string} id - 产品线ID
 * @param {string} name - 新名称
 * @returns {Promise<Object>} 更新后的产品线数据
 */
export const updateProductLine = async (id, name) => {
  const response = await fetch(`${API_BASE_URL}/productlines/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || '更新产品线失败')
  }

  return data.data
}

/**
 * 删除产品线
 * @param {string} id - 产品线ID
 * @returns {Promise<Object>} 删除结果
 */
export const deleteProductLine = async (id) => {
  const response = await fetch(`${API_BASE_URL}/productlines/${id}`, {
    method: 'DELETE',
  })

  const data = await response.json()

  if (!response.ok) {
    // 特殊处理403错误（有关联项目）
    if (response.status === 403) {
      throw new Error(data.error || '该产品线有关联项目，无法删除')
    }
    throw new Error(data.error || '删除产品线失败')
  }

  return data
}

/**
 * 批量更新产品线顺序
 * @param {Array<Object>} orderList - 排序列表 [{id, order}, ...]
 * @returns {Promise<Array>} 更新后的产品线列表
 */
export const reorderProductLines = async (orderList) => {
  const response = await fetch(`${API_BASE_URL}/productlines/reorder`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderList }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || '更新排序失败')
  }

  return data.data.productlines
}

// ==================== 项目API ====================

/**
 * 获取所有项目
 * @returns {Promise<Array>} 项目列表
 */
export async function getProjects() {
  const data = await fetchWithErrorHandling(`${API_BASE_URL}/projects`)
  return data.data.projects
}

/**
 * 根据ID获取项目
 * @param {string} projectId - 项目ID
 * @returns {Promise<Object>} 项目对象
 */
export async function getProjectById(projectId) {
  const data = await fetchWithErrorHandling(`${API_BASE_URL}/projects/${projectId}`)
  return data.data
}

/**
 * 创建新项目
 * @param {Object} projectData - 项目数据
 * @param {string} projectData.name - 项目名称
 * @param {string} projectData.productLineId - 产品线ID
 * @param {string} projectData.startDate - 开始日期 (YYYY-MM-DD)
 * @param {string} projectData.endDate - 结束日期 (YYYY-MM-DD)
 * @param {string} projectData.status - 项目状态
 * @returns {Promise<Object>} 创建的项目对象
 */
export async function createProject(projectData) {
  const data = await fetchWithErrorHandling(`${API_BASE_URL}/projects`, {
    method: 'POST',
    body: JSON.stringify(projectData),
  })
  return data.data
}

/**
 * 更新项目
 * @param {string} projectId - 项目ID
 * @param {Object} updates - 要更新的字段
 * @returns {Promise<Object>} 更新后的项目对象
 */
export async function updateProject(projectId, updates) {
  const data = await fetchWithErrorHandling(`${API_BASE_URL}/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
  return data.data
}

/**
 * 删除项目
 * @param {string} projectId - 项目ID
 * @returns {Promise<Object>} 删除结果
 */
export async function deleteProject(projectId) {
  const data = await fetchWithErrorHandling(`${API_BASE_URL}/projects/${projectId}`, {
    method: 'DELETE',
  })
  return data
}

// ==================== 设置API ====================

/**
 * 获取用户设置
 * @returns {Promise<Object>} 设置对象
 */
export async function getSettings() {
  const data = await fetchWithErrorHandling(`${API_BASE_URL}/settings`)
  return data.data
}

/**
 * 更新可见产品线设置
 * @param {Array<string>} productLineIds - 产品线ID列表
 * @returns {Promise<Object>} 更新结果
 */
export async function updateVisibleProductLines(productLineIds) {
  const data = await fetchWithErrorHandling(`${API_BASE_URL}/settings/visible-productlines`, {
    method: 'PUT',
    body: JSON.stringify({ visibleProductLines: productLineIds }),
  })
  return data.data
}

// ==================== 人员相关API ====================

/**
 * 获取所有人员
 * @returns {Promise<{owners: Array}>} 人员列表
 */
export const getOwners = async () => {
  const response = await fetch(`${API_BASE_URL}/owners`)
  if (!response.ok) {
    throw new Error('获取人员列表失败')
  }
  return response.json()
}

/**
 * 创建新人员
 * @param {string} name - 人员姓名
 * @returns {Promise<Object>} 创建的人员对象
 */
export const createOwner = async (name) => {
  const response = await fetch(`${API_BASE_URL}/owners`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '创建人员失败')
  }
  
  return response.json()
}

/**
 * 删除人员
 * @param {string} ownerId - 人员ID
 * @returns {Promise<Object>} 删除结果
 */
export const deleteOwner = async (ownerId) => {
  const response = await fetch(`${API_BASE_URL}/owners/${ownerId}`, {
    method: 'DELETE'
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '删除人员失败')
  }
  
  return response.json()
}

/**
 * 获取人员关联的项目数量
 * @param {string} ownerId - 人员ID
 * @returns {Promise<{ownerId: string, projectCount: number}>} 项目数量
 */
export const getOwnerProjectCount = async (ownerId) => {
  const response = await fetch(`${API_BASE_URL}/owners/${ownerId}/projects/count`)
  
  if (!response.ok) {
    throw new Error('获取项目数失败')
  }
  
  return response.json()
}

/**
 * 重置设置为默认值
 * @returns {Promise<Object>} 默认设置对象
 */
export async function resetSettings() {
  const data = await fetchWithErrorHandling(`${API_BASE_URL}/settings/reset`, {
    method: 'POST',
  })
  return data.data
}
