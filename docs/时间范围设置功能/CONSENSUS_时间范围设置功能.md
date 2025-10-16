# 需求共识文档 - 时间范围设置功能

## 一、需求确认

### 1.1 核心需求
用户可以手动设置时间轴的总展示范围（minDate ~ maxDate），设置功能放置在左侧产品线筛选器下方。

### 1.2 用户确认的关键决策

#### Q1: 设置按钮位置 ✅
**确认结果**: 将原有的缩放控制与新增的时间范围设置功能都放在左侧「产品线筛选器下方」

**新布局结构**:
```
┌─────────────────┐
│ 筛选设置 Card   │
│ - 产品线筛选    │
│ - 状态图例      │
└─────────────────┘
┌─────────────────┐
│ 时间轴设置 Card │  ← 新增
│ - 时间范围设置  │
│ - 缩放控制      │
└─────────────────┘
```

#### Q2: 时间范围设置后的滚动行为 ✅
**确认结果**: 滚动到新时间范围的起始位置

#### Q3: 快捷选项 ✅
**确认结果**: 需要提供快捷选项

**快捷选项列表**:
- 最近3个月
- 最近半年
- 最近一年
- 自定义（打开日期选择器）

#### Q4: 时间范围与项目数据的关系 ✅
**确认结果**: 时间范围独立于项目数据，用户可以设置任意时间范围

#### Q5: 项目时间范围提示 ✅
**确认结果**: 需要在设置面板中显示当前所有项目的时间范围作为参考

**显示格式**: "项目时间范围: YYYY-MM-DD ~ YYYY-MM-DD"

## 二、最终需求描述

### 2.1 功能概述
在左侧产品线筛选器下方新增「时间轴设置」Card，包含：
1. **时间范围设置**: 通过快捷选项或自定义日期范围设置时间轴展示范围
2. **缩放控制**: 将现有的缩放控制移至此Card内
3. **项目时间范围提示**: 显示当前所有项目的实际时间范围

### 2.2 详细功能规格

#### 功能1: 时间范围快捷选项
- **位置**: 时间轴设置Card顶部
- **选项**:
  - 最近3个月（当前月 ± 1.5个月）
  - 最近半年（当前月 ± 3个月）
  - 最近一年（当前月 ± 6个月）
  - 自定义（打开日期范围选择器）
- **交互**: Radio单选按钮组
- **默认**: 最近一年（对应现有的12个月范围）

#### 功能2: 自定义日期范围
- **触发**: 点击"自定义"选项
- **组件**: Ant Design DatePicker.RangePicker
- **显示**: 在快捷选项下方展开
- **验证**:
  - 开始日期 < 结束日期
  - 最小跨度: 1个月
  - 最大跨度: 5年（超过时显示警告）
- **操作按钮**:
  - "应用": 应用自定义范围
  - "重置": 恢复为"最近一年"

#### 功能3: 项目时间范围提示
- **位置**: 日期选择器上方
- **内容**: "项目时间范围: YYYY-MM-DD ~ YYYY-MM-DD"
- **计算**: 基于所有项目的最早开始日期和最晚结束日期
- **样式**: 灰色小字，提示性文本

#### 功能4: 缩放控制迁移
- **原位置**: 右上角独立区域
- **新位置**: 时间轴设置Card底部
- **保持功能**: 完全保持现有缩放功能不变
- **布局**: 水平排列 [缩小] [X个月] [放大]

#### 功能5: 设置持久化
- **存储方式**: localStorage
- **存储键**: `timeline_settings`
- **数据结构**:
```json
{
  "rangeType": "custom|3months|6months|1year",
  "customRange": {
    "startDate": "2025-01-01",
    "endDate": "2025-12-31"
  },
  "visibleMonths": 4
}
```

#### 功能6: 时间范围应用后的行为
1. 重新计算 `timelineParams`（minDate, maxDate, totalDays, totalWidth）
2. 滚动到新时间范围的起始位置（scrollLeft = 0）
3. 保持当前的产品线筛选状态
4. 保持当前的缩放级别（visibleMonths）

## 三、技术实现方案

### 3.1 组件架构

#### 新增组件: TimelineSettings.jsx
**职责**: 时间轴设置面板
**位置**: `frontend/src/components/TimelineSettings.jsx`
**Props**:
```javascript
{
  projects: Array,              // 项目列表（用于计算项目时间范围）
  onRangeChange: Function,      // 时间范围变化回调
  currentRange: Object,         // 当前时间范围 { minDate, maxDate }
  visibleMonths: Number,        // 当前缩放级别
  onZoomChange: Function        // 缩放变化回调
}
```

#### 修改组件: TimelineView.jsx
**变更**:
1. 移除缩放控制相关代码
2. 接收来自 TimelineSettings 的时间范围参数
3. 实现滚动到起始位置的逻辑

#### 修改组件: App.jsx
**变更**:
1. 在产品线筛选器下方添加 TimelineSettings 组件
2. 管理时间范围状态
3. 传递状态和回调给 TimelineView

### 3.2 状态管理

#### App.jsx 新增状态
```javascript
const [timelineRange, setTimelineRange] = useState({
  type: '1year',  // '3months' | '6months' | '1year' | 'custom'
  customRange: null
})
const [visibleMonths, setVisibleMonths] = useState(4)
```

#### 时间范围计算逻辑
**位置**: `frontend/src/utils/dateUtils.js`
**新增函数**: `calculateCustomTimelineParams(rangeType, customRange)`

```javascript
/**
 * 根据范围类型计算时间轴参数
 * @param {string} rangeType - 范围类型
 * @param {object} customRange - 自定义范围 { startDate, endDate }
 * @returns {object} { minDate, maxDate, totalDays }
 */
export function calculateCustomTimelineParams(rangeType, customRange) {
  const now = dayjs()
  let minDate, maxDate
  
  switch (rangeType) {
    case '3months':
      minDate = now.subtract(1.5, 'month').startOf('month')
      maxDate = now.add(1.5, 'month').endOf('month')
      break
    case '6months':
      minDate = now.subtract(3, 'month').startOf('month')
      maxDate = now.add(3, 'month').endOf('month')
      break
    case '1year':
      minDate = now.subtract(6, 'month').startOf('month')
      maxDate = now.add(5, 'month').endOf('month')
      break
    case 'custom':
      minDate = dayjs(customRange.startDate).startOf('month')
      maxDate = dayjs(customRange.endDate).endOf('month')
      break
    default:
      minDate = now.subtract(6, 'month').startOf('month')
      maxDate = now.add(5, 'month').endOf('month')
  }
  
  const totalDays = maxDate.diff(minDate, 'day')
  
  return { minDate, maxDate, totalDays }
}
```

### 3.3 样式设计

#### TimelineSettings Card 样式
```css
.timeline-settings-card {
  margin-bottom: 16px;
}

.range-options {
  margin-bottom: 12px;
}

.project-range-hint {
  color: #8c8c8c;
  font-size: 12px;
  margin-bottom: 8px;
}

.custom-range-picker {
  margin-bottom: 12px;
}

.range-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.zoom-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}
```

## 四、验收标准

### 4.1 功能验收

#### 基础功能
- [x] 时间轴设置Card显示在产品线筛选器下方
- [x] 快捷选项（3个月、半年、一年）可正常选择
- [x] 选择快捷选项后，时间轴范围正确更新
- [x] 选择"自定义"后，日期选择器正确展开
- [x] 自定义日期范围验证正确（最小1个月，最大5年）
- [x] 点击"应用"后，时间轴更新为自定义范围
- [x] 点击"重置"后，恢复为"最近一年"
- [x] 项目时间范围提示正确显示
- [x] 缩放控制功能正常（从右上角移至Card内）

#### 交互验收
- [x] 时间范围变化后，自动滚动到起始位置
- [x] 设置持久化，刷新页面后保持
- [x] 时间范围变化不影响产品线筛选状态
- [x] 时间范围变化不影响缩放级别
- [x] 超过5年时显示警告提示

#### 边界情况
- [x] 无项目时，项目时间范围提示显示"暂无项目"
- [x] 自定义范围超出项目范围时，正常显示
- [x] 自定义范围小于项目范围时，正常显示

### 4.2 UI验收

#### 布局验收
- [x] 时间轴设置Card与产品线筛选器Card样式一致
- [x] 快捷选项布局清晰，易于选择
- [x] 日期选择器展开/收起动画流畅
- [x] 缩放控制在Card内布局合理
- [x] 响应式布局正常

#### 视觉验证
- [x] 组件间距合理
- [x] 字体大小、颜色符合设计规范
- [x] 按钮状态（正常、悬停、禁用）清晰
- [x] 提示文本颜色、大小合适

### 4.3 性能验收

- [x] 时间范围变化后，渲染流畅（< 100ms）
- [x] 大时间范围（3-5年）下，滚动流畅（60fps）
- [x] localStorage读写无性能问题

### 4.4 兼容性验收

- [x] 与现有产品线筛选功能无冲突
- [x] 与现有项目CRUD功能无冲突
- [x] 与现有缩放功能无冲突
- [x] 浏览器兼容性（Chrome、Safari、Firefox）

## 五、技术约束与风险

### 5.1 技术约束

1. **日期范围限制**
   - 最小跨度: 1个月
   - 最大跨度: 5年（建议值，超过时警告）
   - 开始日期必须 < 结束日期

2. **性能约束**
   - 时间范围超过3年时，可能影响渲染性能
   - 需要优化大范围下的网格线生成

3. **兼容性约束**
   - 保持与现有功能的完全兼容
   - 不修改现有API接口
   - 不影响现有数据结构

### 5.2 潜在风险

1. **性能风险**
   - **风险**: 大时间范围（5年）可能导致渲染卡顿
   - **缓解**: 添加警告提示，建议用户使用合理范围

2. **用户体验风险**
   - **风险**: 缩放控制位置变化可能影响用户习惯
   - **缓解**: 保持缩放控制的视觉样式和交互逻辑不变

3. **数据一致性风险**
   - **风险**: localStorage数据损坏或格式错误
   - **缓解**: 添加数据验证和默认值回退机制

## 六、实施计划

### 6.1 开发阶段
1. 创建 TimelineSettings 组件
2. 实现快捷选项功能
3. 实现自定义日期范围功能
4. 实现项目时间范围提示
5. 迁移缩放控制
6. 实现设置持久化
7. 修改 TimelineView 组件
8. 修改 App 组件布局
9. 样式调整与优化

### 6.2 测试阶段
1. 单元测试（工具函数）
2. 组件测试（TimelineSettings）
3. 集成测试（完整流程）
4. 性能测试（大时间范围）
5. 兼容性测试（浏览器）

### 6.3 文档阶段
1. 更新用户文档
2. 更新开发文档
3. 更新README

## 七、成功标准

### 7.1 功能完整性
- ✅ 所有功能按需求实现
- ✅ 所有验收标准通过
- ✅ 无遗留BUG

### 7.2 代码质量
- ✅ 代码符合项目规范
- ✅ 组件职责清晰
- ✅ 代码可维护性好
- ✅ 注释完整

### 7.3 用户体验
- ✅ 交互流畅自然
- ✅ 视觉效果良好
- ✅ 功能易于理解和使用

### 7.4 性能表现
- ✅ 渲染性能良好
- ✅ 无明显卡顿
- ✅ 内存占用合理

## 八、下一步行动

1. ✅ 需求共识文档已完成
2. ⏳ 进入架构设计阶段（DESIGN文档）
3. ⏳ 进入任务拆分阶段（TASK文档）
4. ⏳ 开始实施开发
