import { useState, useEffect } from 'react'
import { Modal, Form, Input, Select, DatePicker, Checkbox, message, Popconfirm, Button, Space, Badge } from 'antd'
import dayjs from 'dayjs'
import { PROJECT_STATUSES } from '../utils/constants'
import { getProductLines, createProductLine, createProject, updateProject, deleteProject, getOwners, createOwner } from '../services/api'

const { Option } = Select

/**
 * 项目创建/编辑表单组件
 * @param {boolean} visible - 是否显示弹窗
 * @param {function} onClose - 关闭弹窗回调
 * @param {function} onSuccess - 成功后回调
 * @param {object} editingProject - 正在编辑的项目（null表示创建模式）
 * @param {array} productLines - 产品线列表
 */
function ProjectModal({ visible, onClose, onSuccess, editingProject, productLines }) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [isCreatingProductLine, setIsCreatingProductLine] = useState(false)
  const [newProductLineName, setNewProductLineName] = useState('')
  const [localProductLines, setLocalProductLines] = useState([])
  const [owners, setOwners] = useState([])
  const [isCreatingOwner, setIsCreatingOwner] = useState(false)
  const [newOwnerName, setNewOwnerName] = useState('')

  // 是否为编辑模式
  const isEditMode = !!editingProject

  // 初始化产品线列表
  useEffect(() => {
    setLocalProductLines(productLines)
  }, [productLines])

  // 加载人员列表
  useEffect(() => {
    if (visible) {
      loadOwners()
    }
  }, [visible])

  const loadOwners = async () => {
    try {
      const data = await getOwners()
      setOwners(data.owners || [])
    } catch (error) {
      message.error('加载人员列表失败: ' + error.message)
    }
  }

  // 编辑模式时填充表单
  useEffect(() => {
    if (visible && editingProject) {
      form.setFieldsValue({
        name: editingProject.name,
        productLineId: editingProject.productLineId,
        ownerId: editingProject.ownerId,
        startDate: dayjs(editingProject.startDate),
        endDate: dayjs(editingProject.endDate),
        status: editingProject.status,
        isPending: editingProject.isPending || false
      })
    } else if (visible) {
      // 创建模式时重置表单
      form.resetFields()
    }
  }, [visible, editingProject, form])

  /**
   * 处理新建产品线
   */
  const handleCreateProductLine = async () => {
    if (!newProductLineName.trim()) {
      message.warning('请输入产品线名称')
      return
    }

    try {
      setLoading(true)
      const newProductLine = await createProductLine(newProductLineName.trim())
      
      // 更新本地产品线列表
      const updatedProductLines = [...localProductLines, newProductLine]
      setLocalProductLines(updatedProductLines)
      
      // 自动选中新建的产品线
      form.setFieldsValue({ productLineId: newProductLine.id })
      
      // 重置新建状态
      setIsCreatingProductLine(false)
      setNewProductLineName('')
      
      message.success('产品线创建成功')
    } catch (error) {
      message.error('产品线创建失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 取消新建产品线
   */
  const handleCancelCreateProductLine = () => {
    setIsCreatingProductLine(false)
    setNewProductLineName('')
  }

  /**
   * 处理新建人员
   */
  const handleCreateOwner = async () => {
    if (!newOwnerName.trim()) {
      message.warning('请输入人员姓名')
      return
    }

    try {
      setLoading(true)
      const newOwner = await createOwner(newOwnerName.trim())
      
      // 更新本地人员列表
      const updatedOwners = [...owners, newOwner]
      setOwners(updatedOwners)
      
      // 自动选中新建的人员
      form.setFieldsValue({ ownerId: newOwner.id })
      
      // 重置新建状态
      setIsCreatingOwner(false)
      setNewOwnerName('')
      
      message.success('人员创建成功')
    } catch (error) {
      message.error('人员创建失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 取消新建人员
   */
  const handleCancelCreateOwner = () => {
    setIsCreatingOwner(false)
    setNewOwnerName('')
  }

  /**
   * 表单提交处理
   */
  const handleSubmit = async () => {
    try {
      // 验证表单
      const values = await form.validateFields()
      
      setLoading(true)

      // 构建项目数据
      const projectData = {
        name: values.name.trim(),
        productLineId: values.productLineId,
        ownerId: values.ownerId,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD'),
        status: values.status,
        isPending: values.isPending || false
      }

      // 调用API
      if (isEditMode) {
        await updateProject(editingProject.id, projectData)
        message.success('项目更新成功')
      } else {
        await createProject(projectData)
        message.success('项目创建成功')
      }

      // 成功后回调
      onSuccess()
      handleClose()
    } catch (error) {
      if (error.errorFields) {
        // 表单验证错误
        message.warning('请检查表单填写')
      } else {
        // API调用错误
        message.error(`项目${isEditMode ? '更新' : '创建'}失败: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  /**
   * 处理删除项目
   */
  const handleDelete = async () => {
    try {
      setLoading(true)
      await deleteProject(editingProject.id)
      message.success('项目删除成功')
      onSuccess()
      handleClose()
    } catch (error) {
      message.error(`项目删除失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 关闭弹窗
   */
  const handleClose = () => {
    form.resetFields()
    setIsCreatingProductLine(false)
    setNewProductLineName('')
    setIsCreatingOwner(false)
    setNewOwnerName('')
    onClose()
  }

  /**
   * 日期禁用规则 - 结束日期不能早于开始日期
   */
  const disabledEndDate = (current) => {
    const startDate = form.getFieldValue('startDate')
    if (!startDate) {
      return false
    }
    return current && current.isBefore(startDate, 'day')
  }

  /**
   * 日期禁用规则 - 开始日期不能晚于结束日期
   */
  const disabledStartDate = (current) => {
    const endDate = form.getFieldValue('endDate')
    if (!endDate) {
      return false
    }
    return current && current.isAfter(endDate, 'day')
  }

  return (
    <Modal
      title={isEditMode ? '编辑项目' : '新建项目'}
      open={visible}
      onOk={handleSubmit}
      onCancel={handleClose}
      confirmLoading={loading}
      width={600}
      okText="确定"
      cancelText="取消"
        destroyOnHidden
      footer={[
        isEditMode && (
          <Popconfirm
            key="delete"
            title="确认删除"
            description="确定要删除这个项目吗？此操作不可恢复。"
            onConfirm={handleDelete}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button danger loading={loading} style={{ float: 'left' }}>
              删除项目
            </Button>
          </Popconfirm>
        ),
        <Button key="cancel" onClick={handleClose}>
          取消
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          确定
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 24 }}
      >
        {/* 项目名称 */}
        <Form.Item
          label="项目名称"
          name="name"
          rules={[
            { required: true, message: '请输入项目名称' },
            { max: 100, message: '项目名称不能超过100个字符' },
            { whitespace: true, message: '项目名称不能为空格' }
          ]}
        >
          <Input 
            placeholder="请输入项目名称" 
            maxLength={100}
            showCount
          />
        </Form.Item>

        {/* 产品线选择 */}
        <Form.Item
          label="产品线"
          name="productLineId"
          rules={[{ required: true, message: '请选择产品线' }]}
        >
          <Select
            placeholder="请选择产品线"
            dropdownRender={(menu) => (
              <>
                {menu}
                <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0' }}>
                  {isCreatingProductLine ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Input
                        placeholder="输入产品线名称"
                        value={newProductLineName}
                        onChange={(e) => setNewProductLineName(e.target.value)}
                        onPressEnter={handleCreateProductLine}
                        maxLength={50}
                        autoFocus
                      />
                      <a onClick={handleCreateProductLine}>确定</a>
                      <a onClick={handleCancelCreateProductLine}>取消</a>
                    </div>
                  ) : (
                    <a onClick={() => setIsCreatingProductLine(true)}>
                      + 新建产品线
                    </a>
                  )}
                </div>
              </>
            )}
          >
            {localProductLines.map((pl) => (
              <Option key={pl.id} value={pl.id}>
                {pl.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* 项目负责人 */}
        <Form.Item
          label="项目负责人"
          name="ownerId"
          rules={[{ required: true, message: '请选择项目负责人' }]}
        >
          <Select
            placeholder="请选择项目负责人"
            dropdownRender={(menu) => (
              <>
                {menu}
                <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0' }}>
                  {isCreatingOwner ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Input
                        placeholder="输入人员姓名"
                        value={newOwnerName}
                        onChange={(e) => setNewOwnerName(e.target.value)}
                        onPressEnter={handleCreateOwner}
                        maxLength={50}
                        autoFocus
                      />
                      <a onClick={handleCreateOwner}>确定</a>
                      <a onClick={handleCancelCreateOwner}>取消</a>
                    </div>
                  ) : (
                    <a onClick={() => setIsCreatingOwner(true)}>
                      + 新建人员
                    </a>
                  )}
                </div>
              </>
            )}
          >
            {owners.map((owner) => (
              <Option key={owner.id} value={owner.id}>
                <Space>
                  <Badge color={owner.color} />
                  {owner.name}
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* 开始日期 */}
        <Form.Item
          label="开始日期"
          name="startDate"
          rules={[{ required: true, message: '请选择开始日期' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            placeholder="选择开始日期"
            format="YYYY-MM-DD"
            disabledDate={disabledStartDate}
            onChange={() => {
              // 当开始日期改变时，触发结束日期的验证
              form.validateFields(['endDate'])
            }}
          />
        </Form.Item>

        {/* 结束日期 */}
        <Form.Item
          label="结束日期"
          name="endDate"
          rules={[
            { required: true, message: '请选择结束日期' },
            {
              validator: (_, value) => {
                const startDate = form.getFieldValue('startDate')
                if (!value || !startDate) {
                  return Promise.resolve()
                }
                if (value.isBefore(startDate, 'day')) {
                  return Promise.reject(new Error('结束日期不能早于开始日期'))
                }
                return Promise.resolve()
              }
            }
          ]}
        >
          <DatePicker
            style={{ width: '100%' }}
            placeholder="选择结束日期"
            format="YYYY-MM-DD"
            disabledDate={disabledEndDate}
          />
        </Form.Item>

        {/* 项目状态 */}
        <Form.Item
          label="项目状态"
          name="status"
          rules={[{ required: true, message: '请选择项目状态' }]}
        >
          <Select placeholder="请选择项目状态">
            {PROJECT_STATUSES.map((status) => (
              <Option key={status} value={status}>
                {status}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* 暂定 */}
        <Form.Item
          label="暂定"
          name="isPending"
          valuePropName="checked"
          tooltip="勾选表示项目计划尚未确定"
        >
          <Checkbox>项目计划暂未确定</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default ProjectModal
