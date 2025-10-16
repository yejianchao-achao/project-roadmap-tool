import { useState } from 'react'
import { Drawer, Table, Button, Input, Space, Switch, Modal, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { createProductLine, updateProductLine, deleteProductLine } from '../services/api'

const { confirm } = Modal

/**
 * 产品线管理组件
 * 提供产品线的增删改查和显示/隐藏管理功能
 * 
 * @param {boolean} visible - 抽屉是否可见
 * @param {function} onClose - 关闭回调
 * @param {Array} productLines - 产品线列表
 * @param {Array} projects - 项目列表（用于统计关联数）
 * @param {Array} selectedProductLines - 选中的产品线ID列表
 * @param {function} onRefresh - 刷新数据回调
 * @param {function} onVisibilityChange - 显示状态变化回调
 */
function ProductLineManagement({
  visible,
  onClose,
  productLines,
  projects,
  selectedProductLines,
  onRefresh,
  onVisibilityChange
}) {
  // 组件状态
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [newProductLineName, setNewProductLineName] = useState('')

  /**
   * 计算产品线关联的项目数量
   * @param {string} productLineId - 产品线ID
   * @returns {number} 关联的项目数量
   */
  const getRelatedProjectsCount = (productLineId) => {
    return projects.filter(p => p.productLineId === productLineId).length
  }

  /**
   * 处理新建产品线
   */
  const handleCreate = async () => {
    // 验证名称
    if (!newProductLineName || !newProductLineName.trim()) {
      message.warning('请输入产品线名称')
      return
    }

    if (newProductLineName.length > 100) {
      message.warning('产品线名称不能超过100个字符')
      return
    }

    try {
      setLoading(true)
      await createProductLine(newProductLineName.trim())
      message.success('产品线创建成功')
      setNewProductLineName('')
      setIsCreating(false)
      onRefresh()
    } catch (error) {
      message.error(error.message || '创建产品线失败')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 开始编辑产品线
   * @param {Object} productLine - 产品线对象
   */
  const handleEdit = (productLine) => {
    setEditingId(productLine.id)
    setEditingName(productLine.name)
  }

  /**
   * 取消编辑
   */
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  /**
   * 保存编辑
   * @param {string} productLineId - 产品线ID
   */
  const handleSaveEdit = async (productLineId) => {
    // 验证名称
    if (!editingName || !editingName.trim()) {
      message.warning('请输入产品线名称')
      return
    }

    if (editingName.length > 100) {
      message.warning('产品线名称不能超过100个字符')
      return
    }

    try {
      setLoading(true)
      await updateProductLine(productLineId, editingName.trim())
      message.success('产品线更新成功')
      setEditingId(null)
      setEditingName('')
      onRefresh()
    } catch (error) {
      message.error(error.message || '更新产品线失败')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 处理删除产品线
   * @param {Object} productLine - 产品线对象
   */
  const handleDelete = (productLine) => {
    const relatedCount = getRelatedProjectsCount(productLine.id)
    
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: relatedCount > 0 
        ? `产品线"${productLine.name}"有${relatedCount}个关联项目，无法删除。请先删除或迁移这些项目。`
        : `确定要删除产品线"${productLine.name}"吗？`,
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { disabled: relatedCount > 0 },
      onOk: async () => {
        try {
          setLoading(true)
          await deleteProductLine(productLine.id)
          message.success('产品线删除成功')
          onRefresh()
        } catch (error) {
          message.error(error.message || '删除产品线失败')
        } finally {
          setLoading(false)
        }
      }
    })
  }

  /**
   * 处理显示/隐藏切换
   * @param {string} productLineId - 产品线ID
   * @param {boolean} visible - 是否显示
   */
  const handleVisibilityToggle = (productLineId, visible) => {
    let newSelectedIds
    if (visible) {
      // 添加到可见列表
      newSelectedIds = [...selectedProductLines, productLineId]
    } else {
      // 从可见列表移除
      newSelectedIds = selectedProductLines.filter(id => id !== productLineId)
    }
    onVisibilityChange(newSelectedIds)
  }

  /**
   * 表格列定义
   */
  const columns = [
    {
      title: '产品线名称',
      dataIndex: 'name',
      key: 'name',
      width: '30%',
      render: (text, record) => {
        if (editingId === record.id) {
          return (
            <Input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onPressEnter={() => handleSaveEdit(record.id)}
              autoFocus
              maxLength={100}
            />
          )
        }
        return text
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: '25%',
      render: (timestamp) => dayjs(timestamp).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '关联项目数',
      key: 'relatedCount',
      width: '15%',
      align: 'center',
      render: (_, record) => {
        const count = getRelatedProjectsCount(record.id)
        return (
          <span style={{ 
            color: count > 0 ? '#1890ff' : '#8c8c8c',
            fontWeight: count > 0 ? 'bold' : 'normal'
          }}>
            {count}
          </span>
        )
      }
    },
    {
      title: '显示状态',
      key: 'visibility',
      width: '15%',
      align: 'center',
      render: (_, record) => (
        <Switch
          checked={selectedProductLines.includes(record.id)}
          onChange={(checked) => handleVisibilityToggle(record.id, checked)}
          checkedChildren="显示"
          unCheckedChildren="隐藏"
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: '15%',
      align: 'center',
      render: (_, record) => {
        if (editingId === record.id) {
          return (
            <Space size="small">
              <Button 
                type="link" 
                size="small"
                onClick={() => handleSaveEdit(record.id)}
                loading={loading}
              >
                保存
              </Button>
              <Button 
                type="link" 
                size="small"
                onClick={handleCancelEdit}
                disabled={loading}
              >
                取消
              </Button>
            </Space>
          )
        }
        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              disabled={loading}
            >
              编辑
            </Button>
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
              disabled={loading}
            >
              删除
            </Button>
          </Space>
        )
      }
    }
  ]

  return (
    <Drawer
      title="产品线管理"
      placement="right"
      width={800}
      onClose={onClose}
      open={visible}
      destroyOnClose
    >
      {/* 新建产品线区域 */}
      <div style={{ marginBottom: 16 }}>
        {isCreating ? (
          <Space style={{ width: '100%' }}>
            <Input
              placeholder="请输入产品线名称"
              value={newProductLineName}
              onChange={(e) => setNewProductLineName(e.target.value)}
              onPressEnter={handleCreate}
              maxLength={100}
              style={{ width: 300 }}
              autoFocus
            />
            <Button 
              type="primary" 
              onClick={handleCreate}
              loading={loading}
            >
              确定
            </Button>
            <Button 
              onClick={() => {
                setIsCreating(false)
                setNewProductLineName('')
              }}
              disabled={loading}
            >
              取消
            </Button>
          </Space>
        ) : (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreating(true)}
            disabled={loading}
          >
            新建产品线
          </Button>
        )}
      </div>

      {/* 产品线列表表格 */}
      <Table
        columns={columns}
        dataSource={productLines}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`
        }}
        locale={{
          emptyText: '暂无产品线数据'
        }}
      />

      {/* 说明文字 */}
      <div style={{ 
        marginTop: 16, 
        padding: 12, 
        background: '#f0f2f5', 
        borderRadius: 4,
        fontSize: 12,
        color: '#8c8c8c'
      }}>
        <div>💡 提示：</div>
        <div>• 隐藏的产品线不会在时间轴看板中显示，但创建项目时仍可选择</div>
        <div>• 有关联项目的产品线无法删除，请先删除或迁移关联的项目</div>
        <div>• 产品线名称长度限制为100个字符</div>
      </div>
    </Drawer>
  )
}

export default ProductLineManagement
