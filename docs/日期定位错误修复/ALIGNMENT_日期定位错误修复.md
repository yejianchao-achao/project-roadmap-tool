# 日期定位错误修复 - 对齐文档

## 一、问题描述

### 1.1 用户反馈
用户创建了一个测试项目：
- 项目名称：测试项目
- 开始时间：2025-10-07
- 结束时间：2025-10-31
- 预期位置：应该显示在2025年10月的时间轴位置

### 1.2 实际表现
项目条显示在了2025年4月到5月的位置，与实际日期不符。

### 1.3 问题截图分析
从截图可以看到：
- 时间轴头部显示：2025年04月 和 2025年05月
- 测试项目（绿色条）显示在这个时间段
- 但项目信息显示：2025-10-07 ~ 2025-10-31

## 二、问题分析

### 2.1 代码审查发现

#### 问题1：pixelsPerDay 被动态覆盖
在 `TimelineView.jsx` 中存在一个严重的逻辑错误：

```javascript
// 第58-72行
useEffect(() => {
  if (!scrollContainerRef.current || !timelineParams) return

  const updateTimelineScale = () => {
    const viewportWidthPx = scrollContainerRef.current.offsetWidth
    if (viewportWidthPx === 0) return

    // 问题：动态计算 pixelsPerDay，覆盖了原始的固定值
    const avgDaysPerMonth = 30
    const pixelsPerDay = viewportWidthPx / (visibleMonths * avgDaysPerMonth)
    
    const totalDays = timelineParams.maxDate.diff(timelineParams.minDate, 'day')
    
    // 更新 timelineParams，导致 pixelsPerDay 不再是固定的 5
    setTimelineParams(prev => ({
      ...prev,
      pixelsPerDay: pixelsPerDay,
      totalWidth: totalDays * pixelsPerDay
    }))
  }

  const timer = setTimeout(updateTimelineScale, 0)
  return () => clearTimeout(timer)
}, [visibleMonths, scrollContainerRef.current?.offsetWidth])
```

**问题分析：**
1. `calculateTimelineParams` 函数使用固定的 `PIXELS_PER_DAY = 5`
2. 但 `TimelineView` 组件会根据视口宽度动态重新计算 `pixelsPerDay`
3. 这导致项目条位置计算使用的 `pixelsPerDay` 与时间轴刻度使用的不一致
4. 当 `pixelsPerDay` 变化时，项目条的位置就会错位

#### 问题2：时间轴范围计算
在 `dateUtils.js` 中：

```javascript
export function calculateTimelineParams(projects) {
  const now = dayjs()
  const minDate = now.subtract(TIMELINE_TOTAL_MONTHS_BEFORE, 'month').startOf('month')
  const maxDate = now.add(TIMELINE_TOTAL_MONTHS_AFTER, 'month').endOf('month')
  // ...
}
```

- 当前时间：2025年10月15日
- minDate：2025年4月1日（当前月-6个月）
- maxDate：2025年10月31日（当前月+5个月）
- 时间轴范围：2025年4月到10月（共7个月）

### 2.2 根本原因

**核心问题：pixelsPerDay 的不一致性**

1. **初始化阶段**：
   - `calculateTimelineParams` 使用 `PIXELS_PER_DAY = 5`
   - 时间轴总宽度 = 总天数 × 5

2. **动态调整阶段**：
   - `TimelineView` 根据视口宽度重新计算 `pixelsPerDay`
   - 例如：视口宽度1200px，显示4个月
   - `pixelsPerDay = 1200 / (4 × 30) = 10`

3. **位置计算错误**：
   - 项目条位置 = (项目开始日期 - minDate) × pixelsPerDay
   - 如果 `pixelsPerDay` 从5变成10，位置会翻倍
   - 10月的项目可能被错误地显示在更靠前的位置

### 2.3 影响范围

- **所有项目的位置都会受影响**
- **时间轴刻度与项目条位置不对齐**
- **缩放功能会导致位置进一步错乱**

## 三、解决方案

### 3.1 方案选择

**方案A：保持固定的 pixelsPerDay**
- 优点：简单直接，位置计算准确
- 缺点：时间轴宽度固定，可能需要大量滚动

**方案B：统一使用动态 pixelsPerDay**
- 优点：自适应视口宽度
- 缺点：需要确保所有计算都使用同一个 pixelsPerDay

**推荐方案：方案B（统一使用动态 pixelsPerDay）**

理由：
1. 更好的用户体验（自适应屏幕宽度）
2. 缩放功能更有意义
3. 只需确保计算一致性即可

### 3.2 技术方案

#### 修改1：移除 dateUtils.js 中的固定 pixelsPerDay
```javascript
export function calculateTimelineParams(projects) {
  const now = dayjs()
  const minDate = now.subtract(TIMELINE_TOTAL_MONTHS_BEFORE, 'month').startOf('month')
  const maxDate = now.add(TIMELINE_TOTAL_MONTHS_AFTER, 'month').endOf('month')
  
  const totalDays = maxDate.diff(minDate, 'day')
  
  return {
    minDate,
    maxDate,
    totalDays,
    // 移除 pixelsPerDay 和 totalWidth，由 TimelineView 动态计算
  }
}
```

#### 修改2：在 TimelineView 中统一计算
```javascript
useEffect(() => {
  if (!scrollContainerRef.current) return

  const params = calculateTimelineParams(projects)
  
  // 动态计算 pixelsPerDay
  const viewportWidthPx = scrollContainerRef.current.offsetWidth
  const avgDaysPerMonth = 30
  const pixelsPerDay = viewportWidthPx / (visibleMonths * avgDaysPerMonth)
  const totalWidth = params.totalDays * pixelsPerDay
  
  setTimelineParams({
    ...params,
    pixelsPerDay,
    totalWidth
  })
}, [projects, productLines, visibleMonths, scrollContainerRef.current?.offsetWidth])
```

#### 修改3：确保所有组件使用同一个 timelineParams
- `TimelineHeader`：使用 `timelineParams.pixelsPerDay`
- `TimelineGrid`：使用 `timelineParams.pixelsPerDay`
- `Swimlane`：使用 `timelineParams.pixelsPerDay`
- `ProjectBar`：使用 `timelineParams.pixelsPerDay`

### 3.3 验收标准

1. **位置准确性**：
   - 测试项目（2025-10-07 ~ 2025-10-31）应该显示在10月的时间轴位置
   - 所有项目的位置都应该与时间轴刻度对齐

2. **缩放功能**：
   - 缩放时项目位置应该保持相对正确
   - 不应该出现位置跳跃

3. **滚动功能**：
   - 初始化时应该滚动到当前月份
   - 滚动时项目位置应该保持稳定

4. **响应式**：
   - 窗口大小改变时，项目位置应该正确调整

## 四、风险评估

### 4.1 技术风险
- **低风险**：修改逻辑清晰，影响范围可控

### 4.2 兼容性风险
- **无风险**：不涉及数据结构变更

### 4.3 性能风险
- **低风险**：计算量没有增加

## 五、实施计划

### 5.1 修改文件清单
1. `frontend/src/utils/dateUtils.js`
2. `frontend/src/components/Timeline/TimelineView.jsx`

### 5.2 测试计划
1. 验证测试项目位置是否正确
2. 验证所有现有项目位置是否正确
3. 测试缩放功能
4. 测试窗口大小调整
5. 测试滚动功能

## 六、疑问与确认

### 6.1 需要确认的问题
1. ✅ 是否保留缩放功能？（是）
2. ✅ 时间轴范围是否需要调整？（暂不调整）
3. ✅ 是否需要支持固定 pixelsPerDay 模式？（否）

### 6.2 待澄清的需求
无

## 七、总结

这是一个典型的**状态不一致**问题：
- 时间轴参数在初始化和动态调整时使用了不同的计算方式
- 导致项目条位置与时间轴刻度不对齐
- 解决方案是统一使用动态计算的 `pixelsPerDay`
