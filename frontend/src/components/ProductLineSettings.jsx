import { Card, Tag, Space, Button, Badge, Tooltip } from 'antd'
import { SettingOutlined, TeamOutlined, DoubleLeftOutlined, DoubleRightOutlined } from '@ant-design/icons'
import { STATUS_COLORS, PROJECT_STATUSES, BOARD_TYPES } from '../utils/constants'

/**
 * 产品线设置组件
 * 提供产品线管理、人员管理入口和图例显示
 * @param {function} onOpenManagement - 打开产品线管理界面回调
 * @param {function} onOpenOwnerManagement - 打开人员管理界面回调
 * @param {string} boardType - 当前看板类型
 * @param {array} owners - 人员列表
 * @param {boolean} collapsed - 是否收起状态
 * @param {function} onToggleCollapse - 切换展开/收起回调
 */
function ProductLineSettings({ 
  onOpenManagement, 
  onOpenOwnerManagement, 
  boardType = BOARD_TYPES.STATUS, 
  owners = [],
  collapsed = false,
  onToggleCollapse
}) {
  // 收起状态：只显示竖向图例
  if (collapsed) {
    return (
      <div style={{ 
        background: '#fff',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '400px',
        minWidth: '60px',
        width: '100%'
      }}>
        {/* 展开按钮 */}
        <Tooltip title="展开设置" placement="right">
          <Button
            type="text"
            icon={<DoubleRightOutlined />}
            onClick={onToggleCollapse}
            style={{ 
              width: '32px',
              height: '32px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}
          />
        </Tooltip>

        {/* 竖向图例 - 从视图切换tab下方开始 */}
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          alignItems: 'center',
          width: '100%',
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingTop: '92px',
          paddingBottom: '12px'
        }}>
          {boardType === BOARD_TYPES.STATUS ? (
            // 状态图例 - 竖向排列，带文字
            PROJECT_STATUSES.map(status => (
              <div
                key={status}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    backgroundColor: STATUS_COLORS[status],
                    borderRadius: '6px',
                    borderStyle: status === '暂停' ? 'dashed' : 'solid',
                    borderWidth: '2px',
                    borderColor: STATUS_COLORS[status],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                />
                <span style={{
                  fontSize: '10px',
                  color: '#666',
                  fontWeight: '500',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  lineHeight: '1.2',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {status}
                </span>
              </div>
            ))
          ) : (
            // 人员图例 - 竖向排列，带文字
            owners.length > 0 ? (
              owners.map(owner => (
                <div
                  key={owner.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      backgroundColor: owner.color,
                      borderRadius: '50%',
                      border: '2px solid #fff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  />
                  <span style={{
                    fontSize: '10px',
                    color: '#666',
                    fontWeight: '500',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                    lineHeight: '1.2',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {owner.name}
                  </span>
                </div>
              ))
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}>
                <div style={{ 
                  width: '36px',
                  height: '36px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  fontSize: '14px'
                }}>
                  ?
                </div>
                <span style={{
                  fontSize: '11px',
                  color: '#999',
                  textAlign: 'center'
                }}>
                  暂无
                </span>
              </div>
            )
          )}
        </div>
      </div>
    )
  }

  // 展开状态：显示完整内容
  return (
    <div style={{ marginBottom: '16px' }}>
      {/* 收起按钮 */}
      <div style={{ marginBottom: '12px', textAlign: 'right' }}>
        <Tooltip title="收起设置">
          <Button
            type="text"
            icon={<DoubleLeftOutlined />}
            onClick={onToggleCollapse}
            size="small"
          />
        </Tooltip>
      </div>

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
