import { useState, useEffect } from 'react'
import { Drawer, Table, Input, Button, Space, Badge, Tooltip, message, Popconfirm } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { getOwners, createOwner, deleteOwner } from '../services/api'

/**
 * 人员管理组件（侧边弹窗形式）
 * 用于管理项目负责人列表
 * 
 * @param {boolean} visible - 抽屉是否可见
 * @param {function} onClose - 关闭回调
 * @param {function} onRefresh - 刷新数据回调
 */
function OwnerManagement({ visible, onClose, onRefresh }) {
  const [owners, setOwners] = useState([])
  const [loading, setLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newOwnerName, setNewOwnerName] = useState('')

  /**
   * 加载人员列表
   */
  const loadOwners = async () => {
    try {
      setLoading(true)
      const data = await getOwners()
      setOwners(data.owners || [])
    } catch (error) {
      message.error('加载人员列表失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 当抽屉打开时加载数据
   */
  useEffect(() => {
    if (visible) {
      loadOwners()
    }
  }, [visible])

  /**
   * 创建新人员
   */
  const handleCreate = async () => {
    const name = newOwnerName.trim()
    
    if (!name) {
      message.warning('请输入人员姓名')
      return
    }

    if (name.length > 50) {
      message.warning('人员姓名不能超过50个字符')
      return
    }

    try {
      setLoading(true)
      await createOwner(name)
      message.success('人员创建成功')
      setNewOwnerName('')
      setIsCreating(false)
      loadOwners()
      // 通知父组件刷新数据
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      message.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 删除人员
   */
  const handleDelete = async (ownerId, ownerName) => {
    try {
      setLoading(true)
      await deleteOwner(ownerId)
      message.success(`人员 "${ownerName}" 删除成功`)
      loadOwners()
      // 通知父组件刷新数据
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      message.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 检查人员是否可以删除
   */
  const canDelete = (owner) => {
    // 默认人员不可删除
    if (owner.id === 'owner-default') {
      return false
    }
    // 有关联项目的不可删除
    return owner.projectCount === 0
  }

  /**
   * 获取删除按钮的提示文本
   */
  const getDeleteTooltip = (owner) => {
    if (owner.id === 'owner-default') {
      return '默认人员不可删除'
    }
    if (owner.projectCount > 0) {
      return `该人员有 ${owner.projectCount} 个关联项目，无法删除`
    }
    return '删除人员'
  }

  /**
   * 表格列定义
   */
  const columns = [
    {
      title: '颜色',
      key: 'color',
      width: 60,
      align: 'center',
      render: (_, record) => (
        <Badge 
          color={record.color} 
          style={{ 
            width: 16, 
            height: 16,
            borderRadius: '50%',
            display: 'inline-block'
          }} 
        />
      )
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: '35%',
      render: (text, record) => (
        <Space>
          <span>{text}</span>
          {record.id === 'owner-default' && (
            <span style={{ color: '#999', fontSize: '12px' }}>(默认)</span>
          )}
        </Space>
      )
    },
    {
      title: '关联项目数',
      key: 'projectCount',
      width: '30%',
      align: 'center',
      render: (_, record) => {
        const count = record.projectCount || 0
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
      title: '操作',
      key: 'action',
      width: '25%',
      align: 'center',
      render: (_, record) => (
        <Tooltip title={getDeleteTooltip(record)}>
          <Popconfirm
            title="确认删除"
            description={`确定要删除人员 "${record.name}" 吗？`}
            onConfirm={() => handleDelete(record.id, record.name)}
            okText="确定"
            cancelText="取消"
            disabled={!canDelete(record)}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              disabled={!canDelete(record)}
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Tooltip>
      )
    }
  ]

  return (
    <Drawer
      title="人员管理"
      placement="right"
      width={600}
      onClose={onClose}
      open={visible}
      destroyOnClose
    >
      {/* 新建人员区域 */}
      <div style={{ marginBottom: 16 }}>
        {isCreating ? (
          <Space style={{ width: '100%' }}>
            <Input
              placeholder="请输入人员姓名"
              value={newOwnerName}
              onChange={(e) => setNewOwnerName(e.target.value)}
              onPressEnter={handleCreate}
              maxLength={50}
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
                setNewOwnerName('')
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
            新建人员
          </Button>
        )}
      </div>

      {/* 人员列表表格 */}
      <Table
        columns={columns}
        dataSource={owners}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 个人员`
        }}
        locale={{
          emptyText: '暂无人员数据'
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
        <div>• 默认人员"未分配"不可删除</div>
        <div>• 有关联项目的人员无法删除，请先修改项目负责人</div>
        <div>• 人员姓名长度限制为50个字符</div>
        <div>• 新建人员会自动分配颜色</div>
      </div>
    </Drawer>
  )
}

export default OwnerManagement
