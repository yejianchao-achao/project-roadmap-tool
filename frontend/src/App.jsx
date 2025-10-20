import { useState, useEffect, useCallback } from 'react'
import { Layout, Button, message, Row, Col } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import ProjectModal from './components/ProjectModal'
import TimelineView from './components/Timeline/TimelineView'
import CalendarView from './components/Calendar/CalendarView'
import ProductLineSettings from './components/ProductLineSettings'
import ProductLineManagement from './components/ProductLineManagement'
import TimelineSettings from './components/TimelineSettings'
import OwnerManagement from './components/OwnerManagement'
import { getProjects, getProductLines, getSettings, updateVisibleProductLines, getOwners } from './services/api'
import { loadTimelineSettings, saveTimelineSettings } from './utils/storageUtils'
import { DEFAULT_VISIBLE_MONTHS, BOARD_TYPES } from './utils/constants'
import './styles/calendar.css'

const { Header, Content } = Layout

function App() {
  const [projects, setProjects] = useState([])
  const [productLines, setProductLines] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [selectedProductLines, setSelectedProductLines] = useState([])
  const [managementVisible, setManagementVisible] = useState(false)
  const [ownerManagementVisible, setOwnerManagementVisible] = useState(false)
  const [owners, setOwners] = useState([])
  
  // 视图类型状态（从localStorage读取）
  // 'timeline-status' | 'timeline-owner' | 'calendar'
  const [viewType, setViewType] = useState(() => {
    return localStorage.getItem('viewType') || 'timeline-status'
  })
  
  // 时间轴设置状态
  const [timelineRange, setTimelineRange] = useState(() => {
    const saved = loadTimelineSettings()
    return saved?.timelineRange || { type: '1year', customRange: null }
  })
  
  const [visibleMonths, setVisibleMonths] = useState(() => {
    const saved = loadTimelineSettings()
    return saved?.visibleMonths || DEFAULT_VISIBLE_MONTHS
  })

  useEffect(() => {
    loadData()
  }, [])

  /**
   * 保存viewType到localStorage
   */
  useEffect(() => {
    localStorage.setItem('viewType', viewType)
  }, [viewType])

  /**
   * 加载项目、产品线和设置数据
   */
  const loadData = async () => {
    try {
      setLoading(true)
      
      // 并行加载所有数据
      const [projectsData, productLinesData, settingsData, ownersData] = await Promise.all([
        getProjects(),
        getProductLines(),
        getSettings(),
        getOwners()
      ])
      
      setProjects(projectsData)
      setProductLines(productLinesData)
      setOwners(ownersData.owners || [])
      
      // 处理设置数据
      const visibleProductLines = settingsData.visibleProductLines || []
      
      // 如果配置为空（首次使用），默认显示所有产品线
      if (visibleProductLines.length === 0 && productLinesData.length > 0) {
        const allIds = productLinesData.map(pl => pl.id)
        setSelectedProductLines(allIds)
        // 保存默认配置
        await updateVisibleProductLines(allIds).catch(err => {
          console.error('保存默认配置失败:', err)
        })
      } else {
        setSelectedProductLines(visibleProductLines)
      }
      
      message.success('数据加载成功')
    } catch (error) {
      message.error('数据加载失败: ' + error.message)
      // 降级方案：显示所有产品线
      if (productLines.length > 0) {
        const allIds = productLines.map(pl => pl.id)
        setSelectedProductLines(allIds)
      }
    } finally {
      setLoading(false)
    }
  }

  /**
   * 打开新建项目弹窗
   */
  const handleCreateProject = () => {
    setEditingProject(null)
    setModalVisible(true)
  }

  /**
   * 打开编辑项目弹窗
   */
  const handleEditProject = (project) => {
    setEditingProject(project)
    setModalVisible(true)
  }

  /**
   * 关闭弹窗
   */
  const handleCloseModal = () => {
    setModalVisible(false)
    setEditingProject(null)
  }

  /**
   * 项目创建/编辑成功后的回调
   */
  const handleModalSuccess = () => {
    loadData()
  }

  /**
   * 打开产品线管理界面
   */
  const handleOpenManagement = () => {
    setManagementVisible(true)
  }

  /**
   * 关闭产品线管理界面
   */
  const handleCloseManagement = () => {
    setManagementVisible(false)
  }

  /**
   * 产品线管理界面刷新数据
   */
  const handleManagementRefresh = () => {
    loadData()
  }

  /**
   * 打开人员管理界面
   */
  const handleOpenOwnerManagement = () => {
    setOwnerManagementVisible(true)
  }

  /**
   * 关闭人员管理界面
   */
  const handleCloseOwnerManagement = () => {
    setOwnerManagementVisible(false)
  }

  /**
   * 人员管理界面刷新数据
   */
  const handleOwnerManagementRefresh = () => {
    loadData()
  }

  /**
   * 处理产品线选择变化
   * 自动保存配置
   */
  const handleProductLineSelectionChange = async (selectedIds) => {
    // 立即更新UI
    setSelectedProductLines(selectedIds)
    
    // 异步保存配置
    try {
      await updateVisibleProductLines(selectedIds)
      // 静默保存，不显示成功提示
    } catch (error) {
      message.error('保存设置失败: ' + error.message)
    }
  }

  /**
   * 处理时间范围变化
   */
  const handleRangeChange = useCallback((newRange) => {
    setTimelineRange(newRange)
    // 保存到localStorage
    saveTimelineSettings({ timelineRange: newRange, visibleMonths })
  }, [visibleMonths])

  /**
   * 处理缩放变化
   */
  const handleZoomChange = useCallback((newVisibleMonths) => {
    setVisibleMonths(newVisibleMonths)
    // 保存到localStorage
    saveTimelineSettings({ timelineRange, visibleMonths: newVisibleMonths })
  }, [timelineRange])

  /**
   * 处理视图类型变化
   * 统一处理时间轴看板和日历看板的切换
   */
  const handleViewTypeChange = useCallback((newViewType) => {
    setViewType(newViewType)
  }, [])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
          项目路线图工具
        </h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleCreateProject}
        >
          新建项目
        </Button>
      </Header>
      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <Row gutter={16}>
          {/* 左侧设置面板 */}
          <Col xs={24} sm={24} md={6} lg={5} xl={4}>
            <ProductLineSettings
              onOpenManagement={handleOpenManagement}
              onOpenOwnerManagement={handleOpenOwnerManagement}
              boardType={viewType === 'timeline-status' ? BOARD_TYPES.STATUS : BOARD_TYPES.OWNER}
              owners={owners}
            />
            
            {/* 时间轴设置 */}
            <TimelineSettings
              projects={projects}
              currentRange={timelineRange}
              onRangeChange={handleRangeChange}
              visibleMonths={visibleMonths}
              onZoomChange={handleZoomChange}
            />
          </Col>

          {/* 右侧内容区域 */}
          <Col xs={24} sm={24} md={18} lg={19} xl={20}>
            <div style={{ 
              background: '#fff', 
              padding: '24px', 
              borderRadius: '8px',
              minHeight: '600px',
              height: 'calc(100vh - 120px)'
            }}>
              {/* 条件渲染：日历视图或时间轴视图 */}
              {viewType === 'calendar' ? (
                <CalendarView
                  projects={projects}
                  productLines={productLines}
                  selectedProductLines={selectedProductLines}
                  onEditProject={handleEditProject}
                  owners={owners}
                  onViewTypeChange={handleViewTypeChange}
                />
              ) : (
                <TimelineView
                  projects={projects}
                  productLines={productLines}
                  selectedProductLines={selectedProductLines}
                  onEditProject={handleEditProject}
                  customTimelineRange={timelineRange}
                  visibleMonths={visibleMonths}
                  owners={owners}
                  boardType={viewType === 'timeline-status' ? BOARD_TYPES.STATUS : BOARD_TYPES.OWNER}
                  onBoardTypeChange={handleViewTypeChange}
                />
              )}
            </div>
          </Col>
        </Row>
      </Content>
      
      {/* 项目创建/编辑弹窗 */}
      <ProjectModal
        visible={modalVisible}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        editingProject={editingProject}
        productLines={productLines}
      />

      {/* 产品线管理抽屉 */}
      <ProductLineManagement
        visible={managementVisible}
        onClose={handleCloseManagement}
        productLines={productLines}
        projects={projects}
        selectedProductLines={selectedProductLines}
        onRefresh={handleManagementRefresh}
        onVisibilityChange={handleProductLineSelectionChange}
      />

      {/* 人员管理抽屉 */}
      <OwnerManagement
        visible={ownerManagementVisible}
        onClose={handleCloseOwnerManagement}
        onRefresh={handleOwnerManagementRefresh}
      />
    </Layout>
  )
}

export default App
