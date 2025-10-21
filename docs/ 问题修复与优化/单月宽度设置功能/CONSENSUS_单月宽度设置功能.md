# CONSENSUS - 单月宽度设置功能需求共识

## 📋 需求确认

**任务名称**：单月宽度设置功能  
**创建时间**：2025-10-21 09:35  
**状态**：✅ 需求已确认

## 🎯 最终需求描述

### 核心功能
在进度看板和人员看板中增加单月宽度调整功能，允许用户自由调整时间轴中单个月份的显示宽度，设置自动保存并在下次打开时恢复。

### 功能详情

#### 1. 宽度调整控件
- **位置**：TimelineSettings 组件中，缩放控制下方
- **控件类型**：Ant Design Slider（滑块）
- **调整方式**：连续滑动调整（最灵活）
- **范围**：100px - 500px
- **默认值**：150px（保持现有显示效果）
- **步长**：1px（连续调整）

#### 2. 实时反馈
- **宽度显示**：滑块旁显示当前宽度值（如"150px"）
- **即时生效**：拖动滑块时实时更新时间轴
- **位置保持**：调整宽度时保持当前日期在视口中的相对位置
- **提示消息**：调整完成后显示"单月宽度已更新"

#### 3. 持久化存储
- **存储方式**：localStorage
- **存储键**：`timeline_month_width`
- **存储格式**：`{ monthWidth: 150 }` (数字，单位像素)
- **读取时机**：App.jsx 初始化时
- **默认处理**：首次使用或读取失败时使用默认值150px

#### 4. 重置功能
- **重置按钮**：滑块下方提供"重置"按钮
- **重置行为**：恢复到默认宽度150px
- **提示消息**：显示"已重置为默认宽度"

## 🔧 技术实现方案

### 架构设计

#### 数据流
```
用户拖动滑块
    ↓
TimelineSettings 触发 onMonthWidthChange
    ↓
App.jsx 更新 monthWidth 状态
    ↓
保存到 localStorage
    ↓
传递给 TimelineView
    ↓
计算 pixelsPerDay = monthWidth / 30
    ↓
更新 totalWidth 和所有子组件
```

#### 核心计算公式
```javascript
// 从单月宽度计算每天像素数
pixelsPerDay = monthWidth / 30

// 计算时间轴总宽度
totalWidth = totalDays * pixelsPerDay

// 示例：
// monthWidth = 150px → pixelsPerDay = 5px/天
// monthWidth = 300px → pixelsPerDay = 10px/天
// monthWidth = 100px → pixelsPerDay = 3.33px/天
```

### 组件修改清单

#### 1. TimelineSettings.jsx（修改）
**新增内容**：
- 接收 `monthWidth` 和 `onMonthWidthChange` props
- 添加单月宽度调整区域
- Slider 组件（100-500px范围）
- 当前宽度值显示
- 重置按钮

**代码结构**：
```jsx
<Card title="时间轴设置">
  {/* 现有内容：时间范围设置 */}
  {/* 现有内容：缩放控制 */}
  
  {/* 新增：单月宽度调整 */}
  <div className="month-width-control">
    <div className="control-label">单月宽度</div>
    <Slider 
      min={100} 
      max={500} 
      value={monthWidth}
      onChange={handleMonthWidthChange}
    />
    <div className="width-display">{monthWidth}px</div>
    <Button onClick={handleReset}>重置</Button>
  </div>
</Card>
```

#### 2. App.jsx（修改）
**新增内容**：
- 添加 `monthWidth` 状态（默认150）
- 从 localStorage 读取初始值
- 提供 `handleMonthWidthChange` 回调
- 保存到 localStorage

**代码结构**：
```jsx
// 状态管理
const [monthWidth, setMonthWidth] = useState(() => {
  const saved = localStorage.getItem('timeline_month_width')
  return saved ? JSON.parse(saved).monthWidth : 150
})

// 处理宽度变化
const handleMonthWidthChange = useCallback((newWidth) => {
  setMonthWidth(newWidth)
  localStorage.setItem('timeline_month_width', JSON.stringify({ monthWidth: newWidth }))
  message.success('单月宽度已更新')
}, [])

// 传递给子组件
<TimelineSettings 
  monthWidth={monthWidth}
  onMonthWidthChange={handleMonthWidthChange}
  // ... 其他props
/>
<TimelineView 
  monthWidth={monthWidth}
  // ... 其他props
/>
```

#### 3. TimelineView.jsx（修改）
**修改内容**：
- 接收 `monthWidth` prop
- 使用 `monthWidth` 计算 `pixelsPerDay`
- 移除硬编码的 `pixelsPerDay = 5`

**关键修改**：
```jsx
// 修改前：
const pixelsPerDay = 5 // 固定值

// 修改后：
const pixelsPerDay = monthWidth / 30 // 动态计算
```

#### 4. storageUtils.js（可选扩展）
**新增工具函数**：
```javascript
/**
 * 获取单月宽度设置
 * @returns {number} 单月宽度（像素）
 */
export const getMonthWidth = () => {
  try {
    const saved = localStorage.getItem('timeline_month_width')
    if (saved) {
      const { monthWidth } = JSON.parse(saved)
      return monthWidth >= 100 && monthWidth <= 500 ? monthWidth : 150
    }
  } catch (error) {
    console.error('读取单月宽度设置失败:', error)
  }
  return 150 // 默认值
}

/**
 * 保存单月宽度设置
 * @param {number} monthWidth - 单月宽度（像素）
 */
export const saveMonthWidth = (monthWidth) => {
  try {
    localStorage.setItem('timeline_month_width', JSON.stringify({ monthWidth }))
  } catch (error) {
    console.error('保存单月宽度设置失败:', error)
  }
}
```

### 样式修改

#### timeline-settings.css（新增样式）
```css
/* 单月宽度控制区域 */
.month-width-control {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.month-width-control .control-label {
  font-weight: 500;
  margin-bottom: 12px;
  color: #262626;
}

.month-width-control .ant-slider {
  margin-bottom: 8px;
}

.month-width-control .width-display {
  text-align: center;
  font-size: 14px;
  color: #1890ff;
  font-weight: 500;
  margin-bottom: 12px;
}

.month-width-control .ant-btn {
  width: 100%;
}
```

## 📝 验收标准

### 功能验收清单
- [ ] 用户可以通过滑块调整单月宽度（100-500px）
- [ ] 滑块旁实时显示当前宽度值
- [ ] 拖动滑块时时间轴立即更新
- [ ] 调整宽度时保持当前查看位置（相对位置）
- [ ] 设置自动保存到 localStorage
- [ ] 页面刷新后设置自动恢复
- [ ] 重置按钮可恢复默认宽度（150px）
- [ ] 进度看板和人员看板都支持此功能
- [ ] 显示成功提示消息

### 技术验收清单
- [ ] 代码包含完整的 JSDoc 注释
- [ ] 使用 useCallback 优化回调函数
- [ ] 使用 useEffect 处理副作用
- [ ] localStorage 读写包含错误处理
- [ ] 宽度值验证（范围检查）
- [ ] 与现有功能无冲突
- [ ] 性能优化（避免不必要的重渲染）

### 用户体验验收清单
- [ ] 滑块拖动流畅，无卡顿
- [ ] 宽度变化过渡自然
- [ ] 提示消息清晰友好
- [ ] 重置操作简单明了
- [ ] 移动端触摸操作正常

## 🔄 边界情况处理

### 异常情况
1. **localStorage 不可用**
   - 降级方案：仅使用内存状态，不持久化
   - 用户提示：不显示错误，静默降级

2. **读取到无效值**
   - 验证范围：100-500px
   - 超出范围：使用默认值150px
   - 格式错误：使用默认值150px

3. **极端宽度值**
   - 最小100px：确保月份标签可读
   - 最大500px：避免过度拉伸
   - 滑块限制：UI层面强制范围

### 兼容性考虑
1. **与现有缩放功能**
   - `visibleMonths`：控制视口月数（不变）
   - `monthWidth`：控制单月宽度（新增）
   - 两者独立工作，互不干扰

2. **与时间范围设置**
   - 时间范围变化时，保持 monthWidth 不变
   - monthWidth 变化时，保持时间范围不变
   - 两个设置完全独立

3. **滚动位置保持**
   - 记录调整前的当前日期
   - 计算该日期在视口中的相对位置
   - 调整后恢复到相同相对位置

## 📊 性能优化

### 优化策略
1. **防抖处理**
   - 滑块拖动时使用防抖
   - 避免频繁触发 localStorage 写入
   - 建议防抖延迟：300ms

2. **useCallback 优化**
   - 所有回调函数使用 useCallback
   - 避免子组件不必要的重渲染

3. **useMemo 优化**
   - pixelsPerDay 计算使用 useMemo
   - 依赖项：monthWidth

## 🎨 UI/UX 细节

### 视觉设计
- **滑块颜色**：使用 Ant Design 主题色（#1890ff）
- **宽度显示**：蓝色加粗字体，突出显示
- **重置按钮**：默认样式，全宽显示
- **分隔线**：顶部添加浅灰色分隔线

### 交互设计
- **拖动反馈**：滑块拖动时显示 tooltip
- **释放行为**：释放滑块后立即应用
- **重置确认**：无需确认，直接重置
- **提示时机**：调整完成后显示 Toast

## 📅 实施计划

### 开发顺序
1. **阶段1**：修改 TimelineView.jsx（接收 monthWidth）
2. **阶段2**：修改 App.jsx（状态管理和持久化）
3. **阶段3**：修改 TimelineSettings.jsx（UI控件）
4. **阶段4**：添加样式（timeline-settings.css）
5. **阶段5**：测试验证（功能+性能+兼容性）

### 测试计划
1. **单元测试**
   - 宽度计算逻辑
   - localStorage 读写
   - 边界值处理

2. **集成测试**
   - 完整交互流程
   - 与现有功能兼容性
   - 页面刷新后恢复

3. **用户测试**
   - 操作流畅性
   - 视觉效果
   - 提示信息

## ✅ 共识确认

### 技术方案确认
- ✅ 使用 Slider 组件（连续调整）
- ✅ 范围 100-500px，默认 150px
- ✅ 通过 monthWidth / 30 计算 pixelsPerDay
- ✅ localStorage 持久化存储
- ✅ 保持当前查看位置（相对位置）

### 功能边界确认
- ✅ 仅支持单月宽度调整
- ✅ 进度看板和人员看板都支持
- ✅ 日历看板不受影响
- ✅ 提供重置功能
- ✅ 实时生效，无需确认

### 验收标准确认
- ✅ 功能验收：9项检查点
- ✅ 技术验收：7项检查点
- ✅ 用户体验验收：5项检查点

## 🚀 下一步行动

1. ✅ 进入 Architect 阶段（架构设计）
2. ⏭️ 进入 Atomize 阶段（任务拆分）
3. ⏭️ 进入 Approve 阶段（人工审批）
4. ⏭️ 进入 Automate 阶段（开发实施）
5. ⏭️ 进入 Assess 阶段（质量评估）

---

**文档状态**：✅ 已完成  
**创建时间**：2025-10-21 09:35  
**最后更新**：2025-10-21 09:35
