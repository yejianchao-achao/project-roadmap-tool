import { Checkbox, Card, Tag, Space } from 'antd'
import { STATUS_COLORS, PROJECT_STATUSES } from '../utils/constants'

/**
 * 产品线筛选组件
 * @param {array} productLines - 产品线列表
 * @param {array} selectedProductLines - 选中的产品线ID列表
 * @param {function} onSelectionChange - 选择变化回调
 */
function ProductLineFilter({ productLines, selectedProductLines, onSelectionChange }) {
  /**
   * 处理全选/取消全选
   */
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // 全选
      const allIds = productLines.map(pl => pl.id)
      onSelectionChange(allIds)
    } else {
      // 取消全选
      onSelectionChange([])
    }
  }

  /**
   * 处理单个产品线选择
   */
  const handleProductLineChange = (checkedValues) => {
    onSelectionChange(checkedValues)
  }

  // 是否全选
  const isAllSelected = selectedProductLines.length === productLines.length && productLines.length > 0
  // 是否部分选中
  const isIndeterminate = selectedProductLines.length > 0 && selectedProductLines.length < productLines.length

  return (
    <div style={{ marginBottom: '16px' }}>
      <Card 
        size="small" 
        title="筛选设置"
        style={{ marginBottom: '16px' }}
      >
        {/* 产品线筛选 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ marginBottom: '8px', fontWeight: 500 }}>
            产品线筛选
          </div>
          
          {productLines.length > 0 ? (
            <>
              <Checkbox
                indeterminate={isIndeterminate}
                checked={isAllSelected}
                onChange={handleSelectAll}
                style={{ marginBottom: '8px' }}
              >
                全选 ({selectedProductLines.length}/{productLines.length})
              </Checkbox>
              
              <Checkbox.Group
                value={selectedProductLines}
                onChange={handleProductLineChange}
                style={{ width: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {productLines.map(pl => (
                    <Checkbox key={pl.id} value={pl.id}>
                      {pl.name}
                    </Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
            </>
          ) : (
            <div style={{ color: '#8c8c8c', fontSize: '14px' }}>
              暂无产品线，请先创建项目
            </div>
          )}
        </div>

        {/* 状态图例 */}
        <div>
          <div style={{ marginBottom: '8px', fontWeight: 500 }}>
            状态图例
          </div>
          <Space wrap>
            {PROJECT_STATUSES.map(status => (
              <Tag
                key={status}
                color={STATUS_COLORS[status]}
                style={{
                  borderStyle: status === '暂停' ? 'dashed' : 'solid',
                  borderWidth: '2px'
                }}
              >
                {status}
              </Tag>
            ))}
          </Space>
        </div>
      </Card>
    </div>
  )
}

export default ProductLineFilter
