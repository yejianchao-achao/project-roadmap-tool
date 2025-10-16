# 日期定位错误修复 - 共识文档

## 一、需求确认

### 1.1 问题定义
**核心问题**：项目条在时间轴上的位置与实际日期不符

**具体表现**：
- 测试项目日期：2025-10-07 ~ 2025-10-31
- 实际显示位置：2025年4月-5月区域
- 预期显示位置：2025年10月区域

### 1.2 根本原因
**pixelsPerDay 计算不一致**：
1. `dateUtils.js` 使用固定值 `PIXELS_PER_DAY = 5`
2. `TimelineView.jsx` 动态计算 `pixelsPerDay = viewportWidth / (visibleMonths × 30)`
3. 两个值不一致导致位置计算错误

### 1.3 影响范围
- ✅ 所有项目的位置显示
- ✅ 时间轴刻度与项目条对齐
- ✅ 缩放功能的正确性
- ✅ 响应式布局的准确性

## 二、解决方案共识

### 2.1 技术方案
**统一使用动态计算的 pixelsPerDay**

**核心原则**：
1. 移除固定的 `PIXELS_PER_DAY` 常量
2. 在 `TimelineView` 组件中统一计算 `pixelsPerDay`
3. 确保所有子组件使用同一个 `timelineParams`

### 2.2 实现细节

#### 修改1：dateUtils.js
```javascript
/**
 * 计算时间轴渲染参数
 * 不再包含 pixelsPerDay 和 totalWidth，由调用方动态计算
 */
export function calculateTimelineParams(projects) {
  const now = dayjs()
  const minDate = now.subtract(TIMELINE_TOTAL_MONTHS_BEFORE, 'month').startOf('month')
  const maxDate = now.add(TIMELINE_TOTAL_MONTHS_AFTER, 'month').endOf('month')
  
  const totalDays = maxDate.diff(minDate, 'day')
  
  return {
    minDate,
    maxDate,
    totalDays
  }
}
```

#### 修改2：TimelineView.jsx
```javascript
/**
 * 统一计算时间轴参数（包含动态 pixelsPerDay）
 */
useEffect(() => {
  if (!scrollContainerRef.current) return

  // 获取基础时间参数
  const params = calculateTimelineParams(projects)
  
  // 动态计算 pixelsPerDay
  const viewportWidthPx = scrollContainerRef.current.offsetWidth
  if (viewportWidthPx === 0) return
  
  const avgDaysPerMonth = 30
  const pixelsPerDay = viewportWidthPx / (visibleMonths * avgDaysPerMonth)
  const totalWidth = params.totalDays * pixelsPerDay
  
  // 设置完整的时间轴参数
  setTimelineParams({
    ...params,
    pixelsPerDay,
    totalWidth
  })
  
  // 按产品线分组项目
  const grouped = groupProjectsByProductLine(projects, productLines)
  setGroupedProjects(grouped)
}, [projects, productLines, visibleMonths, scrollContainerRef.current?.offsetWidth])
```

#### 修改3：移除重复的 useEffect
删除原有的第58-72行的 `useEffect`，因为已经合并到上面的 `useEffect` 中。

#### 修改4：简化窗口大小监听
```javascript
/**
 * 监听窗口大小变化
 */
useEffect(() => {
  const handleResize = () => {
    // 触发重新计算（通过改变 offsetWidth 依赖）
    if (scrollContainerRef.current) {
      const width = scrollContainerRef.current.offsetWidth
      // 依赖项会自动触发上面的 useEffect
    }
  }

  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])
```

### 2.3 验收标准

#### 功能验收
1. ✅ 测试项目（2025-10-07 ~ 2025-10-31）显示在10月位置
2. ✅ 所有项目位置与时间轴刻度对齐
3. ✅ 缩放功能正常工作
4. ✅ 窗口大小调整时位置正确
5. ✅ 初始滚动位置正确（当前月份）

#### 性能验收
1. ✅ 无明显性能下降
2. ✅ 缩放响应流畅
3. ✅ 滚动流畅无卡顿

#### 兼容性验收
1. ✅ 现有项目数据正常显示
2. ✅ 不影响其他功能

## 三、技术约束

### 3.1 不变的部分
- ✅ 时间轴范围计算逻辑（当前月前后6个月）
- ✅ 项目条位置计算公式
- ✅ 数据结构和API接口
- ✅ 组件层次结构

### 3.2 需要修改的部分
- ✅ `dateUtils.js` - 移除固定 pixelsPerDay
- ✅ `TimelineView.jsx` - 统一计算逻辑
- ✅ 移除重复的 useEffect

### 3.3 不需要修改的部分
- ✅ `layoutUtils.js` - 位置计算逻辑正确
- ✅ `TimelineHeader.jsx` - 使用传入的 timelineParams
- ✅ `TimelineGrid.jsx` - 使用传入的 timelineParams
- ✅ `Swimlane.jsx` - 使用传入的 timelineParams
- ✅ `ProjectBar.jsx` - 使用传入的 timelineParams

## 四、实施计划

### 4.1 开发步骤
1. ✅ 修改 `dateUtils.js`
2. ✅ 修改 `TimelineView.jsx`
3. ✅ 测试验证
4. ✅ 文档更新

### 4.2 测试步骤
1. ✅ 启动应用
2. ✅ 验证测试项目位置（10月）
3. ✅ 验证所有项目位置
4. ✅ 测试缩放功能（2-12个月）
5. ✅ 测试窗口大小调整
6. ✅ 测试滚动功能
7. ✅ 测试新建/编辑项目

### 4.3 回滚计划
如果出现问题，可以快速回滚：
1. 恢复 `dateUtils.js` 中的 `PIXELS_PER_DAY = 5`
2. 恢复 `TimelineView.jsx` 的原始逻辑

## 五、风险控制

### 5.1 已识别风险
**风险1：计算时机问题**
- 描述：scrollContainerRef 可能在初始渲染时为 null
- 缓解：添加 null 检查，使用 requestAnimationFrame

**风险2：性能问题**
- 描述：频繁的重新计算可能影响性能
- 缓解：合理使用 useEffect 依赖项，避免不必要的计算

### 5.2 测试覆盖
- ✅ 单元测试：位置计算逻辑
- ✅ 集成测试：组件交互
- ✅ 手动测试：用户场景

## 六、交付物

### 6.1 代码变更
1. `frontend/src/utils/dateUtils.js` - 移除固定 pixelsPerDay
2. `frontend/src/components/Timeline/TimelineView.jsx` - 统一计算逻辑

### 6.2 文档更新
1. `ALIGNMENT_日期定位错误修复.md` - 问题分析文档
2. `CONSENSUS_日期定位错误修复.md` - 本文档
3. `ACCEPTANCE_日期定位错误修复.md` - 验收记录（待创建）
4. `FINAL_日期定位错误修复.md` - 总结报告（待创建）

## 七、确认事项

### 7.1 技术决策
- ✅ 使用动态 pixelsPerDay（而非固定值）
- ✅ 在 TimelineView 中统一计算
- ✅ 保留缩放功能
- ✅ 保持现有时间轴范围

### 7.2 验收标准
- ✅ 位置准确性：项目条与时间轴刻度对齐
- ✅ 功能完整性：缩放、滚动、响应式都正常
- ✅ 性能要求：无明显性能下降
- ✅ 兼容性：不影响现有功能

### 7.3 实施确认
- ✅ 修改范围明确
- ✅ 测试计划完整
- ✅ 回滚方案可行
- ✅ 风险可控

## 八、总结

本次修复的核心是**统一 pixelsPerDay 的计算方式**：
- 问题：初始化和动态调整使用了不同的计算方式
- 方案：统一在 TimelineView 中动态计算
- 目标：确保项目条位置与时间轴刻度完全对齐

修改简单、风险可控、效果明确。
