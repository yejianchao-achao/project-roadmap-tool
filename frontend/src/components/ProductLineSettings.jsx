import { Card, Tag, Space, Button, Badge } from 'antd'
import { SettingOutlined, TeamOutlined } from '@ant-design/icons'
import { STATUS_COLORS, PROJECT_STATUSES, BOARD_TYPES } from '../utils/constants'

/**
 * 产品线设置组件
 * 提供产品线管理、人员管理入口和图例显示
 * @param {function} onOpenManagement - 打开产品线管理界面回调
 * @param {function} onOpenOwnerManagement - 打开人员管理界面回调
 * @param {string} boardType - 当前看板类型
 * @param {array} owners - 人员列表
 */
function ProductLineSettings({ onOpenManagement, onOpenOwnerManagement, boardType = BOARD_TYPES.STATUS, owners = [] }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      {/* 管理按钮组 */}
      <Space direction="vertical" style={{ width: '100%', marginBottom: '16px' }}>
        <Button 
          type="primary" 
          icon={<SettingOutlined />}
          onClick={onOpenManagement}
          style={{ width: '100%' }}
        >
          管理产品线
        </Button>
        <Button 
          icon={<TeamOutlined />}
          onClick={onOpenOwnerManagement}
          style={{ width: '100%' }}
        >
          管理人员
        </Button>
      </Space>

      {/* 图例卡片 - 根据看板类型显示不同图例 */}
      <Card 
        size="small" 
        title={boardType === BOARD_TYPES.STATUS ? '状态图例' : '人员图例'}
        style={{ marginBottom: '16px' }}
      >
        {boardType === BOARD_TYPES.STATUS ? (
          // 状态图例
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
        ) : (
          // 人员图例
          <Space direction="vertical" style={{ width: '100%' }}>
            {owners.length > 0 ? (
              owners.map(owner => (
                <div key={owner.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Badge 
                    color={owner.color} 
                    style={{ 
                      width: 12, 
                      height: 12,
                      borderRadius: '50%'
                    }} 
                  />
                  <span style={{ fontSize: '12px' }}>{owner.name}</span>
                </div>
              ))
            ) : (
              <span style={{ color: '#999', fontSize: '12px' }}>暂无人员</span>
            )}
          </Space>
        )}
      </Card>
    </div>
  )
}

export default ProductLineSettings
