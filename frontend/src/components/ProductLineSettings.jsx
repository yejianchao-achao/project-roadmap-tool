import { Card, Tag, Space, Button } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import { STATUS_COLORS, PROJECT_STATUSES } from '../utils/constants'

/**
 * 产品线设置组件
 * 提供产品线管理入口和状态图例显示
 * @param {function} onOpenManagement - 打开产品线管理界面回调
 */
function ProductLineSettings({ onOpenManagement }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      {/* 管理产品线按钮 */}
      <Button 
        type="primary" 
        icon={<SettingOutlined />}
        onClick={onOpenManagement}
        style={{ width: '100%', marginBottom: '16px' }}
      >
        管理产品线
      </Button>

      <Card 
        size="small" 
        title="状态图例"
        style={{ marginBottom: '16px' }}
      >
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
      </Card>
    </div>
  )
}

export default ProductLineSettings
