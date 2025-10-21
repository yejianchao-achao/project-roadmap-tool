# 阶段1: Align - 对齐阶段

## 任务名称
移除产品线显示设置筛选项

## 原始需求
去掉产品线显示设置筛选项（见附图），因为「管理产品线」功能里已经可以设置产品线的显示与隐藏了

## 项目上下文分析

### 现有项目结构
- **前端框架**: React + Vite + Ant Design
- **后端框架**: Flask + Python
- **数据存储**: JSON文件存储
- **项目类型**: 项目路线图管理工具

### 相关组件分析

#### 1. ProductLineSettings组件 (frontend/src/components/ProductLineSettings.jsx)
**当前功能**:
- 显示"管理产品线"按钮
- 显示"产品线显示设置"筛选区域（包含全选和单选复选框）
- 显示"状态图例"

**问题所在**:
- "产品线显示设置"筛选区域与ProductLineManagement组件的显示/隐藏功能重复
- 用户需要在两个地方管理产品线的显示状态，造成功能冗余

#### 2. ProductLineManagement组件 (frontend/src/components/ProductLineManagement.jsx)
**现有功能**:
- 产品线的增删改查
- **显示状态管理**: 通过Switch组件控制产品线的显示/隐藏
- 关联项目数统计
- 删除保护（有关联项目的产品线无法删除）

**优势**:
- 集中管理所有产品线相关功能
- 提供更完整的产品线信息（创建时间、关联项目数等）
- 显示状态管理更直观（Switch开关）

#### 3. App.jsx中的状态管理
- `selectedProductLines`: 存储当前显示的产品线ID列表
- `handleProductLineSelectionChange`: 处理产品线选择变化并自动保存
- 两个组件都使用相同的状态和回调函数

### 技术约束
- 需要保持现有的状态管理逻辑
- 需要保持与ProductLineManagement组件的集成
- 需要保持"管理产品线"按钮和"状态图例"功能

## 需求理解

### 核心目标
移除ProductLineSettings组件中的"产品线显示设置"筛选区域，保留：
1. "管理产品线"按钮
2. "状态图例"显示

### 移除内容
- "产品线显示设置"标题
- 全选复选框（包含选中数量显示）
- 产品线复选框列表
- "暂无产品线"提示文字

### 保留内容
- "管理产品线"按钮（用于打开ProductLineManagement抽屉）
- "状态图例"（显示项目状态的颜色说明）
- Card容器（仅包含状态图例）

### 功能影响分析
- ✅ 不影响产品线显示/隐藏功能（在ProductLineManagement中管理）
- ✅ 不影响状态管理逻辑（selectedProductLines状态仍然有效）
- ✅ 简化用户界面，避免功能重复
- ✅ 用户体验更清晰：所有产品线管理集中在一个地方

## 边界确认

### 任务范围
- ✅ 修改ProductLineSettings组件，移除产品线筛选功能
- ✅ 保留"管理产品线"按钮和"状态图例"
- ✅ 更新组件props（移除不再需要的props）
- ✅ 更新App.jsx中的组件调用（移除不再需要的props传递）
- ❌ 不修改ProductLineManagement组件
- ❌ 不修改后端API
- ❌ 不修改状态管理逻辑

### 不包含的内容
- 不修改产品线管理功能
- 不修改时间轴显示逻辑
- 不修改数据存储结构

## 疑问澄清

### 已确认的设计决策

1. **组件简化方式**
   - 移除整个"产品线显示设置"区域
   - 保留Card容器，仅包含"状态图例"
   - "管理产品线"按钮保持独立显示

2. **Props清理**
   - 移除`productLines` prop（不再需要显示列表）
   - 移除`selectedProductLines` prop（不再需要显示选中状态）
   - 移除`onSelectionChange` prop（不再需要处理选择变化）
   - 保留`onOpenManagement` prop（打开管理界面）

3. **布局调整**
   - "管理产品线"按钮保持全宽显示
   - Card容器仅包含"状态图例"
   - 整体布局更简洁

### 无需询问的问题
- ✅ 移除方式已明确：完全移除筛选区域
- ✅ 保留内容已明确：按钮和图例
- ✅ 技术实现方案清晰：修改组件代码和props

## 验收标准

### 功能验收
1. ProductLineSettings组件不再显示产品线筛选复选框
2. "管理产品线"按钮正常显示和工作
3. "状态图例"正常显示
4. 产品线显示/隐藏功能在ProductLineManagement中正常工作
5. 时间轴根据ProductLineManagement中的设置正确显示/隐藏产品线

### 界面验收
1. 左侧设置面板布局合理
2. 组件间距适当
3. 无多余的空白区域
4. 视觉效果简洁清晰

### 代码质量
1. 移除未使用的props
2. 移除未使用的状态和函数
3. 代码注释准确反映新功能
4. 无控制台警告或错误

## 技术实现方案

### 修改文件清单
1. `frontend/src/components/ProductLineSettings.jsx` - 移除筛选功能
2. `frontend/src/App.jsx` - 更新组件props传递

### 实现步骤
1. 修改ProductLineSettings组件
   - 移除产品线相关的props
   - 移除产品线筛选相关的状态和函数
   - 简化JSX结构，仅保留按钮和图例
   - 更新组件注释

2. 修改App.jsx
   - 更新ProductLineSettings组件的props传递
   - 移除不再需要的props

3. 测试验证
   - 验证界面显示正确
   - 验证"管理产品线"按钮功能正常
   - 验证产品线显示/隐藏功能在ProductLineManagement中正常工作

## 风险评估
- **风险等级**: 低
- **影响范围**: 仅影响ProductLineSettings组件的显示
- **回滚方案**: 可通过Git回滚到修改前的版本

## 总结
这是一个简单的UI优化任务，通过移除冗余的筛选功能，简化用户界面，提升用户体验。所有产品线管理功能集中在ProductLineManagement组件中，逻辑更清晰，维护更方便。
