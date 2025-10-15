import { useState, useEffect } from 'react'
import { Layout, Button, message, Row, Col } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import ProjectModal from './components/ProjectModal'
import TimelineView from './components/Timeline/TimelineView'
import ProductLineSettings from './components/ProductLineSettings'
import { getProjects, getProductLines, getSettings, updateVisibleProductLines } from './services/api'

const { Header, Content } = Layout

function App() {
  const [projects, setProjects] = useState([])
  const [productLines, setProductLines] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [selectedProductLines, setSelectedProductLines] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  /**
   * 加载项目、产品线和设置数据
   */
  const loadData = async () => {
    try {
      setLoading(true)
      
      // 并行加载所有数据
      const [projectsData, productLinesData, settingsData] = await Promise.all([
        getProjects(),
        getProductLines(),
        getSettings()
      ])
      
      setProjects(projectsData)
      setProductLines(productLinesData)
      
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
              productLines={productLines}
              selectedProductLines={selectedProductLines}
              onSelectionChange={handleProductLineSelectionChange}
            />
          </Col>

          {/* 右侧时间轴 */}
          <Col xs={24} sm={24} md={18} lg={19} xl={20}>
            <div style={{ 
              background: '#fff', 
              padding: '24px', 
              borderRadius: '8px',
              minHeight: '600px',
              height: 'calc(100vh - 120px)'
            }}>
              {/* 时间轴视图 */}
              <TimelineView
                projects={projects}
                productLines={productLines}
                selectedProductLines={selectedProductLines}
                onEditProject={handleEditProject}
              />
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
    </Layout>
  )
}

export default App
