# 日历看板功能 - 需求共识文档

## 一、最终需求确认

基于用户反馈，最终确认的需求如下：

### 1.1 核心功能

**日历视图展示**：
- 展示月份日历（标准月视图，7列×5-6行）
- 显示当前月的所有日期
- 每个日期格子显示当天上线的项目名称（基于项目endDate）

**月份切换**：
- 提供上一月/下一月切换按钮
- 提供"今天"快捷按钮，快速回到当前月
- 显示当前选中的年月（格式：2025年10月）
- 默认显示当前月份

**项目展示**：
- 根据项目的`endDate`（结束时间）确定显示位置
- 在对应日期下显示项目名称
- 一个日期可能有多个项目上线

### 1.2 用户确认的设计决策

| 决策点 | 最终方案 | 说明 |
|--------|---------|------|
| **视图切换方式** | 在现有的"进度看板/人员看板"切换处增加"日历看板"选项 | 放在人员看板右侧，形成三个Tab |
| **项目显示规则** | 垂直堆叠显示，最多显示5个，超出显示"+N更多" | 保持日历格子大小一致，避免过度拥挤 |
| **项目颜色规则** | 根据项目负责人显示颜色 | 使用现有的负责人颜色系统 |
| **筛选联动** | 响应产品线筛选，不响应看板类型设置 | 日历视图独立于看板类型，始终按负责人着色 |
| **空日期交互** | 仅显示为空白，不支持点击创建 | 简化交互，保持日历视图的纯展示功能 |

## 二、详细功能规格

### 2.1 UI布局设计

```
┌─────────────────────────────────────────────────────────────┐
│ [进度看板] [人员看板] [日历看板] ← 三个Tab切换              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 2025年10月          [<] [今天] [>]                    │ │
│  ├──────┬──────┬──────┬──────┬──────┬──────┬──────┬─────┤ │
│  │ 周日 │ 周一 │ 周二 │ 周三 │ 周四 │ 周五 │ 周六 │     │ │
│  ├──────┼──────┼──────┼──────┼──────┼──────┼──────┼─────┤ │
│  │      │      │  1   │  2   │  3   │  4   │  5   │     │ │
│  │      │      │      │      │      │      │      │     │ │
│  ├──────┼──────┼──────┼──────┼──────┼──────┼──────┼─────┤ │
│  │  6   │  7   │  8   │  9   │ 10   │ 11   │ 12   │     │ │
│  │      │      │      │      │[项目A]│      │      │     │ │
│  │      │      │      │      │[项目B]│      │      │     │ │
│  ├──────┼──────┼──────┼──────┼──────┼──────┼──────┼─────┤ │
│  │ 13   │ 14   │ 15   │ 16   │ 17   │ 18   │ 19   │     │ │
│  │      │      │[项目C]│[项目D]│[项目E]│      │      │     │ │
│  │      │      │[项目F]│[项目G]│[项目H]│      │      │     │ │
│  │      │      │[项目I]│[项目J]│[项目K]│      │      │     │ │
│  │      │      │[项目L]│      │[+2]  │      │      │     │ │
│  ├──────┼──────┼──────┼──────┼──────┼──────┼──────┼─────┤ │
│  │ ...  │      │      │      │      │      │      │     │ │
│  └──────┴──────┴──────┴──────┴──────┴──────┴──────┴─────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 日历单元格设计

**日期格子结构**：
```
┌─────────────────┐
│ 15 (日期数字)   │ ← 右上角显示日期
├─────────────────┤
│ [项目A] 👤张三  │ ← 项目名称 + 负责人图标
│ [项目B] 👤李四  │
│ [项目C] 👤王五  │
│ [项目D] 👤赵六  │
│ [项目E] 👤钱七  │
│ [+3更多]        │ ← 超过5个显示更多
└─────────────────┘
```

**样式规则**：
- 日期数字：右上角，字号14px，灰色
- 今天日期：蓝色背景高亮
- 项目标签：圆角矩形，背景色为负责人颜色，白色文字
- 项目名称：最多显示10个字符，超出显示省略号
- 悬停效果：显示完整项目名称的Tooltip

### 2.3 交互行为

**月份切换**：
- 点击"<"按钮：切换到上一月
- 点击">"按钮：切换到下一月
- 点击"今天"按钮：回到当前月份
- 切换月份时，保持产品线筛选状态

**项目点击**：
- 点击项目标签：打开项目编辑弹窗
- 点击"+N更多"：展开显示所有项目（Popover）

**空日期**：
- 显示为空白格子
- 不支持点击交互

### 2.4 数据筛选规则

**产品线筛选**：
- 日历视图响应左侧产品线设置
- 只显示选中产品线的项目
- 筛选逻辑与时间轴视图一致

**看板类型**：
- 日历视图不响应看板类型切换
- 始终按负责人颜色显示项目
- 看板类型切换不影响日历视图

**项目过滤**：
- 只显示endDate在当前月份的项目
- 按endDate分组项目到对应日期
- 同一日期的项目按创建时间排序

## 三、技术实现方案

### 3.1 组件架构

```
CalendarView.jsx                    # 日历视图主组件
├── CalendarHeader.jsx              # 日历头部（年月 + 切换按钮）
├── CalendarGrid.jsx                # 日历网格容器
│   └── CalendarCell.jsx            # 日历单元格（单个日期）
│       └── ProjectTag.jsx          # 项目标签组件
└── ProjectListPopover.jsx          # 项目列表弹出层（显示更多）
```

**组件职责**：

1. **CalendarView.jsx**
   - 管理当前月份状态
   - 处理月份切换逻辑
   - 计算日历数据（日期数组、项目分组）
   - 应用产品线筛选
   - 传递数据给子组件

2. **CalendarHeader.jsx**
   - 显示年月标题
   - 渲染切换按钮（上一月/今天/下一月）
   - 触发月份切换事件

3. **CalendarGrid.jsx**
   - 渲染7×6的日历网格
   - 使用CSS Grid布局
   - 处理周标题行
   - 遍历渲染CalendarCell

4. **CalendarCell.jsx**
   - 显示日期数字
   - 渲染项目标签列表（最多5个）
   - 处理今天高亮
   - 处理项目点击事件
   - 显示"+N更多"按钮

5. **ProjectTag.jsx**
   - 渲染单个项目标签
   - 显示项目名称和负责人图标
   - 应用负责人颜色
   - 处理点击事件
   - 提供Tooltip

6. **ProjectListPopover.jsx**
   - 弹出层显示所有项目
   - 用于"+N更多"功能
   - 可滚动列表

### 3.2 状态管理

**App.jsx新增状态**：
```javascript
// 视图类型：'timeline' | 'calendar'
const [viewType, setViewType] = useState('timeline')
```

**CalendarView.jsx内部状态**：
```javascript
// 当前显示的月份（dayjs对象）
const [currentMonth, setCurrentMonth] = useState(dayjs())

// 日历数据（计算后的日期数组和项目分组）
const [calendarData, setCalendarData] = useState(null)
```

### 3.3 核心算法

**1. 日历数据计算**
```javascript
/**
 * 计算日历数据
 * @param {dayjs} month - 当前月份
 * @param {array} projects - 项目列表
 * @param {array} selectedProductLines - 选中的产品线
 * @returns {object} 日历数据
 */
function calculateCalendarData(month, projects, selectedProductLines) {
  // 1. 计算月份的第一天和最后一天
  const firstDay = month.startOf('month')
  const lastDay = month.endOf('month')
  
  // 2. 计算第一周的起始日期（可能是上月末尾）
  const startDate = firstDay.startOf('week')
  
  // 3. 计算最后一周的结束日期（可能是下月开头）
  const endDate = lastDay.endOf('week')
  
  // 4. 生成日期数组（42个格子，6周）
  const dates = []
  let current = startDate
  while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
    dates.push(current)
    current = current.add(1, 'day')
  }
  
  // 5. 筛选项目（产品线筛选 + 月份筛选）
  const filteredProjects = projects.filter(p => {
    // 产品线筛选
    if (!selectedProductLines.includes(p.productLineId)) {
      return false
    }
    // 月份筛选（endDate在当前月）
    const endDate = dayjs(p.endDate)
    return endDate.isSame(month, 'month')
  })
  
  // 6. 按日期分组项目
  const projectsByDate = {}
  filteredProjects.forEach(project => {
    const dateKey = dayjs(project.endDate).format('YYYY-MM-DD')
    if (!projectsByDate[dateKey]) {
      projectsByDate[dateKey] = []
    }
    projectsByDate[dateKey].push(project)
  })
  
  // 7. 对每个日期的项目按创建时间排序
  Object.keys(projectsByDate).forEach(dateKey => {
    projectsByDate[dateKey].sort((a, b) => a.createdAt - b.createdAt)
  })
  
  return {
    dates,           // 日期数组（42个）
    projectsByDate,  // 项目分组 { 'YYYY-MM-DD': [projects] }
    firstDay,        // 月份第一天
    lastDay          // 月份最后一天
  }
}
```

**2. 负责人颜色获取**
```javascript
/**
 * 获取项目的负责人颜色
 * @param {object} project - 项目对象
 * @param {array} owners - 人员列表
 * @returns {string} 颜色值
 */
function getProjectOwnerColor(project, owners) {
  const owner = owners.find(o => o.id === project.ownerId)
  return owner?.color || '#999999' // 默认灰色
}
```

### 3.4 样式设计

**CSS Grid布局**：
```css
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background-color: #e0e0e0;
  border: 1px solid #e0e0e0;
}

.calendar-cell {
  background-color: white;
  min-height: 100px;
  padding: 8px;
  position: relative;
  overflow: hidden;
}

.calendar-cell.today {
  background-color: #e6f7ff;
}

.calendar-cell-date {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 14px;
  color: #999;
  font-weight: 500;
}

.calendar-cell.today .calendar-cell-date {
  color: #1890ff;
  font-weight: bold;
}

.calendar-cell-projects {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.project-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: white;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: opacity 0.2s;
}

.project-tag:hover {
  opacity: 0.8;
}

.more-projects {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #1890ff;
  background-color: #f0f0f0;
  cursor: pointer;
  text-align: center;
}
```

### 3.5 集成方案

**修改App.jsx**：
```javascript
// 1. 新增viewType状态
const [viewType, setViewType] = useState('timeline')

// 2. 修改Segmented组件
<Segmented
  value={viewType}
  onChange={setViewType}
  options={[
    { label: '进度看板', value: 'timeline-status' },
    { label: '人员看板', value: 'timeline-owner' },
    { label: '日历看板', value: 'calendar' }
  ]}
/>

// 3. 条件渲染视图
{viewType === 'calendar' ? (
  <CalendarView
    projects={projects}
    productLines={productLines}
    selectedProductLines={selectedProductLines}
    onEditProject={handleEditProject}
    owners={owners}
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
    onBoardTypeChange={(type) => setViewType(type === BOARD_TYPES.STATUS ? 'timeline-status' : 'timeline-owner')}
  />
)}
```

## 四、验收标准

### 4.1 功能验收

- [ ] 日历正确显示当前月份的所有日期
- [ ] 今天日期有蓝色背景高亮
- [ ] 项目按endDate正确显示在对应日期
- [ ] 项目标签使用负责人颜色
- [ ] 一个日期最多显示5个项目，超出显示"+N更多"
- [ ] 点击项目标签可打开编辑弹窗
- [ ] 点击"+N更多"可展开显示所有项目
- [ ] 上一月/下一月按钮正常切换
- [ ] "今天"按钮可回到当前月
- [ ] 响应产品线筛选设置
- [ ] 不响应看板类型切换
- [ ] 月份切换流畅无卡顿

### 4.2 UI验收

- [ ] 日历网格布局整齐，7列对齐
- [ ] 日期数字显示在右上角
- [ ] 项目标签大小一致，间距合理
- [ ] 项目名称过长时正确截断
- [ ] Tooltip正确显示完整项目名称
- [ ] 响应式布局，适配不同屏幕尺寸
- [ ] 与现有UI风格保持一致

### 4.3 性能验收

- [ ] 日历渲染性能良好（<100ms）
- [ ] 月份切换流畅（<50ms）
- [ ] 大量项目时（100+）无明显卡顿
- [ ] 内存占用合理

### 4.4 代码质量验收

- [ ] 所有函数包含完整注释
- [ ] 代码风格与现有项目一致
- [ ] 组件职责清晰，可复用性好
- [ ] 无console.log等调试代码
- [ ] 无ESLint警告

## 五、技术约束

### 5.1 必须遵守

- ✅ 使用React + Ant Design组件库
- ✅ 使用dayjs处理日期计算
- ✅ 复用现有的API和数据模型
- ✅ 复用现有的负责人颜色系统
- ✅ 保持代码风格一致
- ✅ 不破坏现有时间轴功能

### 5.2 禁止事项

- ❌ 不得修改项目数据模型
- ❌ 不得新增后端API
- ❌ 不得引入新的第三方库
- ❌ 不得修改现有组件的核心逻辑

## 六、风险与依赖

### 6.1 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 大量项目导致性能问题 | 中 | 虚拟滚动、分页加载 |
| 日期计算边界情况 | 低 | 充分测试跨月、跨年场景 |
| 颜色冲突 | 低 | 使用现有颜色系统 |

### 6.2 依赖项

- dayjs库（已有）
- Ant Design组件库（已有）
- 现有的owners数据和颜色系统
- 现有的产品线筛选逻辑

## 七、后续优化方向

### 7.1 可选增强功能（本期不实现）

- 周视图/年视图切换
- 项目拖拽调整日期
- 日历导出功能
- 项目统计图表
- 空日期点击创建项目

### 7.2 性能优化（如需要）

- 虚拟滚动优化大量项目
- 懒加载月份数据
- 缓存计算结果

## 八、文档输出

本次任务将产出以下文档：

1. ✅ ALIGNMENT_日历看板功能.md - 需求对齐文档
2. ✅ CONSENSUS_日历看板功能.md - 需求共识文档（本文档）
3. ⏳ DESIGN_日历看板功能.md - 架构设计文档
4. ⏳ TASK_日历看板功能.md - 任务拆分文档
5. ⏳ ACCEPTANCE_日历看板功能.md - 验收文档
6. ⏳ FINAL_日历看板功能.md - 最终报告

---

**文档版本**: v1.0  
**创建时间**: 2025年10月20日  
**最后更新**: 2025年10月20日  
**状态**: ✅ 已确认，等待进入Architect阶段
